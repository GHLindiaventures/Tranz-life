// The admin page and what it calls (password: ADMIN_PASSWORD).
//   GET  /api/admin                          the admin page
//   POST /api/admin/login                    { password } -> { token, expiresAt }
//   POST /api/admin/logout
//   GET  /api/admin/orders?status=…          verifying | awaiting_payment | paid | rejected | all -> { orders, counts }
//   POST /api/admin/orders/:ref/confirm      { utr? }   (utr is needed when the customer never sent one)
//   POST /api/admin/orders/:ref/reject       { reason } (shown to the customer)
//   POST /api/admin/orders/:ref/delivery     { step: packed | shipped | out_for_delivery | delivered }
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Router } from 'express';
import { badRequest, unauthorized, unavailable } from '../../lib/errors.js';
import { rateLimit, sameSecret } from '../../lib/http.js';
import { requireAdmin } from '../auth/auth.middleware.js';
import { endSession, startSession } from '../auth/sessions.js';

const STATUSES = ['awaiting_payment', 'verifying', 'paid', 'rejected', 'all'];
const PAGE = readFileSync(new URL('./admin.html', import.meta.url), 'utf8');

// the page, locked down: only its own inline script and styles (nonce), and calls back to this server
function sendPage(res){
  const nonce = randomBytes(16).toString('base64');
  res.set({
    'Content-Type':'text/html; charset=utf-8', 'X-Frame-Options':'DENY',
    'Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`
  });
  res.send(PAGE.replaceAll('__NONCE__', nonce));
}

function adminRoutes({ db, orders, adminPassword, log = console }){
  const r = Router();
  const limitLogin = rateLimit(10, 15 * 60e3, 'Too many sign-in attempts. Wait 15 minutes and try again.');
  const signedIn = requireAdmin(db);

  r.get('/admin', (req, res) => sendPage(res));

  r.post('/admin/login', async (req, res) => {
    if (!adminPassword) throw unavailable('The admin page is not set up: set ADMIN_PASSWORD on the server.');
    limitLogin(req.ip);
    if (!sameSecret(req.body.password ?? '', adminPassword)){
      log.warn(`[admin] wrong password from ${req.ip}`);
      throw unauthorized('Wrong password.');
    }
    const { token, maxAgeMs } = await startSession(db, 'admin');
    res.json({ token, expiresAt:Date.now() + maxAgeMs });
  });

  r.post('/admin/logout', signedIn, async (req, res) => {
    await endSession(db, req.adminToken);
    res.json({ ok:true });
  });

  r.get('/admin/orders', signedIn, async (req, res) => {
    const status = req.query.status || 'verifying';
    if (!STATUSES.includes(status)) throw badRequest('Unknown status.');
    res.json(await orders.listForAdmin(status));
  });

  r.post('/admin/orders/:ref/confirm', signedIn, async (req, res) => {
    res.json(await orders.confirmPayment(req.params.ref, req.body.utr));
  });

  r.post('/admin/orders/:ref/reject', signedIn, async (req, res) => {
    res.json(await orders.rejectPayment(req.params.ref, req.body.reason));
  });

  r.post('/admin/orders/:ref/delivery', signedIn, async (req, res) => {
    res.json(await orders.moveDelivery(req.params.ref, String(req.body.step ?? '')));
  });

  return r;
}

export { adminRoutes };
