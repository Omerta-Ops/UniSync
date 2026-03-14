"""
SQLAlchemy async models mirroring the Supabase PostgreSQL schema.
Uses asyncpg driver for high-performance async operations.
"""

from __future__ import annotations

import enum
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.asyncio import AsyncAttrs, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship

from app.config import get_settings


# ── Base ────────────────────────────────────────────────────────────────

class Base(AsyncAttrs, DeclarativeBase):
    """Base class for all ORM models."""
    pass


# ── Enums ───────────────────────────────────────────────────────────────

class EmailProvider(str, enum.Enum):
    GMAIL = "gmail"
    OUTLOOK = "outlook"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ProcessingStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class SecurityEventType(str, enum.Enum):
    PHISHING_DETECTED = "phishing_detected"
    SPF_FAIL = "spf_fail"
    DKIM_FAIL = "dkim_fail"
    DMARC_FAIL = "dmarc_fail"
    SUSPICIOUS_LINK = "suspicious_link"
    IMPERSONATION_ATTEMPT = "impersonation_attempt"
    MANUAL_REPORT = "manual_report"


# ── Models ──────────────────────────────────────────────────────────────

class User(Base):
    """Application user — synced from Supabase Auth."""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    auth_uid = Column(UUID(as_uuid=True), unique=True, nullable=False)
    email = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    preferences = Column(JSONB, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"))

    # Relationships
    linked_accounts = relationship("LinkedAccount", back_populates="user", cascade="all, delete-orphan")
    emails = relationship("Email", back_populates="user", cascade="all, delete-orphan")
    suggested_events = relationship("SuggestedEvent", back_populates="user", cascade="all, delete-orphan")
    security_logs = relationship("SecurityLog", back_populates="user", cascade="all, delete-orphan")


class LinkedAccount(Base):
    """An OAuth-linked email account (Gmail or Outlook)."""

    __tablename__ = "linked_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(Enum(EmailProvider, name="email_provider", create_type=False), nullable=False)
    email_address = Column(String, nullable=False)
    encrypted_refresh_token = Column(Text, nullable=True)
    access_token_hash = Column(String, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    push_subscription_id = Column(String, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"))

    __table_args__ = (
        UniqueConstraint("user_id", "provider", "email_address"),
        Index("idx_linked_accounts_user", "user_id"),
    )

    # Relationships
    user = relationship("User", back_populates="linked_accounts")
    emails = relationship("Email", back_populates="account", cascade="all, delete-orphan")


class Email(Base):
    """An email message aggregated from a linked account."""

    __tablename__ = "emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("linked_accounts.id", ondelete="CASCADE"), nullable=False)
    message_id = Column(String, nullable=False)
    thread_id = Column(String, nullable=True)
    sender = Column(String, nullable=False)
    sender_name = Column(String, nullable=True)
    recipients = Column(JSONB, server_default=text("'[]'::jsonb"))
    subject = Column(String, nullable=True)
    snippet = Column(Text, nullable=True)
    body_text = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    is_archived = Column(Boolean, nullable=False, default=False)
    is_starred = Column(Boolean, nullable=False, default=False)
    labels = Column(JSONB, server_default=text("'[]'::jsonb"))

    # AI-enriched fields (nullable)
    risk_score = Column(Enum(RiskLevel, name="risk_level", create_type=False), nullable=True)
    risk_reasons = Column(JSONB, nullable=True)
    summary_bullets = Column(JSONB, nullable=True)
    raw_headers = Column(JSONB, nullable=True)

    # Processing
    processing_status = Column(
        Enum(ProcessingStatus, name="processing_status", create_type=False),
        nullable=False,
        default=ProcessingStatus.PENDING,
    )
    processing_error = Column(Text, nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # TTL
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"))
    expires_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.utcnow() + timedelta(days=90),
    )

    __table_args__ = (
        UniqueConstraint("user_id", "message_id"),
        Index("idx_emails_user_received", "user_id", "received_at"),
    )

    # Relationships
    user = relationship("User", back_populates="emails")
    account = relationship("LinkedAccount", back_populates="emails")
    suggested_events = relationship("SuggestedEvent", back_populates="email", cascade="all, delete-orphan")
    security_logs = relationship("SecurityLog", back_populates="email")
    attachments = relationship("EmailAttachment", back_populates="email", cascade="all, delete-orphan")


class SuggestedEvent(Base):
    """A calendar event extracted from an email by AI."""

    __tablename__ = "suggested_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email_id = Column(UUID(as_uuid=True), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=True)
    location = Column(String, nullable=True)
    is_all_day = Column(Boolean, nullable=False, default=False)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    gcal_event_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"))

    __table_args__ = (
        Index("idx_suggested_events_user", "user_id"),
        Index("idx_suggested_events_email", "email_id"),
    )

    # Relationships
    email = relationship("Email", back_populates="suggested_events")
    user = relationship("User", back_populates="suggested_events")


class SecurityLog(Base):
    """An audit log entry for security events."""

    __tablename__ = "security_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email_id = Column(UUID(as_uuid=True), ForeignKey("emails.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(
        Enum(SecurityEventType, name="security_event_type", create_type=False),
        nullable=False,
    )
    detail = Column(JSONB, server_default=text("'{}'::jsonb"))
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    __table_args__ = (
        Index("idx_security_logs_user", "user_id", "created_at"),
    )

    # Relationships
    user = relationship("User", back_populates="security_logs")
    email = relationship("Email", back_populates="security_logs")


class EmailAttachment(Base):
    """Metadata for an email attachment. Actual file stored in Supabase Storage."""

    __tablename__ = "email_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email_id = Column(UUID(as_uuid=True), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False, default="application/octet-stream")
    size_bytes = Column(BigInteger, nullable=False, default=0)
    content_id = Column(String, nullable=True)  # for inline images (CID)
    storage_path = Column(String, nullable=False)  # path in Supabase Storage bucket
    provider_attachment_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    __table_args__ = (
        Index("idx_attachments_email", "email_id"),
        Index("idx_attachments_user", "user_id"),
    )

    # Relationships
    email = relationship("Email", back_populates="attachments")
    user = relationship("User")


# ── Database Engine & Session ───────────────────────────────────────────

def get_engine():
    """Create async database engine."""
    settings = get_settings()
    if not settings.database_url:
        raise ValueError("DATABASE_URL is not configured")
    return create_async_engine(
        settings.database_url,
        echo=settings.debug,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
    )


def get_async_session_factory():
    """Create async session factory."""
    engine = get_engine()
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session():
    """Dependency for FastAPI — yields an async DB session."""
    session_factory = get_async_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
