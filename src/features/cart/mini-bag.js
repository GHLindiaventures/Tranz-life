// Mini bag bar: a slim, nav-bar style bar at the bottom centre that stays on screen while the bag has items,
// until the order is placed. Left side (opens the bag): thumbnails, total, item count, free-delivery hint.
// Middle: − n + for the product added last ("active": its thumbnail comes first, with a ring). − on the last one removes it,
// and the control moves to the next product. Right side: Checkout.
// When a product is added (or its quantity changes here) the text flashes "✓ <product> added" / "<product> × 3" for a moment.
// It steps aside while the bag drawer or the checkout is open, and comes back when they close.
import { cart, thumbs } from '../../app/state.js';
import { PRODUCTS } from '../../data/products.js';
import { SHIPPING } from '../../data/shipping.js';
import { $ } from '../../utils/dom.js';
import { inr } from '../../utils/format.js';

const FLASH_MS = 2400;
const TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l.8 12.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7M9.5 7V4.8c0-.4.3-.8.8-.8h3.4c.5 0 .8.4.8.8V7"/></svg>';
let bar = null, actions = {}, shown = false, blocked = false, flashTimer = 0, summary = '', active = null;

const product = id => PRODUCTS.find(p => p.id === id);
const isBlocked = () => document.documentElement.classList.contains('co-open') || !!$('#drawer')?.classList.contains('open');
// fewer thumbnails on narrow phones, where the − / + control needs the room
const narrow = matchMedia('(max-width: 420px)');

function build(){
  bar = document.createElement('div');
  bar.className = 'mb'; bar.id = 'miniBag'; bar.hidden = true;
  bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Your bag');
  bar.innerHTML = `
    <button class="mb-sum" type="button">
      <span class="mb-thumbs" aria-hidden="true"></span>
      <span class="mb-text"><b class="mb-line"></b><small class="mb-ship"></small></span>
    </button>
    <div class="mb-qty" role="group">
      <button class="mb-step" type="button" data-step="-1"></button>
      <b class="mb-n" aria-hidden="true"></b>
      <button class="mb-step" type="button" data-step="1">+</button>
    </div>
    <button class="btn-cream mb-go" type="button"><span>Checkout</span><i aria-hidden="true">→</i></button>
    <span class="mb-track" aria-hidden="true"><i></i></span>
    <p class="sr mb-live" role="status" aria-live="polite"></p>`;
  document.body.appendChild(bar);
  $('.mb-sum', bar).addEventListener('click', () => actions.viewBag?.());
  $('.mb-go', bar).addEventListener('click', () => actions.checkout?.());
  $('.mb-qty', bar).addEventListener('click', e => { const b = e.target.closest('[data-step]'); if (b && !b.disabled) step(+b.dataset.step); });

  // step aside while the bag drawer or the checkout is open (only react when that actually changes)
  const watch = () => { const b = isBlocked(); if (b !== blocked){ blocked = b; syncMiniBag(); } };
  new MutationObserver(watch).observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
  const drawer = $('#drawer'); if (drawer) new MutationObserver(watch).observe(drawer, { attributes:true, attributeFilter:['class'] });
  narrow.addEventListener('change', () => { if (cart.size) render(); });
}

// − or + on the bar: changes the active product through the bag's own rule (cart.js setQty), which redraws this bar
function step(d){
  const id = active, p = product(id); if (!p) return;
  const n = (cart.get(id) || 0) + d;
  if (!actions.setQty?.(id, n)) return;
  if (!cart.size){ $('#bagBtn')?.focus({ preventScroll:true }); return; } // the bag is empty, so the bar is going away
  flash(n > 0 ? `${p.short} × ${n}` : `${p.short} removed`,
    `${n > 0 ? `${p.name}: ${n} in your bag.` : `${p.name} removed.`} ${summary}.`);
}

