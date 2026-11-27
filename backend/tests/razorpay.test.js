// Payments through Razorpay, end to end against a fake Razorpay API: the order is created for the exact amount, and
// only a payment Razorpay itself reports as captured (checkout response, webhook or status check) marks it paid.
import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createRazorpay } from '../src/modules/payments/razorpay.client.js';
import { bearer, customer, UPI, useTestApi } from './helpers.js';

const KEY = 'rzp_test_abc123', SECRET = 'key-secret', WEBHOOK = 'webhook-secret';
const hmac = (secret, data) => createHmac('sha256', secret).update(data).digest('hex');

// a stand-in for api.razorpay.com: orders, and the payments made on them
function fakeRazorpay(){
  const orders = new Map(), payments = new Map(), calls = [];
  let n = 0, p = 0, down = false;
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
  // a UPI payment on a Razorpay order, captured unless told otherwise
  function pay(orderId, over = {}){
    const payment = { id:`pay_Test${++p}AbCdEf`, entity:'payment', amount:orders.get(orderId).amount, currency:'INR', status:'captured', order_id:orderId, method:'upi', vpa:'asha@okaxis', acquirer_data:{ rrn:`51234567890${p}` }, ...over };
    payments.get(orderId).push(payment);
    return payment;
  }
  return { fetchImpl, calls, pay, setDown:v => { down = v; } };
}

let rz;
beforeEach(() => { rz = fakeRazorpay(); }); // registered first, so it runs before the test API is rebuilt
const razorpay = (webhookSecret = WEBHOOK) => createRazorpay({ keyId:KEY, keySecret:SECRET, webhookSecret, fetchImpl:rz.fetchImpl });
const api = useTestApi(() => ({ razorpay:razorpay() }));

const sign = (orderId, paymentId) => hmac(SECRET, `${orderId}|${paymentId}`);
const confirmPay = (o, payment, signature = sign(o.razorpay.orderId, payment.id)) => api.post(`/api/orders/${o.ref}/razorpay`, { paymentId:payment.id, signature });
function webhook(event, payment, signature){
  const raw = JSON.stringify({ entity:'event', event, payload:{ payment:{ entity:payment } } });
  return api.post('/api/webhooks/razorpay', raw, { 'X-Razorpay-Signature':signature ?? hmac(WEBHOOK, raw) });
}
const adminList = async status => (await api.get(`/api/admin/orders?status=${status}`, bearer(await api.adminToken()))).json();

describe('creating the order', () => {
  it('creates a Razorpay order for the server-priced amount in paise, and gives the checkout what it needs', async () => {
    const o = await api.newOrder();
    expect(o.razorpay).toEqual({ keyId:KEY, orderId:'order_Test1', amount:54700, currency:'INR', name:'TranzLife Biosciences' });
    expect(o.upi.id).toBe(UPI);
    expect(rz.calls[0]).toMatchObject({ method:'POST', path:'/v1/orders', body:{ amount:54700, currency:'INR', receipt:o.ref, notes:{ ref:o.ref } } });
    expect(rz.calls[0].auth).toBe('Basic ' + Buffer.from(`${KEY}:${SECRET}`).toString('base64'));
    expect(JSON.stringify(o)).not.toContain(SECRET);
  });

  it('still takes QR code orders when Razorpay is down, and says payments are unavailable when there is no QR code either', async () => {
    rz.setDown(true);
    const res = await api.placeOrder({ items:[{ id:'inhaler', qty:1 }], customer });
    expect(res.status).toBe(201);
    const o = await res.json();
    expect(o).not.toHaveProperty('razorpay');
    expect(o.upi.id).toBe(UPI);

    api.use({ env:{ MERCHANT_UPI_ID:'' }, razorpay:razorpay() });
    expect((await api.placeOrder({ items:[{ id:'inhaler', qty:1 }], customer })).status).toBe(503);
  });

  it('works with Razorpay alone (no UPI ID for the QR code)', async () => {
    api.use({ env:{ MERCHANT_UPI_ID:'' }, razorpay:razorpay() });
    const o = await api.newOrder();
    expect(o).not.toHaveProperty('upi');
    expect(o.razorpay.orderId).toBe('order_Test1');
  });
});

