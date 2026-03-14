"""
FastAPI application factory.
Assembles the app with middleware, routes, CORS, and structured logging.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.routers import auth, emails, calendar, health
from app.utils.rate_limit import limiter


# ── Structured Logging Setup ───────────────────────────────────────────

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if get_settings().debug else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(20),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)


# ── Lifespan ───────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown."""
    settings = get_settings()
    logger.info(
        "app_starting",
        app=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )
    yield
    logger.info("app_shutting_down")


# ── App Factory ────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Unified communication intelligence platform for university students",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # ── CORS ────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
        ],
    )

    # ── Rate Limiter ────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── JWT Auth Middleware ──────────────────────────────────────────────
    @app.middleware("http")
    async def jwt_auth_middleware(request: Request, call_next):
        """
        Extract and validate the internal JWT from Authorization header.
        Sets request.state.user_id and request.state.auth_uid.
        Skips auth for public endpoints.
        """
        # Public paths that don't need auth
        public_paths = {
            "/health",
            "/metrics",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/auth/verify-token",
            "/auth/callback/gmail",
            "/auth/callback/outlook",
        }

        if request.url.path in public_paths or request.method == "OPTIONS":
            return await call_next(request)

        # Extract token
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            # Allow the request but without user context
            request.state.user_id = None
            request.state.auth_uid = None
            return await call_next(request)

        token = auth_header[7:]

        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
            )
            request.state.user_id = payload.get("sub")
            request.state.auth_uid = payload.get("auth_uid")
        except JWTError:
            request.state.user_id = None
            request.state.auth_uid = None

        return await call_next(request)

    # ── CSP Headers Middleware ──────────────────────────────────────────
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        """Add security headers to all responses."""
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co"
        )
        return response

    # ── Request Logging ─────────────────────────────────────────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Log all incoming requests."""
        import time
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        if request.url.path not in ("/health", "/metrics"):
            logger.info(
                "request",
                method=request.method,
                path=request.url.path,
                status=response.status_code,
                duration_ms=round(duration_ms, 2),
                user_id=getattr(request.state, "user_id", None),
            )

        return response

    # ── Routes ──────────────────────────────────────────────────────────
    app.include_router(auth.router)
    app.include_router(emails.router)
    app.include_router(calendar.router)
    app.include_router(health.router)

    return app


# Create the application instance
app = create_app()
