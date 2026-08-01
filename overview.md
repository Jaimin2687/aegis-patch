# AEGIS-PATCH — Mentorship Round: Complete Technical Overview

> **Domain 2:** Cybersecurity
> **Problem Statement 1:** Automated Software Supply Chain Vulnerability Patching Engine
> **Live Demo:** [aegis-patch-frontend.vercel.app](https://aegis-patch-frontend.vercel.app)
> **GitHub:** [github.com/Jaimin2687/aegis-patch](https://github.com/Jaimin2687/aegis-patch)
> **Test Repo:** [github.com/Jaimin2687/test-vuln-repo](https://github.com/Jaimin2687/test-vuln-repo)

---

## 1. Problem Statement Breakdown

### What the PS Asks For

The problem statement asks us to build an engine that can:

1. **Ingest** a software project and parse its dependency tree
2. **Detect** known vulnerabilities in both direct and transitive (nested) dependencies
3. **Synthesize** AI-generated patches that fix the vulnerability without breaking existing functionality
4. **Validate** that the patch introduces zero regressions by running the project's own test suite
5. **Deploy** the fix via an automated Pull Request on GitHub

### The Core Challenge

This is NOT a "scan and alert" problem. Tools that scan already exist (Dependabot, Snyk, npm audit). The PS specifically demands **autonomous patching** — the system must:

- Read the actual vulnerable source code
- Understand what the vulnerability is (buffer overflow, injection, prototype pollution, etc.)
- Write a semantically correct code patch
- Prove the patch works by running tests
- Ship it — without any human touching the keyboard

This is an **end-to-end autonomous security pipeline**, not a dashboard that lists CVEs.

### Evaluation Metrics (from the PS)

| Metric | What They're Looking For |
|--------|--------------------------|
| **Build success rate** | Does the patched code still compile/build? |
| **Zero regression errors** | Do all existing tests still pass after patching? |
| **Speed of generation post-CVE** | How fast can we go from "CVE discovered" to "patch ready"? |
| **Depth of nested dependency resolution** | Can we trace vulns deep inside transitive dependency trees, not just top-level? |

---

## 2. Why AEGIS-PATCH is NOT "Just Another Wrapper"

### What a Wrapper Would Look Like

A wrapper would be:
- Call `npm audit` → display results in a UI
- Call ChatGPT API with "fix this code" → paste the response
- No validation, no testing, no deployment

### What AEGIS-PATCH Actually Does

We built **every layer from scratch**:

| Component | Wrapper Approach | Our Approach |
|-----------|-----------------|--------------|
| **Server** | Express.js with middleware | Raw `http.createServer` — zero framework overhead, full control over request lifecycle |
| **Real-time comms** | REST polling every 5 seconds | Native WebSocket (`ws`) with event-driven push — the frontend sees every pipeline step as it happens |
| **Vulnerability detection** | Call `npm audit` and parse | Custom OSV.dev batch API integration with full CVSS v3 score extraction + LLM-powered SAST for languages OSV doesn't cover (C/C++, PHP, Java) |
| **Dependency graph** | Use a library | Custom lockfile parser (`depGraph.js`) that handles `package-lock.json`, `yarn.lock`, `requirements.txt`, `Cargo.lock`, `go.sum` — all async, non-blocking |
| **Patch generation** | Single API call to GPT | 4-tier LLM failover pipeline with dual API key pooling, rate-limit awareness, 12-second Cerebras throttling, and few-shot prompt engineering with 5 curated vulnerability patterns |
| **Validation** | None | Full regression engine that runs the repo's native test suite (`npm test`, `pytest`, `cargo test`) in an isolated workspace and feeds stderr back into the LLM for self-correction |
| **Deployment** | None | Automated git branch creation, commit, push, and GitHub Pull Request generation via Octokit with detailed changelogs |
| **Error handling** | `try/catch` | Self-healing git remote recovery, temp directory auto-cleanup in `finally` blocks, structured analytics telemetry |

### The Key Differentiator: Closed-Loop Autonomy

```
Most tools:  Scan → Alert → Human fixes it

AEGIS-PATCH: Scan → Patch → Test → Self-Correct → Deploy → PR
             ↑________________________________↓ (retry loop)
```

The regression loop is what makes this a real engineering system, not a demo. If the LLM generates a bad patch, we don't just fail — we capture the test stderr, feed it back into the LLM as context, and ask it to try again. Up to 5 iterations. This is **self-correcting AI**.

---

## 3. Competitive Landscape & Our Advantages

### Direct Competitors

| Tool | What It Does | What It Lacks |
|------|-------------|---------------|
| **GitHub Dependabot** | Auto-creates PRs to bump dependency versions | Only bumps versions. Doesn't read/patch source code. Doesn't run tests. Breaks things silently. |
| **Snyk** | Scans for vulns, suggests fixes | Paid. Doesn't auto-patch source code. Doesn't run regression tests. Alert fatigue is massive. |
| **Mend (WhiteSource)** | Enterprise vulnerability management | Expensive ($$$). Workflow is still: scan → ticket → human patches. No autonomy. |
| **Socket.dev** | Supply chain threat detection | Detection only. No patching at all. |
| **Google OSS-Fuzz** | Fuzzing for open-source projects | Finds bugs via fuzzing. Doesn't patch them. Different problem class. |

### Our Competitive Edges

**1. Full Autonomy (Zero Human Intervention)**
Dependabot creates a PR that bumps `lodash` from `4.17.15` → `4.17.21`. But if that version bump introduces a breaking API change, your build fails. Dependabot doesn't know or care.

AEGIS-PATCH reads the actual vulnerable function, generates a drop-in code replacement, and runs your tests to prove it works. If tests fail, it retries with corrected code.

**2. Multi-Language via LLM SAST**
OSV.dev covers npm, PyPI, crates.io, Go. But what about C/C++ buffer overflows? PHP SQL injections? Java deserialization attacks?

We built a **Universal LLM Scanner** — when the ecosystem isn't covered by OSV, we feed the source code directly into the LLM as a Static Application Security Testing (SAST) tool. It finds vulnerabilities that no database has cataloged yet.

**3. Cost: $0**
Every LLM provider we use has a free tier:
- Groq: Free (Qwen 3.6 27B + Llama 3.3 70B)
- Cerebras: Free (GPT-OSS 120B)
- Google Gemini: Free (Gemini 2.5 Flash)
- OSV.dev: Free (Google's open vulnerability database)
- GitHub API: Free (for public repos)

No paid APIs. No enterprise licenses. Fully functional on free tiers with intelligent rate-limit handling.

**4. Resilience: 4-Tier LLM Failover**
If Groq rate-limits (which happens frequently on free tier), most projects would crash. We cascade:

```
Groq Key 1 (Qwen) → Groq Key 2 (Llama) → Cerebras (GPT-OSS) → Gemini (Flash)
       ↓ rate limited        ↓ rate limited         ↓ 12s throttle      ↓ always available
```

Each provider has its own rate-limit detection, retry-after delay parsing, and token quota logging. The user never sees a failure.

---

## 4. Technical Deep Dive: Backend Architecture

### 4.1 Entry Point — `server.js`

```
Raw http.createServer (NO Express, NO framework)
├── POST /api/patch      → Triggers pipeline, returns sessionId
├── GET  /api/history    → Returns last 50 scan records
├── GET  /health         → Uptime, memory, active sessions (for cron keep-alive)
└── WebSocket /ws        → Real-time event streaming per session
```

**Why raw HTTP instead of Express?**
- Zero dependency overhead (Express pulls in 30+ sub-dependencies — ironic for a supply chain security tool)
- Full control over request lifecycle, headers, and streaming
- We implemented our own: rate limiter, CORS validator, body size limiter, security headers

**Security Hardening (OWASP-grade):**

| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options: nosniff` | Prevent MIME sniffing attacks |
| `X-Frame-Options: DENY` | Prevent clickjacking via iframe embedding |
| `X-XSS-Protection: 1; mode=block` | Legacy XSS filter for older browsers |
| `Strict-Transport-Security` | Force HTTPS for 1 year |
| `Content-Security-Policy` | Restrict script/style sources |
| `Referrer-Policy` | Limit data leaked in referrer headers |
| `Permissions-Policy` | Disable camera, mic, geolocation APIs |
| CORS Origin Validation | Only allows `*.vercel.app` and configured origins |
| Body Size Limit (1MB) | Prevents payload flooding |
| UUID v4 Session Validation | Rejects malformed session IDs |
| WebSocket Origin Check | Blocks WS connections from unauthorized origins |
| IP-based Rate Limiter | 5 requests per hour per IP (in-memory, auto-pruning) |

### 4.2 Pipeline Orchestrator — `pipeline.js`

This is the brain. It orchestrates the entire flow:

```
executePipeline(repoUrl, sessionId)
  ├── 1. Clone repo → temp/{sessionId}/
  ├── 2. Detect ecosystem (npm/PyPI/Cargo/Go/Universal)
  ├── 3. Parse lockfile → dependency graph
  ├── 4. Scan via OSV.dev + LLM SAST fallback
  ├── 5. For each vulnerability:
  │     ├── Extract vulnerable source code
  │     ├── Send to LLM Failover Engine
  │     ├── Apply patch to source file
  │     ├── Run test suite (npm test / pytest / cargo test)
  │     ├── If tests fail → feed stderr to LLM → retry (up to 5x)
  │     └── If tests pass → stage for PR
  ├── 6. Git commit, push to new branch
  ├── 7. Create GitHub Pull Request via Octokit
  └── finally: rm -rf temp/{sessionId}/  ← auto-cleanup
```

Every step emits events through the **EventBus** (a shared Node.js `EventEmitter`), which are then broadcast to the frontend via WebSocket in real-time.

**Analytics Telemetry:** Every pipeline run writes structured JSON to `data/analytics.json`:
```json
{
  "cveId": "CVE-2021-23337",
  "provider": "groq",
  "retries": 1,
  "latency": "3.2s",
  "success": true,
  "timestamp": "2026-08-01T..."
}
```

### 4.3 Vulnerability Scanner — `vulnScanner.js`

**Two-tier scanning architecture:**

**Tier 1: OSV.dev Batch Query (Database-backed)**
- Parses the lockfile into a package list
- Sends a single batch POST to `https://api.osv.dev/v1/querybatch` with all packages + versions
- For each hit, fetches the full vulnerability detail from `https://api.osv.dev/v1/vulns/{id}`
- Extracts: CVE ID, GHSA ID, severity, CVSS v3 score, patched version, fix commit URL
- Covers: npm, PyPI, crates.io, Go, Maven, NuGet, RubyGems, Packagist

**Tier 2: Universal LLM SAST (AI-powered)**
- Activated when ecosystem is unknown or OSV finds nothing (C/C++, PHP, Java, mixed repos)
- Collects up to 10 source files (< 100KB each) from the repo
- Sends them to the LLM with a SAST system prompt
- The LLM returns structured JSON: `[{cveId, title, severity, cvssScore, file, snippet}]`
- This catches vulnerabilities that aren't in any database — zero-day level detection

### 4.4 Patch Synthesizer — `patchSynth.js`

**Smart File Discovery Chain:**
```
When patching an npm package vulnerability:
1. Read package.json of the vulnerable package → get "main" field
2. Fallback: "module" field
3. Fallback: index.js
4. Fallback: lib/index.js
5. Fallback: src/index.js
```

This is critical because real packages have non-standard entry points. A naive tool would only try `index.js` and fail on most packages.

### 4.5 LLM Failover Engine — `failoverPipeline.js`

```
Provider Queue:
  [Groq-Key1-Qwen] → [Groq-Key2-Llama] → [Cerebras-GPT-OSS] → [Gemini-Flash]

For each call:
  1. Try current provider
  2. If 429 (rate limit):
     - Parse Retry-After header
     - Log remaining token quota
     - Move to next provider
  3. If Cerebras: enforce 12-second minimum gap between calls
  4. If all fail: throw with full error chain
```

**Few-Shot Prompt Engineering (5 examples baked in):**
- Prototype Pollution fix (lodash `_.merge`)
- Command Injection fix (`child_process.exec`)
- SQL Injection fix (string concatenation → parameterized queries)
- Path Traversal fix (`../` in file paths)
- ReDoS fix (catastrophic backtracking regex)

These examples dramatically improve patch quality because the LLM sees exactly what a "good security patch" looks like before attempting its own.

### 4.6 Regression Engine — `regressionEngine.js`

```
For the patched code:
  1. Detect ecosystem → select test command
     - npm:      npm test
     - PyPI:     pytest / python -m pytest
     - Cargo:    cargo test
     - Go:       go test ./...
  2. Run in isolated workspace with:
     - Timeout: 30 seconds (configurable)
     - Memory limit: 512MB (configurable)
  3. Capture exit code + stdout + stderr
  4. If exit code ≠ 0:
     - Feed stderr into the LLM as "your previous patch broke these tests"
     - Generate corrected patch
     - Re-run tests (up to MAX_RETRIES=5)
  5. If pass → mark vulnerability as "patched"
```

### 4.7 PR Generator — `prGenerator.js`

- Uses `simple-git` for git operations and `Octokit` for GitHub API
- Creates branch: `aegis-patch/fix-{cveId}-{timestamp}`
- Self-healing remote handling: if `aegis-remote` already exists, removes and re-adds
- Detects default branch dynamically (doesn't hardcode `main`)
- PR body includes: CVE ID, severity, what was patched, test results

---

## 5. Technical Deep Dive: Frontend Architecture

### 5.1 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15/16 (Turbopack) | App Router, SSR, file-based routing |
| React | 19 | UI components with hooks |
| Tailwind CSS | v4 | Utility-first styling with `@theme` token registration |
| Clerk | Latest | Authentication (sign-in, user management) |
| Framer Motion | 12.x | Animations, modal transitions, `AnimatePresence` |
| WebSocket (native) | — | Real-time pipeline event streaming |

### 5.2 Key Components

**`useWebSocket.js` (Custom Hook)**
- Manages the WebSocket lifecycle: connect, receive, reconnect, cleanup
- Deduplicates VULN_FOUND events by CVE ID (prevents duplicate cards)
- Resets all state (vulns, logs, stages) when a new session starts
- Strips trailing slashes from the backend URL to prevent connection failures

**`Terminal.jsx` (Star Component)**
- Renders a full terminal emulator-style log viewer
- Smart auto-scroll: automatically follows new logs, but pauses if the user scrolls up to read
- Copy-all-logs button
- Color-coded log levels (INFO=cyan, WARN=amber, ERROR=red)
- Monospace `JetBrains Mono` font for authentic terminal feel

**`VulnCard.jsx` (with Interactive Breakdown Modal)**
- Displays vulnerability cards with severity badges and CVSS gauges
- Click-to-expand: opens a full glassmorphic modal with:
  - Severity & CVSS score visual bar
  - Full vulnerability description from OSV
  - AEGIS-PATCH 4-step resolution plan (visual workflow)
  - One-click CLI upgrade command with copy button
  - Direct link to OSV.dev advisory
- Keyboard accessible: `Escape` to close, body scroll lock, backdrop click dismiss

**`StatusPanel.jsx`**
- Visual pipeline stage indicator (Cloning → Scanning → Patching → Testing → Pushing → Complete)
- Animated transitions between stages
- Error state visualization with red indicators

**Landing Page Components:**
- `Hero.jsx` — Animated hero with gradient mesh, CTA buttons
- `HowItWorks.jsx` — 5-step pipeline visualization with SVG icons
- `Features.jsx` — 6 capability cards with inline SVG icons
- `Architecture.jsx` — Animated flow diagram with glow effects

### 5.3 Design System

- **Dark mode only** — designed for security engineers who live in dark terminals
- **Color palette:** Cyan (#06b6d4) + Indigo (#6366f1) as primary accent pair
- **Typography:** Inter (UI) + JetBrains Mono (code/terminal)
- **Glassmorphism:** `backdrop-blur-xl` with `bg-white/5` overlays
- **Micro-animations:** `framer-motion` spring transitions on cards, modals, and stage changes

---

## 6. Deployment Architecture

```
┌──────────────────────────────────┐         ┌──────────────────────────────────┐
│        Vercel (Frontend)         │         │        Render (Backend)          │
│  Next.js 15 + Clerk Auth         │◄───────►│  Node.js + ws WebSockets         │
│  aegis-patch-frontend.vercel.app │ WS/HTTP │  Port 3001 (Free Tier)           │
│  Auto-deploy on git push         │         │  Auto-deploy on git push         │
└──────────────────────────────────┘         └──────────────────────────────────┘
                                                          │
                                             ┌────────────┼────────────────┐
                                             │            │                │
                                          OSV.dev     LLM APIs         GitHub API
                                         (200k+ CVEs) (3 providers)    (Octokit)
                                                      Groq (Free)      Auto-PR
                                                      Cerebras (Free)
                                                      Gemini (Free)
```

**Keep-alive:** Cron job pings `/health` every 5 minutes to prevent Render free tier sleep.

---

## 7. Team Contributions

| Member | Role | Key Contributions |
|--------|------|-------------------|
| **Jaimin** | Team Lead / Architect | Core pipeline architecture, event-driven orchestrator, deployment configs, project direction, all integration work |
| **Priyansh** | Backend Engineer | Jest test infrastructure, rate limiter, few-shot prompt engineering, analytics telemetry, production documentation |
| **Khush** | Backend + Frontend Engineer | Async lockfile parser, CVSS extraction, smart file discovery, git remote recovery, VulnCard breakdown modal |
| **Harsh** | Frontend Engineer | WebSocket state management, error boundaries, loading skeletons, Tailwind v4 theming, component polish |

---

## 8. Summary: Why This Matters

> The software supply chain is the #1 attack vector in modern cybersecurity. In 2025 alone, supply chain attacks increased by 742% (Sonatype). Tools like Dependabot alert you — but alerts don't write patches. AEGIS-PATCH closes the loop: from CVE detection to verified, tested, deployed code fix — fully autonomously, at zero cost, in under 60 seconds.

**This is not a wrapper. This is an autonomous security engineer.**
