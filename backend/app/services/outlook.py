"""
Microsoft Graph API client for Outlook email.
Handles fetching messages, parsing, and sync operations.
"""

from __future__ import annotations

from datetime import datetime, timezone
from email.utils import parseaddr
from typing import Any, Dict, List, Optional, Tuple

import httpx
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)

GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"


class OutlookService:
    """Client for the Microsoft Graph API (Outlook mail)."""

    def __init__(self, access_token: str) -> None:
        self._token = access_token
        self._http = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
        )

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._http.aclose()

    # ── List Messages ───────────────────────────────────────────────────

    async def list_messages(
        self,
        max_results: int = 50,
        skip: int = 0,
        filter_query: Optional[str] = None,
        order_by: str = "receivedDateTime desc",
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        List messages from the user's mailbox.

        Args:
            max_results: Number of messages to fetch.
            skip: Number of messages to skip (for pagination).
            filter_query: OData filter query.
            order_by: Sort order.

        Returns:
            Tuple of (list of parsed message dicts, next_link or None).
        """
        params: Dict[str, Any] = {
            "$top": min(max_results, 100),
            "$skip": skip,
            "$orderby": order_by,
            "$select": (
                "id,conversationId,from,toRecipients,subject,bodyPreview,"
                "receivedDateTime,isRead,flag,categories,internetMessageHeaders,body"
            ),
        }
        if filter_query:
            params["$filter"] = filter_query

        response = await self._http.get(
            f"{GRAPH_API_BASE}/me/messages",
            params=params,
        )
        response.raise_for_status()
        data = response.json()

        messages = [self._parse_message(m) for m in data.get("value", [])]
        next_link = data.get("@odata.nextLink")

        logger.debug("outlook_messages_listed", count=len(messages), has_next=bool(next_link))
        return messages, next_link

    # ── Get Full Message ────────────────────────────────────────────────

    async def get_message(self, message_id: str) -> Dict[str, Any]:
        """
        Get a full message by ID.

        Args:
            message_id: The Outlook message ID.

        Returns:
            Parsed message dict.
        """
        response = await self._http.get(
            f"{GRAPH_API_BASE}/me/messages/{message_id}",
            params={
                "$select": (
                    "id,conversationId,from,toRecipients,subject,bodyPreview,"
                    "receivedDateTime,isRead,flag,categories,internetMessageHeaders,body"
                ),
            },
        )
        response.raise_for_status()
        return self._parse_message(response.json())

    # ── Batch Get Messages ──────────────────────────────────────────────

    async def get_messages_batch(
        self, message_ids: List[str]
    ) -> List[Dict[str, Any]]:
        """Get multiple messages sequentially."""
        results: List[Dict[str, Any]] = []
        for msg_id in message_ids:
            try:
                msg = await self.get_message(msg_id)
                results.append(msg)
            except httpx.HTTPStatusError as exc:
                logger.warning(
                    "outlook_message_fetch_failed",
                    message_id=msg_id,
                    status=exc.response.status_code,
                )
                continue
        return results

    # ── Message Parsing ─────────────────────────────────────────────────

    def _parse_message(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Parse a raw Graph API message into a clean dict."""
        # Sender
        from_field = raw.get("from", {}).get("emailAddress", {})
        sender_email = from_field.get("address", "")
        sender_name = from_field.get("name")

        # Recipients
        recipients = []
        for to in raw.get("toRecipients", []):
            addr = to.get("emailAddress", {}).get("address", "")
            if addr:
                recipients.append(addr)

        # Date
        date_str = raw.get("receivedDateTime", "")
        try:
            received_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            received_at = datetime.now(timezone.utc)

        # Body
        body_obj = raw.get("body", {})
        body_content = body_obj.get("content", "")
        content_type = body_obj.get("contentType", "text")
        body_text = body_content if content_type == "text" else ""
        body_html = body_content if content_type == "html" else ""

        # Security headers
        security_headers = {}
        for header in raw.get("internetMessageHeaders", []):
            name = header.get("name", "").lower()
            if name in [
                "authentication-results", "received-spf", "dkim-signature",
                "arc-authentication-results", "return-path",
            ]:
                security_headers[name] = header.get("value", "")

        # Labels / categories
        labels = raw.get("categories", [])
        is_read = raw.get("isRead", False)

        return {
            "message_id": raw["id"],
            "thread_id": raw.get("conversationId", ""),
            "sender": sender_email,
            "sender_name": sender_name,
            "recipients": recipients,
            "subject": raw.get("subject", "(No Subject)"),
            "snippet": raw.get("bodyPreview", ""),
            "body_text": body_text,
            "body_html": body_html,
            "received_at": received_at,
            "is_read": is_read,
            "labels": labels,
            "raw_headers": security_headers,
        }

    # ── Archive / Move ──────────────────────────────────────────────────

    async def archive_message(self, message_id: str) -> bool:
        """
        Move message to Archive folder.

        Returns:
            True if successful.
        """
        try:
            response = await self._http.post(
                f"{GRAPH_API_BASE}/me/messages/{message_id}/move",
                json={"destinationId": "archive"},
            )
            response.raise_for_status()
            logger.info("outlook_message_archived", message_id=message_id)
            return True
        except httpx.HTTPStatusError as exc:
            logger.error(
                "outlook_archive_failed",
                message_id=message_id,
                status=exc.response.status_code,
            )
            return False

    # ── Mark as Read ────────────────────────────────────────────────────

    async def mark_as_read(self, message_id: str) -> bool:
        """Mark a message as read."""
        try:
            response = await self._http.patch(
                f"{GRAPH_API_BASE}/me/messages/{message_id}",
                json={"isRead": True},
            )
            response.raise_for_status()
            return True
        except httpx.HTTPStatusError:
            return False
