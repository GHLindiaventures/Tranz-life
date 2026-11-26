// Who is calling. loadCustomer reads the login cookie and sets req.customer (or null); requireCustomer and
// requireAdmin stop the request when nobody suitable is logged in.
import { unauthorized } from '../../lib/errors.js';
import { readCookie } from '../../lib/http.js';
import { findCustomerById } from '../customers/customers.repo.js';
import { findSession } from './sessions.js';

const COOKIE = 'tl_session';

function loadCustomer(db){
  return async (req, res, next) => {
    const session = await findSession(db, 'customer', readCookie(req, COOKIE));
    req.customer = session ? await findCustomerById(db, session.customerId) : null;
    next();
  };
}

function requireCustomer(req, res, next){
  if (!req.customer) throw unauthorized('Please log in to see your account.');
  next();
}

// the admin page sends its token as "Authorization: Bearer <token>"
function requireAdmin(db){
  return async (req, res, next) => {
    const token = /^Bearer (\S+)$/.exec(req.get('authorization') || '')?.[1];
    if (!await findSession(db, 'admin', token)) throw unauthorized('Please sign in again.');
    req.adminToken = token;
    next();
  };
}

// the login cookie: HttpOnly (page scripts cannot read it), Secure except on localhost, and only sent to /api
function setLoginCookie(req, res, { token, maxAgeMs }, crossSite){
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.get('host') || '');
  res.cookie(COOKIE, token, { httpOnly:true, path:'/api', maxAge:maxAgeMs, secure:!local || crossSite, sameSite:crossSite ? 'none' : 'lax' });
}

function clearLoginCookie(res){
  res.clearCookie(COOKIE, { path:'/api' });
}

export { COOKIE, loadCustomer, requireCustomer, requireAdmin, setLoginCookie, clearLoginCookie };
