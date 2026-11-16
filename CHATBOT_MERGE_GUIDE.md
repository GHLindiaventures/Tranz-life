# Tulsi Chatbot — Merge Guide

How to copy the Tulsi chatbot (Gemini primary + Ollama fallback) from the `vishnu-dev` branch into another site.

## 1. Files and folders to copy

### A. Backend — chat engine (copy the whole `server/` folder, minus the debug files)

| File | What it does |
|---|---|
| `server/chat-api.js` | **Main entry.** Gemini engine (4-key rotation) + Ollama fallback + `/api/chat`, `/api/health`, `/api/insight` routes |
| `server/index.js` | Production server (`npm start`): serves `dist/` and the chat API on one port |
| `server/advisor-prompt.js` | Ollama bot: system prompt + emergency replies |
| `server/advisor-rules.js` | Ollama bot: question analysis and routing |
| `server/reply-check.js` | Ollama bot: checks and fixes model replies, product cards, suggestion chips |
| `server/understand.js` | Ollama bot: semantic understanding layer (embeddings) |
| `server/intents.js` | Ollama bot: intent examples |
| `server/faq.js` | Ollama bot: FAQ answers |
| `server/insights.js` | Ollama bot: anonymous topic counting |
| `server/wellness-tips.js` | Ollama bot: wellness tips by concern |
| `server/wellness-tips-more.js` | Ollama bot: extra concerns and examples |

**Do NOT copy:** `server/debug-gemini*.mjs`, `server/test-gemini.mjs`, `server/test-http.mjs`, `server/test-integration.mjs` (local scratch scripts, not in git).

### B. Gemini bot product data (required)

| File | Why |
|---|---|
| `gemini-bot/products.json` | `chat-api.js` loads the Gemini system prompt from this file (`../gemini-bot/products.json`). **Without it, the server crashes on start when Gemini keys are set.** |

Only `products.json` is needed from `gemini-bot/`. Do not copy `gemini-bot/.env` (it holds API keys), `node_modules/`, `index.html`, `public/` or `chatbot.js` (old dummy UI).

### C. Frontend — Tulsi UI

| File | What it does |
|---|---|
| `src/features/chat/chat-widget.js` | The chat widget (bubble, panel, messages, product cards) |
| `src/styles/components/chat.css` | Widget styles |
| `src/data/catalog.js` | Product catalogue — used by the widget **and** by the Ollama server files |
| `src/utils/dom.js` | `$` helper used by the widget (skip if the site already has the same file) |
| `src/utils/format.js` | `inr` price formatter used by the widget (skip if the site already has it) |

### D. Tests and eval scripts (optional, recommended)

- `tests/server/` — whole folder (Ollama bot tests, run with `npm test`)
- `scripts/tulsi-eval.mjs`, `scripts/understand-eval.mjs`, `scripts/insights-report.mjs`
- `docs/tulsi-safety-review.md`, `docs/tulsi-test-results.md`, `TULSI_FIX_BRIEF.md` (reference docs)

## 2. Edits to existing files (do not overwrite — add these lines)

**`src/main.js`**
```js
import { initChat } from './features/chat/chat-widget.js';
// ...inside the startup code:
initChat();
```

**`src/styles/main.css`**
```css
@import './components/chat.css';
```

**`vite.config.js`** — runs the chat API inside `npm run dev` / `npm run preview`:
```js
import { loadEnv } from 'vite';
import { createChatApi } from './server/chat-api.js';

function tulsiChat(env){
  let api;
  const mount = server => {
    api ??= createChatApi(env);
    server.middlewares.use((req, res, next) => api.handle(req, res, next));
    server.httpServer?.once('listening', () => api.warmUp(server.config.logger));
  };
  return { name: 'tulsi-chat', configureServer: mount, configurePreviewServer: mount };
}
// in defineConfig(({ mode }) => { const env = loadEnv(mode, process.cwd(), ''); ... })
// plugins: [ ..., tulsiChat(env) ]
```

**`package.json`**
```json
"dependencies": { "@google/genai": "^3.3.0" },
"scripts": {
  "start": "node --env-file-if-exists=.env server/index.js",
  "test:chat": "node --env-file-if-exists=.env scripts/tulsi-eval.mjs docs/tulsi-test-results.md"
}
```
Then run `npm install`.

**`.gitignore`**
```
.env
data/
```
(`data/` holds the anonymous insights log; it must never be committed.)

## 3. Environment variables (`.env`, never commit)

| Variable | Needed for | Example |
|---|---|---|
| `GEMINI_API_KEYS` | Gemini (primary) — comma-separated, up to 4 keys | `key1,key2,key3,key4` |
| `GEMINI_MODEL` | Gemini model | `gemini-3.5-flash-lite` |
| `CHAT_MODEL` | Ollama fallback model | `gemma2:9b` |
| `OLLAMA_URL` | Ollama address | `http://localhost:11434` |
| `PORT` | `npm start` port | `3000` |
| `CHAT_ORIGIN` | only if the chat API is on a different domain | `https://www.example.com` |
| `VITE_CHAT_API` | only if the chat API is on a different domain (build time) | `https://chat.example.com` |
| `EMBED_MODEL`, `UNDERSTAND`, `INSIGHTS`, `INSIGHTS_FILE` | optional Ollama-side settings | — |

Ask Vishnu for the actual Gemini keys privately — not over git.

## 4. How it works after merging

```
User message → Gemini Key 1 → (quota/429?) → Key 2 → Key 3 → Key 4
                                                       ↓ all fail
                                              Ollama gemma2:9b (full Tulsi pipeline)
```
- Gemini is standalone: its own prompt from `gemini-bot/products.json`, replies in Tanglish when the user writes Tanglish.
- Ollama runs only when all Gemini keys fail; it needs `ollama serve` and `ollama pull gemma2:9b`.

## 5. Quick check

```bash
npm install
npm run dev
# open the site, click the chat bubble, send "vanakkam"
# or: curl http://localhost:5173/api/health   → primaryEngine: "gemini"
```
