"""
Security Analyzer — Phishing detection and email risk scoring.
Layer 1: Deterministic (SPF/DKIM/DMARC header checks)
Layer 2: Probabilistic (LLM tone/urgency analysis via Google Gemini)
Works without LLM — falls back to deterministic-only analysis.
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional

import structlog
from pydantic import BaseModel, Field

from app.config import get_settings
from app.models.schemas import RiskLevelEnum, RiskResult
from app.utils.circuit_breaker import (
    openai_circuit as gemini_circuit,
    ollama_circuit,
    with_llm_retry,
)

logger = structlog.get_logger(__name__)


# ── LLM Output Schema ──────────────────────────────────────────────────

class LLMRiskOutput(BaseModel):
    """LLM output for phishing risk analysis."""
    is_suspicious: bool = Field(description="Whether the email appears suspicious")
    urgency_level: str = Field(description="none, low, medium, or high urgency detected")
    impersonation_detected: bool = Field(description="Whether sender impersonation is detected")
    suspicious_reasons: List[str] = Field(
        default_factory=list,
        description="List of reasons the email is suspicious",
    )


# ── Security Analyzer ──────────────────────────────────────────────────

class SecurityAnalyzer:
    """Analyzes emails for phishing and security risks."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._llm = None
        self._initialized = False

    def _ensure_initialized(self) -> None:
        """Lazy-initialize the LLM for tone analysis."""
        if self._initialized:
            return

        try:
            if self._settings.gemini_api_key:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self._llm = ChatGoogleGenerativeAI(
                    model=self._settings.gemini_model,
                    google_api_key=self._settings.gemini_api_key,
                    temperature=0.1,
                    max_output_tokens=512,
                )
                logger.info("security_gemini_llm_initialized", model=self._settings.gemini_model)
        except Exception as exc:
            logger.warning("security_llm_init_failed", error=str(exc))

        self._initialized = True

    # ── Main Analysis ───────────────────────────────────────────────────

    async def analyze(
        self,
        headers: Dict[str, str],
        body: str,
        sender: str = "",
        subject: str = "",
    ) -> RiskResult:
        """
        Perform full security analysis on an email.

        Args:
            headers: Raw email headers (SPF, DKIM, DMARC, etc.)
            body: Email body text.
            sender: Sender email address.
            subject: Email subject.

        Returns:
            RiskResult with level, reasons, and individual check results.
        """
        # Layer 1: Deterministic checks
        deterministic = self._deterministic_analysis(headers, sender, body)

        # Layer 2: LLM tone analysis (if available)
        llm_reasons: List[str] = []
        try:
            llm_reasons = await self._llm_tone_analysis(body, subject, sender)
        except Exception as exc:
            logger.debug("llm_tone_analysis_unavailable", error=str(exc))

        # Combine results
        all_reasons = deterministic["reasons"] + llm_reasons
        level = self._calculate_risk_level(
            deterministic["spf_pass"],
            deterministic["dkim_pass"],
            deterministic["dmarc_pass"],
            all_reasons,
        )

        result = RiskResult(
            level=level,
            reasons=all_reasons,
            spf_pass=deterministic["spf_pass"],
            dkim_pass=deterministic["dkim_pass"],
            dmarc_pass=deterministic["dmarc_pass"],
        )

        logger.info(
            "security_analysis_complete",
            risk_level=level.value,
            reason_count=len(all_reasons),
        )
        return result

    # ── Deterministic Layer ─────────────────────────────────────────────

    def _deterministic_analysis(
        self,
        headers: Dict[str, str],
        sender: str,
        body: str,
    ) -> Dict:
        """Check SPF/DKIM/DMARC headers and common phishing patterns."""
        reasons: List[str] = []
        spf_pass: Optional[bool] = None
        dkim_pass: Optional[bool] = None
        dmarc_pass: Optional[bool] = None

        # Parse Authentication-Results header
        auth_results = headers.get("authentication-results", "").lower()

        # SPF check
        spf_header = headers.get("received-spf", "").lower()
        if "pass" in spf_header or "spf=pass" in auth_results:
            spf_pass = True
        elif "fail" in spf_header or "spf=fail" in auth_results:
            spf_pass = False
            reasons.append("SPF check failed — sender IP not authorized")
        elif "softfail" in spf_header or "spf=softfail" in auth_results:
            spf_pass = False
            reasons.append("SPF softfail — sender IP questionable")

        # DKIM check
        if "dkim=pass" in auth_results:
            dkim_pass = True
        elif "dkim=fail" in auth_results or "dkim=none" in auth_results:
            dkim_pass = False
            reasons.append("DKIM verification failed — email signature invalid")

        # DMARC check
        if "dmarc=pass" in auth_results:
            dmarc_pass = True
        elif "dmarc=fail" in auth_results or "dmarc=none" in auth_results:
            dmarc_pass = False
            reasons.append("DMARC policy check failed")

        # Sender domain mismatch check
        if sender:
            reply_to = headers.get("reply-to", "")
            return_path = headers.get("return-path", "")
            sender_domain = sender.split("@")[-1] if "@" in sender else ""

            if reply_to and "@" in reply_to:
                reply_domain = reply_to.split("@")[-1].rstrip(">")
                if sender_domain and reply_domain != sender_domain:
                    reasons.append(
                        f"Reply-To domain mismatch: {reply_domain} ≠ {sender_domain}"
                    )

            if return_path and "@" in return_path:
                return_domain = return_path.split("@")[-1].rstrip(">")
                if sender_domain and return_domain != sender_domain:
                    reasons.append(
                        f"Return-Path domain mismatch: {return_domain} ≠ {sender_domain}"
                    )

        # Body pattern checks
        body_lower = body.lower() if body else ""

        # Suspicious URL patterns
        url_pattern = re.compile(r'https?://[^\s<>"]+', re.IGNORECASE)
        urls = url_pattern.findall(body)
        for url in urls:
            url_lower = url.lower()
            # Check for IP-based URLs
            if re.search(r'https?://\d+\.\d+\.\d+\.\d+', url_lower):
                reasons.append(f"Suspicious IP-based URL detected: {url[:80]}")
                break
            # Check for known deceptive patterns
            if any(p in url_lower for p in [
                "bit.ly", "tinyurl", "goo.gl", "t.co",
                "login", "verify", "update-account", "secure-",
            ]):
                if sender_domain and sender_domain not in url_lower:
                    reasons.append(f"Potentially deceptive shortened/login URL: {url[:80]}")
                    break

        # Urgency patterns in body
        urgency_patterns = [
            r'\b(urgent|immediately|right away|act now|limited time)\b',
            r'\b(account.*(suspended|locked|compromised|disabled))\b',
            r'\b(verify.*(identity|account|password))\b',
            r'\b(click here to (confirm|verify|update|unlock))\b',
        ]
        for pattern in urgency_patterns:
            if re.search(pattern, body_lower):
                reasons.append(f"Urgency/pressure language detected in email body")
                break

        return {
            "reasons": reasons,
            "spf_pass": spf_pass,
            "dkim_pass": dkim_pass,
            "dmarc_pass": dmarc_pass,
        }

    # ── LLM Tone Analysis ──────────────────────────────────────────────

    @with_llm_retry(max_attempts=2, min_wait=1.0, max_wait=10.0)
    async def _llm_tone_analysis(
        self, body: str, subject: str, sender: str
    ) -> List[str]:
        """Use Gemini LLM to detect social engineering and impersonation."""
        self._ensure_initialized()

        if not self._llm or gemini_circuit.is_open:
            return []

        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import PydanticOutputParser

        parser = PydanticOutputParser(pydantic_object=LLMRiskOutput)

        prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are a cybersecurity analyst specializing in phishing detection. "
                "Analyze the email for social engineering tactics, impersonation, "
                "urgency manipulation, and threat indicators. Be precise — only flag "
                "genuinely suspicious elements, not normal business communication.\n\n"
                "{format_instructions}"
            )),
            ("human", (
                "From: {sender}\nSubject: {subject}\n\n"
                "Body:\n{body}"
            )),
        ])

        chain = prompt | self._llm | parser

        try:
            truncated_body = body[:3000] if body else ""
            result: LLMRiskOutput = await chain.ainvoke({
                "sender": sender,
                "subject": subject or "(No Subject)",
                "body": truncated_body or "(Empty body)",
                "format_instructions": parser.get_format_instructions(),
            })
            gemini_circuit.record_success()

            reasons: List[str] = []
            if result.is_suspicious:
                reasons.extend(result.suspicious_reasons)
            if result.impersonation_detected:
                reasons.append("AI detected potential sender impersonation")
            if result.urgency_level in ("medium", "high"):
                reasons.append(f"AI detected {result.urgency_level} urgency manipulation")

            return reasons

        except Exception as exc:
            gemini_circuit.record_failure()
            raise

    # ── Risk Level Calculation ──────────────────────────────────────────

    def _calculate_risk_level(
        self,
        spf_pass: Optional[bool],
        dkim_pass: Optional[bool],
        dmarc_pass: Optional[bool],
        reasons: List[str],
    ) -> RiskLevelEnum:
        """Calculate overall risk level from all signals."""
        score = 0

        # Auth failures
        if spf_pass is False:
            score += 3
        if dkim_pass is False:
            score += 3
        if dmarc_pass is False:
            score += 2

        # Each reason adds weight
        score += len(reasons) * 1.5

        if score >= 6:
            return RiskLevelEnum.HIGH
        elif score >= 3:
            return RiskLevelEnum.MEDIUM
        else:
            return RiskLevelEnum.LOW


# Module-level singleton
_analyzer: Optional[SecurityAnalyzer] = None


def get_security_analyzer() -> SecurityAnalyzer:
    """Get or create the singleton SecurityAnalyzer."""
    global _analyzer
    if _analyzer is None:
        _analyzer = SecurityAnalyzer()
    return _analyzer
