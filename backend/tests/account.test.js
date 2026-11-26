// The logged-in customer's account: profile, address book, and My Orders (only their own orders).
import { describe, expect, it } from 'vitest';
import { bearer, customer, useTestApi } from './helpers.js';

const api = useTestApi();
const home = { name:'Asha Rao', phone:'9876543210', address:'12 MG Road, Indiranagar', landmark:'Near the metro', city:'Bengaluru', state:'Karnataka', pincode:'560038', label:'home' };
const work = { ...home, address:'4th floor, 80 Feet Road, Koramangala', pincode:'560034', label:'work' };
const me = async cookie => (await (await api.get('/api/me', cookie)).json()).user;

describe('profile', () => {
  it('needs a login, then saves name, email and gender', async () => {
    expect((await api.post('/api/me', { name:'Asha Rao' })).status).toBe(401);
    const cookie = await api.login();
    const res = await api.post('/api/me', { name:'  Asha   Rao ', email:'ASHA@example.com', gender:'female' }, cookie);
    expect((await res.json()).user).toMatchObject({ name:'Asha Rao', email:'asha@example.com', gender:'female', phone:'9876543210' });
  });

  it('says which field is wrong', async () => {
    const cookie = await api.login();
    expect(await api.json(await api.post('/api/me', { name:'A' }, cookie))).toMatchObject({ status:400, field:'name' });
    expect(await api.json(await api.post('/api/me', { name:'Asha', email:'nope' }, cookie))).toMatchObject({ status:400, field:'email' });
  });
});

describe('address book', () => {
  it('adds addresses (the first is the default), edits, changes the default and deletes', async () => {
    const cookie = await api.login();
    let user = (await (await api.post('/api/me/addresses', home, cookie)).json()).user;
    expect(user.addresses).toMatchObject([{ ...home, isDefault:true }]);
    user = (await (await api.post('/api/me/addresses', work, cookie)).json()).user;
    const [h, w] = user.addresses;
    expect([h.isDefault, w.isDefault]).toEqual([true, false]);

    await api.post(`/api/me/addresses/${w.id}`, { ...work, landmark:'Opposite the park' }, cookie);
    await api.post(`/api/me/addresses/${w.id}/default`, {}, cookie);
    user = await me(cookie);
    expect(user.addresses[0]).toMatchObject({ id:w.id, isDefault:true, landmark:'Opposite the park' });

    // deleting the default makes the next one the default
    user = (await (await api.post(`/api/me/addresses/${w.id}/delete`, {}, cookie)).json()).user;
    expect(user.addresses).toMatchObject([{ id:h.id, isDefault:true }]);
  });

  it("refuses bad addresses and other customers' addresses", async () => {
    const asha = await api.login(), ravi = await api.login('9123456780');
    expect(await api.json(await api.post('/api/me/addresses', { ...home, pincode:'12' }, asha))).toMatchObject({ status:400, field:'pincode' });
    const [a] = (await (await api.post('/api/me/addresses', home, asha)).json()).user.addresses;
    expect((await api.post(`/api/me/addresses/${a.id}/delete`, {}, ravi)).status).toBe(404);
    expect((await api.post(`/api/me/addresses/${a.id}`, work, ravi)).status).toBe(404);
    expect((await api.post('/api/me/addresses/not-a-uuid/default', {}, ravi)).status).toBe(404);
    expect((await me(asha)).addresses).toHaveLength(1);
  });

  it('keeps at most 10 addresses', async () => {
    const cookie = await api.login();
    for (let i = 0; i < 10; i++) await api.post('/api/me/addresses', { ...home, address:`${i + 1} MG Road, Indiranagar` }, cookie);
    expect(await api.json(await api.post('/api/me/addresses', work, cookie))).toMatchObject({ status:409, code:'too_many' });
  });
});

describe('My Orders', () => {
  it("lists a logged-in customer's orders, saves the delivery address once, and leaves guest orders out", async () => {
    const cookie = await api.login();
    await api.newOrder();                                        // guest order: not in the account
    const a = await api.newOrder([{ id:'gummies', qty:1 }], cookie);
    const b = await api.newOrder([{ id:'inhaler', qty:3 }], cookie);
    const { orders } = await (await api.get('/api/me/orders', cookie)).json();
    expect(orders.map(o => o.ref)).toEqual([b.ref, a.ref]);     // newest first
    expect(orders[1]).toMatchObject({ status:'awaiting_payment', total:549 + 49, items:[{ id:'gummies', qty:1 }], deliverTo:{ city:'Bengaluru' } });
    expect((await me(cookie)).addresses).toMatchObject([{ address:customer.address, pincode:customer.pincode, isDefault:true }]);
  });

  it("shows one order with its tracking timeline, and never another customer's order", async () => {
    const asha = await api.login(), ravi = await api.login('9123456780');
    const o = await api.newOrder([{ id:'inhaler', qty:1 }], asha);
    const token = await api.adminToken();
    await api.post(`/api/admin/orders/${o.ref}/confirm`, { utr:'402312345678' }, bearer(token));
    await api.post(`/api/admin/orders/${o.ref}/delivery`, { step:'shipped' }, bearer(token));

    const { order } = await (await api.get(`/api/me/orders/${o.ref}`, asha)).json();
    expect(order).toMatchObject({ ref:o.ref, status:'paid', deliveryStep:'shipped', payment:{ utr:'402312345678' }, deliverTo:{ name:'Asha Rao' } });
    expect(order.timeline.map(t => t.step)).toEqual(['placed', 'paid', 'shipped']);

    expect((await api.get(`/api/me/orders/${o.ref}`, ravi)).status).toBe(404);
    expect((await (await api.get('/api/me/orders', ravi)).json()).orders).toEqual([]);
    expect((await api.get('/api/me/orders')).status).toBe(401);
  });
});
