# ORCHESTRA — Verified Submission Links & Directory

**Hackathon:** Build, Ship, Shape: Amazon Developer Hackathon 2026  
**Track:** Alexa+ Track  
**Submission Portal:** Devpost  

---

## 1. Primary Submission Links

| Field Name | Live URL | Verification Status | Notes |
|:-----------|:---------|:-------------------:|:------|
| **Live Web Application** | [https://alexa-orchestra.onrender.com](https://alexa-orchestra.onrender.com) | **VERIFIED ACTIVE (200 OK)** | Hosted on Render, dark mode UI, full Mission Control |
| **Health Check API** | [https://alexa-orchestra.onrender.com/api/health](https://alexa-orchestra.onrender.com/api/health) | **VERIFIED ACTIVE (200 OK)** | Returns system health, uptime, and embedded MCP status |
| **MCP SSE Stream Endpoint** | [https://alexa-orchestra.onrender.com/mcp/sse](https://alexa-orchestra.onrender.com/mcp/sse) | **VERIFIED ACTIVE** | Streamable HTTP / Server-Sent Events endpoint for MCP tools |
| **Public GitHub Repository** | [https://github.com/25A31A4325/Alexa-](https://github.com/25A31A4325/Alexa-) | **VERIFIED PUBLIC** | Clean monorepo, complete commit history, MIT license |
| **Demo Video File** | `submission/demo-video.mp4` | **VERIFIED EXPORTED** | 1080p Full HD, duration **02:42.98**, size **8.05 MB**, H.264/AAC |
| **Demo Video (Public URL)** | `[INSERT_YOUTUBE_URL_HERE]` | *Ready for Upload* | Upload `submission/demo-video.mp4` to YouTube/Vimeo and paste here |

---

## 2. Git & Version Control Details

- **GitHub Repository:** `https://github.com/25A31A4325/Alexa-.git`
- **Default Branch:** `main`
- **Verified Commit:** `0d4355daabb2af7dfb4aec4de3ddcd0782d8ba25`
- **Monorepo Workspaces:**
  - `apps/web` (Next.js/Express App Router frontend & fullstack API)
  - `packages/orchestrator` (8-state FSM, DAG planner, verifier)
  - `packages/mcp-server` (Streamable HTTP MCP server)
  - `packages/mcp-client` (MCP client runtime)

---

## 3. Submission Documentation Index

All submission deliverables have been generated and structured inside the `submission/` folder:

1. **`submission/demo-video.mp4`**  
   *Master video file: 1920x1080, 2 minutes 42.98 seconds, 8.05 MB, complete with voiceover, real UI, slides, and lower-third captions.*

2. **`submission/demo-captions.srt`**  
   *Complete synchronized subtitle caption file ready for direct upload to YouTube or video players.*

3. **`submission/official-submission-answers.md`**  
   *Exact, ready-to-copy answers for every field on the Devpost submission portal (Elevator Pitch, Inspiration, Technical Architecture, Challenges, Accomplishments, Lessons Learned, and the Amazon Developer Friction Log).*

4. **`submission/technical-architecture.md`**  
   *Comprehensive architecture specification with Mermaid sequence diagrams, state machine transitions, security model, and monorepo component mapping.*

5. **`submission/feature-verification.md`**  
   *Rigorous audit and classification matrix of all platform features (Verified Working, Partially Verified, Mocked/Demo-only, Not Implemented, Unable to Verify).*

6. **`submission/project-audit.md`**  
   *Exhaustive code, security, and live deployment audit report covering monorepo packages, test suites, and endpoints.*

7. **`submission/demo-video-script.md`**  
   *Word-for-word timed narration script (2:45 duration) respecting the under 3-minute hackathon limit.*

8. **`submission/demo-storyboard.md`**  
   *Scene-by-scene visual storyboard with screen action cues and typography guides.*

9. **`submission/recording-checklist.md`**  
   *Practical, step-by-step recording guide for OBS Studio, Loom, or YouTube upload runbook.*

10. **`submission/assets/`**  
    *High-resolution (1920x1080) slide graphics and real application UI captures.*

11. **`submission/judge-questions-and-answers.md`**  
    *Complete Q&A preparation guide covering expected technical, architectural, and security questions from hackathon judges.*

12. **`submission/FINAL-SUBMISSION-CHECKLIST.md`**  
    *Pre-flight verification checklist for the final Devpost submission.*

13. **`submission/EXECUTIVE-SUMMARY.md`**  
    *High-level mission summary, test results, and final submission sign-off.*
