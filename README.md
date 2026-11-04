# TranzLife Biosciences website

Marketing and shop site for TranzLife Biosciences ("Innovating Life Beyond Limits"): five plant-based products (gummies, a calming inhaler, a period relief roll-on, the Reviva foot-care roll-on and a liver booster liquid).

The site is a single page built with Vite and plain JavaScript (ES modules). It includes:

- live 3D models of all five products (Three.js), labelled with artwork from the product designs
- a pinned product story where each product turns while its feature card glides past
- the client's product images everywhere a product is shown, with a "View design" lightbox
- a molecule "seed to shelf" pipeline
- smooth scrolling (Lenis) with GSAP ScrollTrigger animations
- a left dock menu
- a front-end bag
- "Ask Tulsi", a friendly natural-health chat assistant running on a local AI model

## Requirements

- Node.js 22.9 or newer (`npm start` reads `.env` with `--env-file-if-exists`)
- [Ollama](https://ollama.com) with the chat model pulled: `ollama pull gemma2:9b` (the site still works without it; only the chat shows a "can't connect" message)
- Python 3.10+ only if you want to regenerate the image assets in `scripts/`

## Setup and run

```bash
npm install
npm run dev          # http://localhost:5173 with live reload, Tulsi chat included
```

## Tulsi wellness chat (local AI)

The "Ask Tulsi" button opens a chat with a friendly natural-health advisor. It answers through a local Ollama model, so no chat data leaves the machine.

The chat is part of the site: its API (`server/chat-api.js`) runs inside `npm run dev` and `npm run preview`, and inside `npm start` in production. There is no separate chat server to start. Set `CHAT_MODEL` in `.env` to try another model (`qwen2.5:7b` is faster, but writes weaker Tanglish).

How it decides what to say:

- `server/advisor-rules.js` is plain code that reads each message before the model sees it. It picks the matching product (if any), spots warning signs that need a doctor (for example a foot wound with diabetes, or yellow eyes) and detects English, Tamil or Tanglish. The model is told what to do in a short note, and the product card is shown from this decision, not from the model's text.
- `server/advisor-prompt.js` holds Tulsi's personality and safety rules, and fixed replies for emergencies (112) and self-harm (Tele-MANAS 14416) that never go through the model.
- To add a new concern-to-product match, add keywords in `advisor-rules.js` and a line to `MATCH` in `advisor-prompt.js`, then add a test in `tests/server/advisor-rules.test.js`.

## Going live

```bash
npm run build
npm start            # site + chat on http://localhost:3000 (PORT in .env)
```

`npm start` (`server/index.js`) serves the built site and the chat API from one Node process, so host it on a machine that has a GPU and runs Ollama, behind your domain and HTTPS. Uploading only `dist/` to a static host gives you the site without the chat.

## Build

```bash
npm run build        # site in dist/
npm run preview      # serve dist/ locally (with the chat) to check the build
npm run build:single # one self-contained file: dist-single/index.html (works from disk, easy to email, no chat)
```

`dist/` uses ES modules, so open it through a web server (`npm run preview` or your host), not by double-clicking. Use `build:single` when you need a file that opens straight from disk.

## Test

```bash
npm test             # Vitest unit tests: helpers, catalogue data and the chat routing rules
```

## Configuration

Copy `.env.example` to `.env`. All values are optional:

| Variable | What it does when set |
|---|---|
| `VITE_CHECKOUT_URL` | "Checkout" in the bag goes to this hosted checkout with `?items=id:qty,...` |
| `VITE_CONTACT_ENDPOINT` | The contact form is posted to this URL as JSON |
| `CHAT_MODEL` | Ollama model for the Tulsi chat (default `gemma2:9b`) |
| `OLLAMA_URL` | Where Ollama runs (default `http://localhost:11434`) |
| `PORT` | Port for `npm start` (default 3000) |

Without them, checkout and the contact form show friendly placeholder messages. Anything starting with `VITE_` is public, so never put secret keys there.

## Project structure

```
src/
├── main.js        entry point: loads styles, boots features in order
├── app/           app-wide plumbing: state, loader, brand, sections, smooth scroll, scroll animations, intro
├── assets/        images and logo parts (imported by CSS/HTML, hashed at build)
├── components/    small shared UI (toast, design lightbox)
├── data/          content: products, product story cards, herbs, needs, lab, sections, pipeline stages
├── features/      one folder per page feature (hero, product-story, products, pipeline, science, lab, finder, cart, contact, navigation, chat)
├── lib/           GSAP setup, canvas artwork, 3D reflection environments
├── styles/        base/, components/, sections/, responsive.css, imported by main.css in cascade order
└── utils/         dom, math/easing, formatting, media preferences
server/            Tulsi chat API (chat-api.js, advisor rules and prompt) and the production server (index.js)
public/            files copied as-is (favicons)
tests/             unit tests mirroring src/
scripts/           Python tools that regenerate the logo cut-out, the botanical background and the product images
docs/              architecture notes and changelog
```

See `docs/architecture.md` for how the pieces talk to each other.

## Editing content

- Products, prices and ingredients: `src/data/products.js`
- Product story cards: `src/data/product-story.js` (same order as products)
- Product finder: `src/data/needs.js`
- Science herbs: `src/data/herbs.js`
- R&D board: `src/data/lab.js`
- Pipeline stages: `src/data/pipeline.js`
- Menu sections: `src/data/sections.js` (each `id` must match a section `id` in `index.html`; a test checks this)

## Notes

- Fonts load from Google Fonts: Archivo and Caveat.
- The logo lives in `src/assets/logo/`. To replace it, run `python scripts/cut-logo.py new-logo-on-white.png` (or drop in your own transparent WebP files with the same names) and rebuild.
- Product images live in `src/assets/products/`. To update them after a design changes, put the five design files (`gummies.png`, `inhaler.png`, `rollon.png`, `reviva.png`, `liver.png`) in a folder and run `python scripts/make-product-assets.py path/to/folder`. Add `--shots-only` to skip the 3D label artwork. The crop boxes at the top of the script match the current designs.
- Prices in `src/data/products.js` are placeholders until the client confirms them.
- The contact form and checkout are front-end only until the environment variables above are set.
