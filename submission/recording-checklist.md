# ORCHESTRA — Demo Video Recording Checklist & Runbook

This runbook gives you a complete, step-by-step procedure to record, edit, and export your 2-minute-45-second hackathon submission video.

---

## 1. Pre-Recording Setup & Environment

### A. Display & Browser Configuration
- [ ] **Display Resolution:** Set your primary monitor resolution to **1920 × 1080 (1080p)**.
- [ ] **Scaling:** Set Windows Display Scaling to **100%** (Settings > Display > Scale = 100%) to ensure sharp fonts and UI components.
- [ ] **Browser:** Open Google Chrome or Microsoft Edge.
- [ ] **Window Mode:** Press `F11` for full screen, or hide the bookmarks bar (`Ctrl + Shift + B`).
- [ ] **Clean Tab:** Close all other browser tabs, developer tools, and extensions with visible badges.
- [ ] **Theme:** Ensure ORCHESTRA is displayed in Dark Mode.

### B. Audio & Microphone Setup
- [ ] **Microphone:** Use a dedicated headset or USB microphone (avoid built-in laptop mic if possible).
- [ ] **Room Acoustics:** Record in a quiet room; close windows and turn off fans/AC.
- [ ] **Audio Levels:** Test speaking volume so that the input meter peaks between `-12 dB` and `-6 dB` (green/yellow zone; never red/clipping).
- [ ] **Pop Filter / Distance:** Keep mic roughly 4 to 6 inches from your mouth at a slight 45° angle.

### C. Recording Software (Choose One)
- **Option 1: OBS Studio (Best Quality)**
  - Base (Canvas) Resolution: 1920x1080.
  - Output (Scaled) Resolution: 1920x1080.
  - FPS: 60 fps (or 30 fps).
  - Video Encoder: Hardware (NVENC / AMD AMF / QuickSync) or Software (x264, Rate Control CBR 8,000 kbps).
  - Audio: 48 kHz, Stereo, 192 kbps.
- **Option 2: Windows Built-In Screen Recorder (Easiest)**
  - Press `Win + Alt + R` to immediately start/stop recording.
  - Recorded video saves automatically to `Videos/Captures/`.
- **Option 3: Loom / Clipchamp**
  - Select "Screen + Microphone" (Camera optional, but pure screen + slides is cleaner for technical hackathons).
  - Resolution: 1080p HD.

---

## 2. Rehearsal & Live Application Walkthrough

Before hitting record, test these three local/live steps:

### Scenario Walkthrough Steps:
1. **Open ORCHESTRA:**
   - Deployed: `https://alexa-orchestra.onrender.com`
   - Or Local: `http://localhost:3000` (run `npm run start:web` or `npm run dev`)
2. **Navigate to Missions:**
   - Click `Missions` in the left sidebar.
   - Click `+ New Mission`.
   - Title: `Deploy Production Release v1.4 & Notify Stakeholders`.
   - Goal: `Execute zero-trust deployment pipeline with human gate`.
   - Click `Create & Plan`.
3. **Inspect the DAG Execution:**
   - Observe Node 1 (`validate_code`) run and turn green.
   - Observe Node 2 (`security_scan`) run and turn green.
   - Observe Node 3 (`deploy_infrastructure`) stop with amber status: **APPROVAL REQUIRED**.
4. **Approve Step:**
   - Click the pending approval badge or node.
   - Review the action parameters and diff.
   - Click **Approve Action**.
   - Watch Node 3 execute and transition to **VERIFIED** with green checkmark.
5. **View MCP Tools:**
   - Click `Integrations` or `MCP Tools` in the sidebar to show the tool registry (`google_calendar`, `slack_notify`, `github_pr`).
6. **Return to Mission Summary:**
   - Show 100% completed mission state with cryptographic audit log.

---

## 3. Recording Timeline & Asset Insertion (Under 3 Minutes)

Follow this precise timeline:

| Timecode | Asset / Action | Narration Focus |
|:---------|:---------------|:----------------|
| `0:00 - 0:22` | Display `submission/assets/01-title-problem.png` (Slide 1) | The agent safety crisis: autonomous actions without safety rails or verification. |
| `0:22 - 0:48` | Display `submission/assets/02-orchestra-solution.png` then cut to Live Web Dashboard | What ORCHESTRA is: FSM, DAG planner, MCP transport, human-in-the-loop. |
| `0:48 - 1:18` | Live UI: Click `New Mission`, create production deployment, show DAG compile | Deterministic mission execution across 8 states. |
| `1:18 - 1:52` | Live UI: Halts on critical node, click `Approve Execution`, show verified badge | Zero-trust human approval and SHA-256 state verification. |
| `1:52 - 2:20` | Display `submission/assets/03-architecture.png` + show terminal tests (`67 passing`) | MCP Streamable HTTP, SSE protocol, AES-256-GCM token security. |
| `2:20 - 2:45` | Display `submission/assets/04-conclusion.png` + Live Links | Recap, business impact, GitHub repo, live Render demo link. |

---

## 4. Post-Recording Editing & Export Checklist

- [ ] **Verify Duration:** Video length MUST be under 3 minutes (`<= 02:59`). Our script is timed to `02:45`.
- [ ] **Trim Dead Space:** Cut out pauses before speaking and after clicking.
- [ ] **Add Captions:** In Clipchamp, Premiere, DaVinci Resolve, or directly on YouTube, import `submission/demo-captions.srt`.
- [ ] **Audio Balance:** Voiceover clear and loud (centered around -6dB). Background music (if any) quiet (-20dB to -24dB).
- [ ] **Export Settings:**
  - Container: `.mp4`
  - Codec: H.264
  - Resolution: 1920 × 1080 (1080p)
  - Frame Rate: 30 or 60 fps
  - Bitrate: 10,000 - 15,000 kbps

---

## 5. YouTube Upload & Submission Field

1. Navigate to [studio.youtube.com](https://studio.youtube.com).
2. Click **Create** > **Upload videos**.
3. Select your exported `.mp4` file.
4. **Title:** `ORCHESTRA — Agentic Mission-Execution Platform (Amazon Developer Hackathon 2026)`
5. **Description:**
   ```markdown
   ORCHESTRA is an agentic mission-execution platform that coordinates autonomous tools, 
   finite-state orchestration, human approvals, and cryptographic action verification.

   Submission for the Build, Ship, Shape: Amazon Developer Hackathon 2026 (Alexa+ Track).

   Live Demo: https://alexa-orchestra.onrender.com
   GitHub Repository: https://github.com/25A31A4325/Alexa-
   ```
6. **Visibility:** Select **Unlisted** or **Public** (Do NOT choose Private; judges must be able to view without a Google login).
7. **Subtitles:** Click `Subtitles` in YouTube Studio and upload `submission/demo-captions.srt`.
8. **Copy URL:** Paste the YouTube link into the Devpost submission field: **Demo Video**.
