# ORCHESTRA — Technical Architecture & Implementation Guide

ORCHESTRA is an enterprise agentic mission-execution platform developed for the **Amazon Developer Hackathon 2026 (Alexa+ track)**.

---

## 1. Architecture & Protocol
* **Protocol Standard:** Model Context Protocol (MCP) official specification (`2025-11-25` negotiated protocol version).
* **SDK:** Official `@modelcontextprotocol/sdk` (v1.32.1).
* **Transport:** Streamable HTTP over Node.js Express via `StreamableHTTPServerTransport` and `StreamableHTTPClientTransport`.
* **Stateful Sessions:** Client receives session ID in `mcp-session-id` headers for multiplexed connection management.
* **Storage:** Node 24 native SQLite (`node:sqlite`) for mission state, DAG task dependencies, approvals, and tool invocations.

---

## 2. Directory Structure
```
Alexa+/
├── docs/                               # Technical specifications
│   ├── architecture.md
│   ├── mcp-architecture.md
│   ├── orchestrator-architecture.md
│   ├── state-machine.md
│   ├── tool-contracts.md
│   ├── security.md
│   ├── implementation-plan.md
│   └── testing.md
├── packages/
│   ├── mcp-server/                     # Self-hosted MCP Server with 16 tools
│   │   ├── src/
│   │   │   ├── db.ts                   # Native SQLite persistence & demo seeding
│   │   │   ├── tools.ts                # 16 strictly typed Zod tool contracts
│   │   │   ├── server.ts               # Streamable HTTP Express server factory
│   │   │   └── index.ts                # Server entrypoint
│   │   └── tsconfig.json
│   ├── mcp-client/                     # MCP Client with Streamable HTTP transport
│   │   ├── src/
│   │   │   ├── client.ts               # Dynamic tool discovery & invocation client
│   │   │   ├── index.ts                # Client entrypoint
│   │   │   └── integration.test.ts     # TC-MCP-01 to TC-MCP-11 test suite
│   │   └── tsconfig.json
│   └── orchestrator/                   # Mission Orchestration Engine
│       ├── src/
│       │   ├── types.ts                # Database and domain models
│       │   ├── db.ts                   # Relational state store with worker leasing
│       │   ├── state-machine.ts        # 13-state deterministic FSM
│       │   ├── understanding.ts        # Structured objective parsing & constraints
│       │   ├── planner.ts              # Acyclic DAG task planner with cycle detection
│       │   ├── approvals.ts            # Backend approval gate with SHA-256 fingerprinting
│       │   ├── verifier.ts             # Independent objective & evidence verifier
│       │   ├── orchestrator.ts         # Multi-step execution loop over real MCP client
│       │   ├── index.ts                # Orchestrator entrypoint
│       │   └── orchestrator.test.ts    # Comprehensive test suite (FSM, PLAN, MCP, APPROVAL, E2E)
│       └── tsconfig.json
├── apps/
│   └── web/                            # Production Web UI & Mission Control
│       ├── src/
│       │   ├── components/             # Reusable UI shells (Sidebar, Layout)
│       │   ├── pages/                  # 8 Core Views + Mission Detail
│       │   │   ├── home.ts             # Home Dashboard (/)
│       │   │   ├── new-conversation.ts # Mission Launch (/new)
│       │   │   ├── missions-list.ts    # Missions Overview (/missions)
│       │   │   ├── mission-detail.ts   # Live DAG & Approval Control (/missions/:id)
│       │   │   ├── knowledge.ts        # Knowledge Library (/knowledge)
│       │   │   ├── tools.ts            # Discovered Tools Catalog (/tools)
│       │   │   ├── integrations.ts     # Integrations Catalog (/integrations)
│       │   │   ├── activity.ts         # Audit & Activity Feed (/activity)
│       │   │   └── settings.ts         # Builder Profile & MCP Settings (/settings)
│       │   ├── server.ts               # Express server, REST endpoints, and SSE streaming
│       │   └── web.test.ts             # 11 automated web test suites
│       └── tsconfig.json
├── package.json                        # Root npm workspaces
├── tsconfig.base.json                  # Strict TypeScript configuration
└── README.md
```

---

## 3. Getting Started

### Prerequisites
* **Node.js:** `v22.0.0` or later (tested on Node `v24.20.0`).
* **npm:** `v10.0.0` or later.

