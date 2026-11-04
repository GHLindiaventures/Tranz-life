// Tulsi chat API: sits between the website and a local Ollama model. No dependencies.
//   POST /api/chat   { messages:[{ role:'user'|'assistant', content }] }  ->  streamed plain text
//   GET  /api/health ->  { ok, model }
// Used in two places, so the chat is always part of the site:
//   - vite.config.js mounts it inside `npm run dev` and `npm run preview`
//   - server/index.js serves it next to the built site for `npm start`
import { emergencyReply, systemPrompt } from './advisor-prompt.js';
import { analyse, routingNote } from './advisor-rules.js';
import { fallbackReply, fixedReply, problems } from './reply-check.js';

const MAX_TURNS = 12, MAX_CHARS = 1500;

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

// env: an object with CHAT_MODEL, OLLAMA_URL, CHAT_ORIGIN (all optional)
function createChatApi(env = {}){
  const MODEL = env.CHAT_MODEL || 'gemma2:9b';
  const OLLAMA = (env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
  const ORIGIN = env.CHAT_ORIGIN || '';      // only when the site is served from another domain
  const SYSTEM = systemPrompt();

  async function generate(messages, temperature, signal){
    const limit = AbortSignal.timeout(45000);      // never leave a visitor waiting on a stuck model
    const r = await fetch(`${OLLAMA}/api/chat`, { method:'POST', signal:signal ? AbortSignal.any([signal, limit]) : limit, headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ model:MODEL, stream:false, keep_alive:'30m', messages,
        options:{ temperature, top_p:.9, repeat_penalty:1.1, num_ctx:4096, num_predict:350 } }) });
    if (!r.ok) throw new Error(`ollama ${r.status}`);
    return ((await r.json()).message?.content || '').trim();
  }

  // The whole safety pipeline. Returns { text, products, via } where via is
  // 'emergency' (fixed reply), 'model', 'retry' (model, second draft) or 'fallback' (fixed reply from approved tips).
  async function respond(msgs, signal){
    const urgent = emergencyReply(msgs[msgs.length - 1].content);
    if (urgent) return { text:urgent, products:[], via:'emergency', problems:[] };
    // code decides the kind of message, approved tips, products, warning signs and language; the model only writes the reply
    const a = analyse(msgs);
    const fixed = fixedReply(a);
    if (fixed) return { text:fixed, checked:fixed, products:a.products, via:'fixed', problems:[], analysis:a };
    const convo = [{ role:'system', content:SYSTEM }, ...msgs.slice(0, -1), { role:'system', content:routingNote(a) }, msgs[msgs.length - 1]];
    let text = await generate(convo, .5, signal), found = problems(text, a), via = 'model';
    const first = found;
    if (found.length){
      // second draft, told exactly what was wrong
      const fix = { role:'system', content:`Your previous draft broke these rules: ${found.join('; ')}. Write the reply again. Follow the routing note exactly, use only the approved tips, and fix every problem listed.` };
      text = await generate([...convo, { role:'assistant', content:text }, fix], .2, signal); found = problems(text, a); via = 'retry';
    }
    if (found.length){ text = fallbackReply(a); via = 'fallback'; }
    const checked = text;
    // fixed sentences (e.g. "I can't advise on ashwagandha or doses") go first, written by code, not the model
    if (a.prefix.length) text = `${a.prefix.join(' ')}\n\n${text}`;
    return { text, checked, products:a.products, via, problems:first, analysis:a };
  }

  async function chat(req, res){
    let msgs;
    try { msgs = cleanHistory((await readJson(req)).messages); } catch(e){ msgs = null; }
    if (!msgs){ res.writeHead(400, { 'Content-Type':'application/json' }); return res.end('{"error":"bad request"}'); }
    const ctrl = new AbortController();
    res.on('close', () => { if (!res.writableEnded) ctrl.abort(); });
    try {
      const out = await respond(msgs, ctrl.signal);
      if (out.via !== 'model') console.log(`[tulsi] ${out.via}${out.problems.length ? `: ${out.problems.join('; ')}` : ''}`);   // no message text is logged
      res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-cache',
        'X-Products':out.products.join(','), 'Access-Control-Expose-Headers':'X-Products' });
      res.end(out.text);
    } catch(err){
      if (ctrl.signal.aborted) return;
      console.error('[tulsi]', err.message);
      res.writeHead(503, { 'Content-Type':'text/plain; charset=utf-8' });
      res.end('unavailable');
    }
  }

  // connect-style middleware: handles /api/chat and /api/health, passes anything else to next()
  function handle(req, res, next = () => { res.writeHead(404); res.end(); }){
    const path = req.url.split('?')[0];
    if (!path.startsWith('/api/')) return next();
    if (ORIGIN){ res.setHeader('Access-Control-Allow-Origin', ORIGIN); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Vary', 'Origin'); }
    if (req.method === 'OPTIONS'){ res.writeHead(204); return res.end(); }
    if (req.method === 'POST' && path === '/api/chat') return chat(req, res);
    if (req.method === 'GET' && path === '/api/health'){ res.writeHead(200, { 'Content-Type':'application/json' }); return res.end(JSON.stringify({ ok:true, model:MODEL })); }
    next();
  }

  // load the model into memory so the first visitor does not wait
  function warmUp(log = console){
    fetch(`${OLLAMA}/api/generate`, { method:'POST', body:JSON.stringify({ model:MODEL, keep_alive:'30m' }) })
      .then(r => r.ok ? log.info(`  Tulsi chat ready (${MODEL})`) : log.warn(`  Tulsi chat: could not load ${MODEL}. Run: ollama pull ${MODEL}`))
      .catch(() => log.warn(`  Tulsi chat: Ollama is not running at ${OLLAMA}. Start the Ollama app or run: ollama serve`));
  }

  return { handle, warmUp, respond, model:MODEL };
}

export { createChatApi };
