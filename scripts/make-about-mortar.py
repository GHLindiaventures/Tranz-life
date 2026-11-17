"""Transparent cut-out of the About page's Chapter 01 hero: the marble mortar and pestle with herbs (client photo).

Reads a photo on a plain white background and writes public/assets/about/mortar.webp (RGBA, trimmed, 900 px tall at
most). Only the background goes: it is grown inward from the picture's edges through near-white pixels (and the soft
grey floor shadow), so pale veins in the marble, which are enclosed by the bowl, are never touched. The loose seeds
and peppercorns around the bowl are kept.

Usage: python scripts/make-about-mortar.py <photo>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "assets" / "about" / "mortar.webp"
MAX_H = 900
WHITE_TOL = 26        # how far (largest channel difference) from pure white still counts as background
SHADOW_MIN = 150      # the grey floor shadow: colourless pixels lighter than this also count, if reachable
SHADOW_SAT = 18
FLOOR = .8            # below this share of the height (under the bowl): light colourless shadow goes even when enclosed


def grow(seed, allowed):
    m = seed & allowed
    while True:
        d = m.copy()
        d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
        d &= allowed
        if (d == m).all():
            return m
        m = d


def main():
    src = Image.open(sys.argv[1]).convert("RGB")
    a = np.asarray(src).astype(np.int16)
    h, w, _ = a.shape
    near_white = (255 - a).max(axis=2) <= WHITE_TOL
    grey = ((a.max(axis=2) - a.min(axis=2)) < SHADOW_SAT) & (a.min(axis=2) > SHADOW_MIN)
    seed = np.zeros((h, w), bool); seed[0] = seed[-1] = True; seed[:, 0] = seed[:, -1] = True
    bg = grow(seed, near_white | grey)
    # the floor shadow trapped between the peppercorns and under the foot (not reachable from the edges)
    floor = np.zeros((h, w), bool); floor[int(h * FLOOR):] = True
    bg |= floor & ((a.max(axis=2) - a.min(axis=2)) < SHADOW_SAT) & (a.min(axis=2) > SHADOW_MIN + 20)
    # ...and the darker, slightly warm edge of that shadow, grown from the background: the marble is green-tinted
    # (green above red), the shadow is neutral or warm, so the growth stops at the stone
    r_, g_ = a[..., 0], a[..., 1]
    low = np.zeros((h, w), bool); low[int(h * .9):] = True    # only beside the foot, below the bowl's own curve
    warm_shadow = low & (a.min(axis=2) > 140) & ((a.max(axis=2) - a.min(axis=2)) < 28) & (r_ >= g_)
    bg = grow(bg, bg | warm_shadow)
    alpha = Image.fromarray(((~bg) * 255).astype(np.uint8))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.9))   # pull in the white fringe, soften
    rgba = src.convert("RGBA"); rgba.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    rgba = rgba.crop((max(0, box[0] - 4), max(0, box[1] - 4), min(w, box[2] + 4), min(h, box[3] + 4)))
    if rgba.height > MAX_H:
        rgba = rgba.resize((round(rgba.width * MAX_H / rgba.height), MAX_H), Image.LANCZOS)
    rgba.save(OUT, "WEBP", quality=88, method=6)
    print(OUT, rgba.size, OUT.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
