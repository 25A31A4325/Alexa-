import os
import re
import subprocess
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
BASE_DIR = r"C:\Users\MOHAN SAI\Desktop\Alexa+"
ASSETS_DIR = os.path.join(BASE_DIR, "submission", "assets")
OUTPUT_VIDEO = os.path.join(BASE_DIR, "submission", "demo-video.mp4")

# Load fonts
FONT_CAPTION = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 26)
FONT_BADGE = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 16)
FONT_TOP = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 16)

def add_overlays_to_image(img_path, caption_text, out_path, section_label=""):
    im = Image.open(img_path).convert("RGBA")
    # Resize to exact 1920x1080 if needed
    if im.size != (1920, 1080):
        im = im.resize((1920, 1080), Image.Resampling.LANCZOS)
        
    overlay = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # Top right persistent live badge
    draw.rounded_rectangle([1520, 20, 1880, 56], radius=8, fill=(15, 23, 42, 210), outline=(59, 130, 246, 180), width=1)
    draw.ellipse([1535, 33, 1547, 45], fill=(16, 185, 129, 255))
    draw.text((1556, 28), "ORCHESTRA | ALEXA+ TRACK", font=FONT_BADGE, fill=(243, 244, 246, 240))
    
    if section_label:
        draw.rounded_rectangle([40, 20, 400, 56], radius=8, fill=(15, 23, 42, 210), outline=(139, 92, 246, 180), width=1)
        draw.text((55, 28), section_label.upper(), font=FONT_BADGE, fill=(196, 181, 253, 240))
    
    # Lower-third caption banner
    if caption_text:
        # Wrap text if long
        words = caption_text.split()
        lines = []
        cur_line = []
        for w in words:
            cur_line.append(w)
            if len(" ".join(cur_line)) > 90:
                lines.append(" ".join(cur_line[:-1]))
                cur_line = [w]
        if cur_line:
            lines.append(" ".join(cur_line))
            
        banner_h = 36 + len(lines) * 36
        banner_y1 = 1040 - banner_h
        banner_y2 = 1040
        
        # Pill shape banner
        draw.rounded_rectangle([120, banner_y1, 1800, banner_y2], radius=16, fill=(11, 15, 25, 230), outline=(31, 41, 55, 200), width=2)
        # Accent left indicator
        draw.rounded_rectangle([120, banner_y1, 130, banner_y2], radius=4, fill=(16, 185, 129, 255))
        
        # Draw lines
        y_text = banner_y1 + 18
        for line in lines:
            draw.text((150, y_text), line, font=FONT_CAPTION, fill=(255, 255, 255, 255))
            y_text += 36

    combined = Image.alpha_composite(im, overlay).convert("RGB")
    combined.save(out_path, quality=95)

# Shot definition table
# Each scene has its audio wav and a list of shots (image, duration_fraction, caption)
SCENES_SPEC = [
    {
        "id": "scene1",
        "audio": os.path.join(ASSETS_DIR, "scene1.wav"),
        "section": "1. The Autonomous Agent Crisis",
        "shots": [
            {
                "image": os.path.join(ASSETS_DIR, "01-title-problem.png"),
                "ratio": 0.50,
                "caption": "Autonomous AI agents promise to run our workflows, but face black-box execution and zero safety controls."
            },
            {
                "image": os.path.join(ASSETS_DIR, "01-title-problem.png"),
                "ratio": 0.50,
                "caption": "If an agent deletes a cloud database or deploys broken code, there is no rewind button."
            }
        ]
    },
    {
        "id": "scene2",
        "audio": os.path.join(ASSETS_DIR, "scene2.wav"),
        "section": "2. Introducing ORCHESTRA",
        "shots": [
            {
                "image": os.path.join(ASSETS_DIR, "02-orchestra-solution.png"),
                "ratio": 0.45,
                "caption": "Meet ORCHESTRA: Built for the Amazon Alexa+ Track with deterministic finite-state control & human governance."
            },
            {
                "image": os.path.join(ASSETS_DIR, "ui-01-dashboard.png"),
                "ratio": 0.55,
                "caption": "ORCHESTRA compiles intent into a validated Directed Acyclic Graph (DAG) over the Model Context Protocol."
            }
        ]
    },
    {
        "id": "scene3",
        "audio": os.path.join(ASSETS_DIR, "scene3.wav"),
        "section": "3. Live Mission Execution & DAG Planning",
        "shots": [
            {
                "image": os.path.join(ASSETS_DIR, "ui-02-new-mission.png"),
                "ratio": 0.33,
                "caption": "The planner evaluates dependencies and compiles an execution graph across eight formal states."
            },
            {
                "image": os.path.join(ASSETS_DIR, "ui-03a-mission-top.png"),
                "ratio": 0.33,
                "caption": "Low-risk steps like context retrieval and document analysis execute automatically via Streamable HTTP MCP tools."
            },
            {
                "image": os.path.join(ASSETS_DIR, "ui-03b-mission-dag.png"),
                "ratio": 0.34,
                "caption": "All state transitions are deterministic, eliminating race conditions and runaway agent loops."
            }
        ]
    },
    {
        "id": "scene4",
        "audio": os.path.join(ASSETS_DIR, "scene4.wav"),
        "section": "4. Human Approval & Cryptographic Verification",
        "shots": [
            {
                "image": os.path.join(ASSETS_DIR, "ui-03c-mission-verification.png"),
                "ratio": 0.35,
                "caption": "When ORCHESTRA reaches a consequential action, it halts in Approval Required for human sign-off."
            },
            {
                "image": os.path.join(ASSETS_DIR, "ui-03d-mission-results.png"),
                "ratio": 0.35,
                "caption": "Once approved, the verification engine validates output state using SHA-256 state fingerprinting."
            },
            {
                "image": os.path.join(ASSETS_DIR, "ui-06-activity-ledger.png"),
                "ratio": 0.30,
                "caption": "The complete execution ledger is cryptographically recorded in the auditable activity timeline."
            }
        ]
    },
    {
        "id": "scene5",
        "audio": os.path.join(ASSETS_DIR, "scene5.wav"),
        "section": "5. MCP Streamable HTTP Architecture",
        "shots": [
            {
                "image": os.path.join(ASSETS_DIR, "03-architecture.png"),
                "ratio": 0.35,
                "caption": "Powered by Model Context Protocol: Streamable HTTP and SSE transport for seamless Alexa+ interoperability."
            },
            {
                "image": os.path.join(ASSETS_DIR, "ui-04-mcp-tools.png"),
                "ratio": 0.35,
                "caption": "Dynamic tool schema discovery and zero-trust parameter validation across personal and workplace services."
            },
            {
                "image": os.path.join(ASSETS_DIR, "ui-05-integrations.png"),
                "ratio": 0.30,
                "caption": "AES-256-GCM token encryption with 100% test coverage (67/67 automated tests passing)."
            }
        ]
    },
    {
        "id": "scene6",
        "audio": os.path.join(ASSETS_DIR, "scene6.wav"),
        "section": "6. Conclusion & Live Deployment",
        "shots": [
            {
                "image": os.path.join(ASSETS_DIR, "04-conclusion.png"),
                "ratio": 0.50,
                "caption": "ORCHESTRA transforms AI agents from risky experiments into reliable, auditable enterprise operators."
            },
            {
                "image": os.path.join(ASSETS_DIR, "04-conclusion.png"),
                "ratio": 0.50,
                "caption": "Open-source on GitHub: github.com/25A31A4325/Alexa- | Live Demo: alexa-orchestra.onrender.com"
            }
        ]
    }
]