### Installation
```bash
npm install
```

### Build & Typecheck
```bash
npm run build
npm run typecheck
```

### Running All Automated Tests
Run the MCP client/server integration suite, OAuth integration tests, orchestrator suite, and web mission control suite:
```bash
npm test
```

### Starting the Applications Locally
1. Start the MCP Server (`http://127.0.0.1:3001/mcp`):
```bash
npm run start:mcp-server
```
Health check endpoint: `http://127.0.0.1:3001/health`

2. Start the Mission Control Web UI (`http://127.0.0.1:3000`):
```bash
npm run start:web
```
Health check endpoint: `http://127.0.0.1:3000/api/health`

3. Access the Web Dashboard:
Open your browser to `http://127.0.0.1:3000`.

### Running with Docker Compose (Production Topology)
```bash
docker compose up -d
```
* **Web UI:** `http://localhost:3000`
* **Internal MCP Server:** `http://localhost:3001/mcp` (isolated on internal bridge network)
* **Persistent Storage:** Named Docker volume `orchestra-data` mounted at `/data`

### Deploying to Render
This repository includes a Render Blueprint (`render.yaml`) for a Docker-based web service. The web process starts its own Streamable HTTP MCP server on loopback, so the web app and registered MCP tools run together without a second public service.

The original sample calendar, reminders, notifications, and analytics remain explicitly local demo tools. Google and GitHub data are accessed only through the real provider OAuth connections below. Local demo connector flags are no longer used to show provider connections.

1. In Render, create a new Blueprint from this repository and apply `render.yaml`.
2. Set the prompted `ORCHESTRA_API_KEY` secret in Render. It remains a header-only credential for internal/service API calls and is never a browser login credential.
3. Add `SESSION_SECRET`, `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, and `PUBLIC_APP_ORIGIN` in Render. Use the generated service origin for `PUBLIC_APP_ORIGIN`, for example `https://alexa-orchestra.onrender.com`. Set `AUTH_EMAIL_FROM` to a sender address on a domain verified with Resend.
4. For Google sign-in, also set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_AUTH_REDIRECT_URI=https://alexa-orchestra.onrender.com/auth/google/callback`; add that exact callback in Google Cloud Console. Google sign-in stays unavailable until these three values are present.
5. Deploy and open the generated `onrender.com` URL. Users register with email and password, verify by email, and then sign in. Render checks `/api/health`.

The Blueprint uses Render's free web-service plan. The filesystem is ephemeral and the service may sleep; local database contents can be lost after restarts or redeploys. Choose a paid Render plan with a persistent disk and set `DB_PATH` to `/data/orchestra.db` if you need durable data.

### Deploying the frontend entry point to Vercel
The web UI is server-rendered by the Express app on Render, not a standalone static bundle. `apps/web/public/vercel.json` configures Vercel to proxy all page, asset, sign-in, and API requests to the Render service, preserving the same authenticated session and backend behavior. Import this repository into Vercel with the project Root Directory set to `apps/web/public`; no Vercel environment variables are needed. The Render service remains the source of truth for `ORCHESTRA_API_KEY` and MCP/database configuration.

### User Authentication (Email & Password + Google OAuth)

ORCHESTRA provides a dedicated user authentication system:
- **Email & Password Sign In**: Scrypt password hashing with unique salts (`N=16384, r=8, p=1`), constant-time password verification, rate limiting, and a server-side session referenced by an HttpOnly SameSite cookie (`orchestra_auth`).
- **Account Registration (`/register`)**: Registration requires a valid email address and a password of at least 12 characters. Email is delivered through Resend; accounts must verify before signing in, and verification links are never printed to logs or exposed in API responses.
- **Password Reset (`/forgot-password`)**: One-time, expiring, hashed reset tokens are emailed through Resend without revealing whether an account exists. Successful resets revoke existing sessions.
- **Google Sign-In ("Continue with Google")**: Google authorization-code flow with PKCE, one-time state validation, and verified ID-token validation using Google's OAuth library.
- **Backend API Key Isolation**: `ORCHESTRA_API_KEY` is accepted only in API request headers for service-to-service calls. It cannot authenticate browser pages or be submitted as a user password.

