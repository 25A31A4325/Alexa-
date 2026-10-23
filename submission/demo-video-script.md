# ORCHESTRA — Official Hackathon Demo Video Script

**Event:** Build, Ship, Shape: Amazon Developer Hackathon 2026  
**Track:** Alexa+ Track  
**Project:** ORCHESTRA (Agentic Mission-Execution Platform)  
**Target Duration:** 2 minutes 45 seconds (Strictly under the 3:00 hackathon limit)  
**Tone:** Confident, crisp, authoritative, engineering-focused  
**Target Audience:** Technical judges, Amazon Alexa+ engineering leadership, Devpost reviewers  

---

## Production Metadata

- **Resolution:** 1920 × 1080 (1080p, 60fps or 30fps)
- **Audio:** Crisp vocal track, subtle ambient electronic/lo-fi background music (ducked -18dB during voiceover)
- **Visuals:** Clean browser screen recording (Chrome in Dark Mode, 100% zoom) alternating with crisp 1080p slide overlays from `submission/assets/`
- **Total Word Count:** ~395 words (~145 words per minute, optimal conversational pace)

---

## Detailed Scene-by-Scene Script

### Scene 1: The Problem — The Chaos of Autonomous Agents
- **Time:** `0:00 - 0:22` (Duration: 22s)
- **Visual:** Display `submission/assets/01-title-problem.png`. Motion zoom in slightly. Cut to high-level terminal or frantic agent logs showing cascading hallucinated tool calls.
- **On-Screen Text:** *Autonomous Agents Lack Deterministic Control & Safety Gates*
- **Voiceover (Audio):**
  > "Autonomous AI agents promise to run our workflows, but in production, they face a fatal flaw: black-box execution, unpredictable hallucinations, and zero safety controls when performing destructive actions. If an agent deletes a cloud database or deploys broken code, there is no rewind button."

---

### Scene 2: The Solution — Introducing ORCHESTRA
- **Time:** `0:22 - 0:48` (Duration: 26s)
- **Visual:** Cut to `submission/assets/02-orchestra-solution.png`. Transition smoothly to the live web interface (`https://alexa-orchestra.onrender.com` or `localhost:3000`) displaying the ORCHESTRA Mission Control dashboard with dark-mode glassmorphic styling, live metrics, and real-time activity stream.
- **On-Screen Text:** *ORCHESTRA — Agentic Mission-Execution Platform with Human-in-the-Loop Governance*
- **Voiceover (Audio):**
  > "Meet ORCHESTRA. Built for the Amazon Alexa+ Track, ORCHESTRA is an agentic mission-execution platform that brings deterministic finite-state control, human-in-the-loop governance, and verifiable auditability to autonomous tool execution. Instead of blind delegation, ORCHESTRA compiles intent into a validated Directed Acyclic Graph, executing tools through the Model Context Protocol."

---

### Scene 3: Live Mission Creation & DAG Compilation
- **Time:** `0:48 - 1:18` (Duration: 30s)
- **Visual:** Screen capture on live UI. Click **"New Mission"**. Enter mission title: *"Deploy Production Release v1.4 & Notify Stakeholders"*. Set priority to **Critical**. Click **"Create Mission"**. Watch the DAG visualizer automatically instantiate nodes: `Validate Artifacts` → `Security Audit` → `Deploy Infrastructure` → `Verify Health` → `Post-Release Notification`.
- **On-Screen Text:** *Deterministic DAG Planning & 8-State Finite State Machine*
- **Voiceover (Audio):**
  > "Let's create a mission: deploying a production release. In real-time, the ORCHESTRA planner evaluates dependencies and compiles an execution graph across eight formal states. Every step is cryptographically bound, and low-risk steps like artifact validation and security linting execute automatically via Streamable HTTP MCP tools."

---

