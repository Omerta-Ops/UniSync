"""
Health check and metrics endpoints.
"""

from __future__ import annotations

import structlog
from fastapi import APIRouter

from app.config import get_settings
from app.models.schemas import HealthResponse, MetricsResponse

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint — returns service status."""
    settings = get_settings()
    services = {}

    # Check Supabase
    try:
        from supabase import create_client
        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
        supabase.table("users").select("id").limit(1).execute()
        services["supabase"] = "healthy"
    except Exception as exc:
        services["supabase"] = f"unhealthy: {str(exc)[:100]}"

    # Check Redis
    try:
        import redis
        r = redis.from_url(settings.redis_url)
        r.ping()
        services["redis"] = "healthy"
        r.close()
    except Exception as exc:
        services["redis"] = f"unhealthy: {str(exc)[:100]}"

    # Check Gemini
    if settings.gemini_api_key:
        services["gemini"] = "configured"
    else:
        services["gemini"] = "not_configured"

    overall = "healthy" if all(
        v == "healthy" or v == "configured" or v == "not_configured"
        for v in services.values()
    ) else "degraded"

    return HealthResponse(
        status=overall,
        version=settings.app_version,
        environment=settings.environment,
        services=services,
    )


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics() -> MetricsResponse:
    """Application metrics endpoint."""
    settings = get_settings()

    try:
        from supabase import create_client
        supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

        users_resp = supabase.table("users").select("id", count="exact").execute()
        emails_resp = supabase.table("emails").select("id", count="exact").eq(
            "processing_status", "done"
        ).execute()

        return MetricsResponse(
            total_users=users_resp.count or 0,
            total_emails_processed=emails_resp.count or 0,
        )
    except Exception as exc:
        logger.warning("metrics_fetch_failed", error=str(exc))
        return MetricsResponse()
