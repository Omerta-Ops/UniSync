# UniSync — Master Production Prompt
> **Model Target:** Claude Opus 4.6 (Extended Thinking)
> **Mode:** Full-stack architect + builder + critic
> **Tone:** Expert engineering partner, not an assistant

---

## PREAMBLE — READ THIS FIRST

You are a **senior full-stack engineer and systems architect** with deep expertise in high-throughput distributed systems, modern React architecture, and production-grade Python backends. You are being handed a partially-built student project called **UniSync** and your mission is to **complete it, harden it, and elevate it to a production-ready standard** — not as a school project, but as something that could be deployed and withstand real load.

You must think like an **HFT (High-Frequency Trading) infrastructure engineer**: every millisecond of latency is a UX failure, every unhandled race condition is a bug waiting to happen in production, every synchronous call in an async context is a crime. Apply that mindset to a consumer web app.

**Before you write a single line of code**, you must perform the following:

1. **Audit** the existing codebase and login page critically.
2. **Propose architectural improvements** that were not in the original plan — explain your reasoning.
3. **Flag any design decisions in the SRS that you believe are suboptimal** and suggest alternatives.
4. Only after your architectural proposal is complete, begin implementation.

---

## SECTION 1 — PROJECT CONTEXT

### What UniSync Is

UniSync is a **unified communication intelligence platform** for university students. It aggregates Gmail and Outlook inboxes into a single "pane of glass," runs AI summarization and phishing detection on every email, and automates deadline extraction to Google Calendar.

The SRS defines four functional modules:

| Module | Core Job |
|---|---|
| **M1: Unified Auth & Dashboard** | Firebase login, OAuth to Gmail/Outlook, merged inbox feed |
| **M2: AI Information Synthesis** | LLM summarization → 3-bullet output, cached in DB |
| **M3: Security Analysis** | SPF/DKIM/DMARC header checks + LLM tone analysis → Risk Score |
| **M4: Calendar Orchestration** | NLP date extraction → Google Calendar event creation |

### What Already Exists

- A **login page** has been built. Its design system (color palette, typography, component style, spacing) is the **single source of truth for the entire UI**. Every screen you build must be a natural extension of this login page — same font family, same color tokens, same button styles, same border-radius system, same motion language. Do not invent a new design system. Extract the design tokens from the login page and codify them as a `theme.js` / CSS custom properties file before building anything else.

### Target Stack (per SRS)

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Zustand + TanStack Query |
| Backend | Python FastAPI + Uvicorn (multi-worker) |
| Task Queue | Celery + Redis |
| AI Layer | LangChain + OpenAI API (or Ollama fallback) |
| Auth | Firebase Auth (primary identity) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Deployment | Frontend → Vercel, Backend → Render / Railway |

---

## SECTION 2 — MANDATORY ARCHITECTURAL REVIEW

**Before building**, think deeply and produce a written architectural review covering all of the following. Use extended thinking to reason through trade-offs. Your review must be opinionated — not wishy-washy.

### 2.1 — Critical Improvements to Propose

Evaluate each of the following and either validate or improve the SRS decision:

