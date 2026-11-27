// Logging in with a one-time code: (1) ask for a code for a mobile number (by SMS) or an email address (by email),
// (2) send the code back. A number or address we have not seen before becomes a new customer at step 2.
// There are no passwords.
import { badRequest, tooMany, unavailable } from '../../lib/errors.js';
import { normalisePhone, validEmail } from '../../lib/shared.js';
import { findOrCreateCustomer, recordLogin } from '../customers/customers.repo.js';
import { endSession, startSession } from './sessions.js';

const RESEND_AFTER_SECONDS = 30;
const MAX_CODES_PER_TARGET_PER_HOUR = 5;
const MAX_CODES_PER_VISITOR_PER_HOUR = 20;

// for the log: 98xxxxxx10, as***@example.com
const masked = ({ kind, value }) => kind === 'email' ? value.replace(/^(.{1,2})[^@]*/, '$1***') : `${value.slice(0, 2)}xxxxxx${value.slice(-2)}`;

function createAuthService({ db, codes, log = console }){
  const needCodes = () => { if (!codes) throw unavailable('Login is not available yet. Please check out as a guest.'); };

  // who is logging in, from the request: { email } or { phone } -> { kind:'email' | 'phone', value }
  function readLogin(body){
    if (body.email != null && body.email !== ''){
      const email = String(body.email).trim().toLowerCase();
      if (!validEmail(email)) throw badRequest('Enter a valid email address, like you@example.com.');
      if (!codes.email) throw unavailable('Email login is not available yet. Please use your mobile number.');
      return { kind:'email', value:email };
    }
    const phone = normalisePhone(body.phone);
    if (!phone) throw badRequest('Enter a 10-digit Indian mobile number.');
    return { kind:'phone', value:phone };
  }

  // each code is an SMS or email we pay for: 30 seconds between codes for one number or address, and hourly caps per
  // number or address and per visitor
  async function checkCodeLimits(target, ip){
    const r = await db.one(
      `SELECT count(*) FILTER (WHERE target = $1) AS for_target,
              count(*) FILTER (WHERE ip = $2) AS for_visitor,
              extract(epoch FROM now() - max(created_at) FILTER (WHERE target = $1)) AS seconds_since_last
       FROM otp_requests WHERE created_at > now() - interval '1 hour' AND (target = $1 OR ip = $2)`, [target, ip]);
    const wait = Math.ceil(RESEND_AFTER_SECONDS - Number(r.seconds_since_last ?? Infinity));
    if (wait > 0) throw tooMany(`Please wait ${wait} seconds before asking for another code.`);
    if (Number(r.for_target) >= MAX_CODES_PER_TARGET_PER_HOUR || Number(r.for_visitor) >= MAX_CODES_PER_VISITOR_PER_HOUR){
      throw tooMany('Too many codes asked for. Please try again in an hour.');
    }
  }

  // step 1: body { phone } or { email }. Returns { kind, to, resendIn, testCode? } (testCode only in test mode)
  async function requestCode(body, ip){
    needCodes();
    const login = readLogin(body);
    await checkCodeLimits(login.value, ip);
    const sent = await codes.send(login);
    await db.query("DELETE FROM otp_requests WHERE created_at < now() - interval '1 day'");
    await db.query('INSERT INTO otp_requests (target, ip) VALUES ($1, $2)', [login.value, ip]);
    if (sent.testCode) log.info(`[auth] test mode: the code for ${login.value} is ${sent.testCode}`);
    return { kind:login.kind, to:login.value, resendIn:RESEND_AFTER_SECONDS, ...(sent.testCode ? { testCode:sent.testCode } : {}) };
  }

  // step 2: body { phone, code } or { email, code }. Returns { customer, isNew, session:{ token, maxAgeMs } }
  async function verifyCode(body){
    needCodes();
    const login = readLogin(body), code = String(body.code ?? '').replace(/\D/g, '');
    const where = login.kind === 'email' ? 'email' : 'SMS';
    if (!/^\d{4,8}$/.test(code)) throw badRequest(`Enter the 6-digit code from the ${where}.`);
    if (!await codes.check(login, code)) throw badRequest(`That code is not right. Check the ${where} and try again.`, 'wrong_code');
    const { customer, isNew } = await findOrCreateCustomer(db, login);
    await recordLogin(db, customer.id);
    const session = await startSession(db, 'customer', customer.id);
    log.info(`[auth] ${isNew ? 'new customer' : 'customer'} logged in by ${login.kind}: ${masked(login)}`);
    return { customer, isNew, session };
  }

  const logout = token => endSession(db, token);

  return { requestCode, verifyCode, logout };
}

export { createAuthService };
