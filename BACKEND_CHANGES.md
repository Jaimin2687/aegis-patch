# AEGIS-PATCH: Backend Developer Reference & Integration Guide

This guide details the backend architecture, API endpoints, WebSocket payload contracts, and integration requirements to assist backend developers working on the AEGIS-PATCH daemon.

---

## 📡 1. Server Configuration & Endpoints

- **Server Entry Point**: [`backend/server.js`](file:///Users/khushpithva/Documents/Hackathon/aegis-patch/backend/server.js)
- **Port**: `3001` (Configured via `PORT` in `backend/.env`)
- **Allowed Frontend Origin**: `http://localhost:3000` (Configured via `FRONTEND_URL`)

### HTTP API Specifications

#### `POST /api/patch`
Triggers the security patching pipeline for a target GitHub repository.
- **Request Body**:
  ```json
  {
    "repoUrl": "https://github.com/owner/repository"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "sessionId": "a1b2c3d4-5678-90ef-1234-567890abcdef",
    "message": "Patch pipeline started"
  }
  ```

#### `GET /api/history`
Returns historical scan execution records. Each record contains summary metrics as well as the complete list of detected vulnerabilities (`vulns`) and execution logs (`logs`) for deep historical inspection in the frontend UI.
Returns historical scan execution records.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "session-1",
      "repo": "owner/repository",
      "repoUrl": "https://github.com/owner/repository",
      "date": "2026-08-01T12:00:00.000Z",
      "status": "success",
      "vulnsFound": 3,
      "vulns": [
        {
          "packageName": "lodash",
          "installedVersion": "4.17.15",
          "targetVersion": "4.17.21",
          "cveId": "CVE-2021-23337",
          "severity": "HIGH",
          "cvssScore": 7.5,
          "title": "Command Injection in lodash",
          "description": "Vulnerable to Command Injection via template functions..."
        }
      ],
      "logs": [
        { "stage": "SCANNING", "level": "INFO", "message": "Parsing lockfiles..." }
      ],
      "date": "2026-08-01T12:00:00.000Z",
      "vulnsFound": 3,
      "status": "completed",
      "duration": "45s",
      "prUrl": "https://github.com/owner/repository/pull/12"
    }
  ]
  ```

#### `GET /api/health`
Health check endpoint.
- **Response (200 OK)**: `{ "status": "ok", "timestamp": "..." }`

---

## ⚡ 2. WebSocket Event Contracts

WebSockets connect at `ws://localhost:3001/ws?sessionId=<SESSION_ID>`.

The backend `EventBus` emits events in JSON format `{ type, data, timestamp }`:

### Event Types:
1. `STAGE_CHANGE`:
   ```json
   { "type": "STAGE_CHANGE", "data": { "stage": "SCANNING" } }
   ```
   *Valid Stages*: `CLONING` ➔ `SCANNING` ➔ `PATCHING` ➔ `TESTING` ➔ `PUSHING` ➔ `COMPLETE`

2. `LOG`:
   ```json
   { "type": "LOG", "data": { "stage": "SCANNING", "level": "INFO", "message": "Parsing lockfiles..." } }
   ```

3. `VULN_FOUND` *(Payload used by Frontend `VulnCard` & Breakdown Modal)*:
   ```json
   {
     "type": "VULN_FOUND",
     "data": {
       "packageName": "lodash",
       "installedVersion": "4.17.15",
       "patchedVersion": "4.17.21",
       "targetVersion": "4.17.21",
       "cveId": "CVE-2021-23337",
       "ghsaId": "GHSA-35jh-r3h4-6jhm",
       "severity": "HIGH",
       "cvssScore": 7.5,
       "title": "Command Injection in lodash",
       "description": "Vulnerable to Command Injection via template functions...",
       "fixCommitUrl": "https://osv.dev/vulnerability/GHSA-35jh-r3h4-6jhm"
     }
   }
   ```

4. `COMPLETE`:
   ```json
   { "type": "COMPLETE", "data": { "prUrl": "https://github.com/owner/repo/pull/1" } }
   ```

5. `ERROR`:
   ```json
   { "type": "ERROR", "data": { "message": "Git clone failed" } }
   ```

---

## 🧠 3. LLM Failover Architecture

