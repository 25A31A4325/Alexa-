# ORCHESTRA — Orchestrator Architecture Specification

## 1. Overview
The `@orchestra/orchestrator` package implements the controlled, stateful, multi-step execution engine for ORCHESTRA. It translates user goals into acyclic task graphs (DAGs), dynamically discovers tools from the self-hosted MCP server over Streamable HTTP, executes tasks, halts for backend-enforced human approvals on consequential actions, and independently verifies outcomes before marking missions complete.

---

## 2. Core Modules
* **Mission State Machine (`src/state-machine.ts`):** Enforces the 13-state FSM, rejects illegal transitions, and persists all updates to SQLite with audit records.
* **Objective Understanding (`src/understanding.ts`):** Parses user input into structured criteria, extracting constraints, ambiguities, and potential consequential operations.
* **Plan Creation & DAG Validation (`src/planner.ts`):** Forms task graphs with dependencies and verifies acyclicity using depth-first cycle detection.
* **Dynamic MCP Tool Discovery & Execution (`src/orchestrator.ts`):** Connects to `OrchestraMcpClient`, queries `tools/list` over Streamable HTTP, and executes tools via `tools/call` without duplicating the tool catalog.
* **Approval Security Gate (`src/approvals.ts`):** Enforces policy-based gating for consequential actions (`calendar_create_reminder`), canonicalizes parameters, verifies SHA-256 fingerprints, and performs single-use atomic resolution.
* **Mission Verifier (`src/verifier.ts`):** Independently assesses all executed tool records and deliverables against original objectives before granting `COMPLETED` status.
* **Persistence Layer (`src/db.ts`):** Node 24 native SQLite implementation managing missions, tasks, dependencies, approvals, verification results, tool invocations, and activity events.

---

## 3. Worker Leasing & Concurrency
Workers acquire an atomic lease on a mission before running:
```sql
UPDATE missions
SET lock_worker_id = ?, lock_expires_at = ?
WHERE id = ? AND (lock_worker_id IS NULL OR lock_expires_at < ? OR lock_worker_id = ?);
```
If another worker holds an active lease, the operation aborts to prevent duplicate execution or race conditions.

---

## 4. Local Demonstration vs External Mutation
All calendar items, meeting briefs, and notes in the initial prototype utilize local demonstration data stored in SQLite and flagged with `is_local_demo: true`. No external calendar APIs or cloud services are claimed or invoked.
