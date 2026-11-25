// Checkout dialog: delivery details -> payment -> receipt.
// The payment step has the methods on the left, the chosen one in the middle and the order summary on the right:
//   UPI on a computer: "Show QR code" -> a QR code for this order -> scan it with any UPI app -> PIN in the app -> confirmed by itself.
//   UPI on a phone:    tap Google Pay, PhonePe, Paytm, BHIM or another app -> PIN in the app -> confirmed by itself.
//   Card:              debit, credit or ATM card -> the bank's OTP in Razorpay's window -> confirmed by itself.
//   Without Razorpay:  the UPI tab shows TranzLife's own QR code -> the customer sends the UTR -> checked on the admin page.
// The payment logic is in ./gateway.js. Fires `tl:ordered` once the customer has paid (or sent a UTR).
import { state, thumbs } from '../../app/state.js';
import bhimLogo from '../../assets/payment/bhim.svg';
import gpayLogo from '../../assets/payment/gpay.svg';
import paytmLogo from '../../assets/payment/paytm.svg';
import phonepeLogo from '../../assets/payment/phonepe.svg';
import upiLogo from '../../assets/payment/upi.svg';
import { toast } from '../../components/toast.js';
import { PRODUCTS } from '../../data/products.js';
import { SHIPPING, STATES } from '../../data/shipping.js';
import { $, $$ } from '../../utils/dom.js';
import { inr } from '../../utils/format.js';
import { priceOrder } from '../../utils/order.js';
import { cardBrand, checkCustomer, formatCardNumber, formatExpiry, luhn, normaliseUtr, parseExpiry, validCvv } from '../../utils/payment.js';
import { createGateway } from './gateway.js';
import { qrSvg } from './qr-code.js';

const LOGOS = { gpay:gpayLogo, phonepe:phonepeLogo, paytm:paytmLogo, bhim:bhimLogo, upi:upiLogo };
// the apps shown under the QR code, in this order
const SCAN_WITH = [['gpay', 'Google Pay'], ['phonepe', 'PhonePe'], ['bhim', 'BHIM'], ['paytm', 'Paytm']];
const NETWORKS = [['visa', 'Visa'], ['mastercard', 'Mastercard'], ['rupay', 'RuPay'], ['amex', 'Amex'], ['maestro', 'Maestro']];
const BRAND_NAMES = { visa:'Visa', mastercard:'Mastercard', rupay:'RuPay', amex:'American Express', diners:'Diners Club', maestro:'Maestro' };
const METHOD_NAMES = { upi:'UPI', card:'Card' };
const TABS = {
  upi:{ label:'UPI', sub:'Pay by any UPI app' },
  card:{ label:'Credit / Debit / ATM Card', sub:'Visa, Mastercard, RuPay and more' }
};
const ICONS = {
  upi:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2.2"/><text x="12" y="14.7" text-anchor="middle" font-size="6.6" font-weight="800" font-family="system-ui,sans-serif" fill="currentColor" stroke="none">UPI</text></svg>',
  card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/><path d="m10.5 7.5 3 3-3 3"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  wait:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l.8 12.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7M9.5 7V4.8c0-.4.3-.8.8-.8h3.4c.5 0 .8.4.8.8V7"/></svg>'
};
// what sits blurred behind "Show QR code" (it is not a payment code)
const DECOY = 'TranzLife Biosciences. Tap Show QR code to get the real one.';
const QR_TEXT = {
  idle:'Tap <b>Show QR code</b>, then scan it with any UPI app on your phone.',
  loading:'Getting your QR code…',
  expired:'This QR code has expired. Show a new one to pay.'
};
const POLL_MS = 15000, PROCESSING_POLL_MS = 4000;
// after a quantity change on the payment step, wait this long for more clicks before making the order again
const REORDER_MS = 700;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
const utrText = u => String(u ?? '').replace(/(\d{4})(?=\d)/g, '$1 ');

let gw = null, box = null;
// upiView: 'qr' (computer: Razorpay's QR code) | 'apps' (phone: UPI app buttons) | 'company' (TranzLife's own QR + UTR)
let lines = [], customer = null, order = null, view = 'details', method = 'upi', upiView = 'qr';
let busy = false, payRun = 0, poll = 0, pollCheck = null, simClose = null, payCancel = null, lastFocus = null;
let qrPay = null, qrTimer = 0, reorderTimer = 0, reorderRun = 0;

// ---------- markup ----------
const field = (id, label, { type = 'text', auto = 'on', ph = '', full = false, mode = '' } = {}) =>
  `<div class="field${full ? ' full' : ''}"><label for="co-${id}">${label}</label><input id="co-${id}" name="${id}" type="${type}" autocomplete="${auto}" placeholder="${ph}"${mode ? ` inputmode="${mode}"` : ''} aria-describedby="co-${id}-err"><small class="co-ferr" id="co-${id}-err"></small></div>`;

const paneHead = title => `<div class="co-pane-head"><h5 class="co-pane-h">${title}</h5><img class="co-upi-mark" src="${LOGOS.upi}" alt="UPI" width="74" height="26"></div>`;
const logoRow = () => `<p class="co-qr-scan">Scan with any UPI app</p>
  <ul class="co-logos">${SCAN_WITH.map(([k, n]) => `<li><img src="${LOGOS[k]}" alt="${n}"></li>`).join('')}<li class="co-logo-more">+ more</li></ul>`;

