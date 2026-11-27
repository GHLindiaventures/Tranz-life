# TranzLife backend

The API behind the website: **customer login with a code by SMS or email**, **customer accounts** (profile, addresses, My Orders), **orders**, **payments** (Razorpay and UPI) and the **admin page**. Data is stored in **PostgreSQL**.

- Node.js 20.12+ with [Express 5](https://expressjs.com/)
- PostgreSQL through [`pg`](https://node-postgres.com/). On your computer and in the tests, the same Postgres runs inside Node through [PGlite](https://pglite.dev/), so there is nothing to install.
- Login codes by [Twilio Verify](https://www.twilio.com/docs/verify)
- Payments by [Razorpay](https://razorpay.com/docs/api/)

## Run it on your computer

```bash
cd backend
npm install
cp .env.example .env     # then fill in what you have (everything is optional)
npm run dev              # http://localhost:8787/api, restarts when you change a file
```

The start-up message says what is on and what to set for the rest, for example:

```
TranzLife API on http://localhost:8787/api
  Database: local PostgreSQL in D:\Tranz-life\backend\.data\db
  Customer login: codes by SMS through Twilio Verify
  Payments: Razorpay test mode (no real money)
  Admin page: http://localhost:8787/api/admin
```

To use it from the website, put `VITE_PAYMENT_API=/api` in the website's `.env` and run `npm run dev` in the project folder. Vite forwards `/api` to this server.

To try login without Twilio, set `OTP_TEST_MODE=true`: the code then shows on the login screen instead of being texted or emailed. Anyone can log in as anyone this way, so never use it on the live shop.

## Tests

```bash
npm test
```

53 tests run the whole API against a real PostgreSQL (PGlite in memory), with fake Twilio and Razorpay servers. They cover logging in and its limits, accounts and address books, the privacy of each customer's orders, placing and paying orders (UTR and Razorpay), webhooks and the admin page.

## How it is organised

```
backend/
├── src/
│   ├── server.js                start: read settings, connect the database, update its tables, listen
│   ├── app.js                   the API: middleware, then every module's routes, then the error handler
│   ├── config.js                every setting, read once from backend/.env and checked
│   ├── db/
│   │   ├── index.js             the connection (hosted Postgres, or PGlite locally): query, one, exec, tx
│   │   ├── migrate.js           applies migrations/ in order, once each
│   │   └── migrations/
│   │       └── 001_init.sql     the tables (read this file to understand the data)
│   ├── lib/
│   │   ├── errors.js            the errors the API answers with: badRequest, notFound, tooMany, …
│   │   ├── http.js              security headers, CORS, cookies, rate limits, the error handler
│   │   └── shared.js            prices, order maths and form checks shared with the website (../src/utils)
│   └── modules/                 one folder per part of the business
│       ├── auth/                logging in: codes (Twilio or test mode), sessions, who is calling
│       ├── customers/           profile and address book
│       ├── orders/              placing orders, UTRs, My Orders, admin steps
│       ├── payments/            Razorpay: client, confirming payments, webhook
│       └── admin/               the admin page and its routes
└── tests/                       end-to-end tests, one file per module
```

Each module is split the same way, so you always know where to look:

| File | Its job | Example |
|---|---|---|
| `*.routes.js` | The URLs. Reads the request, calls the service, sends the answer. No rules, no SQL. | `POST /api/me/addresses` → `customers.addAddress(…)` |
| `*.service.js` | The business rules. | "at most 10 addresses", "the first address is the default" |
| `*.repo.js` | The SQL. Small functions, one query each, returning plain objects. | `insertAddress(db, customerId, address)` |
| `*.views.js` | What each audience may see of a record. | the public order status has no address |

### What happens on a request

`app.js` runs these in order:

1. Security headers, and CORS (only when the website is on another domain)
2. The Razorpay webhook (it needs the raw body to check the signature)
3. JSON body parsing. A POST that is not JSON is refused, which stops forged requests from other sites.
4. **Who is calling:** the `tl_session` cookie is looked up and `req.customer` set (or left `null`)
5. The module routes: `/api/auth/*`, `/api/me*`, `/api/orders*`, `/api/admin*`
6. The error handler: every error becomes `{ code, error }` with the right HTTP status. Unexpected errors are logged and the customer sees a plain "Something went wrong".

### The API

| | |
|---|---|
| `POST /api/auth/otp` `{ phone }` | Texts a 6-digit code |
| `POST /api/auth/verify` `{ phone, code }` | Logs in (sets the cookie). A new number becomes a new customer |
| `POST /api/auth/logout` | Logs out |
| `GET /api/me` | The logged-in customer with their addresses (`user: null` when logged out), and which login is on |
| `POST /api/me` `{ name, email, gender }` | Saves the profile |
| `POST /api/me/addresses` | Adds an address. `/:id` edits it, `/:id/delete` deletes it, `/:id/default` makes it the default |
| `GET /api/me/orders` | My Orders, newest first |
| `GET /api/me/orders/:ref` | One order with its tracking timeline (only the customer's own) |
| `POST /api/orders` | Places an order for the logged-in customer (401 when nobody is logged in) |
| `GET /api/orders/:ref` | The payment status the checkout polls |
| `POST /api/orders/:ref/razorpay`, `/utr` | Confirms a Razorpay payment / sends a UTR |
| `POST /api/webhooks/razorpay` | Razorpay reporting payments |
| `/api/admin…` | The admin page: sign in, orders, confirm, reject, delivery steps |
| `GET /api/health` | What is switched on |

## The database

The tables are created by [`src/db/migrations/001_init.sql`](src/db/migrations/001_init.sql), where every column is explained, and changed by [`002_email_login.sql`](src/db/migrations/002_email_login.sql) (customers can log in with an email address too).

```
customers ──< addresses            a customer has up to 10 addresses, one of them the default
    │
    ├──< sessions                  one row per logged-in browser (only a hash of the cookie token)
    │
    └──< orders ──< order_items    customer_id is empty for a guest order
            ├──< payments          Razorpay payments for the order (a second one means "paid twice")
            └──< order_events      the history: placed, utr_submitted, paid, packed, shipped, delivered, …

otp_requests   every code sent, to a number or an address (limits how often one target or one visitor can ask)
test_codes     test-mode codes only (with Twilio, Twilio keeps the codes)
```

Some decisions worth knowing:

- **Money is whole rupees** (`integer`), the same as the product catalogue. Prices are always worked out on the server from `src/data/products.js`, never taken from the browser.
- **An order keeps its own copy of the delivery address**, so it never changes when the customer edits their address book later.
- **A customer logs in with a mobile number (`phone`), an email address (`login_email`), or both.** `login_email` is set only by typing a code we emailed; the profile's contact `email` is separate, so typing someone else's address into a profile can never open their account.
- **Rules the database enforces itself**: one account per phone number and per login email, every customer has at least one of them, one default address per customer, one UTR per paid order, totals equal subtotal plus shipping.
- **No passwords are stored anywhere.** Login cookies are random 64-character tokens, and only their SHA-256 hash is in `sessions`.
- **Changing the tables later:** add `002_something.sql` to `migrations/`. It runs once, automatically, the next time the server starts. Never edit a migration that has already run.

## Login, step by step

1. The customer types their mobile number, or taps **Use email instead** and types their email address. `POST /api/auth/otp` checks the limits (30 seconds between codes, 5 codes per number or address per hour, 20 per visitor per hour), then Twilio Verify sends a 6-digit code by SMS or by email.
2. They type the code. `POST /api/auth/verify` asks Twilio whether it is right (Twilio allows 5 tries per code, and codes last 10 minutes).
3. If it is right: a number or address we have not seen becomes a new customer (an email customer gets that address as their contact email too), and a session starts. The browser gets the `tl_session` cookie, which is `HttpOnly` (page scripts cannot read it), `Secure`, `SameSite=Lax` and only sent to `/api`. It lasts 30 days.
4. A new customer is asked for their name (and, if they used their mobile number, an optional email). After that, every call knows who they are through the cookie.

Placing an order needs a login (the orders service refuses one without a customer, 401). Every order gets the customer's ID (`orders.customer_id`), so it shows in their My Orders, and its delivery address is saved to their address book. On the website, **Checkout** opens the login window first when nobody is logged in.

## Settings

All in `backend/.env` (copy `.env.example`). Real environment variables win over the file, which is how hosts pass settings.

| Setting | What it is |
|---|---|
| `DATABASE_URL` | Your hosted Postgres connection string. Empty: a local database in `backend/.data/db` |
| `TWILIO_ACCOUNT_SID` | Twilio Console home page, starts with `AC` |
| `TWILIO_AUTH_TOKEN` | Twilio Console home page. A secret |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Console → Verify → Services → your service, starts with `VA` |
| `TWILIO_VERIFY_EMAIL` | `true` once the Verify service can send codes by email (below). Turns on **Use email instead** on the login screen |
| `OTP_TEST_MODE` | `true` shows the code on screen instead of texting it. Only for trying it out |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay → API Keys (`rzp_test_…` first, `rzp_live_…` after KYC) |
| `RAZORPAY_WEBHOOK_SECRET` | The secret of the Razorpay webhook to `https://<site>/api/webhooks/razorpay` |
| `MERCHANT_UPI_ID`, `MERCHANT_NAME` | Your own UPI ID for the fallback QR code, and the payee name |
| `ADMIN_PASSWORD` | The admin page password (12+ characters) |
| `PORT` | Default 8787 |
| `TRUST_PROXY` | `true` when a host or proxy sits in front (it is on almost every host) |
| `ALLOWED_ORIGIN` | Only if the website and the API are on different domains: the website's address |

If a setting is wrong (a Twilio SID that is not `AC…`, only one of the two Razorpay keys), the server refuses to start and says exactly what to fix.

## Going live

Two things are needed: a **PostgreSQL database** and a **host for this backend**. The website then forwards `/api` to the backend, so the login cookie stays on the website's own domain.

1. **Database:** create a free Postgres at [Neon](https://neon.tech), in the region closest to India that it offers. Copy its connection string into `DATABASE_URL`. The tables are created the first time the backend starts (or run `npm run migrate`).
2. **Backend host:** any Node host that keeps a server running, such as [Render](https://render.com) or [Railway](https://railway.app). New web service from the GitHub repo, root directory `backend`, build command `npm install`, start command `npm start`, and the settings above as environment variables, with `TRUST_PROXY=true`. Pick a plan that does not sleep: a sleeping free server makes the first login take 30 seconds or more.
3. **Website:** on Vercel, add the environment variable `VITE_PAYMENT_API=/api`, and a `vercel.json` in the project folder that forwards the API:
   ```json
   { "rewrites": [{ "source": "/api/:path*", "destination": "https://YOUR-BACKEND-ADDRESS/api/:path*" }] }
   ```
   Then deploy the website again.
4. **Razorpay webhook:** `https://<your site>/api/webhooks/razorpay` (see the main README, Payments).
5. Check `https://<your site>/api/health`. It should say `"database":"postgres"` and `"login":"twilio"`.

## What you do manually

These need your accounts, money or decisions, so they can't be done from the code.

**For customer login (Twilio):**

1. In the [Twilio Console](https://console.twilio.com): **Verify → Services → Create new**. Name it "TranzLife", tick **SMS**.
2. Copy three values into `backend/.env` (never into chat, email or git): **Account SID** (`AC…`) and **Auth Token** from the Console home page, and the service's **Service SID** (`VA…`).
3. A **trial** Twilio account only texts numbers you have verified (Console → Phone Numbers → Verified Caller IDs). **Upgrade** the account (add a card) before real customers log in. Twilio charges for each verification. See its Verify pricing page for India.
4. Test: `npm run dev` in `backend/`, log in on the website with your own phone, and check the SMS arrives. If SMS to Indian numbers don't arrive, look at Twilio Console → Monitor → Logs → Errors.

**For email login (Twilio Verify sends the code through SendGrid):**

5. Create a [SendGrid](https://sendgrid.com) account (it is Twilio's email service) and verify the address the codes come from, for example `care@tranzlife.in` (Settings → Sender Authentication; authenticating the whole domain keeps the emails out of spam).
6. SendGrid → Settings → **API Keys** → Create, with **Mail Send** access. Keep the key secret.
7. SendGrid → Email API → **Dynamic Templates** → Create a template, for example "Your TranzLife login code is {{twilio_code}}". `{{twilio_code}}` is where Twilio puts the code. Copy the template ID (`d-…`).
8. Twilio Console → Verify → **Email Integration** → Create: paste the SendGrid API key, the template ID, and the from address and name ("TranzLife Biosciences").
9. Twilio Console → Verify → Services → TranzLife → **Email**: choose that integration, and save.
10. In `backend/.env` set `TWILIO_VERIFY_EMAIL=true` and restart. The start-up message then says "codes by SMS and by email", and the login screen shows **Use email instead**. Until then the link is hidden on the live site (test mode shows it).

**For the database:**

11. Create the Neon database and put its connection string in `DATABASE_URL` (for the hosted backend; your computer can keep using the local one).
12. Check Neon's backup and restore settings (how far back your plan can restore), and keep the connection string secret: it can read every order.

**For hosting:**

13. Create the backend host account (Render or Railway), connect the GitHub repo and paste the settings (step 2 of Going live). Choose a plan that does not sleep.
14. On Vercel: set `VITE_PAYMENT_API=/api`, add the `vercel.json` forward, and make sure the production branch is the one with this code (`develop`, or merge it into `main`).

**For payments** (when you are ready; see the main README → Payments → Setting it up):

15. Razorpay test keys, then the webhook, then KYC and live keys. Razorpay's KYC also checks that the site has Terms, Privacy, Refund, Shipping and Contact pages, which it does not have yet.

**Every day, on the admin page** (`https://<your site>/api/admin`):

16. Confirm or reject UTR payments, and move paid orders along: **Mark packed → shipped → out for delivery → delivered**. Customers see each step in My Orders.

**Legal:**

17. You now store customers' phone numbers, names, emails and addresses. India's DPDP Act expects a **privacy policy** saying what you collect and why, and a way for customers to ask for their data to be deleted. Add a Privacy page before going live.
