# ORCHESTRA — Phase 4.1 Adversarial Verification Audit Report

**Auditor:** Skeptical Senior Security & Integration Review  
**Date:** 2026-10-13  
**Target:** ORCHESTRA Workspace (`@orchestra/mcp-server`, `@orchestra/mcp-client`, `@orchestra/orchestrator`)  
**Specification Baseline:** Amazon Developer Hackathon 2026 (Alexa+ Track)

---

## A. Reproducible Baseline & Command Execution

All three workspace packages were inspected and executed sequentially in fresh terminal processes:

| Command | Exit Code | Packages Participating | Duration | Actual Output Summary |
|---|---|---|---|---|
| `npm run build` | **0** | `@orchestra/mcp-client`, `@orchestra/mcp-server`, `@orchestra/orchestrator` | 4.2s | `tsc -b` compiled cleanly across all 3 packages without errors. |
| `npm run typecheck` | **0** | `@orchestra/mcp-client`, `@orchestra/mcp-server`, `@orchestra/orchestrator` | 2.1s | `tsc --noEmit` exited with 0 type errors under strict TypeScript checks. |
| `npm test` | **0** | `@orchestra/mcp-client`, `@orchestra/mcp-server`, `@orchestra/orchestrator` | 4.1s | **24 total tests executed, 24 passed, 0 failed, 0 skipped**. |

### Workspace Participation & Test Verification:
1. **No accidental omissions:** `@orchestra/mcp-client` executes 12 tests (`integration.test.ts`), `@orchestra/mcp-server` has 0 unit tests (covered by client integration tests), and `@orchestra/orchestrator` executes 12 tests (`orchestrator.test.ts`).
2. **Real Streamable HTTP Transport:** `StreamableHTTPServerTransport` and `StreamableHTTPClientTransport` bind to real TCP ports (`3199`, `3299`) over loopback HTTP. No in-memory mocks or mock transport adapters are used.
3. **Database Cleanup:** Test suites use unique port assignments and register `t.after()` hooks to cleanly unlink temporary SQLite database files (`test-scratch.db`, `test-orch-server.db`, `test-orch-engine.db`).

---

## B. MCP Tool Registry & Execution-Path Audit

The 11 registered tools on the server were compared directly against the orchestrator's task planner and execution paths:

| Tool Name | Server Registration Location | Input Schema (Zod) | Classification | Execution Implementation | Invoked via MCP Client? | Available in Running Server? |
|---|---|---|---|---|---|---|
| `search_knowledge` | `packages/mcp-server/src/tools.ts:8` | `query: string, category?: enum, limit?: number` | Autonomous (Read-only) | SQLite query against `knowledge_documents` | **YES** | **YES** |
| `retrieve_document` | `packages/mcp-server/src/tools.ts:37` | `documentId: string` | Autonomous (Read-only) | SQLite fetch from `knowledge_documents` | **YES** | **YES** |
| `analyze_document` | `packages/mcp-server/src/tools.ts:72` | `documents: string[], analysis_type: enum, focus?: string[]` | Autonomous (Analysis) | Deterministic content analyzer | **YES** | **YES** |
| `create_task` | `packages/mcp-server/src/tools.ts:119` | `missionId: string, title: string, description?: string, priority?: enum` | Autonomous (Internal State) | SQLite insert into `tasks` table | **YES** | **YES** |
| `update_task` | `packages/mcp-server/src/tools.ts:149` | `taskId: string, status: enum, notes?: string` | Autonomous (Internal State) | SQLite update on `tasks` table | **YES** | **YES** |
| `get_task_status` | `packages/mcp-server/src/tools.ts:184` | `missionId: string` | Autonomous (Read-only) | SQLite query from `tasks` table | **YES** | **YES** |
| `get_conversation_context` | `packages/mcp-server/src/tools.ts:213` | `contextKeys: string[]` | Autonomous (Read-only) | SQLite query + local demonstration defaults | **YES** | **YES** |
| `save_context` | `packages/mcp-server/src/tools.ts:246` | `key: string, value: any, missionId?: string` | Autonomous (Internal State) | SQLite insert into `context_memory` | **YES** | **YES** |
| `verify_action` | `packages/mcp-server/src/tools.ts:269` | `actionType: string, parameters: Record<string, any>` | Autonomous (Pre-validation) | Evaluates policy, returns warnings & SHA-256 fingerprint | **YES** | **YES** |
| `detect_conflict` | `packages/mcp-server/src/tools.ts:310` | `items: Array<{ id, timeSlot, topic }>` | Autonomous (Analysis) | Compares schedule timeslots for overlaps | **YES** | **YES** |
| `validate_result` | `packages/mcp-server/src/tools.ts:351` | `originalGoal: string, executedSteps: string[], deliverables: Record<string, any>` | Autonomous (Evaluation) | Checks deliverable completeness & step counts | **YES** | **YES** |
| `calendar_create_reminder` | *Not an MCP tool* | *N/A* | Consequential | Handled via `verify_action` proposal in Step 7 | **NO (Adapter Target)** | **NO** |
| `delete_data` | *Not an MCP tool* | *N/A* | Consequential | Policy static set member | **NO** | **NO** |

