"""Background for the Our Ingredients showcase from the client's AI-generated picture (1024 x 572, light, misty).

Paints out the generator's four-point sparkle mark (on the stone mortar, bottom right), with stone-like grain added
back so the fill does not show as a flat patch, then enlarges to 2048 px and writes
public/assets/ingredients-hero-light.webp.

Usage: python scripts/make-ingredients-hero-bg.py <picture.png> [--remove x,y,size ...]
  default mark: 934,483,18 (in the 1024 px source). Replace with a 2560 px+ original when one is available.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "public" / "assets" / "ingredients-hero-light.webp"


def remove_sparkle(img, cx, cy, size):
    """Fill a four-point star (astroid) centred at cx,cy, plus a 4 px margin, from its surroundings: the unknown
    pixels repeatedly take the mean of their known neighbours, then the patch is relaxed so no streaks remain."""
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
    for _ in range(30):
        blur = sum(np.roll(np.roll(a, oy, 0), ox, 1) for oy, ox in ((-1, 0), (1, 0), (0, -1), (0, 1))) / 4
        a[hole] = blur[hole]
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def remove_mark(img, cx, cy, size):
    filled = remove_sparkle(img, cx, cy, size)
    a, f = np.asarray(img, np.float32), np.asarray(filled, np.float32)
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    r = size + 4
    hole = ((np.abs(xx - cx) / r) ** (2 / 3) + (np.abs(yy - cy) / r) ** (2 / 3)) <= 1.0
    ring = (np.hypot(xx - cx, yy - cy) < r * 2.2) & ~hole
    # grain: the high-frequency detail of the surrounding stone, tiled into the hole
    detail = a - np.asarray(img.filter(ImageFilter.GaussianBlur(2)), np.float32)
    rng = np.random.default_rng(7)
    src = np.argwhere(ring)
    pick = src[rng.integers(0, len(src), hole.sum())]
    f[hole] += detail[pick[:, 0], pick[:, 1]] * .4
    return Image.fromarray(f.clip(0, 255).astype(np.uint8))


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    img = Image.open(sys.argv[1]).convert("RGB")
    marks = [tuple(int(v) for v in sys.argv[i + 1].split(",")) for i, a in enumerate(sys.argv) if a == "--remove"] or [(934, 483, 18)]
    for cx, cy, size in marks:
        img = remove_mark(img, cx, cy, size)
    big = img.resize((img.width * 2, img.height * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=35, threshold=2))
    big.save(OUT, "WEBP", quality=86, method=6)
    print(OUT.name, big.size, OUT.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
