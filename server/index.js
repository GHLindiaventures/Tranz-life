// Starts the TranzLife payment API (`npm run server`). Settings come from the environment or the project's .env file.
// See README.md, "Payments".
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { validUpiId } from '../src/utils/payment.js';
import { createApp } from './app.js';
import { loadEnv } from './env.js';
import { createRazorpay, KEY_PATTERN } from './razorpay.js';
import { createStore } from './store.js';

loadEnv(fileURLToPath(new URL('../.env', import.meta.url)));
const env = process.env;
const fail = msg => { console.error(msg); process.exit(1); };

const upiId = (env.MERCHANT_UPI_ID || '').trim();
if (upiId && !validUpiId(upiId)) fail(`MERCHANT_UPI_ID "${upiId}" does not look like a UPI ID (for example tranzlife@okhdfcbank).`);

// Razorpay, for paying with a UPI app
const keyId = (env.RAZORPAY_KEY_ID || '').trim(), keySecret = (env.RAZORPAY_KEY_SECRET || '').trim(), webhookSecret = (env.RAZORPAY_WEBHOOK_SECRET || '').trim();
if (!!keyId !== !!keySecret) fail('Set both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (Razorpay dashboard → Account & Settings → API Keys), or neither.');
if (keyId && !KEY_PATTERN.test(keyId)) fail(`RAZORPAY_KEY_ID "${keyId}" does not look like a Razorpay key ID (rzp_test_… or rzp_live_…).`);
const razorpay = keyId ? createRazorpay({ keyId, keySecret, webhookSecret }) : null;

const adminPassword = env.ADMIN_PASSWORD || '';
const port = Number(env.PAYMENT_PORT) || 8787;
const payeeName = (env.MERCHANT_NAME || 'TranzLife Biosciences').trim();

const app = createApp({
  store:createStore(env.PAYMENT_DATA_FILE || fileURLToPath(new URL('./data/orders.json', import.meta.url))),
  upiId, payeeName, razorpay,
  adminPassword, adminPage:readFileSync(new URL('./admin.html', import.meta.url), 'utf8'),
  allowedOrigin:env.PAYMENT_ALLOWED_ORIGIN || '',
  trustProxy:env.PAYMENT_TRUST_PROXY === 'true'
});

createServer(app).listen(port, () => {
  console.log(`TranzLife payment API on http://localhost:${port}`);
  if (!upiId && !razorpay) console.log('NOT TAKING ORDERS: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, and/or MERCHANT_UPI_ID.');
  if (razorpay){
    console.log(`UPI QR code, UPI apps and cards through Razorpay, ${razorpay.mode === 'live' ? 'LIVE: real money' : 'TEST mode: no real money'}`);
    if (!webhookSecret) console.log('Warning: RAZORPAY_WEBHOOK_SECRET is not set. Payments still confirm when the customer comes back to the page and on the admin page, but set up the webhook (README → Payments) so they confirm even if the customer closes it.');
  } else console.log('Razorpay is off (no QR code for each order, no UPI app buttons, no cards): set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  console.log(upiId ? `Fallback QR code (customer sends the UTR) pays the UPI ID ${upiId}` : 'No fallback QR code: set MERCHANT_UPI_ID to your UPI ID if you want one for when Razorpay is not available.');
  if (!adminPassword) console.log('Admin page is off: set ADMIN_PASSWORD.');
  else {
    if (adminPassword.length < 12) console.log('Warning: ADMIN_PASSWORD is short. Use at least 12 characters.');
    console.log(`Admin page: http://localhost:${port}/api/admin (or /api/admin on your site)`);
  }
});