Configured in [`backend/src/llm/failoverPipeline.js`](file:///Users/khushpithva/Documents/Hackathon/aegis-patch/backend/src/llm/failoverPipeline.js):
- **Tier 1**: Groq (`GROQ_API_KEY`, model: `qwen/qwen3.6-27b`)
- **Tier 2**: Cerebras (`CEREBRAS_API_KEY`, model: `gpt-oss-120b`)
- **Tier 3**: Gemini (`GEMINI_API_KEY`, model: `gemini-2.5-flash`)

*Note for Backend Devs*: Ensure API keys in `backend/.env` are populated. If a provider hits rate limit (`429`), the failover engine automatically cascades to the next provider.

---

## 🛠️ 4. GitHub PR Authentication Checklist

When generating PRs ([`backend/src/modules/prGenerator.js`](file:///Users/khushpithva/Documents/Hackathon/aegis-patch/backend/src/modules/prGenerator.js)):
- Ensure `GITHUB_TOKEN` in `backend/.env` has:
  - **Contents**: `Read and write` permission (for git push)
  - **Pull requests**: `Read and write` permission (for Octokit PR creation)
- Push remote URL format: `https://${config.GITHUB_TOKEN}@github.com/${owner}/${repo}.git`

---
---

# Proposed Backend Changes

**Author:** Harsh Patel  
**Date:** 2 August 2026  
**Scope:** Full backend audit of `aegis-patch/backend/`

---

## Summary

After a thorough review of every backend file, I identified **14 bugs** across the server, pipeline orchestrator, vulnerability scanner, patch synthesizer, PR generator, regression engine, process runner, and LLM failover pipeline. The issues range from **critical** (duplicate events crashing the frontend, missing user PAT forwarding, orphaned temp directories) to **moderate** (unbounded history file growth, stale "running" records never cleaned up) to **minor** (Windows-incompatible `find` command, silent error swallowing).

Each finding is documented below with the affected file, a plain-English explanation of the problem, the impact on a real user, and a proposed fix.

---

## Critical Bugs

### 1. Double `COMPLETE` Event Emission
**File:** `pipeline.js` (line 103) and `prGenerator.js` (line 75)

**Problem:** `pipeline.js` calls `eventBus.emitComplete()` at line 103. But `prGenerator.js` *also* calls `eventBus.emitComplete()` at line 75, which is called from inside the same pipeline flow at line 100. This means the `COMPLETE` event fires **twice** for every successful scan.

**Impact for users:** The frontend WebSocket handler receives two `COMPLETE` messages. This could cause the "Pipeline Complete" UI to flash, duplicate history entries to be written (the `server.js` event handler updates `record.status = 'success'` and calls `saveHistory()` on every `COMPLETE` event), and the scan history file to grow with redundant data.

**Proposed Fix:** Remove the `eventBus.emitComplete()` call from `prGenerator.js` (line 75), since `pipeline.js` already emits it with richer metadata (patched count, test results, total time).

---

### 2. User's PAT Not Forwarded to Backend
**File:** `server.js` (lines 124-199) and `pipeline.js`

**Problem:** The frontend allows users to enter their own GitHub Personal Access Token (PAT), stored in `localStorage` as `aegis_github_token`. However, the `/api/patch` endpoint only reads `repoUrl` from the request body — it never reads or forwards a user-supplied PAT. The pipeline always falls back to `config.GITHUB_TOKEN` from the server's `.env` file.

**Impact for users:** If the server's `.env` token is invalid or expired (which is the current state — the `.env` contains placeholder values), every clone and PR push will fail with "Authentication failed", even though the user has entered a valid PAT in the frontend settings. The user's PAT is collected but never actually used.

**Proposed Fix:**  
1. Accept an optional `token` field in the `/api/patch` POST body.  
2. Pass it through `executePipeline(repoUrl, sessionId, userToken)`.  
3. In `repoIngestor.js` and `prGenerator.js`, prefer the user-supplied token over `config.GITHUB_TOKEN`.

---

### 3. Temp Directories Not Cleaned on Pipeline Error
**File:** `pipeline.js` (lines 116-125)

**Problem:** The `finally` block (line 116) attempts to clean up the cloned repo directory. However, if `ingestRepo()` throws *before* assigning `repoPath` (e.g., on a network timeout during `git clone`), the `repoPath` variable is `undefined` and the cleanup is skipped. Meanwhile, `simple-git` may have already created the temp directory under `backend/temp/<sessionId>/` as a partial clone artifact.

**Impact for users:** Over time, the `temp/` directory accumulates orphaned directories from failed clones, consuming disk space. On a server with limited storage, this can eventually cause new clones to fail.

**Proposed Fix:** Compute `repoPath` deterministically *before* calling `ingestRepo()` (e.g., `const repoPath = path.join(process.cwd(), 'temp', sessionId)`), and always attempt cleanup in the `finally` block regardless of whether `ingestRepo` succeeded.

---

### 4. `find` Command Crashes on Windows
**File:** `vulnScanner.js` (line 212)

**Problem:** The Universal LLM Scanner fallback (line 212) runs the Unix `find` command to list source files. On Windows (which is the current development OS), `find` is a completely different command (it searches for text within files, not files by name) and will either fail or return wrong results.

**Impact for users:** Any repository with an ecosystem detected as `UNIVERSAL`, `C/C++`, `PHP`, or `Java` will have its LLM-based SAST scan silently fail on Windows, returning zero vulnerabilities even if the code has issues.

**Proposed Fix:** Replace the `find` shell command with Node.js `fs.readdir` with recursive option, or use `glob`/`fast-glob` for cross-platform file discovery.

---

## Moderate Bugs

### 5. Unbounded History File Growth
**File:** `server.js` (lines 179-180)

**Problem:** Every new scan is `unshift`'d into `scanHistory` (line 179), and the entire array is serialized to `history.json` on every event (VULN_FOUND, LOG, COMPLETE, ERROR). The GET endpoint limits to 50 results (line 202), but the underlying array and JSON file grow without bound.

**Impact for users:** After hundreds of scans, `history.json` becomes very large. Every `saveHistory()` call rewrites the entire file, causing increasing I/O latency and potential write failures. The `VULN_FOUND` event handler (line 392-396) calls `saveHistory()` on *every single vulnerability found*, meaning a scan that finds 50 vulns writes the full history file 50 times.

**Proposed Fix:**  
1. Cap `scanHistory` to a max of 200 entries, trimming the oldest when exceeded.  
2. Debounce `saveHistory()` calls (e.g., at most once every 2 seconds) instead of on every event.

---

### 6. Stale "Running" Scan Records Never Cleaned Up
**File:** `server.js` (lines 164-191)

**Problem:** When a scan starts, a record with `status: 'running'` is written (line 171). If the Node.js process crashes or restarts mid-pipeline, these records remain in `history.json` with `status: 'running'` forever — they're never marked as `error` or `success`.

**Impact for users:** The Scan History page shows perpetually "Running" scans that will never complete, which is confusing. There's no mechanism to detect or clean these up on server restart.

**Proposed Fix:** On server startup, after loading `history.json`, iterate through all records and mark any with `status: 'running'` as `status: 'error'` with a note like `"Server restarted — scan interrupted"`.

---

### 7. Crash on Empty Gemini Response
**File:** `gemini.js` (lines 59-63)

**Problem:** Line 61 accesses `data.candidates[0].content.parts[0].text` without any null-checking. Gemini API can return responses with an empty `candidates` array (e.g., when content is filtered due to safety settings), or candidates without content parts.

**Impact for users:** If the Gemini API filters the response (common with security-related code), the entire failover pipeline crashes with `TypeError: Cannot read properties of undefined (reading 'content')` instead of gracefully falling back to the next provider.

**Proposed Fix:** Add defensive checks:
```js
if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
  throw new ProviderError(this.name, statusCode, 'Empty or filtered response from Gemini');
}
```

---

### 8. LLM Patch Overwrites Entire File with Raw LLM Output
**File:** `patchSynth.js` (line 155)

**Problem:** Line 155 writes `patchContent` (the raw LLM response) directly to the vulnerable file path. Despite the prompt asking the LLM to return "ONLY the patched source code", LLMs frequently include explanatory text, markdown formatting, or partial code. The `failoverPipeline.js` strips markdown fences and thinking tags, but it doesn't validate that the result is actually valid source code.

**Impact for users:** If the LLM returns something like `"Here's the patched code:\n\nfunction ..."`, the entire vulnerable file is overwritten with invalid content, breaking the repository. The regression tests will then fail, and the retry loop will send the *corrupted* file as `previousPatch`, compounding the problem.

**Proposed Fix:** Add a basic sanity check before writing — verify the patched content is non-empty, has a similar line count to the original (within 2x), and doesn't start with natural language patterns like "Here" or "The".

---

### 9. OSV Vulnerability Index Mismatch
**File:** `vulnScanner.js` (lines 39-96)

**Problem:** At line 81, `packageList[i]` is used to get the package name/version, where `i` is the index into `result.results`. However, `result.results` from the OSV batch API is a 1-to-1 mapping with the `queries` array. If a single package has *multiple* vulnerabilities (multiple entries in `res.vulns`), they all correctly use `packageList[i]`. But if the OSV API returns results in a different order than the queries (unlikely but not guaranteed by the API spec), the vulnerability would be attributed to the wrong package.

**Impact for users:** A vulnerability might show up as belonging to "express" when it actually affects "lodash". This is a correctness issue in the scan report.

**Proposed Fix:** Include the original package name/version in the query object and reference it from the response, rather than relying on index alignment.

---

### 10. `npm audit` Runs Without `node_modules` Installed
**File:** `vulnScanner.js` (lines 108-130)

**Problem:** The `npm audit` fallback (line 110) runs in `repoPath`, but the repo was cloned with `--depth 1` and no `npm install` has been run yet. `npm audit` requires either a `package-lock.json` or installed `node_modules` to work properly. If the repo doesn't have a committed lockfile, `npm audit` will fail or return incomplete results.

**Impact for users:** The vulnerability scan silently misses real vulnerabilities in npm projects that don't commit their lockfile, giving a false sense of security.

**Proposed Fix:** Before running `npm audit`, check if `package-lock.json` exists. If not, run `npm install --package-lock-only` first to generate one without downloading packages.

---

### 11. SSRF via DNS Rebinding
**File:** `webScanner.js` (lines 20-62)

**Problem:** The `isBlockedUrl()` function checks the hostname at validation time, and `resolvesPrivately()` checks DNS at validation time. However, between the time the URL is validated and the actual HTTP request is made, a malicious DNS record could change (DNS rebinding attack) — the first resolution returns a public IP, but subsequent resolutions return `127.0.0.1`.

**Impact for users:** An attacker could potentially use the website scanner to probe internal services on the server's network by exploiting the time-of-check/time-of-use gap.

**Proposed Fix:** Pin the resolved IP address and use it for the actual HTTP request instead of letting `undici` re-resolve the hostname. Alternatively, use `undici`'s `connect` option to override resolution.

---

## Minor Bugs

### 12. Silent Error Swallowing in Cargo and Go Scanners
**File:** `vulnScanner.js` (lines 182 and 206)

**Problem:** The `catch(e) {}` blocks on lines 182 and 206 silently swallow all errors from parsing `cargo audit` and `govulncheck` output. If the JSON output format changes or parsing logic has a bug, there's zero visibility into the failure.

**Impact for users:** Rust and Go scans might silently return zero vulnerabilities due to a parsing error, and neither the user nor the developer would know.

**Proposed Fix:** Add `logger.error('SCANNING', ...)` in these catch blocks, matching the pattern used for `npm audit` and `pip-audit`.

---

### 13. `LOG` Events Not Persisted to History
**File:** `server.js` (lines 397-407)

**Problem:** The `LOG` event handler pushes to `record.logs` but never calls `saveHistory()`. This means logs are only available in-memory and are lost on server restart. Meanwhile, `VULN_FOUND` calls `saveHistory()` on every single event.

**Impact for users:** If you look at the Scan History detail view after a server restart, the logs will be empty even though vulnerabilities are preserved. This is inconsistent.

**Proposed Fix:** Either call `saveHistory()` periodically (debounced) after LOG events, or accept that logs are ephemeral and document it. Don't store logs in history at all if they won't be persisted.

---

### 14. Regression Test Install Failures Silently Ignored
**File:** `regressionEngine.js` (lines 59-61)

**Problem:** The `npm install --ignore-scripts` step (line 59) catches errors with `.catch(e => logger.warn(...))` and continues to run tests. If the install fails (e.g., network issue, registry down), the test suite runs against the old/missing `node_modules`, and its pass/fail result is meaningless.

**Impact for users:** A patched vulnerability could be marked as "regression tests passed" when in reality the tests couldn't even run because dependencies weren't installed.

**Proposed Fix:** If the install step fails, either short-circuit and return `{ passed: false, stderr: 'Install failed: ...' }`, or at minimum log it as an `error` instead of `warn`.

---

## Summary Table

| # | Severity | File | Bug |
|---|----------|------|-----|
| 1 | Critical | pipeline.js + prGenerator.js | Double COMPLETE event emission |
| 2 | Critical | server.js + pipeline.js | User PAT never forwarded to backend |
| 3 | Critical | pipeline.js | Temp dirs not cleaned on early failure |
| 4 | Critical | vulnScanner.js | `find` command crashes on Windows |
| 5 | Moderate | server.js | Unbounded history.json growth |
| 6 | Moderate | server.js | Stale "running" records never cleaned |
| 7 | Moderate | gemini.js | Crash on empty/filtered Gemini response |
| 8 | Moderate | patchSynth.js | Raw LLM output overwrites source files |
| 9 | Moderate | vulnScanner.js | OSV result index mismatch risk |
| 10 | Moderate | vulnScanner.js | npm audit runs without lockfile |
| 11 | Moderate | webScanner.js | SSRF via DNS rebinding |
| 12 | Minor | vulnScanner.js | Silent error swallowing (Cargo/Go) |
| 13 | Minor | server.js | LOG events not persisted to disk |
| 14 | Minor | regressionEngine.js | Install failures silently ignored |
