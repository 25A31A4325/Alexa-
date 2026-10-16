# ORCHESTRA — Agent State Machine Specification (Refined)

## 1. Complete State Topology

The mission lifecycle is governed by an explicit deterministic Finite State Machine (FSM). Arbitrary jumps between states are forbidden.

```
                             +--------------------+
                             |     SUBMITTED      |
                             +---------+----------+
                                       |
                                       v
                             +--------------------+
                      +----> |    UNDERSTANDING   |
                      |      +---------+----------+
                      |                |
(User clarifies)      |                +------------------------------+
                      |                |                              | (Ambiguity / Missing inputs)
                      |                v                              v
                      |      +--------------------+         +--------------------+
                      +------+      PLANNING      |         |NEEDS_CLARIFICATION |
                             +---------+----------+         +---------+----------+
                                       |                              |
                                       v                              | (Timeout / Abort)
                             +--------------------+                   v
                             |  DISCOVERING_TOOLS |         +--------------------+
                             +---------+----------+         |     CANCELLED      |
                                       |                    +--------------------+
                                       v                              ^
                             +--------------------+                   |
           +---------------> |     EXECUTING      |                   |
           |                 +---------+----------+                   |
           |                           |                              |
           |           +---------------+---------------+              |
           |           |                               |              |
           |           v (Recoverable Tool Error)      v (Consequential Tool Planned)
           | +--------------------+          +--------------------+   |
           | |     RECOVERING     |          | AWAITING_APPROVAL  |   |
           | +---------+----------+          +---------+----------+   |
           |           |                               |              |
           +-----------+ (Retried / Fallback)          | (User Reject)|
           |                                           +--------------+
           |                                           | (User Approves with matching token)
           |                                           v
           |                                 +--------------------+
           +---------------------------------+ EXECUTING_APPROVED |
                                             +--------------------+
                                                       |
                                                       v (All DAG tasks executed)
                                             +--------------------+
                                             |     VERIFYING      |
                                             +---------+----------+
                                                       |
                                    +------------------+------------------+
                                    |                                     |
                                    v (Verification passes)               v (Verification fails)
                          +--------------------+                +--------------------+
                          |     COMPLETED      |                |       FAILED       |
                          +--------------------+                +--------------------+
```

---

## 2. Complete State-Transition Specification

Every transition is triggered by a concrete event, validated against preconditions, persists changes inside an atomic SQLite transaction, and defines explicit failure/retry rules.

