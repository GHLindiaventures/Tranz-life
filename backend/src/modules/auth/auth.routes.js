// Customer login.
//   POST /api/auth/otp      { phone }        -> { phone, resendIn, testCode? }   texts a code (test mode: returns it)
//   POST /api/auth/verify   { phone, code }  -> { user, isNew }                  sets the login cookie
//   POST /api/auth/logout                    -> { ok }
import { Router } from 'express';
import { readCookie } from '../../lib/http.js';
import { clearLoginCookie, COOKIE, setLoginCookie } from './auth.middleware.js';

function authRoutes({ auth, customers, crossSite }){
  const r = Router();

  r.post('/auth/otp', async (req, res) => {
    res.json(await auth.requestCode(req.body.phone, req.ip));
  });

  r.post('/auth/verify', async (req, res) => {
    const { customer, isNew, session } = await auth.verifyCode(req.body.phone, req.body.code);
    setLoginCookie(req, res, session, crossSite);
    res.json({ user:await customers.account(customer), isNew });
  });

  r.post('/auth/logout', async (req, res) => {
    await auth.logout(readCookie(req, COOKIE));
    clearLoginCookie(res);
    res.json({ ok:true });
  });

  return r;
}

export { authRoutes };
