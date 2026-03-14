"""
AI Pipeline — LangChain LCEL chains for email processing.
Chain 1: Summarization (3 bullets)
Chain 2: Event Extraction (dates + details)
Uses Google Gemini primary, Ollama fallback, deterministic last-resort.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

import dateparser
import structlog
from pydantic import BaseModel, Field

from app.config import get_settings
from app.models.schemas import EventData, SummaryResult
from app.utils.circuit_breaker import (
    CircuitBreaker,
    ollama_circuit,
    openai_circuit,
    with_llm_retry,
)

logger = structlog.get_logger(__name__)

# Rename the circuit breaker for clarity
gemini_circuit = openai_circuit  # Reuse the same circuit breaker instance


# ── Pydantic Output Models for LLM ─────────────────────────────────────

class LLMSummaryOutput(BaseModel):
    """LLM output for email summarization."""
    bullet1: str = Field(description="First summary bullet point")
    bullet2: str = Field(description="Second summary bullet point")
    bullet3: str = Field(description="Third summary bullet point")


class LLMEventOutput(BaseModel):
    """LLM output for a single extracted event."""
    title: str = Field(description="Event title")
    description: Optional[str] = Field(default=None, description="Event description")
    date_text: str = Field(description="Date/time text extracted from email (e.g. 'next Thursday at 3pm')")
    end_date_text: Optional[str] = Field(default=None, description="End date/time if mentioned")
    location: Optional[str] = Field(default=None, description="Event location if mentioned")
    is_all_day: bool = Field(default=False, description="Whether this is an all-day event")


class LLMEventsOutput(BaseModel):
    """LLM output for event extraction."""
    events: List[LLMEventOutput] = Field(default_factory=list, description="Extracted events")


# ── AI Pipeline ─────────────────────────────────────────────────────────

class AIPipeline:
    """Orchestrates LLM-powered email analysis."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._gemini_llm = None
        self._ollama_llm = None
        self._initialized = False

    def _ensure_initialized(self) -> None:
        """Lazy-initialize LLM chains."""
        if self._initialized:
            return

        try:
            if self._settings.gemini_api_key:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self._gemini_llm = ChatGoogleGenerativeAI(
                    model=self._settings.gemini_model,
                    google_api_key=self._settings.gemini_api_key,
                    temperature=0.3,
                    max_output_tokens=1024,
                )
                logger.info("gemini_llm_initialized", model=self._settings.gemini_model)
            else:
                self._gemini_llm = None
                logger.warning("gemini_api_key_not_set")

            # Ollama fallback
            try:
                from langchain_community.chat_models import ChatOllama
                self._ollama_llm = ChatOllama(
                    base_url=self._settings.ollama_base_url,
                    model=self._settings.ollama_model,
                    temperature=0.3,
                )
                logger.info("ollama_llm_initialized", model=self._settings.ollama_model)
            except Exception:
                self._ollama_llm = None
                logger.info("ollama_not_available")

        except Exception as exc:
            logger.error("llm_initialization_failed", error=str(exc))

        self._initialized = True

    # ── Summarization ───────────────────────────────────────────────────

    async def summarize(self, email_body: str, subject: str = "") -> SummaryResult:
        """
        Summarize an email into exactly 3 bullet points.

        Falls back to Ollama, then to a deterministic summary.
        """
        self._ensure_initialized()

        # Try Gemini first
        if self._gemini_llm and not gemini_circuit.is_open:
            try:
                result = await self._summarize_with_llm(
                    self._gemini_llm, email_body, subject, gemini_circuit
                )
                return result
            except Exception as exc:
                logger.warning("gemini_summarize_failed", error=str(exc))

        # Try Ollama fallback
        if self._ollama_llm and not ollama_circuit.is_open:
            try:
                result = await self._summarize_with_llm(
                    self._ollama_llm, email_body, subject, ollama_circuit
                )
                return result
            except Exception as exc:
                logger.warning("ollama_summarize_failed", error=str(exc))

        # Deterministic fallback
        return self._deterministic_summary(email_body, subject)

    @with_llm_retry(max_attempts=2, min_wait=1.0, max_wait=10.0)
    async def _summarize_with_llm(
        self, llm: object, email_body: str, subject: str, circuit: CircuitBreaker
    ) -> SummaryResult:
        """Run summarization through an LLM with retry and circuit breaker."""
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import PydanticOutputParser

        parser = PydanticOutputParser(pydantic_object=LLMSummaryOutput)

        prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are an email summarization assistant. Summarize the email into "
                "exactly 3 concise bullet points. Each bullet should be 1-2 sentences max. "
                "Focus on: (1) the main purpose/request, (2) key details/deadlines, "
                "(3) any required actions. Handle forwarded emails, threads, and non-English "
                "content gracefully.\n\n{format_instructions}"
            )),
            ("human", "Subject: {subject}\n\nEmail body:\n{body}"),
        ])

        chain = prompt | llm | parser

        try:
            truncated_body = email_body[:4000] if email_body else ""
            result: LLMSummaryOutput = await chain.ainvoke({
                "subject": subject or "(No Subject)",
                "body": truncated_body or "(Empty email body)",
                "format_instructions": parser.get_format_instructions(),
            })
            circuit.record_success()
            return SummaryResult(bullets=[result.bullet1, result.bullet2, result.bullet3])
        except Exception as exc:
            circuit.record_failure()
            raise

    def _deterministic_summary(self, email_body: str, subject: str) -> SummaryResult:
        """Fallback: create a basic summary without LLM."""
        bullets = []
        if subject:
            bullets.append(f"Subject: {subject}")
        if email_body:
            # First 200 chars as bullet 1
            preview = email_body[:200].strip().replace("\n", " ")
            bullets.append(preview)
        else:
            bullets.append("Email body not available")

        # Pad to 3 bullets
        while len(bullets) < 3:
            bullets.append("Summary unavailable — AI service is temporarily down")

        return SummaryResult(bullets=bullets[:3])

    # ── Event Extraction ────────────────────────────────────────────────

    async def extract_events(
        self, email_body: str, subject: str = "", reference_date: Optional[datetime] = None
    ) -> List[EventData]:
        """
        Extract calendar events from an email.

        Falls back to Ollama, then to dateparser-only extraction.
        """
        self._ensure_initialized()
        ref_date = reference_date or datetime.now(timezone.utc)

        # Try Gemini first
        if self._gemini_llm and not gemini_circuit.is_open:
            try:
                result = await self._extract_events_with_llm(
                    self._gemini_llm, email_body, subject, ref_date, gemini_circuit
                )
                return result
            except Exception as exc:
                logger.warning("gemini_extract_events_failed", error=str(exc))

        # Try Ollama fallback
        if self._ollama_llm and not ollama_circuit.is_open:
            try:
                result = await self._extract_events_with_llm(
                    self._ollama_llm, email_body, subject, ref_date, ollama_circuit
                )
                return result
            except Exception as exc:
                logger.warning("ollama_extract_events_failed", error=str(exc))

        # Deterministic fallback: use dateparser only
        return self._deterministic_event_extraction(email_body, subject, ref_date)

    @with_llm_retry(max_attempts=2, min_wait=1.0, max_wait=10.0)
    async def _extract_events_with_llm(
        self,
        llm: object,
        email_body: str,
        subject: str,
        ref_date: datetime,
        circuit: CircuitBreaker,
    ) -> List[EventData]:
        """Extract events using an LLM."""
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import PydanticOutputParser

        parser = PydanticOutputParser(pydantic_object=LLMEventsOutput)

        prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are an event extraction assistant. Extract any calendar events, "
                "deadlines, meetings, or appointments mentioned in the email. "
                "For each event, provide the title, date/time text as written in the email, "
                "location if mentioned, and whether it's an all-day event. "
                "If no events are found, return an empty list. "
                "Today's date is {today} for resolving relative dates.\n\n{format_instructions}"
            )),
            ("human", "Subject: {subject}\n\nEmail body:\n{body}"),
        ])

        chain = prompt | llm | parser

        try:
            truncated_body = email_body[:4000] if email_body else ""
            result: LLMEventsOutput = await chain.ainvoke({
                "subject": subject or "(No Subject)",
                "body": truncated_body or "",
                "today": ref_date.strftime("%Y-%m-%d %H:%M %Z"),
                "format_instructions": parser.get_format_instructions(),
            })
            circuit.record_success()

            # Parse the date texts into actual datetimes
            events: List[EventData] = []
            for ev in result.events:
                parsed_start = dateparser.parse(
                    ev.date_text,
                    settings={
                        "RELATIVE_BASE": ref_date,
                        "PREFER_DATES_FROM": "future",
                    },
                )
                if not parsed_start:
                    continue

                parsed_end = None
                if ev.end_date_text:
                    parsed_end = dateparser.parse(
                        ev.end_date_text,
                        settings={
                            "RELATIVE_BASE": ref_date,
                            "PREFER_DATES_FROM": "future",
                        },
                    )

                events.append(EventData(
                    title=ev.title,
                    description=ev.description,
                    start_datetime=parsed_start.replace(tzinfo=timezone.utc)
                        if parsed_start.tzinfo is None else parsed_start,
                    end_datetime=parsed_end.replace(tzinfo=timezone.utc)
                        if parsed_end and parsed_end.tzinfo is None else parsed_end,
                    location=ev.location,
                    is_all_day=ev.is_all_day,
                ))

            return events

        except Exception as exc:
            circuit.record_failure()
            raise

    def _deterministic_event_extraction(
        self, email_body: str, subject: str, ref_date: datetime
    ) -> List[EventData]:
        """
        Fallback event extraction using dateparser only.
        Looks for date-like patterns in the email body.
        """
        if not email_body:
            return []

        # Simple heuristic: look for lines containing date-like text
        events: List[EventData] = []
        lines = email_body.split("\n")

        for line in lines[:50]:  # Only check first 50 lines
            line = line.strip()
            if len(line) < 10 or len(line) > 200:
                continue

            parsed = dateparser.parse(
                line,
                settings={
                    "RELATIVE_BASE": ref_date,
                    "PREFER_DATES_FROM": "future",
                    "STRICT_PARSING": True,
                },
            )
            if parsed and parsed > ref_date:
                events.append(EventData(
                    title=subject or "Event from email",
                    start_datetime=parsed.replace(tzinfo=timezone.utc)
                        if parsed.tzinfo is None else parsed,
                ))

            if len(events) >= 5:
                break

        return events


# Module-level singleton
_pipeline: Optional[AIPipeline] = None


def get_ai_pipeline() -> AIPipeline:
    """Get or create the singleton AIPipeline."""
    global _pipeline
    if _pipeline is None:
        _pipeline = AIPipeline()
    return _pipeline
