// chat-api.js — Dual-engine chat API
//
// PRIMARY:  Gemini bot — completely standalone, uses its own system prompt from
//           gemini-bot/products.json, 4-key rotation. No Ollama files touched.
//
// FALLBACK: When ALL 4 Gemini keys hit their quota/rate-limit, the Ollama bot
//           takes over silently. It uses its own full pipeline (advisor-rules,
//           reply-check, wellness-tips, etc.). The user never sees an error.
//
// UI:       The existing Tulsi chat widget (src/features/chat/chat-widget.js)
//           is the only frontend for both engines.
//
//   POST /api/chat   { messages:[{role,content}] } → plain text
//   GET  /api/health → { ok, primaryEngine, ... }

import { readFileSync }   from 'node:fs';
import { fileURLToPath }  from 'node:url';
import { dirname, join }  from 'node:path';
import { GoogleGenAI }    from '@google/genai';

// ── Ollama-bot imports (used ONLY in the Ollama fallback path) ────────────────
import { emergencyReply, systemPrompt } from './advisor-prompt.js';
import { analyse, routingNote }         from './advisor-rules.js';
import { NEXT_LINE, fallbackReply, fixedReply, problems,
         productLead, productTail, replyActions, suggestChips } from './reply-check.js';
import { createUnderstanding } from './understand.js';
import { createInsights }      from './insights.js';

const MAX_TURNS = 12, MAX_CHARS = 1500;
const __dir = dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI ENGINE  — completely independent, identical to gemini-bot/server.js
//                 logic.  No advisor-rules, no reply-check, no wellness-tips.
// ═══════════════════════════════════════════════════════════════════════════════

function buildGeminiSystemPrompt(){
  // Uses gemini-bot/products.json — the same source as the standalone gemini-bot
  const data = JSON.parse(readFileSync(join(__dir, '../gemini-bot/products.json'), 'utf8'));
  return {
    system: `You are the TranzLife Assistant, the website chatbot for ${data.company.name}.
You help visitors learn about our 6 products and choose the right one.

ABSOLUTE RULES
1. Use ONLY the product data below. If something is not in it (exact quantities, price, shelf life, age limits, mechanism, licence, clinical evidence), say it is not confirmed yet and offer the contact details. Never guess or invent.
2. Do NOT claim any product diagnoses, treats, cures or prevents any disease. Never say a product detoxifies, regenerates or protects the liver, cures fatty liver, strengthens lungs, controls or lowers blood sugar, treats menstrual cramps, or has "no side effects" or is "safe for long-term use". Speak in wellness-support terms ("traditionally used for", "designed to support", "positioned for").
3. Never compare us against allopathic/other medicines or tell anyone to stop or replace medication.
4. For anyone with a medical condition (liver disease, diabetes, respiratory illness), pregnancy/breastfeeding, children, or on prescription medicines: give the label precautions and advise consulting a doctor first. For emergencies or severe symptoms (chest pain, trouble breathing, severe pain, bleeding), tell them to seek medical care immediately.
5. Doses: only quote the usage shown in the data, and say the final pack label is the authority.
6. Stay on topic (TranzLife and its products). Politely decline unrelated requests.
7. Prices: only quote a price if listed in the data, flagged as to be confirmed; otherwise direct to ${data.company.phone} or ${data.company.email}.

STYLE: warm, concise (under ~120 words unless asked for detail), plain language, short bullets only when listing. LANGUAGE: the default is ENGLISH. Reply in English, and greet in English ("Hello", never "Vanakkam"), unless the visitor's LATEST message is itself written in Tanglish or Tamil. A single greeting word such as "vanakkam" or "hi" is not enough to switch: answer that in English. Only when the latest message is a Tanglish sentence (Tamil words in English letters, e.g. "thala vali iruku edhavathu product iruka", "enaku romba tired ah iruku") reply in Tanglish: Tamil sentences written ONLY in English letters (no Tamil script), keeping product names and common English words as they are. Tamil script gets Tamil script. If the visitor switches back to English, switch back to English too. When helpful, recommend one product and say why, then offer a next step. Mention that information is for general wellness and not medical advice when health is discussed.

COMPANY: ${JSON.stringify(data.company)}

PRODUCT DATA (verified source of truth):
${JSON.stringify(data.products, null, 2)}`,
    phone: data.company.phone,
    email: data.company.email
  };
}

function isQuotaError(e){
  const m = `${e.status || ''} ${e.message || ''}`.toLowerCase();
  return m.includes('429') || m.includes('quota') || m.includes('resource_exhausted') ||
         m.includes('rate limit') || m.includes('503') || m.includes('404') ||
         m.includes('not found') || m.includes('not_found') || m.includes('unavailable');
}

