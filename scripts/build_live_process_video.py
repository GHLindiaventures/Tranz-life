import cv2
import numpy as np
import imageio_ffmpeg
import subprocess
import os

WIDTH = 1280
HEIGHT = 720
FPS = 30
STAGE_DURATION = 8.0  # 8.0s per stage
NUM_STAGES = 6
TOTAL_DURATION = STAGE_DURATION * NUM_STAGES  # 48.0s

TRANS_SEC = 2.5  # 2.5s transition bridge between stages
HOLD_SEC = STAGE_DURATION - TRANS_SEC  # 5.5s steady hold

CLIP_FILES = [
    'scripts/raw_clips/01_sourcing.mp4',
    'scripts/raw_clips/02_extraction.mp4',
    'scripts/raw_clips/03_formulation.mp4',
    'scripts/raw_clips/04_testing.mp4',
    'scripts/raw_clips/05_sensory.mp4',
    'scripts/raw_clips/06_packaging.mp4'
]

OUTPUT_DIR = 'public/videos'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'process-master.mp4')

def load_frames(video_path, target_count):
    cap = cv2.VideoCapture(video_path)
    total_src_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    
    # Read all frames into memory
    src_frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # Resize to standard 1280x720
        h, w = frame.shape[:2]
        # Crop-to-fit center
        target_aspect = WIDTH / HEIGHT
        aspect = w / h
        if aspect > target_aspect:
            new_w = int(h * target_aspect)
            x_off = (w - new_w) // 2
            cropped = frame[:, x_off:x_off+new_w]
        else:
            new_h = int(w / target_aspect)
            y_off = (h - new_h) // 2
            cropped = frame[y_off:y_off+new_h, :]
        resized = cv2.resize(cropped, (WIDTH, HEIGHT), interpolation=cv2.INTER_LANCZOS4)
        # Convert BGR to RGB
        resized = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        src_frames.append(resized)
    cap.release()

    if not src_frames:
        raise ValueError(f"No frames in {video_path}")

    # Resample to target_count frames
    indices = np.linspace(0, len(src_frames) - 1, target_count, dtype=int)
    return [src_frames[i] for i in indices]

def smoothstep(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3.0 - 2.0 * x)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    frames_per_stage = int(STAGE_DURATION * FPS) # 240 frames
    trans_frames = int(TRANS_SEC * FPS) # 75 frames
    hold_frames = frames_per_stage - trans_frames # 165 frames

    print(f"Loading live video footage for all {NUM_STAGES} stages...")
    stage_frame_lists = []
    for i, path in enumerate(CLIP_FILES, 1):
        print(f"  Stage {i}: loading {path} ({frames_per_stage} frames)...")
        frames = load_frames(path, frames_per_stage + trans_frames)
        stage_frame_lists.append(frames)

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
        '-crf', '19',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        OUTPUT_FILE
    ]

    print(f"Launching FFmpeg encoder -> {OUTPUT_FILE}...")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)

    total_master_frames = NUM_STAGES * frames_per_stage
    print(f"Synthesizing {total_master_frames} continuous live-action video frames...")

    for f_idx in range(total_master_frames):
        stage_k = f_idx // frames_per_stage
        sub_f = f_idx % frames_per_stage

        curr_stage_frames = stage_frame_lists[stage_k]
        next_stage_k = (stage_k + 1) % NUM_STAGES
        next_stage_frames = stage_frame_lists[next_stage_k]

        if sub_f < hold_frames:
            # Steady Milestone Hold: pure live footage of current process
            out_frame = curr_stage_frames[sub_f]
        else:
            # Physical Connecting Bridge: smooth forward transit into next room
            t_raw = (sub_f - hold_frames) / trans_frames
            t = smoothstep(t_raw)

            f_curr = curr_stage_frames[min(sub_f, len(curr_stage_frames) - 1)]
            f_next = next_stage_frames[min(int(t_raw * trans_frames), len(next_stage_frames) - 1)]

            # High quality cross-dissolve with motion flow
            arr_curr = f_curr.astype(np.float32)
            arr_next = f_next.astype(np.float32)
            blended = (1.0 - t) * arr_curr + t * arr_next
            out_frame = np.clip(blended, 0, 255).astype(np.uint8)

        proc.stdin.write(out_frame.tobytes())

        if f_idx % 180 == 0 or f_idx == total_master_frames - 1:
            pct = (f_idx + 1) / total_master_frames * 100
            print(f"Encoding progress: {pct:.1f}% ({f_idx + 1}/{total_master_frames})")

    proc.stdin.close()
    proc.wait()

    size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"SUCCESS: Real-motion continuous process video compiled: {OUTPUT_FILE} ({size_mb:.2f} MB)")

if __name__ == '__main__':
    main()