// UPI, QR code. company: TranzLife's own UPI ID (shown straight away); otherwise Razorpay's, made on "Show QR code"
function qrPane(company){
  const label = company ? `UPI QR code: pay ${inr(order.total)} to ${order.upi.name}` : '';
  return `${paneHead('Scan QR and pay')}
    <div class="co-qrcard" data-qr-state="${company ? 'live' : 'idle'}">
      <p class="co-qr-amt"><small>Amount</small><b data-amt></b></p>
      <div class="co-qrbox">
        <div class="co-qr-img"${company ? '' : ' aria-hidden="true"'}>${qrSvg(company ? order.upi.uri : DECOY, label)}</div>
        ${company ? '' : '<div class="co-qr-cover"><button class="co-qr-show" type="button" data-qr-show>Show QR code</button><span class="co-spin" aria-hidden="true"></span></div>'}
      </div>
      ${company ? `<p class="co-qr-to">Paying <b>${esc(order.upi.name)}</b><br>${esc(order.upi.id)}</p>` : '<p class="co-qr-msg" data-qr-msg aria-live="polite"></p>'}
      ${logoRow()}
    </div>
    ${gw.mode === 'demo' && !company ? '<div class="co-note co-test-note co-qr-test" hidden><b>Test mode</b><span>Play the customer\'s phone:</span><button class="co-link" type="button" data-qr-sim="paid">Customer scans and pays</button><button class="co-link" type="button" data-qr-sim="declined">Bank declines</button></div>' : ''}
    <p class="co-note">${ICONS.lock}<span>${company
      ? 'Open any UPI app, scan this code and pay. The amount and your order number fill in by themselves. Then send us the UTR below.'
      : 'You enter your UPI PIN only in your UPI app. We never ask for it on this website. This page confirms your order by itself as soon as you pay.'}</span></p>`;
}

// UPI on a phone: one button per app (a phone cannot scan its own screen)
function appsPane(){
  return `${paneHead('Pay with a UPI app')}
    <p class="co-amt-line">Amount <b data-amt></b></p>
    <div class="co-apps">${gw.upiApps().map(a => `<button class="co-app" type="button" data-app="${a.id}" data-app-name="${esc(a.name)}">${LOGOS[a.id]
      ? `<img src="${LOGOS[a.id]}" alt=""><b class="sr">Pay with ${esc(a.name)}</b>`
      : `<span class="co-app-any">${ICONS.phone}</span><b><span class="sr">Pay with </span>${esc(a.name)}</b>`}<i aria-hidden="true">→</i></button>`).join('')}</div>
    <p class="co-note">${ICONS.lock}<span>Your UPI app opens with the amount filled in. Enter your UPI PIN there, then come back here: your order confirms by itself. We never ask for your UPI PIN on this website.</span></p>
    ${gw.mode === 'demo' ? '<p class="co-note co-test-note"><b>Test mode</b><span>A test screen shows what happens in the UPI app and lets you pick the outcome.</span></p>' : ''}`;
}

function cardPane(){
  const demo = gw.mode === 'demo';
  return `
  <form class="co-cardform" novalidate>
    <div class="co-pane-head"><h5 class="co-pane-h">Pay by card</h5></div>
    <p class="co-pane-sub">Credit, debit and ATM cards</p>
    <ul class="co-nets" aria-label="Cards we accept">${NETWORKS.map(([k, n]) => `<li data-net="${k}">${n}</li>`).join('')}</ul>
    <div class="co-grid">
      <div class="field full"><label for="co-cnum">Card number</label><div class="co-cnum"><input id="co-cnum" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456" maxlength="23" aria-describedby="co-cnum-err"><span class="co-brand" data-brand></span></div><small class="co-ferr" id="co-cnum-err"></small></div>
      <div class="field full"><label for="co-cname">Name on card</label><input id="co-cname" autocomplete="cc-name" placeholder="As printed on the card" aria-describedby="co-cname-err"><small class="co-ferr" id="co-cname-err"></small></div>
      <div class="field"><label for="co-cexp">Expiry</label><input id="co-cexp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5" aria-describedby="co-cexp-err"><small class="co-ferr" id="co-cexp-err"></small></div>
      <div class="field"><label for="co-ccvv">CVV</label><input id="co-ccvv" type="password" inputmode="numeric" autocomplete="cc-csc" placeholder="•••" maxlength="4" aria-describedby="co-ccvv-err"><small class="co-ferr" id="co-ccvv-err"></small></div>
    </div>
    ${demo ? '<p class="co-note co-test-note"><b>Test mode</b><span>Test cards: <code>4111 1111 1111 1111</code> is approved and <code>4000 0000 0000 0002</code> is declined. Any future expiry, any CVV, any 4 to 8 digit OTP.</span></p>' : ''}
    <button class="btn-cream co-cta" type="submit"><span>Pay <b data-amt></b></span><i aria-hidden="true">→</i></button>
    <p class="co-note">${ICONS.lock}<span>${demo ? 'In test mode your card details stay in this browser.' : 'Your card details go straight to Razorpay, our payment partner, over an encrypted connection. We never see or store them.'} Your bank asks for an OTP to approve the payment.</span></p>
  </form>`;
}

