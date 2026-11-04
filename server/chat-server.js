// Small chat API between the website and a local Ollama model. No dependencies (Node 18+).
//   POST /api/chat   { messages:[{ role:'user'|'assistant', content }] }  ->  streamed plain text
//   GET  /api/health ->  { ok, model }
// Settings come from .env (see .env.example): CHAT_MODEL, OLLAMA_URL, CHAT_PORT, CHAT_ORIGIN.
import { createServer } from 'node:http';
import { emergencyReply, systemPrompt } from './advisor-prompt.js';
import { analyse, routingNote } from './advisor-rules.js';
import { PRODUCTS } from '../src/data/products.js';

const MODEL = process.env.CHAT_MODEL || 'gemma2:9b';
const OLLAMA = (process.env.OLLAMA_URL || 'http://localhost:11434').replace(/\/$/, '');
const PORT = Number(process.env.CHAT_PORT || 8787);
const ORIGIN = process.env.CHAT_ORIGIN || '';      // set when the site is served from another domain
const MAX_TURNS = 12, MAX_CHARS = 1500;
const SYSTEM = systemPrompt();

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
    console.error('[chat]', err.message);
    res.end('\n\nSorry, I could not reach my thoughts just now. Please try again in a moment.');
  }
}

const server = createServer(async (req, res) => {
  if (ORIGIN){ res.setHeader('Access-Control-Allow-Origin', ORIGIN); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Vary', 'Origin'); }
  if (req.method === 'OPTIONS'){ res.writeHead(204); return res.end(); }
  const path = req.url.split('?')[0];
  if (req.method === 'POST' && path === '/api/chat') return chat(req, res);
  if (req.method === 'GET' && path === '/api/health'){ res.writeHead(200, { 'Content-Type':'application/json' }); return res.end(JSON.stringify({ ok:true, model:MODEL })); }
  res.writeHead(404); res.end();
});

server.listen(PORT, () => {
  console.log(`TranzLife chat API on http://localhost:${PORT}  (model ${MODEL} via ${OLLAMA})`);
  // load the model into memory now so the first visitor does not wait
  fetch(`${OLLAMA}/api/generate`, { method:'POST', body:JSON.stringify({ model:MODEL, keep_alive:'30m' }) })
    .then(r => console.log(r.ok ? 'model warmed up' : `could not load ${MODEL} (${r.status})`))
    .catch(() => console.warn(`Ollama is not reachable at ${OLLAMA}. Start it with: ollama serve`));
});