OAuth connections, mission history, approval details, activity, and user-uploaded knowledge documents are scoped to the authenticated user's session. Provider access tokens and refresh tokens are encrypted with AES-256-GCM in SQLite. The session secret and encryption key must be stable across restarts and must be configured identically for the web process and any separately hosted MCP server. Seeded sample documents remain shared, read-only local demo records.

Generate independent secrets locally without sending them to chat:

```powershell
node -e "const c=require('node:crypto');console.log('SESSION_SECRET='+c.randomBytes(32).toString('base64url'));console.log('OAUTH_ENCRYPTION_KEY='+c.randomBytes(32).toString('base64'))"
```

Copy `.env.example` to a private `.env` and set the values in your local environment or hosting dashboard. Configure `RESEND_API_KEY` and `AUTH_EMAIL_FROM` before using registration or password reset. Verify the sender domain in Resend. Never commit `.env`, OAuth client secrets, the session secret, or the encryption key.

#### Render authentication setup

The Render Blueprint prompts for `ORCHESTRA_API_KEY`, `SESSION_SECRET`, `PUBLIC_APP_ORIGIN`, `RESEND_API_KEY`, and `AUTH_EMAIL_FROM`. Set the API key for internal callers, generate a random session secret of at least 32 characters, use the service's public HTTPS origin for `PUBLIC_APP_ORIGIN`, and provide the Resend API key plus a sender address on a domain verified with Resend. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_AUTH_REDIRECT_URI` in Render only if enabling Google sign-in. Use a persistent Render disk and set `DB_PATH=/data/orchestra.db`; the current free Blueprint uses ephemeral storage, so accounts and sessions can be lost on restart until a persistent disk is configured. Do not add these secrets to Vercel frontend environment variables.

To generate a session secret locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Google sign-in requires a Google Cloud OAuth **Web application** client, the Google Identity scopes (`openid`, `email`, `profile`), and an authorized redirect URI exactly matching `GOOGLE_AUTH_REDIRECT_URI`. If the consent screen is in Testing, only listed test users can sign in; move to production and complete any applicable verification before broad release.

#### Google Cloud setup

1. Create a Google Cloud project and configure its OAuth consent screen, app name, support email, authorized domains, and external/internal audience.
2. Enable only the APIs you intend to use: **Gmail API**, **Google Calendar API**, and **Google Drive API**.
3. Add both exact callback URLs to the OAuth client's authorized redirect URIs: the account sign-in callback `GOOGLE_AUTH_REDIRECT_URI` (locally `http://localhost:3000/auth/google/callback`; for the Render URL `https://alexa-orchestra.onrender.com/auth/google/callback`) and the resource-integration callback `GOOGLE_REDIRECT_URI` (locally `http://localhost:3000/oauth/google/callback`; for Render `https://alexa-orchestra.onrender.com/oauth/google/callback`). If Vercel is used as the public origin, register its corresponding proxied callback URLs instead and set the two redirect variables to those URLs.
4. Create a **Web application** OAuth client and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` on the server only. Do not place the client secret in Vercel frontend settings.
5. The Integrations page requests the profile scopes and only the selected feature scopes: Gmail reading (`gmail.readonly`), Gmail sending (`gmail.send`), Calendar read (`calendar.events.readonly`) or event writes (`calendar.events`), Drive metadata search (`drive.metadata.readonly`), and Drive document content (`drive.readonly`). The Google account chooser and Google’s consent screen are part of every authorization.
6. During development, put test accounts in the consent screen’s test-user list. Google testing-mode restrictions apply; refresh tokens for apps left in Testing can expire after seven days. Gmail and broad Drive scopes are sensitive/restricted and may require Google verification and, for restricted-scope use, a security assessment before public production use.

#### GitHub App setup

1. Create a **GitHub App** owned by the account or organization that will authorize access. Set its callback URL to `GITHUB_REDIRECT_URI` (locally `http://localhost:3000/oauth/github/callback`; for Render `https://alexa-orchestra.onrender.com/oauth/github/callback`; use the Vercel proxy URL instead if it is the public origin).
2. Enable the app’s user-authorization flow and create its OAuth client ID and client secret. Configure **Contents: read-only** and **Metadata: read-only** as the default repository permissions. Configure repository selection and organization approval policy to match the repositories users are allowed to share.
3. Add **Issues: write** only if issue creation is intended, and set `GITHUB_ISSUES_WRITE_ENABLED=true` only after that permission has been granted in the GitHub App configuration. Issue creation remains mission-approval-gated.
4. Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_REDIRECT_URI` on the server. If expiring user authorization tokens are enabled for the app, ORCHESTRA refreshes them server-side.
5. Install/authorize the GitHub App for the user or organization and select the repositories the installation may access. ORCHESTRA lists only repository data returned by GitHub for the connected user; organization policies may further restrict access.

#### Local and production settings / verification

1. Set `SESSION_SECRET` (at least 32 characters), `OAUTH_ENCRYPTION_KEY` (base64 encoding of exactly 32 random bytes), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`, and `PUBLIC_APP_ORIGIN`. Set `GITHUB_ISSUES_WRITE_ENABLED` to `false` unless issue writes are explicitly configured.
2. In Render, configure those server-side variables and retain a persistent disk for `/data/orchestra.db`; never set provider secrets in Vercel. For the Vercel public origin, use `PUBLIC_APP_ORIGIN=https://alexa-plus-frontend.vercel.app` and register the Vercel-hosted callback URLs above. Callback URL values must exactly match the provider console.
3. Use HTTPS callback URLs in production. HTTP callbacks are accepted only for localhost development.
4. Open **Integrations**, review the permission names, select only required feature scopes, connect, then verify the displayed account, permissions, live status, and synchronization time. To test actual access, run the Gmail, Calendar, Drive, and GitHub read tools from an authenticated mission/MCP context.
5. Test disconnect for each provider. ORCHESTRA deletes local encrypted credentials and requests remote revocation; the dashboard explicitly reports if provider-side revocation could not be confirmed. Also test revoked tokens, denied scopes, rate limits, and organization restrictions.
6. Google verification/consent-screen publication, GitHub App review and permissions, production credentials, HTTPS callback registration, and a persistent production database are deployment-owner tasks. Until these are completed and tested with the intended accounts, the integrations are **not production-ready**.