| Source State | Destination State | Triggering Event | Required Precondition / Validation | Persistent Changes (SQLite) | Failure Behavior | Retries Allowed? | Safe to Repeat? |
|---|---|---|---|---|---|---|---|
| `*` (initial) | `SUBMITTED` | User submits objective prompt | Prompt non-empty (`length >= 3`) | `INSERT INTO missions (id, goal, status='submitted', created_at)` | Rejects with 400 Bad Request | No | No (generates fresh UUID) |
| `SUBMITTED` | `UNDERSTANDING` | Orchestrator picks up mission | Mission exists, status is `SUBMITTED` | `UPDATE missions SET status='understanding', updated_at` | Marks mission `FAILED` | No | Yes (idempotent state claim) |
| `UNDERSTANDING` | `NEEDS_CLARIFICATION` | Missing critical constraints detected | Goal lacks critical parameters that cannot be inferred | `UPDATE missions SET status='needs_clarification', clarification_prompt=?` | If prompt cannot be saved, transitions to `FAILED` | Yes (waits for user response) | Yes |
| `NEEDS_CLARIFICATION` | `UNDERSTANDING` | User submits clarification input | Clarification text present | `UPDATE missions SET status='understanding', goal = goal || '\n' || ?` | Rejects empty input | Yes | No |
| `UNDERSTANDING` | `PLANNING` | Objectives & entities successfully extracted | Summary structured, entities identified | `UPDATE missions SET status='planning', understanding_summary=?` | On extraction parse failure, transitions to `RECOVERING` | Yes (up to 2 retries) | No |
| `PLANNING` | `DISCOVERING_TOOLS` | Plan DAG generated | DAG contains >= 1 valid task, dependencies form acyclic graph | `INSERT INTO execution_plans; INSERT INTO mission_tasks; UPDATE missions SET status='discovering_tools'` | On circular dependency or empty plan, transitions to `PLANNING` retry | Yes (up to 2 retries) | No |
| `DISCOVERING_TOOLS` | `EXECUTING` | MCP `tools/list` returns registered tools | Tools list returned from MCP server over Streamable HTTP | `UPDATE missions SET status='executing', discovered_tools_cache=?` | If MCP server unreachable, transitions to `RECOVERING` | Yes (exponential backoff) | Yes (read-only discovery) |
| `EXECUTING` | `EXECUTING` | Task step finishes; next task starts | Active task completed, dependencies for next task satisfied | `UPDATE mission_tasks SET status='completed'; UPDATE mission_tasks SET status='in_progress' WHERE id=next_id` | If task output invalid, marks task `failed` and transitions to `RECOVERING` | Task-dependent | No |
| `EXECUTING` | `RECOVERING` | Tool call fails / network timeout / invalid output | Failure is retryable (`retry_count < max_retries`), action non-consequential | `UPDATE missions SET status='recovering'; UPDATE mission_tasks SET retry_count = retry_count + 1` | If `retry_count >= max_retries`, transitions to `FAILED` | Yes | No |
| `RECOVERING` | `EXECUTING` | Backoff elapsed / fallback tool selected | Fallback plan or retry payload ready | `UPDATE missions SET status='executing'` | If retry throws unhandled error, transitions to `FAILED` | Yes (bounded) | No |
| `EXECUTING` | `AWAITING_APPROVAL` | Next task is marked `CONSEQUENTIAL` | Pre-verification tool (`verify_action`) passes; action fingerprint created | `INSERT INTO approvals (status='pending', action_fingerprint=?); UPDATE missions SET status='awaiting_approval'` | If fingerprint generation fails, transitions to `FAILED` | No (waits for human) | Yes |
| `AWAITING_APPROVAL` | `EXECUTING_APPROVED` | User signs approval via `POST /api/approvals/:id/resolve` | Approval record exists, `status='pending'`, current time < `expires_at`, provided fingerprint matches stored SHA-256 | `UPDATE approvals SET status='approved', resolved_at=?; UPDATE missions SET status='executing_approved'` | If token mismatch or expired, rejects POST with 403/409, remains in `AWAITING_APPROVAL` or transitions to `EXPIRED` | Yes (user can re-sign) | No (single-use atomic consumption) |
| `AWAITING_APPROVAL` | `CANCELLED` | User rejects action or aborts mission | User clicks Reject / Cancel | `UPDATE approvals SET status='rejected'; UPDATE missions SET status='cancelled'` | Database write error logged | No | Yes (terminal) |
| `EXECUTING_APPROVED` | `EXECUTING` | Approved tool finishes successfully | Tool returned valid MCP result, activity logged | `UPDATE mission_tasks SET status='completed'; UPDATE missions SET status='executing'` | If approved tool fails runtime execution, transitions to `RECOVERING` without re-approval bypass | Re-approval required | No |
| `EXECUTING` | `VERIFYING` | All DAG tasks in `completed` status | All plan tasks resolved; outputs accumulated | `UPDATE missions SET status='verifying'` | If missing deliverables, transitions to `RECOVERING` | No | Yes |
| `VERIFYING` | `COMPLETED` | Independent verification passes (`validate_result`) | Goal satisfaction validated against initial objective, confidence $\ge 0.85$, zero unmet criteria | `INSERT INTO verification_results; UPDATE missions SET status='completed', completed_at=?` | If validation fails, transitions to `FAILED` or `RECOVERING` | No | Yes (terminal) |
| `VERIFYING` | `FAILED` | Verification detects unresolved gaps or contradictions | Goal unfulfilled despite task completion | `INSERT INTO verification_results (is_valid=0); UPDATE missions SET status='failed', error_message=?` | None (terminal) | No | Yes (terminal) |
| `*` (any non-terminal) | `CANCELLED` | Explicit user abort requested | Mission not in `COMPLETED` or `FAILED` | `UPDATE missions SET status='cancelled', updated_at=?` | Database write error logged | No | Yes (terminal) |
| `*` (any non-terminal) | `FAILED` | Fatal unrecoverable system exception | Max retries exceeded or unhandled exception | `UPDATE missions SET status='failed', error_message=?` | None (terminal) | No | Yes (terminal) |

---

## 3. Concurrency, Reentrancy, and Restart Invariants

### 3.1. Single-Active-Worker Lease (Optimistic Concurrency)
To prevent duplicate execution when multiple API requests or background workers poll the same mission:
* The `missions` table contains `lock_worker_id TEXT` and `lock_expires_at INTEGER`.
* A worker must claim execution via an atomic conditional query:
  ```sql
  UPDATE missions 
  SET lock_worker_id = :workerId, lock_expires_at = :expiresAt 
  WHERE id = :missionId 
    AND (lock_worker_id IS NULL OR lock_expires_at < :now)
    AND status IN ('submitted', 'understanding', 'planning', 'discovering_tools', 'executing', 'executing_approved', 'verifying');
  ```
* If zero rows are updated, the worker aborts immediately (another worker holds the lease).

### 3.2. Server Process Restart Recovery
When the orchestrator process boots, it executes a startup reconciliation routine:
1. Inspects all missions with non-terminal status (`executing`, `executing_approved`, `verifying`, `recovering`).
2. Checks the active task step in `mission_tasks`:
   - If the task was mid-flight and non-consequential: Marks the invocation as `interrupted` and resets the task to `pending` with `retry_count = retry_count + 1`.
   - If the task was `CONSEQUENTIAL`: **Never re-executes automatically.** It inspects external state or sets the mission to `AWAITING_APPROVAL` / human intervention required.
3. If a mission was `AWAITING_APPROVAL`, it remains `AWAITING_APPROVAL` with its existing TTL.
4. Releases any orphaned worker leases (`lock_worker_id = NULL`).

### 3.3. Independent Objective Verification Before Completion
A mission is **never marked completed simply because its last tool call returned success**. 
* Completion requires entering `VERIFYING`.
* In `VERIFYING`, the orchestrator invokes `validate_result` with the original objective, the executed tasks, and all deliverables.
* Only when `validate_result` confirms that all constraints are met does the mission transition to `COMPLETED`.
