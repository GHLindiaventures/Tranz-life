// The customer account from the website's side. Two providers behind one interface, like the checkout's gateway:
//   live: the backend (backend/), used when VITE_PAYMENT_API is set. The login is an HttpOnly cookie the browser keeps.
//   demo: the same flow inside this browser and nothing sent anywhere. The code shows on screen, and the account and
//         its test orders stay in this browser (localStorage). For trying the site out before the backend is live.
//
//   mode                        'live' | 'demo'
//   me()                        -> { user, login, emailLogin }   user is null when logged out;
//                                  login: 'twilio' | 'test' | 'demo' | null (off); emailLogin: codes by email work too
//   requestCode(login)          -> { kind, to, resendIn, testCode? }   login: { phone } or { email }
//   verifyCode(login, code)     -> { user, isNew }
//   logout()
//   saveProfile(profile)        -> user
//   addAddress(a) / editAddress(id, a) / deleteAddress(id) / makeDefault(id) -> user
//   orders()                    -> [order]          newest first
//   order(ref)                  -> order            with the tracking timeline
//   recordOrder(order, status)  demo only: keeps a test checkout's order in My Orders
// Failures reject with an AccountError { code, message, field? }.
import { checkAddress, checkProfile } from '../../utils/account.js';
import { normalisePhone, validEmail } from '../../utils/payment.js';

class AccountError extends Error {
  constructor(code, message, field){ super(message); this.name = 'AccountError'; this.code = code; this.field = field; }
}

