// A test copy of the API: its own in-memory PostgreSQL per test file (emptied before every test), on a random port.
//   const api = useTestApi();          in a test file
//   await api.post(path, body) / api.get(path) / api.login('9876543210') -> cookie
//   await api.newOrder(items) / api.placeOrder(body)   orders, placed by a logged-in test customer
//   api.use({ env:{ … }, razorpay, codes })   rebuild the app with other settings for one test
import { createServer } from 'node:http';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { connectDb } from '../src/db/index.js';
import { migrate } from '../src/db/migrate.js';
import { createTestCodes } from '../src/modules/auth/otp.test-mode.js';

const silent = { info(){}, warn(){}, error(){} };
const UPI = 'tranzlife@okhdfcbank', PASSWORD = 'correct horse battery';
const customer = { name:'Asha Rao', phone:'9876543210', email:'asha@example.com', address:'12 MG Road, Indiranagar', city:'Bengaluru', state:'Karnataka', pincode:'560038' };
const TABLES = 'customers, addresses, sessions, otp_requests, test_codes, orders, order_items, payments, order_events';

function useTestApi(defaults = () => ({})){
  const api = { db:null, base:'' };
  let server, handler;

  api.use = (over = {}) => {
    const { env = {}, razorpay = null, codes } = { ...defaults(), ...over };
    const config = loadConfig({ MERCHANT_UPI_ID:UPI, ADMIN_PASSWORD:PASSWORD, ...env });
    handler = createApp({ db:api.db, config, razorpay, codes:codes === undefined ? createTestCodes({ db:api.db }) : codes, log:silent });
  };

  beforeAll(async () => {
    api.db = await connectDb();
    await migrate(api.db, silent);
    server = createServer((req, res) => handler(req, res));
    await new Promise(r => server.listen(0, r));
    api.base = `http://localhost:${server.address().port}`;
  });
  let shopper = null; // the test's default logged-in customer (orders need a login)
  beforeEach(async () => {
    await api.db.exec(`TRUNCATE ${TABLES} RESTART IDENTITY CASCADE`);
    api.use();
    shopper = null;
  });
  afterAll(async () => {
    await new Promise(r => server.close(r));
    await api.db.close();
  });

  api.post = (path, body = {}, headers = {}) => fetch(api.base + path, {
    method:'POST', headers:{ 'Content-Type':'application/json', ...headers }, body:typeof body === 'string' ? body : JSON.stringify(body)
  });
  api.get = (path, headers = {}) => fetch(api.base + path, { headers });
  api.json = async (res) => ({ status:res.status, ...(await res.json()) });

  // logs a mobile number in (test-mode code) and returns the Cookie header to send with later calls
  api.login = async (phone = customer.phone) => {
    const { testCode } = await (await api.post('/api/auth/otp', { phone })).json();
    const res = await api.post('/api/auth/verify', { phone, code:testCode });
    return { Cookie:res.headers.getSetCookie()[0].split(';')[0] };
  };

  // the Cookie header of a customer logged in for this test (the same one each time it is asked for)
  api.shopper = async () => (shopper ||= await api.login('9000000001'));

  // places an order as `headers` (a login cookie), or as the test's default customer
  api.placeOrder = async (body, headers) => api.post('/api/orders', body, headers?.Cookie ? headers : await api.shopper());
  api.newOrder = async (items = [{ id:'inhaler', qty:2 }], headers) => (await api.placeOrder({ items, customer }, headers)).json();
  api.status = async ref => (await api.get(`/api/orders/${ref}`)).json();
  api.adminToken = async () => (await (await api.post('/api/admin/login', { password:PASSWORD })).json()).token;
  return api;
}

const bearer = token => ({ Authorization:`Bearer ${token}` });

export { useTestApi, bearer, customer, silent, PASSWORD, UPI };
