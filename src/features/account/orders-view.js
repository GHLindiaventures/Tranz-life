// My Orders on the account page: the list of orders, and one order with its tracking steps, items, address and price.
import { inr } from '../../utils/format.js';
import { esc } from '../../utils/html.js';
import { SHOTS } from '../products/product-images.js';
import { account } from './account-state.js';
import { day, dayTime, orderStage, trackSteps } from './order-status.js';

const thumb = id => SHOTS[id] ? `<img src="${SHOTS[id]}" alt="" width="64" height="64" loading="lazy">` : '<span class="ac-noimg"></span>';
const chip = o => { const s = orderStage(o); return `<span class="ac-chip ${s.tone}"><i aria-hidden="true"></i>${esc(s.label)}</span>`; };
const problem = err => `<div class="ac-card ac-empty"><p>${esc(err.message)}</p><button class="ac-btn ghost" type="button" data-retry>Try again</button></div>`;

function orderCard(o){
  const shown = o.items.slice(0, 2), more = o.items.length - shown.length;
  return `<a class="ac-card ac-order" href="#orders/${esc(o.ref)}">
    <div class="ac-order-items">
      ${shown.map(i => `<div class="ac-item">${thumb(i.id)}<p><b>${esc(i.name)}</b><small>Qty ${i.qty} · ${inr(i.total)}</small></p></div>`).join('')}
      ${more > 0 ? `<p class="ac-more">+ ${more} more item${more > 1 ? 's' : ''}</p>` : ''}
    </div>
    <div class="ac-order-state">${chip(o)}<small>Placed ${esc(day(o.createdAt))}</small></div>
    <div class="ac-order-total"><b>${inr(o.total)}</b><small>${esc(o.ref)}</small></div>
  </a>`;
}

async function renderOrderList(main){
  main.innerHTML = '<h1 class="ac-h">My Orders</h1><p class="ac-loading">Loading your orders…</p>';
  let orders;
  try { orders = await account.orders(); } catch(err){ main.innerHTML = `<h1 class="ac-h">My Orders</h1>${problem(err)}`; return; }
  main.innerHTML = `<h1 class="ac-h">My Orders</h1>` + (orders.length
    ? `<div class="ac-list">${orders.map(orderCard).join('')}</div>`
    : `<div class="ac-card ac-empty"><h2>No orders yet</h2><p>When you order while logged in, it shows up here with its delivery steps.</p><a class="ac-btn" href="index.html#shop">Shop now</a></div>`);
}

function tracking(o){
  const stage = orderStage(o);
  if (o.status !== 'paid') return `<div class="ac-note ${stage.tone}">${chip(o)}<p>${esc(stage.note)}</p></div>`;
  return `<ol class="ac-track">${trackSteps(o).map(s =>
    `<li class="${s.done ? 'done' : ''}${s.current ? ' current' : ''}"><i aria-hidden="true"></i><b>${esc(s.label)}</b><small>${esc(dayTime(s.at))}</small></li>`).join('')}</ol>`;
}

async function renderOrderDetail(main, ref){
  main.innerHTML = '<a class="ac-back" href="#orders">← All orders</a><p class="ac-loading">Loading the order…</p>';
  let o;
  try { o = await account.order(ref); } catch(err){ main.innerHTML = `<a class="ac-back" href="#orders">← All orders</a>${problem(err)}`; return; }
  const to = o.deliverTo, pay = o.payment || {};
  main.innerHTML = `
    <a class="ac-back" href="#orders">← All orders</a>
    <header class="ac-order-head"><div><h1 class="ac-h">Order ${esc(o.ref)}</h1><p>Placed on ${esc(day(o.createdAt))}</p></div>${chip(o)}</header>
    <section class="ac-card"><h2 class="ac-sub">Tracking</h2>${tracking(o)}</section>
    <div class="ac-two">
      <section class="ac-card">
        <h2 class="ac-sub">Items</h2>
        <ul class="ac-lines">${o.items.map(i => `<li class="ac-item">${thumb(i.id)}<p><b>${esc(i.name)}</b><small>${i.qty} × ${inr(i.price)}</small></p><span>${inr(i.total)}</span></li>`).join('')}</ul>
        <dl class="ac-price">
          <div><dt>Items</dt><dd>${inr(o.subtotal)}</dd></div>
          <div><dt>Delivery</dt><dd>${o.shipping ? inr(o.shipping) : 'Free'}</dd></div>
          <div class="total"><dt>Total</dt><dd>${inr(o.total)}</dd></div>
        </dl>
      </section>
      <section class="ac-card">
        <h2 class="ac-sub">Delivery address</h2>
        <p class="ac-addr"><b>${esc(to.name)}</b>${esc(to.address)}<br>${esc(to.city)}, ${esc(to.state)} ${esc(to.pincode)}<br>Phone: +91 ${esc(to.phone)}</p>
        <h2 class="ac-sub">Payment</h2>
        <p class="ac-addr">${pay.method === 'card' ? 'Card' : 'UPI'}${pay.utr ? ` · UTR ${esc(pay.utr)}` : ''}${pay.paidAt ? `<br>Paid ${esc(dayTime(pay.paidAt))}` : ''}</p>
      </section>
    </div>
    <p class="ac-help">Need help with this order? <a href="index.html#contact">Contact us</a> with your order number.</p>`;
}

function renderOrders(main, ref){
  return ref ? renderOrderDetail(main, ref) : renderOrderList(main);
}

export { renderOrders };
