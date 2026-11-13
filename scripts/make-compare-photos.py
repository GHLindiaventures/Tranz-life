"""Make the two aligned layers for a before/after comparison from a two-PHOTO source (two photos side by side,
split by a thin white gap or a thin coloured line), e.g. the Energy Booster artwork: a tired man at his desk (left) and an energetic man
outdoors (right).

Each photo is enlarged to the full stage height and centred, uncropped, on a 2100 x 1000 canvas (the stage's
21:10 shape). The sides are filled with a blurred, slightly darkened extension of the same photo, so the tags have
a calm backdrop, and on narrower screens (where the stage crops its sides) the whole photo still shows.

These are conceptual illustrations of what the product is designed to complement, not real results.

Usage: python scripts/make-compare-photos.py <source.png> <name> <before side: left|right> [--remove x,y,size ...]
  --remove paints out a small four-point sparkle mark (e.g. an image generator's watermark) centred at x,y in the
  SOURCE picture, `size` px from centre to tip, by filling it in from the surrounding pixels. Repeatable.
  --tone sets the brightness of the blurred sides (default 0.78, darker for strong photos; ~0.97 suits pastel art)
  Energy Booster: python scripts/make-compare-photos.py energy.png energy left --remove 934,482,19
  CycleRelief:    python scripts/make-compare-photos.py cycle.png cycle left --remove 934,482,19 --tone 0.97
Writes public/assets/compare/<name>-before.webp and <name>-after.webp
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "assets" / "compare"
OUT_W, OUT_H = 2100, 1000


def find_gap(img):
    """First and last column of the divider between the two pictures, searched in the middle third: either a white
    gap, or a thin line (any colour) that is even from top to bottom and clearly differs from the columns beside it."""
    a = np.asarray(img.convert("RGB"), dtype=np.float32)
    w = a.shape[1]
    white = (a.min(axis=2) > 235).mean(axis=0)
    mean = a.mean(axis=0)
    even = a.std(axis=0).sum(axis=1) < 15
    cols = [x for x in range(w // 3, 2 * w // 3) if white[x] > 0.97]
    if not cols:
        for x in range(w // 3, 2 * w // 3):
            if even[x] and np.abs(mean[x] - mean[x - 12]).sum() > 30 and np.abs(mean[x] - mean[x + 12]).sum() > 30:
                cols.append(x)
    if not cols:
        sys.exit("no divider found between the two pictures")
    return cols[0], cols[-1]


def remove_sparkle(img, cx, cy, size):
    """Fill a four-point star (astroid) centred at cx,cy, plus a 4 px margin, from its surroundings: the unknown
    pixels repeatedly take the mean of their known neighbours, then the patch is smoothed, which suits the soft,
    out-of-focus backgrounds these marks sit on."""
    a = np.asarray(img, dtype=np.float32).copy()
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    r = size + 4
    dx, dy = np.abs(xx - cx) / r, np.abs(yy - cy) / r
    hole = (dx ** (2 / 3) + dy ** (2 / 3) <= 1.0) | ((dx * dx + dy * dy) <= (9 / r) ** 2)
    known = ~hole
    a[hole] = 0
    while not known.all():
        acc = np.zeros_like(a); cnt = np.zeros(known.shape, dtype=np.float32)
        for oy, ox in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)):
            acc += np.roll(np.roll(a * known[..., None], oy, 0), ox, 1)
            cnt += np.roll(np.roll(known, oy, 0), ox, 1)
        grow = (~known) & (cnt > 0)
        a[grow] = acc[grow] / cnt[grow][:, None]
        known |= grow
    for _ in range(30):                                   # relax the fill so no streaks remain
        blur = sum(np.roll(np.roll(a, oy, 0), ox, 1) for oy, ox in ((-1, 0), (1, 0), (0, -1), (0, 1))) / 4
        a[hole] = blur[hole]
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def compose(photo, tone=0.78):
    scale = OUT_H / photo.height
    fg = photo.resize((round(photo.width * scale), OUT_H), Image.LANCZOS)
    fg = fg.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))
    # backdrop: the same photo stretched over the canvas, heavily blurred and toned down
    bg = photo.resize((OUT_W, round(OUT_W * photo.height / photo.width)), Image.BICUBIC)
    top = (bg.height - OUT_H) // 2
    bg = bg.crop((0, top, OUT_W, top + OUT_H)).filter(ImageFilter.GaussianBlur(46))
    bg = ImageEnhance.Brightness(ImageEnhance.Color(bg).enhance(0.85 if tone < 0.9 else 1.0)).enhance(tone)
    # fade the photo's left and right edges into the backdrop
    mask = np.ones((OUT_H, fg.width), dtype=np.float32)
    ramp = 70
    k = np.linspace(0, 1, ramp, dtype=np.float32)
    k = k * k * (3 - 2 * k)
    mask[:, :ramp] *= k
    mask[:, -ramp:] *= k[::-1]
    m = Image.fromarray((mask * 255).astype(np.uint8))
    bg.paste(fg, ((OUT_W - fg.width) // 2, 0), m)
    return bg


def main():
    if len(sys.argv) < 4 or sys.argv[3] not in ("left", "right"):
        sys.exit(__doc__)
    src, name, before_side = Image.open(sys.argv[1]).convert("RGB"), sys.argv[2], sys.argv[3]
    args = sys.argv[4:]
    for i, arg in enumerate(args):
        if arg == "--remove":
            x, y, size = (int(v) for v in args[i + 1].split(","))
            src = remove_sparkle(src, x, y, size)
    tone = float(args[args.index("--tone") + 1]) if "--tone" in args else 0.78
    w, h = src.size
    g0, g1 = find_gap(src)
    left = compose(src.crop((0, 0, g0, h)), tone)
    right = compose(src.crop((g1 + 1, 0, w, h)), tone)
    before, after = (left, right) if before_side == "left" else (right, left)
    OUT.mkdir(parents=True, exist_ok=True)
    for state, im in (("before", before), ("after", after)):
        f = OUT / f"{name}-{state}.webp"
        im.save(f, "WEBP", quality=84, method=6)
        print(f.name, im.size, f.stat().st_size // 1024, "KB", "(gap at x =", g0, "-", g1, ")")


if __name__ == "__main__":
    main()
