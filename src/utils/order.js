// Order maths shared by the checkout and the payment server.
// Prices always come from the catalogue, never from what the browser sends.
import { PRODUCTS } from '../data/products.js';
import { SHIPPING } from '../data/shipping.js';

class OrderError extends Error {
  constructor(message){ super(message); this.name = 'OrderError'; }
}

// lines: [{ id, qty }] -> priced items and totals in rupees
function priceOrder(lines){
  if (!Array.isArray(lines) || !lines.length) throw new OrderError('Your bag is empty.');
  if (lines.length > SHIPPING.maxLines) throw new OrderError(`An order can have up to ${SHIPPING.maxLines} different products.`);
  const seen = new Set();
  const items = lines.map(line => {
    const id = String(line?.id ?? ''), qty = Number(line?.qty);
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) throw new OrderError('One of the products in your bag is no longer available.');
    if (seen.has(id)) throw new OrderError(`${p.name} is in the order twice.`);
    if (!Number.isInteger(qty) || qty < 1 || qty > SHIPPING.maxQty) throw new OrderError(`You can order 1 to ${SHIPPING.maxQty} of ${p.name}.`);
    seen.add(id);
    return { id, name:p.name, price:p.price, qty, total:p.price * qty };
  });
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const shipping = subtotal >= SHIPPING.freeFrom ? 0 : SHIPPING.fee;
  return { items, subtotal, shipping, total:subtotal + shipping, currency:SHIPPING.currency };
}

// the gateway takes amounts in paise
const toPaise = rupees => Math.round(rupees * 100);

// order numbers like TL-261123-7K3QXM2A: date plus 8 random characters (40 bits), so they cannot be guessed
const REF_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const REF_PATTERN = /^TL-\d{6}-[2-9A-HJ-NP-Z]{8}$/;
function orderRef(date, bytes){
  const ymd = date.toISOString().slice(2, 10).replace(/-/g, '');
  const tail = Array.from(bytes.slice(0, 8), b => REF_CHARS[b % 32]).join('');
  return `TL-${ymd}-${tail}`;
}

export { OrderError, priceOrder, toPaise, orderRef, REF_PATTERN };
