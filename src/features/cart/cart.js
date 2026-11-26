// Bag drawer: add, change quantity, subtotal, checkout. setQty is the one quantity rule for the drawer, the mini bag bar
// and the checkout's order summary.
import { cart, thumbs } from '../../app/state.js';
import { toast } from '../../components/toast.js';
import { PRODUCTS } from '../../data/products.js';
import { SHIPPING } from '../../data/shipping.js';
import { openCheckout } from '../checkout/checkout.js';
import { initMiniBag, syncMiniBag } from './mini-bag.js';
import { $ } from '../../utils/dom.js';
import { inr } from '../../utils/format.js';

// redraws the bag drawer, the bag count and the mini bag bar (addedId: the product just added)
function renderCart(addedId){
  const list = $('#dList'); let total = 0, count = 0;
  if (!cart.size){ list.innerHTML = '<p class="d-empty">Your bag is empty. Add a product to get started.</p>'; }
  else list.innerHTML = [...cart].map(([id, q]) => { const p = PRODUCTS.find(x => x.id === id); total += p.price*q; count += q;
    return `<div class="d-item">${thumbs[id] ? `<img src="${thumbs[id]}" alt="">` : '<div></div>'}<div><b>${p.name}</b><small>${inr(p.price)}</small></div><div class="qty"><button data-id="${id}" data-d="-1" aria-label="Remove one">−</button>${q}<button data-id="${id}" data-d="1" aria-label="Add one">+</button></div></div>`; }).join('');
  $('#dTotal').textContent = inr(total);
  const c = $('#bagCount'); c.textContent = count; c.classList.toggle('has', count > 0);
  syncMiniBag(addedId);
}

// adds one, bumps the bag icon and flashes the product on the mini bag bar (features/cart/mini-bag.js)
function addToCart(id, btn){
  const p = PRODUCTS.find(x => x.id === id);
  if ((cart.get(id) || 0) >= SHIPPING.maxQty) return toast(`You can order up to ${SHIPPING.maxQty} of ${p.name}`);
  cart.set(id, (cart.get(id) || 0) + 1); renderCart(id);
  const bag = $('#bagBtn'); bag.classList.remove('bump'); void bag.offsetWidth; bag.classList.add('bump');
  if (btn && btn.classList.contains('add')){
    // keep the button's own markup (its + icon) to put back, even after quick repeat clicks
    btn.dataset.label ??= btn.innerHTML;
    btn.classList.add('ok'); btn.textContent = 'Added ✓';
    clearTimeout(btn._added);
    btn._added = setTimeout(() => { btn.classList.remove('ok'); btn.innerHTML = btn.dataset.label; }, 1400);
  }
}

// sets a product's quantity in the bag (0 or less removes it) and redraws; the one rule used by the bag drawer, the mini bag
// bar's − / + and the checkout's order summary. Returns false (with a message) above the per-product limit.
function setQty(id, n){
  if (n > SHIPPING.maxQty){ toast(`You can order up to ${SHIPPING.maxQty} of each product`); return false; }
  if (n <= 0) cart.delete(id); else cart.set(id, n);
  renderCart();
  return true;
}

function openBag(open){
  $('#drawer').classList.toggle('open', open); $('#scrim').classList.toggle('open', open); $('#drawer').setAttribute('aria-hidden', !open);
}

function startCheckout(){
  if (!cart.size) return toast('Your bag is empty');
  openBag(false);
  const problem = openCheckout([...cart].map(([id, qty]) => ({ id, qty })));
  if (problem) toast(problem);
}

// wires the bag drawer, quantity buttons and checkout (features/checkout); a placed order empties the bag
function initCart(){
  document.addEventListener('click', e => {
    const a = e.target.closest('.add, .mini-add'); if (a && a.dataset.id) addToCart(a.dataset.id, a);
    const q = e.target.closest('.qty button');
    if (q) setQty(q.dataset.id, (cart.get(q.dataset.id) || 0) + +q.dataset.d);
  });
  $('#bagBtn').addEventListener('click', () => openBag(true));
  $('#closeBag').addEventListener('click', () => openBag(false));
  $('#scrim').addEventListener('click', () => openBag(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') openBag(false); });
  $('#checkout').addEventListener('click', startCheckout);
  initMiniBag({ viewBag:() => { openBag(true); $('#closeBag').focus({ preventScroll:true }); }, checkout:startCheckout, setQty });
  // quantities changed in the checkout's order summary: the bag follows
  document.addEventListener('tl:qty', e => setQty(e.detail.id, e.detail.qty));
  document.addEventListener('tl:ordered', () => { cart.clear(); renderCart(); });
}

export { renderCart, initCart };
