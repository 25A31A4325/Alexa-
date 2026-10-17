# ORCHESTRA — Phase 5: Real-Time Web UI and Mission Control Specification

**Amazon Developer Hackathon 2026 — Alexa+ Track**  
**Lead Builder:** Shanmukheswar | Pro Builder  
**Date:** October 13, 2026  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. Executive Summary

Phase 5 delivers the production web interface and live mission control for **ORCHESTRA**.  
The user interface connects directly to the underlying Model Context Protocol (MCP) server, 13-state orchestration engine, and SQLite persistence layer.

### Core Guarantees:
1. **Zero Mocked Tools:** Tools are registered and dynamically discovered using `@modelcontextprotocol/sdk` v1.32.1 over Streamable HTTP (`2025-11-25` specification).
2. **Deterministic UI State:** Views render true backend state persisted in Node.js 24 native SQLite (`node:sqlite DatabaseSync`).
3. **Persistent Invariant Navigation:** The 8-item sidebar is strictly maintained across every route with no deviation in sequence, labels, or routing.
4. **Live Human-in-the-Loop Gate:** Consequential actions enforce SHA-256 parameter fingerprint validation (RFC 8785 canonicalization) before resumption.
5. **Real-Time Streaming:** Server-Sent Events (`/api/missions/:id/events`) stream live DAG progress, state changes, and approval prompts without polling.

---

## 2. Global Navigation Invariant

As required by the primary visual specification, the left-hand navigation sidebar persists across all application views and contains **strictly 8 items in the exact order**:

| Sequence | ID | Label | Route | Icon | Purpose |
|:---:|:---|:---|:---:|:---:|:---|
| 1 | `home` | **Home** | `/` | 🏠 Home | Mission activity overview, high-level metrics, quick launch |
| 2 | `new-conversation` | **New Conversation** | `/new` | ➕ PlusCircle | Natural language objective submission, template launch cards |
| 3 | `missions` | **Missions** | `/missions` | 🧭 Compass | Execution DAG overview, live status filters, detail drilldown |
| 4 | `knowledge` | **Knowledge** | `/knowledge` | 📖 BookOpen | Document inspector, executive briefs, demo data isolation |
| 5 | `tools` | **Tools** | `/tools` | 🔧 Wrench | Dynamic MCP tool catalog, Zod schema inspector, risk ratings |
| 6 | `integrations` | **Integrations** | `/integrations` | 🔗 Share2 | Third-party connectors, local demo adapter labels, standby links |
| 7 | `activity` | **Activity** | `/activity` | 📊 BarChart2 | Chronological tamper-evident audit trail, execution metrics |
| 8 | `settings` | **Settings** | `/settings` | ⚙️ Settings | Builder profile, MCP protocol transport stats, security rules |

The sidebar footer permanently displays user credentials matching the visual reference: **Shanmukheswar | Pro Builder**.

---

## 3. Screen Specifications & Design Alignment

### 3.1 Home Dashboard (`/`)
- **Hero Banner:** "Turn complex goals into real outcomes with ORCHESTRA", featuring Alexa+ styling and quick launch actions.
- **Aggregated Metrics:** Total Missions Executed, Pending Human Approvals, Tool Invocations, and Audit Events.
- **Recent Missions List:** Displays real SQLite mission records with state badges (`COMPLETED`, `AWAITING_APPROVAL`, `EXECUTING`).
- **Live Activity Feed:** Recent operations from `activity_events`.

### 3.2 New Conversation / Mission Submission (`/new`)
- **Quick Action Cards:**
  - *Meeting Preparation:* "I have an important meeting tomorrow. Check my calendar, understand what the meeting is about, find relevant documents, determine what I haven't prepared, prepare a checklist, and remind me what I need to do."
  - *Analyze Document:* Pre-fills document analysis pipeline.
  - *Discover Tools:* Queries live MCP tool registry.
- **Submission Form:** Natural language objective prompt with client-side validation and immediate redirect to `/missions/:id`.

### 3.3 Missions List (`/missions`)
- Lists all active and historical DAG execution missions from SQLite.
- Badges reflect real state machine values (`SUBMITTED`, `UNDERSTANDING`, `PLANNING`, `DISCOVERING_TOOLS`, `EXECUTING`, `AWAITING_APPROVAL`, `EXECUTING_APPROVED`, `RECOVERING`, `VERIFYING`, `COMPLETED`, `FAILED`, `CANCELLED`).

