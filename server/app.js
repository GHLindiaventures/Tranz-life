// Payment API for the checkout. Two ways to pay:
//   UPI app (Google Pay, PhonePe, Paytm, BHIM) through Razorpay. Razorpay reports the payment (signed checkout response,
//     signed webhook, and the server asking Razorpay), so the order becomes paid by itself. The customer types nothing.
//   QR code to TranzLife's own UPI ID. Nothing reports these payments, so the customer sends the UTR (the 12-digit UPI
//     reference number), and you check it in your bank app and confirm it on the admin page.
// Prices are worked out here from the catalogue, never taken from the browser.
//
// Customer
//   POST /api/orders                      { items:[{ id, qty }], customer } -> order number, totals, Razorpay order and/or UPI QR details
//   GET  /api/orders/:ref                 -> { ref, status, total, utr, reason, paymentId }
//   POST /api/orders/:ref/razorpay        { paymentId, signature } -> checks the payment with Razorpay, status "paid" when it went through
//   POST /api/orders/:ref/utr             { utr } -> status "verifying"   (QR code payments)
// Razorpay
//   POST /api/webhooks/razorpay           payment.captured / order.paid, signed with RAZORPAY_WEBHOOK_SECRET
// Admin (password: ADMIN_PASSWORD)
//   GET  /api/admin                       the admin page
//   POST /api/admin/login                 { password } -> { token, expiresAt }
//   POST /api/admin/logout
//   GET  /api/admin/orders?status=…       verifying | awaiting_payment | paid | rejected | all
//   POST /api/admin/orders/:ref/confirm   { utr? }   (utr is needed when the customer never sent one)
//   POST /api/admin/orders/:ref/reject    { reason }
//   GET  /api/health
//
// Order status: awaiting_payment -> paid                                     (UPI app, confirmed by Razorpay)
//               awaiting_payment -> verifying (UTR sent) -> paid             (QR code, confirmed by you)
//                                                        -> rejected (the reason is shown to the customer, who can send a corrected UTR)
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { OrderError, orderRef, priceOrder, REF_PATTERN, toPaise } from '../src/utils/order.js';
import { checkCustomer, normaliseUtr, upiUri } from '../src/utils/payment.js';

const MAX_BODY = 64 * 1024;
const SESSION_MS = 12 * 3600e3;
const STATUSES = ['awaiting_payment', 'verifying', 'paid', 'rejected'];
const UTR_HELP = 'Enter the 12-digit UTR (UPI reference number) from your UPI app.';
const PAYMENT_ID = /^pay_[A-Za-z0-9]{6,40}$/;
const SYNC_EVERY_MS = 8000;           // ask Razorpay about one order at most this often
const ADMIN_SYNC_DAYS = 2;            // the admin page also checks unpaid UPI-app orders this recent

class HttpError extends Error {
  constructor(status, code, message){ super(message); this.status = status; this.code = code; }
}

