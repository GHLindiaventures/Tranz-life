// Orders end to end: priced on the server, UTRs from customers, the admin confirming, rejecting and shipping them.
import { describe, expect, it } from 'vitest';
import { bearer, customer, PASSWORD, UPI, useTestApi } from './helpers.js';

const api = useTestApi();

describe('checkout', () => {
  it('prices the order on the server and returns a UPI link to the merchant UPI ID', async () => {
    const res = await api.placeOrder({ items:[{ id:'inhaler', qty:2, price:1 }], customer, total:1 });
    expect(res.status).toBe(201);
    const o = await res.json();
    expect(o.total).toBe(249 * 2 + 49);
    expect(o.upi.id).toBe(UPI);
    expect(o.upi.uri).toBe(`upi://pay?pa=${UPI}&pn=TranzLife%20Biosciences&am=547.00&cu=INR&tn=${o.ref}`);
    expect(o).not.toHaveProperty('customer');
    expect(o).not.toHaveProperty('razorpay');
    expect(await api.status(o.ref)).toEqual({ ref:o.ref, status:'awaiting_payment', total:547, utr:null, reason:null, paymentId:null });
  });

  it('needs a logged-in customer', async () => {
    const res = await api.post('/api/orders', { items:[{ id:'inhaler', qty:1 }], customer });
    expect(await api.json(res)).toMatchObject({ status:401, code:'auth', error:expect.stringMatching(/log in/) });
    expect(await api.db.query('SELECT ref FROM orders')).toEqual([]);
  });

  it("stores the order (in the customer's account), its items and its first event in the database", async () => {
    const o = await api.newOrder([{ id:'inhaler', qty:2 }, { id:'gummies', qty:1 }]);
    const row = await api.db.one('SELECT status, total, customer_id, ship_city FROM orders WHERE ref = $1', [o.ref]);
    const { id } = await api.db.one("SELECT id FROM customers WHERE phone = '9000000001'");
    expect(row).toEqual({ status:'awaiting_payment', total:249 * 2 + 549, customer_id:id, ship_city:'Bengaluru' });
    expect(await api.db.query('SELECT product_id, qty FROM order_items WHERE order_ref = $1 ORDER BY product_id', [o.ref]))
      .toEqual([{ product_id:'gummies', qty:1 }, { product_id:'inhaler', qty:2 }]);
    expect((await api.db.query('SELECT type FROM order_events WHERE order_ref = $1', [o.ref])).map(e => e.type)).toEqual(['placed']);
  });

  it('refuses bad bags and bad delivery details', async () => {
    expect((await api.placeOrder({ items:[{ id:'nope', qty:1 }], customer })).status).toBe(400);
    const res = await api.placeOrder({ items:[{ id:'inhaler', qty:1 }], customer:{ ...customer, pincode:'12' } });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/PIN/);
    expect((await api.placeOrder('not json')).status).toBe(400);
    expect((await fetch(api.base + '/api/orders', { method:'POST', body:'items=1' })).status).toBe(415);
  });

  it('takes no orders until a payment method is set', async () => {
    api.use({ env:{ MERCHANT_UPI_ID:'' } });
    expect((await api.placeOrder({ items:[{ id:'inhaler', qty:1 }], customer })).status).toBe(503);
  });

  it('accepts a 12-digit UTR and moves the order to verifying', async () => {
    const o = await api.newOrder();
    expect((await api.post(`/api/orders/${o.ref}/utr`, { utr:'1234' })).status).toBe(400);
    const res = await api.post(`/api/orders/${o.ref}/utr`, { utr:'4023 1234 5678' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status:'verifying', utr:'402312345678' });
  });

  it('will not let one UTR pay for two orders', async () => {
    const a = await api.newOrder(), b = await api.newOrder();
    await api.post(`/api/orders/${a.ref}/utr`, { utr:'402312345678' });
    const res = await api.post(`/api/orders/${b.ref}/utr`, { utr:'402312345678' });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe('utr_used');
  });

  it('only finds orders by their full order number', async () => {
    expect((await api.get('/api/orders/TL-261123-AAAAAAAA')).status).toBe(404);
    expect((await api.get('/api/orders/not-an-order')).status).toBe(404);
    expect((await api.get('/api/orders/../../etc')).status).toBe(404);
  });
});

