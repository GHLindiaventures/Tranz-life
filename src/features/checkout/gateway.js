// Payment logic for the checkout. Payments go through Razorpay's Custom Checkout script (razorpay.js), each one tied to this
// order, so Razorpay reports it and the order confirms by itself, with no UTR:
//   UPI on a computer: a QR code for this order appears on the page; the customer scans it with any UPI app on their phone.
//   UPI on a phone:    the customer taps Google Pay, PhonePe, Paytm, BHIM or another app, which opens with the amount filled in.
//   Card:              debit, credit or ATM card details go from the browser straight to Razorpay; the bank asks for an OTP.
// Without Razorpay (or when Razorpay cannot show a QR code), the UPI tab falls back to a QR code for TranzLife's own UPI ID
// ("company" QR), and the customer sends the UTR, which TranzLife checks on the admin page.
//
// Two providers behind one interface:
//   live: the TranzLife payment server (server/). Used when VITE_PAYMENT_API is set.
//   demo: the same flow inside the browser, with no server and no money.
//
//   methods                          -> payment tabs: ['upi', 'card']
//   createOrder({ lines, customer }) -> order { ref, items, subtotal, shipping, total, customer, methods, upiMode, upi?, razorpay? }
//                                       upiMode 'gateway': Razorpay QR code / UPI apps; 'company': TranzLife's own QR + UTR
//   prepare(order)                   -> loads Razorpay's script ahead of the tap (a UPI app or card window opens only from a tap)
//   showQr(order, { onQr })          -> { done, cancel, simulate? }  computer: QR code for this order. onQr({ uri, expiresAt })
//                                       when it is ready, onQr({ expired:true }) when it runs out. Rejects with code
//                                       'qr_unavailable' when Razorpay cannot show one (use the company QR instead).
//   payUpi(order, { app, ask })      -> { done, cancel }  phone: opens the UPI app
//   payCard(order, { card, ask })    -> { done, cancel }  card: Razorpay's window for the bank's OTP
//                                       done: Promise<{ status:'paid'|'processing', paymentId, utr }>. Call these straight
//                                       from the tap, with no await before them.
//   submitUtr(order, utr)            -> { status:'verifying', utr }   company QR only
//   status(order)                    -> { status:'awaiting_payment'|'verifying'|'paid'|'rejected', utr, reason, paymentId }
// Failures reject with a PaymentError (code: invalid | cancelled | failed | network | unavailable | loading | qr_unavailable | ...).
import { orderRef, priceOrder } from '../../utils/order.js';

class PaymentError extends Error {
  constructor(code, message){ super(message); this.name = 'PaymentError'; this.code = code; }
}

const QR_MINUTES = 10; // Razorpay's QR codes last 10 minutes
const wait = ms => new Promise(r => setTimeout(r, ms));

// Where the shopper is. UPI apps open straight from Android and iPhone browsers; a computer gets a QR code instead.
function device(){
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

// The UPI app buttons on a phone, with Razorpay's app codes. "Other UPI app" ('any') opens Android's list of installed
// UPI apps, so it is not offered on iPhone.
const UPI_APPS = [
  { id:'gpay', name:'Google Pay' },
  { id:'phonepe', name:'PhonePe' },
  { id:'paytm', name:'Paytm' },
  { id:'bhim', name:'BHIM' },
  { id:'any', name:'Other UPI app' }
];
const upiApps = (where = device()) => UPI_APPS.filter(a => a.id !== 'any' || where !== 'ios');
const appName = id => (UPI_APPS.find(a => a.id === id) || { name:'your UPI app' }).name;

// a { done, cancel } that has already failed, for when a payment cannot start
const failedPay = err => { const done = Promise.reject(err); done.catch(() => {}); return { done, cancel(){} }; };

// ---------- live: the TranzLife payment server, with Razorpay ----------
const SCRIPT = 'https://checkout.razorpay.com/v1/razorpay.js';
let scriptLoad = null;
function loadRazorpay(){
  if (!scriptLoad) scriptLoad = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT; s.async = true;
    s.onload = () => window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Razorpay did not load'));
    s.onerror = () => { scriptLoad = null; s.remove(); reject(new PaymentError('network', 'The payment window could not load. Check your connection and try again.')); };
    document.head.appendChild(s);
  });
  return scriptLoad;
}

