// Razorpay calling us.
//   POST /api/webhooks/razorpay   payment.captured / order.paid, signed with RAZORPAY_WEBHOOK_SECRET
// Mounted before the JSON parser: the signature is checked over the raw body, byte for byte.
import express, { Router } from 'express';

function paymentsWebhookRoutes({ payments }){
  const r = Router();
  r.post('/webhooks/razorpay', express.raw({ type:'*/*', limit:'64kb' }), async (req, res) => {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    await payments.handleWebhook(raw, req.get('x-razorpay-signature'));
    res.json({ ok:true });
  });
  return r;
}

export { paymentsWebhookRoutes };