function template(){
  const demo = gw.mode === 'demo';
  return `
<div class="co-scrim" data-co-close></div>
<div class="co-panel">
 <div class="co-scroll" data-lenis-prevent>
  <header class="co-head">
    <div class="co-title"><p class="co-eyebrow">${ICONS.lock} Secure checkout</p><h3 id="coTitle">Checkout</h3></div>
    <ol class="co-steps" aria-label="Checkout steps"><li data-step="details"><span>1</span>Details</li><li data-step="pay"><span>2</span>Payment</li><li data-step="done"><span>3</span>Done</li></ol>
    <button class="x co-x" type="button" data-co-close aria-label="Close checkout">×</button>
  </header>
  ${demo ? '<p class="co-test"><b>Test mode</b><span>No real money moves. Connect the payment server to take real payments.</span></p>' : ''}
  <div class="co-body">
    <div class="co-main">
      <form class="co-view co-details" data-view="details" novalidate>
        <h4 class="co-h" tabindex="-1">Where should we deliver?</h4>
        <div class="co-grid">
          ${field('name', 'Full name', { auto:'name', ph:'Your name', full:true })}
          ${field('phone', 'Mobile number', { type:'tel', auto:'tel-national', ph:'98765 43210', mode:'tel' })}
          ${field('email', 'Email', { type:'email', auto:'email', ph:'you@example.com' })}
          ${field('address', 'Address', { auto:'street-address', ph:'House no., street, area', full:true })}
          ${field('city', 'Town or city', { auto:'address-level2', ph:'City' })}
          ${field('pincode', 'PIN code', { auto:'postal-code', ph:'560001', mode:'numeric' })}
          <div class="field full"><label for="co-state">State</label><select id="co-state" name="state" autocomplete="address-level1" aria-describedby="co-state-err"><option value="">Choose your state</option>${STATES.map(s => `<option>${s}</option>`).join('')}</select><small class="co-ferr" id="co-state-err"></small></div>
        </div>
        <p class="co-err" role="alert" hidden></p>
        <button class="btn-cream co-cta" type="submit"><span>Continue to payment</span><i aria-hidden="true">→</i></button>
      </form>

      <div class="co-view co-pay" data-view="pay" hidden>
        <div class="co-pay-head"><h4 class="co-h" tabindex="-1">Complete payment</h4><span class="co-secure">${ICONS.lock}100% secure</span></div>
        <p class="co-ref">Order <b data-ref></b> · deliver to <span data-to></span> · <button class="co-link" type="button" data-co-back>Edit details</button></p>
        <p class="co-reorder" role="status"><span class="co-spin" aria-hidden="true"></span><span>Updating your order for the new amount…</span></p>
        <div class="co-paybox">
          <div class="co-methods" role="tablist" aria-label="Payment method" aria-orientation="vertical">
            ${gw.methods.map(m => `<button class="co-method" type="button" role="tab" id="coTab-${m}" aria-controls="coPane-${m}" data-m="${m}"><span class="co-method-ic">${ICONS[m]}</span><span><b>${TABS[m].label}</b><small>${TABS[m].sub}</small></span></button>`).join('')}
          </div>
          <div class="co-panes">
            <p class="co-err" role="alert" hidden></p>
            <div class="co-pane" id="coPane-upi" role="tabpanel" aria-labelledby="coTab-upi" data-pane="upi"></div>
            <div class="co-pane" id="coPane-card" role="tabpanel" aria-labelledby="coTab-card" data-pane="card" hidden>${cardPane()}</div>
            <form class="co-pane co-utr" novalidate hidden>
              <p class="co-step"><span>2</span>After paying, send us the UTR</p>
              <div class="field"><label for="co-utr">UTR / UPI reference number</label><input id="co-utr" name="utr" inputmode="numeric" autocomplete="off" maxlength="16" placeholder="12 digits, for example 402312345678" aria-describedby="co-utr-err co-utr-help"><small class="co-ferr" id="co-utr-err"></small></div>
              <details class="co-where" id="co-utr-help"><summary>Where do I find the UTR?</summary><ul>
                <li><b>Google Pay:</b> open the payment, then "UPI transaction ID"</li>
                <li><b>PhonePe:</b> History, open the payment, then "UTR"</li>
                <li><b>Paytm:</b> open the payment, then "UPI Ref. No."</li>
                <li><b>BHIM or your bank's app:</b> "UPI Ref No" or "RRN"</li>
              </ul></details>
              <button class="btn-cream co-cta" type="submit"><span>I've paid · send UTR</span><i aria-hidden="true">→</i></button>
              <p class="co-note">${ICONS.lock}<span>We match your UTR with the payment in our bank account, then confirm your order.</span></p>
            </form>
          </div>
        </div>
      </div>

      <div class="co-view co-done" data-view="done" aria-live="polite" hidden></div>
    </div>

    <details class="co-summary">
      <summary><span>Order summary</span><b data-sum-total></b></summary>
      <div class="co-items"></div>
      <dl class="co-totals"></dl>
      <p class="co-tax">Prices include all taxes.</p>
      <p class="sr" role="status" data-sum-live></p>
    </details>
  </div>
 </div>
  <div class="co-busy" hidden><span class="co-spin" aria-hidden="true"></span><p role="status"></p><button class="co-link" type="button" data-busy-cancel hidden>Cancel payment</button></div>
  <div class="co-sim" hidden><div class="co-sim-card" role="dialog" aria-modal="true" aria-labelledby="coSimTitle"></div></div>
</div>`;
}

// ---------- small helpers ----------
const els = sel => $$(sel, box);
// covers the dialog while something is happening; `cancellable` adds a Cancel button (waiting for a UPI app or the bank)
function setBusy(msg, cancellable = false){
  busy = !!msg; const b = $('.co-busy', box), x = $('[data-busy-cancel]', b);
  b.hidden = !msg; $('p', b).textContent = msg || '';
  x.hidden = !cancellable; if (cancellable) x.focus({ preventScroll:true });
}
function showErr(msg){ const e = $(`[data-view="${view}"] .co-err`, box); if (!e) return; e.hidden = !msg; e.textContent = msg || ''; }
function setFieldErr(id, msg){
  const input = $(`#co-${id}`, box), out = $(`#co-${id}-err`, box);
  if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (out) out.textContent = msg || '';
}
const setText = (sel, text) => els(sel).forEach(el => { el.textContent = text; });

