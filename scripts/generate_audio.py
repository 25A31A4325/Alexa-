import asyncio
import os
import edge_tts
import imageio_ffmpeg
import subprocess

ASSETS_DIR = r"C:\Users\MOHAN SAI\Desktop\Alexa+\submission\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

SCENES = [
    {
        "id": "scene1",
        "text": "Autonomous AI agents promise to run our workflows, but in production, they face a fatal flaw: black-box execution, unpredictable hallucinations, and zero safety controls when performing destructive actions. If an agent deletes a cloud database or deploys broken code, there is no rewind button. Enterprises cannot deploy autonomous intelligence without absolute control."
    },
    {
        "id": "scene2",
        "text": "Meet ORCHESTRA. Built for the Amazon Alexa+ Track, ORCHESTRA is an agentic mission-execution platform that brings deterministic finite-state control, human-in-the-loop governance, and verifiable auditability to autonomous tool execution. Instead of blind delegation, ORCHESTRA compiles intent into a validated Directed Acyclic Graph, executing tools through the Model Context Protocol."
    },
    {
        "id": "scene3",
        "text": "Let's look at mission execution in ORCHESTRA. In real time, the planner evaluates dependencies and compiles an execution graph across eight formal states. Low-risk steps like context retrieval, document analysis, and calendar checks execute automatically through Model Context Protocol tools over Streamable HTTP and Server-Sent Events. All state transitions are deterministic, preventing race conditions and runaway loops."
    },
    {
        "id": "scene4",
        "text": "Here is the critical breakthrough: when ORCHESTRA reaches a consequential action, it halts. The state machine transitions to Approval Required. The human operator reviews the exact action payload, parameters, and risk score. Once approved, execution resumes, and our verification engine validates the output state using SHA-256 state fingerprinting before marking it complete. The full execution ledger is cryptographically logged on the activity timeline."
    },
    {
        "id": "scene5",
        "text": "Under the hood, ORCHESTRA is powered by the Model Context Protocol. By exposing tools over Streamable HTTP on slash mcp, Alexa+ agents and LLMs dynamically discover capabilities and stream payloads with low latency. External tokens are encrypted using military-grade AES-256-GCM, and one hundred percent of our monorepo packages are verified with sixty-seven passing automated tests."
    },
    {
        "id": "scene6",
        "text": "ORCHESTRA transforms AI agents from risky experiments into reliable enterprise operators. With deterministic state machines, MCP standard interoperability, and human verification, it represents the future of safe agentic workflows. Check out our open-source codebase on GitHub and test the live platform on Render today. Thank you!"
    }
]

VOICE = "en-US-AndrewMultilingualNeural"

async def generate_scene_audio():
    total_duration = 0.0
    for scene in SCENES:
        out_mp3 = os.path.join(ASSETS_DIR, f"{scene['id']}.mp3")
        out_wav = os.path.join(ASSETS_DIR, f"{scene['id']}.wav")
        print(f"Synthesizing {scene['id']} with {VOICE}...")
        comm = edge_tts.Communicate(scene['text'], VOICE, rate="+3%")
        await comm.save(out_mp3)
        
        # Convert to WAV for precise timing & concatenation
        cmd = [FFMPEG, "-y", "-i", out_mp3, "-ar", "44100", "-ac", "2", out_wav]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        
        # Measure duration via ffprobe / ffmpeg
        probe_cmd = [FFMPEG, "-i", out_wav]
        res = subprocess.run(probe_cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
        # Parse Duration: 00:00:21.45
        import re
        m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", res.stderr)
        dur = 0.0
        if m:
            dur = int(m.group(1))*3600 + int(m.group(2))*60 + float(m.group(3))
        scene["duration"] = dur
        total_duration += dur
        print(f"  {scene['id']} duration: {dur:.2f}s")
        
    print(f"\nTotal Spoken Audio Duration: {total_duration:.2f} seconds ({total_duration/60:.2f} minutes)")
    return SCENES

if __name__ == "__main__":
    asyncio.run(generate_scene_audio())
