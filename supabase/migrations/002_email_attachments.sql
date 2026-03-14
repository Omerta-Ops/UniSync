-- ============================================================================
-- UniSync — Email Attachments Support
-- Migration: 002_email_attachments.sql
--
-- Architecture:
--   - Metadata (filename, size, MIME type) → PostgreSQL (this table)
--   - Actual file bytes → Supabase Storage bucket "email-attachments"
--   - storage_path column links the two
-- ============================================================================

-- ── Attachments Table ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.email_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id        UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- File metadata
    filename        TEXT NOT NULL,              -- Original filename (e.g. "report.pdf")
    content_type    TEXT NOT NULL DEFAULT 'application/octet-stream',  -- MIME type
    size_bytes      BIGINT NOT NULL DEFAULT 0,  -- File size in bytes
    content_id      TEXT,                       -- For inline images (CID references in HTML body)

    -- Storage reference
    storage_path    TEXT NOT NULL,              -- Path in Supabase Storage bucket
                                                -- e.g. "{user_id}/{email_id}/{filename}"

    -- Provider metadata (for re-fetching if needed)
    provider_attachment_id TEXT,                -- Gmail attachment ID or Outlook attachment ID

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────────

-- Fast lookup: all attachments for an email
CREATE INDEX idx_attachments_email ON public.email_attachments (email_id);

-- Fast lookup: all attachments for a user (for storage quota tracking)
CREATE INDEX idx_attachments_user ON public.email_attachments (user_id);

-- ── Row Level Security ─────────────────────────────────────────────────

ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own attachments
CREATE POLICY attachments_select ON public.email_attachments
    FOR SELECT USING (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));

-- Users can delete their own attachments
CREATE POLICY attachments_delete ON public.email_attachments
    FOR DELETE USING (user_id IN (SELECT id FROM public.users WHERE auth_uid = auth.uid()));

-- ── Supabase Storage Bucket ────────────────────────────────────────────
-- Run this in the Supabase Dashboard → Storage → Create Bucket:
--
--   Bucket name:  email-attachments
--   Public:       No (private)
--   File size limit: 25 MB
--   Allowed MIME types: (leave blank for all)
--
-- Then add this Storage Policy (via SQL Editor):

-- Allow authenticated users to read their own attachments
-- CREATE POLICY storage_attachments_select ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'email-attachments'
--         AND (storage.foldername(name))[1] IN (
--             SELECT id::text FROM public.users WHERE auth_uid = auth.uid()
--         )
--     );

-- Allow service role to insert (backend uploads on behalf of user)
-- Service role bypasses RLS by default, so no INSERT policy needed.

-- ── Realtime ───────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.email_attachments;

-- ── Cleanup: delete attachment files when rows are deleted ─────────────
-- Note: Supabase Storage cleanup must happen at the application layer.
-- When deleting an email (CASCADE), the backend should also call:
--   supabase.storage.from('email-attachments').remove([storage_path])
-- The CASCADE on email_id handles the metadata row automatically.
