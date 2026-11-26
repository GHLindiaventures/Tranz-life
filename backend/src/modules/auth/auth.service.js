// Logging in with a one-time code: (1) ask for a code for a mobile number, (2) send the code back. A number we have
// not seen before becomes a new customer at step 2. There are no passwords.
import { badRequest, tooMany, unavailable } from '../../lib/errors.js';
import { normalisePhone } from '../../lib/shared.js';
import { findOrCreateCustomer, recordLogin } from '../customers/customers.repo.js';
import { endSession, startSession } from './sessions.js';

const RESEND_AFTER_SECONDS = 30;
const MAX_CODES_PER_NUMBER_PER_HOUR = 5;
const MAX_CODES_PER_VISITOR_PER_HOUR = 20;

function createAuthService({ db, codes, log = console }){
  const needCodes = () => { if (!codes) throw unavailable('Login is not available yet. Please check out as a guest.'); };

  function readPhone(input){
    const phone = normalisePhone(input);
    if (!phone) throw badRequest('Enter a 10-digit Indian mobile number.');
    return phone;
  }

  // each code is an SMS we pay for: 30 seconds between codes for a number, and hourly caps per number and per visitor
  async function checkCodeLimits(phone, ip){
    const r = await db.one(
      `SELECT count(*) FILTER (WHERE phone = $1) AS for_number,
              count(*) FILTER (WHERE ip = $2) AS for_visitor,
              extract(epoch FROM now() - max(created_at) FILTER (WHERE phone = $1)) AS seconds_since_last
       FROM otp_requests WHERE created_at > now() - interval '1 hour' AND (phone = $1 OR ip = $2)`, [phone, ip]);
    const wait = Math.ceil(RESEND_AFTER_SECONDS - Number(r.seconds_since_last ?? Infinity));
    if (wait > 0) throw tooMany(`Please wait ${wait} seconds before asking for another code.`);
    if (Number(r.for_number) >= MAX_CODES_PER_NUMBER_PER_HOUR || Number(r.for_visitor) >= MAX_CODES_PER_VISITOR_PER_HOUR){
      throw tooMany('Too many codes asked for. Please try again in an hour.');
    }
  }

  // step 1. Returns { phone, resendIn, testCode? } (testCode only in test mode)
  async function requestCode(phoneInput, ip){
    needCodes();
    const phone = readPhone(phoneInput);
    await checkCodeLimits(phone, ip);
    const sent = await codes.send(phone);
    await db.query("DELETE FROM otp_requests WHERE created_at < now() - interval '1 day'");
    await db.query('INSERT INTO otp_requests (phone, ip) VALUES ($1, $2)', [phone, ip]);
    if (sent.testCode) log.info(`[auth] test mode: the code for ${phone} is ${sent.testCode}`);
    return { phone, resendIn:RESEND_AFTER_SECONDS, ...(sent.testCode ? { testCode:sent.testCode } : {}) };
  }

  // step 2. Returns { customer, isNew, session:{ token, maxAgeMs } }
  async function verifyCode(phoneInput, codeInput){
    needCodes();
    const phone = readPhone(phoneInput), code = String(codeInput ?? '').replace(/\D/g, '');
    if (!/^\d{4,8}$/.test(code)) throw badRequest('Enter the 6-digit code from the SMS.');
    if (!await codes.check(phone, code)) throw badRequest('That code is not right. Check the SMS and try again.', 'wrong_code');
    const { customer, isNew } = await findOrCreateCustomer(db, phone);
    await recordLogin(db, customer.id);
    const session = await startSession(db, 'customer', customer.id);
    log.info(`[auth] ${isNew ? 'new customer' : 'customer'} logged in: ${phone.slice(0, 2)}xxxxxx${phone.slice(-2)}`);
    return { customer, isNew, session };
  }

  const logout = token => endSession(db, token);

  return { requestCode, verifyCode, logout };
}

export { createAuthService };
