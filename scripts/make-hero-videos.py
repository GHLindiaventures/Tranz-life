"""Site films, web-ready: the home hero's four panels ("Four Windows") and About Chapter 02's lab film.

Source clips live in scripts/source/videos/ (gitignored). For each one this:
  - paints out the generator's sparkle watermark (bottom right) with ffmpeg's delogo filter, where it has one;
  - evens out its brightness against the other three, so the row reads as one shoot;
  - makes it loop without a jump: the last LOOP seconds cross-fade into the start;
  - drops the audio and encodes a small H.264 MP4 (fast start) plus a WebP poster of its first frame.
Output: <out>/<name>.mp4 and <name>.webp (public/videos/hero/ or public/assets/about/)

Also the home page's hero film, Genesis (genesis(): `python scripts/make-hero-videos.py genesis`): the user's final AI
film "genesis-final.mp4" (1280x720, 10 s, with sound), shown on the home page for good, looping. Only the
generator's watermark is painted out; everything else is kept: the whole film, its full frame, frame rate, speed and
its original audio (copied, not re-encoded). Video encoded near-losslessly (CRF 17), fast start. Plus a poster of the
first frame. (Earlier takes: genesis.mp4, cut at 7.6 s; genesis-2.mp4.)
Output: public/videos/genesis/

Needs ffmpeg: either on PATH or from `pip install imageio-ffmpeg`.
Usage: python scripts/make-hero-videos.py [name ...]   (no names: all of them)
"""
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "source" / "videos"
HERO = ROOT / "public" / "videos" / "hero"
ABOUT = ROOT / "public" / "assets" / "about"
LOOP = 1.2          # seconds of cross-fade at the loop point
DELOGO = "delogo=x=568:y=1128:w=66:h=66"
CLIPS = [            # (name, source, grade, output folder, has the sparkle watermark); hero panel order: Root, Lab, Formula, You
    ("root", "Video 1.mp4", "eq=brightness=0.02:saturation=1.04", HERO, True),
    ("lab", "Video 2.mp4", "eq=brightness=-0.09:contrast=1.06:saturation=1.1", HERO, True),
    ("formula", "Video 3.mp4", "eq=gamma=1.22:saturation=1.05", HERO, True),
    ("you", "Video 4.mp4", "eq=saturation=1.03", HERO, True),
    ("science-lab", "about-science-lab.mp4", "eq=saturation=1.02", ABOUT, True),   # vertical; the first, landscape take is kept as about-science-lab-v1-landscape.mp4
]


def ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


def duration(ff, src):
    out = subprocess.run([ff, "-i", str(src)], capture_output=True, text=True).stderr
    h, m, s = out.split("Duration: ")[1].split(",")[0].split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


GENESIS = ROOT / "public" / "videos" / "genesis"
GN_DELOGO = "delogo=x=1131:y=571:w=58:h=58"


def genesis(ff):
    GENESIS.mkdir(parents=True, exist_ok=True)
    src = SRC / "genesis-final.mp4"
    mp4 = GENESIS / "genesis.mp4"
    subprocess.run([ff, "-v", "error", "-y", "-i", str(src),
                    "-vf", f"{GN_DELOGO},format=yuv420p", "-c:a", "copy",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-g", "48",
                    "-movflags", "+faststart", str(mp4)], check=True)
    subprocess.run([ff, "-v", "error", "-y", "-i", str(mp4), "-frames:v", "1", "-c:v", "libwebp", "-quality", "72",
                    str(GENESIS / "genesis-start.webp")], check=True)
    print("genesis", round(duration(ff, mp4), 2), "s", mp4.stat().st_size // 1024, "KB")


def main():
    import sys
    only = set(sys.argv[1:])
    ff = ffmpeg()
    if "genesis" in only or not only:
        genesis(ff)
        only.discard("genesis")
        if not only and len(sys.argv) > 1:
            return
    for name, file, grade, out, mark in CLIPS:
        if only and name not in only:
            continue
        out.mkdir(parents=True, exist_ok=True)
        src = SRC / file
        d = duration(ff, src) - .1
        # body: LOOP..d, its tail cross-fading into 0..LOOP, so the last frame is the first frame
        graph = (
            f"[0:v]{DELOGO + ',' if mark else ''}{grade},split[a][b];"
            f"[a]trim={LOOP}:{d:.2f},setpts=PTS-STARTPTS[body];"
            f"[b]trim=0:{LOOP},setpts=PTS-STARTPTS[head];"
            f"[body][head]xfade=transition=fade:duration={LOOP}:offset={d - 2 * LOOP:.2f},format=yuv420p[v]"
        )
        mp4 = out / f"{name}.mp4"
        subprocess.run([ff, "-v", "error", "-y", "-i", str(src), "-filter_complex", graph, "-map", "[v]", "-an",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-profile:v", "high", "-movflags", "+faststart",
                        str(mp4)], check=True)
        subprocess.run([ff, "-v", "error", "-y", "-i", str(mp4), "-frames:v", "1", "-c:v", "libwebp", "-quality", "70",
                        str(out / f"{name}.webp")], check=True)
        print(name, round(duration(ff, mp4), 1), "s", mp4.stat().st_size // 1024, "KB,",
              "poster", (out / f"{name}.webp").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
