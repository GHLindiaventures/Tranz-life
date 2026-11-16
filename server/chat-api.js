// Tulsi chat API: Gemini (primary, 4-key rotation) → Ollama (silent fallback when all keys hit quota).
//   POST /api/chat   { messages:[{ role:'user'|'assistant', content }] }  →  plain text
//   GET  /api/health → { ok, model, geminiKeys, activeEngine }
// Used in two places so the chat is always part of the site:
//   - vite.config.js  mounts it inside `npm run dev` and `npm run preview`
//   - server/index.js serves it next to the built site for `npm start`
import { GoogleGenAI } from '@google/genai';
import { emergencyReply, systemPrompt } from './advisor-prompt.js';
import { analyse, routingNote } from './advisor-rules.js';
import { NEXT_LINE, fallbackReply, fixedReply, problems, productLead, productTail, replyActions, suggestChips } from './reply-check.js';
import { createUnderstanding } from './understand.js';
import { createInsights } from './insights.js';

const MAX_TURNS = 12, MAX_CHARS = 1500;

// ── Helpers ──────────────────────────────────────────────────────────────────

function cleanHistory(raw){
  if (!Array.isArray(raw)) return null;
  const msgs = raw.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role:m.role, content:m.content.slice(0, MAX_CHARS) })).slice(-MAX_TURNS);
  return msgs.length && msgs[msgs.length - 1].role === 'user' ? msgs : null;
}

function readJson(req){
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 64e3){ reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch(e){ reject(e); } });
    req.on('error', reject);
  });
}

// Is this error something we should rotate keys for (quota / rate-limit / not-found)?
function isRotatableError(e){
  const m = `${e.status || ''} ${e.message || ''}`.toLowerCase();
  return m.includes('429') || m.includes('quota') || m.includes('resource_exhausted') ||
         m.includes('rate limit') || m.includes('503') || m.includes('404') ||
         m.includes('not found') || m.includes('not_found') || m.includes('unavailable');
}

// ── Gemini key manager ───────────────────────────────────────────────────────

function createGeminiEngine(env){
  const MODEL = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  // Accept comma-separated keys from GEMINI_API_KEYS or GEMINI_API_KEY
  const rawKeys = (env.GEMINI_API_KEYS || env.GEMINI_API_KEY || '').split(',')
    .map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

  if (!rawKeys.length){
    console.warn('[tulsi] No GEMINI_API_KEYS set — Gemini engine disabled, using Ollama only.');
    return null;
  }

  const clients = rawKeys.map(k => new GoogleGenAI({ apiKey: k }));
  let idx = 0;

  const label = () => `Key-${idx + 1}/${clients.length}(...${rawKeys[idx].slice(-6)})`;

  function rotate(){
    const prev = idx;
    idx = (idx + 1) % clients.length;
    console.warn(`[tulsi] Gemini ${label(prev === idx ? '' : `Key-${prev + 1} →`)}: rotating to Key-${idx + 1}`);
    return idx !== prev;      // false when there is only one key
  }

  // Try all keys in turn; returns the text reply or throws when ALL keys are exhausted.
  async function call(systemText, messages, signal){
    // Convert chat history: Tulsi uses 'assistant'; Gemini SDK wants 'model'
    const contents = messages
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    // Gemini history must start with a 'user' turn
    while (contents.length && contents[0].role !== 'user') contents.shift();

    let lastErr;
    for (let attempt = 0; attempt < clients.length; attempt++){
      try {
        const genConfig = {
          model: MODEL,
          contents,
          config: {
            systemInstruction: systemText,
            maxOutputTokens: 500,
            temperature: 0.4
          }
        };
        const r = await clients[idx].models.generateContent(genConfig);
        const text = (r.text || '').trim();
        if (text) console.log(`[tulsi] gemini ${label()} ok`);
        return text;
      } catch(e){
        lastErr = e;
        console.warn(`[tulsi] gemini ${label()} error: ${e.status || ''} ${(e.message || '').slice(0, 80)}`);
        if (isRotatableError(e) && clients.length > 1){
          rotate();
        } else {
          throw e;    // non-quota error — propagate immediately
        }
      }
    }
    throw lastErr;    // all keys exhausted
  }

  return { call, model: MODEL, keyCount: rawKeys.length, label };
}

// ── Main factory ─────────────────────────────────────────────────────────────

