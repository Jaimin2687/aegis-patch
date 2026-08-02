# AEGIS-PATCH — System Truth Document
**Last Updated:** 2026-08-01T16:45:00+05:30
**Status:** PRODUCTION READY — FULLY HARDENED & TESTED (100% TASK COMPLETE)

---

## 1. Project File Structure

```
/Users/jaimin/R2/
├── system-truth.md                    ← THIS FILE
├── task-distribution.md               # [COMPLETE] Team task assignments (100% finished)
├── render.yaml                        # [COMPLETE] Render Cloud Backend deployment config
├── vercel.json                        # [COMPLETE] Vercel Frontend deployment config
├── package.json                       # Root workspace config
├── test-vuln-repo/                    # [COMPLETE] Demo vulnerable target repository for testing
│
├── backend/
│   ├── package.json                   # [COMPLETE] Dependencies configured
│   ├── server.js                      # [COMPLETE] HTTP + WebSocket entry with Rate Limiting & smart CORS
│   ├── .env.example                   # [COMPLETE] Environment template (includes dual Groq keys)
│   ├── tests/                         # [COMPLETE] Jest unit test framework & failover tests
│   ├── data/                          # [COMPLETE] Scan history & pipeline analytics JSON logs
│   ├── src/
│   │   ├── core/
│   │   │   ├── pipeline.js            # [COMPLETE] Main orchestrator w/ finally directory cleanup & telemetry
│   │   │   ├── eventBus.js            # [COMPLETE] Shared event emitter
│   │   │   └── config.js              # [COMPLETE] Env + constants (Qwen-3.6 & GPT-OSS-120b defaults)
│   │   │
│   │   ├── modules/
│   │   │   ├── repoIngestor.js        # [COMPLETE] Clone + async lockfile parsing
│   │   │   ├── vulnScanner.js         # [COMPLETE] OSV.dev + Universal LLM SAST + CVSS extraction
│   │   │   ├── patchSynth.js          # [COMPLETE] Smart file discovery chain + LLM patching
│   │   │   ├── regressionEngine.js    # [COMPLETE] Multi-ecosystem test runner loop
│   │   │   ├── prGenerator.js         # [COMPLETE] Robust git remote recovery + dynamic default branch PRs
│   │   │   └── webScanner.js          # [COMPLETE] 6-module web vulnerability scanner + SSRF protection + AI recommendations
│   │   │
│   │   ├── llm/
│   │   │   ├── failoverPipeline.js    # [COMPLETE] 4-tier failover w/ Rate Limit delay awareness & dual Groq pool
│   │   │   ├── providers/
│   │   │   │   ├── groq.js            # [COMPLETE] Groq client w/ remaining token quota tracking
│   │   │   │   ├── cerebras.js        # [COMPLETE] Cerebras client w/ remaining token quota tracking
│   │   │   │   └── gemini.js          # [COMPLETE] Gemini client
│   │   │   └── prompts.js             # [COMPLETE] Few-shot prompt engineering (5 vulnerability patterns)
│   │   │
│   │   └── utils/
│   │       ├── depGraph.js            # [COMPLETE] Async non-blocking lockfile parser
│   │       ├── processRunner.js       # [COMPLETE] Safe exec wrapper
│   │       └── logger.js              # [COMPLETE] Log formatter
│   │
│   └── temp/                          # Isolated cloned repos (auto-cleaned in pipeline finally block)
│
└── frontend/
    ├── package.json                   # [COMPLETE] Next.js 15/16 + TailwindCSS v4 + Clerk
    ├── next.config.mjs                # [COMPLETE]
    ├── postcss.config.mjs             # [COMPLETE] @tailwindcss/postcss
    ├── src/
    │   ├── app/
    │   │   ├── layout.js              # [COMPLETE] Inter + JetBrains Mono w/ dark mode Clerk overrides
    │   │   ├── page.js                # [COMPLETE] Main dashboard w/ regex validation & loading skeletons
    │   │   ├── dashboard/web-scanner/page.js # [COMPLETE] Web scanner UI w/ real-time SSE stream & findings breakdown
    │   │   ├── globals.css            # [COMPLETE] StackScope theme & Tailwind v4 @theme token registration
    │   │   ├── loading.jsx            # [COMPLETE] Initializing security engine pulse skeleton
    │   │   ├── error.jsx              # [COMPLETE] React application runtime error boundary
    │   │   └── components/
    │   │       ├── UrlInput.jsx       # [COMPLETE] WCAG accessible URL input with git pattern regex
    │   │       ├── Terminal.jsx       # [COMPLETE] Star component w/ smart auto-scroll & copy logs
    │   │       ├── Sidebar.jsx        # [COMPLETE] Dynamic stage badges & responsive layout
    │   │       ├── StatusPanel.jsx    # [COMPLETE] Error stage visualization support
    │   │       ├── VulnCard.jsx       # [COMPLETE] Safe CVSS float formatting & badge colors
    │   │       └── PrResult.jsx       # [COMPLETE]
    │   │
    │   └── lib/
    │       ├── useWebSocket.js        # [COMPLETE] Session state cleanup & vuln CVE deduplication
    │       └── formatLog.js           # [COMPLETE] Safe timestamp and case-insensitive color mapping
    └── public/                        # Static assets
```

---

## 2. Build & Verification Matrix

