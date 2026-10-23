# ORCHESTRA — Hackathon Judge Questions & Technical Defense Guide

**Hackathon:** Build, Ship, Shape: Amazon Developer Hackathon 2026  
**Track:** Alexa+ Track  
**Platform:** ORCHESTRA (Agentic Mission-Execution Platform)  

This guide prepares you for technical review, live Q&A sessions, and virtual judging evaluations. Each question includes a **Quick Spoken Answer (30 seconds)** for live conversations and an **In-Depth Technical Answer** for deep architectural evaluation.

---

### Q1: Why did you build ORCHESTRA instead of just using existing frameworks like LangChain, CrewAI, or AutoGen?

**Quick Spoken Answer (30s):**  
"Existing agent frameworks treat tool execution as a continuous, unconstrained loop inside a single LLM prompt. In an enterprise environment, that leads to cascading hallucinations, unpredictable tool calls, and runaway cloud costs. ORCHESTRA takes a fundamentally different approach: we decouple planning from execution. The agent creates a plan, but execution is governed by a strict, mathematical 8-state finite state machine with zero-trust human approval gates and post-execution verification."

**In-Depth Technical Answer:**  
- **Decoupled Architecture:** Most agent frameworks bind LLM generation directly to tool dispatch via `tools.invoke()`. ORCHESTRA compiles intent into a static Directed Acyclic Graph (DAG) before execution begins, executing topological sort with Kahn's algorithm to eliminate cyclic deadlocks.
- **State Invariants:** Our state machine in `@orchestra/orchestrator` enforces formal state transitions (`CREATED` → `PLANNING` → `PENDING_APPROVAL` → `APPROVED` → `RUNNING` → `VERIFYING` → `COMPLETED`). Out-of-order state transitions throw deterministic TypeScript exceptions.
- **Auditability:** Every state transition and tool parameter is cryptographically snapshotted, ensuring a deterministic audit log suitable for enterprise compliance.

---

### Q2: How does ORCHESTRA specifically integrate with Amazon Alexa+?

**Quick Spoken Answer (30s):**  
"Alexa+ is evolving from simple voice commands into an agentic system that executes complex multi-step workflows across personal and workplace services. ORCHESTRA serves as the reliable execution backbone for Alexa+. Through the Model Context Protocol (MCP) over Streamable HTTP and SSE, Alexa+ can discover available tools, stream tool invocations, and delegate high-risk actions to ORCHESTRA's human-in-the-loop approval engine without having to build bespoke safety guardrails."

**In-Depth Technical Answer:**  
- **MCP Over Streamable HTTP:** Rather than relying on proprietary Alexa Skill adapters, we expose our capabilities via the open Model Context Protocol standard (`/mcp/sse`). This allows Alexa+ runtimes to perform dynamic schema reflection, discovering tool definitions and parameter types over standard HTTP.
- **Voice-Safe Execution:** When Alexa+ triggers a workflow involving irreversible real-world side effects (e.g., updating production deployments, mass calendar deletion, financial transactions), ORCHESTRA halts execution, sending a push approval notification to the user's dashboard or companion app.
- **Sub-Second Streaming:** Server-Sent Events (SSE) allow Alexa+ to receive streaming status updates as each sub-node completes.

---

### Q3: How do your human approval gates work? Can an LLM prompt-inject or bypass them?

**Quick Spoken Answer (30s):**  
"No LLM can bypass our approval gate because the safety policy is enforced in hardcoded server-side code, not within the LLM prompt. In ORCHESTRA, every registered tool has a deterministic risk score. If a step is categorized as high or critical risk, the finite state machine transitions to `PENDING_APPROVAL` and physically pauses execution. Execution cannot resume until a signed, authenticated human session posts an approval event."

**In-Depth Technical Answer:**  
- **Architectural Isolation:** LLMs only generate intent; they do not have network access to dispatch execution commands. The `@orchestra/orchestrator` state machine evaluates the risk metadata of each node.
- **Cryptographic Diff Presentation:** The approval drawer renders the exact JSON-RPC payload, target endpoint, and proposed parameter diff. Operators inspect what will execute, not a natural language summary.
- **Timeout and Expiration Policies:** Approval requests feature configurable TTLs. If an operator does not affirmatively approve within the timeout window, the state machine automatically transitions to `FAILED` or `REJECTED`, preventing stale execution.

---

### Q4: What happens if a tool fails or throws an exception midway through a mission?

**Quick Spoken Answer (30s):**  
"Because ORCHESTRA organizes missions as a Directed Acyclic Graph, a failure at node 3 immediately halts downstream dependent nodes while preserving independent branches. The state machine transitions to `FAILED`, records the complete error payload in the audit trail, and prevents runaway retries. The operator can inspect the exact failed state and trigger a targeted retry without re-running previously verified nodes."

**In-Depth Technical Answer:**  
- **Dependency Isolation:** If Node A succeeds, its output state is cached and fingerprinted. If dependent Node B fails (e.g., HTTP 500 from an external API), the graph execution halts specifically for downstream descendants of B.
- **State Preservation:** Unlike monolithic scripts that lose all context on failure, ORCHESTRA stores each node's pre-state, post-state, and error stack in persistent database records.
- **Deadlock & Cycle Prevention:** The graph compiler enforces cycle detection at compile time, ensuring an error condition can never trigger infinite recursion or uncontrolled billing loops.