### Scene 4: Human-in-the-Loop Approval & Verification Gates
- **Time:** `1:18 - 1:52` (Duration: 34s)
- **Visual:** The execution pauses at node 3 (`Deploy Infrastructure`). Node glows amber with badge **"APPROVAL REQUIRED"**. The sidebar shows a pending approval banner. Click into the approval drawer: show the exact diff, tool payload (`deploy_infrastructure`), risk level (`HIGH`), and timeout. Click **"Approve Execution"**. The state machine immediately transitions from `APPROVAL_PENDING` to `RUNNING` and executes the action. Node turns green with badge **"VERIFIED"**.
- **On-Screen Text:** *Zero-Trust Human Approval & Post-Action Cryptographic Verification*
- **Voiceover (Audio):**
  > "Here's the critical breakthrough: when ORCHESTRA reaches a destructive step, it halts. The state machine transitions to Approval Required. The human operator reviews the exact action payload, parameters, and risk score. We approve the step, execution seamlessly resumes, and our verification engine validates the output state using SHA-256 state fingerprinting before marking it complete."

---

### Scene 5: MCP Streamable HTTP Architecture & Alexa+ Integration
- **Time:** `1:52 - 2:20` (Duration: 28s)
- **Visual:** Cut to `submission/assets/03-architecture.png`. Quick split-screen showing the terminal running the MCP Server SSE stream (`GET /mcp/sse`) and the UI Integrations / Tool Registry displaying discovered tools (`google_calendar`, `github_pr`, `slack_notify`, `system_shell`).
- **On-Screen Text:** *Official Model Context Protocol (MCP) | Streamable HTTP & SSE Transport*
- **Voiceover (Audio):**
  > "Under the hood, ORCHESTRA is powered by the Model Context Protocol. By exposing tools over Streamable HTTP and Server-Sent Events, Alexa+ agents and LLMs can dynamically discover capabilities, stream payloads with low latency, and store OAuth tokens encrypted with AES-256-GCM. 100% of our core packages are fully verified with 67 passing unit and integration tests."

---

### Scene 6: Conclusion & Impact
- **Time:** `2:20 - 2:45` (Duration: 25s)
- **Visual:** Cut to `submission/assets/04-conclusion.png`. Pan across the finished mission summary: all nodes green, complete audit trail, execution timeline, and exported audit log. Fade to title card with GitHub URL and live demo link.
- **On-Screen Text:** *ORCHESTRA — Safe, Auditable, Autonomous Execution for Alexa+*
- **Voiceover (Audio):**
  > "ORCHESTRA transforms AI agents from risky toys into enterprise-ready operators. With deterministic state machines, MCP standard interoperability, and human verification, it represents the future of safe agentic workflows. Check out our open-source codebase on GitHub and test the live platform on Render today. Thank you!"

---

## Audio-Visual Timing Grid

| Scene # | Timecode Range | Duration | Visual Asset / Screen Action | Spoken Word Count |
|:-------:|:--------------:|:--------:|:-----------------------------|:-----------------:|
| **1** | `0:00 - 0:22` | 22s | Title Card 1 (`01-title-problem.png`) / Chaotic Agent Visual | 51 words |
| **2** | `0:22 - 0:48` | 26s | Title Card 2 (`02-orchestra-solution.png`) / Web Dashboard Hero | 62 words |
| **3** | `0:48 - 1:18` | 30s | Live Mission Creation / DAG Visualizer | 68 words |
| **4** | `1:18 - 1:52` | 34s | Approval Drawer / State Transition / Verification Badge | 74 words |
| **5** | `1:52 - 2:20` | 28s | Architecture Slide (`03-architecture.png`) / MCP Tool Stream | 68 words |
| **6** | `2:20 - 2:45` | 25s | Conclusion Slide (`04-conclusion.png`) / Audit Summary & Links | 57 words |
| **TOTAL** | `0:00 - 2:45` | **165s** | **Full 1080p Presentation & Live Walkthrough** | **380 words** |