// Razorpay's error (payment.error) as a message for the customer
const rzError = err => err?.error || err || {};
function upiFailure(err, app){
  const e = rzError(err);
  if (e.reason === 'payment_cancelled') return new PaymentError('cancelled', 'Payment cancelled.');
  if (e.reason === 'intent_no_apps_error') return new PaymentError('failed', `We couldn't open ${appName(app)}. Is it installed on this phone? Try another UPI app.`);
  return new PaymentError('failed', `${e.description || 'The payment did not go through.'} No money was taken; if any was, it is returned automatically. Try again, or try another UPI app.`);
}
function qrFailure(err){
  const e = rzError(err);
  // the on-page QR code is a feature Razorpay switches on per account
  if (e.reason === 'Feature not enabled' || /not supported|not enabled/i.test(e.description || '')) return new PaymentError('qr_unavailable', "We can't show a QR code right now.");
  if (e.reason === 'payment_cancelled') return new PaymentError('cancelled', 'Payment cancelled.');
  return new PaymentError('failed', `${e.description || 'The payment did not go through.'} No money was taken; if any was, it is returned automatically. Show the QR code again to retry, or pay by card.`);
}
function cardFailure(err){
  const e = rzError(err);
  if (e.reason === 'payment_cancelled') return new PaymentError('cancelled', 'Payment cancelled.');
  return new PaymentError('failed', `${e.description || 'Your bank did not approve the payment.'} No money was taken; if any was, it is returned automatically.`);
}
// Razorpay gives the QR code's expiry in milliseconds (seconds are handled too)
const toMs = t => !t ? 0 : t < 1e12 ? t * 1000 : t;