The integrations status API validates each stored connection with a live provider API call; a local flag cannot mark an account connected. OAuth state is random, one-time, expiry-bound, and tied to the signed browser session. The Google authorization-code flow uses PKCE. GitHub repository and provider-write tools are registered with MCP; email sending, calendar event writes, and issue creation require a mission approval whose parameter fingerprint is checked again at execution.

---

## 4. First Vertical Slice: Meeting Preparation Mission
The orchestrator executes a complete 7-step DAG:
1. `get_conversation_context`: Fetches demo profile and meeting time.
2. `search_knowledge`: Discovers relevant roadmap document in demonstration store.
3. `retrieve_document`: Retrieves `doc-q4-roadmap` brief.
4. `analyze_document`: Extracts key topics, action items, and risks.
5. `detect_conflict`: Checks for schedule overlap.
6. `create_task`: Persists checklist items to database.
7. `verify_action`: Flags reminder creation as consequential, pauses mission in `AWAITING_APPROVAL`.
8. User grants approval with matching SHA-256 fingerprint.
9. Mission executes approved action and performs independent outcome verification before reaching `COMPLETED`.

---

## 5. Security Invariants
* **Zero Frontend Trust:** Human approval is validated solely by the backend approval service via SHA-256 canonical parameter fingerprints and SQLite atomic transactions.
* **Provider Ownership:** OAuth states, encrypted tokens, connection health, and MCP provider calls are bound to an HMAC-signed browser-session identity. Provider credentials are never included in API responses.
* **Write Replay Protection:** MCP validates the approved action parameters against the mission approval record and atomically consumes each consequential provider approval once.
* **Fail-Closed Tool Policy:** Unknown tools are blocked from direct execution until explicitly classified; provider write actions are always approval-gated.
* **Production Authentication:** Production refuses to start without `ORCHESTRA_API_KEY`; there is no unauthenticated-production override.
* **DNS Rebinding Guard:** Server validates incoming `Host` headers.
* **Demonstration Transparency:** Legacy sample documents and calendar data remain explicitly labeled local demo records (`is_local_demo: true`); provider cards and provider tools use live OAuth accounts only.
* **Minimal Audit Data:** Provider message bodies, file contents, and credentials are not written to provider audit logs. Provider data returned to a mission is not retained as a result blob.
