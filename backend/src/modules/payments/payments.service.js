// Payments through Razorpay (UPI QR code, UPI apps, cards). An order becomes paid only when Razorpay itself reports a
// captured payment for that order and the full amount, whichever way we hear about it first:
//   checkout  the customer's browser says it paid (we check the signature, then ask Razorpay)
//   webhook   Razorpay calls us (signed with the webhook secret)
//   check     we ask Razorpay, when the customer's page or the admin page looks at an unpaid order
import { badRequest, conflict, HttpError } from '../../lib/errors.js';
import { toPaise } from '../../lib/shared.js';
import * as repo from '../orders/orders.repo.js';

const PAYMENT_ID = /^pay_[A-Za-z0-9]{6,40}$/;
const CHECK_EVERY_MS = 8000; // ask Razorpay about one order at most this often

function createPaymentService({ db, razorpay, log = console }){
  const lastCheck = new Map();

  // records one Razorpay payment and marks the order paid. Safe to call again with the same payment.
  async function applyPayment(order, p, source){
    if (!p || p.order_id !== order.razorpayOrderId || p.status !== 'captured') return false;
    if (p.amount !== toPaise(order.total) || p.currency !== 'INR'){
      log.error(`[razorpay] ${order.ref}: payment ${p.id} is for ${p.currency} ${p.amount / 100}, not ₹${order.total}. Not marked paid; check it in the Razorpay dashboard.`);
      return false;
    }
    return db.tx(async t => {
      if (!await repo.addPayment(t, order.ref, p, source)) return true; // already recorded
      const status = await repo.lockOrderStatus(t, order.ref);
      if (status === 'paid'){
        await repo.addEvent(t, order.ref, 'paid_twice', { paymentId:p.id });
        log.warn(`[razorpay] ${order.ref} was already paid, and payment ${p.id} paid ₹${order.total} again. Refund it from the Razorpay dashboard.`);
        return true;
      }
      if (status === 'verifying') log.warn(`[razorpay] ${order.ref}: paid by Razorpay after UTR ${order.utr} was sent. Check whether the customer paid twice.`);
      await repo.markPaid(t, order.ref);
      await repo.addEvent(t, order.ref, 'paid', { via:'razorpay', paymentId:p.id, source });
      log.info(`[orders] ${order.ref} paid: ₹${order.total}, Razorpay ${p.id} (${source})`);
      return true;
    });
  }

  // asks Razorpay for the order's payments (when the webhook has not arrived, or is not set up). Never throws.
  async function check(order, everyMs = CHECK_EVERY_MS){
    if (!razorpay || !order.razorpayOrderId || order.status === 'paid') return;
    if (Date.now() - (lastCheck.get(order.ref) || 0) < everyMs) return;
    lastCheck.set(order.ref, Date.now());
    if (lastCheck.size > 5000) lastCheck.clear();
    try {
      for (const p of await razorpay.orderPayments(order.razorpayOrderId)) if (await applyPayment(order, p, 'check')) break;
    } catch(err){ log.error(`[razorpay] ${order.ref}: ${err.message}`); }
  }

  // the browser's checkout says a payment went through: check its signature, then ask Razorpay for the truth
  async function confirmFromCheckout(order, { paymentId, signature }){
    if (!razorpay || !order.razorpayOrderId) throw conflict('state', 'This order is not paid through Razorpay.');
    const id = String(paymentId ?? '');
    if (!PAYMENT_ID.test(id)) throw badRequest('Missing payment details.');
    if (signature && !razorpay.validPaymentSignature({ orderId:order.razorpayOrderId, paymentId:id, signature:String(signature) })){
      log.warn(`[razorpay] ${order.ref}: a payment signature for ${id} did not match`);
      throw badRequest('We could not verify this payment. If money left your account, contact us with your order number.', 'bad_signature');
    }
    await check(order, 0);
  }

  // Razorpay calling us. rawBody is the exact bytes it sent (the signature covers them).
  async function handleWebhook(rawBody, signature){
    if (!razorpay?.webhooks) throw new HttpError(404, 'not_found', 'Not found.');
    if (!razorpay.validWebhook(rawBody, signature)) throw badRequest('Bad signature.', 'bad_signature');
    let event;
    try { event = JSON.parse(rawBody.toString('utf8')); } catch(err){ throw badRequest('The request was not valid JSON.'); }
    const p = event.payload?.payment?.entity;
    if ((event.event === 'payment.captured' || event.event === 'order.paid') && p?.order_id){
      const order = await repo.getOrderByRazorpayId(db, p.order_id);
      if (order) await applyPayment(order, p, 'webhook');
      else log.warn(`[razorpay] webhook ${event.event} for ${p.order_id}, which matches no order here`);
    } else if (event.event === 'payment.failed' && p){
      log.info(`[razorpay] payment ${p.id} for ${p.order_id} failed: ${p.error_description || p.error_reason || 'no reason given'}`);
    }
  }

  return { check, confirmFromCheckout, handleWebhook };
}

export { createPaymentService };
