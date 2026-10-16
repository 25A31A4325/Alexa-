# ORCHESTRA — Initial Tool Contracts Specification (Updated)

All tools are exposed by the self-hosted MCP server over Streamable HTTP and strictly typed via Zod schemas.

Demonstration data returned by any tool is explicitly flagged as `is_local_demo: true` and labeled as local demonstration records.

---

## 1. Domain: KNOWLEDGE

### 1.1. `search_knowledge`
* **Description:** Searches the local demonstration knowledge repository for relevant documents, notes, and previous meeting briefs.
* **Classification:** `AUTONOMOUS` (Read-only)
* **Input Schema:**
  ```typescript
  z.object({
    query: z.string().describe("Search keywords or natural language query"),
    category: z.enum(["all", "documents", "notes", "meetings", "reports"]).optional().default("all"),
    limit: z.number().int().positive().max(10).optional().default(5)
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    results: z.array(z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
      relevance: z.enum(["High", "Medium", "Low"]),
      pageCount: z.number(),
      snippet: z.string(),
      is_local_demo: z.literal(true)
    })),
    totalCount: z.number()
  })
  ```

### 1.2. `retrieve_document`
* **Description:** Retrieves the complete metadata and text content of a specific demonstration knowledge document.
* **Classification:** `AUTONOMOUS` (Read-only)
* **Input Schema:**
  ```typescript
  z.object({
    documentId: z.string().describe("Unique identifier of the document (e.g. 'doc-q4-roadmap')")
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    id: z.string(),
    title: z.string(),
    fileType: z.string(),
    size: z.string(),
    pages: z.number(),
    updatedAt: z.string(),
    content: z.string(),
    is_local_demo: z.literal(true)
  })
  ```

### 1.3. `analyze_document`
* **Description:** Analyzes documents to extract executive summaries, key insights, and actionable preparation items.
* **Classification:** `AUTONOMOUS` (Analysis)
* **Input Schema:**
  ```typescript
  z.object({
    documents: z.array(z.string()).describe("List of document filenames or IDs to analyze"),
    analysis_type: z.enum(["key_points", "summary", "risk_assessment", "action_items"]),
    focus: z.array(z.string()).describe("Aspects to focus on (e.g. ['decisions', 'action_items', 'risks'])")
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    key_topics: z.array(z.string()),
    action_items: z.array(z.string()),
    risks: z.array(z.string()),
    summary: z.string()
  })
  ```

---

## 2. Domain: PLANNING

### 2.1. `create_task`
* **Description:** Adds an actionable item to the mission task list with priority and deadlines.
* **Classification:** `AUTONOMOUS` (Internal mutation)
* **Input Schema:**
  ```typescript
  z.object({
    missionId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    estimatedMinutes: z.number().optional()
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    taskId: z.string(),
    title: z.string(),
    status: z.enum(["pending", "in_progress", "completed"]),
    createdAt: z.string()
  })
  ```

### 2.2. `update_task`
* **Description:** Updates the status or details of an existing mission task.
* **Classification:** `AUTONOMOUS` (Internal mutation)
* **Input Schema:**
  ```typescript
  z.object({
    taskId: z.string(),
    status: z.enum(["pending", "in_progress", "completed", "failed"]),
    notes: z.string().optional()
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    taskId: z.string(),
    updatedStatus: z.string(),
    updatedAt: z.string()
  })
  ```

### 2.3. `get_task_status`
* **Description:** Retrieves the progress and status of all tasks associated with a mission.
* **Classification:** `AUTONOMOUS` (Read-only)
* **Input Schema:**
  ```typescript
  z.object({
    missionId: z.string()
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    missionId: z.string(),
    totalTasks: z.number(),
    completedTasks: z.number(),
    tasks: z.array(z.object({
      taskId: z.string(),
      title: z.string(),
      status: z.string()
    }))
  })
  ```

---

## 3. Domain: CONTEXT

### 3.1. `get_conversation_context`
* **Description:** Retrieves demonstration user profile preferences and historical conversation context.
* **Classification:** `AUTONOMOUS` (Read-only)
* **Input Schema:**
  ```typescript
  z.object({
    contextKeys: z.array(z.string()).describe("Keys to retrieve, e.g. ['user_profile', 'active_meeting', 'timezone']")
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    context: z.record(z.any()),
    is_local_demo: z.literal(true)
  })
  ```

### 3.2. `save_context`
* **Description:** Stores key synthesized entities or mission facts into persistent context memory for subsequent steps.
* **Classification:** `AUTONOMOUS` (Internal mutation)
* **Input Schema:**
  ```typescript
  z.object({
    key: z.string(),
    value: z.any(),
    missionId: z.string().optional()
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    savedKey: z.string(),
    timestamp: z.string()
  })
  ```

---

## 4. Domain: VERIFICATION

### 4.1. `verify_action`
* **Description:** Validates a planned action against user constraints, prerequisites, and approval policy.
* **Classification:** `AUTONOMOUS` (Analysis)
* **Input Schema:**
  ```typescript
  z.object({
    actionType: z.string().describe("e.g. 'calendar_create_reminder', 'email_checklist'"),
    parameters: z.record(z.any()),
    requiresApproval: z.boolean()
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    isValid: z.boolean(),
    approvalRequired: z.boolean(),
    warnings: z.array(z.string()),
    actionFingerprint: z.string()
  })
  ```

### 4.2. `detect_conflict`
* **Description:** Checks for schedule overlaps, contradictory task items, or missing critical inputs before finalizing a plan.
* **Classification:** `AUTONOMOUS` (Analysis)
* **Input Schema:**
  ```typescript
  z.object({
    items: z.array(z.object({
      id: z.string(),
      timeSlot: z.string().optional(),
      topic: z.string()
    }))
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    hasConflicts: z.boolean(),
    conflicts: z.array(z.object({
      itemA: z.string(),
      itemB: z.string(),
      reason: z.string()
    }))
  })
  ```

### 4.3. `validate_result`
* **Description:** Performs final holistic verification comparing the mission outcome against the initial user request.
* **Classification:** `AUTONOMOUS` (Analysis)
* **Input Schema:**
  ```typescript
  z.object({
    originalGoal: z.string(),
    executedSteps: z.array(z.string()),
    deliverables: z.record(z.any())
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    isComplete: z.boolean(),
    confidenceScore: z.number().min(0).max(1),
    unmetObjectives: z.array(z.string()),
    verificationSummary: z.string()
  })
  ```

---

## 5. Domain: CONSEQUENTIAL ACTIONS (Require Human Approval)

### 5.1. `calendar_create_reminder`
* **Description:** Creates an alert/reminder in the demonstration calendar store.
* **Classification:** `CONSEQUENTIAL` (**Mandatory Human Approval Required**)
* **Input Schema:**
  ```typescript
  z.object({
    title: z.string(),
    reminderTime: z.string().describe("ISO 8601 timestamp"),
    notes: z.string().optional()
  })
  ```
* **Output Schema:**
  ```typescript
  z.object({
    reminderId: z.string(),
    scheduledTime: z.string(),
    status: z.literal("scheduled"),
    is_local_demo: z.literal(true)
  })
  ```
