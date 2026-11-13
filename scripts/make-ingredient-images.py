"""Card images for the Our Ingredients page from the client's 34 ingredient pictures.

Each picture is named after its ingredient id in src/data/ingredients.js (e.g. black-pepper.jpg) and is written to
public/assets/ingredients/<id>.webp at 1280 x 800 (the cards' 16:10 frame):
  - cut-outs on a plain light background are fitted whole, on that background colour, with soft edges
  - a fake transparency checkerboard or plain grey backdrop is flood-filled to white first (CHECKER below)
  - full photographs are cropped to 16:10 (centre, or the focus given below)

Usage: python scripts/make-ingredient-images.py <folder>
  The folder holds all 34 pictures as <id>.png / .jpg / .jpeg / .webp.
Replace single pictures: python scripts/make-ingredient-images.py <id>=<picture> [<id>=<picture> ...]
  e.g. echinacea=echinacea-large.png
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "public" / "assets" / "ingredients"
W, H = 1280, 800

ORDER = [
    "wintergreen", "peppermint", "ginger", "lavender", "eucalyptus", "sesame", "dill", "lemon",
    "bhumyamalaki", "kalmegh", "kutki", "punarnava", "bhringraj", "daruharidra", "guduchi", "amla", "haritaki",
    "turmeric", "black-pepper", "tulsi", "cumin", "black-turmeric", "long-pepper", "vasaka", "licorice",
    "small-onion", "ruta", "symphytum", "echinacea", "hecla-lava", "calc-phos", "vitamin-c", "vitamin-d3", "zinc",
]
# pictures whose light neutral background (a fake transparency checkerboard, or a plain grey studio backdrop) is
# flood-filled to white from the edges; the value is the darkest grey that still counts as background
CHECKER = {"ginger": 205, "bhumyamalaki": 205, "lemon": 190, "small-onion": 205, "symphytum": 172}
# backgrounds also trapped inside the subject (between stems): whiten every background-grey pixel, not only the
# ones connected to the edges
EVERYWHERE = {"symphytum"}
# since the 13 Nov 2026 cut-out set every picture is a subject on a plain background, fitted whole;
# only haritaki is still a full photograph, cropped to the frame
FIT = set(ORDER) - {"haritaki"}
# crop focus (x, y as 0-1 of the picture) for cropped photos whose subject is off-centre
FOCUS = {"haritaki": (.5, .5)}


def unchecker(img, darkest=205, everywhere=False):
    """Flood-fill the light, grey-neutral checkerboard from the edges and paint it white."""
    a = np.asarray(img).astype(np.int16)
    h, w, _ = a.shape
    bg = (a.min(axis=2) > darkest) & ((a.max(axis=2) - a.min(axis=2)) < 16)
    seen = bg.copy() if everywhere else np.zeros((h, w), bool)
    q = deque() if everywhere else deque([(y, x) for x in range(w) for y in (0, h - 1)] + [(y, x) for y in range(h) for x in (0, w - 1)])
    while q:
        y, x = q.popleft()
        if 0 <= y < h and 0 <= x < w and bg[y, x] and not seen[y, x]:
            seen[y, x] = True
            q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
    m = Image.fromarray((seen * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    white = Image.new("RGB", img.size, (255, 255, 255))
    return Image.composite(white, img, m)


def fit(img):
    """Whole picture on a canvas of its own border colour, edges feathered so no seam shows."""
    a = np.asarray(img)
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    colour = tuple(int(c) for c in np.median(border, axis=0))
    s = min(W * .96 / img.width, H * .96 / img.height)
    pic = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    f = max(8, int(min(pic.size) * .06))
    rx = np.clip(np.minimum(np.arange(pic.width), np.arange(pic.width)[::-1]) / f, 0, 1)
    ry = np.clip(np.minimum(np.arange(pic.height), np.arange(pic.height)[::-1]) / f, 0, 1)
    mask = Image.fromarray((np.outer(ry, rx) * 255).astype(np.uint8))
    canvas = Image.new("RGB", (W, H), colour)
    canvas.paste(pic, ((W - pic.width) // 2, (H - pic.height) // 2), mask)
    return canvas


def cover(img, focus=(.5, .5)):
    s = max(W / img.width, H / img.height)
    pic = img.resize((max(W, round(img.width * s)), max(H, round(img.height * s))), Image.LANCZOS)
    x = int(np.clip(focus[0] * pic.width - W / 2, 0, pic.width - W))
    y = int(np.clip(focus[1] * pic.height - H / 2, 0, pic.height - H))
    return pic.crop((x, y, x + W, y + H))


def build(pid, path):
    img = Image.open(path)
    if img.mode in ("RGBA", "LA", "P"):                  # real transparency: put it on white
        img = img.convert("RGBA")
        white = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(white, img)
    img = img.convert("RGB")
    if pid in CHECKER:
        img = unchecker(img, CHECKER[pid], pid in EVERYWHERE)
    out = fit(img) if pid in FIT else cover(img, FOCUS.get(pid, (.5, .5)))
    if min(img.size) < 400:
        out = out.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))
    out.save(OUT / f"{pid}.webp", "WEBP", quality=82, method=6)
    print(f"{Path(path).name} -> {pid}.webp  ({img.width}x{img.height}, {'fit' if pid in FIT else 'crop'})")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    OUT.mkdir(parents=True, exist_ok=True)
    if "=" in sys.argv[1]:
        for pair in sys.argv[1:]:
            pid, path = pair.split("=", 1)
            if pid not in ORDER:
                sys.exit(f"unknown ingredient id: {pid}")
            build(pid, path)
        return
    folder = Path(sys.argv[1])
    for pid in ORDER:
        found = sorted(p for p in folder.glob(pid + ".*") if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"))
        if not found:
            sys.exit(f"missing picture for {pid} in {folder}")
        build(pid, found[0])


if __name__ == "__main__":
    main()