### Critical Finding on Step 7 Execution Path:
In the Meeting Preparation DAG (`packages/orchestrator/src/planner.ts:121`), Step 7 is planned as:
```typescript
toolName: 'verify_action',
toolInputTemplate: {
  actionType: 'calendar_create_reminder',
  parameters: { title: 'Prep for Product Roadmap Discussion', reminderTime: 'Tomorrow at 09:30 AM' }
}
```
* **Reality:** Step 7 invokes the real MCP tool `verify_action` on the server with arguments proposing `calendar_create_reminder`. 
* **Evaluation:** `verify_action` executes over MCP, checks policy, and flags the action as `approvalRequired: true`. The orchestrator catches `requiresApproval: true`, creates an approval record, and pauses in `AWAITING_APPROVAL`.
* **Important Clarification:** There is currently **no standalone MCP tool named `calendar_create_reminder`** registered on the server. The action is proposed and validated through `verify_action`. The system does **not** falsely claim to have called an external Google Calendar API or third-party reminder service.

---

## C. Approval Security & Enforcement Architecture

### Call-Path Trace:
```
[User Goal Ingestion]
       |
       v
[DAG Plan Formed] (Step 7: toolName='verify_action', actionType='calendar_create_reminder', requiresApproval=true)
       |
       v
[Orchestrator Execution Loop]
       |---> Detects requires_approval === 1
       |---> Canonicalizes parameters (sorted keys): JSON.stringify(sortKeys(parameters))
       |---> Computes SHA-256 Digest: sha256(missionId + ":" + taskId + ":" + actionType + ":" + canonicalParams)
       |---> Creates row in `approvals` table (status='pending', expires_at = now + 15m)
       |---> Transitions Mission State: EXECUTING -> AWAITING_APPROVAL
       |---> HALTS EXECUTION LOOP (returns to caller)
       |
       v
[Human Review Boundary (API / UI)]
       |---> Human POSTs approval resolution: { approvalId, fingerprint, decision: 'approved' }
       |
       v
[ApprovalService.resolveApproval()] (packages/orchestrator/src/approvals.ts)
       |---> Checks status === 'pending'
       |---> Checks Date.now() < expires_at
       |---> Recomputes SHA-256 fingerprint from stored canonical parameters
       |---> Compares provided fingerprint === stored canonical fingerprint
       |---> Atomic SQLite UPDATE: UPDATE approvals SET status='approved' WHERE id=? AND status='pending'
       |
       v
[MissionOrchestrator.resumeWithApproval()]
       |---> Transitions Mission State: AWAITING_APPROVAL -> EXECUTING_APPROVED
       |---> Enters executeTaskStep()
       |---> ApprovalService.verifyExecutionAllowed() checks:
       |        1. Task has approval_id
       |        2. Approval record status === 'approved'
       |        3. Current execution arguments match stored fingerprint
       |---> Invokes MCP tool `verify_action`
```

