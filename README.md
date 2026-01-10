# UniSync
### The Intelligent Command Center for the Modern Scholar.

---

## 🧩 The Challenge: The "Fragmented Scholar"

Modern academic life is spread thin across a fragmented digital landscape. Students today don't just have one inbox; they juggle Gmail, Outlook, and University `.edu` accounts. This fragmentation creates three critical friction points:

### 🧠 Context-Switching Fatigue
The constant "platform hopping" between personal and academic accounts leads to immediate **Information Overload**. Every jump between interfaces incurs a cognitive cost, draining focus and causing students to miss critical academic deadlines simply because they were in the "wrong" tab.

### 📉 Actionable Data Loss
Communication is a stream, but tasks are static. Current email clients suffer from **Actionable Data Loss**, where vital deadlines and tasks remain buried in long, convoluted threads. The moment an email is marked as read, the "action item" effectively disappears, forcing the user to manually "detect and extract" information later.

### 🛡️ The Educational Security Gap
Traditional spam filters are "silent protectors." They move threats to a folder without explanation, leaving students in the dark. This creates a **Security Gap** where users never learn to recognize sophisticated phishing patterns. Without an intelligent triage system, the inbox remains a high-risk archive rather than a productive command center.

---

## ✨ The Solution: Intelligent Inbox Orchestration

**[UniSync]** isn't just another email client; it’s an AI-powered command center designed to bridge the gap between communication and execution. By centralizing fragmented accounts and applying intelligent triage, it restores cognitive flow to the modern student.

### 🧬 Unified Neural Workspace
Stop the tab-switching cycle. We aggregate Gmail, Outlook, and `.edu` accounts into a single, cohesive stream. Using a unified schema, we treat every account as a data source, allowing you to search and manage your entire digital life from one minimalist interface.

### ⚡ Smart Extraction Engine
Transform passive reading into active doing. Our **Context-Aware Extraction** (powered by **LangChain**) automatically identifies:
* **Deadlines:** Syncs assignment dates directly to your calendar.
* **Action Items:** Converts vague requests into a prioritized Todo list.
* **Key Contacts:** Highlights emails from professors and TAs, ensuring high-priority academic updates never stay "buried."

### 🎓 Explainable Security (XAI)
We close the security gap by making threat detection a learning experience. Instead of silently moving mail to spam, our **Transparent Triage** system flags suspicious emails with educational overlays:
* **Pattern Analysis:** Explains *why* an email was flagged (e.g., "Lookalike domain detected").
* **Phishing Insights:** Breaks down common social engineering tactics in real-time.

---

## 🛠️ Tech Stack: The Architecture of Intelligence

This project utilizes a high-concurrency, distributed architecture designed to handle real-time data orchestration and complex AI workloads.

| Domain | Description |
| :--- | :--- |
| **🎨 Frontend & Design** | Crafting a seamless, high-fidelity user experience across web and mobile platforms. |
| **⚙️ Backend & Orchestration** | Managing high-frequency data streams and sophisticated AI agent workflows. |
| **🗄️ Database & Security** | Ensuring data integrity and real-time synchronization with a scalable relational core. |

---

## 🏗️ How It Works

### 1. The Visual Layer (React/Flutter)
The user interacts with a clean, CSS-optimized dashboard. **React** handles the web interface while **Flutter** ensures a native mobile experience. Both consume a unified API, ensuring state consistency across devices.

### 2. The API Gateway (Node.js)
**Node.js** acts as the traffic controller. It handles user authentication, maintains real-time WebSocket connections for new email alerts, and routes heavy computational requests to the AI microservice.

### 3. The Intelligence Core (Python + FastAPI + LangChain)
This is the "Brain." When a new email arrives:
1.  **FastAPI** receives the payload.
2.  **LangChain agents** parse the text, extracting entities (Dates, Tasks, Urgent Keywords).
3.  The agent runs a security check against known phishing patterns and returns a structured risk score.

### 4. The Memory (Supabase)
All processed data—emails, extracted tasks, and security logs—are stored in **Supabase**. We utilize **Row Level Security (RLS)** to ensure that student data remains private and isolated.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v16+)
* Python (v3.9+)
* Supabase Account

### Installation

**1. Clone the repository**
```bash
git clone [https://github.com/Omerta-Ops/UniSync.git]
cd project-name
```

2. Setup Backend (Node.js)

3. Setup AI Service (Python/FastAPI)

4. Setup Frontend
