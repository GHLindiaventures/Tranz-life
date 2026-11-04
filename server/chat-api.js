// Tulsi chat API: sits between the website and a local Ollama model. No dependencies.
//   POST /api/chat   { messages:[{ role:'user'|'assistant', content }] }  ->  streamed plain text
//   GET  /api/health ->  { ok, model }
// Used in two places, so the chat is always part of the site:
//   - vite.config.js mounts it inside `npm run dev` and `npm run preview`
//   - server/index.js serves it next to the built site for `npm start`
import { emergencyReply, systemPrompt } from './advisor-prompt.js';
import { analyse, routingNote } from './advisor-rules.js';
import { PRODUCTS } from '../src/data/products.js';

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

  async function chat(req, res){
    let msgs;
    try { msgs = cleanHistory((await readJson(req)).messages); } catch(e){ msgs = null; }
    if (!msgs){ res.writeHead(400, { 'Content-Type':'application/json' }); return res.end('{"error":"bad request"}'); }

    const last = msgs[msgs.length - 1].content;
    const urgent = emergencyReply(last);
    if (urgent){ res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8' }); return res.end(urgent); }
    // code decides the product, warning signs and language; the model only writes the reply
    const a = analyse(last);
    const convo = [{ role:'system', content:SYSTEM }, ...msgs.slice(0, -1), { role:'system', content:routingNote(a, PRODUCTS) }, msgs[msgs.length - 1]];
    res.writeHead(200, { 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-cache', 'X-Accel-Buffering':'no',
      'X-Products':a.products.join(','), 'Access-Control-Expose-Headers':'X-Products' });

    const ctrl = new AbortController();
    res.on('close', () => { if (!res.writableEnded) ctrl.abort(); });
    try {
      const up = await fetch(`${OLLAMA}/api/chat`, { method:'POST', signal:ctrl.signal, headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ model:MODEL, stream:true, keep_alive:'30m', messages:convo,
          options:{ temperature:.6, top_p:.9, repeat_penalty:1.1, num_ctx:4096, num_predict:400 } }) });
      if (!up.ok || !up.body) throw new Error(`ollama ${up.status}`);
      const dec = new TextDecoder(); let buf = '';
      for await (const chunk of up.body){
        buf += dec.decode(chunk, { stream:true });
        let nl; while ((nl = buf.indexOf('\n')) >= 0){
          const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1); if (!line) continue;
          const j = JSON.parse(line); if (j.message?.content) res.write(j.message.content);
        }
      }
      res.end();
    } catch(err){
      if (ctrl.signal.aborted) return;
      console.error('[tulsi]', err.message);
      res.end('\n\nSorry, I could not reach my thoughts just now. Please try again in a moment.');
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

  return { handle, warmUp, model:MODEL };
}

export { createChatApi };
