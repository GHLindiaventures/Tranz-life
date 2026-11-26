// SQL for orders and what belongs to them: items, Razorpay payments and the event history.
// Reading always returns whole orders (row + items + payments + events) in one shape, built by toOrder().

function toOrder(row, items = [], payments = [], events = []){
  return {
    ref:row.ref, customerId:row.customer_id, status:row.status, deliveryStep:row.delivery_step,
    customer:{ name:row.ship_name, phone:row.ship_phone, email:row.ship_email, address:row.ship_address,
      city:row.ship_city, state:row.ship_state, pincode:row.ship_pincode },
    items:items.map(i => ({ id:i.product_id, name:i.name, price:i.price, qty:i.qty, total:i.price * i.qty })),
    subtotal:row.subtotal, shipping:row.shipping, total:row.total, currency:row.currency,
    upiId:row.upi_id, razorpayOrderId:row.razorpay_order_id,
    utr:row.utr, utrSubmittedAt:row.utr_submitted_at, rejectedReason:row.rejected_reason, reviewedAt:row.reviewed_at,
    paidAt:row.paid_at, createdAt:row.created_at,
    payments:payments.map(p => ({ id:p.id, method:p.method, vpa:p.vpa, rrn:p.rrn, amount:p.amount, source:p.source, at:p.created_at })),
    events:events.map(e => ({ type:e.type, detail:e.detail, at:e.created_at }))
  };
}

// loads the items, payments and events for many order rows at once (three queries, however many orders)
async function withDetails(db, rows){
  if (!rows.length) return [];
  const refs = rows.map(r => r.ref);
  const [items, payments, events] = await Promise.all([
    db.query('SELECT * FROM order_items WHERE order_ref = ANY($1) ORDER BY product_id', [refs]),
    db.query('SELECT * FROM payments WHERE order_ref = ANY($1) ORDER BY created_at', [refs]),
    db.query('SELECT * FROM order_events WHERE order_ref = ANY($1) ORDER BY id', [refs])
  ]);
  const of = (list, ref) => list.filter(x => x.order_ref === ref);
  return rows.map(r => toOrder(r, of(items, r.ref), of(payments, r.ref), of(events, r.ref)));
}

// ---------- reading ----------
async function getOrder(db, ref){
  const row = await db.one('SELECT * FROM orders WHERE ref = $1', [ref]);
  return row ? (await withDetails(db, [row]))[0] : null;
}

async function getOrderByRazorpayId(db, razorpayOrderId){
  const row = await db.one('SELECT * FROM orders WHERE razorpay_order_id = $1', [razorpayOrderId]);
  return row ? (await withDetails(db, [row]))[0] : null;
}

async function listCustomerOrders(db, customerId){
  return withDetails(db, await db.query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 100', [customerId]));
}

// for the admin page: one status (or 'all'), the most recently active first
async function listOrders(db, status, limit = 300){
  const rows = await db.query(
    `SELECT * FROM orders WHERE ($1 = 'all' OR status = $1)
     ORDER BY coalesce(utr_submitted_at, paid_at, created_at) DESC LIMIT $2`, [status, limit]);
  return withDetails(db, rows);
}

async function countOrdersByStatus(db){
  const rows = await db.query('SELECT status, count(*) AS n FROM orders GROUP BY status');
  const counts = { awaiting_payment:0, verifying:0, paid:0, rejected:0 };
  for (const r of rows) counts[r.status] = Number(r.n);
  return counts;
}

// unpaid Razorpay orders from the last few days, to ask Razorpay about in case a webhook never arrived
async function recentUnpaidRazorpayOrders(db, days, limit){
  return withDetails(db, await db.query(
    `SELECT * FROM orders WHERE razorpay_order_id IS NOT NULL AND status = 'awaiting_payment'
     AND created_at > now() - make_interval(days => $1) ORDER BY created_at DESC LIMIT $2`, [days, limit]));
}

// is this UTR already on another order that is being checked or is paid?
async function utrInUse(db, utr, exceptRef){
  return !!await db.one("SELECT 1 FROM orders WHERE utr = $1 AND ref <> $2 AND status IN ('verifying', 'paid')", [utr, exceptRef]);
}

// was this UTR checked and turned down for this order before?
async function utrRejectedBefore(db, ref, utr){
  return !!await db.one("SELECT 1 FROM order_events WHERE order_ref = $1 AND type = 'utr_rejected' AND detail->>'utr' = $2", [ref, utr]);
}

// ---------- writing ----------
async function insertOrder(db, { ref, customerId, customer:c, priced, upiId, razorpayOrderId }){
  await db.query(
    `INSERT INTO orders (ref, customer_id, ship_name, ship_phone, ship_email, ship_address, ship_city, ship_state, ship_pincode,
       subtotal, shipping, total, currency, upi_id, razorpay_order_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [ref, customerId, c.name, c.phone, c.email, c.address, c.city, c.state, c.pincode,
      priced.subtotal, priced.shipping, priced.total, priced.currency, upiId, razorpayOrderId]);
  for (const i of priced.items){
    await db.query('INSERT INTO order_items (order_ref, product_id, name, price, qty) VALUES ($1, $2, $3, $4, $5)', [ref, i.id, i.name, i.price, i.qty]);
  }
}

// the order's status, locked until the transaction ends (so two payment reports cannot both mark it paid)
async function lockOrderStatus(db, ref){
  return (await db.one('SELECT status FROM orders WHERE ref = $1 FOR UPDATE', [ref]))?.status ?? null;
}

async function saveUtr(db, ref, utr){
  await db.query("UPDATE orders SET status = 'verifying', utr = $2, utr_submitted_at = now(), rejected_reason = NULL WHERE ref = $1", [ref, utr]);
}

async function markPaid(db, ref, { utr = null, reviewed = false } = {}){
  await db.query(
    `UPDATE orders SET status = 'paid', paid_at = now(), rejected_reason = NULL, utr = coalesce($2, utr),
       reviewed_at = CASE WHEN $3 THEN now() ELSE reviewed_at END WHERE ref = $1`, [ref, utr, reviewed]);
}

async function markRejected(db, ref, reason){
  await db.query("UPDATE orders SET status = 'rejected', rejected_reason = $2, reviewed_at = now() WHERE ref = $1", [ref, reason]);
}

async function saveDeliveryStep(db, ref, step){
  await db.query('UPDATE orders SET delivery_step = $2 WHERE ref = $1', [ref, step]);
}

// returns true when the payment is new (false when this Razorpay payment was already recorded)
async function addPayment(db, ref, p, source){
  const row = await db.one(
    `INSERT INTO payments (id, order_ref, method, vpa, rrn, amount, source) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING RETURNING id`,
    [p.id, ref, p.method || 'upi', p.vpa || null, p.acquirer_data?.rrn || null, p.amount, source]);
  return !!row;
}

async function addEvent(db, ref, type, detail = {}){
  await db.query('INSERT INTO order_events (order_ref, type, detail) VALUES ($1, $2, $3)', [ref, type, JSON.stringify(detail)]);
}

export {
  getOrder, getOrderByRazorpayId, listCustomerOrders, listOrders, countOrdersByStatus, recentUnpaidRazorpayOrders,
  utrInUse, utrRejectedBefore, insertOrder, lockOrderStatus, saveUtr, markPaid, markRejected, saveDeliveryStep, addPayment, addEvent
};
