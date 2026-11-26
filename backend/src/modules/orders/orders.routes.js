// Orders.
// Checkout (anyone; a logged-in customer's order also goes to their account)
//   POST /api/orders                  { items:[{ id, qty }], customer } -> 201 order number, totals, Razorpay and/or UPI details
//   GET  /api/orders/:ref             -> { ref, status, total, utr, reason, paymentId }
//   POST /api/orders/:ref/razorpay    { paymentId, signature } -> status (checks the payment with Razorpay)
//   POST /api/orders/:ref/utr         { utr } -> status "verifying"   (payments to TranzLife's own QR code)
// My Orders (logged in)
//   GET  /api/me/orders               -> { orders }   newest first
//   GET  /api/me/orders/:ref          -> { order }    with the delivery address and the tracking timeline
import { Router } from 'express';
import { rateLimit } from '../../lib/http.js';
import { requireCustomer } from '../auth/auth.middleware.js';

function ordersRoutes({ orders }){
  const r = Router();
  const limitOrders = rateLimit(30, 60e3), limitUtr = rateLimit(10, 60e3), limitPay = rateLimit(30, 60e3);

  r.post('/orders', async (req, res) => {
    limitOrders(req.ip);
    res.status(201).json(await orders.placeOrder(req.body, req.customer?.id || null));
  });

  r.get('/orders/:ref', async (req, res) => {
    res.json(await orders.status(req.params.ref));
  });

  r.post('/orders/:ref/utr', async (req, res) => {
    limitUtr(req.ip);
    res.json(await orders.submitUtr(req.params.ref, req.body.utr));
  });

  r.post('/orders/:ref/razorpay', async (req, res) => {
    limitPay(req.ip);
    res.json(await orders.confirmRazorpay(req.params.ref, req.body));
  });

  r.get('/me/orders', requireCustomer, async (req, res) => {
    res.json({ orders:await orders.myOrders(req.customer.id) });
  });

  r.get('/me/orders/:ref', requireCustomer, async (req, res) => {
    res.json({ order:await orders.myOrder(req.customer.id, req.params.ref) });
  });

  return r;
}

export { ordersRoutes };
