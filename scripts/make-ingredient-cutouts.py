"""Transparent cut-outs of the 34 ingredient pictures, for the glass cards on the Our Ingredients page.

Reads public/assets/ingredients/<id>.webp (made by scripts/make-ingredient-images.py: each subject fitted on its own
plain background) and writes public/assets/ingredients/cutout/<id>.webp (RGBA, trimmed to the subject, at most
720 px): the background is grown inward from the picture's edges through pixels close to the background colour,
made transparent, and the edge softened. Haritaki is a full photograph (no background to remove), so it is written
as an opaque, trimmed copy and shown framed on the page.

Usage: python scripts/make-ingredient-cutouts.py [id ...]     (no ids: all 34)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "public" / "assets" / "ingredients"
OUT = ROOT / "cutout"
MAX = 720
PHOTOS = {"haritaki"}
# how far (largest channel difference) a pixel may be from the background colour and still count as background
TOL = {"calc-phos": 14, "vitamin-c": 16, "hecla-lava": 34, "peppermint": 36, "licorice": 34}
# background also trapped between leaves (not reachable from the edges): remove every near-background pixel
ENCLOSED = {"bhringraj": 14}
DEFAULT_TOL = 24
# soft grey drop shadows (light, colourless) count as background too, except where the subject itself is white/grey
KEEP_GREYS = {"calc-phos", "kutki", "zinc", "vitamin-c", "vitamin-d3"}
# tinted soft shadows: (darkest channel above, colourfulness below) also count as background
SHADOW = {"peppermint": (128, 56)}


def grow(seed, allowed):
    """Region growing by repeated 4-neighbour dilation, limited to `allowed`."""
    m = seed & allowed
    while True:
        d = m.copy()
        d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
        d &= allowed
        if (d == m).all():
            return m
        m = d


def cutout(pid):
    img = Image.open(ROOT / f"{pid}.webp").convert("RGB")
    img.thumbnail((MAX * 2, MAX * 2), Image.LANCZOS)
    if pid in PHOTOS:
        out = img.copy(); out.thumbnail((MAX, MAX), Image.LANCZOS)
        out.save(OUT / f"{pid}.webp", "WEBP", quality=84, method=6)
        return out.size
    a = np.asarray(img).astype(np.int16)
    h, w, _ = a.shape
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bgc = np.median(border, axis=0)
    allowed = np.abs(a - bgc).max(axis=2) <= TOL.get(pid, DEFAULT_TOL)
    if pid not in KEEP_GREYS:
        allowed |= ((a.max(axis=2) - a.min(axis=2)) < 14) & (a.min(axis=2) > 185)
    if pid in SHADOW:
        lo, sat = SHADOW[pid]
        allowed |= (a.min(axis=2) > lo) & ((a.max(axis=2) - a.min(axis=2)) < sat)
    seed = np.zeros((h, w), bool); seed[0] = seed[-1] = True; seed[:, 0] = seed[:, -1] = True
    bg = grow(seed, allowed)
    if pid in ENCLOSED:
        bg |= np.abs(a - bgc).max(axis=2) <= ENCLOSED[pid]
    alpha = Image.fromarray(((~bg) * 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))   # pull in the fringe, soften
    rgba = img.convert("RGBA"); rgba.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    pad = 6
    rgba = rgba.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(w, box[2] + pad), min(h, box[3] + pad)))
    rgba.thumbnail((MAX, MAX), Image.LANCZOS)
    rgba.save(OUT / f"{pid}.webp", "WEBP", quality=86, method=6)
    return rgba.size


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ids = sys.argv[1:] or sorted(p.stem for p in ROOT.glob("*.webp"))
    for pid in ids:
        print(pid, cutout(pid))


if __name__ == "__main__":
    main()
