"""
Gmail API client service.
Handles fetching emails, parsing headers, and respecting API quotas.
"""

from __future__ import annotations

import base64
import email
from datetime import datetime, timezone
from email.utils import parseaddr, parsedate_to_datetime
from typing import Any, Dict, List, Optional, Tuple

import httpx
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)

GMAIL_API_BASE = "https://www.googleapis.com/gmail/v1"


class GmailService:
    """Client for the Gmail API."""

    def __init__(self, access_token: str) -> None:
        self._token = access_token
        self._http = httpx.AsyncClient(
            timeout=30.0,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._http.aclose()

    # ── List Messages ───────────────────────────────────────────────────

    async def list_messages(
        self,
        max_results: int = 50,
        page_token: Optional[str] = None,
        query: Optional[str] = None,
        label_ids: Optional[List[str]] = None,
    ) -> Tuple[List[Dict[str, str]], Optional[str]]:
        """
        List message IDs from the user's mailbox.

        Args:
            max_results: Maximum number of messages to return.
            page_token: Token for pagination.
            query: Gmail search query (e.g., 'is:unread').
            label_ids: Filter by label IDs.

        Returns:
            Tuple of (list of {id, threadId} dicts, next_page_token or None).
        """
        params: Dict[str, Any] = {"maxResults": min(max_results, 100)}
        if page_token:
            params["pageToken"] = page_token
        if query:
            params["q"] = query
        if label_ids:
            params["labelIds"] = label_ids

        response = await self._http.get(
            f"{GMAIL_API_BASE}/users/me/messages",
            params=params,
        )
        response.raise_for_status()
        data = response.json()

        messages = data.get("messages", [])
        next_page = data.get("nextPageToken")

        logger.debug("gmail_messages_listed", count=len(messages), has_next=bool(next_page))
        return messages, next_page

    # ── Get Full Message ────────────────────────────────────────────────

    async def get_message(self, message_id: str) -> Dict[str, Any]:
        """
        Get a full message by ID, including headers and body.

        Args:
            message_id: The Gmail message ID.

        Returns:
            Parsed message dict with: message_id, thread_id, sender, sender_name,
            recipients, subject, snippet, body_text, body_html, received_at,
            is_read, labels, raw_headers.
        """
        response = await self._http.get(
            f"{GMAIL_API_BASE}/users/me/messages/{message_id}",
            params={"format": "full"},
        )
        response.raise_for_status()
        raw = response.json()

        return self._parse_message(raw)

    # ── Batch Get Messages ──────────────────────────────────────────────

    async def get_messages_batch(
        self, message_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Get multiple messages. Uses sequential calls (batch API requires different auth).

        Args:
            message_ids: List of Gmail message IDs.

        Returns:
            List of parsed message dicts.
        """
        results: List[Dict[str, Any]] = []
        for msg_id in message_ids:
            try:
                msg = await self.get_message(msg_id)
                results.append(msg)
            except httpx.HTTPStatusError as exc:
                logger.warning("gmail_message_fetch_failed", message_id=msg_id, status=exc.response.status_code)
                continue
        return results

    # ── Message Parsing ─────────────────────────────────────────────────

    def _parse_message(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Parse a raw Gmail API message response into a clean dict."""
        headers = {
            h["name"].lower(): h["value"]
            for h in raw.get("payload", {}).get("headers", [])
        }

        # Parse sender
        sender_raw = headers.get("from", "")
        sender_name, sender_email = parseaddr(sender_raw)

        # Parse recipients
        to_raw = headers.get("to", "")
        recipients = [addr.strip() for addr in to_raw.split(",") if addr.strip()]

        # Parse date
        date_str = headers.get("date", "")
        try:
            received_at = parsedate_to_datetime(date_str)
            if received_at.tzinfo is None:
                received_at = received_at.replace(tzinfo=timezone.utc)
        except (ValueError, TypeError):
            received_at = datetime.now(timezone.utc)

        # Parse body
        body_text, body_html = self._extract_body(raw.get("payload", {}))

        # Parse labels
        label_ids = raw.get("labelIds", [])
        is_read = "UNREAD" not in label_ids

        # Extract security-relevant headers
        security_headers = {}
        for key in ["received-spf", "authentication-results", "dkim-signature",
                     "arc-authentication-results", "return-path", "x-google-dkim-signature"]:
            if key in headers:
                security_headers[key] = headers[key]

        return {
            "message_id": raw["id"],
            "thread_id": raw.get("threadId", ""),
            "sender": sender_email or sender_raw,
            "sender_name": sender_name or None,
            "recipients": recipients,
            "subject": headers.get("subject", "(No Subject)"),
            "snippet": raw.get("snippet", ""),
            "body_text": body_text,
            "body_html": body_html,
            "received_at": received_at,
            "is_read": is_read,
            "labels": label_ids,
            "raw_headers": security_headers,
        }

    def _extract_body(self, payload: Dict[str, Any]) -> Tuple[str, str]:
        """Extract plain text and HTML body from a Gmail payload."""
        body_text = ""
        body_html = ""

        if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
            body_text = self._decode_base64(payload["body"]["data"])
        elif payload.get("mimeType") == "text/html" and payload.get("body", {}).get("data"):
            body_html = self._decode_base64(payload["body"]["data"])

        # Traverse multipart
        for part in payload.get("parts", []):
            mime_type = part.get("mimeType", "")
            data = part.get("body", {}).get("data", "")

            if mime_type == "text/plain" and data and not body_text:
                body_text = self._decode_base64(data)
            elif mime_type == "text/html" and data and not body_html:
                body_html = self._decode_base64(data)
            elif mime_type.startswith("multipart/"):
                # Recurse into nested multipart
                nested_text, nested_html = self._extract_body(part)
                if not body_text and nested_text:
                    body_text = nested_text
                if not body_html and nested_html:
                    body_html = nested_html

        return body_text, body_html

    @staticmethod
    def _decode_base64(data: str) -> str:
        """Decode base64url-encoded Gmail body data."""
        try:
            padded = data + "=" * (4 - len(data) % 4)
            return base64.urlsafe_b64decode(padded).decode("utf-8", errors="replace")
        except Exception:
            return ""

    # ── Archive Message ─────────────────────────────────────────────────

    async def archive_message(self, message_id: str) -> bool:
        """
        Archive a message by removing INBOX label.

        Returns:
            True if successful.
        """
        try:
            response = await self._http.post(
                f"{GMAIL_API_BASE}/users/me/messages/{message_id}/modify",
                json={"removeLabelIds": ["INBOX"]},
            )
            response.raise_for_status()
            logger.info("gmail_message_archived", message_id=message_id)
            return True
        except httpx.HTTPStatusError as exc:
            logger.error("gmail_archive_failed", message_id=message_id, status=exc.response.status_code)
            return False

    # ── Mark as Read ────────────────────────────────────────────────────

    async def mark_as_read(self, message_id: str) -> bool:
        """Mark a message as read by removing UNREAD label."""
        try:
            response = await self._http.post(
                f"{GMAIL_API_BASE}/users/me/messages/{message_id}/modify",
                json={"removeLabelIds": ["UNREAD"]},
            )
            response.raise_for_status()
            return True
        except httpx.HTTPStatusError:
            return False
