// Orders: placing one, paying by UTR (TranzLife's own QR code), the customer's My Orders, and the admin's steps.
// Prices are worked out here from the catalogue, never taken from the browser. Razorpay payments are in payments.service.js.
//
// Order status:   awaiting_payment -> paid                                     (Razorpay: confirmed by itself)
//                 awaiting_payment -> verifying (UTR sent) -> paid             (own QR code: confirmed by the admin)
//                                                          -> rejected         (the customer sees why and can send a new UTR)
// Delivery, once paid (the admin moves it along): packed -> shipped -> out_for_delivery -> delivered
import { randomBytes } from 'node:crypto';
import { badRequest, conflict, notFound, unavailable } from '../../lib/errors.js';
import { checkCustomer, DELIVERY_STEPS, normaliseUtr, orderRef, priceOrder, REF_PATTERN, toPaise, upiUri } from '../../lib/shared.js';
import * as repo from './orders.repo.js';
import { adminView, customerView, publicStatus } from './orders.views.js';

const UTR_HELP = 'Enter the 12-digit UTR (UPI reference number) from your UPI app.';
const ADMIN_CHECK_DAYS = 2; // the admin page also asks Razorpay about unpaid orders this recent

function createOrderService({ db, razorpay, payments, customers, merchant, log = console }){
  // an order by its number, or a 404 (order numbers are long and random, so they cannot be guessed)
  async function find(ref){
    const order = REF_PATTERN.test(ref || '') ? await repo.getOrder(db, ref) : null;
    if (!order) throw notFound('We could not find that order.');
    return order;
  }

  // ---------- checkout ----------
  // { items:[{ id, qty }], customer:{ name, phone, … } } -> what the checkout needs to take the payment
  async function placeOrder(body, customerId = null){
    if (!merchant.upiId && !razorpay) throw unavailable('Payments are not set up yet. Please try again later.');
    const priced = priceOrder(Array.isArray(body.items) ? body.items : []);
    const { customer, errors } = checkCustomer(body.customer || {});
    if (errors) throw badRequest(Object.values(errors)[0]);
    const ref = orderRef(new Date(), randomBytes(8));
    const razorpayOrderId = await createRazorpayOrder(ref, priced.total);
    const upiId = merchant.upiId || null;

    await db.tx(async t => {
      await repo.insertOrder(t, { ref, customerId, customer, priced, upiId, razorpayOrderId });
      await repo.addEvent(t, ref, 'placed');
    });
    if (customerId) await customers.rememberAddress(customerId, customer);
    log.info(`[orders] ${ref} placed: ₹${priced.total} for ${customer.name}${customerId ? ' (logged in)' : ''}`);

    return {
      ref, items:priced.items, subtotal:priced.subtotal, shipping:priced.shipping, total:priced.total, currency:priced.currency,
      ...(upiId ? { upi:{ id:upiId, name:merchant.name, uri:upiUri({ vpa:upiId, name:merchant.name, amount:priced.total, note:ref }) } } : {}),
      ...(razorpayOrderId ? { razorpay:{ keyId:razorpay.keyId, orderId:razorpayOrderId, amount:toPaise(priced.total), currency:'INR', name:merchant.name } } : {})
    };
  }

  // a Razorpay order for the exact amount, so Razorpay can tell us when it is paid. Null when Razorpay is off or down
  // (the order can still be paid by the own-UPI QR code, if there is one).
  async function createRazorpayOrder(ref, total){
    if (!razorpay) return null;
    try { return (await razorpay.createOrder({ amount:toPaise(total), receipt:ref, notes:{ ref } })).id; }
    catch(err){
      log.error(`[razorpay] could not create a Razorpay order for ${ref}: ${err.message}`);
      if (!merchant.upiId) throw unavailable('Payments are not available right now. Please try again in a few minutes.');
      return null;
    }
  }

  // the checkout page asking how the payment is going
  async function status(ref){
    const order = await find(ref);
    if (order.status === 'awaiting_payment') await payments.check(order);
    return publicStatus(await find(ref));
  }

  // own-QR payments: the customer sends the UTR, and the admin checks it against the bank statement
  async function submitUtr(ref, utrInput){
    const order = await find(ref);
    if (order.status === 'paid') throw conflict('paid', 'This order is already paid.');
    const utr = normaliseUtr(utrInput);
    if (!utr) throw badRequest(UTR_HELP);
    if (await repo.utrRejectedBefore(db, ref, utr)) throw conflict('rejected_utr', 'This UTR was checked and not accepted. Check the number in your UPI app, or contact us with your order number.');
    if (await repo.utrInUse(db, utr, ref)) throw conflict('utr_used', 'This UTR is already used for another order. Check the number in your UPI app.');
    await db.tx(async t => {
      await repo.saveUtr(t, ref, utr);
      await repo.addEvent(t, ref, 'utr_submitted', { utr });
    });
    log.info(`[orders] ${ref}: UTR ${utr} sent for ₹${order.total}. Check it in your bank app, then confirm it on the admin page.`);
    return publicStatus(await find(ref));
  }

  // Razorpay's checkout window says the customer paid
  async function confirmRazorpay(ref, body){
    await payments.confirmFromCheckout(await find(ref), body);
    return publicStatus(await find(ref));
  }

  // ---------- My Orders ----------
  async function myOrders(customerId){
    return (await repo.listCustomerOrders(db, customerId)).map(customerView);
  }

  async function myOrder(customerId, ref){
    const order = REF_PATTERN.test(ref || '') ? await repo.getOrder(db, ref) : null;
    if (!order || order.customerId !== customerId) throw notFound('We could not find that order in your account.');
    if (order.status === 'awaiting_payment') await payments.check(order);
    return customerView(await repo.getOrder(db, ref));
  }

  // ---------- admin ----------
  async function listForAdmin(status){
    // unpaid Razorpay orders from the last two days: ask Razorpay, in case a payment's webhook never arrived
    for (const o of await repo.recentUnpaidRazorpayOrders(db, ADMIN_CHECK_DAYS, 25)) await payments.check(o, 60e3);
    const [orders, counts] = await Promise.all([repo.listOrders(db, status), repo.countOrdersByStatus(db)]);
    return { orders:orders.map(adminView), counts };
  }

  // the admin found the payment in the bank statement. utrInput is needed when the customer never sent one.
  async function confirmPayment(ref, utrInput){
    const order = await find(ref);
    if (order.status === 'paid') return adminView(order);
    const utr = utrInput ? normaliseUtr(utrInput) : order.utr;
    if (utrInput && !utr) throw badRequest('A UTR has 12 digits.');
    if (!utr) throw badRequest('Enter the UTR you found in your bank app for this payment.');
    if (await repo.utrInUse(db, utr, ref)) throw conflict('utr_used', `UTR ${utr} is already on another order.`);
    await db.tx(async t => {
      await repo.markPaid(t, ref, { utr, reviewed:true });
      await repo.addEvent(t, ref, 'utr_confirmed', { utr });
    });
    log.info(`[orders] ${ref} confirmed as paid (UTR ${utr}, ₹${order.total})`);
    return adminView(await find(ref));
  }

  async function rejectPayment(ref, reasonInput){
    const order = await find(ref);
    if (order.status !== 'verifying') throw conflict('state', 'Only orders waiting for a check can be rejected.');
    const reason = String(reasonInput ?? '').trim().replace(/\s+/g, ' ').slice(0, 200) || 'We could not find this payment in our bank account.';
    await db.tx(async t => {
      await repo.markRejected(t, ref, reason);
      await repo.addEvent(t, ref, 'utr_rejected', { utr:order.utr, reason });
    });
    log.info(`[orders] ${ref} rejected (UTR ${order.utr}): ${reason}`);
    return adminView(await find(ref));
  }

  // moves a paid order along its delivery steps (forward only; a step may be skipped)
  async function moveDelivery(ref, step){
    const order = await find(ref);
    if (order.status !== 'paid') throw conflict('state', 'Only paid orders can be packed and shipped.');
    if (!DELIVERY_STEPS.includes(step)) throw badRequest('Unknown delivery step.');
    if (order.deliveryStep === step) return adminView(order);
    if (DELIVERY_STEPS.indexOf(step) < DELIVERY_STEPS.indexOf(order.deliveryStep)) throw conflict('state', 'This order is already further along.');
    await db.tx(async t => {
      await repo.saveDeliveryStep(t, ref, step);
      await repo.addEvent(t, ref, step);
    });
    log.info(`[orders] ${ref}: ${step.replace(/_/g, ' ')}`);
    return adminView(await find(ref));
  }

  return { placeOrder, status, submitUtr, confirmRazorpay, myOrders, myOrder, listForAdmin, confirmPayment, rejectPayment, moveDelivery };
}

export { createOrderService };
