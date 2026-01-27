# UniSync 📬🤖  
**AI-Powered Unified Communication Platform for Students**

UniSync is a web-based platform designed to centralize and intelligently manage student communication by unifying multiple email accounts, summarizing content using AI, detecting phishing attempts, and automatically syncing important deadlines to calendars.

---

## 🚩 Problem Statement

University students often manage multiple email accounts (personal, academic, internship), leading to:

- Inbox overload and missed deadlines  
- Cognitive fatigue from information overload  
- Increased vulnerability to phishing and scam emails  

Existing email clients lack intelligent prioritization and student-focused automation.

---

## 💡 Solution Overview

UniSync acts as a middleware layer between email providers (Gmail, Outlook) and the user, offering a single intelligent interface for reading, triage, security analysis, and task orchestration.

---

## ✨ Key Features

### 🔐 Unified Authentication
- Login via Email/Password or Google Sign-In
- Link multiple Gmail and Outlook accounts using OAuth 2.0
- Secure token handling without merging identities

### 📥 Unified Inbox Dashboard
- Aggregated inbox view across all linked accounts
- Chronological sorting of emails
- Soft delete (archive) support synced with providers

### 🤖 AI Email Summarization
- LLM-generated summaries for email threads
- Exactly **3 bullet points per summary**
- Cached results to reduce API cost

### 🛡️ Security & Phishing Detection
- Email header analysis (SPF, DKIM, DMARC)
- Content-based phishing detection
- Risk scoring: **Low / Medium / High**
- Warning banners for high-risk emails
- Restricted links until user acknowledgment

### 📅 Automated Calendar Sync
- Extracts dates and times from email text
- Displays suggested events
- One-click sync with Google Calendar
- Visual confirmation upon successful sync

---

## 🏗️ System Architecture (High Level)

- **Frontend:** Single Page Application (SPA)
- **Backend:** RESTful API with asynchronous task processing
- **AI Layer:** LLM-based summarization and threat analysis
- **Database:** Secure storage of metadata and AI outputs

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Zustand (State Management)

### Backend
- Python (FastAPI)
- Celery + Redis (Async Task Queue)

### AI / ML
- LangChain
- OpenAI API (or local LLM via Ollama)

### Authentication & Database
- Firebase Authentication
- Supabase (PostgreSQL)

---

## 🚀 Getting Started

### Prerequisites
- Node.js
- Python 3.10+
- Google & Microsoft OAuth credentials
- OpenAI API key

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/unisync.git

# Frontend setup
cd frontend
npm install
npm run dev

# Backend setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