| Check | Result | Notes |
|---|---|---|
| Backend syntax & start | ✅ PASS | Fully non-blocking async startup on Port 3001 with Rate Limiter |
| Backend Unit Tests | ✅ PASS | Jest framework in `backend/tests/` verifying failover resilience |
| Frontend production build | ✅ PASS | Next.js build clean with zero lint or dependency warnings |
| Smart CORS Security | ✅ PASS | Automatically authorizes `localhost` and `*.vercel.app` origins dynamically |
| Universal SAST Scanner | ✅ PASS | Supports C/C++, Java, PHP, Python, Go, Rust, Node via OSV & LLM fallback |
| Website Vulnerability Scanner | ✅ PASS | 6 modules (Headers, SSL, Tech, Cookies, Info Disclosure, AI) with SSRF defense |
| Multi-LLM Routing | ✅ PASS | Groq Qwen (Key 1/2) → Llama → Cerebras (12s throttling) → Gemini |

---

## 3. Deployment Architecture (Vercel + Render)

```
┌──────────────────────────────┐          ┌───────────────────────────────┐
│   Vercel Cloud (Frontend)    │          │   Render Cloud (Backend)      │
│   Config: vercel.json        │◄────────►│   Config: render.yaml         │
│   Domain: *.vercel.app       │    WS/   │   Runtime: Node.js 18+        │
│   Port: 443 (HTTPS)          │   HTTP   │   Port: 3001                  │
└──────────────────────────────┘          └───────────────────────────────┘
               │                                           │
               │                                           ├── OSV.dev API
               │                                           ├── Groq API (Pool 1 & Pool 2)
               │                                           ├── Cerebras API (Rate limited)
               │                                           ├── Google Gemini API
               │                                           └── GitHub REST API (Octokit)
               │
               └── NEXT_PUBLIC_BACKEND_URL = https://aegis-patch-backend.onrender.com
```

---

## 4. Environment Variables Reference

| Key | Target Service | Required | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Render (Backend) | YES | Primary Groq API Key (Free tier) |
| `GROQ_API_KEY_2` | Render (Backend) | NO (Optional) | Secondary failover pool Groq API Key |
| `CEREBRAS_API_KEY` | Render (Backend) | YES | Cerebras Cloud inference key |
| `GEMINI_API_KEY` | Render (Backend) | YES | Google AI Studio Gemini Flash key |
| `GITHUB_TOKEN` | Render (Backend) | YES | GitHub Personal Access Token (`repo` scope for auto-PR) |
| `PORT` | Render (Backend) | NO | Backend listening port (Default: `3001`) |
| `FRONTEND_URL` | Render (Backend) | NO | Primary CORS host (Dynamically allows Vercel subdomains) |
| `NEXT_PUBLIC_BACKEND_URL` | Vercel (Frontend) | YES | Render Live backend endpoint (e.g., `https://aegis-patch.onrender.com`) |
| `SCANNER_RESTRICT_ACCESS` | Render (Backend) | NO | Set to `true` to enforce user email whitelist restriction |
| `SCANNER_ALLOWED_EMAILS` | Render (Backend) | NO | Comma-separated allowed user emails for scanner access control |
| `SCANNER_RATE_LIMIT_MAX` | Render (Backend) | NO | Maximum web scan requests allowed per rate-limit window (Default: `5`) |

---

## 5. Web Vulnerability Scanner Architecture & APIs

### API Endpoints
- `POST /api/scan-website`: Triggers a web vulnerability audit against a target URL. Accepts `{ url: string }`. Validates URL and checks SSRF protections before execution.
- `GET /api/scan-website/history`: Returns historical audit results logged by the web scanner module.

### EventBus Event Types
- `WEB_SCAN_STAGE`: Emitted when the web scanner transitions between audit stages (`HEADERS`, `SSL`, `TECH`, `COOKIES`, `INFO_DISCLOSURE`, `AI_ANALYSIS`).
- `WEB_SCAN_FINDING`: Emitted whenever a vulnerability, misconfiguration, or security risk finding is identified.
- `WEB_SCAN_COMPLETE`: Emitted upon audit completion containing final metrics, severity counts, and overall security score.

### SSRF Protection Details
- **IP Range Filtering**: Rejects target URLs resolving to internal loopback (`127.0.0.0/8`, `0.0.0.0`), private IPv4 space (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local (`169.254.0.0/16`), and private IPv6 (`fc00::/7`, `fe80::/10`, `::1`).
- **Domain & Metadata Blocking**: Blocks requests targeting `localhost`, `metadata.google.internal`, `169.254.169.254`, `metadata.google.com`, `metadata`, and `.local` / `.internal` TLDs.
- **Pre-execution DNS Verification**: Resolves domain hostnames via `dns.lookup` before dispatching HTTP probes to prevent DNS rebinding attacks against private assets.

---

## 6. Team Audit Completion (August 1, 2026)
- **Harsh (H1-H10):** 100% Complete — Frontend polish, dark mode Clerk overrides, smart auto-scroll, loading skeletons, and state cleanup.
- **Priyansh (P1-P7):** 100% Complete — Jest test infrastructure, rate limiting, few-shot prompt examples, analytics telemetry, and production docs.
- **Khush (K1-K7):** 100% Complete — Async lockfile parser, CVSS scoring extraction, smart package entry discovery, and git remote self-healing.
- **Jaimin:** 100% Complete — Core architecture, pipeline orchestration, deployment configurations, and project direction.