describe('admin', () => {
  it('needs the right password, and a token for every admin call', async () => {
    expect((await api.post('/api/admin/login', { password:'wrong' })).status).toBe(401);
    expect((await api.get('/api/admin/orders')).status).toBe(401);
    expect((await api.get('/api/admin/orders', bearer('f'.repeat(64)))).status).toBe(401);
    const token = await api.adminToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect((await api.get('/api/admin/orders', bearer(token))).status).toBe(200);
    await api.post('/api/admin/logout', {}, bearer(token));
    expect((await api.get('/api/admin/orders', bearer(token))).status).toBe(401);
  });

  it('keeps admin sessions in the database, hashed', async () => {
    const token = await api.adminToken();
    const rows = await api.db.query("SELECT token_hash FROM sessions WHERE kind = 'admin'");
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(token);
  });

  it('serves the admin page with a strict content security policy', async () => {
    const res = await api.get('/api/admin');
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    const csp = res.headers.get('content-security-policy');
    expect(csp).toMatch(/script-src 'nonce-[^']+'/);
    expect(csp).toMatch(/frame-ancestors 'none'/);
    expect(await res.text()).not.toContain('__NONCE__');
  });

  it('lists orders waiting for a check with the customer details, and confirms them', async () => {
    const o = await api.newOrder();
    await api.post(`/api/orders/${o.ref}/utr`, { utr:'402312345678' });
    const token = await api.adminToken();
    const list = await (await api.get('/api/admin/orders?status=verifying', bearer(token))).json();
    expect(list.counts).toMatchObject({ verifying:1, awaiting_payment:0, paid:0 });
    expect(list.orders[0]).toMatchObject({ ref:o.ref, utr:'402312345678', total:547, customer:{ name:'Asha Rao', phone:'9876543210' } });

    expect((await api.post(`/api/admin/orders/${o.ref}/confirm`, {}, bearer(token))).status).toBe(200);
    expect(await api.status(o.ref)).toMatchObject({ status:'paid', utr:'402312345678' });
    // a paid order cannot take another UTR
    expect((await api.post(`/api/orders/${o.ref}/utr`, { utr:'999988887777' })).status).toBe(409);
  });

  it('rejects a UTR with a reason the customer sees; the same UTR cannot be sent again, a corrected one can', async () => {
    const o = await api.newOrder();
    await api.post(`/api/orders/${o.ref}/utr`, { utr:'402312345678' });
    const token = await api.adminToken();
    await api.post(`/api/admin/orders/${o.ref}/reject`, { reason:'No payment with this UTR.' }, bearer(token));
    expect(await api.status(o.ref)).toMatchObject({ status:'rejected', reason:'No payment with this UTR.' });

    const again = await api.post(`/api/orders/${o.ref}/utr`, { utr:'402312345678' });
    expect(again.status).toBe(409);
    expect((await again.json()).code).toBe('rejected_utr');
    expect((await api.post(`/api/orders/${o.ref}/utr`, { utr:'402312345679' })).status).toBe(200);
    expect(await api.status(o.ref)).toMatchObject({ status:'verifying', utr:'402312345679', reason:null });

    const list = await (await api.get('/api/admin/orders?status=all', bearer(token))).json();
    expect(list.orders[0].utrHistory.map(h => h.result)).toEqual(['submitted', 'rejected', 'submitted']);
  });

  it('marks an order paid from the bank statement when the customer never sent a UTR', async () => {
    const o = await api.newOrder();
    const token = await api.adminToken();
    expect((await api.post(`/api/admin/orders/${o.ref}/confirm`, {}, bearer(token))).status).toBe(400);
    expect((await api.post(`/api/admin/orders/${o.ref}/confirm`, { utr:'5555 6666 7777' }, bearer(token))).status).toBe(200);
    expect(await api.status(o.ref)).toMatchObject({ status:'paid', utr:'555566667777' });
  });

  it('moves a paid order through its delivery steps, forward only', async () => {
    const o = await api.newOrder(), token = await api.adminToken();
    const step = s => api.post(`/api/admin/orders/${o.ref}/delivery`, { step:s }, bearer(token));
    expect((await step('packed')).status).toBe(409); // not paid yet
    await api.post(`/api/admin/orders/${o.ref}/confirm`, { utr:'555566667777' }, bearer(token));
    expect((await step('teleported')).status).toBe(400);
    expect(await (await step('packed')).json()).toMatchObject({ deliveryStep:'packed' });
    expect((await step('delivered')).status).toBe(200); // a step can be skipped
    expect((await step('shipped')).status).toBe(409);   // but not undone
  });

  it('slows down password guessing', async () => {
    for (let i = 0; i < 10; i++) await api.post('/api/admin/login', { password:'guess' });
    expect((await api.post('/api/admin/login', { password:PASSWORD })).status).toBe(429);
  });
});
