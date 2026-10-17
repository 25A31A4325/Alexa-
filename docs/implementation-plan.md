# ORCHESTRA — Phased Implementation Plan (Hardened)

This implementation plan defines small, verifiable, sequential stages. Advancing between stages requires passing automated test suites and explicit acceptance criteria.

---

## Stage 1: Workspace Scaffolding & Dependencies Setup
* **Files / Modules:**
  * Root `package.json` with npm workspaces (`apps/web`, `packages/mcp-server`, `packages/orchestrator`).
  * Root `tsconfig.base.json`, `.gitignore`, `.env.example`.
  * Core dependencies: `@modelcontextprotocol/sdk`, `express`, `zod`, `better-sqlite3`, `next`, `react`, `react-dom`, `tailwindcss`, `lucide-react`, `vitest`.
* **Expected Behavior:** Workspace compiles with zero TypeScript errors.
* **Dependencies:** Node.js v24, npm v11.
* **Acceptance Criteria:** `npm run build` succeeds across workspaces.
* **Automated Tests:** Script verifying package imports and build.
* **Rollback:** Delete node_modules and generated build artifacts.

---

## Stage 2: Self-Hosted MCP Server with Streamable HTTP
* **Files / Modules:**
  * `packages/mcp-server/src/server.ts`
  * `packages/mcp-server/src/tools.ts` (all 16 domain tools)
  * `packages/mcp-server/src/demo-data.ts` (explicitly labeled demonstration documents and records)
* **Expected Behavior:** Server starts on the configured host and port, mounts `/mcp` using `StreamableHTTPServerTransport`, and registers all 16 local/demo-backed tools.
* **Acceptance Criteria:** Responds to JSON-RPC 2.0 initialize request; returns tools via `tools/list`.
* **Automated Tests:** `packages/mcp-client/src/integration.test.ts` verifies server initialization, tool discovery, and tool execution.
* **Rollback:** Terminate port 3001 process.

---

## Stage 3: MCP Client & Mandatory Conformance Integration Test
* **Files / Modules:**
  * `packages/orchestrator/src/mcp-client.ts` using `StreamableHTTPClientTransport`.
  * `packages/orchestrator/test/mcp-conformance.test.ts`
* **Expected Behavior:** Physical client connects over HTTP to physical server, initializes, discovers tools dynamically, invokes `search_knowledge`, and receives structured demo results.
* **Acceptance Criteria:** Conformance test passes over actual network socket without mocks.
* **Automated Tests:** Mandatory integration test chain described in `docs/mcp-architecture.md`.

---

## Stage 4: SQLite Database Store & Crash Recovery
* **Files / Modules:**
  * `packages/orchestrator/src/db/schema.ts`
  * `packages/orchestrator/src/db/index.ts` (WAL mode SQLite connection)
  * `packages/orchestrator/src/db/recovery.ts` (startup reconciliation)
  * `packages/orchestrator/test/db.test.ts`
* **Expected Behavior:** Creates all 9 tables, enforces foreign keys, handles worker leases, and reconciles interrupted missions on restart.
* **Acceptance Criteria:** Database survives simulated process crash; unverified tasks flagged for recovery.
* **Automated Tests:** Concurrency lease test, crash recovery reconciliation test.

---

## Stage 5: State Machine & Backend Approval Service
* **Files / Modules:**
  * `packages/orchestrator/src/state-machine.ts` (Full 12-state FSM)
  * `packages/orchestrator/src/approval-service.ts` (SHA-256 canonical fingerprinting)
  * `packages/orchestrator/test/state-machine.test.ts`
  * `packages/orchestrator/test/approval.test.ts`
* **Expected Behavior:** Rejects illegal transitions; enforces action fingerprinting; atomically consumes approvals.
* **Acceptance Criteria:** Parameter mismatch rejects resolution; replay attempts return 409 Conflict.
* **Automated Tests:** State machine transition matrix test; approval security boundary test.

---

## Stage 6: Orchestrator Loop & Vertical Slice Mission (Local Mode)
* **Files / Modules:**
  * `packages/orchestrator/src/orchestrator.ts` (Planner, step runner, verifier)
  * `packages/orchestrator/src/modes/local-mode.ts` (Deterministic heuristic runner)
  * `packages/orchestrator/src/modes/llm-mode.ts` (LLM provider adapter)
  * `packages/orchestrator/test/vertical-slice.test.ts`
* **Expected Behavior:** Runs the entire "Meeting Preparation" mission from start to finish in local mode, halting for approval, resuming upon signature, and verifying outcome.
* **Acceptance Criteria:** Independent verification confirms goal satisfaction with score >= 0.85.

---

## Stage 7: Next.js Web UI Shell & Invariant Sidebar
* **Files / Modules:**
  * `apps/web/src/app/layout.tsx` (Global Shell with 8-item Sidebar)
  * `apps/web/src/components/Sidebar.tsx` (Exact order: Home, New Conversation, Missions, Knowledge, Tools, Integrations, Activity, Settings)
  * `apps/web/src/components/TopNavbar.tsx` (Amazon smile accent, command search, profile badge)
  * `apps/web/src/app/*/page.tsx` (Base route scaffolding for all 8 routes)
* **Expected Behavior:** All 8 screens render with exact visual hierarchy matching reference PDF.
* **Manual Verification:** Visual check of navigation and routing.

---

## Stage 8: Real-Time SSE Streaming & Visual Screen Components
* **Files / Modules:**
  * `apps/web/src/app/api/missions/[id]/stream/route.ts` (SSE broadcaster)
  * Visual components matching Pages 1–9:
    * `/` (Home hero & use cases)
    * `/new` (Blank template & dual-pane live execution with collapsible drawer)
    * `/missions/[id]` (5-phase DAG stepper & live tool JSON inspector)
    * `/knowledge` (Document browser & tabbed insights)
    * `/tools` (MCP-discovered tool cards & bottom pipeline stepper)
    * `/integrations` (Adapter cards with local demo status badges)
    * `/activity` (Sparklines & audit event timeline)
    * `/settings` (Profile card & preference forms)
* **Expected Behavior:** Web client receives live streaming events from the orchestrator and renders real progress without artificial timers or fake tool logs.

---

## Stage 9: End-to-End Scenario Verification & Demonstration Polish
* **Execution:** Run complete end-to-end mission via UI; verify live SSE stream, approval modal, and persistent reflection across Knowledge, Tools, and Activity screens.
* **Acceptance Criteria:** Full demo executes cleanly with truthful operational state.