function createGeminiEngine(env){
  const MODEL = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const rawKeys = (env.GEMINI_API_KEYS || env.GEMINI_API_KEY || '')
    .split(',').map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

  if (!rawKeys.length) return null;

  let { system: SYSTEM_PROMPT } = buildGeminiSystemPrompt();
  const clients = rawKeys.map(k => new GoogleGenAI({ apiKey: k }));
  let idx = 0;

  const label = () => `Key-${idx + 1}/${clients.length}(...${rawKeys[idx].slice(-6)})`;

  function rotate(){
    const prev = idx;
    idx = (idx + 1) % clients.length;
    console.warn(`[gemini] 🔄 Key-${prev + 1} → Key-${idx + 1}`);
    return idx !== prev;
  }

  // Send messages to Gemini. Returns the reply text or throws when all keys exhausted.
  // messages: [{role:'user'|'assistant', content}]  — no system roles, no routing notes
  async function generate(messages){
    // Gemini SDK wants role 'model' not 'assistant'; history must start with 'user'
    const contents = messages
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    while (contents.length && contents[0].role !== 'user') contents.shift();

    let lastErr;
    for (let attempt = 0; attempt < clients.length; attempt++){
      try {
        const r = await clients[idx].models.generateContent({
          model: MODEL,
          contents,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: 800,   // same as gemini-bot/server.js
            temperature: 0.4,
            ...(/2\.5-flash/.test(MODEL) ? { thinkingConfig: { thinkingBudget: 0 } } : {})
          }
        });
        const text = (r.text || '').trim();
        if (text) console.log(`[gemini] ✅ ${label()}`);
        return text;
      } catch(e){
        lastErr = e;
        console.warn(`[gemini] ⚠️  ${label()} error: ${e.status || ''} ${(e.message || '').slice(0, 80)}`);
        if (isQuotaError(e) && clients.length > 1){
          rotate();
        } else {
          throw e;    // non-quota error — do not rotate, let Ollama handle it
        }
      }
    }
    throw lastErr;    // all keys exhausted
  }

  return { generate, model: MODEL, keyCount: rawKeys.length };
}

// ═══════════════════════════════════════════════════════════════════════════════
// OLLAMA ENGINE  — the original Tulsi bot, unchanged.
//                 advisor-rules / reply-check / wellness-tips all live here.
// ═══════════════════════════════════════════════════════════════════════════════

function createOllamaEngine(env){
  const MODEL  = env.CHAT_MODEL  || 'gemma2:9b';
  const OLLAMA = (env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
  const SYSTEM = systemPrompt();   // advisor-prompt.js — Tulsi's personality

  const understanding = env.UNDERSTAND === 'off' ? null : createUnderstanding(env);

  const insights = createInsights(env, {
    generateLabel: prompt => fetch(`${OLLAMA}/api/generate`, {
      method: 'POST', signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ model: MODEL, prompt, stream: false,
        keep_alive: '30m', options: { temperature: 0, num_predict: 12 } })
    }).then(r => r.ok ? r.json() : null).then(j => j?.response || '')
  });

  async function generate(messages, temperature, signal){
    const limit = AbortSignal.timeout(45000);
    const r = await fetch(`${OLLAMA}/api/chat`, {
      method: 'POST',
      signal: signal ? AbortSignal.any([signal, limit]) : limit,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, stream: false, keep_alive: '30m', messages,
        options: { temperature, top_p: .9, repeat_penalty: 1.1, num_ctx: 4096, num_predict: 350 } })
    });
    if (!r.ok) throw new Error(`ollama ${r.status}`);
    return ((await r.json()).message?.content || '').trim();
  }

  // Full Ollama safety pipeline — advisor-rules → model → reply-check → fallback
  async function respond(msgs, signal){
    const urgent = emergencyReply(msgs[msgs.length - 1].content);
    if (urgent) return { text: urgent, products: [], via: 'emergency', problems: [] };

    const semantic = understanding ? await understanding.understandChat(msgs) : null;
    const a = analyse(msgs, { semantic });

    let fixed = a.modelWrite ? '' : fixedReply(a);
    if (fixed && a.askNext && !fixed.includes(NEXT_LINE)) fixed = `${fixed}\n\n${NEXT_LINE}`;
    if (fixed){
      if (a.mode === 'clarify') console.log(`[ollama] clarify (len ${msgs[msgs.length-1].content.length})`);
      return { text: fixed, checked: fixed, products: a.products, suggest: suggestChips(a),
               actions: replyActions(a), via: 'fixed', problems: [], analysis: a };
    }

    const earlier = a.keepHistory ? msgs.slice(-5, -1) : [];
    const convo = [{ role: 'system', content: SYSTEM }, ...earlier,
                   { role: 'system', content: routingNote(a) }, msgs[msgs.length - 1]];

    const draft = async (messages, temperature) => {
      try { return await generate(messages, temperature, signal); }
      catch(err){ if (signal?.aborted) throw err; console.log(`[ollama] model error: ${err.message}`); return null; }
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

  return { respond, understanding, insights, model: MODEL, ollama: OLLAMA };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function cleanHistory(raw){
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') &&
                 typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_TURNS);
  return msgs.length && msgs[msgs.length - 1].role === 'user' ? msgs : null;
}

function readJson(req){
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 64e3){ reject(new Error('too large')); req.destroy(); } });
    req.on('end',  () => { try { resolve(JSON.parse(body || '{}')); } catch(e){ reject(e); } });
    req.on('error', reject);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FACTORY  — wires the two engines together
