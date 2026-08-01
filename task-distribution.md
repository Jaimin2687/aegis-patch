# AEGIS-PATCH — Team Task Distribution

**Date:** August 1, 2026
**Base Built By:** Jaimin (complete — 28 files, both stacks verified)
**Status:** Base MVP functional, needs hardening + polish for hackathon

---

## Team Overview

| Member | Role | Focus Area |
|---|---|---|
| **Jaimin** | Lead / Foundation | ✅ Done — base backend + frontend built. **Also owns deployment to Render/Vercel.** |
| **Khush** | Backend Hardening | LLM pipeline, vulnerability scanner, patch synth, demo repo |
| **Harsh** | Frontend Polish | Components, UX bugs, animations, responsiveness, error states |
| **Priyansh** | Testing & Security | E2E Testing, API rate limiting, analytics, prompt engineering, README |

---

## 🔵 KHUSH — Backend Hardening & Intelligence

> **Goal:** Make the backend bulletproof. Fix bugs, improve the LLM pipeline, harden the vulnerability scanner, and create the demo repo.

### K1. Update Cerebras Model Config ⚡ CRITICAL
**File:** `backend/src/core/config.js` (Line 27-28)
- Cerebras free tier only allows: `gemma-4-31b`, `zai-glm-4.7`, `gpt-oss-120b` (5 req/min, 2400/day)
- Current config uses `llama-3.3-70b` which may not be available on Cerebras anymore
- Update default model to `llama-3.3-70b` OR switch to one of the available models above
- Also update `failoverPipeline.js` (Line 27) — the Groq Llama model name should be `llama-3.3-70b-versatile`

### K2. Fix `depGraph.js` — Sync Read to Async ⚡ CRITICAL
**File:** `backend/src/utils/depGraph.js` (Line 9)
- Uses `fs.readFileSync()` which blocks the event loop — bad for a server handling concurrent sessions
- Change to `async parseLockfile()` using `fs.promises.readFile()`
- Update callers in `repoIngestor.js` to `await parseLockfile()`

### K3. Harden `vulnScanner.js` — CVSS Score Extraction 🔧
**File:** `backend/src/modules/vulnScanner.js`
- Line 65: `cvssScore` is hardcoded to `0` — never extracted from OSV data
- Extract CVSS from `vulnData.severity` array (look for `type: 'CVSS_V3'` and parse `score` from it)
- Also extract CVSS from `vulnData.database_specific?.cvss` if available
- Line 44: `database_specific?.severity` may not exist — add better fallback chain
- Line 59: `packageList[i]` index can be wrong since inner loop iterates multiple vulns per package — track the correct package index

### K4. Improve `patchSynth.js` — Smarter File Discovery 🔧
**File:** `backend/src/modules/patchSynth.js`
- Lines 38-44: Only tries `index.js` — many packages use `lib/`, `src/`, or `package.json` `main` field
- Read the package's own `package.json` to get the `main` or `exports` entry point
- Fallback chain: package.json main → index.js → lib/index.js
- Line 61: `previousStderr` on retry should pass the PATCHED code (current code), not the original `vulnerableCode`

### K5. Harden `prGenerator.js` — Git Remote Handling 🔧
**File:** `backend/src/modules/prGenerator.js`
- Line 38: `git.addRemote('aegis-remote', ...)` will FAIL on second run if remote already exists
- Add try-catch or use `git.getRemotes()` to check first, then `removeRemote` + `addRemote`
- Line 59: Hardcodes `base: 'main'` — should detect default branch (could be `master`)
- Use Octokit to get repo default branch: `octokit.rest.repos.get({owner, repo})` → `data.default_branch`

### K6. Create Demo Vulnerable Repository ⚡ CRITICAL
- Create `demo/` directory in project root
- Add `package.json` with intentionally vulnerable deps (e.g., `lodash@4.17.15`, `minimist@0.0.8`, `qs@6.5.2`)
- Add simple `test.js` with basic tests (`mocha` or `jest`)
- Add `package-lock.json` so OSV scanner can find vulns
- This repo will be pushed to GitHub for live demo

### K7. Add Rate Limit Awareness to Failover 🔧
**File:** `backend/src/llm/failoverPipeline.js`
- Add `retryAfter` delay handling — when a provider returns 429 with retry-after header, optionally wait that duration before trying next provider
- Log remaining token quota from `x-ratelimit-remaining-tokens` header (Groq)
- Cerebras has 5 req/min — add a 12-second minimum gap between Cerebras calls

---

## 🟢 HARSH — Frontend Polish & UX Perfection

> **Goal:** Make the frontend look FLAWLESS. Fix every bug, add missing features, improve animations and responsiveness. This is what judges see first.