// ---------- live: the backend ----------
function liveAccount(api){
  async function call(path, body){
    let res;
    try {
      res = await fetch(api + path, body === undefined ? { credentials:'include', cache:'no-store' }
        : { method:'POST', credentials:'include', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) });
    } catch(err){ throw new AccountError('network', 'We could not reach our server. Check your connection and try again.'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new AccountError(data.code || 'failed', data.error || `Our server returned an error (${res.status}).`, data.field);
    return data;
  }
  const user = p => p.then(r => r.user);
  return {
    mode:'live',
    me:() => call('/me'),
    requestCode:login => call('/auth/otp', login),
    verifyCode:(login, code) => call('/auth/verify', { ...login, code }),
    logout:() => call('/auth/logout', {}),
    saveProfile:p => user(call('/me', p)),
    addAddress:a => user(call('/me/addresses', a)),
    editAddress:(id, a) => user(call(`/me/addresses/${encodeURIComponent(id)}`, a)),
    deleteAddress:id => user(call(`/me/addresses/${encodeURIComponent(id)}/delete`, {})),
    makeDefault:id => user(call(`/me/addresses/${encodeURIComponent(id)}/default`, {})),
    orders:async () => (await call('/me/orders')).orders,
    order:async ref => (await call(`/me/orders/${encodeURIComponent(ref)}`)).order,
    recordOrder(){} // the backend links orders to the account itself
  };
}

// ---------- demo: everything in this browser ----------
const KEY = 'tl.account.demo';
const RESEND_SECONDS = 30, CODE_MINUTES = 10, MAX_TRIES = 5, MAX_ADDRESSES = 10;

function demoAccount(){
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; } };
  const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} };
  const fail = (code, message, field) => { throw new AccountError(code, message, field); };
  const later = v => new Promise(r => setTimeout(() => r(v), 350)); // feels like a network call

  // runs fn on the stored state for the logged-in customer and saves it; returns what fn returns
  function withCustomer(fn){
    const s = load(), c = s.session && s.customers?.[s.session];
    if (!c) fail('auth', 'Please log in to see your account.');
    const out = fn(c, s);
    save(s);
    return later(out);
  }
  const findAddress = (c, id) => c.addresses.find(a => a.id === id) || fail('not_found', 'That address is not in your account.');
  const firstError = errors => { const [field, msg] = Object.entries(errors)[0]; fail('invalid', msg, field); };

  // { phone } or { email } -> { kind, key }; the key (the number or the address) is how this browser stores the account
  function readLogin(login = {}){
    if (login.email){
      const email = String(login.email).trim().toLowerCase();
      if (!validEmail(email)) fail('invalid', 'Enter a valid email address, like you@example.com.');
      return { kind:'email', key:email };
    }
    return { kind:'phone', key:normalisePhone(login.phone) || fail('invalid', 'Enter a 10-digit Indian mobile number.') };
  }

  return {
    mode:'demo',
    me(){ const s = load(); return later({ user:(s.session && s.customers?.[s.session]) || null, login:'demo', emailLogin:true }); },

    requestCode(login){
      const { kind, key } = readLogin(login);
      const s = load(); s.codes ||= {};
      const last = s.codes[key];
      const wait = last ? Math.ceil(RESEND_SECONDS - (Date.now() - last.sentAt) / 1000) : 0;
      if (wait > 0) fail('busy', `Please wait ${wait} seconds before asking for another code.`);
      const code = String(Math.floor(Math.random() * 1e6)).padStart(6, '0');
      s.codes[key] = { code, sentAt:Date.now(), expiresAt:Date.now() + CODE_MINUTES * 60e3, tries:0 };
      save(s);
      return later({ kind, to:key, resendIn:RESEND_SECONDS, testCode:code });
    },

    verifyCode(login, codeInput){
      const { kind, key } = readLogin(login);
      const s = load(), c = s.codes?.[key], code = String(codeInput ?? '').replace(/\D/g, '');
      if (!c || c.expiresAt < Date.now()) fail('expired', 'This code has expired. Ask for a new one.');
      if (++c.tries > MAX_TRIES){ save(s); fail('too_many', 'Too many wrong codes. Ask for a new code.'); }
      if (c.code !== code){ save(s); fail('wrong_code', 'That code is not right. Check the code and try again.'); }
      delete s.codes[key];
      s.customers ||= {};
      const isNew = !s.customers[key];
      if (isNew){
        s.customers[key] = { id:`demo-${key}`, phone:kind === 'phone' ? key : null, loginEmail:kind === 'email' ? key : null,
          name:'', email:kind === 'email' ? key : '', gender:'', memberSince:new Date().toISOString(), addresses:[] };
      }
      s.session = key;
      save(s);
      return later({ user:s.customers[key], isNew });
    },

    logout(){ const s = load(); s.session = null; save(s); return later({ ok:true }); },

    saveProfile(input){
      const { profile, errors } = checkProfile(input);
      if (errors) firstError(errors);
      return withCustomer(c => Object.assign(c, profile));
    },

    addAddress(input){
      const { address, errors } = checkAddress(input);
      if (errors) firstError(errors);
      return withCustomer(c => {
        if (c.addresses.length >= MAX_ADDRESSES) fail('too_many', `You can save up to ${MAX_ADDRESSES} addresses. Delete one first.`);
        c.addresses.push({ ...address, id:`a${Date.now().toString(36)}`, isDefault:!c.addresses.length });
        return c;
      });
    },
    editAddress(id, input){
      const { address, errors } = checkAddress(input);
      if (errors) firstError(errors);
      return withCustomer(c => { Object.assign(findAddress(c, id), address); return c; });
    },
    deleteAddress(id){
      return withCustomer(c => {
        const gone = findAddress(c, id);
        c.addresses = c.addresses.filter(a => a !== gone);
        if (gone.isDefault && c.addresses[0]) c.addresses[0].isDefault = true;
        return c;
      });
    },
    makeDefault(id){
      return withCustomer(c => {
        const pick = findAddress(c, id);
        c.addresses.forEach(a => { a.isDefault = a === pick; });
        c.addresses = [pick, ...c.addresses.filter(a => a !== pick)];
        return c;
      });
    },

    orders(){ return withCustomer((c, s) => s.orders?.[s.session] || []); },
    order(ref){
      return withCustomer((c, s) => (s.orders?.[s.session] || []).find(o => o.ref === ref) || fail('not_found', 'We could not find that order in your account.'));
    },

    // a test checkout finished: keep it in My Orders, and its address in the address book (like the backend does)
    recordOrder(order, status){
      const s = load(), c = s.session && s.customers?.[s.session];
      if (!c) return;
      const now = new Date().toISOString(), paid = status === 'paid';
      const view = {
        ref:order.ref, createdAt:now, status:paid ? 'paid' : status === 'verifying' ? 'verifying' : 'awaiting_payment', deliveryStep:null,
        items:order.items, subtotal:order.subtotal, shipping:order.shipping, total:order.total, deliverTo:order.customer,
        payment:{ method:order.method || 'upi', utr:order.utr || null, paidAt:paid ? now : null }, rejectedReason:null,
        timeline:[{ step:'placed', at:now }, ...(paid ? [{ step:'paid', at:now }] : [])]
      };
      s.orders ||= {};
      s.orders[s.session] = [view, ...(s.orders[s.session] || []).filter(o => o.ref !== order.ref)];
      const { address, errors } = checkAddress(order.customer);
      const known = c.addresses.some(a => a.address.toLowerCase() === address.address.toLowerCase() && a.pincode === address.pincode);
      if (!errors && !known && c.addresses.length < MAX_ADDRESSES) c.addresses.push({ ...address, id:`a${Date.now().toString(36)}`, isDefault:!c.addresses.length });
      save(s);
    }
  };
}

function createAccountApi(){
  const api = (import.meta.env.VITE_PAYMENT_API || '').trim().replace(/\/+$/, '');
  return api ? liveAccount(api) : demoAccount();
}

export { createAccountApi, AccountError };