def get_audio_duration(wav_path):
    cmd = [FFMPEG, "-i", wav_path]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", res.stderr)
    if m:
        return int(m.group(1))*3600 + int(m.group(2))*60 + float(m.group(3))
    return 25.0

def build_scene_video(scene_idx, scene):
    scene_id = scene["id"]
    wav_path = scene["audio"]
    dur = get_audio_duration(wav_path)
    print(f"\nProcessing {scene_id}: total audio duration = {dur:.2f}s")
    
    shot_video_files = []
    accum_dur = 0.0
    for shot_idx, shot in enumerate(scene["shots"]):
        shot_dur = dur * shot["ratio"]
        accum_dur += shot_dur
        
        # Prepare framed image with overlays
        shot_img_out = os.path.join(ASSETS_DIR, f"frame_{scene_id}_shot{shot_idx}.png")
        add_overlays_to_image(shot["image"], shot["caption"], shot_img_out, scene["section"])
        
        # Generate video segment without audio (exact duration)
        shot_mp4_out = os.path.join(ASSETS_DIR, f"vid_{scene_id}_shot{shot_idx}.mp4")
        # -t shot_dur, 30 fps
        cmd = [
            FFMPEG, "-y",
            "-loop", "1",
            "-i", shot_img_out,
            "-t", f"{shot_dur:.3f}",
            "-r", "30",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "fast",
            shot_mp4_out
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        shot_video_files.append(shot_mp4_out)
        print(f"  Shot {shot_idx}: {shot_dur:.2f}s -> {shot_mp4_out}")
        
    # Concat shot video segments
    concat_list_path = os.path.join(ASSETS_DIR, f"concat_{scene_id}.txt")
    with open(concat_list_path, "w") as f:
        for vf in shot_video_files:
            # Escape path for ffmpeg concat
            clean_p = vf.replace("\\", "/")
            f.write(f"file '{clean_p}'\n")
            
    scene_video_only = os.path.join(ASSETS_DIR, f"{scene_id}_video_only.mp4")
    cmd_concat = [
        FFMPEG, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_path,
        "-c", "copy",
        scene_video_only
    ]
    subprocess.run(cmd_concat, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    
    # Merge video with scene audio
    scene_final_mp4 = os.path.join(ASSETS_DIR, f"{scene_id}_final.mp4")
    cmd_merge = [
        FFMPEG, "-y",
        "-i", scene_video_only,
        "-i", wav_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        scene_final_mp4
    ]
    subprocess.run(cmd_merge, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print(f"  Merged {scene_id} -> {scene_final_mp4}")
    return scene_final_mp4

def assemble_full_video():
    scene_mp4s = []
    for idx, scene in enumerate(SCENES_SPEC):
        scene_mp4 = build_scene_video(idx, scene)
        scene_mp4s.append(scene_mp4)
        
    # Concat all 6 scene final MP4s
    master_concat_txt = os.path.join(ASSETS_DIR, "master_concat.txt")
    with open(master_concat_txt, "w") as f:
        for sm in scene_mp4s:
            clean_p = sm.replace("\\", "/")
            f.write(f"file '{clean_p}'\n")
            
    print("\nAssembling Master Demo Video at:", OUTPUT_VIDEO)
    cmd_master = [
        FFMPEG, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", master_concat_txt,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        OUTPUT_VIDEO
    ]
    subprocess.run(cmd_master, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    print(f"SUCCESS: Master video generated at {OUTPUT_VIDEO}")
    
    # Verify final video properties
    cmd_probe = [FFMPEG, "-i", OUTPUT_VIDEO]
    res = subprocess.run(cmd_probe, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    print("\n--- FFmpeg Video Verification ---")
    for line in res.stderr.splitlines():
        if "Duration:" in line or "Stream #0" in line:
            print(" ", line.strip())
            
    file_size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
    print(f"  File Size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    assemble_full_video()
