"""
Pydantic request/response schemas for all API endpoints.
Strict typing throughout — no `Any` types.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


# ── Enums ───────────────────────────────────────────────────────────────

class EmailProviderEnum(str, Enum):
    GMAIL = "gmail"
    OUTLOOK = "outlook"


class RiskLevelEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ProcessingStatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"


class SecurityEventTypeEnum(str, Enum):
    PHISHING_DETECTED = "phishing_detected"
    SPF_FAIL = "spf_fail"
    DKIM_FAIL = "dkim_fail"
    DMARC_FAIL = "dmarc_fail"
    SUSPICIOUS_LINK = "suspicious_link"
    IMPERSONATION_ATTEMPT = "impersonation_attempt"
    MANUAL_REPORT = "manual_report"


# ── Auth Schemas ────────────────────────────────────────────────────────

class TokenVerifyRequest(BaseModel):
    """Request to verify a Supabase access token."""
    access_token: str = Field(..., description="Supabase JWT access token")


class TokenResponse(BaseModel):
    """Response after successful token verification."""
    internal_token: str
    user_id: str
    email: str
    expires_at: datetime


class OAuthInitResponse(BaseModel):
    """Response when initiating an OAuth link flow."""
    authorization_url: str
    state: str


class LinkedAccountResponse(BaseModel):
    """A linked email account."""
    id: UUID
    provider: EmailProviderEnum
    email_address: str
    is_active: bool
    last_sync_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── User Schemas ────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """Public user profile."""
    id: UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    preferences: dict = Field(default_factory=dict)
    linked_accounts: List[LinkedAccountResponse] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPreferencesUpdate(BaseModel):
    """Update user preferences."""
    preferences: dict


# ── Attachment Schemas ──────────────────────────────────────────────────

class AttachmentResponse(BaseModel):
    """An email attachment (metadata only — file in Supabase Storage)."""
    id: UUID
    filename: str
    content_type: str
    size_bytes: int
    content_id: Optional[str] = None     # for inline images (CID)
    storage_path: str                    # path in Supabase Storage bucket
    download_url: Optional[str] = None   # pre-signed URL (populated at runtime)
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Email Schemas ───────────────────────────────────────────────────────

class EmailSummary(BaseModel):
    """Lightweight email for list views."""
    id: UUID
    account_id: UUID
    message_id: str
    sender: str
    sender_name: Optional[str] = None
    subject: Optional[str] = None
    snippet: Optional[str] = None
    received_at: datetime
    is_read: bool
    is_archived: bool
    is_starred: bool
    risk_score: Optional[RiskLevelEnum] = None
    summary_bullets: Optional[List[str]] = None
    processing_status: ProcessingStatusEnum
    attachment_count: int = 0
    provider: Optional[EmailProviderEnum] = None

    model_config = {"from_attributes": True}


class EmailDetail(BaseModel):
    """Full email detail view."""
    id: UUID
    account_id: UUID
    message_id: str
    thread_id: Optional[str] = None
    sender: str
    sender_name: Optional[str] = None
    recipients: List[str] = Field(default_factory=list)
    subject: Optional[str] = None
    snippet: Optional[str] = None
    body_text: Optional[str] = None
    received_at: datetime
    is_read: bool
    is_archived: bool
    is_starred: bool
    labels: List[str] = Field(default_factory=list)
    risk_score: Optional[RiskLevelEnum] = None
    risk_reasons: Optional[List[str]] = None
    summary_bullets: Optional[List[str]] = None
    raw_headers: Optional[dict] = None
    processing_status: ProcessingStatusEnum
    processing_error: Optional[str] = None
    processed_at: Optional[datetime] = None
    suggested_events: List[SuggestedEventResponse] = Field(default_factory=list)
    attachments: List[AttachmentResponse] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}


class EmailListResponse(BaseModel):
    """Paginated email list with cursor."""
    emails: List[EmailSummary]
    next_cursor: Optional[str] = None
    total_count: Optional[int] = None


class EmailArchiveRequest(BaseModel):
    """Request to archive/unarchive an email."""
    is_archived: bool = True


# ── AI Pipeline Schemas ─────────────────────────────────────────────────

class RiskResult(BaseModel):
    """Output of security analysis."""
    level: RiskLevelEnum
    reasons: List[str] = Field(default_factory=list)
    spf_pass: Optional[bool] = None
    dkim_pass: Optional[bool] = None
    dmarc_pass: Optional[bool] = None


class SummaryResult(BaseModel):
    """Output of email summarization."""
    bullets: List[str] = Field(
        ...,
        min_length=1,
        max_length=3,
        description="Exactly 3 summary bullet points",
    )


class EventData(BaseModel):
    """An extracted calendar event."""
    title: str
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    location: Optional[str] = None
    is_all_day: bool = False


class EmailProcessingResult(BaseModel):
    """Complete result after processing an email through the AI pipeline."""
    email_id: UUID
    summary: Optional[SummaryResult] = None
    risk: Optional[RiskResult] = None
    events: List[EventData] = Field(default_factory=list)
    processing_status: ProcessingStatusEnum
    error: Optional[str] = None


# ── Calendar Schemas ────────────────────────────────────────────────────

class SuggestedEventResponse(BaseModel):
    """A suggested calendar event."""
    id: UUID
    email_id: UUID
    title: str
    description: Optional[str] = None
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    location: Optional[str] = None
    is_all_day: bool
    confirmed_at: Optional[datetime] = None
    gcal_event_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConfirmEventRequest(BaseModel):
    """Request to confirm and sync an event to Google Calendar."""
    title: Optional[str] = None  # Allow override
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    location: Optional[str] = None


class CalendarEventListResponse(BaseModel):
    """List of suggested events."""
    events: List[SuggestedEventResponse]


# ── SSE / Stream Schemas ───────────────────────────────────────────────

class ProcessingUpdate(BaseModel):
    """SSE message for email processing status updates."""
    email_id: UUID
    status: ProcessingStatusEnum
    step: Optional[str] = None  # "security_analysis", "summarization", "event_extraction"
    progress: Optional[int] = None  # 0-100
    error: Optional[str] = None


# ── Health / Metrics ────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str
    environment: str
    services: dict = Field(default_factory=dict)


class MetricsResponse(BaseModel):
    """Application metrics."""
    total_users: int = 0
    total_emails_processed: int = 0
    active_workers: int = 0
    queue_depth: int = 0
    avg_processing_time_ms: float = 0.0


# ── Generic ─────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
    success: bool = True


# Resolve forward references
EmailDetail.model_rebuild()
