# UniSync — Unified Communication Intelligence Platform

> Aggregate Gmail + Outlook inboxes. AI-powered email summarization, phishing detection, and calendar event extraction.


# UniSync

### The Intelligent Command Center for the Modern Scholar

---

## The Challenge: The "Fragmented Scholar"

Modern academic life is spread thin across a fragmented digital landscape. Students today don't just have one inbox; they juggle Gmail, Outlook, and University `.edu` accounts. This fragmentation creates three critical friction points:

### Context-Switching Fatigue

The constant platform hopping between personal and academic accounts leads to immediate **Information Overload**. Every jump between interfaces incurs a cognitive cost, draining focus and causing students to miss critical academic deadlines simply because they were in the wrong tab.

### Actionable Data Loss

Communication is a stream, but tasks are static. Current email clients suffer from **Actionable Data Loss**, where vital deadlines and tasks remain buried in long, convoluted threads. The moment an email is marked as read, the action item effectively disappears, forcing the user to manually detect and extract information later.

### The Educational Security Gap

Traditional spam filters are silent protectors. They move threats to a folder without explanation, leaving students in the dark. This creates a **Security Gap** where users never learn to recognize sophisticated phishing patterns. Without an intelligent triage system, the inbox remains a high-risk archive rather than a productive command center.

---

## The Solution: Intelligent Inbox Orchestration

**UniSync** isn’t just another email client; it’s an AI-powered command center designed to bridge the gap between communication and execution. By centralizing fragmented accounts and applying intelligent triage, it restores cognitive flow to the modern student.

### Unified Neural Workspace

Aggregate Gmail, Outlook, and `.edu` accounts into a single cohesive stream. Using a unified schema, UniSync treats every account as a data source—allowing you to search and manage your entire digital life from one minimalist interface.

### Smart Extraction Engine
Turn passive reading into actionable workflows with context-aware extraction, powered by LangChain.

* **Deadlines:** Automatically sync assignment dates to your calendar
* **Action Items:** Convert vague requests into a prioritized task list
* **Key Contacts:** Highlight emails from professors and TAs so critical updates never get buried

### Explainable Security (XAI)

Instead of silently filtering threats, UniSync teaches users how to recognize them:

* **Pattern Analysis:** Explains *why* an email was flagged (e.g., lookalike domains)
* **Phishing Insights:** Breaks down social engineering tactics in real time

---

## Tech Stack: The Architecture of Intelligence

| Domain                      | Description                                         |
| --------------------------- | --------------------------------------------------- |
| **Frontend & Design**       | High-fidelity UI across web and mobile platforms    |
| **Backend & Orchestration** | High-concurrency APIs and AI workflow routing       |
| **Database & Security**     | Scalable relational core with strict data isolation |

---

## How It Works

### 1. Visual Layer (React / Flutter)

A clean, CSS-optimized dashboard.

* **React** powers the web interface
* **Flutter** delivers native mobile experiences
  Both consume a unified API for consistent state across devices.

### 2. API Gateway (Node.js)

Acts as the traffic controller:

* User authentication
* WebSocket-based real-time email alerts
* Routing AI workloads to the intelligence core

### 3. Intelligence Core (Python + FastAPI + LangChain)

The system’s brain:

1. FastAPI receives incoming email payloads
2. LangChain agents extract dates, tasks, urgency, and entities
3. Security agents assess phishing patterns and generate a structured risk score

### 4. Memory Layer (Supabase)

All processed data is stored securely:

* Emails
* Extracted tasks
* Security logs

Uses **Row Level Security (RLS)** to guarantee student data isolation and privacy.

---

## Getting Started

### Prerequisites

* Node.js (v16+)
* Python (v3.9+)
* Supabase account

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/Omerta-Ops/UniSync.git
cd UniSync
```

#### 2. Setup Backend (Node.js)

```bash
cd backend
npm install
npm run dev
```

#### 3. Setup AI Service (Python / FastAPI)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

#### 4. Setup Frontend

```bash
cd frontend
npm install
npm start
```

---

## Contributors

We sincerely thank the individuals who contributed to building **UniSync**:

* **[Bhavya Agarwal](https://github.com/bhavyawork121)**  Authentication & Database
* **[Arin Dixit](https://github.com/ArinDixit06)**  Backend AI Archetecture
* **[Diwanshu Yadav](https://github.com/DiwanshuYadav)**  Backend Core & API Handling
* **[Akanksha Anand](https://github.com/Akanksha-Anand1)**  UI/UX Designing and Documentation
* **[Khyati Sharma](https://github.com/Khyatishxrma)**  Frontend 
* **[Ojasvi Singh](https://github.com/Ojasviisinghh)**  Frontend

---

## Future Enhancements

* LMS integrations (Moodle, Canvas, Blackboard)
* Priority-based inbox scoring
* Offline-first mobile experience
* Institution-wide phishing awareness analytics

---






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
