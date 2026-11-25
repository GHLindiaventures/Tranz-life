// UPI app payments through Razorpay, end to end against a fake Razorpay API: the order is created for the exact amount,
// and only a payment Razorpay itself reports as captured (checkout response, webhook or status check) marks it paid.
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app.js';
import { createRazorpay } from '../../server/razorpay.js';
import { createStore } from '../../server/store.js';

const UPI = 'tranzlife@okhdfcbank', PASSWORD = 'correct horse battery';
const KEY = 'rzp_test_abc123', SECRET = 'key-secret', WEBHOOK = 'webhook-secret';
const customer = { name:'Asha Rao', phone:'9876543210', email:'asha@example.com', address:'12 MG Road, Indiranagar', city:'Bengaluru', state:'Karnataka', pincode:'560038' };
const silent = { info(){}, warn(){}, error(){} };
const hmac = (secret, data) => createHmac('sha256', secret).update(data).digest('hex');

// a stand-in for api.razorpay.com: orders, and the payments made on them
function fakeRazorpay(){
  const orders = new Map(), payments = new Map(), calls = [];
  let n = 0, down = false;
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers:{ 'Content-Type':'application/json' } });
  async function fetchImpl(url, init){
    const u = new URL(url);
    calls.push({ method:init.method, path:u.pathname, body:init.body ? JSON.parse(init.body) : null, auth:init.headers.Authorization });
    if (down) return json({ error:{ description:'Service unavailable' } }, 503);
    if (init.method === 'POST' && u.pathname === '/v1/orders'){
      const b = JSON.parse(init.body), id = `order_Test${++n}`;
      orders.set(id, b); payments.set(id, []);
      return json({ id, entity:'order', amount:b.amount, currency:b.currency, receipt:b.receipt, status:'created' });
    }
    const m = u.pathname.match(/^\/v1\/orders\/([^/]+)\/payments$/);
    if (init.method === 'GET' && m){ const items = payments.get(m[1]) || []; return json({ entity:'collection', count:items.length, items }); }
    return json({ error:{ description:'Not found' } }, 404);
  }
  let p = 0;
  // a UPI payment on a Razorpay order, captured unless told otherwise
  function pay(orderId, over = {}){
    const payment = { id:`pay_Test${++p}AbCdEf`, entity:'payment', amount:orders.get(orderId).amount, currency:'INR', status:'captured', order_id:orderId, method:'upi', vpa:'asha@okaxis', acquirer_data:{ rrn:`51234567890${p}` }, ...over };
    payments.get(orderId).push(payment);
    return payment;
  }
  return { fetchImpl, calls, pay, setDown:v => { down = v; } };
}

let server, base, handler, rz;
const post = (path, body, headers = {}) => fetch(base + path, { method:'POST', headers:{ 'Content-Type':'application/json', ...headers }, body:typeof body === 'string' ? body : JSON.stringify(body) });
const get = (path, headers = {}) => fetch(base + path, { headers });
const newOrder = async () => (await post('/api/orders', { items:[{ id:'inhaler', qty:2 }], customer })).json();
const status = async ref => (await get(`/api/orders/${ref}`)).json();
const sign = (orderId, paymentId) => hmac(SECRET, `${orderId}|${paymentId}`);
const confirmPay = (o, payment, signature = sign(o.razorpay.orderId, payment.id)) => post(`/api/orders/${o.ref}/razorpay`, { paymentId:payment.id, signature });
function webhook(event, payment, signature){
  const raw = JSON.stringify({ entity:'event', event, payload:{ payment:{ entity:payment } } });
  return post('/api/webhooks/razorpay', raw, { 'X-Razorpay-Signature':signature ?? hmac(WEBHOOK, raw) });
}
const app = (over = {}) => createApp({
  store:createStore(null), upiId:UPI, payeeName:'TranzLife Biosciences', adminPassword:PASSWORD, adminPage:'<p>admin</p>', log:silent,
  razorpay:createRazorpay({ keyId:KEY, keySecret:SECRET, webhookSecret:WEBHOOK, fetchImpl:rz.fetchImpl }), ...over
});

