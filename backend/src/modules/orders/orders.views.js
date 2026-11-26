// What each audience sees of an order. Each function turns a whole order (orders.repo.js) into an answer.

const firstPayment = o => o.payments[0] || null;

// anyone with the order number (the checkout page polling): no address or contact details
function publicStatus(o){
  const p = firstPayment(o);
  return {
    ref:o.ref, status:o.status, total:o.total, utr:o.utr || p?.rrn || null,
    reason:o.status === 'rejected' ? o.rejectedReason : null, paymentId:p?.id || null
  };
}

// the timeline in My Orders: when it was placed, paid, packed, shipped, out for delivery and delivered
const TIMELINE_EVENTS = ['placed', 'paid', 'utr_confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
function timeline(o){
  const steps = [];
  for (const e of o.events.filter(e => TIMELINE_EVENTS.includes(e.type))){
    const step = e.type === 'utr_confirmed' ? 'paid' : e.type;
    if (!steps.some(s => s.step === step)) steps.push({ step, at:e.at });
  }
  return steps;
}

// the customer, in My Orders: their own order in full
function customerView(o){
  const p = firstPayment(o);
  return {
    ref:o.ref, createdAt:o.createdAt, status:o.status, deliveryStep:o.deliveryStep,
    items:o.items, subtotal:o.subtotal, shipping:o.shipping, total:o.total,
    deliverTo:o.customer,
    payment:{ method:p?.method || (o.utr ? 'upi' : null), utr:o.utr || p?.rrn || null, paidAt:o.paidAt },
    rejectedReason:o.status === 'rejected' ? o.rejectedReason : null,
    timeline:timeline(o)
  };
}

// the admin page: everything, in the shape server/admin.html has always used
function adminView(o){
  const [first, ...extra] = o.payments;
  const utrHistory = o.events.filter(e => e.type.startsWith('utr_')).map(e => ({
    utr:e.detail.utr, at:e.at, result:e.type.slice(4), ...(e.detail.reason ? { reason:e.detail.reason } : {})
  }));
  return {
    ref:o.ref, status:o.status, createdAt:o.createdAt, paidAt:o.paidAt, deliveryStep:o.deliveryStep, loggedIn:!!o.customerId,
    customer:o.customer, items:o.items, subtotal:o.subtotal, shipping:o.shipping, total:o.total,
    utr:o.utr, utrSubmittedAt:o.utrSubmittedAt, utrHistory, rejectedReason:o.rejectedReason,
    payment:first ? { id:first.id, method:first.method, vpa:first.vpa, rrn:first.rrn, at:first.at, source:first.source } : null,
    extraPayments:extra.map(p => ({ id:p.id, at:p.at }))
  };
}

export { publicStatus, customerView, adminView };
