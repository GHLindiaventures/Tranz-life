import cv2
import numpy as np
from PIL import Image, ImageFilter
import imageio_ffmpeg
import subprocess
import os

WIDTH = 1280
HEIGHT = 720
FPS = 30
STAGE_DURATION = 8.0  # 8.0s per stage
NUM_STAGES = 6
TOTAL_DURATION = STAGE_DURATION * NUM_STAGES  # 48.0s

HOLD_SEC = 4.8       # 4.8s steady milestone stop
TRANS_SEC = 3.2      # 3.2s continuous physical transition bridge

STATION_PATHS = [
    r'C:\Users\LENOVO\.gemini\antigravity\brain\5c36c781-b279-4ce0-a51d-60572ae01620\stage_01_ethical_sourcing_1794982592635.jpg',
    r'src\assets\process\station-02-extraction.webp',
    r'src\assets\process\station-03-formulation.webp',
    r'C:\Users\LENOVO\.gemini\antigravity\brain\5c36c781-b279-4ce0-a51d-60572ae01620\stage04_quality_testing_1794981993226.jpg',
    r'C:\Users\LENOVO\.gemini\antigravity\brain\5c36c781-b279-4ce0-a51d-60572ae01620\stage05_stability_sensory_1794982015189.jpg',
    r'src\assets\images\hero_sample_option1_full_lineup.png'
]

OUTPUT_DIR = 'public/videos'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'process-master.mp4')

def prepare_station(path):
    img = Image.open(path)
    if img.mode != 'RGB':
        # If RGBA, blend over dark luxury greenhouse background
        bg = Image.new('RGB', img.size, (11, 26, 14))
        bg.paste(img, mask=img.split()[3] if len(img.split()) == 4 else None)
        img = bg

    iw, ih = img.size
    target_aspect = WIDTH / HEIGHT
    aspect = iw / ih

    if abs(aspect - target_aspect) < 0.05:
        return img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    
    if aspect > target_aspect:
        new_h = HEIGHT
        new_w = int(HEIGHT * aspect)
    else:
        new_w = WIDTH
        new_h = int(WIDTH / aspect)

    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - WIDTH) // 2
    top = (new_h - HEIGHT) // 2
    return resized.crop((left, top, left + WIDTH, top + HEIGHT))

def smoothstep(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3.0 - 2.0 * x)

def render_living_frame(base_img, zoom=1.0, pan_x=0.0, pan_y=0.0, glow_intensity=0.0):
    w, h = base_img.size
    zw = int(w / zoom)
    zh = int(h / zoom)
    left = int((w - zw) / 2 + pan_x)
    top = int((h - zh) / 2 + pan_y)
    left = max(0, min(w - zw, left))
    top = max(0, min(h - zh, top))

    cropped = base_img.crop((left, top, left + zw, top + zh))
    frame = cropped.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)

    arr = np.array(frame, dtype=np.float32)

    # Subtle ambient warmth / glow
    if glow_intensity > 0:
        gold_tint = np.array([223, 171, 69], dtype=np.float32)
        arr = arr * (1.0 - glow_intensity * 0.15) + gold_tint * (glow_intensity * 0.15)

    return np.clip(arr, 0, 255).astype(np.uint8)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Preparing 6 custom TranzLife station artworks...")
    stations = [prepare_station(p) for p in STATION_PATHS]
    print(f"Loaded {len(stations)} stations cleanly. Station 6 is the complete TranzLife product lineup!")

    frames_per_stage = int(STAGE_DURATION * FPS) # 240 frames
    total_frames = NUM_STAGES * frames_per_stage  # 1440 frames
    hold_frames = int(HOLD_SEC * FPS)             # 144 frames
    trans_frames = int(TRANS_SEC * FPS)           # 96 frames

    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
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
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        OUTPUT_FILE
    ]

    print(f"Launching FFmpeg encoder -> {OUTPUT_FILE}...")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    # Generate motes particle coordinates for organic live feeling
    np.random.seed(42)
    n_motes = 35
    motes_x = np.random.uniform(0, WIDTH, n_motes)
    motes_y = np.random.uniform(0, HEIGHT, n_motes)
    motes_speed = np.random.uniform(0.4, 1.2, n_motes)

    for f in range(total_frames):
        stage_k = f // frames_per_stage
        sub_f = f % frames_per_stage

        curr_img = stations[stage_k]
        next_stage_k = (stage_k + 1) % NUM_STAGES
        next_img = stations[next_stage_k]

        t_now = f / FPS

        # Update floating botanical motes
        motes_y = (motes_y - motes_speed) % HEIGHT
        motes_x = (motes_x + 0.3 * np.sin(t_now + motes_speed)) % WIDTH

        if sub_f < hold_frames:
            # Steady milestone stop: living cinematic camera breathing (zoom 1.00 -> 1.03)
            u_hold = sub_f / hold_frames
            zoom = 1.0 + 0.025 * np.sin(u_hold * np.pi)
            pan_x = 6.0 * np.sin(u_hold * np.pi * 0.5)
            pan_y = 3.0 * np.cos(u_hold * np.pi * 0.5)
            frame_arr = render_living_frame(curr_img, zoom=zoom, pan_x=pan_x, pan_y=pan_y)
        else:
            # Physical Connecting Bridge: camera glides through the facility into next station
            u_raw = (sub_f - hold_frames) / trans_frames
            u = smoothstep(u_raw)

            # Camera accelerates forward into next room
            zoom_curr = 1.025 + 0.16 * u
            pan_curr = 6.0 + 35.0 * u
            frame_curr = render_living_frame(curr_img, zoom=zoom_curr, pan_x=pan_curr)

            # Next station arrives with decelerating forward motion
            zoom_next = 1.15 - 0.15 * u
            pan_next = -35.0 * (1.0 - u)
            frame_next = render_living_frame(next_img, zoom=zoom_next, pan_x=pan_next)

            # Smooth dynamic motion blend
            blended = (1.0 - u) * frame_curr.astype(np.float32) + u * frame_next.astype(np.float32)
            frame_arr = np.clip(blended, 0, 255).astype(np.uint8)

        # Draw floating golden botanical dust motes
        for mx, my in zip(motes_x.astype(int), motes_y.astype(int)):
            if 2 <= mx < WIDTH - 2 and 2 <= my < HEIGHT - 2:
                frame_arr[my-1:my+2, mx-1:mx+2] = np.clip(
                    frame_arr[my-1:my+2, mx-1:mx+2] * 0.6 + np.array([223, 171, 69], dtype=np.float32) * 0.4, 0, 255
                )

        proc.stdin.write(frame_arr.tobytes())

        if f % 180 == 0 or f == total_frames - 1:
            pct = (f + 1) / total_frames * 100
            print(f"Rendering: {pct:.1f}% ({f + 1}/{total_frames})")

    proc.stdin.close()
    proc.wait()

    # Also sync to dist
    dist_file = os.path.join('dist/videos', 'process-master.mp4')
    if os.path.exists('dist/videos'):
        import shutil
        shutil.copy2(OUTPUT_FILE, dist_file)

    mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"SUCCESS: 100% custom TranzLife process video created: {OUTPUT_FILE} ({mb:.2f} MB)")

if __name__ == '__main__':
    main()
