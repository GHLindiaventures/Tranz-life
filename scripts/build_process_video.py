import os
import sys
import numpy as np
from PIL import Image, ImageFilter
import imageio_ffmpeg
import subprocess

WIDTH = 1280
HEIGHT = 720
FPS = 30
HOLD_SEC = 5.0
TRANS_SEC = 3.0
STAGE_SEC = HOLD_SEC + TRANS_SEC  # 8.0s
NUM_STAGES = 6
TOTAL_SEC = NUM_STAGES * STAGE_SEC  # 48.0s

IMAGE_PATHS = [
    r'C:\Users\LENOVO\.gemini\antigravity\brain\5c36c781-b279-4ce0-a51d-60572ae01620\stage_01_ethical_sourcing_1794982592635.jpg',
    r'src\assets\process\station-02-extraction.webp',
    r'src\assets\process\station-03-formulation.webp',
    r'C:\Users\LENOVO\.gemini\antigravity\brain\5c36c781-b279-4ce0-a51d-60572ae01620\stage04_quality_testing_1794981993226.jpg',
    r'C:\Users\LENOVO\.gemini\antigravity\brain\5c36c781-b279-4ce0-a51d-60572ae01620\stage05_stability_sensory_1794982015189.jpg',
    r'C:\Users\LENOVO\.gemini\antigravity\brain\5c36c781-b279-4ce0-a51d-60572ae01620\stage06_sustainable_packaging_1794982039114.jpg'
]

OUTPUT_DIR = r'public\videos'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'process-master.mp4')

def prepare_stage_image(path):
    img = Image.open(path).convert('RGB')
    iw, ih = img.size
    target_aspect = WIDTH / HEIGHT
    img_aspect = iw / ih

    if abs(img_aspect - target_aspect) < 0.05:
        # Near 16:9, just resize with high quality
        return img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    else:
        # Fill canvas cleanly (crop-to-fit center)
        if img_aspect > target_aspect:
            # wider
            new_h = HEIGHT
            new_w = int(HEIGHT * img_aspect)
        else:
            # taller / square
            new_w = WIDTH
            new_h = int(WIDTH / img_aspect)
        
        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - WIDTH) // 2
        top = (new_h - HEIGHT) // 2
        return resized.crop((left, top, left + WIDTH, top + HEIGHT))

def get_frame_at_stage(base_img, zoom=1.0, pan_x=0, pan_y=0):
    w, h = base_img.size
    zw = int(w / zoom)
    zh = int(h / zoom)
    left = int((w - zw) / 2 + pan_x)
    top = int((h - zh) / 2 + pan_y)
    
    left = max(0, min(w - zw, left))
    top = max(0, min(h - zh, top))
    
    cropped = base_img.crop((left, top, left + zw, top + zh))
    return cropped.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)

def smoothstep(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3.0 - 2.0 * x)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Preparing 6 stage master textures...")
    stages = [prepare_stage_image(p) for p in IMAGE_PATHS]
    print("All textures loaded & standardized to 1280x720 16:9.")

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    
    # We pipe raw RGB24 frames directly into FFmpeg for fast H.264 encoding with faststart
    cmd = [
        ffmpeg_exe,
        '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f'{WIDTH}x{HEIGHT}',
        '-pix_fmt', 'rgb24',
        '-r', str(FPS),
        '-i', '-',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '20',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        OUTPUT_FILE
    ]

    print(f"Launching FFmpeg: {' '.join(cmd)}")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    total_frames = int(TOTAL_SEC * FPS)
    hold_frames = int(HOLD_SEC * FPS)
    trans_frames = int(TRANS_SEC * FPS)
    stage_frames = hold_frames + trans_frames

    print(f"Generating {total_frames} frames ({TOTAL_SEC}s @ {FPS}fps)...")

    for f_idx in range(total_frames):
        stage_idx = f_idx // stage_frames
        sub_frame = f_idx % stage_frames

        curr_img = stages[stage_idx]
        next_img = stages[(stage_idx + 1) % NUM_STAGES]

        if sub_frame < hold_frames:
            # Steady Anchor Hold: subtle cinematic breathing (1.00 -> 1.03)
            t_hold = sub_frame / hold_frames
            zoom = 1.0 + 0.03 * np.sin(t_hold * np.pi)
            pan = 8.0 * np.sin(t_hold * np.pi * 0.5)
            frame_img = get_frame_at_stage(curr_img, zoom=zoom, pan_x=pan)
        else:
            # Camera Glide Transition (Stage k -> Stage k+1)
            t_raw = (sub_frame - hold_frames) / trans_frames
            t = smoothstep(t_raw)

            # Current stage pushes forward as camera approaches door
            zoom_curr = 1.03 + 0.15 * t
            pan_curr = 8.0 + 40.0 * t
            frame_curr = get_frame_at_stage(curr_img, zoom=zoom_curr, pan_x=pan_curr)

            # Next stage appears with decelerating forward arrival
            zoom_next = 1.15 - 0.15 * t
            pan_next = -40.0 * (1.0 - t)
            frame_next = get_frame_at_stage(next_img, zoom=zoom_next, pan_x=pan_next)

            # Blend frames
            arr_curr = np.array(frame_curr, dtype=np.float32)
            arr_next = np.array(frame_next, dtype=np.float32)
            blended = (1.0 - t) * arr_curr + t * arr_next
            frame_img = Image.fromarray(np.uint8(np.clip(blended, 0, 255)))

        proc.stdin.write(frame_img.tobytes())

        if f_idx % 150 == 0 or f_idx == total_frames - 1:
            progress = (f_idx + 1) / total_frames * 100
            print(f"Render progress: {progress:.1f}% ({f_idx + 1}/{total_frames} frames)")

    proc.stdin.close()
    proc.wait()
    print(f"Master process video generated successfully: {OUTPUT_FILE}")
    print(f"File size: {os.path.getsize(OUTPUT_FILE) / (1024 * 1024):.2f} MB")

if __name__ == '__main__':
    main()