// shows `text` in place of the summary for a moment, and tells screen readers `say`
function flash(text, say){
  const line = $('.mb-line', bar);
  clearTimeout(flashTimer);
  line.textContent = text; line.classList.add('flash');
  flashTimer = setTimeout(() => { line.textContent = summary; line.classList.remove('flash'); }, FLASH_MS);
  $('.mb-live', bar).textContent = say;
}

function render(addedId){
  if (addedId) active = addedId;
  if (!cart.has(active)) active = [...cart.keys()].pop(); // the active product was removed: the newest one left
  const lines = [...cart].map(([id, qty]) => ({ id, qty, p:product(id) }));
  const count = lines.reduce((n, l) => n + l.qty, 0), total = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const items = `${count} item${count === 1 ? '' : 's'}`;
  summary = `${inr(total)} · ${items}`; // total first, so a narrow bar cuts the count, not the money

  // the active product first
  const ordered = [lines.find(l => l.id === active), ...lines.filter(l => l.id !== active)];
  const max = narrow.matches ? 2 : 3, shownLines = ordered.slice(0, max), extra = ordered.length - shownLines.length;
  $('.mb-thumbs', bar).innerHTML = shownLines.map(l => `<span class="t${l.id === active ? ' on' : ''}${l.id === addedId ? ' new' : ''}">${thumbs[l.id] ? `<img src="${thumbs[l.id]}" alt="">` : ''}<em>${l.qty}</em></span>`).join('')
    + (extra > 0 ? `<span class="t more">+${extra}</span>` : '');

  const left = SHIPPING.freeFrom - total;
  $('.mb-ship', bar).textContent = left > 0 ? `Add ${inr(left)} for free delivery` : 'Free delivery ✓';
  $('.mb-ship', bar).classList.toggle('done', left <= 0);
  $('.mb-track i', bar).style.transform = `scaleX(${Math.min(1, total / SHIPPING.freeFrom)})`;
  $('.mb-sum', bar).setAttribute('aria-label', `View bag: ${items}, ${inr(total)}`);

  // − n + for the active product (− on the last one is a bin: it takes the product out of the bag)
  const p = product(active), n = cart.get(active), minus = $('[data-step="-1"]', bar), plus = $('[data-step="1"]', bar);
  $('.mb-qty', bar).setAttribute('aria-label', `${p.name} in your bag: ${n}`);
  $('.mb-n', bar).textContent = n;
  minus.innerHTML = n === 1 ? TRASH : '−';
  minus.setAttribute('aria-label', n === 1 ? `Remove ${p.name} from the bag` : `One less ${p.name}`);
  plus.setAttribute('aria-label', `One more ${p.name}`);
  plus.disabled = n >= SHIPPING.maxQty;
  plus.title = plus.disabled ? `Up to ${SHIPPING.maxQty} of each product` : '';

  if (addedId){
    const a = product(addedId);
    flash(`✓ ${a.short} added`, `${a.name} added. ${items} in your bag, ${inr(total)}.`);
    bar.classList.remove('pop'); void bar.offsetWidth; bar.classList.add('pop');
  } else if (!$('.mb-line', bar).classList.contains('flash')){
    $('.mb-line', bar).textContent = summary;
  }
}

function setShown(on){
  if (on === shown) return;
  shown = on;
  document.documentElement.classList.toggle('mb-on', on);
  if (on){ bar.hidden = false; requestAnimationFrame(() => { if (shown) bar.classList.add('show'); }); }
  else { bar.classList.remove('show'); setTimeout(() => { if (!shown) bar.hidden = true; }, 450); }
}

// call after every bag change; `addedId` = the product just added (flashes it and makes it the active product)
function syncMiniBag(addedId){
  if (!bar) build();
  blocked = isBlocked();
  if (cart.size) render(addedId);
  setShown(cart.size > 0 && !blocked);
}

// viewBag / checkout / setQty: what the bar's parts do (supplied by cart.js)
function initMiniBag(handlers){ actions = handlers; }

export { initMiniBag, syncMiniBag };