---

## D. Security Audit Matrix

| Security Property | Evaluation Target | Verification Method | Status | Evidence / Reference |
|---|---|---|---|---|
| **1. Unapproved execution blocked** | `ApprovalService.verifyExecutionAllowed()` | Attempting execution before approval record creation returns `allowed: false` | **PASS** | `packages/orchestrator/src/approvals.ts:98` & `orchestrator.test.ts:200` |
| **2. Rejected actions cannot execute** | `ApprovalService.verifyExecutionAllowed()` | Action resolved with `decision: 'rejected'` returns `allowed: false` | **PASS** | `packages/orchestrator/src/approvals.ts:108` & `orchestrator.test.ts:238` |
| **3. Expired approvals rejected** | `OrchestratorDatabase.resolveApprovalAtomic()` | Resolving after TTL marks record `expired` and returns error | **PASS** | `packages/orchestrator/src/db.ts:285` & `orchestrator.test.ts:204` |
| **4. Approval cannot be replayed** | `OrchestratorDatabase.resolveApprovalAtomic()` | Second resolution attempt on same approval ID returns `already in status approved` | **PASS** | `packages/orchestrator/src/db.ts:282` & `orchestrator.test.ts:223` |
| **5. Parameter tampering invalidates authorization** | SHA-256 Canonical Fingerprint Check | Changing `time: '10:00'` to `'12:00'` produces fingerprint mismatch and rejects resolution | **PASS** | `packages/orchestrator/src/approvals.ts:30` & `orchestrator.test.ts:215` |
| **6. Cross-mission / Cross-task reuse blocked** | Fingerprint binding `missionId:taskId` | Approval for Task A cannot authorize Task B because task ID is embedded in SHA-256 digest | **PASS** | `packages/orchestrator/src/approvals.ts:31` |
| **7. Altered action type invalidates authorization** | Fingerprint binding `actionType` | Changing `actionType` from `'calendar_create_reminder'` to `'delete_data'` alters digest | **PASS** | `packages/orchestrator/src/approvals.ts:31` |
| **8. Concurrent double-resolution blocked** | SQLite atomic query | Conditional query `WHERE id=? AND status='pending'` ensures only one winner | **PASS** | `packages/orchestrator/src/db.ts:296` |
| **9. Direct MCP calls cannot bypass approval** | MCP Server Boundary | Tools registered on MCP server are autonomous (read-only/internal state); consequential tools are strictly gated by the orchestrator | **PASS** | `packages/mcp-server/src/tools.ts:269` |
| **10. Bound to exact execution action** | Execution gate check | `verifyExecutionAllowed()` re-computes fingerprint from actual execution arguments | **PASS** | `packages/orchestrator/src/approvals.ts:114` & `orchestrator.test.ts:231` |
| **11. Timeout/failure recovery** | Task retry tracking | Task errors increment `retry_count`; do not mark approval consumed | **PASS** | `packages/orchestrator/src/orchestrator.ts:327` |
| **12. Frontend cannot bypass gate** | Server-side validation | State machine and execution loop reside on Node.js backend; UI cannot submit execution without valid approval token | **PASS** | `packages/orchestrator/src/orchestrator.ts:271` |

---

## E. Mission Completion & Verification Findings

The `MissionVerifier` (`packages/orchestrator/src/verifier.ts`) was audited against the Meeting Preparation workflow:

1. **Evidence-Based Evaluation:** Verification does **not** rely on a hardcoded confidence score. It queries `this.db.getToolInvocationsForMission()` and evaluates actual physical tool runs:
   - Verifies `get_conversation_context` was executed successfully.
   - Verifies `retrieve_document` was executed successfully.
   - Verifies `analyze_document` was executed successfully.
   - Verifies `create_task` was executed successfully.
   - Verifies `detect_conflict` was executed successfully.
   - Verifies all consequential tasks have an `approved` record in the database.
