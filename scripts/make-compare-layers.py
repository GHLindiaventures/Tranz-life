"""Make the two aligned layers for a product's before/after comparison (src/data/compare.js).

Source: the client's illustration of the two states side by side on white (e.g. a mottled liver and a healthy
one). The picture is split at the widest empty gap between the two, each half is cut out (the white background
is flood-filled from the edges, so pale highlights inside the organ are kept), given a soft edge, scaled to the
same height and centred on identical transparent canvases, so the layers line up exactly under the slider.

These are conceptual illustrations of what the product is designed to support, not clinical images.

Usage: python scripts/make-compare-layers.py <source.png> <name> <before side: left|right>
  e.g. python scripts/make-compare-layers.py livers.png liver left
       python scripts/make-compare-layers.py lungs.png lungs right
Writes public/assets/compare/<name>-before.webp and <name>-after.webp
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "assets" / "compare"
CANVAS = (1200, 820)      # output size (px); the liver fills about 86% of the height
FILL_H = 0.86


def is_bg(p, tol=34):
    r, g, b = p[:3]
    return r > 255 - tol and g > 255 - tol and b > 255 - tol


def cut_out(img):
    """Alpha mask: background = near-white pixels connected to the image border."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    bg = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if bg[i] or not is_bg(px[x, y]):
            continue
        bg[i] = 1
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    mask = Image.new("L", (w, h), 0)
    mask.putdata([0 if b else 255 for b in bg])
    # soft, slightly tightened edge (removes the white fringe left by anti-aliasing)
    mask = mask.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    out = rgb.convert("RGBA")
    out.putalpha(mask)
    return out


def place(liver):
    bbox = liver.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    liver = liver.crop(bbox)
    scale = CANVAS[1] * FILL_H / liver.height
    liver = liver.resize((round(liver.width * scale), round(liver.height * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    canvas.alpha_composite(liver, ((CANVAS[0] - liver.width) // 2, (CANVAS[1] - liver.height) // 2))
    return canvas


def split_x(img):
    """Middle of the widest run of empty (all-background) columns in the middle half of the picture."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    empty = [all(is_bg(px[x, y]) for y in range(0, h, 2)) for x in range(w)]
    best, run_start = (0, w // 2), None
    for x in range(w // 4, 3 * w // 4 + 1):
        if x < w and empty[x]:
            run_start = x if run_start is None else run_start
        elif run_start is not None:
            if x - run_start > best[0]:
                best = (x - run_start, (run_start + x) // 2)
            run_start = None
    return best[1]


def main():
    if len(sys.argv) < 4 or sys.argv[3] not in ("left", "right"):
        sys.exit(__doc__)
    src, name, before_side = Image.open(sys.argv[1]), sys.argv[2], sys.argv[3]
    w, h = src.size
    x = split_x(src)
    left = place(cut_out(src.crop((0, 0, x, h))))
    right = place(cut_out(src.crop((x, 0, w, h))))
    before, after = (left, right) if before_side == "left" else (right, left)
    OUT.mkdir(parents=True, exist_ok=True)
    for state, im in (("before", before), ("after", after)):
        f = OUT / f"{name}-{state}.webp"
        im.save(f, "WEBP", quality=88, method=6)
        print(f.name, f.stat().st_size // 1024, "KB", "(split at x =", x, ")")


if __name__ == "__main__":
    main()