### H1. Fix `useWebSocket.js` — State Reset on New Session ⚡ CRITICAL
**File:** `frontend/src/lib/useWebSocket.js`
- Lines 4-18: When `sessionId` changes, old state (logs, vulns, result, error) carries over
- Add state reset at the top of `useEffect`:
  ```js
  setLogs([]); setStage(''); setVulns([]); setResult(null); setError(null);
  ```
- Lines 74-88: Stop reconnecting after `COMPLETE` or clean close (check `event.code === 1000`)
- Line 25: Fix double-slash bug — strip trailing slash from `backendUrl` before constructing WS URL
- Lines 51-55: Deduplicate vulnerabilities by `cveId` to prevent duplicate cards on reconnect

### H2. Fix `page.js` — Error Handling & Submit Flow ⚡ CRITICAL
**File:** `frontend/src/app/page.js`
- Lines 25-47: `setPipelineStarted(true)` fires before fetch succeeds — if POST fails, UI shows empty pipeline
- Fix: Add `submitting` state, set `pipelineStarted` only after successful response
- Lines 43-46: Catch block doesn't update UI — add `setSubmitError(err.message)` state and display it
- Line 62: Remove `animate-in fade-in` class (requires `tailwindcss-animate` plugin not installed)
- Line 89: Use proper React keys instead of array index — use `vuln.cveId || vuln.ghsaId || idx`

### H3. Fix `formatLog.js` — Case Sensitivity & Safety 🔧
**File:** `frontend/src/lib/formatLog.js`
- Lines 1-10: `getLogColor(level)` — add `.toLowerCase()` before lookup (backend may send uppercase)
- Lines 26-34: `getSeverityColor(severity)` — same `.toLowerCase()` fix
- Lines 12-16: `formatTimestamp()` — add `isNaN` guard: `if (isNaN(d.getTime())) return '00:00:00.000'`

### H4. Fix `VulnCard.jsx` — Runtime Safety 🔧
**File:** `frontend/src/app/components/VulnCard.jsx`
- Line 6: `cvss.toFixed(1)` crashes if `cvssScore` is string — use `Number(vuln.cvssScore) || 0`
- Add destructuring with defaults for safety:
  ```jsx
  const { severity = 'moderate', cvssScore = 0, packageName = 'unknown', ... } = vuln || {};
  ```

### H5. Fix `Terminal.jsx` — Smart Auto-scroll 🔧
**File:** `frontend/src/app/components/Terminal.jsx`
- Lines 8-12: Currently force-scrolls to bottom on every log update, even if user scrolled up to read
- Implement "smart scroll" — only auto-scroll if user is already at/near the bottom:
  ```js
  const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  if (isNearBottom) container.scrollTop = container.scrollHeight;
  ```
- Add "Copy Logs" button in the terminal header (copies all logs to clipboard)
- Increase contrast of line numbers from `text-[#444]` to `text-[#666]` for WCAG compliance

### H6. Fix `UrlInput.jsx` — Validation & Accessibility 🔧
**File:** `frontend/src/app/components/UrlInput.jsx`
- Line 15: Regex rejects URLs ending in `.git` or with trailing slash — fix regex:
  ```js
  /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?\/?$/
  ```
- Line 38: Clear error on input change: `onChange={(e) => { setUrl(e.target.value); setError(''); }}`
- Add `id="repo-url"` on input and `htmlFor="repo-url"` on label for accessibility
- Change input `type="text"` to `type="url"`

### H7. Fix `StatusPanel.jsx` — Error Stage Handling 🔧
**File:** `frontend/src/app/components/StatusPanel.jsx`
- Lines 7, 13-16: `ERROR` is not in `STAGES` array so `indexOf` returns -1
- Fix: When `error` is truthy, highlight the last-known stage in red instead of looking up `ERROR`

### H8. Fix `Sidebar.jsx` — Use `currentStage` Prop + Mobile 🔧
**File:** `frontend/src/app/components/Sidebar.jsx`
- Line 3: `currentStage` prop is passed but never used — add a pipeline status indicator section showing the current stage with its icon
- Lines 20, 27, 33: Replace `<a href="#">` with `<button>` elements to prevent page jump on click
- Add mobile responsiveness: `hidden md:flex` on sidebar, hamburger toggle button for mobile

### H9. Fix `globals.css` — TailwindCSS v4 `@theme` Block 🔧
**File:** `frontend/src/app/globals.css`
- CSS custom properties in `:root` are NOT auto-detected by Tailwind v4 as utility colors
- Add `@theme` block after `@import "tailwindcss"` to register custom design tokens:
  ```css
  @theme {
    --color-charcoal-deep: #050505;
    --color-charcoal: #0a0a0a;
    --color-slate: #111111;
    --color-grid-line: #222222;
    --color-muted: #888888;
    --font-mono: var(--font-mono);
  }
  ```
