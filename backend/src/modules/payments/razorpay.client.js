// Razorpay's API, with plain fetch (no SDK). Razorpay reports each payment itself, so the customer never types a UTR:
//   - the checkout's success response is signed with the key secret: HMAC-SHA256(order_id + "|" + payment_id)
//   - webhooks are signed with the webhook secret over the raw request body (header X-Razorpay-Signature)
//   - and we can always ask Razorpay for an order's payments
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.razorpay.com/v1';

const hmacHex = (secret, data) => createHmac('sha256', secret).update(data).digest('hex');
function sameText(a, b){
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

function createRazorpay({ keyId, keySecret, webhookSecret = '', fetchImpl = globalThis.fetch }){
  const auth = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  async function call(method, path, body){
    let res;
    try {
      res = await fetchImpl(API + path, {
        method, headers:{ Authorization:auth, ...(body ? { 'Content-Type':'application/json' } : {}) },
        body:body ? JSON.stringify(body) : undefined, signal:AbortSignal.timeout(15000)
      });
    } catch(err){ throw new Error(`Razorpay could not be reached (${err.message})`); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Razorpay ${method} ${path} failed (${res.status}): ${data.error?.description || 'no details'}`);
    return data;
  }

  return {
    keyId, mode:keyId.startsWith('rzp_live_') ? 'live' : 'test', webhooks:!!webhookSecret,
    // amount in paise. Returns { id:'order_…', amount, status, … }
    createOrder:({ amount, receipt, notes }) => call('POST', '/orders', { amount, currency:'INR', receipt, notes }),
    // every payment attempt on a Razorpay order (failed ones too)
    orderPayments:async orderId => (await call('GET', `/orders/${encodeURIComponent(orderId)}/payments`)).items || [],
    validPaymentSignature:({ orderId, paymentId, signature }) => !!signature && sameText(hmacHex(keySecret, `${orderId}|${paymentId}`), signature),
    validWebhook:(rawBody, signature) => !!webhookSecret && !!signature && sameText(hmacHex(webhookSecret, rawBody), signature)
  };
}

export { createRazorpay };
