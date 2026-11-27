"""Replaces only the logo emblem (the tree picture); the TRANZLIFE wordmark files are left as they are.

Usage:  python scripts/cut-emblem.py path/to/image-with-the-emblem-on-white.png

Finds the emblem as the biggest picture in the image (anything else, like a line of text, is left out), turns the white
background transparent while keeping soft edges and the shadow, and writes each size where it is needed:
  src/assets/logo/logo-emblem-lg.webp  full size (up to 800 px wide): the loading screen (260 px wide, sharp on 3x
                                       phone screens) and the menu's watermark
  src/assets/logo/logo-emblem.webp     360 px wide: the top bar, menu header and footer (at most 117 px wide, so
                                       sharp even on 3x screens) at a fraction of the download
  public/assets/logo-emblem.webp       the 360 px file at a fixed address (product-details page, browser tab icon)
  public/favicon.png                   96x96 browser tab icon
  public/apple-touch-icon.png          180x180 phone home-screen icon
Then run scripts/make-logo-sketch.py to redraw the loading screen's line sketch, and set .logo-em's aspect-ratio in
src/styles/components/logo.css (and .ld-mark's in loader.css) to the size this prints.
A larger original (or a vector SVG from the designer) always gives a sharper emblem than a screenshot.
"""
import os, sys
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = sys.argv[1]

im = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
# colour-to-alpha against white (the same method as cut-logo.py): soft edges and shadows stay soft
a = np.max((255 - im) / 255, axis=2); a = np.clip((a - .03) / (1 - .03), 0, 1)
A = np.maximum(a, 1e-4)[..., None]; col = np.clip((im - 255 * (1 - A)) / A, 0, 255)

# the emblem: the biggest group of ink, with nearby leaves and roots joined to it
ink = cv2.dilate((a > .12).astype(np.uint8), np.ones((15, 15), np.uint8))
n, labels, stats, _ = cv2.connectedComponentsWithStats(ink)
biggest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
keep = cv2.dilate((labels == biggest).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
alpha = np.where(keep, a, 0)

ys, xs = np.where(alpha > .02)
pad = 4
y0, y1, x0, x1 = max(0, ys.min() - pad), ys.max() + pad + 1, max(0, xs.min() - pad), xs.max() + pad + 1
rgba = np.dstack([col, alpha * 255])[y0:y1, x0:x1].astype(np.uint8)
emblem = Image.fromarray(rgba, 'RGBA')

def sized(width):
    if emblem.width <= width: return emblem
    return emblem.resize((width, round(emblem.height * width / emblem.width)), Image.LANCZOS)

save = lambda img, path: img.save(os.path.join(ROOT, path), 'WEBP', quality=92, method=6)
save(sized(800), 'src/assets/logo/logo-emblem-lg.webp')
save(sized(360), 'src/assets/logo/logo-emblem.webp')
save(sized(360), 'public/assets/logo-emblem.webp')

def icon(size, inner, background=None):
    img = emblem.copy(); img.thumbnail((inner, inner), Image.LANCZOS)
    out = Image.new('RGBA', (size, size), background or (0, 0, 0, 0))
    out.alpha_composite(img, ((size - img.width) // 2, (size - img.height) // 2))
    return out if background is None else out.convert('RGB')

icon(96, 90).save(os.path.join(ROOT, 'public', 'favicon.png'))
icon(180, 152, (238, 242, 230, 255)).save(os.path.join(ROOT, 'public', 'apple-touch-icon.png'))
print(f'emblem: {emblem.width}x{emblem.height}  (aspect-ratio: {emblem.width}/{emblem.height})')
