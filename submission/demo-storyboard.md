# ORCHESTRA — Hackathon Demo Storyboard

**Project:** ORCHESTRA (Agentic Mission-Execution Platform)  
**Hackathon:** Build, Ship, Shape: Amazon Developer Hackathon 2026 (Alexa+ Track)  
**Target Video Length:** 2:45 (165 seconds)  
**Target Format:** 16:9 Landscape (1920x1080 Full HD)  

---

## Visual Storyboard Layout

```
+-----------------------------------------------------------------------------+
| [0:00 - 0:22] SCENE 1: THE AGENT SAFETY CRISIS                              |
| Slide 01-title-problem.png                                                   |
| - Bold Typography: "Autonomous Agents: High Capability, Zero Safety"        |
| - Visual graphic: Uncontrolled agent hallucinations vs broken production   |
| - Audio: Problem statement on destructive unmonitored AI actions            |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| [0:22 - 0:48] SCENE 2: INTRODUCING ORCHESTRA                                |
| Slide 02-orchestra-solution.png -> Transition to Live UI Dashboard          |
| - ORCHESTRA Logo & Core Pillars: Deterministic FSM, MCP, Human Gates       |
| - Dark-mode glassmorphic Mission Control dashboard                          |
| - Audio: Mission statement and architectural philosophy                     |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| [0:48 - 1:18] SCENE 3: MISSION CREATION & DAG PLANNER                       |
| Live Screen Capture: Mission Creation Modal & Workflow Visualizer           |
| - User types: "Deploy Production Release v1.4 & Notify Stakeholders"        |
| - DAG compiles automatically into 5 dependent steps                         |
| - Smooth camera zoom on Step 1 executing automatically via MCP              |
| - Audio: Explaining deterministic DAG compilation & 8-state state machine   |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| [1:18 - 1:52] SCENE 4: HUMAN APPROVAL & POST-ACTION VERIFICATION            |
| Live Screen Capture: Approval Required Drawer & Verification Engine         |
| - Step 3 (Deploy Infrastructure) enters APPROVAL_REQUIRED (amber pulse)      |
| - Approval drawer slides in: inspect payload, diff, risk score              |
| - Click "Approve": instant state shift to RUNNING -> VERIFYING              |
| - Cryptographic SHA-256 fingerprint verified; badge turns Green (COMPLETED)  |
| - Audio: Zero-trust safety controls and post-execution verification         |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| [1:52 - 2:20] SCENE 5: MCP SERVER & STREAMABLE HTTP ARCHITECTURE             |
| Slide 03-architecture.png + Terminal Split Screen                           |
| - MCP Streamable HTTP endpoint: /mcp/sse                                     |
| - Dynamic tool schema discovery and execution engine                        |
| - AES-256-GCM token vault and monorepo structure (67/67 tests passing)      |
| - Audio: Alexa+ Track alignment with open Model Context Protocol standards  |
+-----------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------+
| [2:20 - 2:45] SCENE 6: CONCLUSION, REPO LINKS & CALL TO ACTION              |
| Slide 04-conclusion.png & Completed Mission View                            |
| - Mission summary with 100% verification score                              |
| - GitHub repository URL & Live Render application link                      |
| - Audio: Summary of transformative value for enterprise agentic workflows   |
+-----------------------------------------------------------------------------+
```

---

## Detailed Scene Breakdown