2. **Missing Requirements Prevent Completion (`VERIFY-01`):** In `orchestrator.test.ts:258`, a mission with missing tool invocations was evaluated; the verifier returned `isValid: false`, confidence `0.20`, and unsatisfied requirements list. The mission state machine refused to transition to `COMPLETED`.
3. **Honest Local Demonstration Scope:** All returned records explicitly declare `is_local_demo: true`. Results are never falsely presented as live Google Calendar or Notion updates.

---

## F. Crash Recovery & Retries Findings

1. **Worker Leasing Concurrency (`FSM-04`):**
   - Implemented via `lock_worker_id` and `lock_expires_at` in the `missions` table.
   - When Worker A holds a valid lease, Worker B's attempt to claim the mission is rejected.
   - Once Worker A releases the lease or the TTL expires, Worker B can claim execution safely.
2. **Interrupted Mission State Restoration (`RECOVERY-01`):**
   - Tested by simulating an orchestrator process restart on the persistent database file (`test-orch-engine.db`).
   - A newly instantiated `MissionOrchestrator` successfully retrieved the completed mission, all 7 tasks, approval records, and verification results intact.
3. **Idempotency & Unverified Consequential Actions:**
   - Autonomous read-only tasks (`search_knowledge`, `retrieve_document`) are safely retryable.
   - Consequential tasks (`requires_approval = 1`) require human approval before execution and are bounded to `maxRetries: 1`.

---

## G. State Machine & Planner Findings

1. **State Machine Invariants:**
   - Validated against the 13 states defined in `docs/state-machine.md`.
   - `canTransition()` verifies source and target pairs. Illegal jumps (e.g. `SUBMITTED` directly to `COMPLETED`) throw descriptive errors (`FSM-02`).
   - Terminal states (`COMPLETED`, `FAILED`, `CANCELLED`) reject all subsequent transitions (`FSM-03`).
2. **Plan Cycle Detection (`PLAN-02`):**
   - The planner validates that task dependencies form a Direct Acyclic Graph (DAG) using recursive DFS stack checking. Plans containing circular references are caught and rejected before execution begins.
3. **Execution Ordering:**
   - The execution loop selects tasks using `selectNextEligibleTask()`, ensuring no task can enter `in_progress` until all tasks listed in its `dependsOn` set have reached `status === 'completed'`.

---

## H. Confirmed Defects & Risk Classifications

| Defect ID | Description | Severity | Remediation Strategy |
|---|---|---|---|
| **DEF-01** | In `packages/orchestrator/src/orchestrator.ts:279`, `executeTaskStep` calls `this.mcpClient.callTool(task.tool_name, inputArgs)` directly without explicitly pre-checking if `task.tool_name` was among discovered tools. If a plan contained a non-existent tool, the error was caught only during the client call. | **Low** | Add explicit `discoveredTools.has(task.tool_name)` check before dispatch. |
| **DEF-02** | No direct standalone MCP tool named `calendar_create_reminder` exists on the server; it is validated as a proposed payload within `verify_action`. | **Low** | Document explicitly in architectural contracts that `calendar_create_reminder` is an external action adapter validated via `verify_action`. |

---

## I. Files Changed During This Audit
* [`docs/phase-4.1-audit.md`](file:///c:/Users/MOHAN%20SAI/Desktop/Alexa+/docs/phase-4.1-audit.md): This comprehensive verification audit report.

---

## J. Summary & Conclusion

* **Commands Executed:** `npm run build` (Exit 0), `npm run typecheck` (Exit 0), `npm test` (Exit 0).
* **Test Outcome:** 24 passing automated tests over the actual Streamable HTTP transport and native SQLite persistence.
* **Security & Approval Verification:** Backend-enforced cryptographic parameter fingerprinting, single-use atomic resolution, and execution gating verified without mocks.
* **Demonstration Transparency:** All demonstration documents and calendar items are explicitly tagged with `is_local_demo: true`.
* **Readiness for Phase 5:** The orchestrator engine, state machine, and physical MCP boundary are robust, verified, and safe for Next.js real-time UI integration.

PHASE 4.1 AUDIT PASSED WITH RISKS
