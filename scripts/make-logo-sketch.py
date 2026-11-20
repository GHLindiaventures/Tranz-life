"""Traces the logo into pen-sketch lines for the loading screen and writes them into index.html.

Usage:  python scripts/make-logo-sketch.py

Reads src/assets/logo/logo-emblem.webp and logo-word.webp, finds their outlines (OpenCV Canny + contours)
and writes two inline SVGs between the <!-- logo-sketch:start --> and <!-- logo-sketch:end --> markers in
index.html. Each line gets a start time (--t) and a length (--d) so the loader draws them in order:
the DNA first, then the roots, trunk and leaves, then the name, left to right. Re-run it if the logo changes.
"""
import os, re
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
LOGO = os.path.join(ROOT, 'src', 'assets', 'logo')
HTML = os.path.join(ROOT, 'index.html')

def contours(path, minlen, eps, blur):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32)
    al = im[..., 3]/255
    rgb = im[..., :3]*al[..., None] + 255*(1 - al[..., None])
    gray = cv2.GaussianBlur(cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2GRAY), (0, 0), blur)
    edges = cv2.Canny(gray, 60, 140) | cv2.Canny((al*255).astype(np.uint8), 50, 150)
    found, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in found:
        L = cv2.arcLength(c, False)
        if L >= minlen: out.append((cv2.approxPolyDP(c, eps, False)[:, 0, :], L))
    return im, out

d = lambda p: 'M' + 'L'.join(f'{x} {y}' for x, y in p)

# emblem: group each line as DNA, roots, trunk or leaves, then time each group in turn (ms)
im, lines = contours(os.path.join(LOGO, 'logo-emblem.webp'), 22, .9, 1.2)
r, g, b, a = (im[..., i] for i in range(4))
gold = ((a > 128) & (r > 150) & (g > 120) & (b < 110)).astype(np.uint8)
dna = np.zeros_like(gold); dna[185:335, 135:515] = 1; dna &= cv2.dilate(gold, np.ones((9, 9), np.uint8))
H, W = gold.shape
groups = {'dna': [], 'root': [], 'trunk': [], 'leaf': []}
for p, L in lines:
    cx, cy = p[:, 0].mean(), p[:, 1].mean()
    on_dna = dna[np.clip(p[:, 1], 0, H - 1), np.clip(p[:, 0], 0, W - 1)].mean() > .5
    groups['dna' if on_dna else 'root' if cy > 300 else 'trunk' if cy > 150 and 230 < cx < 410 else 'leaf'].append((p, L, cx, cy))
WINDOW = {'dna': (100, 950), 'root': (780, 1270), 'trunk': (930, 1520), 'leaf': (1240, 2300)}
em = []
for name, items in groups.items():
    items.sort(key=lambda o: o[2] if name == 'dna' else -o[3])
    t0, t1 = WINDOW[name]
    for k, (p, L, cx, cy) in enumerate(items):
        t = t0 + (t1 - t0 - 300)*k/max(1, len(items) - 1)
        em.append(f'<path pathLength="1"{" class=\"g\"" if name == "dna" else ""} style="--t:{t:.0f}ms;--d:{min(560, max(200, L*2.5)):.0f}ms" d="{d(p)}"/>')

# wordmark: left to right
_, wl = contours(os.path.join(LOGO, 'logo-word.webp'), 14, .8, .8)
wl.sort(key=lambda o: o[0][:, 0].mean())
wd = [f'<path pathLength="1" style="--t:{2550 + 680*k/max(1, len(wl) - 1):.0f}ms;--d:{min(440, max(190, L*1.4)):.0f}ms" d="{d(p)}"/>' for k, (p, L) in enumerate(wl)]

block = ('<!-- logo-sketch:start (made by scripts/make-logo-sketch.py) -->\n'
  '    <div class="ld-mark"><svg class="ld-sk" viewBox="0 0 640 381" aria-hidden="true">' + ''.join(em) + '</svg><span class="logo-em ld-real" role="img" aria-label="TranzLife Biosciences"></span></div>\n'
  '    <div class="ld-word"><svg class="ld-sk" viewBox="0 0 1100 231" aria-hidden="true">' + ''.join(wd) + '</svg><span class="logo-word ld-real" aria-hidden="true"></span></div>\n'
  '    <!-- logo-sketch:end -->')
html = open(HTML, encoding='utf-8').read()
html, n = re.subn(r'<!-- logo-sketch:start.*?<!-- logo-sketch:end -->', lambda m: block, html, flags=re.S)
assert n == 1, 'logo-sketch markers not found in index.html'
open(HTML, 'w', encoding='utf-8').write(html)
print('sketch:', len(em), 'emblem lines,', len(wd), 'word lines,', len(block)//1024, 'KB')