function liveGateway(api){
  async function call(path, body){
    let res;
    try {
      res = await fetch(api + path, body === undefined ? { cache:'no-store' }
        : { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) });
    } catch(err){ throw new PaymentError('network', 'We could not reach our server. Check your connection and try again.'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new PaymentError(data.code || 'failed', data.error || `Our server returned an error (${res.status}).`);
    return data;
  }

  // Runs one Razorpay payment for the order. start({ Razorpay, rz, base, succeeded, fail }) creates it and returns the
  // Razorpay instance. `done` settles once our server has the order as paid: from the success callback (signed by Razorpay),
  // or from asking the server every few seconds, because the server may hear first (webhook), for example while the
  // customer is in their UPI app or paying a QR code from their phone.
  function track(order, start){
    const rz = order.razorpay, Razorpay = window.Razorpay, c = order.customer;
    if (!rz) return failedPay(new PaymentError('unavailable', 'This payment method is not available right now.'));
    if (!Razorpay){ loadRazorpay().catch(() => {}); return failedPay(new PaymentError('loading', 'The payment window is still loading. Please tap again in a moment.')); }

    let resolve, reject, over = false, confirmedAt = 0, paymentId = null, rzp = null;
    const done = new Promise((y, n) => { resolve = y; reject = n; });
    const finish = (fn, v) => { if (over) return; over = true; clearInterval(watch); document.removeEventListener('visibilitychange', onBack); fn(v); };

    // Razorpay says the payment went through: have the server check it. Usually it is "paid" straight away; if the bank
    // is slow to settle it, the watch below keeps asking, then hands over to the receipt page ("processing").
    async function succeeded(resp){
      paymentId = resp?.razorpay_payment_id || null; confirmedAt = Date.now();
      try {
        const s = await call(`/orders/${order.ref}/razorpay`, { paymentId, signature:resp?.razorpay_signature || '' });
        if (s.status === 'paid') finish(resolve, s);
      } catch(err){
        if (err.code === 'bad_signature') finish(reject, err);
      }
    }
    async function check(){
      if (over) return;
      if (confirmedAt && Date.now() - confirmedAt > 45000) return finish(resolve, { status:'processing', paymentId });
      try { const s = await call(`/orders/${order.ref}`); if (s.status === 'paid') finish(resolve, s); } catch(err){}
    }
    const watch = setInterval(check, 4000);
    const onBack = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onBack);

    const base = { amount:rz.amount, currency:rz.currency, order_id:rz.orderId, email:c.email, contact:`+91${c.phone}` };
    try { rzp = start({ Razorpay, rz, base, succeeded, fail:err => finish(reject, err) }); }
    catch(err){ finish(reject, new PaymentError('failed', 'The payment could not start. Please try again.')); }

    function cancel(){
      try { rzp?.emit('payment.cancel'); } catch(err){}
      finish(reject, new PaymentError('cancelled', 'Payment cancelled.'));
    }
    return { done, cancel };
  }

  return {
    mode:'live', methods:['upi', 'card'], device, upiApps:() => upiApps(),
    async createOrder({ lines, customer }){
      const o = await call('/orders', { items:lines, customer });
      // no Razorpay order (not set up, or it was down): the UPI tab shows TranzLife's own QR code, and there is no card tab
      return { ...o, customer, methods:o.razorpay ? ['upi', 'card'] : ['upi'], upiMode:o.razorpay ? 'gateway' : 'company' };
    },
    prepare(order){ if (order?.razorpay) loadRazorpay().catch(() => {}); },

    // QR code on this page, for this order (Razorpay's "UPI QR, non-redirect" flow, for computers)
    showQr:(order, { onQr }) => track(order, ({ Razorpay, rz, base, succeeded, fail }) => {
      const rzp = new Razorpay({ key:rz.keyId });
      rzp.on('payment.upi.qr', d => {
        if (d?.status === 'created' && d.qr_url) onQr({ uri:d.qr_url, expiresAt:toMs(d.expires_on) || Date.now() + QR_MINUTES * 60000 });
        else if (d?.status === 'expired') onQr({ expired:true });
      });
      rzp.on('payment.success', succeeded);
      rzp.on('payment.error', err => fail(qrFailure(err)));
      rzp.createPayment({ ...base, method:'upi' }, { app:'any', flow:'qr' });
      return rzp;
    }),

    // phone: opens the chosen UPI app with the amount filled in (UPI intent)
    payUpi:(order, { app }) => track(order, ({ Razorpay, rz, base, succeeded, fail }) => {
      const rzp = new Razorpay({ key:rz.keyId });
      rzp.on('payment.success', succeeded);
      rzp.on('payment.error', err => fail(upiFailure(err, app)));
      rzp.createPayment({ ...base, method:'upi' }, { app });
      return rzp;
    }),

    // card: the details go straight to Razorpay, which opens the bank's OTP page in its own window
    payCard:(order, { card }) => track(order, ({ Razorpay, rz, base, succeeded, fail }) => {
      const rzp = new Razorpay({ key:rz.keyId });
      rzp.on('payment.success', succeeded);
      rzp.on('payment.error', err => fail(cardFailure(err)));
      rzp.createPayment({
        ...base, method:'card',
        'card[name]':card.name, 'card[number]':card.number, 'card[cvv]':card.cvv,
        'card[expiry_month]':String(card.expMonth).padStart(2, '0'), 'card[expiry_year]':String(card.expYear % 100).padStart(2, '0')
      });
      return rzp;
    }),

    submitUtr:(order, utr) => call(`/orders/${order.ref}/utr`, { utr }),
    status:order => call(`/orders/${order.ref}`)
  };
}

