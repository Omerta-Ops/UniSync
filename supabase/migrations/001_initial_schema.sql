-- ============================================================================
-- UniSync — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_cron";     -- scheduled jobs

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE email_provider AS ENUM ('gmail', 'outlook');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'done', 'failed');
CREATE TYPE security_event_type AS ENUM (
    'phishing_detected',
    'spf_fail',
    'dkim_fail',
    'dmarc_fail',
    'suspicious_link',
    'impersonation_attempt',
    'manual_report'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users (synced from Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_uid        UUID NOT NULL UNIQUE,  -- maps to auth.users.id
    email           TEXT NOT NULL,
    full_name       TEXT,
    avatar_url      TEXT,
    preferences     JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Linked email accounts (Gmail / Outlook via OAuth)
CREATE TABLE IF NOT EXISTS public.linked_accounts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider                email_provider NOT NULL,
    email_address           TEXT NOT NULL,
    encrypted_refresh_token TEXT,          -- Fernet-encrypted at app layer
    access_token_hash       TEXT,          -- SHA-256 hash for lookup, never raw
    token_expires_at        TIMESTAMPTZ,
    push_subscription_id    TEXT,          -- Gmail Pub/Sub or Graph change notif ID
    is_active               BOOLEAN NOT NULL DEFAULT true,
    last_sync_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(user_id, provider, email_address)
);

-- Emails (aggregated from all linked accounts)
CREATE TABLE IF NOT EXISTS public.emails (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id          UUID NOT NULL REFERENCES public.linked_accounts(id) ON DELETE CASCADE,
    message_id          TEXT NOT NULL,           -- provider message ID for dedup
    thread_id           TEXT,
    sender              TEXT NOT NULL,
    sender_name         TEXT,
    recipients          JSONB DEFAULT '[]'::jsonb,
    subject             TEXT,
    snippet             TEXT,                    -- short preview
    body_text           TEXT,                    -- plain text body
    body_html           TEXT,                    -- HTML body (sanitized on frontend)
    received_at         TIMESTAMPTZ NOT NULL,
    is_read             BOOLEAN NOT NULL DEFAULT false,
    is_archived         BOOLEAN NOT NULL DEFAULT false,
    is_starred          BOOLEAN NOT NULL DEFAULT false,
    labels              JSONB DEFAULT '[]'::jsonb,

    -- AI-enriched fields (nullable — system works without them)
    risk_score          risk_level,
    risk_reasons        JSONB,                  -- e.g. ["SPF failed", "Urgency language"]
    summary_bullets     JSONB,                  -- ["bullet1", "bullet2", "bullet3"]
    raw_headers         JSONB,                  -- SPF/DKIM/DMARC headers for audit

    -- Processing state
    processing_status   processing_status NOT NULL DEFAULT 'pending',
    processing_error    TEXT,
    processed_at        TIMESTAMPTZ,

    -- TTL
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at          TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days'),

    -- Deduplication: same email can't exist twice for same user
    UNIQUE(user_id, message_id)
);

-- Suggested calendar events (extracted by AI)
CREATE TABLE IF NOT EXISTS public.suggested_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id        UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    start_datetime  TIMESTAMPTZ NOT NULL,
    end_datetime    TIMESTAMPTZ,
    location        TEXT,
    is_all_day      BOOLEAN NOT NULL DEFAULT false,
    confirmed_at    TIMESTAMPTZ,            -- NULL until user confirms
    gcal_event_id   TEXT,                   -- Google Calendar event ID after sync
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security audit log
CREATE TABLE IF NOT EXISTS public.security_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email_id        UUID REFERENCES public.emails(id) ON DELETE SET NULL,
    event_type      security_event_type NOT NULL,
    detail          JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Fast dashboard loads: emails sorted by date for a user
CREATE INDEX idx_emails_user_received ON public.emails (user_id, received_at DESC);

-- Security filter: emails by risk
CREATE INDEX idx_emails_user_risk ON public.emails (user_id, risk_score)
    WHERE risk_score IS NOT NULL;

-- Processing queue: find pending emails
CREATE INDEX idx_emails_processing ON public.emails (processing_status)
    WHERE processing_status IN ('pending', 'processing');

-- Unread filter
CREATE INDEX idx_emails_user_unread ON public.emails (user_id, is_read)
    WHERE is_read = false;

-- GIN index for JSONB search on summary bullets
CREATE INDEX idx_emails_summary_gin ON public.emails
    USING GIN (summary_bullets jsonb_path_ops);

-- Linked accounts lookup
CREATE INDEX idx_linked_accounts_user ON public.linked_accounts (user_id);

-- Suggested events by user
CREATE INDEX idx_suggested_events_user ON public.suggested_events (user_id);
CREATE INDEX idx_suggested_events_email ON public.suggested_events (email_id);

-- Security logs by user and time
CREATE INDEX idx_security_logs_user ON public.security_logs (user_id, created_at DESC);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_linked_accounts_updated_at
    BEFORE UPDATE ON public.linked_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_emails_updated_at
    BEFORE UPDATE ON public.emails
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_suggested_events_updated_at
    BEFORE UPDATE ON public.suggested_events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggested_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Users: can only see/edit own record
CREATE POLICY users_select ON public.users
    FOR SELECT USING (auth_uid = auth.uid());
CREATE POLICY users_update ON public.users
    FOR UPDATE USING (auth_uid = auth.uid());

-- Linked accounts: user can manage own
CREATE POLICY linked_accounts_select ON public.linked_accounts
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));
CREATE POLICY linked_accounts_insert ON public.linked_accounts
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));
CREATE POLICY linked_accounts_update ON public.linked_accounts
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));
CREATE POLICY linked_accounts_delete ON public.linked_accounts
    FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));

-- Emails: user can only see own
CREATE POLICY emails_select ON public.emails
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));
CREATE POLICY emails_update ON public.emails
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));

-- Suggested events: user can only see own
CREATE POLICY suggested_events_select ON public.suggested_events
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));
CREATE POLICY suggested_events_update ON public.suggested_events
    FOR UPDATE USING (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));

-- Security logs: user can only see own
CREATE POLICY security_logs_select ON public.security_logs
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));

-- ============================================================================
-- SERVICE ROLE POLICIES (for backend operations)
-- ============================================================================

-- The backend uses service_role key which bypasses RLS by default.
-- This is correct: the backend is trusted and needs full access.
-- RLS protects against direct Supabase client access from frontend.

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================

-- Enable Supabase Realtime on emails table for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.suggested_events;

-- ============================================================================
-- SCHEDULED CLEANUP (pg_cron)
-- ============================================================================

-- Delete expired emails daily at 3 AM UTC
SELECT cron.schedule(
    'cleanup-expired-emails',
    '0 3 * * *',
    $$DELETE FROM public.emails WHERE expires_at < now()$$
);

-- ============================================================================
-- AUTO-CREATE USER ON SIGNUP (triggered by Supabase Auth)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_uid, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
