"""Pre-blurred backgrounds for the About page's chapters (and the prologue's spotlight).

Blurring a full-screen photo live (CSS filter) is expensive while scrolling, so each chapter background is blurred
once here: public/assets/about/<name>.jpg -> public/assets/about/blur/<name>.webp (1280 px wide, soft and small).
The page cross-fades these; only the foreground photos are shown sharp.

Usage: python scripts/make-about-blur.py
"""
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "public" / "assets" / "about"
OUT = ROOT / "blur"
NAMES = [
    "about-hero-roots-to-infinity",
    "botanical-ayurveda-roots",
    "biotech-lab-cleanroom",
    "leadership-delegation-nrdc",
    "corporate-innovation-hub",
]
WIDTH = 1280
RADIUS = {"about-hero-roots-to-infinity": 4}   # the prologue's is only softened: the spotlight shows the sharp one
DEFAULT_RADIUS = 22


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [(n, n, RADIUS.get(n, DEFAULT_RADIUS)) for n in NAMES]
    jobs.append(("about-hero-roots-to-infinity", "compass", 7))   # chapter 04 reuses the prologue photo, blurred as it was
    for name, out_name, radius in jobs:
        img = Image.open(ROOT / f"{name}.jpg").convert("RGB")
        img.thumbnail((WIDTH, WIDTH), Image.LANCZOS)
        out = img.filter(ImageFilter.GaussianBlur(radius))
        out.save(OUT / f"{out_name}.webp", "WEBP", quality=72, method=6)
        print(out_name, out.size, (OUT / f"{out_name}.webp").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
