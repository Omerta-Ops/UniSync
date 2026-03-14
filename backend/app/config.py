"""
Backend application configuration.
All settings loaded from environment variables via Pydantic Settings.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings — loaded from .env / environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ─────────────────────────────────────────────────────────────
    app_name: str = "UniSync"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"

    # ── CORS ────────────────────────────────────────────────────────────
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"]
    )

    # ── Supabase ────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # ── Database (direct Postgres connection for SQLAlchemy) ────────────
    database_url: str = ""  # postgresql+asyncpg://...

    # ── Redis ───────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── Token Encryption ────────────────────────────────────────────────
    token_encryption_key: str = ""  # Fernet key (base64-encoded 32 bytes)

    # ── JWT ─────────────────────────────────────────────────────────────
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60 * 24  # 24 hours

    # ── Gmail OAuth ─────────────────────────────────────────────────────
    gmail_client_id: str = ""
    gmail_client_secret: str = ""
    gmail_redirect_uri: str = "http://localhost:8000/auth/callback/gmail"
    gmail_scopes: List[str] = Field(
        default=[
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/calendar.events",
        ]
    )

    # ── Outlook / Microsoft Graph OAuth ─────────────────────────────────
    outlook_client_id: str = ""
    outlook_client_secret: str = ""
    outlook_redirect_uri: str = "http://localhost:8000/auth/callback/outlook"
    outlook_tenant_id: str = "common"
    outlook_scopes: List[str] = Field(
        default=[
            "https://graph.microsoft.com/Mail.Read",
            "https://graph.microsoft.com/Calendars.ReadWrite",
        ]
    )

    # ── Google Gemini / LLM ──────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"

    # ── Rate Limiting ───────────────────────────────────────────────────
    rate_limit_emails: str = "100/minute"
    rate_limit_auth: str = "10/minute"
    rate_limit_default: str = "200/minute"

    # ── Email Processing ────────────────────────────────────────────────
    email_sync_batch_size: int = 50
    email_retention_days: int = 90
    max_concurrent_processing: int = 12


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton for application settings."""
    return Settings()
