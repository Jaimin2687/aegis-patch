<div align="center">

<br />

```
  █████╗ ███████╗ ██████╗ ██╗███████╗    ██████╗  █████╗ ████████╗ ██████╗██╗  ██╗
 ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝    ██╔══██╗██╔══██╗╚══██╔══╝██╔════╝██║  ██║
 ███████║█████╗  ██║  ███╗██║███████╗    ██████╔╝███████║   ██║   ██║     ███████║
 ██╔══██║██╔══╝  ██║   ██║██║╚════██║    ██╔═══╝ ██╔══██║   ██║   ██║     ██╔══██║
 ██║  ██║███████╗╚██████╔╝██║███████║    ██║     ██║  ██║   ██║   ╚██████╗██║  ██║
 ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝    ╚═╝     ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
```

**An Autonomous Engine for Generative Intelligent Security Patching.**

*Submit a repository. We detect vulnerabilities, synthesize patches, run regression tests, and open Pull Requests — with zero human intervention.*

<br />

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3-orange?style=flat-square&logo=groq)](https://groq.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-blue?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![OSV.dev](https://img.shields.io/badge/OSV.dev-Vulnerability%20DB-red?style=flat-square)](https://osv.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-teal?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## What is AEGIS-PATCH?

AEGIS-PATCH natively **replaces hours of manual vulnerability triage and patching** by acting as an autonomous security engineer. It continuously monitors, identifies, and resolves dependency and code-level vulnerabilities in your JavaScript/Node.js repositories.

You input a GitHub repository URL, and AEGIS-PATCH executes a complete pipeline:

- Generates a **dependency graph** directly from lockfiles
- Cross-references packages against the live **OSV.dev vulnerability database**
- Pipes vulnerable source files into a **4-tier LLM failover engine** to synthesize secure, drop-in replacement code
- Executes local **regression tests** to guarantee the patch doesn't break existing functionality
- Automatically pushes the patched code and **generates a GitHub Pull Request**
- Streams the entire process in real-time to a stunning, **IDE-like dashboard**

---

## ✨ Core Feature Set

### 🧠 4-Tier LLM Failover Engine (High-Availability Patching)
Patch synthesis requires high uptime and deep reasoning. AEGIS-PATCH uses a cascaded fallback architecture to ensure a patch is always generated, even if primary APIs hit rate limits or downtime.
**Routing:** Groq (`llama-3.3-70b-versatile`) → Cerebras → Gemini (`gemini-2.5-flash`).

### 🔍 Deep OSV Scanner
Instead of relying solely on `npm audit`, AEGIS-PATCH parses `package-lock.json` lockfiles directly to build a highly accurate dependency graph. It batches these dependencies and queries the Open Source Vulnerability (OSV.dev) database to extract precise CVSS scores, vulnerable ranges, and CVE identifiers.

### 🛠️ Smart Patch Synthesis
Once a vulnerability is found, AEGIS-PATCH locates the exact vulnerable entry point in the package's source code. It feeds the raw code, the CVE details, and strict constraints into the LLM engine to synthesize a **semantically equivalent but secure** replacement.

### 🛡️ Regression Engine
A patch is useless if it breaks the build. AEGIS-PATCH runs the repository's native test suite (`npm test`, Mocha, Jest) against the newly patched code in an isolated temp directory. If tests fail, it captures the `stderr`, feeds it back into the LLM, and iterates until the tests pass.

### 🔄 Auto-PR Generation
Zero human intervention required. Once the tests pass, AEGIS-PATCH configures a secure remote, commits the patched code to a new branch, pushes to GitHub, and uses the GitHub REST API to open a detailed Pull Request outlining the CVEs fixed, CVSS scores, and testing results.

### 💻 Real-time Execution Dashboard
Watch the autonomous agent work. The Next.js frontend connects via WebSockets to stream the live pipeline logs, current stage indicators (CLONING → SCANNING → PATCHING → TESTING → COMPLETE), and dynamic vulnerability cards showing severity and CVSS scores as they are discovered.

---

## 🛠️ Technology Stack

### ⚡ Backend & Infrastructure
| Layer | Technology |
|---|---|
| Server Runtime | Node.js (Raw `http` + Event-driven architecture) |
| Real-time Comm | `ws` (WebSockets) |
| Orchestration | Native child processes (`execFile`) for safe isolation |
| HTTP Client | `undici` (high-performance fetch) |

### 🎨 Frontend & UI
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Theme | Deep void dark mode, glassmorphism, pulse animations |
| State | React Hooks (`useEffect`, `useState`) + Custom WebSocket hooks |

### 🧠 Intelligence & Data
| Layer | Technology |
|---|---|
| Vulnerability DB | OSV.dev REST API |
| LLM Orchestration | Custom Failover Pipeline (Groq, Cerebras, Gemini) |
| Git Integration | `simple-git` + Octokit (GitHub API) |

---

## 🗺️ Pipeline Architecture

```mermaid
graph TD
    A[Frontend UI] -->|POST Repo URL| B(Pipeline Orchestrator)
    B --> C[Repo Ingestor]
    C -->|Clone & Parse Lockfile| D[Vuln Scanner]
    D -->|OSV.dev Batch Query| E{Vulns Found?}
    E -->|No| F[Complete Pipeline]
    E -->|Yes| G[Patch Synthesizer]
    G -->|Extract vulnerable code| H[LLM Failover Engine]
    H -->|Groq / Cerebras / Gemini| I[Synthesize Patch]
    I --> J[Regression Engine]
    J -->|npm test| K{Tests Pass?}
    K -->|No - retry limit| H
    K -->|Yes| L[PR Generator]
    L -->|Push & Create PR| F
```

---

## 🏗️ Project Structure

```
.
├── backend/
│   ├── server.js                 # HTTP + WebSocket entry point
│   ├── src/
│   │   ├── core/                 # Config, Pipeline Orchestrator, EventBus
│   │   ├── llm/                  # Prompts, Failover logic, Provider integrations
│   │   ├── modules/              # Ingestion, Scanning, Patching, Regression, PRs
│   │   └── utils/                # Logger, Process Runner, depGraph parser
│   └── temp/                     # Isolated clone directories (auto-cleaned)
│
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router (page.js, globals.css, layout)
│   │   ├── components/           # Terminal, StatusPanel, VulnCard, UrlInput
│   │   └── lib/                  # WebSocket hook, Log formatters
│   └── public/                   # Static assets
│
└── task-distribution.md          # Internal team task tracking
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Git** installed and available in PATH
- **GitHub Personal Access Token** (with `repo` scope)
- At least one **LLM API Key** (Groq, Cerebras, or Gemini)

### 1. Clone & Install

```bash
git clone https://github.com/Jaimin2687/aegis-patch.git
cd aegis-patch
```

Install Backend Dependencies:
```bash
cd backend
npm install
```

Install Frontend Dependencies:
```bash
cd ../frontend
npm install
```

### 2. Environment Configuration

In the `backend/` directory, create a `.env` file:

```env
# LLM API Keys (all free tier) - Includes failover pool support
GROQ_API_KEY=gsk_your_primary_key_here
GROQ_API_KEY_2=gsk_your_backup_key_here
GEMINI_API_KEY=AIzaSy_your_key_here
CEREBRAS_API_KEY=csk-your_key_here

# GitHub Personal Access Token (repo scope - needed to open PRs)
GITHUB_TOKEN=ghp_your_token_here

# Server Config
PORT=3001
FRONTEND_URL=http://localhost:3000

# Pipeline Config
MAX_RETRIES=5
TEST_TIMEOUT_MS=30000
MAX_MEMORY_MB=512
```

### 3. Run Locally

You need to run both the backend and frontend simultaneously.

**Start Backend (Port 3001):**
```bash
cd backend
npm start
```

**Start Frontend (Port 3000):**
```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser. Paste a vulnerable repository URL and watch AEGIS-PATCH go to work.

---

## 🌐 Production Deployment (Vercel & Render)

AEGIS-PATCH is pre-configured with `vercel.json` and `render.yaml` for seamless zero-config cloud deployment.

### 1. Deploy Backend to Render (Free Tier)
1. Go to [Render Dashboard](https://dashboard.render.com/) and create a **New Blueprint Instance** (or Web Service).
2. Connect your repository. Render will auto-detect `render.yaml`.
3. In the environment section, enter your secret API keys:
   - `GROQ_API_KEY` and `GROQ_API_KEY_2` (optional backup)
   - `CEREBRAS_API_KEY`
   - `GEMINI_API_KEY`
   - `GITHUB_TOKEN` (Must have `repo` permissions)
4. Deploy! Copy your Backend URL (e.g., `https://aegis-patch-backend.onrender.com`).

### 2. Deploy Frontend to Vercel
1. Import your repository into [Vercel](https://vercel.com/new).
2. In Project Settings, set the **Root Directory** to `frontend` (Vercel auto-configures Next.js parameters via `vercel.json`).
3. Add the following Environment Variable:
   - `NEXT_PUBLIC_BACKEND_URL`: Paste your Render backend URL (e.g., `https://aegis-patch-backend.onrender.com`)
4. Deploy! Your interactive dashboard will instantly connect to your Render daemon over real-time WebSockets.

*(Note: Our intelligent backend CORS configuration dynamically authorizes any verified Vercel preview or production domain automatically!)*

---

<div align="center">

**Built for the modern security architect. Focus on shipping, let AI handle the patching.**

*AEGIS-PATCH — © 2026 All Rights Reserved*

</div>
