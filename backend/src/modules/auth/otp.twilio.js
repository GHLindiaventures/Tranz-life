// Login codes through Twilio Verify: Twilio makes the 6-digit code, sends it, and checks it. We store no codes.
// API: https://www.twilio.com/docs/verify/api   Two calls, both form-encoded POSTs with Basic auth:
//   Verifications        To=+91… Channel=sms, or To=name@… Channel=email   -> sends a code
//   VerificationCheck    To=…, Code=123456                                 -> { status:'approved' } when it is right
// Codes by email need the Verify service's email integration (SendGrid) set up in the Twilio Console, then
// TWILIO_VERIFY_EMAIL=true (backend/README.md, "What you do manually").
import { HttpError } from '../../lib/errors.js';

const TRY_AGAIN = 'We could not send the code right now. Please try again in a minute.';

// Twilio's error codes that the customer can do something about; anything else is our problem (logged)
const KNOWN_ERRORS = {
  60200:[400, 'invalid', 'Check your mobile number or email address and try again.'],
  60203:[429, 'busy', 'Too many codes sent here. Please wait 10 minutes and try again.'],
  60202:[429, 'too_many', 'Too many wrong codes. Ask for a new code.'],
  60410:[400, 'blocked', 'We cannot send a code to this number.'],
  20404:[410, 'expired', 'This code has expired. Ask for a new one.']
};

// where Twilio sends the code: +91 and the number by SMS, or the address by email
const recipient = ({ kind, value }) => kind === 'email' ? { To:value, Channel:'email' } : { To:`+91${value}`, Channel:'sms' };

function createTwilioVerify({ accountSid, authToken, serviceSid, email = false, fetchImpl = globalThis.fetch, log = console }){
  const base = `https://verify.twilio.com/v2/Services/${serviceSid}`;
  const auth = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  async function post(path, form){
    let res;
    try {
      res = await fetchImpl(base + path, {
        method:'POST', body:new URLSearchParams(form).toString(), signal:AbortSignal.timeout(15000),
        headers:{ Authorization:auth, 'Content-Type':'application/x-www-form-urlencoded' }
      });
    } catch(err){
      log.error(`[twilio] could not reach Twilio: ${err.message}`);
      throw new HttpError(503, 'unavailable', TRY_AGAIN);
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    const known = KNOWN_ERRORS[data.code];
    if (known) throw new HttpError(...known);
    log.error(`[twilio] ${path} failed (${res.status}, Twilio error ${data.code}): ${data.message}`);
    throw new HttpError(503, 'unavailable', TRY_AGAIN);
  }

  return {
    name:'twilio',
    email, // whether codes can go by email
    // login: { kind:'phone' | 'email', value }
    async send(login){ await post('/Verifications', recipient(login)); return {}; },
    async check(login, code){ return (await post('/VerificationCheck', { To:recipient(login).To, Code:code })).status === 'approved'; }
  };
}

export { createTwilioVerify };
