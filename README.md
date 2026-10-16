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
│   ├── mcp-server/                     # Self-hosted MCP Server with 11 tools
│   │   ├── src/
│   │   │   ├── db.ts                   # Native SQLite persistence & demo seeding
│   │   │   ├── tools.ts                # 11 strictly typed Zod tool contracts
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

### Running All Automated Tests (52 Tests Across All Workspaces)
Run the MCP client/server integration suite, orchestrator suite, web mission control suite, official branding suite, and redesigned home page suite:
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
* **DNS Rebinding Guard:** Server validates incoming `Host` headers.
* **Demonstration Transparency:** All documents and meeting data are stored locally and explicitly labeled as demonstration records (`is_local_demo: true`).