### 3.4 Mission Control & DAG Inspector (`/missions/:id`)
- **5-Phase Horizontal Stepper:** Matches Page 4 of the reference PDF:
  `Understand` → `Plan` → `Use Tools` → `Verify` → `Results`
  Active and past stages light up dynamically according to the mission's 13-state FSM status.
- **Task DAG Checklist:** Visual cards for each subtask showing tool name, step index, execution status, and duration in ms.
- **Live Tool Invocations:** Dual inspector displaying exact `Input JSON` passed to MCP and actual `Output (Live MCP)` received.
- **Human Approval Security Modal:** When a consequential task triggers `AWAITING_APPROVAL`, an approval card renders:
  - Cryptographic SHA-256 fingerprint preview.
  - Action summary and exact parameters.
  - Interactive "Approve Action" and "Reject Action" buttons with fingerprint verification.
- **Verification Evidence Card:** If verification has run, displays confidence score (e.g. 100%), satisfied requirements list, and deliverable JSON.
- **Real-Time SSE Sync:** Client listens on `/api/missions/:id/events` and updates the UI upon state changes.

### 3.5 Knowledge Library (`/knowledge`)
- Displays documents from `knowledge_documents` table in SQLite (`doc-q4-roadmap`, `doc-competitor-analysis`, `doc-system-architecture`).
- **Demo Record Badge:** Explicitly labels records with `is_local_demo: true` to prevent misleading evaluators.
- **Document Detail Inspector:** Tabs for *Executive Summary*, *Key Insights*, *Action Items*, and *Raw Markdown Content*.

### 3.6 Discovered Tools Catalog (`/tools`)
- Discovers 11 tools directly from MCP server over Streamable HTTP:
  `search_knowledge`, `fetch_document`, `summarize_notes`, `check_calendar_availability`, `create_calendar_event`, `send_message`, `send_email`, `crm_lookup`, `crm_update_contact`, `get_task_status`, `update_task_record`.
- Classifies risk: Consequential tools requiring human approval are highlighted with amber lock badges; read-only tools with emerald check badges.
- Formatted Zod JSON schemas are inspectable for every tool.

### 3.7 Integrations & Connectors (`/integrations`)
- Connectors: Alexa Calendar, Slack Messaging, SQLite Knowledge Engine, Corporate Email Gateway, HubSpot CRM, Linear PM, AWS Bedrock.
- Clear distinction between `LOCAL DEMO ADAPTER` (safe deterministic mock without external credentials) and production links.

### 3.8 Activity & Audit Log (`/activity`)
- Real-time audit log of all events stored in `activity_events`.
- Filterable by `Mission`, `Tool`, `Approval`, `Verification`, and `Recovery`.
- Expandable JSON metadata inspector for debugging.

### 3.9 Settings & System Configuration (`/settings`)
- Builder Profile: Shanmukheswar | Pro Builder (Alexa+ Track).
- MCP Runtime details: Protocol version `2025-11-25`, transport `Streamable HTTP`, endpoint `http://http://127.0.0.1:3001/mcp`.
- Security Guardrails: SHA-256 canonical parameter fingerprinting policy, 300s TTL, 15000ms worker leases.

---

## 4. API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Health check returning service status, timestamp, and MCP protocol |
| `POST` | `/api/missions` | Submit mission objective `{ goal }`, returns `{ missionId, status }` |
| `GET` | `/api/missions/:id/state` | Returns structured JSON of mission, tasks, invocations, approvals, and verification |
| `POST` | `/api/approvals/:id/resolve` | Resolves approval with `{ expectedFingerprint, decision, note }` |
| `POST` | `/api/missions/:id/clarify` | Resumes mission from clarification state with `{ additionalContext }` |
| `GET` | `/api/missions/:id/events` | Server-Sent Events (SSE) connection pushing live mission events |

---

## 5. Verification & Test Summary

The web interface is verified via `apps/web/src/web.test.ts`:
- **11 Automated Tests:** 100% pass rate.
- **Repository Total:** 35 unit and integration tests passing with 0 failures across all 4 workspaces (`mcp-client`, `mcp-server`, `orchestrator`, `web`).
