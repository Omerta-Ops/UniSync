
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




