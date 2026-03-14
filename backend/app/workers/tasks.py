"""
Celery tasks for email processing, sync, and calendar operations.
Each task is individually try/except'd — one failure cannot kill others.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

import structlog

from app.workers.celery_app import celery_app

logger = structlog.get_logger(__name__)


def _run_async(coro):
    """Run an async function from a sync Celery task."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_closed():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


# ── Task: Process Single Email ──────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.workers.tasks.process_email",
    max_retries=3,
    default_retry_delay=30,
    rate_limit="50/m",
)
def process_email(self, email_id: str) -> dict:
    """
    Process a single email through the AI pipeline.

    Steps:
    1. Fetch email record from DB
    2. Run security analysis (headers + body → RiskResult)
    3. Run AI summarization (body → 3 bullets)
    4. Run event extraction (body → EventData[])
    5. Update email record with all results
    6. Supabase Realtime auto-pushes the update to subscribed clients

    Each step is individually try/except — one failure doesn't kill others.
    """
    return _run_async(_process_email_async(self, email_id))


async def _process_email_async(task, email_id: str) -> dict:
    """Async implementation of email processing."""
    from supabase import create_client
    from app.config import get_settings
    from app.services.ai_pipeline import get_ai_pipeline
    from app.services.security_analyzer import get_security_analyzer

    settings = get_settings()
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    pipeline = get_ai_pipeline()
    analyzer = get_security_analyzer()

    result = {
        "email_id": email_id,
        "status": "processing",
        "steps_completed": [],
        "errors": [],
    }

    # Mark as processing
    try:
        supabase.table("emails").update({
            "processing_status": "processing",
        }).eq("id", email_id).execute()
    except Exception as exc:
        logger.error("failed_to_mark_processing", email_id=email_id, error=str(exc))
        raise task.retry(exc=exc)

    # Fetch the email record
    try:
        email_resp = supabase.table("emails").select("*").eq("id", email_id).single().execute()
        email_data = email_resp.data
    except Exception as exc:
        logger.error("failed_to_fetch_email", email_id=email_id, error=str(exc))
        supabase.table("emails").update({
            "processing_status": "failed",
            "processing_error": f"Failed to fetch email: {str(exc)}",
        }).eq("id", email_id).execute()
        return {"email_id": email_id, "status": "failed", "error": str(exc)}

    body_text = email_data.get("body_text", "") or ""
    subject = email_data.get("subject", "") or ""
    raw_headers = email_data.get("raw_headers", {}) or {}
    sender = email_data.get("sender", "") or ""
    update_data = {}

    # Step 1: Security Analysis
    try:
        risk_result = await analyzer.analyze(
            headers=raw_headers,
            body=body_text,
            sender=sender,
            subject=subject,
        )
        update_data["risk_score"] = risk_result.level.value
        update_data["risk_reasons"] = [r for r in risk_result.reasons]
        result["steps_completed"].append("security_analysis")
        logger.info("security_analysis_done", email_id=email_id, risk=risk_result.level.value)
    except Exception as exc:
        error_msg = f"Security analysis failed: {str(exc)}"
        result["errors"].append(error_msg)
        logger.warning("security_analysis_failed", email_id=email_id, error=str(exc))

    # Step 2: AI Summarization
    try:
        summary = await pipeline.summarize(body_text, subject)
        update_data["summary_bullets"] = summary.bullets
        result["steps_completed"].append("summarization")
        logger.info("summarization_done", email_id=email_id)
    except Exception as exc:
        error_msg = f"Summarization failed: {str(exc)}"
        result["errors"].append(error_msg)
        logger.warning("summarization_failed", email_id=email_id, error=str(exc))

    # Step 3: Event Extraction
    try:
        events = await pipeline.extract_events(body_text, subject)
        if events:
            for event in events:
                event_record = {
                    "email_id": email_id,
                    "user_id": email_data["user_id"],
                    "title": event.title,
                    "description": event.description,
                    "start_datetime": event.start_datetime.isoformat(),
                    "end_datetime": event.end_datetime.isoformat() if event.end_datetime else None,
                    "location": event.location,
                    "is_all_day": event.is_all_day,
                }
                try:
                    supabase.table("suggested_events").insert(event_record).execute()
                except Exception as insert_exc:
                    logger.warning("event_insert_failed", email_id=email_id, error=str(insert_exc))

            result["events_extracted"] = len(events)
        result["steps_completed"].append("event_extraction")
        logger.info("event_extraction_done", email_id=email_id, count=len(events))
    except Exception as exc:
        error_msg = f"Event extraction failed: {str(exc)}"
        result["errors"].append(error_msg)
        logger.warning("event_extraction_failed", email_id=email_id, error=str(exc))

    # Update the email record
    update_data["processing_status"] = "done" if not result["errors"] else "done"
    update_data["processed_at"] = datetime.now(timezone.utc).isoformat()
    if result["errors"]:
        update_data["processing_error"] = "; ".join(result["errors"])

    try:
        supabase.table("emails").update(update_data).eq("id", email_id).execute()
        result["status"] = "done"
    except Exception as exc:
        logger.error("failed_to_update_email", email_id=email_id, error=str(exc))
        result["status"] = "failed"
        result["errors"].append(f"DB update failed: {str(exc)}")

    logger.info(
        "email_processing_complete",
        email_id=email_id,
        steps=result["steps_completed"],
        errors=result["errors"],
    )
    return result


