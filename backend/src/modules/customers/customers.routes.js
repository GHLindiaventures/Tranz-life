// The logged-in customer's account.
//   GET  /api/me                              -> { user, login }   user is null when logged out; login: 'twilio' | 'test' | null
//   POST /api/me                              { name, email, gender } -> { user }
//   POST /api/me/addresses                    address -> { user }    (up to 10; the first one is the default)
//   POST /api/me/addresses/:id                address -> { user }
//   POST /api/me/addresses/:id/delete         -> { user }
//   POST /api/me/addresses/:id/default        -> { user }
import { Router } from 'express';
import { requireCustomer } from '../auth/auth.middleware.js';

function customersRoutes({ customers, loginMode }){
  const r = Router();

  r.get('/me', async (req, res) => {
    res.json({ user:req.customer ? await customers.account(req.customer) : null, login:loginMode });
  });

  r.post('/me', requireCustomer, async (req, res) => {
    res.json({ user:await customers.updateProfile(req.customer, req.body) });
  });

  r.post('/me/addresses', requireCustomer, async (req, res) => {
    res.json({ user:await customers.addAddress(req.customer, req.body) });
  });

  r.post('/me/addresses/:id', requireCustomer, async (req, res) => {
    res.json({ user:await customers.editAddress(req.customer, req.params.id, req.body) });
  });

  r.post('/me/addresses/:id/delete', requireCustomer, async (req, res) => {
    res.json({ user:await customers.removeAddress(req.customer, req.params.id) });
  });

  r.post('/me/addresses/:id/default', requireCustomer, async (req, res) => {
    res.json({ user:await customers.makeDefault(req.customer, req.params.id) });
  });

  return r;
}

export { customersRoutes };
