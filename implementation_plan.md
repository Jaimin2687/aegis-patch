# AEGIS-PATCH: Autonomous Software Supply Chain Vulnerability Patching Engine
**InnovaHack Chapter 1 — Round 2 (Cybersecurity PS-1)**

---

## Problem & What We're Building

The hackathon PS asks for an **automated daemon** that:
1. Parses active project dependency trees (including nested/transitive deps)
2. Safely clones the code
3. Synthesizes backported security fixes **without breaking public APIs**
4. Runs regressions
5. Generates a verified pull request

**Evaluation Metrics** (from the PS image):
- **Build success rate** — our patches must not break the build
- **Zero regression errors** — `npm test` must pass
- **Speed of generation** post-CVE identification — latency matters
- **Depth of nested dependency resolution** — we must resolve transitive vulns

We're essentially building a **Google Jules-like agent** specialized for security patching.

---

## User Review Required

> [!IMPORTANT]
> **API Keys Required**: You will need to provide the following API keys before we can run the system:
> - `GROQ_API_KEY` — Free at [console.groq.com](https://console.groq.com)
> - `GEMINI_API_KEY` — Free at [aistudio.google.com](https://aistudio.google.com)
> - `CEREBRAS_API_KEY` — Free at [inference.cerebras.ai](https://inference.cerebras.ai)
> - `GITHUB_TOKEN` — Personal Access Token with `repo` scope

> [!WARNING]
> **Monorepo vs Separate Repos**: The plan below uses a **monorepo** structure with the Node.js backend daemon and Next.js frontend in the same repo under `/backend` and `/frontend`. This simplifies development for a hackathon. Confirm if this is acceptable.

> [!IMPORTANT]
> **LLM Model Selection**: Based on research, the optimal free-tier failover chain is:
> 1. **Groq → Qwen 2.5 Coder 32B** (fastest code-specific model, ~500 tok/s, 30 RPM)
> 2. **Groq → Llama 3.3 70B** (broader reasoning, 30 RPM)
> 3. **Cerebras → Llama 3.3 70B** (1000-3000 tok/s, 1M tokens/day free, no credit card)
> 4. **Google Gemini → Gemini 2.5 Flash** (reliable fallback, generous free tier)
>
> This is a **4-tier failover** using 3 providers. Cerebras is a better addition than multiple Groq-Qwen slots because it's a completely different provider (no shared rate limits). Please confirm this chain.

## Open Questions

> [!IMPORTANT]
> 1. **Demo Repo**: Do you have a specific "vulnerable repo" prepared for the demo? If not, should I create one with planted vulnerabilities (e.g., an Express app using an old `lodash` with known Prototype Pollution CVE)?
> 2. **Deployment**: Will this be demoed locally (localhost), or do you need deployment to a VPS/Railway? This affects the WebSocket architecture.
> 3. **GitHub App vs PAT**: For the PR creation, are we using a simple Personal Access Token, or do you want a proper GitHub App identity (e.g., "AEGIS-PATCH Bot")?

---

## Research Summary: Architecture & Latency Analysis

### How We Achieve Minimum Latency

The PS specifically scores **"speed of generation post-CVE identification"**. Here's the latency breakdown of the entire pipeline and how we optimize each stage:

| Stage | Naive Latency | Optimized Latency | Optimization |
|---|---|---|---|
| Repo Clone | 5-30s | **2-5s** | `--depth 1 --single-branch` shallow clone |
| Dependency Parse | 500ms | **<50ms** | Stream-parse `package-lock.json`, skip `JSON.parse` for huge files |
| Vulnerability Scan | 3-5s (npm audit) | **200-500ms** | Use OSV.dev batch API directly (no auth, free, fast) instead of `npm audit` subprocess |
| LLM Patch Gen | 2-8s | **800ms-2s** | Groq LPU at 500 tok/s; pre-warmed HTTP connections via `undici.Pool` |
| Test Execution | 5-30s | **5-30s** | Hard floor — depends on test suite. We add 30s timeout + `--max-old-space-size=512` |
| PR Generation | 1-3s | **500ms-1s** | Pre-authenticated Octokit with connection keep-alive |

**Total best-case (single iteration):** ~8-38s from URL input to PR link.
**Total with 1 retry:** ~13-68s.

### Key CS Principles Applied

1. **Event-Driven Architecture** — Node.js event loop handles I/O concurrency natively. WebSocket streaming is non-blocking.
2. **Pipeline Pattern** — Each module feeds into the next via an EventEmitter bus. Stages can be composed and retried independently.
3. **Circuit Breaker / Failover** — The LLM tier uses an array-based round-robin with 429 detection. On rate limit, it instantly switches providers (no waiting).
4. **Backpressure Handling** — WebSocket log buffer with a max of 1000 lines; oldest dropped first.
5. **Lazy Evaluation** — We don't parse the full `node_modules` tree. We parse `package-lock.json` (which is a flat map in v3) and query only affected packages against OSV.
6. **Resource Isolation** — `child_process.execFile` (not `exec`) with strict timeouts, memory caps, and `--ignore-scripts` for `npm ci`.

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AEGIS-PATCH SYSTEM                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend                          │   │
│  │  ┌──────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │  URL     │  │  Terminal Stream  │  │   PR Result      │   │   │
│  │  │  Input   │──│  (WebSocket)     │──│   Display         │   │   │
│  │  └──────────┘  └──────────────────┘  └──────────────────┘   │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │ WebSocket (ws)                        │
│  ┌──────────────────────────┴───────────────────────────────────┐   │
│  │                    Node.js Backend Daemon                     │   │
│  │                                                               │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌────────────┐  │   │
│  │  │ Module 1 │→│ Module 2  │→│  Module 3   │→│  Module 4   │  │   │
│  │  │ Ingest & │  │ LLM Patch │  │  Recursive  │  │  PR Gen    │  │   │
│  │  │ Parse    │  │ Synth     │  │  Regression │  │  (Octokit) │  │   │
│  │  └─────────┘  └──────────┘  └────────────┘  └────────────┘  │   │
│  │       │              ↑              │                         │   │
│  │       │              └──── RETRY ───┘                         │   │
│  │                                                               │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │              LLM Failover Pipeline                    │    │   │
│  │  │  Groq(Qwen) → Groq(Llama) → Cerebras → Gemini       │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  │                                                               │   │
│  │  ┌──────────────────────────────────────────────────────┐    │   │
│  │  │              Event Bus (EventEmitter)                  │    │   │
│  │  │  Broadcasts logs to WebSocket + internal state         │    │   │
│  │  └──────────────────────────────────────────────────────┘    │   │
│  └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### Project Structure

```
/Users/jaimin/R2/
├── system-truth.md              # Project state tracker (per your directive)
├── package.json                 # Root workspace config
│
├── backend/
│   ├── package.json
│   ├── server.js                # Entry point: HTTP + WebSocket server
│   ├── src/
│   │   ├── core/
│   │   │   ├── pipeline.js      # Main orchestrator (Module 1→2→3→4)
│   │   │   ├── eventBus.js      # Shared EventEmitter for logging
│   │   │   └── config.js        # Environment config & constants
│   │   │
│   │   ├── modules/
│   │   │   ├── repoIngestor.js  # Module 1: Clone + parse deps
│   │   │   ├── vulnScanner.js   # Module 1b: OSV.dev + npm audit
│   │   │   ├── patchSynth.js    # Module 2: LLM patch generation
│   │   │   ├── regressionEngine.js  # Module 3: Test runner loop
│   │   │   └── prGenerator.js   # Module 4: Git push + Octokit PR
│   │   │
│   │   ├── llm/
│   │   │   ├── failoverPipeline.js  # 4-tier LLM failover engine
│   │   │   ├── providers/
│   │   │   │   ├── groq.js      # Groq API client
│   │   │   │   ├── cerebras.js  # Cerebras API client
│   │   │   │   └── gemini.js    # Gemini API client
│   │   │   └── prompts.js       # All LLM prompt templates
│   │   │
│   │   └── utils/
│   │       ├── depGraph.js      # package-lock.json parser
│   │       ├── processRunner.js # Safe child_process wrapper
│   │       └── logger.js        # Structured log formatter
│   │
│   └── temp/                    # Cloned repos live here (gitignored)
│
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── app/
│   │   ├── layout.js            # Root layout with Inter font
│   │   ├── page.js              # Main dashboard page
│   │   ├── globals.css          # Global styles (StackScope theme)
│   │   └── components/
│   │       ├── UrlInput.jsx     # GitHub URL input with validation
│   │       ├── Terminal.jsx     # Live WebSocket terminal stream
│   │       ├── Sidebar.jsx      # Navigation sidebar (256px)
│   │       ├── StatusPanel.jsx  # Pipeline progress tracker
│   │       ├── VulnCard.jsx     # Vulnerability detail card
│   │       └── PrResult.jsx     # Final PR link display
│   │
│   └── lib/
│       ├── useWebSocket.js      # WebSocket hook with reconnection
│       └── formatLog.js         # Log colorization utility
│
└── demo/
    └── vulnerable-repo/         # Pre-built demo repo with planted CVE
```

---

### Component Details

---

#### Backend — Core Infrastructure

##### [NEW] backend/server.js
- Creates an HTTP server (Express-free, raw `http.createServer` for minimal overhead)
- Mounts WebSocket server (`ws` library — lighter than socket.io, sufficient for log streaming)
- Single POST endpoint: `/api/patch` — accepts `{ repoUrl: string }`
- Broadcasts pipeline events to all connected WebSocket clients

##### [NEW] backend/src/core/pipeline.js
- The **main orchestrator** — chains Module 1 → 2 → 3 → 4
- Implements the retry loop: Module 3 failure → capture stderr → feed back to Module 2
- Max 5 retry iterations (configurable) to prevent infinite loops
- Emits structured events to the EventBus at each stage transition

##### [NEW] backend/src/core/eventBus.js
- Singleton `EventEmitter` instance shared across all modules
- Event types: `LOG`, `STAGE_CHANGE`, `ERROR`, `COMPLETE`
- Each event includes: `{ timestamp, stage, level, message, data? }`

##### [NEW] backend/src/core/config.js
- Loads environment variables from `.env`
- Defines constants: `MAX_RETRIES=5`, `TEST_TIMEOUT_MS=30000`, `MAX_MEMORY_MB=512`
- LLM provider configs (endpoints, model names, rate-limit thresholds)

---

#### Backend — Module 1: Repository Ingestion & Vulnerability Scanner

##### [NEW] backend/src/modules/repoIngestor.js
- **Clone**: Uses `simple-git` with `--depth 1 --single-branch` for fastest clone
- **Parse**: Reads `package-lock.json` and builds a flat dependency map using `backend/src/utils/depGraph.js`
- **Output**: `{ repoPath, dependencies: Map<name, { version, path, isDirect }> }`

##### [NEW] backend/src/modules/vulnScanner.js
- **Primary**: Sends dependency list to **OSV.dev batch API** (`POST /v1/querybatch`) — free, no auth, fast
- **Fallback**: If OSV fails, runs `npm audit --json` as subprocess
- **Enrichment**: For each vulnerability found, fetches full details from OSV (`GET /v1/vulns/{id}`) to get:
  - CVE ID, GHSA ID
  - Severity & CVSS score
  - `firstPatchedVersion` — critical for knowing if an upgrade path exists
  - `references.type === "FIX"` — the actual fix commit URL
- **Output**: Array of `VulnReport` objects:
  ```
  {
    packageName, installedVersion, patchedVersion,
    cveId, ghsaId, severity, cvssScore,
    vulnerableFilePath,    // from nodes in npm audit
    fixCommitUrl,          // from OSV references
    cweType                // e.g., CWE-1321
  }
  ```

##### [NEW] backend/src/utils/depGraph.js
- Parses `package-lock.json` v3 `packages` object
- Builds a flat map: `packagePath → { name, version, dependencies }`
- Calculates nesting depth for each package (counts `node_modules/` segments)
- Identifies the **deepest** vulnerable package to satisfy "depth of nested dependency resolution" metric

---

#### Backend — Module 2: LLM Patch Synthesizer

##### [NEW] backend/src/modules/patchSynth.js
- **Context Assembly**: For each vulnerability:
  1. Reads the vulnerable source file from `node_modules/`
  2. If a fix commit URL exists (from OSV), fetches the diff from GitHub API to provide as reference
  3. Constructs a structured prompt (see `prompts.js`)
- **Patch Generation**: Calls `failoverPipeline.generate(prompt)` → receives patched code
- **Patch Application**: Writes the patched code back to the file in `node_modules/`
- **Multi-Strategy Approach** (in priority order):
  1. **Version Override**: If `patchedVersion` exists, add `overrides` to `package.json` and run `npm install`
  2. **Fix Commit Replay**: If a fix commit diff is available, apply it via LLM-guided transformation
  3. **LLM Cold Patch**: No reference available — LLM generates fix from CWE description + vulnerable code

##### [NEW] backend/src/llm/failoverPipeline.js
- **Core Architecture**: Array-based failover with instant provider switching
  ```
  providers = [
    { name: 'groq-qwen',    client: GroqClient,     model: 'qwen-2.5-coder-32b' },
    { name: 'groq-llama',   client: GroqClient,     model: 'llama-3.3-70b-versatile' },
    { name: 'cerebras',     client: CerebrasClient,  model: 'llama-3.3-70b' },
    { name: 'gemini',       client: GeminiClient,    model: 'gemini-2.5-flash' }
  ]
  ```
- **429 Detection**: On HTTP 429, immediately advance to next provider. Log the rate-limit event.
- **Error Handling**: On non-429 errors (500, timeout), retry same provider once, then advance.
- **Pre-warmed Connections**: Uses `undici.Pool` with `pipelining: 1` and `keepAliveTimeout: 60000` for each provider
- **Response Extraction**: Strips markdown code fences, validates the output is syntactically valid JS

##### [NEW] backend/src/llm/providers/groq.js
- OpenAI-compatible HTTP client pointing to `https://api.groq.com/openai/v1/chat/completions`
- Headers: `Authorization: Bearer ${GROQ_API_KEY}`
- Parses `x-ratelimit-remaining-tokens` header to predict rate limits before hitting them

##### [NEW] backend/src/llm/providers/cerebras.js
- OpenAI-compatible HTTP client pointing to `https://api.cerebras.ai/v1/chat/completions`
- Same interface as Groq provider (polymorphic)

##### [NEW] backend/src/llm/providers/gemini.js
- Uses Google Generative AI REST API: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- API key passed as query param: `?key=${GEMINI_API_KEY}`

##### [NEW] backend/src/llm/prompts.js
- **Patch Prompt Template**:
  ```
  You are a security engineer. Rewrite the following function to patch {cveId} ({cweType}).

  CONSTRAINTS:
  - You MUST preserve the existing public API signature (function name, parameters, return type).
  - You MUST NOT add new dependencies or imports.
  - Return ONLY the complete patched file content. No explanations.

  VULNERABLE CODE:
  ```{language}
  {vulnerableCode}
  ```

  {fixCommitDiff ? `REFERENCE FIX DIFF:\n${fixCommitDiff}` : ''}

  CVE DESCRIPTION: {cveDescription}
  ```
- **Retry Prompt Template** (when `npm test` fails):
  ```
  The previous patch failed regression testing.
  
  TEST ERROR OUTPUT:
  ```
  {stderrOutput}
  ```
  
  YOUR PREVIOUS PATCH:
  ```{language}
  {previousPatch}
  ```
  
  Fix the regression while still patching {cveId}. Return ONLY the complete patched file content.
  ```

---

#### Backend — Module 3: Recursive Regression Engine

##### [NEW] backend/src/modules/regressionEngine.js
- **Install**: Runs `npm ci --ignore-scripts` via `execFile` (not `exec` — no shell injection risk)
  - `--ignore-scripts` prevents malicious `postinstall` hooks in the cloned repo
- **Test**: Runs `npm test` via `execFile` with:
  - `timeout: 30000` (30 seconds hard kill)
  - `maxBuffer: 10 * 1024 * 1024` (10MB output buffer)
  - `env: { NODE_OPTIONS: '--max-old-space-size=512' }` (memory cap)
- **Result Parsing**: Captures `stdout` (test results) and `stderr` (errors)
- **Loop Logic**:
  - If exit code === 0 → **PASS** → proceed to Module 4
  - If exit code !== 0 → **FAIL** → extract stderr, emit `RETRY` event, return to Module 2 with error context
  - Track iteration count; abort after `MAX_RETRIES` (default 5)

##### [NEW] backend/src/utils/processRunner.js
- Safe wrapper around `child_process.execFile`
- Returns a Promise with `{ exitCode, stdout, stderr, timedOut, killedByMemory }`
- Handles edge cases: zombie processes, SIGKILL after SIGTERM timeout, buffer overflow

---

#### Backend — Module 4: PR Generator

##### [NEW] backend/src/modules/prGenerator.js
- **Branch**: Creates `aegis-patch/cve-{cveId}-{timestamp}` via `simple-git`
- **Commit**: Stages all changes with message `fix: patch {cveId} in {packageName}`
- **Push**: Pushes to origin with `--set-upstream`
- **PR**: Uses `@octokit/rest` to create PR with:
  - Title: `🛡️ AEGIS-PATCH: Fix {cveId} in {packageName}`
  - Body: Structured markdown with CVE details, regression results, before/after code snippets
- **Git Config**: Sets `user.name = "AEGIS-PATCH Bot"` and `user.email = "aegis-patch@bot.dev"`

---

#### Frontend — Next.js Terminal Dashboard (StackScope Design)

##### [NEW] frontend/app/globals.css
- StackScope design system implementation:
  - CSS custom properties for all colors (`--bg-void: #000000`, `--surface: #0a0a0a`, etc.)
  - Custom 4px scrollbar styling
  - Glassmorphism utility classes
  - Terminal text color classes (`.log-info`, `.log-warn`, `.log-error`, `.log-success`)

##### [NEW] frontend/app/layout.js
- Root layout with Inter font from Google Fonts
- Dark theme `<html>` with `#000000` background
- Meta tags for SEO

##### [NEW] frontend/app/page.js
- Main dashboard: 2-column layout (sidebar + content)
- State machine: `IDLE` → `CLONING` → `SCANNING` → `PATCHING` → `TESTING` → `PUSHING` → `COMPLETE`
- WebSocket connection via custom hook

##### [NEW] frontend/app/components/Sidebar.jsx
- Fixed 256px sidebar with navigation
- Active module indicator with indigo glow dot (`#6366f1` with box-shadow)
- Links: Dashboard, Scan History, Settings (placeholder)
- "Pro" badge with emerald accent (`#10b981`)

##### [NEW] frontend/app/components/UrlInput.jsx
- GitHub URL input field with dark theme
- Regex validation for `https://github.com/{owner}/{repo}` format
- Primary white button "Start Patching →"
- Loading spinner state during pipeline execution

##### [NEW] frontend/app/components/Terminal.jsx
- **The star component** — full-width terminal display
- Receives logs via WebSocket in real-time
- Color-coded lines:
  - 🟡 Yellow (`#f59e0b`) — cloning, installing
  - 🔴 Red (`#ef4444`) — errors, test failures
  - 🟢 Green (`#10b981`) — success, PR created
  - ⚪ White (`#ffffff`) — info, general logs
  - 🔵 Blue (`#6366f1`) — LLM operations
- Auto-scrolls to bottom with smooth scroll
- Monospace font (`JetBrains Mono` or `Fira Code`)
- Line numbers in muted gray

##### [NEW] frontend/app/components/StatusPanel.jsx
- Horizontal pipeline progress tracker
- 6 stages with connecting lines
- Current stage pulses with animation
- Completed stages show green checkmark

##### [NEW] frontend/app/components/VulnCard.jsx
- Card displaying discovered vulnerability details
- Severity badge (critical/high/moderate/low) with color coding
- CVE ID, package name, installed vs patched version
- StackScope card styling (rounded-xl, gradient bg, faint border)

##### [NEW] frontend/app/components/PrResult.jsx
- Success state card with PR URL
- "View Pull Request →" button linking to GitHub
- Build success badge, test count, regression status

##### [NEW] frontend/lib/useWebSocket.js
- Custom React hook for WebSocket connection
- Exponential backoff reconnection (1s → 2s → 4s → 8s, max 30s)
- Connection status: `CONNECTING`, `OPEN`, `CLOSED`, `ERROR`
- Message buffer with max 1000 lines

##### [NEW] frontend/lib/formatLog.js
- Parses structured log objects from WebSocket
- Maps log levels to terminal colors
- Formats timestamps as `HH:MM:SS.mmm`

---

### Demo Repository

##### [NEW] demo/vulnerable-repo/
- A minimal Express.js app with:
  - A direct dependency on an older `express` version
  - A transitive dependency on a vulnerable `cookie` or `qs` package
  - A simple test suite (3-5 tests) that exercises the vulnerable code path
  - A `README.md` explaining the planted vulnerability
- This ensures we always have a working demo even without internet

---

## Verification Plan

### Automated Tests
```bash
# Backend unit tests
cd backend && npm test

# Frontend build verification
cd frontend && npm run build

# End-to-end: run the pipeline against the demo vulnerable repo
cd backend && node server.js &
# In another terminal:
curl -X POST http://localhost:3001/api/patch \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/YOUR_ORG/vulnerable-demo"}'
```

### Manual Verification
1. Open `http://localhost:3000` in browser
2. Paste the demo repo URL
3. Verify terminal streams logs in real-time
4. Verify pipeline completes and PR link is displayed
5. Click PR link → verify the PR exists on GitHub with proper description
6. Verify `npm audit` shows 0 vulnerabilities in the patched branch

### Latency Benchmarks
- Measure each pipeline stage duration
- Target: full pipeline completion in **< 45 seconds** for the demo repo (single vulnerability, small test suite)
- Log timing data to the terminal for the judges to see

### Security Checks
- Verify `--ignore-scripts` prevents malicious postinstall hooks
- Verify 30s timeout kills runaway tests
- Verify 512MB memory cap prevents OOM
- Verify no shell injection is possible via repo URL