# ── Task: Bulk Sync Account ────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.workers.tasks.bulk_sync_account",
    max_retries=2,
    default_retry_delay=60,
    rate_limit="10/m",
)
def bulk_sync_account(self, account_id: str) -> dict:
    """
    Sync emails from a linked account.

    1. Fetches the latest N emails from the provider
    2. Deduplicates against existing message_id values
    3. Inserts new emails into the database
    4. Dispatches individual process_email tasks for new emails
    """
    return _run_async(_bulk_sync_async(self, account_id))


async def _bulk_sync_async(task, account_id: str) -> dict:
    """Async implementation of bulk sync."""
    from supabase import create_client
    from app.config import get_settings
    from app.services.token_manager import TokenManager
    from app.services.gmail import GmailService
    from app.services.outlook import OutlookService

    settings = get_settings()
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    token_manager = TokenManager()

    result = {"account_id": account_id, "new_emails": 0, "errors": []}

    try:
        # Fetch the linked account
        account_resp = supabase.table("linked_accounts").select("*").eq("id", account_id).single().execute()
        account = account_resp.data

        if not account or not account.get("is_active"):
            return {"account_id": account_id, "status": "inactive", "new_emails": 0}

        provider = account["provider"]
        user_id = account["user_id"]

        # Get a valid access token
        access_token, new_encrypted, new_expires = await token_manager.get_valid_access_token(
            provider=provider,
            encrypted_refresh_token=account.get("encrypted_refresh_token", ""),
            token_expires_at=datetime.fromisoformat(account["token_expires_at"])
                if account.get("token_expires_at") else None,
        )

        # Update token if refreshed
        if new_encrypted:
            supabase.table("linked_accounts").update({
                "encrypted_refresh_token": new_encrypted,
                "token_expires_at": new_expires.isoformat() if new_expires else None,
                "access_token_hash": token_manager.hash_access_token(access_token),
            }).eq("id", account_id).execute()

        # Fetch emails from provider
        if provider == "gmail":
            service = GmailService(access_token)
            messages_meta, _ = await service.list_messages(
                max_results=settings.email_sync_batch_size,
            )
            message_ids = [m["id"] for m in messages_meta]
        elif provider == "outlook":
            service = OutlookService(access_token)
            messages, _ = await service.list_messages(
                max_results=settings.email_sync_batch_size,
            )
            message_ids = [m["message_id"] for m in messages]
        else:
            return {"account_id": account_id, "status": "unknown_provider", "new_emails": 0}

        # Check which ones are already in DB (dedup)
        existing_resp = supabase.table("emails").select("message_id").eq(
            "user_id", user_id
        ).in_("message_id", message_ids).execute()
        existing_ids = {e["message_id"] for e in (existing_resp.data or [])}

        new_ids = [mid for mid in message_ids if mid not in existing_ids]

        if not new_ids:
            # Update last_sync_at
            supabase.table("linked_accounts").update({
                "last_sync_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", account_id).execute()
            await token_manager.close()
            if provider == "gmail" or provider == "outlook":
                await service.close()
            return {"account_id": account_id, "status": "up_to_date", "new_emails": 0}

        # Fetch full message details for new emails
        if provider == "gmail":
            full_messages = await service.get_messages_batch(new_ids)
        else:
            full_messages = await service.get_messages_batch(new_ids)

        # Insert new emails into DB
        for msg in full_messages:
            try:
                email_record = {
                    "user_id": user_id,
                    "account_id": account_id,
                    "message_id": msg["message_id"],
                    "thread_id": msg.get("thread_id"),
                    "sender": msg["sender"],
                    "sender_name": msg.get("sender_name"),
                    "recipients": msg.get("recipients", []),
                    "subject": msg.get("subject"),
                    "snippet": msg.get("snippet"),
                    "body_text": msg.get("body_text"),
                    "body_html": msg.get("body_html"),
                    "received_at": msg["received_at"].isoformat()
                        if isinstance(msg["received_at"], datetime) else msg["received_at"],
                    "is_read": msg.get("is_read", False),
                    "labels": msg.get("labels", []),
                    "raw_headers": msg.get("raw_headers", {}),
                    "processing_status": "pending",
                }
                insert_resp = supabase.table("emails").insert(email_record).execute()
                if insert_resp.data:
                    new_email_id = insert_resp.data[0]["id"]
                    # Dispatch processing task
                    process_email.delay(new_email_id)
                    result["new_emails"] += 1
            except Exception as exc:
                result["errors"].append(f"Insert failed for {msg['message_id']}: {str(exc)}")
                logger.warning("email_insert_failed", message_id=msg["message_id"], error=str(exc))

        # Update last_sync_at
        supabase.table("linked_accounts").update({
            "last_sync_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", account_id).execute()

        # Cleanup
        await token_manager.close()
        await service.close()

        result["status"] = "synced"
        logger.info(
            "bulk_sync_complete",
            account_id=account_id,
            new_emails=result["new_emails"],
            errors=len(result["errors"]),
        )

    except Exception as exc:
        logger.error("bulk_sync_failed", account_id=account_id, error=str(exc))
        result["status"] = "failed"
        result["errors"].append(str(exc))
        try:
            await token_manager.close()
        except Exception:
            pass

    return result


# ── Task: Sync to Google Calendar ───────────────────────────────────────

@celery_app.task(
    bind=True,
    name="app.workers.tasks.sync_to_calendar",
    max_retries=3,
    default_retry_delay=15,
    rate_limit="30/m",
)
def sync_to_calendar(self, suggested_event_id: str) -> dict:
    """
    Sync a suggested event to Google Calendar.

    1. Fetch the suggested event record
    2. Get the user's linked Gmail account (for Calendar API)
    3. Create the event via Google Calendar API
    4. Update the suggested_events record with gcal_event_id and confirmed_at
    """
    return _run_async(_sync_to_calendar_async(self, suggested_event_id))


async def _sync_to_calendar_async(task, suggested_event_id: str) -> dict:
    """Async implementation of calendar sync."""
    import httpx
    from supabase import create_client
    from app.config import get_settings
    from app.services.token_manager import TokenManager

    settings = get_settings()
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    token_manager = TokenManager()

    try:
        # Fetch the suggested event
        event_resp = supabase.table("suggested_events").select("*").eq(
            "id", suggested_event_id
        ).single().execute()
        event = event_resp.data

        if not event:
            return {"event_id": suggested_event_id, "status": "not_found"}

        if event.get("gcal_event_id"):
            return {"event_id": suggested_event_id, "status": "already_synced"}

        user_id = event["user_id"]

        # Find a Gmail linked account with calendar access
        accounts_resp = supabase.table("linked_accounts").select("*").eq(
            "user_id", user_id
        ).eq("provider", "gmail").eq("is_active", True).execute()

        if not accounts_resp.data:
            return {"event_id": suggested_event_id, "status": "no_gmail_account"}

        account = accounts_resp.data[0]

        # Get valid access token
        access_token, new_encrypted, new_expires = await token_manager.get_valid_access_token(
            provider="gmail",
            encrypted_refresh_token=account.get("encrypted_refresh_token", ""),
            token_expires_at=datetime.fromisoformat(account["token_expires_at"])
                if account.get("token_expires_at") else None,
        )

        # Update token if refreshed
        if new_encrypted:
            supabase.table("linked_accounts").update({
                "encrypted_refresh_token": new_encrypted,
                "token_expires_at": new_expires.isoformat() if new_expires else None,
            }).eq("id", account["id"]).execute()

        # Create the calendar event
        calendar_body = {
            "summary": event["title"],
            "description": event.get("description", ""),
            "start": {},
            "end": {},
        }

        if event.get("is_all_day"):
            start_dt = datetime.fromisoformat(event["start_datetime"])
            calendar_body["start"] = {"date": start_dt.strftime("%Y-%m-%d")}
            if event.get("end_datetime"):
                end_dt = datetime.fromisoformat(event["end_datetime"])
                calendar_body["end"] = {"date": end_dt.strftime("%Y-%m-%d")}
            else:
                calendar_body["end"] = {"date": start_dt.strftime("%Y-%m-%d")}
        else:
            calendar_body["start"] = {
                "dateTime": event["start_datetime"],
                "timeZone": "UTC",
            }
            if event.get("end_datetime"):
                calendar_body["end"] = {
                    "dateTime": event["end_datetime"],
                    "timeZone": "UTC",
                }
            else:
                # Default to 1 hour duration
                start_dt = datetime.fromisoformat(event["start_datetime"].replace("Z", "+00:00"))
                from datetime import timedelta
                end_dt = start_dt + timedelta(hours=1)
                calendar_body["end"] = {
                    "dateTime": end_dt.isoformat(),
                    "timeZone": "UTC",
                }

        if event.get("location"):
            calendar_body["location"] = event["location"]

        async with httpx.AsyncClient(timeout=30.0) as http:
            resp = await http.post(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                headers={"Authorization": f"Bearer {access_token}"},
                json=calendar_body,
            )
            resp.raise_for_status()
            gcal_data = resp.json()

        # Update the suggested_events record
        gcal_event_id = gcal_data.get("id", "")
        supabase.table("suggested_events").update({
            "gcal_event_id": gcal_event_id,
            "confirmed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", suggested_event_id).execute()

        await token_manager.close()

        logger.info(
            "calendar_sync_complete",
            event_id=suggested_event_id,
            gcal_id=gcal_event_id,
        )
        return {
            "event_id": suggested_event_id,
            "status": "synced",
            "gcal_event_id": gcal_event_id,
        }

    except Exception as exc:
        logger.error(
            "calendar_sync_failed",
            event_id=suggested_event_id,
            error=str(exc),
        )
        try:
            await token_manager.close()
        except Exception:
            pass
        raise task.retry(exc=exc)
