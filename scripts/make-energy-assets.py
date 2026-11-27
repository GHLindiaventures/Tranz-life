"""Energy Booster images for the shop, the product story and the design view.

Usage:  python scripts/make-energy-assets.py path/to/energy-photo.png

Reads   the client's lifestyle photo (the bottle on a wooden stump, given as an argument) and
        src/assets/products/energy-pack.webp (the bottle on a flat white backdrop, used as the "View design" image)
Writes  src/assets/products/energy.webp      960x960 product shot (shop cards, menu, product page)
        src/assets/products/energy-cut.webp  the bottle cut out on transparency (home product story, benefits)

The other products' cut-outs come from scripts/make-product-cutouts.py (rembg). This bottle stands on a plain backdrop,
so a flood fill from the border is enough: the backdrop is a flat 253 grey-white, the white cap is a shade darker.
"""
import os, sys
import numpy as np
import cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'src', 'assets', 'products')


def biggest(mask):
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    return (lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])).astype(np.uint8)


def joined_to_border(mask):
    n, lab = cv2.connectedComponents(mask, connectivity=4)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    return np.isin(lab, list(edge))


def shot(photo):
    im = Image.open(photo).convert('RGB')
    side = min(im.size)
    im = im.crop(((im.width - side) // 2, (im.height - side) // 2, (im.width + side) // 2, (im.height + side) // 2))
    im.resize((960, 960), Image.LANCZOS).save(os.path.join(OUT, 'energy.webp'), 'WEBP', quality=86, method=6)


def cutout():
    im = np.asarray(Image.open(os.path.join(OUT, 'energy-pack.webp')).convert('RGB'))
    g = im.astype(int)
    gray = g.mean(axis=2)
    # the backdrop: within 3 of 253 and joined to the border
    backdrop = joined_to_border((np.abs(g - 253).max(axis=2) <= 3).astype(np.uint8))
    fg = biggest(cv2.morphologyEx((~backdrop).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)))
    fg[~joined_to_border((1 - fg).astype(np.uint8))] = 1                     # fill holes
    # the bottle's own columns, measured on its body
    body = np.where(fg[300:800].any(axis=0))[0]
    x0, x1 = body.min() + 3, body.max() - 2
    # the soft floor shadow joins the mask under the bottle: below the body keep only the dark glass base
    rows = np.where(fg.any(axis=1))[0]
    widths = fg.sum(axis=1)
    base = next(y for y in range(800, rows.max()) if widths[y] > (x1 - x0) * 1.06)
    under = np.zeros_like(fg); under[:, x0:x1 + 1] = 1
    fg[base:] = (fg[base:] & under[base:] & (gray[base:] < 150)).astype(np.uint8)
    fg = biggest(cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)))
    # the cap is a simple convex shape: use its hull so its white-on-white edge is clean
    top = rows.min()
    cap_w = np.median(widths[top + 15:top + 60])
    neck = next(y for y in range(top + 20, top + 200) if widths[y] < cap_w * .97)   # where the cap meets the neck
    pts = cv2.findNonZero(fg[:neck])
    cap = np.zeros_like(fg[:neck]); cv2.fillConvexPoly(cap, cv2.convexHull(pts), 1); fg[:neck] = cap
    # 1px in from the edge, softly feathered, so no light halo shows on dark pages
    alpha = np.clip(cv2.GaussianBlur(cv2.erode(fg, np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), .9), 0, 1)
    ys, xs = np.where(alpha > .02)
    rgba = np.dstack([im, (alpha * 255).astype(np.uint8)])[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT, 'energy-cut.webp'), 'WEBP', quality=90, method=6)
    return rgba.shape[1], rgba.shape[0]


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    shot(sys.argv[1])
    print('energy.webp 960x960, energy-cut.webp %dx%d' % cutout())