### Scene 1: The Problem (0:00 - 0:22 | 22 Seconds)
- **Visual Asset:** `submission/assets/01-title-problem.png`.
- **Composition:** High-contrast dark slide (Slate #0B0F17) with neon red/amber accent elements. Text overlay: *"The Problem: The Black-Box Agent Crisis"*. Subtext: *"Hallucinations, uncontrolled execution, and irreversible real-world side effects."*
- **Camera/Animation:** Subtle Ken Burns slow zoom (100% to 105% over 15 seconds), followed by a swift slide transition right.
- **Narration Hook:** "Autonomous AI agents promise to run our workflows, but in production, they face a fatal flaw..."

### Scene 2: The Solution (0:22 - 0:48 | 26 Seconds)
- **Visual Asset:** `submission/assets/02-orchestra-solution.png` transitioning smoothly into full-screen browser recording of the live ORCHESTRA dashboard (`http://localhost:3000` or `https://alexa-orchestra.onrender.com`).
- **Composition:** Clean glassmorphism UI displaying the top stats bar (Active Missions: 3, Available MCP Tools: 12, Safety Enforcements: 100%, State Health: Nominal).
- **Camera/Animation:** Mouse cursor moves deliberately across the navigation bar: Missions, Integrations, MCP Tools, Audit Logs.
- **Narration:** "Meet ORCHESTRA. Built for the Amazon Alexa+ Track, ORCHESTRA is an agentic mission-execution platform..."

### Scene 3: Live Mission Creation & DAG Compilation (0:48 - 1:18 | 30 Seconds)
- **Visual Asset:** Live UI screen recording of the **Missions** page.
- **Composition:** 
  1. Click the primary button `+ New Mission`.
  2. Modal opens. Enter Mission Title: `Deploy Production Release v1.4 & Notify Stakeholders`.
  3. Select Mode: `Agentic Autonomous with Safety Gates`. Click `Launch Mission`.
  4. The DAG visualizer renders animated nodes connected with directional arrows:
     - Node 1: `artifact_check` (MCP tool)
     - Node 2: `security_scan` (MCP tool)
     - Node 3: `deploy_infrastructure` (High-Risk Action)
     - Node 4: `verify_health` (Verification Action)
     - Node 5: `post_notification` (Slack/Email Action)
- **Camera/Animation:** Smooth focus zoom on Node 1 executing (blue spinner turning into green checkmark).
- **Narration:** "Let's create a mission: deploying a production release. In real-time, the ORCHESTRA planner evaluates dependencies..."

### Scene 4: Human-in-the-Loop Approval & Verification (1:18 - 1:52 | 34 Seconds)
- **Visual Asset:** Live UI screen recording of the approval interaction.
- **Composition:**
  1. Node 3 (`deploy_infrastructure`) halts. The node border pulses in amber (`#F59E0B`). State indicator shifts to `APPROVAL_PENDING`.
  2. User clicks the node. The slide-out approval drawer displays:
     - Target Service: `AWS ECS Cluster / Production`
     - Action Risk: `CRITICAL`
     - Proposed Diff: `Image tag update: v1.3 -> v1.4`
     - Safety Policy Check: `PASSED (Pre-requisite security scans clean)`
  3. Mouse clicks the emerald `Approve Execution` button.
  4. Status transitions to `RUNNING`, completes, then transitions to `VERIFYING`.
  5. The post-action verification executes `GET /health` and verifies SHA-256 state hashes, marking the step `VERIFIED`.
- **Camera/Animation:** Close-up on the state transitions and badge updates.
- **Narration:** "Here's the critical breakthrough: when ORCHESTRA reaches a destructive step, it halts..."

### Scene 5: MCP Architecture & Technical Depth (1:52 - 2:20 | 28 Seconds)
- **Visual Asset:** `submission/assets/03-architecture.png` + terminal window showing the test runner passing `67/67` tests and the MCP server endpoint listening.
- **Composition:** Visual diagram of:
  - `LLM Agent / Alexa+` <---> `MCP Client (@orchestra/mcp-client)`
  - `MCP Server (@orchestra/mcp-server)` via `Streamable HTTP / SSE`
  - `Deterministic FSM Engine` <---> `Cryptographic State Verifier`
  - `Encrypted Token Store (AES-256-GCM)`
- **Camera/Animation:** Highlights illuminate the MCP connection pipeline and unit test suite passing 100%.
- **Narration:** "Under the hood, ORCHESTRA is powered by the Model Context Protocol..."

### Scene 6: Summary & Conclusion (2:20 - 2:45 | 25 Seconds)
- **Visual Asset:** `submission/assets/04-conclusion.png` featuring live app badges, GitHub repo badges, and contact/team details.
- **Composition:**
  - Center: ORCHESTRA logo + tagline: *"Safe. Verifiable. Agentic."*
  - Links: `https://alexa-orchestra.onrender.com`
  - GitHub: `github.com/25A31A4325/Alexa-`
  - Hackathon: *Amazon Developer Hackathon 2026 — Alexa+ Track*
- **Camera/Animation:** Slow fade-out to black at 2:45.
- **Narration:** "ORCHESTRA transforms AI agents from risky toys into enterprise-ready operators. Check out our open-source codebase on GitHub..."

---

## Technical Recording Specifications

- **Recording Software:** OBS Studio (Recommended) / Loom / Windows Game Bar (`Win + Alt + R`)
- **Canvas Resolution:** 1920x1080 (16:9)
- **Frame Rate:** 60 fps (or 30 fps)
- **Bitrate:** 8,000 - 12,000 kbps (CBR, H.264 / NVENC or x264)
- **Audio Sample Rate:** 48 kHz, 24-bit stereo
- **Browser Settings:** Google Chrome, 100% DPI scaling, Dark Theme, Bookmarks bar hidden (`Ctrl + Shift + B`), Fullscreen mode (`F11`)
