# AEGIS-PATCH — System Truth Document
**Last Updated:** 2026-08-01T12:01:00+05:30
**Status:** BUILT — PENDING DEPLOYMENT

---

## 1. Project File Structure

```
/Users/jaimin/R2/
├── system-truth.md                    ← THIS FILE
├── package.json                       # Root workspace config
│
├── backend/
│   ├── package.json                   # [COMPLETE] Dependencies configured
│   ├── server.js                      # [COMPLETE] HTTP + WebSocket entry
│   ├── .env.example                   # [COMPLETE] Environment template
│   ├── src/
│   │   ├── core/
│   │   │   ├── pipeline.js            # [COMPLETE] Main orchestrator
│   │   │   ├── eventBus.js            # [COMPLETE] Shared event emitter
│   │   │   └── config.js              # [COMPLETE] Env + constants
│   │   │
│   │   ├── modules/
│   │   │   ├── repoIngestor.js        # [COMPLETE] Clone + parse
│   │   │   ├── vulnScanner.js         # [COMPLETE] OSV + npm audit
│   │   │   ├── patchSynth.js          # [COMPLETE] LLM patching
│   │   │   ├── regressionEngine.js    # [COMPLETE] Test runner loop
│   │   │   └── prGenerator.js         # [COMPLETE] Git push + PR
│   │   │
│   │   ├── llm/
│   │   │   ├── failoverPipeline.js    # [COMPLETE] 4-tier failover
│   │   │   ├── providers/
│   │   │   │   ├── groq.js            # [COMPLETE] Groq client
│   │   │   │   ├── cerebras.js        # [COMPLETE] Cerebras client
│   │   │   │   └── gemini.js          # [COMPLETE] Gemini client
│   │   │   └── prompts.js             # [COMPLETE] Prompt templates
│   │   │
│   │   └── utils/
│   │       ├── depGraph.js            # [COMPLETE] Lockfile parser
│   │       ├── processRunner.js       # [COMPLETE] Safe exec wrapper
│   │       └── logger.js              # [COMPLETE] Log formatter
│   │
│   └── temp/                          # Cloned repos (gitignored)
│
├── frontend/
│   ├── package.json                   # [COMPLETE] Next.js 16 + TailwindCSS 4
│   ├── next.config.mjs                # [COMPLETE]
│   ├── postcss.config.mjs             # [COMPLETE] @tailwindcss/postcss
│   ├── src/app/
│   │   ├── layout.js                  # [COMPLETE] Inter + JetBrains Mono
│   │   ├── page.js                    # [COMPLETE] Main dashboard
│   │   ├── globals.css                # [COMPLETE] StackScope theme
│   │   └── components/
│   │       ├── UrlInput.jsx           # [COMPLETE]
│   │       ├── Terminal.jsx           # [COMPLETE] ← Star component
│   │       ├── Sidebar.jsx            # [COMPLETE]
│   │       ├── StatusPanel.jsx        # [COMPLETE]
│   │       ├── VulnCard.jsx           # [COMPLETE]
│   │       └── PrResult.jsx           # [COMPLETE]
│   │
│   └── src/lib/
│       ├── useWebSocket.js            # [COMPLETE]
│       └── formatLog.js               # [COMPLETE]
│
└── demo/                              # [DEFERRED] Demo vulnerable repo
```

---

## 2. Build Verification

| Check | Result | Notes |
|---|---|---|
| Backend syntax (17 files) | ✅ PASS | All files pass `node --check` |
| Backend startup | ✅ PASS | Server listens on port 3001 |
| Frontend build | ✅ PASS | Next.js 16 production build succeeds |
| Import resolution | ✅ FIXED | Corrected `../../` → `../` in modules/llm |
| TailwindCSS v4 | ✅ FIXED | `@import "tailwindcss"` syntax |

---

## 3. Module Status Tracker

