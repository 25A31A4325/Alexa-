# ORCHESTRA — Security & Human Approval Architecture (Hardened)

## 1. Approval Security Philosophy
In agentic workflows, an approval modal in the frontend is purely a **presentation element**. Security and enforcement exist solely on the **backend**. The system operates on the principle of **Zero Implicit Execution for Consequential Actions**.

Neither the LLM nor the frontend UI can grant approval or bypass validation.

---

## 2. Action Classification Policy

All tools and actions are statically and dynamically classified by policy:

| Action Category | Classification | Policy Enforcement | Examples |
|---|---|---|---|
| **Query / Read-Only** | `AUTONOMOUS` | Allowed automatically; logged to `activity_events` | `search_knowledge`, `retrieve_document`, `get_conversation_context`, `get_task_status` |
| **Analysis / Computation** | `AUTONOMOUS` | Allowed automatically; logged to `activity_events` | `analyze_document`, `detect_conflict`, `validate_result` |
| **Internal Plan Mutation** | `AUTONOMOUS` | Allowed automatically within active mission boundary | `create_task`, `update_task`, `save_context` |
| **External Service Mutation** | `CONSEQUENTIAL` | **Mandatory Human-in-the-Loop Approval Required** | `calendar_create_event`, `calendar_create_reminder`, `send_notification`, `email_checklist`, `export_data` |
| **Permanent Deletion / Overwrite** | `CONSEQUENTIAL` | **Mandatory Human-in-the-Loop Approval Required** | `delete_data`, `clear_knowledge_base`, `revoke_integration` |

### Backend Classification Enforcement
The backend does not rely on the LLM to declare if an action is consequential. 
Instead, the orchestrator tool execution gate evaluates:
```typescript
export function isActionConsequential(toolName: string, parameters: Record<string, unknown>): boolean {
  const CONSEQUENTIAL_TOOLS = new Set([
    "calendar_create_event",
    "calendar_create_reminder",
    "send_notification",
    "email_checklist",
    "delete_data"
  ]);
  return CONSEQUENTIAL_TOOLS.has(toolName);
}
```
If `isActionConsequential()` evaluates to `true`, the orchestrator **immediately halts execution** and creates a cryptographically signed approval record.

---

## 3. Cryptographic Action Fingerprinting & Canonical Serialization

To prevent argument tampering, replaying, or parameters changing mid-flight, ORCHESTRA employs canonical JSON serialization and SHA-256 fingerprinting:

### 3.1. Canonical Parameter Normalization
Keys in the parameters object are sorted lexicographically, whitespace is stripped, and standard JSON stringification is applied:
$$\text{canonicalJson} = \text{JSON.stringify}(\text{sortKeysRecursively}(\text{parameters}))$$

### 3.2. Fingerprint Construction
$$\text{action\_fingerprint} = \text{SHA-256}(\text{missionId} + ":" + \text{taskId} + ":" + \text{actionType} + ":" + \text{canonicalJson})$$

---

## 4. Atomic Approval Resolution & Database Transactions

All approval resolution logic executes inside an atomic SQLite transaction (`BEGIN IMMEDIATE`):

```sql
-- 1. Fetch pending approval with exclusive lock
SELECT id, mission_id, task_id, action_type, parameters_json, action_fingerprint, status, expires_at
FROM approvals
WHERE id = :approvalId;

-- 2. Validate in application code:
--    a. status === 'pending'
--    b. expires_at > now()
--    c. sha256(canonical(parameters)) === action_fingerprint
--    d. provided fingerprint === stored fingerprint

-- 3. Atomic single-use state transition
UPDATE approvals 
SET status = :decision, resolved_at = :now, resolution_note = :note
WHERE id = :approvalId AND status = 'pending';
```

If zero rows are updated by step 3, another concurrent thread already resolved the approval, and the request is immediately rejected with `409 Conflict`.

---

## 5. Expiry, Rejection, Superseding, and Invalidation

1. **Expiry:** All approval requests have an explicit 15-minute Time-To-Live (`expires_at = now + 900`). Expired approvals cannot be executed under any circumstance.
2. **Rejection:** If the user clicks `Reject`, the status transitions to `rejected`. The orchestrator treats this as a hard refusal and enters `RECOVERING` to plan an alternative approach or halts the branch.
3. **Parameter Mutation (Superseding):** If the agent modifies any parameter of an action during a re-planning loop:
   - The existing pending approval is immediately marked `cancelled` with `resolution_note = 'superseded_by_replanning'`.
   - A fresh approval record is generated with a new unique ID, new timestamp, and newly computed fingerprint.
4. **No Replay:** Once an approval transitions to `approved`, its single-use `resolved_at` timestamp is set. The execution gate ensures an approval token can only dispatch execution once.

---

## 6. Threat Model & Security Controls

| Threat Vector | Severity | Mitigation Strategy |
|---|---|---|
| **Frontend Approval Bypass** | Critical | The MCP tool runner validates approval state directly against the database table `approvals` within the execution transaction. Direct API calls to execute consequential tools without a valid approved record return `403 Forbidden`. |
| **Parameter Tampering via REST API** | Critical | The client must pass `action_fingerprint` in `POST /api/approvals/:id/resolve`. The backend recomputes the SHA-256 hash from stored canonical parameters; any discrepancy triggers an immediate security alert. |
| **DNS Rebinding on Local MCP Port** | High | The self-hosted Express MCP server verifies `req.headers.host === 'localhost:3001'` or `http://127.0.0.1:3001`. Unrecognized host headers return `403 Forbidden`. |
| **Prompt Injection into Tool Arguments** | High | All tool inputs are strictly parsed against Zod schemas before handler execution. Unknown fields are stripped; type violations return JSON-RPC `-32602`. |
| **Credential / Secret Leakage in UI Streams** | High | The SSE event pipeline and activity logger run an egress filter that redacts API keys, bearer tokens, and credentials. |
