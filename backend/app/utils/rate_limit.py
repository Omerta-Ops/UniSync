"""
Rate limiting configuration using slowapi.
Applies per-user rate limits to protect against abuse.
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.config import get_settings


def _get_user_or_ip(request: Request) -> str:
    """
    Extract rate-limit key: use authenticated user ID if available,
    otherwise fall back to IP address.
    """
    # The auth middleware attaches user info to request.state
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return str(user_id)
    return get_remote_address(request)


# Create the limiter instance
limiter = Limiter(
    key_func=_get_user_or_ip,
    default_limits=[get_settings().rate_limit_default],
    headers_enabled=True,  # Expose X-RateLimit-* headers
)
