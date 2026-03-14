"""
Calendar API routes.
Handles suggested events listing and confirmation to Google Calendar.
"""

from __future__ import annotations

from typing import Optional

import structlog
from fastapi import APIRouter, HTTPException, Query, Request

from app.config import get_settings
from app.models.schemas import (
    CalendarEventListResponse,
    ConfirmEventRequest,
    MessageResponse,
    SuggestedEventResponse,
)
from app.utils.rate_limit import limiter

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("/suggested-events", response_model=CalendarEventListResponse)
@limiter.limit("100/minute")
async def list_suggested_events(
    request: Request,
    confirmed: Optional[bool] = Query(None, description="Filter by confirmation status"),
    limit: int = Query(50, ge=1, le=100),
) -> CalendarEventListResponse:
    """Get suggested calendar events extracted from emails."""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    settings = get_settings()
    from supabase import create_client
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

    query = supabase.table("suggested_events").select("*").eq(
        "user_id", user_id
    ).order("start_datetime", desc=False).limit(limit)

    if confirmed is True:
        query = query.not_.is_("confirmed_at", "null")
    elif confirmed is False:
        query = query.is_("confirmed_at", "null")

    resp = query.execute()

    events = [SuggestedEventResponse(**e) for e in (resp.data or [])]
    return CalendarEventListResponse(events=events)


@router.post("/confirm/{event_id}", response_model=MessageResponse)
@limiter.limit("30/minute")
async def confirm_event(
    request: Request,
    event_id: str,
    body: ConfirmEventRequest = ConfirmEventRequest(),
) -> MessageResponse:
    """
    Confirm a suggested event and sync to Google Calendar.
    Dispatches a background task for the actual Calendar API call.
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    settings = get_settings()
    from supabase import create_client
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

    # Verify the event belongs to this user
    event_resp = supabase.table("suggested_events").select("*").eq(
        "id", event_id
    ).eq("user_id", user_id).single().execute()

    if not event_resp.data:
        raise HTTPException(status_code=404, detail="Event not found")

    event = event_resp.data

    if event.get("gcal_event_id"):
        return MessageResponse(message="Event already synced to Google Calendar")

    # Apply any overrides from the request
    update_data = {}
    if body.title:
        update_data["title"] = body.title
    if body.start_datetime:
        update_data["start_datetime"] = body.start_datetime.isoformat()
    if body.end_datetime:
        update_data["end_datetime"] = body.end_datetime.isoformat()
    if body.location:
        update_data["location"] = body.location

    if update_data:
        supabase.table("suggested_events").update(update_data).eq("id", event_id).execute()

    # Dispatch calendar sync task
    from app.workers.tasks import sync_to_calendar
    sync_to_calendar.delay(event_id)

    logger.info("calendar_confirm_dispatched", event_id=event_id, user_id=user_id)
    return MessageResponse(message="Event confirmation queued. Syncing to Google Calendar...")
