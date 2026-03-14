# UniSync — Unified Communication Intelligence Platform

> Aggregate Gmail + Outlook inboxes. AI-powered email summarization, phishing detection, and calendar event extraction.

## Architecture

```
┌────────────────┐    ┌──────────────────┐    ┌───────────────┐
│  React + Vite  │───▶│  FastAPI Backend  │───▶│  Supabase DB  │
│  (Port 5173)   │    │   (Port 8000)    │    │  (PostgreSQL) │
└────────────────┘    └──────────────────┘    └───────────────┘
                             │
                      ┌──────┴───────┐
                      ▼              ▼
               ┌───────────┐  ┌───────────────┐
               │  Celery   │  │  Redis Broker  │
               │  Workers  │  │  (Port 6379)   │
               └───────────┘  └───────────────┘
```

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Redis
- Supabase project (free tier works)
- Docker & Docker Compose (optional)

### 1. Clone & Setup

```bash
# Clone
git clone <your-repo-url>
cd UniSync

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your actual values in .env

# Frontend
cd ../frontend
npm install
```

### 2. Database

Run the migration in your Supabase SQL Editor:
```sql
-- Copy and paste supabase/migrations/001_initial_schema.sql
```

### 3. Start Services

**Option A: Docker Compose (recommended)**
```bash
docker compose up --build
```

**Option B: Manual**
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 3: Celery Worker
cd backend && celery -A app.workers.celery_app worker --loglevel=info -Q email_processing,sync,calendar

# Terminal 4: Frontend
cd frontend && npm run dev
```

### 4. Access

- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs (dev mode)
- **Health:** http://localhost:8000/health

## Project Structure

```
UniSync/
├── backend/
│   ├── app/
│   │   ├── config.py                # Pydantic settings
│   │   ├── main.py                  # FastAPI app factory
│   │   ├── models/
│   │   │   ├── db.py                # SQLAlchemy ORM models
│   │   │   └── schemas.py           # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── auth.py              # OAuth + JWT verification
│   │   │   ├── emails.py            # Email CRUD + SSE streaming
│   │   │   ├── calendar.py          # Calendar event endpoints
│   │   │   └── health.py            # Health checks
│   │   ├── services/
│   │   │   ├── token_manager.py     # OAuth token lifecycle
│   │   │   ├── gmail.py             # Gmail API client
│   │   │   ├── outlook.py           # Graph API client
│   │   │   ├── ai_pipeline.py       # LangChain summarization + events
│   │   │   └── security_analyzer.py # Phishing detection (SPF/DKIM/LLM)
│   │   ├── utils/
│   │   │   ├── crypto.py            # Fernet token encryption
│   │   │   ├── rate_limit.py        # slowapi rate limiting
│   │   │   └── circuit_breaker.py   # Tenacity retry + circuit breaker
│   │   └── workers/
│   │       ├── celery_app.py        # Celery configuration
│   │       └── tasks.py             # Background processing tasks
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   └── src/
│       ├── api/                     # TanStack Query hooks
│       ├── store/                   # Zustand state management
│       ├── theme/                   # Design tokens
│       ├── components/              # React components
│       │   ├── layout/              # Shell, Sidebar, TopBar
│       │   ├── inbox/               # EmailCard, EmailList, EmailDetail
│       │   ├── ai/                  # SummaryCard, RiskBanner
│       │   ├── calendar/            # SuggestedEventCard
│       │   └── ui/                  # ToastContainer
│       └── pages/                   # DashboardPage, SettingsPage
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # Full DB schema
└── docker-compose.yml
```

## Key Features

| Feature | Implementation |
|---------|---------------|
| Email Aggregation | Gmail API + Microsoft Graph API |
| AI Summarization | LangChain → OpenAI (GPT-4o-mini) → Ollama fallback |
| Phishing Detection | SPF/DKIM/DMARC headers + LLM tone analysis |
| Calendar Extraction | LLM event parsing + dateparser |
| Background Processing | Celery + Redis (gevent pool) |
| Real-Time Updates | Supabase Realtime + SSE |
| Token Security | Fernet encryption (AES-128-CBC) |
| Virtualized UI | @tanstack/react-virtual (60fps at 5000+ emails) |

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for the full list.

**Required for basic operation:**
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Database & auth
- `REDIS_URL` — Task queue broker
- `TOKEN_ENCRYPTION_KEY` — OAuth token encryption

**Optional (graceful degradation):**
- `OPENAI_API_KEY` — AI features (falls back to deterministic)
- `GMAIL_CLIENT_ID/SECRET` — Gmail integration
- `OUTLOOK_CLIENT_ID/SECRET` — Outlook integration

## License

MIT