// ---------- demo: everything happens in the browser ----------
function demoGateway(){
  const orders = new Map(); // ref -> state
  const id = prefix => `${prefix}_demo${Math.random().toString(36).slice(2, 12)}`;
  const fakeUtr = () => String(5e11 + Math.floor(Math.random() * 4e11));
  const paid = ref => Object.assign(orders.get(ref), { status:'paid', utr:fakeUtr(), paymentId:id('pay') });
  // a { done, cancel } whose outcome the test controls decide
  function manual(){
    let y, n; const done = new Promise((a, b) => { y = a; n = b; });
    return { done, resolve:y, reject:n, cancel(){ n(new PaymentError('cancelled', 'Payment cancelled.')); } };
  }
  return {
    mode:'demo', methods:['upi', 'card'], device, upiApps:() => upiApps(),
    async createOrder({ lines, customer }){
      await wait(400);
      const priced = priceOrder(lines), ref = orderRef(new Date(), crypto.getRandomValues(new Uint8Array(8)));
      orders.set(ref, { status:'awaiting_payment', utr:null, reason:null, paymentId:null });
      return { ...priced, ref, customer, methods:['upi', 'card'], upiMode:'gateway' };
    },
    prepare(){},

    // A test QR code (it is not a UPI payment link, so no UPI app will pay it). The test controls under it play the
    // customer's phone: simulate('paid' | 'declined').
    showQr(order, { onQr }){
      const p = manual();
      const t = setTimeout(() => onQr({ uri:`TranzLife test QR code. Order ${order.ref}. Not a real payment.`, expiresAt:Date.now() + QR_MINUTES * 60000 }), 700);
      p.done.catch(() => clearTimeout(t));
      return { done:p.done, cancel:p.cancel, async simulate(outcome){
        await wait(900);
        if (outcome === 'declined') return p.reject(new PaymentError('failed', 'Your bank declined the payment, so no money was taken. Show the QR code again to retry, or pay by card.'));
        const s = paid(order.ref);
        p.resolve({ status:'paid', paymentId:s.paymentId, utr:s.utr });
      } };
    },

    // A test panel stands in for what happens inside the UPI app. It never asks for a UPI PIN: the PIN is only ever typed
    // in the customer's UPI app, so a site must never show a PIN box. The tester picks the outcome: 'paid' | 'declined' | null.
    payUpi(order, { app, ask }){
      const done = (async () => {
        const outcome = await ask({ kind:'upi', app:appName(app), amount:order.total });
        if (outcome === null) throw new PaymentError('cancelled', 'Payment cancelled.');
        await wait(900);
        if (outcome === 'declined') throw new PaymentError('failed', `Your bank declined the payment in ${appName(app)}, so no money was taken. Try again, or try another UPI app.`);
        const s = paid(order.ref);
        return { status:'paid', paymentId:s.paymentId, utr:s.utr };
      })();
      return { done, cancel(){} };
    },

    // test cards: a number ending 0002 is declined by the "bank"; any other valid number is approved after the OTP
    payCard(order, { card, ask }){
      const done = (async () => {
        await wait(600);
        const otp = await ask({ kind:'otp', amount:order.total, last4:card.number.slice(-4), brand:card.brand, phone4:order.customer.phone.slice(-4) });
        if (otp === null) throw new PaymentError('cancelled', 'Card authentication was cancelled.');
        await wait(900);
        if (!/^\d{4,8}$/.test(otp)) throw new PaymentError('failed', 'The OTP was not right, so your bank declined the payment. No money was taken.');
        if (card.number.endsWith('0002')) throw new PaymentError('failed', 'Your bank declined this card. No money was taken.');
        const s = paid(order.ref);
        return { status:'paid', paymentId:s.paymentId, utr:null };
      })();
      return { done, cancel(){} };
    },

    async status(order){ const s = orders.get(order.ref); return { status:s.status, utr:s.utr, reason:s.reason, paymentId:s.paymentId }; }
  };
}

function createGateway(){
  const api = (import.meta.env.VITE_PAYMENT_API || '').trim().replace(/\/+$/, '');
  return api ? liveGateway(api) : demoGateway();
}

export { createGateway, PaymentError };
