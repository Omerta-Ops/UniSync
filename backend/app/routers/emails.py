"""
Email API routes.
Handles email listing, detail, archiving, and SSE streaming.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sse_starlette.sse import EventSourceResponse

from app.config import get_settings
from app.models.schemas import (
    EmailArchiveRequest,
    EmailDetail,
    EmailListResponse,
    EmailSummary,
    MessageResponse,
    ProcessingStatusEnum,
    ProcessingUpdate,
)
from app.utils.rate_limit import limiter

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/emails", tags=["Emails"])


# ── Get Email List ─────────────────────────────────────────────────────

@router.get("", response_model=EmailListResponse)
@limiter.limit("100/minute")
async def list_emails(
    request: Request,
    account_id: Optional[str] = Query(None, description="Filter by linked account"),
    risk_score: Optional[str] = Query(None, description="Filter by risk level: low, medium, high"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    is_archived: Optional[bool] = Query(False, description="Include archived"),
    limit: int = Query(50, ge=1, le=100),
    cursor: Optional[str] = Query(None, description="Cursor for pagination (email ID)"),
) -> EmailListResponse:
    """
    Get paginated email list with cursor-based pagination.
    Returns emails sorted by received_at DESC.
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    settings = get_settings()
    from supabase import create_client
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

    query = supabase.table("emails").select(
        "id, account_id, message_id, sender, sender_name, subject, snippet, "
        "received_at, is_read, is_archived, is_starred, risk_score, "
        "summary_bullets, processing_status"
    ).eq("user_id", user_id).order("received_at", desc=True).limit(limit + 1)

    # Apply filters
    if account_id:
        query = query.eq("account_id", account_id)
    if risk_score:
        query = query.eq("risk_score", risk_score)
    if is_read is not None:
        query = query.eq("is_read", is_read)
    if is_archived is not None:
        query = query.eq("is_archived", is_archived)

    # Cursor-based pagination: fetch emails older than the cursor
    if cursor:
        # Get the received_at of the cursor email
        cursor_resp = supabase.table("emails").select("received_at").eq(
            "id", cursor
        ).single().execute()
        if cursor_resp.data:
            query = query.lt("received_at", cursor_resp.data["received_at"])

    resp = query.execute()
    rows = resp.data or []

    # Determine next cursor
    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = rows[-1]["id"]

    emails = [
        EmailSummary(
            id=r["id"],
            account_id=r["account_id"],
            message_id=r["message_id"],
            sender=r["sender"],
            sender_name=r.get("sender_name"),
            subject=r.get("subject"),
            snippet=r.get("snippet"),
            received_at=r["received_at"],
            is_read=r["is_read"],
            is_archived=r["is_archived"],
            is_starred=r.get("is_starred", False),
            risk_score=r.get("risk_score"),
            summary_bullets=r.get("summary_bullets"),
            processing_status=r["processing_status"],
        )
        for r in rows
    ]

    return EmailListResponse(emails=emails, next_cursor=next_cursor)


# ── Get Email Detail ───────────────────────────────────────────────────

@router.get("/{email_id}", response_model=EmailDetail)
@limiter.limit("100/minute")
async def get_email(request: Request, email_id: str) -> EmailDetail:
    """
    Get full email detail including summary, risk analysis, and suggested events.
    Triggers background processing if the email is still pending.
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    settings = get_settings()
    from supabase import create_client
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

    # Fetch email
    email_resp = supabase.table("emails").select("*").eq(
        "id", email_id
    ).eq("user_id", user_id).single().execute()

    if not email_resp.data:
        raise HTTPException(status_code=404, detail="Email not found")

    email = email_resp.data

    # Trigger processing if pending
    if email["processing_status"] == "pending":
        from app.workers.tasks import process_email
        process_email.delay(email_id)

    # Fetch suggested events
    events_resp = supabase.table("suggested_events").select("*").eq(
        "email_id", email_id
    ).execute()

    # Mark as read if unread
    if not email["is_read"]:
        supabase.table("emails").update({"is_read": True}).eq("id", email_id).execute()

    from app.models.schemas import SuggestedEventResponse

    return EmailDetail(
        id=email["id"],
        account_id=email["account_id"],
        message_id=email["message_id"],
        thread_id=email.get("thread_id"),
        sender=email["sender"],
        sender_name=email.get("sender_name"),
        recipients=email.get("recipients", []),
        subject=email.get("subject"),
        snippet=email.get("snippet"),
        body_text=email.get("body_text"),
        received_at=email["received_at"],
        is_read=True,
        is_archived=email["is_archived"],
        is_starred=email.get("is_starred", False),
        labels=email.get("labels", []),
        risk_score=email.get("risk_score"),
        risk_reasons=email.get("risk_reasons"),
        summary_bullets=email.get("summary_bullets"),
        raw_headers=email.get("raw_headers"),
        processing_status=email["processing_status"],
        processing_error=email.get("processing_error"),
        processed_at=email.get("processed_at"),
        suggested_events=[
            SuggestedEventResponse(**e) for e in (events_resp.data or [])
        ],
        created_at=email["created_at"],
    )


# ── Archive Email ──────────────────────────────────────────────────────

@router.post("/{email_id}/archive", response_model=MessageResponse)
@limiter.limit("100/minute")
async def archive_email(
    request: Request,
    email_id: str,
    body: EmailArchiveRequest = EmailArchiveRequest(),
) -> MessageResponse:
    """
    Archive or unarchive an email.
    Returns immediately for optimistic UI — syncs to provider in background.
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    settings = get_settings()
    from supabase import create_client
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

    # Update locally first (optimistic)
    resp = supabase.table("emails").update({
        "is_archived": body.is_archived,
    }).eq("id", email_id).eq("user_id", user_id).execute()

    if not resp.data:
        raise HTTPException(status_code=404, detail="Email not found")

    # TODO: dispatch background task to sync archive status to provider

    action = "archived" if body.is_archived else "unarchived"
    return MessageResponse(message=f"Email {action} successfully")


# ── SSE Stream ─────────────────────────────────────────────────────────

@router.get("/stream", response_class=EventSourceResponse)
async def stream_processing_updates(request: Request):
    """
    Server-Sent Events endpoint.
    Streams processing status updates for the user's pending emails.
    Frontend subscribes while emails are being analyzed.
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    settings = get_settings()

    async def event_generator():
        """Generate SSE events for email processing updates."""
        from supabase import create_client
        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

        last_check = datetime.now(timezone.utc)

        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                break

            try:
                # Query for recently updated emails
                resp = supabase.table("emails").select(
                    "id, processing_status, processing_error, processed_at"
                ).eq("user_id", user_id).in_(
                    "processing_status", ["processing", "done", "failed"]
                ).gte("updated_at", last_check.isoformat()).execute()

                for email in (resp.data or []):
                    update = ProcessingUpdate(
                        email_id=email["id"],
                        status=email["processing_status"],
                        error=email.get("processing_error"),
                    )
                    yield {
                        "event": "processing_update",
                        "data": update.model_dump_json(),
                    }

                last_check = datetime.now(timezone.utc)
            except Exception as exc:
                logger.warning("sse_query_error", error=str(exc))
                yield {
                    "event": "error",
                    "data": json.dumps({"error": "Stream error"}),
                }

            await asyncio.sleep(2)  # Poll every 2 seconds

    return EventSourceResponse(event_generator())