// ═══════════════════════════════════════════════════════════════════════════════

function createChatApi(env = {}){
  const ORIGIN = env.CHAT_ORIGIN || '';

  // Primary: Gemini (standalone — own prompt, own keys)
  const gemini = createGeminiEngine(env);

  // Fallback: Ollama (own full pipeline — advisor-rules etc.)
  const ollama = createOllamaEngine(env);

  // ── Request handler ────────────────────────────────────────────────────────

  async function chat(req, res){
    let msgs;
    try { msgs = cleanHistory((await readJson(req)).messages); } catch(e){ msgs = null; }
    if (!msgs){
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end('{"error":"bad request"}');
    }

    const ctrl = new AbortController();
    res.on('close', () => { if (!res.writableEnded) ctrl.abort(); });

    // ── Try Gemini first (completely standalone) ─────────────────────────────
    if (gemini){
      try {
        const text = await gemini.generate(msgs);
        if (text){
          res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            // Gemini bot works standalone — no product cards / suggest chips
            'X-Products': '', 'X-Suggest': '', 'X-Actions': '',
            'Access-Control-Expose-Headers': 'X-Products, X-Suggest, X-Actions'
          });
          return res.end(text);
        }
        // empty reply → fall through to Ollama
        console.warn('[gemini] empty reply — falling back to ollama');
      } catch(e){
        if (ctrl.signal.aborted) return;
        // All 4 keys exhausted OR non-quota error → fall through to Ollama silently
        console.warn(`[gemini] all keys failed (${e.status || e.message?.slice(0, 60)}) — switching to ollama`);
      }
    }

    // ── Ollama fallback (full Tulsi pipeline) ────────────────────────────────
    try {
      const out = await ollama.respond(msgs, ctrl.signal);
      if (out.via !== 'model')
        console.log(`[ollama] ${out.via}${out.problems?.length ? `: ${out.problems.join('; ')}` : ''}`);
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache',
        'X-Products': out.products.join(','),
        'X-Suggest':  (out.suggest  || []).join('|'),
        'X-Actions':  (out.actions  || []).join(','),
        'Access-Control-Expose-Headers': 'X-Products, X-Suggest, X-Actions'
      });
      res.end(out.text);
      ollama.insights.record(out.analysis, msgs[msgs.length - 1].content,
        { via: out.via, emergency: out.via === 'emergency',
          first: msgs.filter(m => m.role === 'user').length === 1 });
    } catch(err){
      if (ctrl.signal.aborted) return;
      console.error('[chat]', err.message);
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('unavailable');
    }
  }

  // ── Middleware ─────────────────────────────────────────────────────────────

  function handle(req, res, next = () => { res.writeHead(404); res.end(); }){
    const path = req.url.split('?')[0];
    if (!path.startsWith('/api/')) return next();
    if (ORIGIN){
      res.setHeader('Access-Control-Allow-Origin', ORIGIN);
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS'){ res.writeHead(204); return res.end(); }
    if (req.method === 'POST' && path === '/api/chat')   return chat(req, res);
    if (req.method === 'POST' && path === '/api/insight'){
      readJson(req).then(b => ollama.insights.enquire(String(b.enquire || ''))).catch(() => {});
      res.writeHead(204); return res.end();
    }
    if (req.method === 'GET' && path === '/api/health'){
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        ok: true,
        primaryEngine:  gemini ? 'gemini' : 'ollama',
        geminiModel:    gemini?.model  ?? null,
        geminiKeys:     gemini?.keyCount ?? 0,
        ollamaModel:    ollama.model,
        fallbackEngine: 'ollama'
      }));
    }
    next();
  }

  // ── Warm-up at server start ────────────────────────────────────────────────

  function warmUp(log = console){
    if (gemini){
      log.info(`  Primary engine : Gemini ${gemini.model} (${gemini.keyCount} key(s), auto-rotate)`);
    } else {
      log.info(`  Primary engine : Ollama only (no GEMINI_API_KEYS configured)`);
    }

    // Warm the Ollama model so it's ready if Gemini keys ever run out
    fetch(`${ollama.ollama}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({ model: ollama.model, keep_alive: '30m' })
    })
    .then(r => r.ok
      ? log.info(`  Fallback engine: Ollama ${ollama.model} ready`)
      : log.warn(`  Fallback engine: Ollama ${ollama.model} not found — run: ollama pull ${ollama.model}`))
    .catch(() => log.warn(`  Fallback engine: Ollama not running — run: ollama serve`));

    // Semantic embedding layer (Ollama-side, background)
    ollama.understanding?.init()
      .then(() => log.info('  Ollama understanding layer ready'))
      .catch(() => log.warn(`  Ollama understanding layer off — run: ollama pull ${env.EMBED_MODEL || 'bge-m3'}`));
  }

  return { handle, warmUp, respond: ollama.respond, understanding: ollama.understanding,
           insights: ollama.insights, model: ollama.model };
}

export { createChatApi };
