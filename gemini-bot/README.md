# TranzLife Website Chatbot

## Run
1. `npm install`
2. `cp .env.example .env` and set `GEMINI_API_KEY` (or `GEMINI_API_KEYS` for multi-key pool)
3. `npm start` then open:
   - **Chat Demo:** http://localhost:3000
   - **Admin & Quota Dashboard:** http://localhost:3000/admin
   - `npm run mock` runs in mock mode without calling Gemini.

## Features
- **Multi-key rotation:** Add multiple keys in `GEMINI_API_KEYS=key1,key2,key3`. The bot automatically rotates if a key hits quota limits (429/404/503).
- **Live Monitoring Dashboard:** Real-time RPM/RPD meters, latency, request logs, and key status at `/admin`.
- **Strict Guardrails:** Guided by company rules in `server.js` preventing medical/disease claims, unauthorized price guessing, and off-topic questions.
- **In-memory Rate Limiting:** 20 messages per 5 minutes per IP.

## Add to your website
Host this server, then paste before `</body>` on your site:
```html
<script src="https://YOUR-BOT-HOST/chatbot.js" data-api="https://YOUR-BOT-HOST"></script>
```
Put your site's origin in `ALLOWED_ORIGINS` in `.env` (or `*` to allow all).

## Update product info
Edit `products.json` only (no code change). The `unconfirmed` fields tell the bot what NOT to guess.
Rules and tone live in `SYSTEM_PROMPT` in `server.js`.
