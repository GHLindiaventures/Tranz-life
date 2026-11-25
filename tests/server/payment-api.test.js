// Runs the payment API end to end: orders priced on the server, UTRs from customers, and the admin confirming or rejecting them.
import { createServer } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app.js';
import { createStore } from '../../server/store.js';

const UPI = 'tranzlife@okhdfcbank', PASSWORD = 'correct horse battery';
const customer = { name:'Asha Rao', phone:'9876543210', email:'asha@example.com', address:'12 MG Road, Indiranagar', city:'Bengaluru', state:'Karnataka', pincode:'560038' };
const silent = { info(){}, warn(){}, error(){} };

let server, base, handler;
const post = (path, body, headers = {}) => fetch(base + path, { method:'POST', headers:{ 'Content-Type':'application/json', ...headers }, body:typeof body === 'string' ? body : JSON.stringify(body) });
const get = (path, headers = {}) => fetch(base + path, { headers });
const newOrder = async (items = [{ id:'inhaler', qty:2 }]) => (await post('/api/orders', { items, customer })).json();
const status = async ref => (await get(`/api/orders/${ref}`)).json();
async function adminToken(){ return (await (await post('/api/admin/login', { password:PASSWORD })).json()).token; }
const auth = token => ({ Authorization:`Bearer ${token}` });

beforeAll(async () => {
  server = createServer((req, res) => handler(req, res));
  await new Promise(r => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
beforeEach(() => {
  handler = createApp({ store:createStore(null), upiId:UPI, payeeName:'TranzLife Biosciences', adminPassword:PASSWORD, adminPage:'<p nonce="__NONCE__">admin</p>', log:silent });
});
afterAll(() => new Promise(r => server.close(r)));

describe('customer side', () => {
  it('prices the order on the server and returns a UPI link to the merchant UPI ID', async () => {
    const res = await post('/api/orders', { items:[{ id:'inhaler', qty:2, price:1 }], customer, total:1 });
    expect(res.status).toBe(201);
    const o = await res.json();
    expect(o.total).toBe(249 * 2 + 49);
    expect(o.upi.id).toBe(UPI);
    expect(o.upi.uri).toBe(`upi://pay?pa=${UPI}&pn=TranzLife%20Biosciences&am=547.00&cu=INR&tn=${o.ref}`);
    expect(o).not.toHaveProperty('customer');
    expect(o).not.toHaveProperty('razorpay');
    expect(await status(o.ref)).toEqual({ ref:o.ref, status:'awaiting_payment', total:547, utr:null, reason:null, paymentId:null });
  });

  it('refuses bad bags and bad delivery details', async () => {
    expect((await post('/api/orders', { items:[{ id:'nope', qty:1 }], customer })).status).toBe(400);
    const res = await post('/api/orders', { items:[{ id:'inhaler', qty:1 }], customer:{ ...customer, pincode:'12' } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/PIN/);
    expect((await post('/api/orders', 'not json')).status).toBe(400);
  });

  it('takes no orders until a UPI ID is set', async () => {
    handler = createApp({ store:createStore(null), upiId:'', log:silent });
    expect((await post('/api/orders', { items:[{ id:'inhaler', qty:1 }], customer })).status).toBe(503);
  });

  it('accepts a 12-digit UTR and moves the order to verifying', async () => {
    const o = await newOrder();
    expect((await post(`/api/orders/${o.ref}/utr`, { utr:'1234' })).status).toBe(400);
    const res = await post(`/api/orders/${o.ref}/utr`, { utr:'4023 1234 5678' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status:'verifying', utr:'402312345678' });
  });

  it('will not let one UTR pay for two orders', async () => {
    const a = await newOrder(), b = await newOrder();
    await post(`/api/orders/${a.ref}/utr`, { utr:'402312345678' });
    const res = await post(`/api/orders/${b.ref}/utr`, { utr:'402312345678' });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('utr_used');
  });

  it('only finds orders by their full order number', async () => {
    expect((await get('/api/orders/TL-261123-AAAAAAAA')).status).toBe(404);
    expect((await get('/api/orders/../../etc')).status).toBe(404);
  });
});

describe('admin side', () => {
  it('needs the right password, and a token for every admin call', async () => {
    expect((await post('/api/admin/login', { password:'wrong' })).status).toBe(401);
    expect((await get('/api/admin/orders')).status).toBe(401);
    expect((await get('/api/admin/orders', auth('f'.repeat(64)))).status).toBe(401);
    const token = await adminToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect((await get('/api/admin/orders', auth(token))).status).toBe(200);
    await post('/api/admin/logout', {}, auth(token));
    expect((await get('/api/admin/orders', auth(token))).status).toBe(401);
  });

  it('serves the admin page with a strict content security policy', async () => {
    const res = await get('/api/admin');
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    const csp = res.headers.get('content-security-policy');
    expect(csp).toMatch(/script-src 'nonce-[^']+'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(await res.text()).not.toContain('__NONCE__');
  });

  it('lists orders waiting for a check with the customer details, and confirms them', async () => {
    const o = await newOrder();
    await post(`/api/orders/${o.ref}/utr`, { utr:'402312345678' });
    const token = await adminToken();
    const list = await (await get('/api/admin/orders?status=verifying', auth(token))).json();
    expect(list.counts).toMatchObject({ verifying:1, awaiting_payment:0, paid:0 });
    expect(list.orders[0]).toMatchObject({ ref:o.ref, utr:'402312345678', total:547, customer:{ name:'Asha Rao', phone:'9876543210' } });

    expect((await post(`/api/admin/orders/${o.ref}/confirm`, {}, auth(token))).status).toBe(200);
    expect(await status(o.ref)).toMatchObject({ status:'paid', utr:'402312345678' });
    // a paid order cannot take another UTR
    expect((await post(`/api/orders/${o.ref}/utr`, { utr:'999988887777' })).status).toBe(409);
  });

  it('rejects a UTR with a reason the customer sees; the same UTR cannot be sent again, a corrected one can', async () => {
    const o = await newOrder();
    await post(`/api/orders/${o.ref}/utr`, { utr:'402312345678' });
    const token = await adminToken();
    await post(`/api/admin/orders/${o.ref}/reject`, { reason:'No payment with this UTR.' }, auth(token));
    expect(await status(o.ref)).toMatchObject({ status:'rejected', reason:'No payment with this UTR.' });

    const again = await post(`/api/orders/${o.ref}/utr`, { utr:'402312345678' });
    expect(again.status).toBe(409);
    expect((await again.json()).code).toBe('rejected_utr');
    expect((await post(`/api/orders/${o.ref}/utr`, { utr:'402312345679' })).status).toBe(200);
    expect(await status(o.ref)).toMatchObject({ status:'verifying', utr:'402312345679', reason:null });
  });

  it('marks an order paid from the bank statement when the customer never sent a UTR', async () => {
    const o = await newOrder();
    const token = await adminToken();
    expect((await post(`/api/admin/orders/${o.ref}/confirm`, {}, auth(token))).status).toBe(400);
    expect((await post(`/api/admin/orders/${o.ref}/confirm`, { utr:'5555 6666 7777' }, auth(token))).status).toBe(200);
    expect(await status(o.ref)).toMatchObject({ status:'paid', utr:'555566667777' });
  });

  it('slows down password guessing', async () => {
    for (let i = 0; i < 10; i++) await post('/api/admin/login', { password:'guess' });
    expect((await post('/api/admin/login', { password:PASSWORD })).status).toBe(429);
  });
});