function setView(v){
  view = v;
  els('[data-view]').forEach(el => { el.hidden = el.dataset.view !== v; });
  const steps = ['details', 'pay', 'done'];
  els('.co-steps li').forEach(li => {
    const i = steps.indexOf(li.dataset.step), at = steps.indexOf(v);
    li.classList.toggle('on', i === at); li.classList.toggle('past', i < at);
    if (i === at) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
  });
  box.classList.toggle('co-is-done', v === 'done');
  const h = $(`[data-view="${v}"] .co-h`, box); if (h) h.focus({ preventScroll:true });
  $('.co-scroll', box).scrollTop = 0;
}

// The order summary. Each item has − n + (hidden on the receipt, which shows "n × price" instead). − on the last one of a
// product is a bin that takes it out of the order, except for the only product left. `focus` = { id, d }: the button that
// was just clicked, which keeps the focus after the redraw.
function renderSummary(p, focus){
  const only = p.items.length === 1;
  $('.co-items', box).innerHTML = p.items.map(i => {
    const name = esc(i.name), last = i.qty === 1;
    return `<div class="co-item">${thumbs[i.id] ? `<img src="${thumbs[i.id]}" alt="">` : '<span></span>'}
      <div><b>${name}</b><small><span class="co-q">${i.qty} × </span>${inr(i.price)}<span class="co-each"> each</span></small>
        <div class="co-qty" role="group" aria-label="${name}: ${i.qty}">
          <button type="button" data-qty="-1" data-id="${i.id}" aria-label="${last ? `Remove ${name} from the order` : `One less ${name}`}"${last && only ? ' disabled title="Your order needs at least one product"' : ''}>${last && !only ? ICONS.trash : '−'}</button>
          <output>${i.qty}</output>
          <button type="button" data-qty="1" data-id="${i.id}" aria-label="One more ${name}"${i.qty >= SHIPPING.maxQty ? ` disabled title="Up to ${SHIPPING.maxQty} of each product"` : ''}>+</button>
        </div>
      </div><span>${inr(i.total)}</span></div>`;
  }).join('');
  if (focus){
    const same = $(`.co-qty button[data-id="${focus.id}"][data-qty="${focus.d}"]:not(:disabled)`, box);
    (same || $(`.co-qty button[data-id="${focus.id}"]:not(:disabled)`, box) || $('.co-summary summary', box)).focus({ preventScroll:true });
  }
  const more = p.shipping ? `<p class="co-free">Add ${inr(SHIPPING.freeFrom - p.subtotal)} more for free delivery.</p>` : '';
  $('.co-totals', box).innerHTML = `<div><dt>Subtotal</dt><dd>${inr(p.subtotal)}</dd></div><div><dt>Delivery</dt><dd>${p.shipping ? inr(p.shipping) : 'Free'}</dd></div>${more}<div class="co-grand"><dt>Total amount</dt><dd>${inr(p.total)}</dd></div>`;
  setText('[data-sum-total]', inr(p.total));
  setText('[data-amt]', inr(p.total));
}

// shows only the tabs this order can use and builds the UPI tab for this device; loads Razorpay ahead of the first tap
function fillPayment(o){
  setText('[data-ref]', o.ref);
  $('[data-to]', box).textContent = `${o.customer.city}, ${o.customer.pincode}`;
  els('.co-method').forEach(b => { b.hidden = !o.methods.includes(b.dataset.m); });
  upiView = o.upiMode === 'company' ? 'company' : gw.device() === 'desktop' ? 'qr' : 'apps';
  renderUpi();
  $('#co-utr', box).value = ''; setFieldErr('utr', '');
  gw.prepare(o);
}
function renderUpi(){
  stopQr();
  $('[data-pane="upi"]', box).innerHTML = upiView === 'apps' ? appsPane() : qrPane(upiView === 'company');
  setText('[data-amt]', inr(order.total));
  if (upiView === 'qr') setQrState('idle');
}
const shownMethods = () => els('.co-method').filter(b => !b.hidden).map(b => b.dataset.m);

// ---------- step 1: details ----------
async function submitDetails(e){
  e.preventDefault(); if (busy) return;
  const checked = checkCustomer(Object.fromEntries(new FormData(e.target))), errors = checked.errors;
  ['name', 'phone', 'email', 'address', 'city', 'pincode', 'state'].forEach(k => setFieldErr(k, errors?.[k]));
  if (errors){ showErr('Please check the highlighted details.'); $(`#co-${Object.keys(errors)[0]}`, box).focus(); return; }
  customer = checked.customer; showErr('');
  setBusy('Creating your order…');
  try { order = await gw.createOrder({ lines, customer }); }
  catch(err){ setBusy(''); showErr(err.message); return; }
  setBusy('');
  renderSummary(order); fillPayment(order);
  setView('pay'); selectMethod(order.methods.includes(method) ? method : order.methods[0], true);
}