---

### Q5: Why did you adopt the Model Context Protocol (MCP) instead of standard REST or GraphQL?

**Quick Spoken Answer (30s):**  
"MCP is rapidly becoming the universal standard for connecting AI agents to tools and context. By building our server with official MCP Streamable HTTP and SSE specifications, ORCHESTRA is immediately compatible not only with Alexa+, but also with Claude, Cursor, and any MCP-compliant agent. It eliminates brittle custom SDKs and unifies tool definitions, schemas, and error handling across platforms."

**In-Depth Technical Answer:**  
- **Standardized Schema Reflection:** MCP defines JSON-RPC 2.0 protocols for `tools/list` and `tools/call`. Clients query tool schemas using standard JSON Schema definitions, eliminating hallucinated parameter names.
- **Streamable HTTP & SSE Transport:** Traditional REST requires polling for long-running tool executions. MCP's SSE transport provides a persistent bidirectional channel for streaming tool events, progress indicators, and status signals.
- **Enterprise Extensibility:** Third-party developers can plug any existing MCP server into ORCHESTRA without writing glue code.

---

### Q6: How do you secure OAuth credentials and API keys? Can tokens leak to the browser or LLM?

**Quick Spoken Answer (30s):**  
"Tokens and API keys never touch the client browser and are never passed into LLM prompts. All external credentials are encrypted at rest using military-grade AES-256-GCM encryption with server-side keys. In our latest release, we completely replaced access-key login with Argon2id password hashing and secure HTTP-only session cookies."

**In-Depth Technical Answer:**  
- **AES-256-GCM Vault:** External tokens (e.g., Google OAuth refresh tokens, GitHub Personal Access Tokens) are encrypted using AES-256-GCM with a 12-byte random initialization vector and PBKDF2 key derivation. The encryption key resides exclusively in the server environment (`TOKEN_ENCRYPTION_KEY`).
- **Zero-Exposure Prompts:** When an LLM generates a mission plan, it references tool identifiers (`google_calendar.create_event`), never the underlying token. The token is decrypted only inside the execution worker immediately prior to HTTPS dispatch.
- **Modern Authentication:** User login employs Argon2id (memory cost 65536, time cost 3, parallelism 4), with CSRF protection and secure session cookies.

---

### Q7: How does post-action verification work?

**Quick Spoken Answer (30s):**  
"An agent reporting 'Done' is not proof of success. LLMs frequently hallucinate that a database row was inserted or an email was sent. ORCHESTRA introduces a dedicated `VERIFYING` state. Following execution, our verification engine queries the external service or system environment, computes a SHA-256 cryptographic hash of the resulting state, and compares it against the expected invariant before marking the step `VERIFIED`."

**In-Depth Technical Answer:**  
- **State Snapshotting:** Prior to dispatching a tool call, the verifier captures an initial state snapshot $S_0$.
- **Invariant Validation:** After the tool executes, the verifier captures $S_1$ and evaluates the state transformation against assertions (e.g., verifying that a GitHub PR exists with the exact commit SHA, or checking that an HTTP endpoint returns status 200).
- **Cryptographic Fingerprinting:** A canonical SHA-256 hash is computed over the serialized state object:
  $$\text{Fingerprint} = \text{SHA-256}(\text{CanonicalJSON}(S_1))$$
  This fingerprint is permanently written to the mission audit log. If verification fails, the step is rejected regardless of what the tool claimed.

---

### Q8: What test coverage supports your production readiness claims?

**Quick Spoken Answer (30s):**  
"We maintain 100% test pass rate across our entire monorepo with 67 passing automated tests. We test state machine transitions, DAG cycle detection, approval timeouts, MCP Streamable HTTP protocols, Argon2id authentication, and AES-256-GCM encryption."

**In-Depth Technical Answer:**  
- **State Machine & DAG:** 12 automated unit tests in `@orchestra/orchestrator` verifying FSM invariants, topological sorting, edge validation, and timeout handling.
- **MCP Server & Client:** 21 automated integration tests in `@orchestra/mcp-server` and `@orchestra/mcp-client` verifying SSE protocol handshake, JSON-RPC 2.0 serialization, and error recovery.
- **Web & Security:** 34 automated unit and integration tests in `apps/web` verifying Argon2id password hashing, session cookies, AES-256 encryption roundtrips, and API routes.

---

### Q9: What was the biggest technical hurdle during development?

**Quick Spoken Answer (30s):**  
"Our biggest challenge was implementing Model Context Protocol's Streamable HTTP and SSE transport inside a unified Next.js App Router and standalone Node.js environment without dropping connection state. Ensuring zero-latency streaming while maintaining cryptographic transaction integrity required designing an isolated background execution runner with deterministic event dispatching."

---

### Q10: What is your roadmap for ORCHESTRA following the hackathon?

**Quick Spoken Answer (30s):**  
"Our roadmap focuses on three milestones: first, native voice integration with Alexa+ smart displays allowing hands-free voice approvals; second, multi-agent collaboration graphs where different specialized MCP agents negotiate sub-tasks within a single unified mission; and third, automated rollback synthesis using inverse tool operations for zero-touch disaster recovery."