const HEADERS = { 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer' };

function send(res, status, body){
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', ...HEADERS });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

// the admin page, locked down: only its own inline script and styles (nonce) and calls back to this server
function sendPage(res, html){
  const nonce = randomBytes(16).toString('base64');
  res.writeHead(200, {
    'Content-Type':'text/html; charset=utf-8', ...HEADERS, 'X-Frame-Options':'DENY',
    'Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`
  });
  res.end(html.replaceAll('__NONCE__', nonce));
}

// the request body as bytes (webhook signatures are checked over the exact bytes Razorpay sent)
function readRaw(req){
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY){ reject(new HttpError(413, 'too_large', 'Request too large.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
const readBody = async req => (await readRaw(req)).toString('utf8');

function parseJson(raw){
  if (!raw) return {};
  try { return JSON.parse(raw); } catch(err){ throw new HttpError(400, 'invalid', 'The request was not valid JSON.'); }
}

// at most `limit` requests per key (IP address) per `windowMs`
function rateLimiter(limit, windowMs){
  const hits = new Map();
  return key => {
    const now = Date.now(), h = hits.get(key);
    if (!h || now - h.start > windowMs){ hits.set(key, { start:now, n:1 }); if (hits.size > 5000) hits.clear(); return true; }
    return ++h.n <= limit;
  };
}

// compares secrets in constant time (hashing first makes the lengths equal)
const sameSecret = (a, b) => timingSafeEqual(createHash('sha256').update(String(a)).digest(), createHash('sha256').update(String(b)).digest());

// what the customer's browser may see: no address or contact details
const publicStatus = o => ({
  ref:o.ref, status:o.status, total:o.total, utr:o.utr || o.payment?.rrn || null,
  reason:o.status === 'rejected' ? o.rejectedReason : null, paymentId:o.payment?.id || null
});

function createApp({ store, upiId = '', payeeName = 'TranzLife Biosciences', razorpay = null, adminPassword = '', adminPage = '', allowedOrigin = '', trustProxy = false, log = console }){
  const orderLimit = rateLimiter(30, 60e3), utrLimit = rateLimiter(10, 60e3), payLimit = rateLimiter(30, 60e3), loginLimit = rateLimiter(10, 15 * 60e3);
  const sessions = new Map(), lastSync = new Map();
  const ipOf = req => (trustProxy && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || 'unknown';
  const now = () => new Date().toISOString();

  // a UTR can only belong to one order that is being checked or is paid
  const utrTaken = (utr, ref) => store.find(o => o.ref !== ref && o.utr === utr && (o.status === 'verifying' || o.status === 'paid'));

  // ---------- customer ----------
  async function createOrder(body){
    if (!upiId && !razorpay) throw new HttpError(503, 'unavailable', 'Payments are not set up yet. Please try again later.');
    const priced = priceOrder(Array.isArray(body.items) ? body.items : []);
    const { customer, errors } = checkCustomer(body.customer || {});
    if (errors) throw new HttpError(400, 'invalid', Object.values(errors)[0]);
    const ref = orderRef(new Date(), randomBytes(8));

    // UPI app payments: a Razorpay order for the exact amount, so Razorpay can tell us when it is paid
    let rzOrderId = null;
    if (razorpay){
      try { rzOrderId = (await razorpay.createOrder({ amount:toPaise(priced.total), receipt:ref, notes:{ ref } })).id; }
      catch(err){
        log.error(`[razorpay] Could not create a Razorpay order for ${ref}: ${err.message}`);
        if (!upiId) throw new HttpError(503, 'unavailable', 'Payments are not available right now. Please try again in a few minutes.');
      }
    }
    // QR code payments: the order number goes in the payment note, so it shows next to the payment in your bank app
    const upi = upiId ? { id:upiId, name:payeeName, uri:upiUri({ vpa:upiId, name:payeeName, amount:priced.total, note:ref }) } : null;

    store.put({
      ref, status:'awaiting_payment', createdAt:now(), customer,
      items:priced.items, subtotal:priced.subtotal, shipping:priced.shipping, total:priced.total, currency:priced.currency, upi,
      razorpay:rzOrderId ? { orderId:rzOrderId } : null, payment:null, extraPayments:[],
      utr:null, utrSubmittedAt:null, utrHistory:[], paidAt:null, rejectedReason:null, reviewedAt:null
    });
    log.info(`[orders] ${ref} created: ₹${priced.total} for ${customer.name}`);
    return {
      ref, items:priced.items, subtotal:priced.subtotal, shipping:priced.shipping, total:priced.total, currency:priced.currency,
      ...(upi ? { upi } : {}),
      ...(rzOrderId ? { razorpay:{ keyId:razorpay.keyId, orderId:rzOrderId, amount:toPaise(priced.total), currency:'INR', name:payeeName } } : {})
    };
  }

  function submitUtr(order, body){
    if (order.status === 'paid') throw new HttpError(409, 'paid', 'This order is already paid.');
    const utr = normaliseUtr(body.utr);
    if (!utr) throw new HttpError(400, 'invalid', UTR_HELP);
    if (order.utrHistory.some(h => h.utr === utr && h.result === 'rejected')) throw new HttpError(409, 'rejected_utr', 'This UTR was checked and not accepted. Check the number in your UPI app, or contact us with your order number.');
    if (utrTaken(utr, order.ref)) throw new HttpError(409, 'utr_used', 'This UTR is already used for another order. Check the number in your UPI app.');
    Object.assign(order, { utr, utrSubmittedAt:now(), status:'verifying', rejectedReason:null });
    order.utrHistory.push({ utr, at:order.utrSubmittedAt, result:'submitted' });
    store.put(order);
    log.info(`[orders] ${order.ref}: UTR ${utr} sent for ₹${order.total}. Check it in your bank app, then confirm it on the admin page.`);
    return publicStatus(order);
  }

  // ---------- Razorpay (UPI app payments) ----------
  // Marks the order paid from a Razorpay payment, once it is captured, for this order and for the full amount.
  // Safe to call any number of times with the same payment (checkout response, webhook and status checks all land here).
  function applyRazorpayPayment(order, p, source){
    if (!p || !order.razorpay || p.order_id !== order.razorpay.orderId) return false;
    if (p.status !== 'captured') return false;
    if (p.amount !== toPaise(order.total) || p.currency !== 'INR'){
      log.error(`[razorpay] ${order.ref}: payment ${p.id} is for ${p.currency} ${p.amount / 100}, not ₹${order.total}. Not marked paid; check it in the Razorpay dashboard.`);
      return false;
    }
    const payment = { id:p.id, method:p.method || 'upi', vpa:p.vpa || null, rrn:p.acquirer_data?.rrn || null, at:now(), source };
    if (order.status === 'paid'){
      if (order.payment?.id === p.id || order.extraPayments?.some(x => x.id === p.id)) return true;
      order.extraPayments = [...(order.extraPayments || []), payment];
      store.put(order);
      log.warn(`[razorpay] ${order.ref} was already paid, and Razorpay payment ${p.id} paid ₹${order.total} again. Refund it from the Razorpay dashboard.`);
      return true;
    }
    if (order.status === 'verifying') log.warn(`[razorpay] ${order.ref}: paid by UPI app after UTR ${order.utr} was sent for the QR code. Check whether the customer paid twice.`);
    Object.assign(order, { status:'paid', paidAt:now(), payment, rejectedReason:null });
    store.put(order);
    log.info(`[orders] ${order.ref} paid by UPI app: ₹${order.total}, Razorpay ${p.id}${payment.rrn ? `, UTR ${payment.rrn}` : ''} (${source})`);
    return true;
  }

  // asks Razorpay for the order's payments (when the webhook has not arrived, or is not set up)
  async function syncRazorpay(order, everyMs = SYNC_EVERY_MS){
    if (!razorpay || !order.razorpay || order.status === 'paid') return;
    const last = lastSync.get(order.ref) || 0;
    if (Date.now() - last < everyMs) return;
    lastSync.set(order.ref, Date.now());
    if (lastSync.size > 5000) lastSync.clear();
    for (const p of await razorpay.orderPayments(order.razorpay.orderId)) if (applyRazorpayPayment(order, p, 'check')) break;
  }
  const trySync = (order, everyMs) => syncRazorpay(order, everyMs).catch(err => log.error(`[razorpay] ${order.ref}: ${err.message}`));

  // the browser's checkout says a payment went through: check its signature, then ask Razorpay for the payment
  async function confirmRazorpay(order, body){
    if (!razorpay || !order.razorpay) throw new HttpError(409, 'state', 'This order is not paid through a UPI app.');
    const paymentId = String(body.paymentId ?? '');
    if (!PAYMENT_ID.test(paymentId)) throw new HttpError(400, 'invalid', 'Missing payment details.');
    if (body.signature && !razorpay.validPaymentSignature({ orderId:order.razorpay.orderId, paymentId, signature:String(body.signature) })){
      log.warn(`[razorpay] ${order.ref}: a payment signature for ${paymentId} did not match`);
      throw new HttpError(400, 'bad_signature', 'We could not verify this payment. If money left your account, contact us with your order number.');
    }
    await trySync(order, 0);
    return publicStatus(order);
  }

  async function razorpayWebhook(req, res){
    if (!razorpay?.webhooks) throw new HttpError(404, 'not_found', 'Not found.');
    const raw = await readRaw(req);
    if (!razorpay.validWebhook(raw, req.headers['x-razorpay-signature'])){
      log.warn(`[razorpay] Webhook with a bad signature from ${ipOf(req)}`);
      throw new HttpError(400, 'bad_signature', 'Bad signature.');
    }
    const event = parseJson(raw.toString('utf8'));
    const p = event.payload?.payment?.entity;
    if ((event.event === 'payment.captured' || event.event === 'order.paid') && p?.order_id){
      const order = store.find(o => o.razorpay?.orderId === p.order_id);
      if (order) applyRazorpayPayment(order, p, 'webhook');
      else log.warn(`[razorpay] Webhook ${event.event} for ${p.order_id}, which matches no order here`);
    } else if (event.event === 'payment.failed' && p){
      log.info(`[razorpay] Payment ${p.id} for ${p.order_id} failed: ${p.error_description || p.error_reason || 'no reason given'}`);
    }
    return send(res, 200, { ok:true });
  }

  // ---------- admin ----------
  function login(req, body){
    if (!adminPassword) throw new HttpError(503, 'unavailable', 'The admin page is not set up: set ADMIN_PASSWORD on the server.');
    if (!loginLimit(ipOf(req))) throw new HttpError(429, 'busy', 'Too many sign-in attempts. Wait 15 minutes and try again.');
    if (!sameSecret(body.password ?? '', adminPassword)){
      log.warn(`[admin] Wrong password from ${ipOf(req)}`);
      throw new HttpError(401, 'auth', 'Wrong password.');
    }
    const token = randomBytes(32).toString('hex'), expiresAt = Date.now() + SESSION_MS;
    sessions.set(token, expiresAt);
    for (const [t, exp] of sessions) if (exp < Date.now()) sessions.delete(t);
    return { token, expiresAt };
  }

  function requireAdmin(req){
    const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
    const exp = m && sessions.get(m[1]);
    if (!exp || exp < Date.now()){ if (m) sessions.delete(m[1]); throw new HttpError(401, 'auth', 'Please sign in again.'); }
    return m[1];
  }

  async function listOrders(status){
    // unpaid UPI-app orders from the last two days: ask Razorpay, in case a payment's webhook never arrived
    const since = new Date(Date.now() - ADMIN_SYNC_DAYS * 86400e3).toISOString();
    const recent = store.all().filter(o => o.razorpay && o.status === 'awaiting_payment' && o.createdAt >= since).slice(-25);
    await Promise.all(recent.map(o => trySync(o, 60e3)));

    const all = store.all();
    const counts = Object.fromEntries(STATUSES.map(s => [s, all.filter(o => o.status === s).length]));
    const orders = all.filter(o => status === 'all' || o.status === status)
      .sort((a, b) => (b.utrSubmittedAt || b.paidAt || b.createdAt).localeCompare(a.utrSubmittedAt || a.paidAt || a.createdAt))
      .slice(0, 300);
    return { orders, counts };
  }

  function confirmOrder(order, body){
    if (order.status === 'paid') return order;
    let utr = order.utr;
    if (body.utr){
      utr = normaliseUtr(body.utr);
      if (!utr) throw new HttpError(400, 'invalid', 'A UTR has 12 digits.');
    }
    if (!utr) throw new HttpError(400, 'invalid', 'Enter the UTR you found in your bank app for this payment.');
    if (utrTaken(utr, order.ref)) throw new HttpError(409, 'utr_used', `UTR ${utr} is already on another order.`);
    Object.assign(order, { utr, status:'paid', paidAt:now(), reviewedAt:now(), rejectedReason:null });
    order.utrHistory.push({ utr, at:order.paidAt, result:'confirmed' });
    store.put(order);
    log.info(`[orders] ${order.ref} confirmed as paid (UTR ${utr}, ₹${order.total})`);
    return order;
  }

  function rejectOrder(order, body){
    if (order.status !== 'verifying') throw new HttpError(409, 'state', 'Only orders waiting for a check can be rejected.');
    const reason = String(body.reason ?? '').trim().replace(/\s+/g, ' ').slice(0, 200) || 'We could not find this payment in our bank account.';
    Object.assign(order, { status:'rejected', rejectedReason:reason, reviewedAt:now() });
    order.utrHistory.push({ utr:order.utr, at:order.reviewedAt, result:'rejected', reason });
    store.put(order);
    log.info(`[orders] ${order.ref} rejected (UTR ${order.utr}): ${reason}`);
    return order;
  }

  async function adminRoute(req, res, path, url){
    if (req.method === 'POST' && path === '/api/admin/login') return send(res, 200, login(req, parseJson(await readBody(req))));
    const token = requireAdmin(req);
    if (req.method === 'POST' && path === '/api/admin/logout'){ sessions.delete(token); return send(res, 200, { ok:true }); }
    if (req.method === 'GET' && path === '/api/admin/orders'){
      const status = url.searchParams.get('status') || 'verifying';
      if (status !== 'all' && !STATUSES.includes(status)) throw new HttpError(400, 'invalid', 'Unknown status.');
      return send(res, 200, await listOrders(status));
    }
    const m = path.match(/^\/api\/admin\/orders\/([^/]+)\/(confirm|reject)$/);
    if (req.method !== 'POST' || !m || !REF_PATTERN.test(m[1])) return send(res, 404, { code:'not_found', error:'Not found.' });
    const order = store.get(m[1]);
    if (!order) throw new HttpError(404, 'not_found', 'Order not found.');
    const body = parseJson(await readBody(req));
    return send(res, 200, m[2] === 'confirm' ? confirmOrder(order, body) : rejectOrder(order, body));
  }

  return async function handle(req, res){
    const origin = req.headers.origin;
    if (allowedOrigin && origin === allowedOrigin){
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    try {
      const url = new URL(req.url, 'http://localhost'), path = url.pathname.replace(/\/+$/, '');
      if (req.method === 'OPTIONS') return send(res, 204);
      if (req.method === 'GET' && path === '/api/health') return send(res, 200, { ok:true, payments:!!(upiId || razorpay), upiApps:!!razorpay, qr:!!upiId, admin:!!adminPassword });
      if (req.method === 'GET' && path === '/api/admin') return sendPage(res, adminPage);
      if (req.method === 'POST' && !String(req.headers['content-type'] || '').includes('application/json')) throw new HttpError(415, 'invalid', 'Send JSON.');
      if (req.method === 'POST' && path === '/api/webhooks/razorpay') return await razorpayWebhook(req, res);
      if (path.startsWith('/api/admin/')) return await adminRoute(req, res, path, url);

      if (req.method === 'POST' && path === '/api/orders'){
        if (!orderLimit(ipOf(req))) throw new HttpError(429, 'busy', 'Too many attempts. Please wait a minute and try again.');
        return send(res, 201, await createOrder(parseJson(await readBody(req))));
      }
      const m = path.match(/^\/api\/orders\/([^/]+)(?:\/(utr|razorpay))?$/);
      if (!m || !REF_PATTERN.test(m[1])) return send(res, 404, { code:'not_found', error:'Not found.' });
      const order = store.get(m[1]);
      if (!order) throw new HttpError(404, 'not_found', 'We could not find that order.');
      if (req.method === 'GET' && !m[2]){
        if (order.status === 'awaiting_payment') await trySync(order);
        return send(res, 200, publicStatus(order));
      }
      if (req.method === 'POST' && m[2] === 'utr'){
        if (!utrLimit(ipOf(req))) throw new HttpError(429, 'busy', 'Too many attempts. Please wait a minute and try again.');
        return send(res, 200, submitUtr(order, parseJson(await readBody(req))));
      }
      if (req.method === 'POST' && m[2] === 'razorpay'){
        if (!payLimit(ipOf(req))) throw new HttpError(429, 'busy', 'Too many attempts. Please wait a minute and try again.');
        return send(res, 200, await confirmRazorpay(order, parseJson(await readBody(req))));
      }
      return send(res, 405, { code:'method', error:'Method not allowed.' });
    } catch(err){
      if (err instanceof HttpError) return send(res, err.status, { code:err.code, error:err.message });
      if (err instanceof OrderError) return send(res, 400, { code:'invalid', error:err.message });
      log.error('[payments]', err);
      return send(res, 500, { code:'server', error:'Something went wrong on our side. Please try again.' });
    }
  };
}

export { createApp };