// ---------- quantities in the order summary ----------
// − / + in the summary: re-prices the order, keeps the bag in step (cart.js listens for `tl:qty`), and on the payment step
// makes the order again, because the order (and its Razorpay order and QR code) is for the old amount.
function changeQty(id, d){
  if (busy || view === 'done') return;
  const line = lines.find(l => l.id === id); if (!line) return;
  const n = line.qty + d;
  if (n > SHIPPING.maxQty) return toast(`You can order up to ${SHIPPING.maxQty} of each product`);
  if (n < 1 && lines.length === 1) return; // an order needs a product (the button is disabled too)
  const next = n < 1 ? lines.filter(l => l.id !== id) : lines.map(l => l.id === id ? { ...l, qty:n } : l);
  let priced;
  try { priced = priceOrder(next); } catch(err){ return toast(err.message); }
  lines = next;
  renderSummary(priced, { id, d });
  const name = PRODUCTS.find(p => p.id === id)?.name || 'The product';
  $('[data-sum-live]', box).textContent = `${n < 1 ? `${name} removed.` : `${name}: ${n}.`} Total ${inr(priced.total)}.`;
  document.dispatchEvent(new CustomEvent('tl:qty', { detail:{ id, qty:Math.max(0, n) } }));
  if (view === 'pay') queueReorder();
}

// Payment step: nothing can be paid until the new order exists (the payment area is greyed out). Waits for the last of
// several quick clicks, then creates the order again for the same customer.
function queueReorder(){
  stopQr(); showErr('');
  order = null; payRun++;
  box.classList.add('co-reordering');
  clearTimeout(reorderTimer);
  const run = ++reorderRun;
  reorderTimer = setTimeout(async () => {
    let o;
    try { o = await gw.createOrder({ lines, customer }); }
    catch(err){
      if (run !== reorderRun) return;
      box.classList.remove('co-reordering');
      setView('details'); showErr(`${err.message} Please try again.`);
      return;
    }
    if (run !== reorderRun || view !== 'pay') return;
    box.classList.remove('co-reordering');
    // the server's prices (the same maths), keeping the focus on the − / + the customer was using
    const f = document.activeElement?.closest?.('.co-qty button');
    order = o; renderSummary(order, f && box.contains(f) ? { id:f.dataset.id, d:f.dataset.qty } : null); fillPayment(order);
    selectMethod(order.methods.includes(method) ? method : order.methods[0], true);
  }, REORDER_MS);
}
function cancelReorder(){ clearTimeout(reorderTimer); reorderRun++; box?.classList.remove('co-reordering'); }

