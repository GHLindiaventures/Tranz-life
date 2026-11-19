# Golden Ratio tooling

The site's proportions follow one Golden Ratio (φ = 1.618) system:

- `src/styles/golden.css`: the system (tokens and the main rules), hand-written.
- `src/styles/golden-snap.css`: **generated**. Every remaining text size and section padding, snapped to the nearest golden step.

After changing pages or components, regenerate the snap layer and check coverage (dev server on port 5199, Microsoft Edge installed):

```
node scripts/golden-ratio/scan.cjs                     # scans every page, its menus, footer and chat -> scan.json
python scripts/golden-ratio/generate.py scripts/golden-ratio/scan.json src/styles/golden-snap.css
node scripts/golden-ratio/coverage.cjs                 # % of text, headings and section spacing on the scale
```

Scale: text 11.9 · 13.4 · 15.1 · 17 · 19.1 · 21.6 px (¼-φ steps); headings 27.5 · 44.5 · 72 · 116.5 px (φ steps, fluid);
spacing 8 · 13 · 21 · 34 · 55 · 89 · 144 px (φ steps). Hand-set exceptions live in `MANUAL_CSS` in `generate.py`.
