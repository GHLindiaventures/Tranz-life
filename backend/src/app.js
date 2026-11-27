// Builds the API. Each request goes through, in order:
//   1. security headers and CORS            (lib/http.js)
//   2. the Razorpay webhook                 (raw body, so its signature can be checked)
//   3. JSON body parsing; POSTs must be JSON
//   4. who is logged in -> req.customer     (modules/auth/auth.middleware.js)
//   5. the routes of each module            (auth, customers, orders, admin)
//   6. the error handler -> { code, error }
// server.js starts it; the tests call createApp directly with an in-memory database.
import express from 'express';
import { allowOrigin, errorHandler, securityHeaders } from './lib/http.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { loadCustomer } from './modules/auth/auth.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { customersRoutes } from './modules/customers/customers.routes.js';
import { createCustomerService } from './modules/customers/customers.service.js';
import { ordersRoutes } from './modules/orders/orders.routes.js';
import { createOrderService } from './modules/orders/orders.service.js';
import { paymentsWebhookRoutes } from './modules/payments/payments.routes.js';
import { createPaymentService } from './modules/payments/payments.service.js';

// POSTs must be JSON: a browser cannot send JSON to another site without asking first, which stops forged requests
function jsonOnly(req, res, next){
  if (req.method === 'POST' && !String(req.get('content-type') || '').includes('application/json')){
    return res.status(415).json({ code:'invalid', error:'Send JSON.' });
  }
  req.body ??= {};
  next();
}

function createApp({ db, config, razorpay = null, codes = null, log = console }){
  // the business rules, each given only what it needs
  const customers = createCustomerService({ db });
  const auth = createAuthService({ db, codes, log });
  const payments = createPaymentService({ db, razorpay, log });
  const orders = createOrderService({ db, razorpay, payments, customers, merchant:config.merchant, log });
  const loginMode = codes?.name || null;

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(securityHeaders, allowOrigin(config.allowedOrigin));

  app.get('/api/health', (req, res) => res.json({
    ok:true, database:db.kind, login:loginMode, admin:!!config.adminPassword,
    payments:!!(config.merchant.upiId || razorpay), upiApps:!!razorpay, qr:!!config.merchant.upiId
  }));
  app.use('/api', paymentsWebhookRoutes({ payments }));
  app.use(express.json({ limit:'64kb' }), jsonOnly);
  app.use('/api', loadCustomer(db));
  app.use('/api', authRoutes({ auth, customers, crossSite:!!config.allowedOrigin }));
  app.use('/api', customersRoutes({ customers, loginMode, emailLogin:!!codes?.email }));
  app.use('/api', ordersRoutes({ orders }));
  app.use('/api', adminRoutes({ db, orders, adminPassword:config.adminPassword, log }));
  app.use('/api', (req, res) => res.status(404).json({ code:'not_found', error:'Not found.' }));
  app.use(errorHandler(log));
  return app;
}

export { createApp };
