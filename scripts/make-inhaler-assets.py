"""BreatheFree inhaler images from the client's packshot (white tube with a perforated domed tip and its cap beside
it, tilted ~13 degrees, on white, 1472 x 2870) and the BreatheFree brochure board.

  src/assets/products/inhaler.webp         studio shot (960 x 960) for the product page, cards, bag and Products page
  src/assets/products/decal-inhaler.webp   the printed label for the 3D tube: lifted from the straightened photo,
                                           un-wrapped from the cylinder (so letters near the edges are not squeezed),
                                           and keyed so only the ink is opaque (the white plastic comes from the model)
  src/assets/products/inhaler-design.webp  the full brochure board, for the lightbox

The 3D tube in src/features/products/product-model.js (breatheFreeInhaler) uses the same pixel measurements as
below (straightened photo, rows 360 - 2915), so the decal lines up with the modelled body.

Usage: python scripts/make-inhaler-assets.py <packshot.png> <brochure.png>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent / "src" / "assets" / "products"
TILT = 13.0                 # degrees CCW that stand the tube upright
LABEL_ROWS = (940, 2740)    # body rows in the straightened photo that the decal covers
X_LIMIT = (450, 1140)       # columns to search for the tube's edges (keeps the cap, on the right, out)
THETA = 1.02                # half of the label's arc around the tube, in radians
DECAL_SCALE = .62           # the decal is drawn ~2 units tall in 3D, so full photo resolution is not needed


def clean_white(src):
    """Lift the photo's near-white compression smudges (~240-252) to pure white; darker pixels are untouched."""
    a = np.asarray(src).astype(np.float32)
    t = np.clip((a.min(axis=2, keepdims=True) - 238) / 12, 0, 1)
    return Image.fromarray((a * (1 - t) + 255 * t).astype(np.uint8))


def studio_shot(src):
    src = clean_white(src)
    a = np.asarray(src)
    ys, xs = np.nonzero(a.min(axis=2) < 245)
    item = src.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    item.thumbnail((880, 880), Image.LANCZOS)
    shot = Image.new("RGB", (960, 960), (255, 255, 255))
    shot.paste(item, ((960 - item.width) // 2, (960 - item.height) // 2))
    shot = shot.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
    shot.save(ROOT / "inhaler.webp", "WEBP", quality=88, method=6)


def smooth(v, n=41):
    pad = np.pad(v, n // 2, mode="edge")
    return np.array([np.median(pad[i:i + n]) for i in range(len(v))])


def decal(src):
    rot = src.rotate(TILT, Image.BICUBIC, expand=True, fillcolor=(255, 255, 255))
    a = np.asarray(rot).astype(np.float32)
    y0, y1 = LABEL_ROWS
    rows = np.arange(y0, y1)
    mask = a[y0:y1, X_LIMIT[0]:X_LIMIT[1]].min(axis=2) < 246
    left = np.array([np.nonzero(r)[0].min() for r in mask]) + X_LIMIT[0]
    right = np.array([np.nonzero(r)[0].max() for r in mask]) + X_LIMIT[0]
    left, right = smooth(left), smooth(right)
    centre, radius = (left + right) / 2, (right - left) / 2

    width = int(round(2 * THETA * radius.mean()))
    theta = np.linspace(-THETA, THETA, width)
    xs = centre[:, None] + radius[:, None] * np.sin(theta)[None, :]
    x0 = np.floor(xs).astype(int); fx = (xs - x0)[..., None]
    yy = rows[:, None].repeat(width, axis=1)
    img = a[yy, x0] * (1 - fx) + a[yy, x0 + 1] * fx                 # (rows, width, 3), un-wrapped

    # plain-plastic shade under each pixel: the bright 90th percentile of its column, in 120-row blocks
    lum = img @ np.array([.299, .587, .114], dtype=np.float32)
    bg = np.empty_like(lum)
    for s in range(0, lum.shape[0], 120):
        bg[s:s + 120] = np.percentile(lum[max(0, s - 120):s + 240], 90, axis=0)
    bg = np.asarray(Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(20))).astype(np.float32)
    alpha = np.clip((bg - lum - 16) / 40, 0, 1)
    shade = bg[..., None]
    ink = np.where(alpha[..., None] > .02, (img - (1 - alpha[..., None]) * shade) / np.maximum(alpha[..., None], .02), 0)
    out = Image.fromarray(np.dstack([np.clip(ink, 0, 255), alpha * 255]).astype(np.uint8), "RGBA")
    out = out.resize((round(width * DECAL_SCALE), round(len(rows) * DECAL_SCALE)), Image.LANCZOS)
    out.save(ROOT / "decal-inhaler.webp", "WEBP", quality=88, method=6)
    print("label: centre x %.0f, radius %.0f px, decal %d x %d" % (centre.mean(), radius.mean(), *out.size))


def board(path):
    b = Image.open(path).convert("RGB")
    b.thumbnail((1536, 1536), Image.LANCZOS)
    b.save(ROOT / "inhaler-design.webp", "WEBP", quality=86, method=6)


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src = Image.open(sys.argv[1]).convert("RGB")
    studio_shot(src)
    decal(src)
    board(sys.argv[2])
    for n in ("inhaler.webp", "decal-inhaler.webp", "inhaler-design.webp"):
        print(n, Image.open(ROOT / n).size, (ROOT / n).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