beforeAll(async () => {
  server = createServer((req, res) => handler(req, res));
  await new Promise(r => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
beforeEach(() => { rz = fakeRazorpay(); handler = app(); });
afterAll(() => new Promise(r => server.close(r)));

describe('creating the order', () => {
  it('creates a Razorpay order for the server-priced amount in paise, and gives the checkout what it needs', async () => {
    const o = await newOrder();
    expect(o.razorpay).toEqual({ keyId:KEY, orderId:'order_Test1', amount:54700, currency:'INR', name:'TranzLife Biosciences' });
    expect(o.upi.id).toBe(UPI);
    expect(rz.calls[0]).toMatchObject({ method:'POST', path:'/v1/orders', body:{ amount:54700, currency:'INR', receipt:o.ref, notes:{ ref:o.ref } } });
    expect(rz.calls[0].auth).toBe('Basic ' + Buffer.from(`${KEY}:${SECRET}`).toString('base64'));
    expect(JSON.stringify(o)).not.toContain(SECRET);
  });

  it('still takes QR code orders when Razorpay is down, and says payments are unavailable when there is no QR code either', async () => {
    rz.setDown(true);
    const res = await post('/api/orders', { items:[{ id:'inhaler', qty:1 }], customer });
    expect(res.status).toBe(201);
    const o = await res.json();
    expect(o).not.toHaveProperty('razorpay');
    expect(o.upi.id).toBe(UPI);

    handler = app({ upiId:'' });
    expect((await post('/api/orders', { items:[{ id:'inhaler', qty:1 }], customer })).status).toBe(503);
  });

  it('works with Razorpay alone (no UPI ID for the QR code)', async () => {
    handler = app({ upiId:'' });
    const o = await newOrder();
    expect(o).not.toHaveProperty('upi');
    expect(o.razorpay.orderId).toBe('order_Test1');
  });
});

describe('confirming a UPI app payment', () => {
  it('marks the order paid when the checkout reports a payment that Razorpay confirms, with the UTR from Razorpay', async () => {
    const o = await newOrder(), p = rz.pay(o.razorpay.orderId);
    const res = await confirmPay(o, p);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status:'paid', paymentId:p.id, utr:p.acquirer_data.rrn });
    expect(await status(o.ref)).toMatchObject({ status:'paid', paymentId:p.id });
  });

  it('refuses a forged signature', async () => {
    const o = await newOrder();
    const res = await post(`/api/orders/${o.ref}/razorpay`, { paymentId:'pay_Forged12345', signature:'f'.repeat(64) });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('bad_signature');
    expect(await status(o.ref)).toMatchObject({ status:'awaiting_payment' });
  });

  it('does not take the browser\'s word: no captured payment of the full amount at Razorpay means not paid', async () => {
    const o = await newOrder();
    // the browser claims a payment Razorpay has never seen
    expect(await (await post(`/api/orders/${o.ref}/razorpay`, { paymentId:'pay_Made0Up1234', signature:sign(o.razorpay.orderId, 'pay_Made0Up1234') })).json()).toMatchObject({ status:'awaiting_payment' });
    // a payment that is only authorised, or short
    const a = rz.pay(o.razorpay.orderId, { status:'authorized' });
    expect(await (await confirmPay(o, a)).json()).toMatchObject({ status:'awaiting_payment' });
    const short = rz.pay(o.razorpay.orderId, { amount:100 });
    expect(await (await confirmPay(o, short)).json()).toMatchObject({ status:'awaiting_payment' });
    // a failed attempt, then a good one
    rz.pay(o.razorpay.orderId, { status:'failed' });
    const good = rz.pay(o.razorpay.orderId);
    expect(await (await confirmPay(o, good)).json()).toMatchObject({ status:'paid', paymentId:good.id });
  });

  it('checks with Razorpay when the customer\'s page asks for the status (the webhook has not arrived)', async () => {
    const o = await newOrder(), p = rz.pay(o.razorpay.orderId);
    expect(await status(o.ref)).toMatchObject({ status:'paid', paymentId:p.id, utr:p.acquirer_data.rrn });
  });

  it('will not take a UTR for an order already paid by UPI app', async () => {
    const o = await newOrder(), p = rz.pay(o.razorpay.orderId);
    await confirmPay(o, p);
    const res = await post(`/api/orders/${o.ref}/utr`, { utr:'402312345678' });
    expect(res.status).toBe(409);
  });
});

describe('webhook', () => {
  it('marks the order paid from a signed webhook, refuses a bad signature, and takes repeats calmly', async () => {
    const o = await newOrder(), p = rz.pay(o.razorpay.orderId);
    expect((await webhook('payment.captured', p, 'bad')).status).toBe(400);
    expect((await webhook('payment.captured', p, hmac('wrong-secret', 'x'))).status).toBe(400);

    expect((await webhook('payment.captured', p)).status).toBe(200);
    expect((await webhook('order.paid', p)).status).toBe(200);
    expect(await status(o.ref)).toMatchObject({ status:'paid', paymentId:p.id });

    // a second, different payment for an order that is already paid is kept for a refund
    const twice = rz.pay(o.razorpay.orderId);
    expect((await webhook('payment.captured', twice)).status).toBe(200);
    const token = (await (await post('/api/admin/login', { password:PASSWORD })).json()).token;
    const list = await (await get('/api/admin/orders?status=paid', { Authorization:`Bearer ${token}` })).json();
    expect(list.orders[0]).toMatchObject({ ref:o.ref, payment:{ id:p.id }, extraPayments:[{ id:twice.id }] });
  });

  it('ignores failed payments and payments for unknown orders', async () => {
    const o = await newOrder();
    expect((await webhook('payment.failed', rz.pay(o.razorpay.orderId, { status:'failed' }))).status).toBe(200);
    expect((await webhook('payment.captured', { id:'pay_Other123456', order_id:'order_Unknown', amount:100, currency:'INR', status:'captured' })).status).toBe(200);
    // the status check asks Razorpay too; the only payment there failed
    expect(await status(o.ref)).toMatchObject({ status:'awaiting_payment' });
  });

  it('is off without a webhook secret', async () => {
    handler = app({ razorpay:createRazorpay({ keyId:KEY, keySecret:SECRET, fetchImpl:rz.fetchImpl }) });
    const o = await newOrder();
    expect((await webhook('payment.captured', rz.pay(o.razorpay.orderId))).status).toBe(404);
  });
});

describe('admin page', () => {
  it('picks up UPI app payments whose webhook never arrived', async () => {
    const o = await newOrder(), p = rz.pay(o.razorpay.orderId);
    const token = (await (await post('/api/admin/login', { password:PASSWORD })).json()).token;
    const list = await (await get('/api/admin/orders?status=paid', { Authorization:`Bearer ${token}` })).json();
    expect(list.counts.paid).toBe(1);
    expect(list.orders[0]).toMatchObject({ ref:o.ref, status:'paid', payment:{ id:p.id, rrn:p.acquirer_data.rrn, source:'check' } });
  });
});
