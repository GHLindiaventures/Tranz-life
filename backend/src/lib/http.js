// Express middleware used on every request, plus small request helpers.
import { createHash, timingSafeEqual } from 'node:crypto';
import { OrderError } from './shared.js';
import { HttpError, tooMany } from './errors.js';

// no caching of API answers, no MIME sniffing, no referrer leaking order numbers
function securityHeaders(req, res, next){
  res.set({ 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer' });
  next();
}

// lets the website call the API from another domain (only when ALLOWED_ORIGIN is set), with its login cookie
function allowOrigin(origin){
  return (req, res, next) => {
    if (origin && req.get('origin') === origin){
      res.set({ 'Access-Control-Allow-Origin':origin, 'Access-Control-Allow-Credentials':'true', 'Vary':'Origin',
        'Access-Control-Allow-Methods':'GET, POST, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' });
    }
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  };
}

// turns any error into { code, error } with the right status; unexpected ones are logged and kept vague
function errorHandler(log){
  return (err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err instanceof HttpError) return res.status(err.status).json({ code:err.code, error:err.message, ...(err.field ? { field:err.field } : {}) });
    if (err instanceof OrderError) return res.status(400).json({ code:'invalid', error:err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ code:'invalid', error:'The request was not valid JSON.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ code:'too_large', error:'Request too large.' });
    log.error('[api]', err);
    res.status(500).json({ code:'server', error:'Something went wrong on our side. Please try again.' });
  };
}

// a cookie the browser sent
function readCookie(req, name){
  for (const part of String(req.get('cookie') || '').split(';')){
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

// at most `limit` calls per key (an IP address) per `windowMs`, counted in this process
function rateLimit(limit, windowMs, message){
  const hits = new Map();
  return key => {
    const now = Date.now(), h = hits.get(key);
    if (!h || now - h.start > windowMs){ hits.set(key, { start:now, n:1 }); if (hits.size > 5000) hits.clear(); return; }
    if (++h.n > limit) throw tooMany(message);
  };
}

// compares two secrets in constant time (hashing first makes the lengths equal)
const sameSecret = (a, b) => timingSafeEqual(createHash('sha256').update(String(a)).digest(), createHash('sha256').update(String(b)).digest());

export { securityHeaders, allowOrigin, errorHandler, readCookie, rateLimit, sameSecret };
