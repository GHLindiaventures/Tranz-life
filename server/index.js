// Production server: the built website (dist/) and the Tulsi chat API from one process.
//   npm run build && npm start      ->  http://localhost:3000
// Settings come from .env (see .env.example): PORT, CHAT_MODEL, OLLAMA_URL.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createChatApi } from './chat-api.js';

const ROOT = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const PORT = Number(process.env.PORT || 3000);
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.ico':'image/x-icon', '.woff2':'font/woff2', '.txt':'text/plain; charset=utf-8' };

if (!existsSync(join(ROOT, 'index.html'))){ console.error('dist/ not found. Run `npm run build` first.'); process.exit(1); }

const api = createChatApi(process.env);

function serveFile(req, res){
  let path;
  try { path = decodeURIComponent(req.url.split('?')[0]); } catch(e){ res.writeHead(400); return res.end(); }
  let file = normalize(join(ROOT, path));
  if (file !== ROOT && !file.startsWith(ROOT + sep)){ res.writeHead(403); return res.end(); }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'index.html');
  const hashed = file.includes(`${sep}assets${sep}`);
  res.writeHead(200, { 'Content-Type':TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
    'Cache-Control':hashed ? 'public, max-age=31536000, immutable' : 'no-cache', 'X-Content-Type-Options':'nosniff' });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

createServer((req, res) => api.handle(req, res, () => {
  if (req.method !== 'GET' && req.method !== 'HEAD'){ res.writeHead(405); return res.end(); }
  serveFile(req, res);
})).listen(PORT, () => {
  console.log(`TranzLife site + Tulsi chat on http://localhost:${PORT}`);
  api.warmUp();
});
