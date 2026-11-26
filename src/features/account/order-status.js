// How an order's progress reads to the customer in My Orders: a short status, and the tracking steps.
const TRACK = [
  { key:'placed', label:'Ordered' },
  { key:'paid', label:'Payment confirmed' },
  { key:'packed', label:'Packed' },
  { key:'shipped', label:'Shipped' },
  { key:'out_for_delivery', label:'Out for delivery' },
  { key:'delivered', label:'Delivered' }
];

// { label, tone, note } for the order's current state. tone: wait | ok | done | bad (the colour of its dot)
function orderStage(o){
  if (o.status === 'rejected') return { label:'Payment not found', tone:'bad', note:o.rejectedReason || 'We could not find this payment. Please contact us with your order number.' };
  if (o.status === 'awaiting_payment') return { label:'Payment pending', tone:'wait', note:'We have not received the payment for this order yet.' };
  if (o.status === 'verifying') return { label:'Verifying payment', tone:'wait', note:"We're matching your UPI reference with our bank account. This usually takes a few hours." };
  const step = TRACK.find(s => s.key === o.deliveryStep);
  if (step?.key === 'delivered') return { label:'Delivered', tone:'done' };
  return { label:step ? step.label : 'Order confirmed', tone:'ok' };
}

// the tracking steps with done / current flags and the time of each step that has happened
function trackSteps(o){
  const reached = o.status === 'paid' ? Math.max(1, TRACK.findIndex(s => s.key === o.deliveryStep)) : 0;
  const at = Object.fromEntries((o.timeline || []).map(t => [t.step, t.at]));
  return TRACK.map((s, i) => ({ ...s, done:i <= reached, current:i === reached, at:at[s.key] || null }));
}

const day = iso => iso ? new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '';
const dayTime = iso => iso ? new Date(iso).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'numeric', minute:'2-digit' }) : '';

export { orderStage, trackSteps, day, dayTime };