// ---------- step 2: pay ----------
function selectMethod(m, force){
  if (m === method && !force) return;
  if (m !== 'upi') stopQr();
  method = m; showErr('');
  els('.co-method').forEach(b => { const on = b.dataset.m === m; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
  els('[data-pane]').forEach(p => { p.hidden = p.dataset.pane !== m; });
  // only TranzLife's own QR code needs a UTR: Razorpay reports its payments by itself
  $('.co-utr', box).hidden = !(m === 'upi' && upiView === 'company');
}

// --- UPI on a computer: the QR code for this order. It lasts 10 minutes; the page confirms by itself once it is paid.
function setQrState(st){
  const card = $('.co-qrcard', box); if (!card || upiView !== 'qr') return;
  card.dataset.qrState = st;
  const btn = $('[data-qr-show]', card), msg = $('[data-qr-msg]', card), test = $('.co-qr-test', box), img = $('.co-qr-img', card);
  btn.textContent = st === 'expired' ? 'Show new QR code' : 'Show QR code';
  msg.innerHTML = st === 'live'
    ? '<span class="co-dot" aria-hidden="true"></span><span>Waiting for your payment</span><span class="co-qr-left" aria-hidden="true"> · <b data-qr-left></b> left</span>'
    : QR_TEXT[st];
  if (test) test.hidden = st !== 'live';
  if (st !== 'live'){ img.innerHTML = qrSvg(DECOY, ''); img.setAttribute('aria-hidden', 'true'); }
}

function showQr(){
  if (busy || !order || qrPay) return;
  showErr(''); const run = ++payRun;
  setQrState('loading');
  const pay = gw.showQr(order, { onQr:q => {
    if (run !== payRun) return;
    if (q.expired) return stopQr('expired');
    setQrState('live');
    const img = $('.co-qr-img', box);
    img.innerHTML = qrSvg(q.uri, `UPI QR code: pay ${inr(order.total)} to TranzLife Biosciences`);
    img.removeAttribute('aria-hidden');
    startQrTimer(q.expiresAt);
  } });
  qrPay = pay;
  pay.done.then(r => {
    if (run !== payRun) return;
    endQr();
    placed({ status:r.status, paymentId:r.paymentId, utr:r.utr, via:'upi', paidWith:'UPI · QR code' });
  }, err => {
    if (run !== payRun) return;
    endQr();
    // Razorpay can't show a QR code: fall back to TranzLife's own one if there is one
    if (err.code === 'qr_unavailable' && order.upi){
      upiView = 'company'; renderUpi(); selectMethod('upi', true);
      showErr("We can't make a QR code for this order right now, so here is TranzLife's own UPI QR code. After paying, send us the UTR.");
      return;
    }
    setQrState('idle');
    if (err.code === 'qr_unavailable') showErr("We can't show a QR code right now. Please pay by card, or open this page on your phone and pay with your UPI app.");
    else if (err.code !== 'cancelled') showErr(err.message);
  });
}
function endQr(){ qrPay = null; clearInterval(qrTimer); qrTimer = 0; }
// stops the QR code payment that is showing (tab change, expiry, closing); `st` is what the QR card shows next
function stopQr(st = 'idle'){
  if (!qrPay) return;
  const p = qrPay; payRun++; endQr(); p.cancel();
  setQrState(st);
}
function startQrTimer(until){
  clearInterval(qrTimer);
  const tick = () => {
    const left = Math.max(0, Math.ceil((until - Date.now()) / 1000)), out = $('[data-qr-left]', box);
    if (out) out.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    if (!left) stopQr('expired');
  };
  tick(); qrTimer = setInterval(tick, 1000);
}

// --- UPI on a phone: an app button was tapped. gw.payUpi runs straight from the tap (no await before it), because a
// UPI app can only be opened by one.
function payUpi(btn){
  if (busy || !order) return;
  const app = btn.dataset.app, name = btn.dataset.appName;
  showErr(''); const run = ++payRun;
  const pay = gw.payUpi(order, { app, ask });
  if (gw.mode === 'live'){ payCancel = pay.cancel; setBusy(`Waiting for ${name}… Enter your UPI PIN in ${name}, then come back here.`, true); }
  pay.done.then(r => {
    if (run !== payRun) return;
    payCancel = null; setBusy('');
    placed({ status:r.status, paymentId:r.paymentId, utr:r.utr, via:'upi', paidWith:`UPI · ${name}` });
  }, err => {
    if (run !== payRun) return;
    payCancel = null; setBusy('');
    if (err.code !== 'cancelled') showErr(err.message);
    btn.focus({ preventScroll:true });
  });
}

// --- TranzLife's own QR code: the customer sends the UTR
async function sendUtr(e){
  e.preventDefault(); if (busy || !order) return;
  const raw = $('#co-utr', box).value;
  if (!normaliseUtr(raw)){ setFieldErr('utr', 'A UTR has 12 digits. Copy it from the payment details in your UPI app.'); $('#co-utr', box).focus(); return; }
  setFieldErr('utr', ''); showErr('');
  setBusy('Sending your payment details…');
  try {
    const r = await gw.submitUtr(order, raw);
    setBusy('');
    placed({ status:r.status, utr:r.utr, via:'upi', paidWith:'UPI · QR code' });
  } catch(err){
    setBusy('');
    if (['invalid', 'utr_used', 'rejected_utr'].includes(err.code)){ setFieldErr('utr', err.message); $('#co-utr', box).focus(); }
    else showErr(err.message);
  }
}

// --- card: runs straight from the Pay button (Razorpay opens the bank's OTP page in a window, which needs the tap)
function payCard(){
  if (busy || !order) return;
  const card = readCard(); if (!card) return;
  showErr(''); const run = ++payRun, live = gw.mode === 'live';
  const pay = gw.payCard(order, { card, ask });
  payCancel = live ? pay.cancel : null;
  setBusy(live ? 'Finish the payment in the window that opened. Your bank will ask for an OTP.' : 'Contacting your bank…', live);
  const last4 = card.number.slice(-4), paidWith = card.brand ? `${card.brand} card ending ${last4}` : `Card ending ${last4}`;
  pay.done.then(r => {
    if (run !== payRun) return;
    payCancel = null; setBusy('');
    placed({ status:r.status, paymentId:r.paymentId, via:'card', paidWith });
  }, err => {
    if (run !== payRun) return;
    payCancel = null; setBusy('');
    if (err.code !== 'cancelled') showErr(`${err.message} Try again, or pay by UPI.`);
  });
}

function readCard(){
  const number = $('#co-cnum', box).value.replace(/\D/g, ''), brand = cardBrand(number);
  const name = $('#co-cname', box).value.trim(), exp = parseExpiry($('#co-cexp', box).value), cvv = $('#co-ccvv', box).value.trim();
  const errs = {
    cnum: !luhn(number) ? 'Check the card number.' : null,
    cname: name.length < 2 ? 'Add the name on the card.' : null,
    cexp: !exp ? 'Enter a valid expiry date (MM/YY).' : null,
    ccvv: !validCvv(cvv, brand) ? `Enter the ${brand === 'amex' ? '4' : '3'}-digit CVV.` : null
  };
  Object.entries(errs).forEach(([k, v]) => setFieldErr(k, v));
  const first = Object.keys(errs).find(k => errs[k]);
  if (first){ $(`#co-${first}`, box).focus(); return null; }
  return { number, brand:BRAND_NAMES[brand] || '', name, cvv, expMonth:exp.month, expYear:exp.year };
}

// test mode only: a panel standing in for the bank's OTP page (card) or for the UPI app (UPI on a phone)
const simCard = req => `<p class="co-sim-tag">Test bank · card authentication</p><h4 id="coSimTitle">Enter the OTP</h4><p>We sent a one-time password to your mobile ending ${req.phone4} for ${inr(req.amount)} on your ${esc(req.brand || 'card')}${req.brand ? ' card' : ''} ending ${req.last4}.</p><form novalidate><label class="sr" for="co-otp">One-time password</label><input id="co-otp" inputmode="numeric" maxlength="8" autocomplete="one-time-code" placeholder="Any 4 to 8 digits"><div class="co-sim-btns"><button class="btn-cream" type="submit"><span>Verify</span><i aria-hidden="true">→</i></button><button class="co-link" type="button" data-sim="no">Cancel</button></div></form>`;
// The UPI stand-in shows what happens on the customer's phone, step by step, and lets the tester pick the outcome.
// It has no PIN box on purpose: the UPI PIN is typed only inside the UPI app, never on a website.
const simUpi = req => {
  const app = esc(req.app), amt = inr(req.amount);
  return `<p class="co-sim-tag">Test mode · inside ${app}</p>
    <h4 id="coSimTitle">Pay ${amt}</h4>
    <ol class="co-sim-steps">
      <li><span>${app} opens on the customer's phone, with the payment already filled in.</span></li>
      <li><span>${app} shows <b>Pay ${amt} to TranzLife Biosciences</b>. The customer picks their bank account and enters their <b>UPI PIN in ${app}</b>.</span></li>
      <li><span>The bank approves, Razorpay tells our server, and this page confirms by itself.</span></li>
    </ol>
    <p class="co-sim-safe">${ICONS.lock}<span>The UPI PIN never reaches this website or Razorpay. Only the customer's bank checks it.</span></p>
    <div class="co-sim-btns">
      <button class="btn-cream" type="button" data-sim="paid"><span>Customer pays ${amt}</span><i aria-hidden="true">→</i></button>
      <div class="co-sim-alt"><button class="co-link" type="button" data-sim="declined">Bank declines</button><button class="co-link" type="button" data-sim="no">Customer backs out</button></div>
    </div>`;
};

// resolves with the OTP typed (card), the outcome picked (UPI: 'paid' | 'declined'), or null when cancelled
function ask(req){
  setBusy('');
  return new Promise(resolve => {
    const sim = $('.co-sim', box), card = $('.co-sim-card', sim), back = document.activeElement;
    card.innerHTML = req.kind === 'upi' ? simUpi(req) : simCard(req);
    sim.hidden = false;
    const done = v => { sim.hidden = true; sim.onclick = null; simClose = null; card.innerHTML = ''; if (back && box.contains(back)) back.focus(); setBusy(v === null ? '' : 'Confirming your payment…'); resolve(v); };
    simClose = () => done(null);
    sim.onclick = e => { const b = e.target.closest('[data-sim]'); if (b) done(b.dataset.sim === 'no' ? null : b.dataset.sim); };
    const form = $('form', card);
    if (form) form.onsubmit = e => { e.preventDefault(); done($('input', card).value.trim()); };
    ($('input', card) || $('[data-sim]', card)).focus();
  });
}

// ---------- step 3: submitted / confirmed ----------
// st: { status:'paid'|'processing'|'verifying', utr, paymentId, via:'upi'|'card', paidWith }
function placed(st){
  renderDone(st); setView('done');
  document.dispatchEvent(new CustomEvent('tl:ordered', { detail:{ ref:order.ref, total:order.total, status:st.status, method:st.via } }));
  if (st.status !== 'paid') startPolling(st);
}

const DONE_TEXT = {
  paid:{ title:'Payment confirmed', lead:first => `Thank you, ${first}. Your order is confirmed.` },
  // Razorpay has the payment, the bank's final word is still on its way
  processing:{ title:'Payment received', status:'Confirming your payment with your bank. This page updates by itself.',
    lead:(first, phone) => `Thank you, ${first}. Your bank is finishing the payment, which usually takes under a minute. If it doesn't go through, any money taken is returned automatically, and we'll contact you on +91 ${phone}.` },
  // TranzLife's own QR code: TranzLife checks the UTR by hand
  verifying:{ title:'Payment submitted', status:'Verifying your payment. This page updates by itself.',
    lead:(first, phone) => `Thank you, ${first}. We're matching your UTR with the payment in our bank account. Once it's verified, your order is confirmed and we'll contact you on +91 ${phone}.` }
};

function renderDone({ status, utr, paymentId, via, paidWith }){
  const o = order, c = o.customer, first = esc(c.name.split(' ')[0]), paid = status === 'paid', demo = gw.mode === 'demo';
  const t = DONE_TEXT[status] || DONE_TEXT.verifying, showUtr = via === 'upi' && utr;
  $('[data-view="done"]', box).innerHTML = `
    <div class="co-done-mark${paid ? '' : ' wait'}">${paid ? ICONS.check : ICONS.wait}</div>
    <h4 class="co-h" tabindex="-1">${t.title}</h4>
    <p class="co-lead">${t.lead(first, esc(c.phone))}</p>
    ${t.status ? `<p class="co-status"><span class="co-dot" aria-hidden="true"></span>${t.status}</p>` : ''}
    <dl class="co-receipt">
      <div><dt>Order number</dt><dd>${esc(o.ref)}</dd></div>
      <div><dt>Amount</dt><dd>${inr(o.total)}</dd></div>
      <div${showUtr ? '' : ' class="full"'}><dt>Paid with</dt><dd>${esc(paidWith || METHOD_NAMES[via] || 'UPI')}</dd></div>
      ${showUtr ? `<div><dt>UTR</dt><dd>${esc(utrText(utr))}</dd></div>` : ''}
      ${paymentId ? `<div class="full"><dt>Payment ID</dt><dd>${esc(paymentId)}</dd></div>` : ''}
      <div class="full"><dt>Delivering to</dt><dd>${esc(c.name)}, ${esc(c.address)}, ${esc(c.city)}, ${esc(c.state)} ${esc(c.pincode)} · +91 ${esc(c.phone)}</dd></div>
    </dl>
    ${demo && paid ? '<p class="co-note co-test-note"><b>Test payment</b><span>No money moved.</span></p>' : ''}
    <button class="btn-cream co-cta" type="button" data-co-close><span>Continue shopping</span><i aria-hidden="true">→</i></button>`;
}

// asks the server every few seconds whether the payment has been confirmed (or, for a UTR, rejected)
function startPolling(st){
  stopPolling();
  pollCheck = async () => {
    if (!order || view !== 'done') return;
    let s;
    try { s = await gw.status(order); } catch(err){ return; }
    if (s.status === 'paid'){ stopPolling(); renderDone({ ...st, status:'paid', utr:s.utr || st.utr, paymentId:s.paymentId || st.paymentId }); toast('Payment confirmed. Thank you!'); }
    else if (s.status === 'rejected'){ stopPolling(); rejected(s); }
  };
  poll = setInterval(pollCheck, st.status === 'processing' ? PROCESSING_POLL_MS : POLL_MS);
}
function stopPolling(){ clearInterval(poll); poll = 0; }

// back to TranzLife's QR code with the reason, so the customer can send a corrected UTR
function rejected(s){
  setView('pay'); selectMethod('upi', true);
  $('#co-utr', box).value = s.utr || '';
  showErr(`We couldn't verify UTR ${utrText(s.utr)}: ${s.reason} Check the number in your UPI app and send it again, or contact us with order number ${order.ref}.`);
}

// ---------- open / close ----------
function trapFocus(e){
  const layer = !$('.co-sim', box).hidden ? $('.co-sim-card', box) : $('.co-panel', box);
  const f = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,summary,[tabindex="0"]', layer).filter(el => el.tabIndex >= 0 && el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
}

function build(){
  gw = createGateway();
  if (!gw.methods.includes(method)) method = gw.methods[0];
  box = document.createElement('div');
  box.className = 'co'; box.id = 'checkoutDialog'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'coTitle');
  box.innerHTML = template();
  document.body.appendChild(box);

  $('.co-details', box).addEventListener('submit', submitDetails);
  $('.co-details', box).addEventListener('input', e => { if (e.target.name) setFieldErr(e.target.name, ''); });
  $('.co-utr', box).addEventListener('submit', sendUtr);
  $('#co-utr', box).addEventListener('input', () => setFieldErr('utr', ''));
  const cardForm = $('.co-cardform', box);
  cardForm.addEventListener('submit', e => { e.preventDefault(); payCard(); });
  const num = $('#co-cnum', box), exp = $('#co-cexp', box), cvv = $('#co-ccvv', box), badge = $('[data-brand]', box);
  num.addEventListener('input', () => {
    num.value = formatCardNumber(num.value);
    const b = cardBrand(num.value);
    badge.textContent = BRAND_NAMES[b] || '';
    els('.co-nets li').forEach(li => li.classList.toggle('on', li.dataset.net === b));
    $('.co-nets', box).classList.toggle('picked', !!b);
    cvv.maxLength = b === 'amex' ? 4 : 3; setFieldErr('cnum', '');
  });
  exp.addEventListener('input', e => { if (e.inputType !== 'deleteContentBackward') exp.value = formatExpiry(exp.value); setFieldErr('cexp', ''); });
  cvv.addEventListener('input', () => { cvv.value = cvv.value.replace(/\D/g, ''); setFieldErr('ccvv', ''); });
  $('#co-cname', box).addEventListener('input', () => setFieldErr('cname', ''));

  box.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-co-close]')) return closeCheckout();
    if (t.closest('[data-busy-cancel]')) return payCancel?.();
    if (t.closest('[data-co-back]')){ stopQr(); cancelReorder(); order = null; setView('details'); return; }
    const q = t.closest('.co-qty button'); if (q) return changeQty(q.dataset.id, +q.dataset.qty);
    const m = t.closest('.co-method'); if (m) return selectMethod(m.dataset.m);
    if (t.closest('[data-qr-show]')) return showQr();
    const s = t.closest('[data-qr-sim]');
    if (s && qrPay?.simulate){
      $('.co-qr-test', box).hidden = true;
      $('[data-qr-msg]', box).textContent = 'Confirming your payment…';
      return qrPay.simulate(s.dataset.qrSim);
    }
    const a = t.closest('[data-app]'); if (a) return payUpi(a);
  });
  // arrow keys move between the payment methods
  $('.co-methods', box).addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const ids = shownMethods(), i = ids.indexOf(method);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : (i + (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1) + ids.length) % ids.length;
    selectMethod(ids[next]); $(`#coTab-${ids[next]}`, box).focus();
  });
  box.addEventListener('keydown', e => {
    if (e.key === 'Tab') return trapFocus(e);
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    if (simClose) return simClose();
    if (payCancel) return payCancel();
    closeCheckout();
  });
  // check again as soon as the shopper comes back to this tab (from their UPI app, say)
  document.addEventListener('visibilitychange', () => { if (!document.hidden && poll) pollCheck?.(); });
  // the summary is open on wide screens and folded on phones
  const wide = matchMedia('(min-width: 861px)');
  const fold = () => { $('.co-summary', box).open = wide.matches; };
  fold(); wide.addEventListener('change', fold);
}