- Add standard scrollbar CSS alongside WebKit: `scrollbar-width: thin; scrollbar-color: #333 transparent;`

### H10. Add Error Boundary + Loading States 🔧
- Create `frontend/src/app/error.jsx` — React error boundary for runtime crashes
- Create `frontend/src/app/loading.jsx` — Loading skeleton for page transitions
- Add an initial empty state in `page.js` when no pipeline is running (illustration + copy)
- Add a "Retry" button when pipeline fails with error

---

## 🟠 PRIYANSH — Testing, Security, Analytics & Docs

> **Goal:** Solidify the project. Prevent abuse via security measures, ensure reliability via tests, improve the LLM's success rate, and perfect the presentation.

### P1. Setup Testing Infrastructure ⚡ CRITICAL
**Files:** `backend/tests/` (NEW)
- Install `jest` in the backend.
- Write unit tests for `failoverPipeline.js` (mocking the HTTP calls to ensure fallback logic works when a provider fails or 429s).
- Write unit tests for `depGraph.js` to ensure lockfiles parse correctly.
- This proves to the judges the system is robust.

### P2. API Security & Rate Limiting ⚡ CRITICAL
**File:** `backend/server.js`
- Since this will be publicly deployed and uses LLM API keys, we need to prevent spam.
- Implement an in-memory rate limiter on the `POST /api/patch` endpoint (e.g. max 5 requests per IP per hour).
- Since we are using raw `http.createServer`, you can use a simple Map `const rateLimit = new Map()` to track requests by IP address.

### P3. Few-Shot Prompt Engineering 🔧
**File:** `backend/src/llm/prompts.js`
- Currently, the prompt is zero-shot.
- Create a dataset of 3-5 common JS vulnerabilities (like Prototype Pollution, ReDoS, Command Injection) and their exact patches.
- Embed these into the `buildPatchPrompt` as few-shot examples (user/assistant pairs) so the LLM understands *exactly* what a good security patch looks like. This will drastically improve the success rate of the LLM.

### P4. Pipeline Analytics & Telemetry 🔧
**File:** `backend/src/core/pipeline.js`
- We want to know which LLM is performing best.
- Create a simple analytics logger that writes to a `backend/analytics.json` file.
- Track: CVE ID patched, LLM provider that succeeded, number of retries, latency, and success/failure status.
- This will look amazing in the presentation to show real data on how your autonomous system performs over time.

### P5. Temp Directory Auto-Cleanup 🔧
**File:** `backend/src/core/pipeline.js`
- Add a `finally` block to `executePipeline()` that removes the `temp/{sessionId}` directory.
- Use `fs.rm(repoPath, { recursive: true, force: true })`.
- This prevents disk space exhaustion on the Render free tier over time.

### P6. CORS Hardening 🔧
**File:** `backend/server.js` (Line 10)
- Currently uses `config.FRONTEND_URL || '*'` — on Render this needs to match the exact Vercel domain to prevent CSRF / cross-origin abuse.
- Enforce strict CORS matching instead of wildcard.

### P7. Write Production README.md & Pitch Script 🔧
**File:** `README.md`
- Project name, tagline, architecture diagram (use Mermaid.js or standard images).
- Screenshots of the UI, setup instructions, and tech stack.
- Create a `PITCH.md` with a 3-minute demo script for the judges highlighting:
  1. The speed and lack of human intervention.
  2. The clever 4-tier LLM failover.
  3. The regression engine guaranteeing patches don't break existing code.

---

## Priority Order

### 🔴 DO FIRST (blocks everything)
1. **K6** — Create demo repo (everyone needs this to test)
2. **K1** — Fix Cerebras model config
3. **K2** — Fix depGraph sync read
4. **H1** — Fix WebSocket state reset
5. **H2** — Fix page.js error handling
6. **P2** — Rate limit the POST endpoint (prevents abuse on deployment)

### 🟡 DO NEXT (critical for quality)
7. **P1** — Write Jest tests for failover pipeline
8. **P3** — Enhance prompts with few-shot examples
9. **K3** — CVSS score extraction
10. **K4** — Smarter file discovery in patchSynth
11. **K5** — Git remote handling fix
12. **H3** — formatLog case sensitivity
13. **H4** — VulnCard runtime safety
14. **H5** — Terminal smart scroll
15. **H6** — URL validation + accessibility

### 🟢 DO LAST (polish)
16. **H7-H10** — StatusPanel, Sidebar, globals.css, Error boundaries
17. **K7, P5** — Cleanup temp dirs, rate limit awareness
18. **P4, P6** — Analytics JSON, strict CORS
19. **P7** — README, demo script
