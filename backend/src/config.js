// The backend's settings, read once from the environment (backend/.env on your computer) and checked.
// Nothing else reads process.env: every part of the backend gets its settings from the object this returns.
import { fileURLToPath } from 'node:url';
import { validUpiId } from './lib/shared.js';

const RAZORPAY_KEY = /^rzp_(test|live)_[A-Za-z0-9]+$/;
const TWILIO_ACCOUNT = /^AC[0-9a-fA-F]{32}$/;
const TWILIO_SERVICE = /^VA[0-9a-fA-F]{32}$/;

class ConfigError extends Error {
  constructor(problems){ super(`Please fix backend/.env:\n  - ${problems.join('\n  - ')}`); this.name = 'ConfigError'; }
}

function loadConfig(env = process.env){
  const get = key => String(env[key] ?? '').trim();
  const problems = [];

  const razorpay = readRazorpay(get, problems);
  const twilio = readTwilio(get, problems);
  const upiId = get('MERCHANT_UPI_ID');
  if (upiId && !validUpiId(upiId)) problems.push(`MERCHANT_UPI_ID "${upiId}" does not look like a UPI ID (for example tranzlife@okhdfcbank).`);
  const allowedOrigin = get('ALLOWED_ORIGIN').replace(/\/+$/, '');
  if (allowedOrigin && !/^https?:\/\/[^/]+$/.test(allowedOrigin)) problems.push('ALLOWED_ORIGIN should be just the website address, like https://tranzlife.in');

  if (problems.length) throw new ConfigError(problems);
  return {
    port:Number(get('PORT')) || 8787,
    trustProxy:get('TRUST_PROXY') === 'true',
    allowedOrigin,
    databaseUrl:get('DATABASE_URL'),
    localDbDir:get('LOCAL_DB_DIR') || fileURLToPath(new URL('../.data/db', import.meta.url)),
    merchant:{ upiId, name:get('MERCHANT_NAME') || 'TranzLife Biosciences' },
    razorpay,
    twilio,
    otpTestMode:get('OTP_TEST_MODE') === 'true',
    adminPassword:get('ADMIN_PASSWORD')
  };
}

// backend/.env (when there is one) under the real environment, which wins, then the checked settings
function loadSettings(){
  try { process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url))); }
  catch(err){ if (err.code !== 'ENOENT') throw err; }
  return loadConfig(process.env);
}

function readRazorpay(get, problems){
  const keyId = get('RAZORPAY_KEY_ID'), keySecret = get('RAZORPAY_KEY_SECRET');
  if (!keyId && !keySecret) return null;
  if (!keyId || !keySecret) problems.push('Set both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, or neither.');
  else if (!RAZORPAY_KEY.test(keyId)) problems.push(`RAZORPAY_KEY_ID "${keyId}" does not look like a Razorpay key (rzp_test_… or rzp_live_…).`);
  return { keyId, keySecret, webhookSecret:get('RAZORPAY_WEBHOOK_SECRET') };
}

function readTwilio(get, problems){
  const accountSid = get('TWILIO_ACCOUNT_SID'), authToken = get('TWILIO_AUTH_TOKEN'), serviceSid = get('TWILIO_VERIFY_SERVICE_SID');
  if (!accountSid && !authToken && !serviceSid) return null;
  if (!accountSid || !authToken || !serviceSid) problems.push('Set all three of TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID, or none.');
  if (accountSid && !TWILIO_ACCOUNT.test(accountSid)) problems.push('TWILIO_ACCOUNT_SID should start with AC followed by 32 letters and numbers.');
  if (serviceSid && !TWILIO_SERVICE.test(serviceSid)) problems.push('TWILIO_VERIFY_SERVICE_SID should start with VA (Twilio Console → Verify → Services).');
  // codes by email too, once the Verify service's email integration is set up in the Twilio Console
  return { accountSid, authToken, serviceSid, email:get('TWILIO_VERIFY_EMAIL') === 'true' };
}

export { loadConfig, loadSettings, ConfigError };
