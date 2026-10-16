# ORCHESTRA — Architecture Specification (Refined)

## 1. Executive Summary & Purpose
**ORCHESTRA** is an enterprise agentic mission-execution platform designed for the Amazon Developer Hackathon 2026 (Alexa+ track). It is engineered to solve complex, multi-step real-world objectives by coordinating information, tasks, dependencies, tools, approvals, and verification into one deterministic, auditable workflow.

ORCHESTRA is **not a generic chatbot** and **not a toy demo**. It enforces an explicit multi-phase mission execution lifecycle:
$$\text{UNDERSTAND} \longrightarrow \text{PLAN} \longrightarrow \text{DISCOVER TOOLS} \longrightarrow \text{EXECUTE} \longrightarrow \text{OBSERVE} \longrightarrow \text{RECOVER} \longrightarrow \text{VERIFY} \longrightarrow \text{REQUEST APPROVAL} \longrightarrow \text{EXECUTE APPROVED} \longrightarrow \text{PRESENT RESULTS}$$

---

## 2. High-Level System Topology

```
+-----------------------------------------------------------------------------------------+
|                                    ORCHESTRA CLIENT                                      |
|                                (Next.js 15 / React 19)                                  |
|                                                                                         |
|  [Sidebar Navigation (Fixed Invariant)]                                                 |
|  - Home (/), New (/new), Missions (/missions), Knowledge (/knowledge)                   |
|  - Tools (/tools), Integrations (/integrations), Activity (/activity), Settings (/settings)|
|                                                                                         |
|  [Live Views & Dashboards]                                                              |
|  - 5-Phase DAG Stepper (Understand -> Plan -> Use Tools -> Verify -> Results)           |
|  - Dual-Pane Chat & Execution Plan Checklist (Page 3)                                   |
|  - Live Mission Tool Trace: Input & Output (Live) JSON Inspectors (Page 4)              |
|  - Truthful Operational State: Real progress timers, real error states, demo labels     |
+--------------------------------------------^--------------------------------------------+
                                             | Server-Sent Events (SSE) / JSON REST
                                             v
+-----------------------------------------------------------------------------------------+
|                               NEXT.JS BACKEND RUNTIME                                   |
|                                                                                         |
|  +-------------------------+     +--------------------------+     +-------------------+ |
|  |   Mission Orchestrator  | <-> |    Agent State Machine   | <-> | Approval Engine   | |
|  | (Dual Mode: LLM / Local) |     | (Strict FSM with Leases) |     | (Backend Enforced)| |
|  +------------^------------+     +--------------------------+     +-------------------+ |
|               |                                                             |           |
|               | (Dynamic Discovery & Invocation)                            |           |
|  +------------v------------+     +--------------------------+               |           |
|  |     MCP Client Node     |     |   SQLite Database Store  | <-------------+           |
|  | (@modelcontextprotocol) |     |      (better-sqlite3)    |                           |
|  +------------^------------+     +--------------------------+                           |
+---------------|-------------------------------------------------------------------------+
                |
                | Streamable HTTP Transport (POST /mcp, GET /mcp with Session & SSE)
                v
+-----------------------------------------------------------------------------------------+
|                           SELF-HOSTED MCP SERVER (Node.js)                              |
|                          (@modelcontextprotocol/sdk v1.x)                               |
|                                                                                         |
|  Endpoints:                                                                             |
|  - POST /mcp (JSON-RPC 2.0 requests: initialize, tools/list, tools/call)                |
|  - GET  /mcp (Streaming notifications / request-scoped SSE)                             |
|                                                                                         |
|  Registered Real Tool Suites:                                                           |
|  1. Knowledge: search_knowledge, retrieve_document, analyze_document                     |
|  2. Planning:  create_task, update_task, get_task_status                                 |
|  3. Context:   get_conversation_context, save_context                                   |
|  4. Verification: verify_action, detect_conflict, validate_result                        |
|  5. Consequential: calendar_create_reminder                                             |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Core Architectural Modules

### 3.1. Web Application (`apps/web`)
* **Framework:** Next.js 15 (App Router), React 19, TypeScript.
* **Styling & Assets:** Tailwind CSS, Lucide React (exact visual hierarchy, typography, and density matching PDF Pages 1–9).
* **Sidebar Invariant:** Enforces the absolute invariant 8-item sidebar across every single route:
  1. `Home` (`/`)
  2. `New Conversation` (`/new`)
  3. `Missions` (`/missions`)
  4. `Knowledge` (`/knowledge`)
  5. `Tools` (`/tools`)
  6. `Integrations` (`/integrations`)
  7. `Activity` (`/activity`)
  8. `Settings` (`/settings`)
* **Integrations Transparency:** Clearly distinguishes genuinely connected services, local demonstration adapters (`is_local_demo = true`), and unavailable integrations.
* **Truthful State:** No fake progress animations; intermediate timers reflect actual backend execution durations.

### 3.2. Agent Orchestration Engine (Dual Mode)
* **LLM Mode:**
  - Pluggable provider adapter (Anthropic Claude 3.5 Sonnet / AWS Bedrock / OpenAI / Google Gemini).
  - Credentials remain strictly server-side (`.env.local`).
  - Private reasoning/chain-of-thought is kept private; only structured events, step descriptions, and tool traces are emitted to client.
* **Local Test Mode (Deterministic):**
  - Uses rule-based deterministic heuristics to plan and execute tasks.
  - Exercises the exact physical MCP client, Streamable HTTP transport, and real tool handlers.
  - Enables zero-cost, offline, completely reproducible automated test suites.

### 3.3. Self-Hosted MCP Server (`packages/mcp-server`)
* **Transport:** Official `StreamableHTTPServerTransport` over Node.js HTTP (`/mcp`).
* **Protocol:** JSON-RPC 2.0 compliant Model Context Protocol (2024-11-05 standard).
* **Tool Handlers:** Fully typed Zod schemas; validates inputs, executes deterministic logic with identified local demonstration records, and returns structured MCP responses.

### 3.4. Persistence & Database Layer
* **Engine:** SQLite using `better-sqlite3` (WAL mode enabled, robust single-file local database).
* **Schema Support:**
  - `conversations`, `missions`, `execution_plans`, `mission_tasks`, `task_dependencies`
  - `mcp_tool_invocations`, `approvals`, `verification_results`, `knowledge_documents`, `activity_events`
* **Concurrency & Leasing:** Single-active-worker lease preventing duplicate execution.
* **Crash Resilience:** Startup reconciliation cleans orphaned locks, reconciles mid-flight non-consequential tasks, and safeguards pending approvals.

---

## 4. First End-to-End Mission Scenario (Vertical Slice)

**User Prompt:**  
*"I have an important meeting tomorrow. Check my calendar, understand what the meeting is about, find relevant documents, determine what I haven't prepared, prepare a checklist, and remind me what I need to do."*

### Execution Stages:
1. **Understand:** Extracts meeting details (Product Roadmap Discussion, tomorrow 10:00 AM) and objectives.
2. **Plan:** Decomposes into ordered tasks with dependencies:
   - Task 1: Check calendar & meeting details (`get_conversation_context`)
   - Task 2: Search relevant documents (`search_knowledge`)
   - Task 3: Retrieve roadmap document (`retrieve_document`)
   - Task 4: Analyze document content & gaps (`analyze_document`)
   - Task 5: Run conflict & schedule detection (`detect_conflict`)
   - Task 6: Create prioritized preparation checklist (`create_task`)
   - Task 7: Propose reminder creation (**Consequential** $\rightarrow$ `verify_action`)
3. **Approval Gate:** Execution halts in `AWAITING_APPROVAL`. Backend hashes parameters into SHA-256 fingerprint. UI renders approval card.
4. **Execution of Approved Action:** User clicks approve; backend verifies token in SQLite transaction; tool `calendar_create_reminder` runs.
5. **Independent Verification:** Orchestrator calls `validate_result` comparing checklist, extracted insights, and reminder against the initial prompt.
6. **Results Presentation:** UI renders final outcome; document citations appear in right sidebar; events persisted in `activity_events` and `knowledge_documents`.
