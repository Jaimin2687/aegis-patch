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