// env: an object with CHAT_MODEL, OLLAMA_URL, GEMINI_API_KEYS, GEMINI_MODEL, CHAT_ORIGIN (all optional)
function createChatApi(env = {}){
  const OLLAMA_MODEL = env.CHAT_MODEL || 'gemma2:9b';
  const OLLAMA = (env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
  const ORIGIN = env.CHAT_ORIGIN || '';
  const SYSTEM = systemPrompt();

  // Gemini engine (primary). null when no keys are configured.
  const gemini = createGeminiEngine(env);

  // Semantic understanding layer (embeddings + closed-set classifier)
  const understanding = env.UNDERSTAND === 'off' ? null : createUnderstanding(env);

  // Anonymous issue counter — labels are generated by Ollama as before
  const insights = createInsights(env, {
    generateLabel: prompt => fetch(`${OLLAMA}/api/generate`, {
      method: 'POST', signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false,
        keep_alive: '30m', options: { temperature: 0, num_predict: 12 } })
    }).then(r => r.ok ? r.json() : null).then(j => j?.response || '')
  });

  // ── Engines ─────────────────────────────────────────────────────────────────

  // Ollama fallback — same as before
  async function generateOllama(messages, temperature, signal){
    const limit = AbortSignal.timeout(45000);
    const r = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      signal: signal ? AbortSignal.any([signal, limit]) : limit,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, keep_alive: '30m', messages,
        options: { temperature, top_p: .9, repeat_penalty: 1.1, num_ctx: 4096, num_predict: 350 } })
    });
    if (!r.ok) throw new Error(`ollama ${r.status}`);
    return ((await r.json()).message?.content || '').trim();
  }

  // Unified generate: try Gemini first; if it fails (all keys exhausted) silently fall back to Ollama.
  async function generate(messages, temperature, signal){
    if (gemini){
      try {
        // Build a system text that includes the routing note (last system message in messages array)
        // The messages array coming in already has { role:'system', content } entries inserted by respond().
        // Strip those out for Gemini's contents array and pass as systemInstruction.
        const systemParts = messages.filter(m => m.role === 'system').map(m => m.content);
        const chatParts   = messages.filter(m => m.role !== 'system');
        const systemText  = systemParts.join('\n\n');
        const text = await gemini.call(systemText, chatParts, signal);
        if (text) return text;
        // empty text → fall through to Ollama
        console.warn('[tulsi] gemini returned empty reply, falling back to ollama');
      } catch(e){
        if (signal?.aborted) throw e;
        console.warn(`[tulsi] all gemini keys exhausted (${e.status || e.message?.slice(0,60)}), switching to ollama`);
        // fall through to Ollama silently
      }
    }
    // Ollama fallback: convert the messages array to Ollama format
    // Ollama uses role 'system' natively, so we can pass the full convo as-is
    return generateOllama(messages, temperature, signal);
  }

  // ── Safety pipeline ──────────────────────────────────────────────────────────

  // Returns { text, products, via } where via is:
  //   'emergency'  – fixed 112/14416 reply
  //   'fixed'      – deterministic safe reply (no model needed)
  //   'model'      – first draft from primary engine accepted
  //   'retry'      – second draft after checker feedback
  //   'fallback'   – all drafts rejected; approved tip text used
  async function respond(msgs, signal){
    const urgent = emergencyReply(msgs[msgs.length - 1].content);
    if (urgent) return { text: urgent, products: [], via: 'emergency', problems: [] };

    const semantic = understanding ? await understanding.understandChat(msgs) : null;
    const a = analyse(msgs, { semantic });

    let fixed = a.modelWrite ? '' : fixedReply(a);
    if (fixed && a.askNext && !fixed.includes(NEXT_LINE)) fixed = `${fixed}\n\n${NEXT_LINE}`;
    if (fixed){
      if (a.mode === 'clarify') console.log(`[tulsi] clarify (message length ${msgs[msgs.length - 1].content.length})`);
      return { text: fixed, checked: fixed, products: a.products, suggest: suggestChips(a),
               actions: replyActions(a), via: 'fixed', problems: [], analysis: a };
    }

    const earlier = a.keepHistory ? msgs.slice(-5, -1) : [];
    const convo = [{ role: 'system', content: SYSTEM }, ...earlier,
                   { role: 'system', content: routingNote(a) }, msgs[msgs.length - 1]];

    // draft() never throws: returns null on timeout / abort
    const draft = async (messages, temperature) => {
      try { return await generate(messages, temperature, signal); }
      catch(err){ if (signal?.aborted) throw err; console.log(`[tulsi] engine failed: ${err.message}`); return null; }
    };

    let text = await draft(convo, .5);
    let found = text == null ? ['model unavailable'] : problems(text, a);
    let via = 'model';
    const first = found;

    if (found.length && text != null){
      const fix = { role: 'system', content: `Your previous draft broke these rules: ${found.join('; ')}. Write the reply again. Follow the routing note exactly, use only the approved tips, and fix every problem listed.` };
      text = await draft([...convo, { role: 'assistant', content: text }, fix], .2);
      found = text == null ? ['model unavailable'] : problems(text, a);
      via = 'retry';
    }
    if (found.length){ text = fallbackReply(a); via = 'fallback'; }

    text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const checked = text;

    // Fixed sentences (e.g. "I can't advise on ashwagandha") go first; product card lead/tail added after
    if (a.lead?.length) text = `${a.lead.join('\n\n')}\n\n${text}`;
    if (a.modelWrite && via !== 'fallback'){
      const before = productLead(a), after = productTail(a);
      if (before.length) text = `${before.join(' ')}\n\n${text}`;
      if (after.length)  text = `${text}\n\n${after.join(' ')}`;
    }
    if (a.prefix.length) text = `${a.prefix.join(' ')}\n\n${text}`;
    if (a.suffix.length) text = `${text}\n\n${a.suffix.join(' ')}`;
    if (a.askNext) text = `${text}\n\n${NEXT_LINE}`;

    return { text, checked, products: a.products, suggest: suggestChips(a),
             actions: replyActions(a), via, problems: first, analysis: a };
  }

  // ── HTTP handlers ────────────────────────────────────────────────────────────

  async function chat(req, res){
    let msgs;
    try { msgs = cleanHistory((await readJson(req)).messages); } catch(e){ msgs = null; }
    if (!msgs){ res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end('{"error":"bad request"}'); }

    const ctrl = new AbortController();
    res.on('close', () => { if (!res.writableEnded) ctrl.abort(); });
    try {
      const out = await respond(msgs, ctrl.signal);
      if (out.via !== 'model') console.log(`[tulsi] ${out.via}${out.problems.length ? `: ${out.problems.join('; ')}` : ''}`);
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache',
        'X-Products':  out.products.join(','),
        'X-Suggest':   (out.suggest  || []).join('|'),
        'X-Actions':   (out.actions  || []).join(','),
        'Access-Control-Expose-Headers': 'X-Products, X-Suggest, X-Actions'
      });
      res.end(out.text);
      insights.record(out.analysis, msgs[msgs.length - 1].content,
        { via: out.via, emergency: out.via === 'emergency', first: msgs.filter(m => m.role === 'user').length === 1 });
    } catch(err){
      if (ctrl.signal.aborted) return;
      console.error('[tulsi]', err.message);
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('unavailable');
    }
  }

  // connect-style middleware
  function handle(req, res, next = () => { res.writeHead(404); res.end(); }){
    const path = req.url.split('?')[0];
    if (!path.startsWith('/api/')) return next();
    if (ORIGIN){ res.setHeader('Access-Control-Allow-Origin', ORIGIN); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Vary', 'Origin'); }
    if (req.method === 'OPTIONS'){ res.writeHead(204); return res.end(); }
    if (req.method === 'POST' && path === '/api/chat')    return chat(req, res);
    if (req.method === 'POST' && path === '/api/insight'){
      readJson(req).then(b => insights.enquire(String(b.enquire || ''))).catch(() => {});
      res.writeHead(204); return res.end();
    }
    if (req.method === 'GET' && path === '/api/health'){
      const info = { ok: true, primaryEngine: gemini ? 'gemini' : 'ollama',
        geminiKeys: gemini?.keyCount ?? 0, geminiModel: gemini?.model ?? null,
        ollamaModel: OLLAMA_MODEL };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(info));
    }
    next();
  }

  // Warm up both engines at startup
  function warmUp(log = console){
    // Warm Ollama (silent: only logs if it's the actual fallback that will be used)
    fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({ model: OLLAMA_MODEL, keep_alive: '30m' })
    })
    .then(r => r.ok
      ? log.info(`  Tulsi ollama fallback ready (${OLLAMA_MODEL})`)
      : log.warn(`  Tulsi ollama: could not load ${OLLAMA_MODEL}. Run: ollama pull ${OLLAMA_MODEL}`))
    .catch(() => log.warn(`  Tulsi ollama: not running at ${OLLAMA}. Run: ollama serve`));

    // Log Gemini state
    if (gemini){
      log.info(`  Tulsi primary engine: Gemini (${gemini.model}, ${gemini.keyCount} key(s) with auto-rotation)`);
    } else {
      log.info(`  Tulsi primary engine: Ollama only (no GEMINI_API_KEYS set)`);
    }

    // Semantic embedding layer (runs in background, Ollama only)
    understanding?.init()
      .then(() => log.info('  Tulsi understanding layer ready'))
      .catch(() => log.warn(`  Tulsi understanding layer off (embedding model unavailable). Run: ollama pull ${env.EMBED_MODEL || 'bge-m3'}`));
  }

  return { handle, warmUp, respond, understanding, insights, model: OLLAMA_MODEL };
}

export { createChatApi };