// opens the checkout for the given bag lines [{ id, qty }]; returns a message if the bag cannot be checked out
function openCheckout(bagLines){
  let priced;
  try { priced = priceOrder(bagLines); } catch(err){ return err.message; }
  if (!box) build();
  stopQr(); cancelReorder();
  lines = bagLines.map(l => ({ ...l })); order = null; payRun++; stopPolling();
  renderSummary(priced);
  showErr(''); setView('details');
  lastFocus = document.activeElement;
  box.hidden = false; document.documentElement.classList.add('co-open');
  requestAnimationFrame(() => box.classList.add('open'));
  if (state.lenis) state.lenis.stop();
  const first = $$('.co-details input, .co-details select', box).find(el => !el.value) || $('.co-details .co-cta', box);
  setTimeout(() => first.focus({ preventScroll:true }), 60);
  return null;
}

function closeCheckout(){
  if (busy || !box || box.hidden) return;
  if (simClose) simClose();
  stopQr(); cancelReorder(); stopPolling(); payRun++;
  box.classList.remove('open'); document.documentElement.classList.remove('co-open');
  setTimeout(() => { if (!box.classList.contains('open')) box.hidden = true; }, 350);
  if (state.lenis) state.lenis.start();
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

export { openCheckout, closeCheckout };