describe('confirming a payment', () => {
  it('marks the order paid when the checkout reports a payment that Razorpay confirms, with the UTR from Razorpay', async () => {
    const o = await api.newOrder(), p = rz.pay(o.razorpay.orderId);
    const res = await confirmPay(o, p);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status:'paid', paymentId:p.id, utr:p.acquirer_data.rrn });
    expect(await api.status(o.ref)).toMatchObject({ status:'paid', paymentId:p.id });
  });

  it('refuses a forged signature', async () => {
    const o = await api.newOrder();
    const res = await api.post(`/api/orders/${o.ref}/razorpay`, { paymentId:'pay_Forged12345', signature:'f'.repeat(64) });
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('bad_signature');
    expect(await api.status(o.ref)).toMatchObject({ status:'awaiting_payment' });
  });

  it("does not take the browser's word: no captured payment of the full amount at Razorpay means not paid", async () => {
    const o = await api.newOrder();
    expect(await (await api.post(`/api/orders/${o.ref}/razorpay`, { paymentId:'pay_Made0Up1234', signature:sign(o.razorpay.orderId, 'pay_Made0Up1234') })).json()).toMatchObject({ status:'awaiting_payment' });
    const authorised = rz.pay(o.razorpay.orderId, { status:'authorized' });
    expect(await (await confirmPay(o, authorised)).json()).toMatchObject({ status:'awaiting_payment' });
    const short = rz.pay(o.razorpay.orderId, { amount:100 });
    expect(await (await confirmPay(o, short)).json()).toMatchObject({ status:'awaiting_payment' });
    rz.pay(o.razorpay.orderId, { status:'failed' });
    const good = rz.pay(o.razorpay.orderId);
    expect(await (await confirmPay(o, good)).json()).toMatchObject({ status:'paid', paymentId:good.id });
  });

  it("checks with Razorpay when the customer's page asks for the status (the webhook has not arrived)", async () => {
    const o = await api.newOrder(), p = rz.pay(o.razorpay.orderId);
    expect(await api.status(o.ref)).toMatchObject({ status:'paid', paymentId:p.id, utr:p.acquirer_data.rrn });
  });

  it('will not take a UTR for an order already paid through Razorpay', async () => {
    const o = await api.newOrder(), p = rz.pay(o.razorpay.orderId);
    await confirmPay(o, p);
    expect((await api.post(`/api/orders/${o.ref}/utr`, { utr:'402312345678' })).status).toBe(409);
  });
});

describe('webhook', () => {
  it('marks the order paid from a signed webhook, refuses a bad signature, and takes repeats calmly', async () => {
    const o = await api.newOrder(), p = rz.pay(o.razorpay.orderId);
    expect((await webhook('payment.captured', p, 'bad')).status).toBe(400);
    expect((await webhook('payment.captured', p, hmac('wrong-secret', 'x'))).status).toBe(400);

    expect((await webhook('payment.captured', p)).status).toBe(200);
    expect((await webhook('order.paid', p)).status).toBe(200);
    expect(await api.status(o.ref)).toMatchObject({ status:'paid', paymentId:p.id });

    // a second, different payment for an order that is already paid is kept for a refund
    const twice = rz.pay(o.razorpay.orderId);
    expect((await webhook('payment.captured', twice)).status).toBe(200);
    const list = await adminList('paid');
    expect(list.orders[0]).toMatchObject({ ref:o.ref, payment:{ id:p.id }, extraPayments:[{ id:twice.id }] });
  });

  it('ignores failed payments and payments for unknown orders', async () => {
    const o = await api.newOrder();
    expect((await webhook('payment.failed', rz.pay(o.razorpay.orderId, { status:'failed' }))).status).toBe(200);
    expect((await webhook('payment.captured', { id:'pay_Other123456', order_id:'order_Unknown', amount:100, currency:'INR', status:'captured' })).status).toBe(200);
    expect(await api.status(o.ref)).toMatchObject({ status:'awaiting_payment' });
  });

  it('is off without a webhook secret', async () => {
    api.use({ razorpay:razorpay('') });
    const o = await api.newOrder();
    expect((await webhook('payment.captured', rz.pay(o.razorpay.orderId))).status).toBe(404);
  });
});

describe('admin page', () => {
  it('picks up payments whose webhook never arrived', async () => {
    const o = await api.newOrder(), p = rz.pay(o.razorpay.orderId);
    const list = await adminList('paid');
    expect(list.counts.paid).toBe(1);
    expect(list.orders[0]).toMatchObject({ ref:o.ref, status:'paid', payment:{ id:p.id, rrn:p.acquirer_data.rrn, source:'check' } });
  });
});
