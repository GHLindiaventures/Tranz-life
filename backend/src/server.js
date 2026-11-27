// Starts the TranzLife API: `npm start`, or `npm run dev` to restart whenever a file changes.
// Reads backend/.env, connects to the database, brings its tables up to date, then listens.
import { createApp } from './app.js';
import { ConfigError, loadSettings } from './config.js';
import { connectDb } from './db/index.js';
import { migrate } from './db/migrate.js';
import { chooseCodeSender } from './modules/auth/otp.js';
import { createRazorpay } from './modules/payments/razorpay.client.js';

async function start(){
  const config = loadSettings();
  const db = await connectDb({ url:config.databaseUrl, dir:config.localDbDir });
  await migrate(db);
  const razorpay = config.razorpay ? createRazorpay(config.razorpay) : null;
  const codes = chooseCodeSender({ config, db, log:console });
  const app = createApp({ db, config, razorpay, codes });

  const server = app.listen(config.port, () => printSummary({ config, db, razorpay, codes }));
  const stop = () => server.close(async () => { await db.close(); process.exit(0); });
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

// one line per part, saying what is on and what to set to turn the rest on
function printSummary({ config, db, razorpay, codes }){
  const say = line => console.log(`  ${line}`);
  console.log(`TranzLife API on http://localhost:${config.port}/api`);
  say(db.kind === 'postgres' ? 'Database: PostgreSQL (DATABASE_URL)' : `Database: local PostgreSQL in ${config.localDbDir}`);
  if (codes?.name === 'twilio') say(`Customer login: codes by SMS${codes.email ? ' and by email' : ''} through Twilio Verify${codes.email ? '' : ' (email login off: see TWILIO_VERIFY_EMAIL)'}`);
  else if (codes?.name === 'test') say('Customer login: TEST MODE (mobile and email). Codes show on the login screen; anyone can log in as anyone. Never use this on the live shop.');
  else say('Customer login: off. Set the TWILIO_ settings in backend/.env (or OTP_TEST_MODE=true to try it out).');
  if (razorpay) say(`Payments: Razorpay ${razorpay.mode === 'live' ? 'LIVE (real money)' : 'test mode (no real money)'}${razorpay.webhooks ? '' : '. Set RAZORPAY_WEBHOOK_SECRET so payments confirm even when the customer closes the page'}`);
  else say('Payments: Razorpay off. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  if (config.merchant.upiId) say(`Fallback QR code pays ${config.merchant.upiId}; customers send the UTR, you confirm it on the admin page`);
  if (!config.merchant.upiId && !razorpay) say('NOT TAKING ORDERS: set the Razorpay keys and/or MERCHANT_UPI_ID.');
  if (!config.adminPassword) say('Admin page: off. Set ADMIN_PASSWORD.');
  else say(`Admin page: http://localhost:${config.port}/api/admin${config.adminPassword.length < 12 ? ' (warning: use a password of at least 12 characters)' : ''}`);
}

start().catch(err => {
  console.error(err instanceof ConfigError ? err.message : err);
  process.exit(1);
});