**A. Concurrency Model**
The SRS mandates "500 emails/minute concurrent processing." Evaluate whether Celery + Redis alone is sufficient. Consider:
- Should you use `asyncio` within Celery workers or switch to `arq` (async Redis queue)?
- Should FastAPI use `async def` endpoints everywhere or only where I/O-bound?
- Should the email polling be event-driven (webhook/push from Gmail's Pub/Sub API) rather than polling? Polling at scale is an anti-pattern.
- Propose the right concurrency architecture and implement it.

**B. Real-Time Updates**
The SRS mentions Supabase "real-time capabilities" but doesn't specify how they're used. Propose and implement a real-time strategy:
- Supabase Realtime (WebSocket) for pushing new emails to the frontend without polling.
- The frontend should *never* poll. It should be push-driven.

**C. Token Security**
The SRS says "AES-256 at rest." Propose whether to use Supabase's native encryption, a Vault extension, or application-level encryption via `cryptography` library. Implement whichever is most practical and most secure.

**D. AI Pipeline Resilience**
The SRS has NFR-8 (graceful degradation on LLM failure). Design a proper circuit breaker:
- Use `tenacity` for retry with exponential backoff.
- Implement a local Ollama fallback path.
- Design the `EmailProcessingResult` schema to have nullable AI fields — the system works without them.

**E. Frontend State Architecture**
The SRS says "use Zustand." Evaluate whether Zustand alone is right or whether a hybrid with TanStack Query is optimal. Propose:
- TanStack Query for **server state** (emails, summaries — anything from the API).
- Zustand for **client state** (UI state, modals, optimistic updates, selected email).
- Codify the boundary clearly so future developers don't mix them.

**F. Improvements You Are Recommending Beyond the SRS**
The SRS is a v1 document written by students. As the senior architect, propose at least **3 improvements not in the SRS** that would make the system meaningfully better. Examples might include (do not limit yourself to these):
- Connection pooling strategy (pgBouncer / Supabase's built-in pooler).
- Email deduplication across accounts (same email in two linked accounts).
- A proper job-status WebSocket endpoint so the UI can show "Analyzing..." with live progress.
- Background prefetching of summaries before the user opens an email.
- Rate-limit headers exposed to the frontend for better UX.

---

## SECTION 3 — IMPLEMENTATION SPECIFICATION

Once your architectural review is complete, implement the full application according to the following specifications. Work module by module. Each module must be fully complete — no TODOs, no placeholder functions, no `pass` statements.

### 3.1 — Project Structure

```
unisync/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── theme/               # Design tokens extracted from login page
│   │   │   └── tokens.css       # All CSS custom properties
│   │   ├── store/               # Zustand stores
│   │   │   ├── uiStore.js       # Modal state, sidebar, selected email
│   │   │   └── authStore.js     # Firebase user, linked accounts
│   │   ├── api/                 # TanStack Query hooks
│   │   │   ├── useEmails.js
│   │   │   ├── useSync.js
│   │   │   └── useCalendar.js
│   │   ├── components/
│   │   │   ├── layout/          # Shell, Sidebar, TopBar
│   │   │   ├── inbox/           # EmailList, EmailCard, EmailDetail
│   │   │   ├── ai/              # SummaryCard, RiskBanner
│   │   │   ├── calendar/        # SuggestedEventCard, AddToCalendarModal
│   │   │   └── common/          # Button, Badge, Spinner, Toast
│   │   ├── pages/
│   │   │   ├── Login.jsx        # The existing login page (do not redesign)
│   │   │   ├── Dashboard.jsx
│   │   │   └── Settings.jsx
│   │   └── main.jsx
│   └── vite.config.js
│
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── main.py              # App factory, CORS, middleware
│   │   ├── config.py            # Pydantic Settings
│   │   ├── routers/
│   │   │   ├── auth.py          # /auth/* endpoints
│   │   │   ├── emails.py        # /emails/* endpoints
│   │   │   ├── calendar.py      # /calendar/* endpoints
│   │   │   └── health.py        # /health, /metrics
│   │   ├── services/
│   │   │   ├── gmail.py         # Gmail API client
│   │   │   ├── outlook.py       # Microsoft Graph client
│   │   │   ├── token_manager.py # OAuth token refresh, encryption
│   │   │   ├── ai_pipeline.py   # LangChain orchestration
│   │   │   └── security_analyzer.py  # Phishing detection
│   │   ├── workers/
│   │   │   ├── celery_app.py    # Celery configuration
│   │   │   └── tasks.py         # process_email, sync_calendar
│   │   ├── models/
│   │   │   ├── db.py            # SQLAlchemy / Supabase models
│   │   │   └── schemas.py       # Pydantic request/response models
│   │   └── utils/
│   │       ├── crypto.py        # AES-256 token encryption
│   │       ├── rate_limit.py    # slowapi configuration
│   │       └── circuit_breaker.py  # tenacity-based resilience
│   └── requirements.txt
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
│
└── docker-compose.yml           # Local dev: Redis, backend, workers
```

### 3.2 — Database Schema (Implement in full SQL)

Write the complete Supabase migration file. It must include:

```sql
-- Tables required:
-- users (firebase_uid, email, created_at, preferences jsonb)
-- linked_accounts (id, user_id, provider ENUM('gmail','outlook'), 
--                  encrypted_refresh_token, access_token_hash, 
--                  token_expires_at, email_address, is_active)
-- emails (id, user_id, account_id, message_id, thread_id, 
--          sender, subject, received_at, is_read, is_archived,
--          risk_score ENUM('low','medium','high'), risk_reasons jsonb,
--          summary_bullets jsonb, raw_headers jsonb,
--          processing_status ENUM('pending','processing','done','failed'),
--          created_at, expires_at)
-- suggested_events (id, email_id, user_id, title, start_datetime, 
--                   end_datetime, location, confirmed_at, gcal_event_id)
-- security_logs (id, user_id, email_id, event_type, detail jsonb, created_at)

-- Required:
-- Row Level Security policies on ALL tables (user can only see their own data)
-- pg_cron job to delete email records where expires_at < NOW()
-- Index on emails(user_id, received_at DESC) for fast dashboard loads
-- Index on emails(user_id, risk_score) for security filter
-- GIN index on emails(summary_bullets) if using jsonb search
```

### 3.3 — Backend: FastAPI Application

#### Authentication & Token Management

```python
# Implement ALL of the following:

# POST /auth/firebase-verify
# - Accepts Firebase ID token
# - Verifies with Firebase Admin SDK
# - Creates user record in Supabase if first login
# - Returns internal JWT for subsequent API calls

# POST /auth/link/gmail
# - Initiates OAuth 2.0 PKCE flow for Gmail
# - Scopes: gmail.readonly, calendar.events

# GET /auth/callback/gmail
# - Handles OAuth callback
# - Encrypts refresh token with AES-256 before storage
# - Triggers initial email sync task (async, via Celery)

# POST /auth/link/outlook
# - Same pattern for Microsoft Graph API

# Token encryption must use:
# from cryptography.fernet import Fernet
# Key derived from environment secret, not hardcoded
```

#### Email Endpoints

```python
# GET /emails
# Query params: account_id (optional), risk_score (optional), 
#              limit (default 50), cursor (for cursor pagination)
# Returns: paginated list of emails with summaries already attached
# Performance: Must use cursor-based pagination (NOT offset)
# Must add Cache-Control headers for unchanged data

# GET /emails/{email_id}
# Returns full email metadata + summary + risk analysis
# Triggers background processing if status == 'pending'

# POST /emails/{email_id}/archive
# Optimistic-update friendly: returns immediately
# Dispatches background task to sync archive status back to provider

# GET /emails/stream
# Server-Sent Events (SSE) endpoint
# Streams processing status updates for pending emails
# Frontend subscribes while emails are being analyzed
```

#### Celery Tasks (implement fully, no stubs)

```python
# Task: process_email(email_id: str)
# 1. Fetch raw email from provider (Gmail/Graph API)
# 2. Run security_analyzer.analyze(headers, body) → RiskResult
# 3. Run ai_pipeline.summarize(body) → List[str] (3 bullets)
# 4. Run ai_pipeline.extract_events(body) → List[EventData]
# 5. Update email record in Supabase with all results
# 6. Push Supabase Realtime update so frontend refreshes instantly
# All steps must be individually try/except — one failure cannot kill others

# Task: bulk_sync_account(account_id: str)
# Fetches last N emails from provider
# Deduplicates against existing email.message_id values
# Dispatches individual process_email tasks for new ones
# Rate-limited to respect Gmail API quotas (250 quota units/user/second)

# Task: sync_to_calendar(suggested_event_id: str)
# Calls Google Calendar API
# Updates suggested_events.confirmed_at and gcal_event_id
# Handles token refresh if needed
```

#### AI Pipeline (LangChain)

```python
# Implement with LangChain LCEL (Langchain Expression Language):

# Chain 1: Summarization
# - System prompt must enforce exactly 3 bullet points
# - Must handle edge cases: forwarded emails, email threads, non-English
# - Output parser: use Pydantic output parser, not string parsing
# - Fallback: if LLM fails, return ["Summary unavailable"] x3

# Chain 2: Phishing Risk Analysis  
# - Input: email headers dict + body text
# - Deterministic layer first: check SPF/DKIM pass/fail, sender domain mismatch
# - Probabilistic layer: LLM assesses tone for urgency/threats/impersonation
# - Output: RiskScore(level: 'low'|'medium'|'high', reasons: List[str])
# - Must work even if LLM is unavailable (fall back to deterministic only)

# Chain 3: Event Extraction
# - Use dateparser library for robust temporal entity recognition
# - LLM extracts event title, location, description
# - Output: List[EventData(title, start, end, location)] or []
# - Must handle relative dates ("next Thursday") using current date context
```

### 3.4 — Frontend Implementation

#### Design Token Extraction (DO THIS FIRST)

```javascript
// Analyze the existing login page and extract ALL design tokens:
// colors (background, surface, primary, accent, text, border, error, success)
// typography (font families, sizes, weights, line heights)
// spacing scale (if consistent)
// border radius values
// shadow definitions
// transition durations and easings
// Codify as CSS custom properties in src/theme/tokens.css
// Export as JS object in src/theme/tokens.js for use in Tailwind config
```

#### Dashboard Page

```jsx
// Layout: Sidebar (account switcher) + Main (email list) + Detail panel (3-column)
// On mobile: bottom nav + full-screen email view

// EmailList requirements:
// - Infinite scroll (TanStack Query's useInfiniteQuery)
// - Virtual rendering (use @tanstack/react-virtual for 1000+ email performance)
// - Real-time updates via Supabase client subscription
// - Skeleton loading states on initial load (match the exact shape of EmailCard)
// - Filter bar: All / Unread / High Risk / Archived

// EmailCard requirements:
// - Shows: sender avatar (initials fallback), sender, subject, preview, timestamp
// - Risk badge: color-coded dot (green/yellow/red) from risk_score
// - "Analyzing..." state when processing_status == 'pending' with subtle pulse animation
// - Optimistic archive: clicking archive removes card immediately from list
//   (roll back on failure with toast notification)

// EmailDetail requirements:
// - SummaryCard: 3 bullet points in a visually distinct card. Collapsible to show raw.
// - RiskBanner: if risk_score == 'high', full-width banner listing reasons.
//   All links in the email body must be non-clickable until user dismisses banner.
// - SuggestedEvents: if events extracted, show EventCards with "Add to Calendar" button.
// - SSE connection: subscribe to /emails/stream for live status updates.
```

#### Zustand Stores

```javascript
// uiStore:
// - selectedEmailId: string | null
// - sidebarOpen: boolean
// - activeFilter: 'all' | 'unread' | 'high_risk' | 'archived'
// - pendingArchives: Set<string>  (for optimistic UI tracking)
// - calendarModalData: EventData | null
// - toasts: Toast[]
// - Actions: selectEmail, toggleSidebar, setFilter, addPendingArchive, 
//            removePendingArchive, openCalendarModal, pushToast

// authStore:
// - firebaseUser: FirebaseUser | null
// - internalToken: string | null  (our JWT, not Firebase token)
// - linkedAccounts: LinkedAccount[]
// - isLinking: boolean
// - Actions: setFirebaseUser, setInternalToken, addLinkedAccount,
//            removeLinkedAccount, setLinking
```

#### Performance Requirements (HFT mindset applied to UX)

```
These are non-negotiable. Implement each explicitly:

1. VIRTUAL SCROLL: Never render more than ~30 DOM nodes for the email list.
   Use @tanstack/react-virtual. This is how you handle 10,000 emails.

2. ZERO-RERENDER ON UNRELATED STATE: Each EmailCard must be wrapped in 
   React.memo. Archiving email #47 must not re-render email #1.
   Use Zustand's selector pattern to avoid over-subscription.

3. OPTIMISTIC UPDATES: Archive, mark-read, confirm-calendar — all 
   must update UI before the network call resolves. Rollback on failure.

4. PREFETCH ON HOVER: When user hovers an EmailCard for >200ms, 
   prefetch that email's full detail view (TanStack Query prefetchQuery).
   By the time they click, it's already in cache.

5. CODE SPLITTING: Dashboard, Settings pages must be lazy-loaded.
   The login page JS bundle must be under 50KB gzipped.

6. BACKGROUND SYNC: On tab focus (visibilitychange), trigger a 
   lightweight "new emails?" check — not a full refetch.
```

### 3.5 — Security Implementation (Non-Negotiable)

```
Implement every item below. No exceptions.

BACKEND:
□ All endpoints (except /auth/firebase-verify) require valid internal JWT
□ JWT middleware validates signature, expiry, and user exists in DB
□ Rate limiting: 100 req/min per user on /emails, 10 req/min on /auth/*
□ Input validation: all request bodies use Pydantic models with strict types
□ No raw SQL — use parameterized queries / SQLAlchemy ORM
□ OAuth tokens: never logged, never included in API responses, 
  encrypted at rest using Fernet with key from environment
□ CORS: whitelist specific frontend domains only
□ CSP headers on all responses
□ Supabase RLS: test that User A cannot access User B's data even with
  a valid JWT (write a test for this explicitly)

FRONTEND:
□ Firebase token refreshed automatically before API calls
□ No sensitive data stored in localStorage (use sessionStorage or memory)
□ High-Risk email links wrapped in <span> not <a> until warning dismissed
□ XSS: email body rendered via dangerouslySetInnerHTML is FORBIDDEN.
  Use a sanitization library (DOMPurify) or render as plain text only.
```

---

## SECTION 4 — QUALITY STANDARDS

### Code Quality (enforce all)
- TypeScript for the frontend (`.tsx`/`.ts` everywhere, no `any`)
- Python type hints on every function signature
- Pydantic models for all FastAPI request/response schemas
- Error handling: every `async` function must have a `try/except`
- No `console.log` in production code — use a logger (frontend: pino, backend: structlog)
- Docstrings on all service-layer functions

### Testing (implement, don't skip)
```
Backend:
- pytest + httpx for API route tests
- At minimum: test each endpoint's happy path and one error case
- One integration test that exercises the full email processing pipeline

Frontend:
- Vitest + Testing Library
- Test: EmailCard renders correctly in 'pending' state
- Test: Optimistic archive removes email, rollback shows toast on failure
- Test: RiskBanner prevents link clicks on high-risk emails
```

### Error States (every UI state must be designed)
```
Loading  → Skeleton UI (not spinners — skeletons that match content shape)
Empty    → Illustrated empty state ("Your inbox is clear ✓")
Error    → Inline error with retry action (not just a red box)
Offline  → Banner: "You're offline. Showing cached emails."
Degraded → If AI failed: email shows with "Summary unavailable" gracefully
```

---

## SECTION 5 — DELIVERABLES EXPECTED

When you are done, you must have produced:

1. **`/frontend/src/theme/tokens.css`** — Complete design token file
2. **`/frontend/src/`** — Full React application (no placeholders)
3. **`/backend/app/`** — Full FastAPI application (no placeholders)
4. **`/backend/workers/tasks.py`** — All Celery tasks implemented
5. **`/supabase/migrations/001_initial_schema.sql`** — Full schema with RLS
6. **`/docker-compose.yml`** — Local dev environment (Redis + backend + worker)
7. **`/README.md`** — Setup instructions, environment variables reference, architecture diagram (as ASCII or Mermaid)
8. **`/ARCHITECTURE_DECISIONS.md`** — Your architectural review from Section 2. Document every decision you made that deviates from the SRS and why.

---

## SECTION 6 — HOW TO APPROACH THIS (PROCESS)

Follow this exact order. Do not skip steps.

```
STEP 1: Architectural Review (Section 2)
         ↓ Write ARCHITECTURE_DECISIONS.md first
         
STEP 2: Extract design tokens from login page
         ↓ Codify as tokens.css + tokens.js
         
STEP 3: Database schema
         ↓ Write full SQL migration
         
STEP 4: Backend — Config, models, schemas
         ↓ Set up Pydantic Settings, DB models, response schemas
         
STEP 5: Backend — Services (gmail.py, outlook.py, token_manager.py, crypto.py)
         ↓ All external API clients
         
STEP 6: Backend — AI pipeline (ai_pipeline.py, security_analyzer.py)
         ↓ All LangChain chains with error handling
         
STEP 7: Backend — Celery tasks (tasks.py)
         ↓ process_email, bulk_sync, sync_to_calendar
         
STEP 8: Backend — API routes (auth, emails, calendar, health)
         ↓ All endpoints with rate limiting and auth middleware
         
STEP 9: Frontend — Store setup (Zustand + TanStack Query config)
         ↓ uiStore, authStore, query client

STEP 10: Frontend — Components (bottom-up: common → layout → features)
         ↓ All components, no placeholders
         
STEP 11: Frontend — Pages (Login integration, Dashboard, Settings)
         ↓ Wired to real API calls
         
STEP 12: Testing (backend pytest, frontend vitest)
         ↓ At minimum the required tests from Section 4
         
STEP 13: docker-compose.yml + README.md
         ↓ Everything runnable with one command locally
```

---

## SECTION 7 — PERFORMANCE BENCHMARKS TO HIT

These are the numbers that define "production-ready" for UniSync. Your implementation choices should be driven by hitting these:

| Metric | Target | How to achieve it |
|---|---|---|
| Dashboard FCP | < 1.5s | Code splitting, skeleton UI, no blocking renders |
| Email list scroll | 60fps with 5000 emails | @tanstack/react-virtual |
| AI summary latency (p95) | < 8s from ingestion | Celery async, Redis queue, no polling |
| Concurrent email processing | 500/min | Celery concurrency=8+, async workers |
| API response time (p99) | < 200ms for /emails | Cursor pagination, DB indexes, connection pool |
| Time to interactive (cold) | < 3s | Lazy routes, preload key assets |
| Realtime email push delay | < 500ms | Supabase Realtime WebSocket, not polling |

---

## SECTION 8 — FINAL INSTRUCTION

You are not building a demo. You are not building a prototype. You are not building a submission for a grade.

You are building something you would be proud to put your name on as a senior engineer. That means:

- Every edge case handled.
- Every loading state designed.
- Every error recoverable.
- Every performance bottleneck addressed before it becomes a problem.
- Every security vector closed.

The login page exists. Its design language is law. Extend it — don't break it.

Now begin with your **Architectural Review** (Section 2). Think deeply. Be opinionated. Then build.