| Module | Status | Notes |
|---|---|---|
| Root Config | ✅ COMPLETE | package.json workspace |
| Backend Core (config, eventBus, pipeline) | ✅ COMPLETE | Foundation |
| LLM Failover Pipeline | ✅ COMPLETE | 4-tier: Groq-Qwen→Groq-Llama→Cerebras→Gemini |
| LLM Providers (groq, cerebras, gemini) | ✅ COMPLETE | OpenAI-compatible + Gemini REST |
| LLM Prompts | ✅ COMPLETE | Patch + retry templates |
| Module 1: Repo Ingestor | ✅ COMPLETE | simple-git clone --depth 1 |
| Module 1b: Vuln Scanner | ✅ COMPLETE | OSV.dev primary, npm audit fallback |
| Module 2: Patch Synthesizer | ✅ COMPLETE | Override + LLM cold-patch strategies |
| Module 3: Regression Engine | ✅ COMPLETE | npm test w/ 30s timeout, 512MB cap |
| Module 4: PR Generator | ✅ COMPLETE | Octokit PR creation w/ PAT |
| Utils (depGraph, processRunner, logger) | ✅ COMPLETE | Shared utilities |
| Backend Server (HTTP + WS) | ✅ COMPLETE | Raw http.createServer + ws |
| Frontend Layout + Globals | ✅ COMPLETE | StackScope dark theme |
| Frontend Components | ✅ COMPLETE | 6 components with glassmorphism |
| Frontend Hooks + Utils | ✅ COMPLETE | WebSocket hook w/ reconnect |

---

## 4. Data Contracts (Backend ↔ Frontend)

### 4.1 REST: POST /api/patch
**Request:**
```json
{
  "repoUrl": "https://github.com/owner/repo"
}
```
**Response:**
```json
{
  "sessionId": "uuid-v4",
  "status": "started"
}
```

### 4.2 WebSocket Messages (Server → Client)
**Connection:** `ws://backend-host:3001/ws?sessionId={sessionId}`

**Log Event:**
```json
{
  "type": "LOG",
  "sessionId": "uuid-v4",
  "timestamp": "2026-08-01T12:00:00.000Z",
  "stage": "CLONING|SCANNING|PATCHING|TESTING|PUSHING|COMPLETE|ERROR",
  "level": "info|warn|error|success|debug",
  "message": "Cloning repository...",
  "data": {}
}
```

**Stage Change Event:**
```json
{
  "type": "STAGE_CHANGE",
  "sessionId": "uuid-v4",
  "timestamp": "2026-08-01T12:00:00.000Z",
  "from": "CLONING",
  "to": "SCANNING"
}
```

**Vulnerability Found Event:**
```json
{
  "type": "VULN_FOUND",
  "sessionId": "uuid-v4",
  "data": {
    "packageName": "lodash",
    "installedVersion": "4.17.15",
    "patchedVersion": "4.17.21",
    "cveId": "CVE-2020-8203",
    "severity": "high",
    "cvssScore": 7.5,
    "title": "Prototype Pollution"
  }
}
```

**Completion Event:**
```json
{
  "type": "COMPLETE",
  "sessionId": "uuid-v4",
  "data": {
    "prUrl": "https://github.com/owner/repo/pull/42",
    "patchedVulns": 3,
    "testsRun": 42,
    "testsPassed": 42,
    "totalTime": "34.2s",
    "iterations": 2
  }
}
```

**Error Event:**
```json
{
  "type": "ERROR",
  "sessionId": "uuid-v4",
  "message": "Max retry attempts reached",
  "stage": "PATCHING",
  "fatal": true
}
```

---

## 5. Environment Variables

| Key | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | YES | Groq API key (free tier) |
| `GEMINI_API_KEY` | YES | Google Gemini API key (free tier) |
| `CEREBRAS_API_KEY` | YES | Cerebras API key (free tier) |
| `GITHUB_TOKEN` | YES | GitHub PAT with `repo` scope |
| `PORT` | NO | Backend HTTP port (default: 3001) |
| `FRONTEND_URL` | NO | Frontend URL for CORS (default: http://localhost:3000) |
| `MAX_RETRIES` | NO | LLM retry attempts (default: 5) |
| `TEST_TIMEOUT_MS` | NO | npm test timeout (default: 30000) |
| `MAX_MEMORY_MB` | NO | Child process memory limit (default: 512) |

---

## 6. Deployment Architecture

```
┌─────────────────┐       ┌──────────────────┐
│   Vercel         │       │   Render          │
│   (Frontend)     │◄─────►│   (Backend)       │
│   Next.js        │  WS   │   Node.js + WS    │
│   Port: 443      │       │   Port: 3001      │
└─────────────────┘       └──────────────────┘
         │                         │
         │                         ├── OSV.dev API
         │                         ├── Groq API
         │                         ├── Cerebras API
         │                         ├── Gemini API
         │                         └── GitHub API
         │
         └── NEXT_PUBLIC_BACKEND_URL=https://aegis-patch-backend.onrender.com
```

---

## 7. Remaining Work

1. **Deployment configs** — `render.yaml` for backend, Vercel config for frontend
2. **Demo repo** — Create a test repo with known vulnerabilities
3. **E2E testing** — Full pipeline test with API keys
