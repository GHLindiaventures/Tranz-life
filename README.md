# TranzLife Biosciences website

Marketing and shop site for TranzLife Biosciences ("Innovating Life Beyond Limits"): five plant-based products (gummies, a calming inhaler, a period relief roll-on, the Reviva foot-care roll-on and a liver booster liquid).

The site is a single page built with Vite and plain JavaScript (ES modules). It includes:

- the real product images from the client's designs: cut out for the hero and the product story, square shots elsewhere
- a pinned product story where each product comes forward while its feature card glides past
- a pinned benefits panel that steps through every product's benefits
- the client's product images everywhere a product is shown, with a "View design" lightbox
- a molecule "seed to shelf" pipeline
- smooth scrolling (Lenis) with GSAP ScrollTrigger animations
- a left dock menu
- a bag and a checkout where shoppers pay with Google Pay, PhonePe, Paytm or BHIM through Razorpay (confirmed by itself, no UTR), or by QR code to TranzLife's UPI ID with a UTR, plus an admin page for orders (see [Payments](#payments))
- customer accounts: log in with your mobile number and a code by SMS, then My Orders (with delivery tracking), profile and saved addresses (see [Customer accounts](#customer-accounts))

The backend (login, accounts, orders, payments, PostgreSQL database) is in its own folder, [`backend/`](backend/README.md).

## Requirements

- Node.js 20.12 or newer (22 LTS recommended)
- Python 3.10+ only if you want to regenerate the image assets in `scripts/`

## Setup and run

```bash
npm install
npm run dev              # http://localhost:5173 with live reload

npm run backend:install  # once: the backend's own packages
npm run backend          # the API and admin page on http://localhost:8787 (see backend/README.md)
```

Without the backend, login and checkout run in **test mode** inside the browser: the whole flow works, nothing is saved on a server and nothing is charged. To use the backend from `npm run dev`, set `VITE_PAYMENT_API=/api` in `.env`.

## Build

```bash
npm run build        # static site in dist/  (upload this folder to any static host)
npm run preview      # serve dist/ locally to check the build
npm run build:single # one self-contained file: dist-single/index.html (works from disk, easy to email)
```

`dist/` uses ES modules, so open it through a web server (`npm run preview` or your host), not by double-clicking. Use `build:single` when you need a file that opens straight from disk.

## Test

```bash
npm test             # Vitest: helpers, catalogue data, order pricing, UPI/UTR/card checks, account checks
npm run backend:test # the backend end to end on a real (in-memory) PostgreSQL: login, accounts, orders, Razorpay, admin
```

## Configuration

The website and the backend each have their own settings file. Everything is optional.

**Website:** copy `.env.example` to `.env`.

| Variable | What it does when set |
|---|---|
| `VITE_PAYMENT_API` | The backend's address (e.g. `/api`). Empty means login and checkout run in test mode in the browser |
| `VITE_CONTACT_ENDPOINT` | The contact form is posted to this URL as JSON |
| `API_PORT` | The backend port that `npm run dev` forwards `/api` to (default 8787) |

Anything starting with `VITE_` ends up in the public site, so never put a secret there.

**Backend:** copy `backend/.env.example` to `backend/.env`. It holds the database address, the Twilio, Razorpay and UPI settings and the admin password, which never reach the browser. Each one is explained in [backend/README.md](backend/README.md#settings).

## Payments

The payment step has the methods on the left, the chosen one in the middle and the order summary on the right. There are two methods. Both go through Razorpay, so the order **confirms by itself** and nobody types or checks a UTR:

- **UPI.** On a computer, a **QR code** for the order, with Google Pay, PhonePe, BHIM and Paytm logos under it. On a phone, **buttons** that open Google Pay, PhonePe, Paytm, BHIM or (on Android) any other UPI app, because a phone can't scan its own screen.
- **Credit / Debit / ATM card.** Visa, Mastercard, RuPay, Amex and Maestro. The bank asks for an OTP in Razorpay's window.

Razorpay charges a fee per payment (about 2% plus GST on its standard plan; check its pricing page).

**Fallback, your own UPI QR code.** If Razorpay isn't set up, is down, or can't show a QR code, the UPI tab shows a QR code for TranzLife's own UPI ID (`MERCHANT_UPI_ID`) instead. It has no gateway and no fee, but nothing reports these payments, so the customer sends the payment's **UTR** (the 12-digit UPI reference number) and you check it in your bank app before confirming the order. The card tab needs Razorpay and is hidden without it.

Why there's no picture of a company QR code: a fixed QR image can't carry the amount or the order number, and nothing tells the site it was paid. The site makes a QR code for each order instead, through Razorpay (confirms by itself) or from your UPI ID (fallback, with UTR). To use your company's QR code, put the UPI ID printed on it in `MERCHANT_UPI_ID`.

Why no "enter your UPI ID": NPCI stopped online shops sending UPI collect requests (the customer types their UPI ID and approves a request) on Android and computers from 28 February 2026. A QR code on computers and opening the app directly (UPI intent) on phones are what replace it.

### The customer

1. **Checkout → delivery details.** This creates the order (`TL-261123-7K3QXM2A`) with their name, mobile, email and address. The order is how you know who paid.
2. **UPI.**
   - **On a computer:** they click **Show QR code**. A QR code for this order appears, valid for 10 minutes with a countdown. They scan it with any UPI app on their phone and enter their UPI PIN in that app. The page notices the payment and says **Payment confirmed**. If the QR code runs out, they click **Show new QR code**.
   - **On a phone:** they tap Google Pay, PhonePe, Paytm, BHIM or (Android only) "Other UPI app". That app opens with the amount filled in. They enter their UPI PIN and come back to the site, which says **Payment confirmed**. If the bank is slow, it says **Payment received** and changes to confirmed by itself.
   - The UPI PIN is only ever typed in the customer's UPI app. The site never asks for it.
3. **Or card.** Card number, name, expiry and CVV, then **Pay**. The details go from the browser straight to Razorpay (they never reach your server), Razorpay's window shows the bank's OTP page, and the page confirms by itself.
4. **Fallback QR (your own UPI ID).** A UPI QR for the exact amount, with the order number as the payment note, so it shows next to the payment in your bank app. Then they **send the UTR**. It's in their UPI app's payment details ("UPI transaction ID" in Google Pay, "UTR" in PhonePe, "UPI Ref. No." in Paytm). The order moves to **verifying**, and the page says "Payment submitted". It checks every 15 seconds, and changes to **Payment confirmed** when you confirm. If you reject the UTR, they see your reason and can send a corrected one.

How a Razorpay payment is confirmed (`backend/src/modules/payments/`): the server creates a Razorpay order for the exact amount it priced, and every payment (QR code, UPI app or card) is made against that order. The server marks the order paid only after **Razorpay itself** reports the payment captured, for this order and the full amount. Three things can report it, and any one is enough: the checkout's signed response, Razorpay's signed **webhook**, and the server asking Razorpay (whenever the customer's page or the admin page checks an unpaid order; the customer's page asks every few seconds while a QR code is showing). So an order is still confirmed if the customer closes the page right after paying. The browser's word alone never marks an order paid.

### You (the admin page)

Open **`/api/admin`** on the site (or `http://localhost:8787/api/admin` locally) and sign in with `ADMIN_PASSWORD`.

- **Paid:** Razorpay orders land here by themselves, showing "Paid by UPI · Razorpay" (with the UTR and the payer's UPI ID) or "Paid by card · Razorpay", and Razorpay's payment ID. If a customer somehow pays one order twice, the order shows **Paid twice** with the extra payment's ID. Refund it from the Razorpay dashboard.
- **To verify:** fallback QR orders with a UTR. Each shows the amount to look for, the UTR (with Copy), the customer's name, phone, email and address, and the items. Find the UTR and amount in your bank or UPI app, then click **Confirm payment**. If it isn't there, or the amount is short, click **Reject** and give a reason (the customer sees it).
- **Awaiting payment:** orders not paid yet (including people who showed a QR code or opened their UPI app and didn't finish). Opening the admin page also asks Razorpay about the last two days' unpaid Razorpay orders, so a payment whose webhook went missing still shows up as paid. If you find a fallback QR payment in your bank with that order number in the note, use **Mark paid** and enter the UTR from your bank app.
- **Delivery:** a paid order shows **Mark packed**, then **Mark shipped**, **Mark out for delivery** and **Mark delivered**. The customer sees each step, with its date, in My Orders.
- **WhatsApp** opens a chat with the customer, with a message for the order's status already written.
- The server refuses a UTR that is already on another order being checked or paid, and refuses a UTR you rejected if it's sent again for the same order.

A UTR typed by a customer is **not proof of payment**. Confirm only after you see the money arrive with that UTR and amount.

### Setting it up

**Razorpay (UPI QR code, UPI apps, cards):**

1. Sign up at Razorpay. **Test mode works straight away**, before KYC, with no real money.
2. Dashboard → Account & Settings → **API Keys**: generate test keys. In `backend/.env` set `RAZORPAY_KEY_ID` (`rzp_test_…`) and `RAZORPAY_KEY_SECRET`. The secret stays on the server and never reaches the browser.
3. Dashboard → **Webhooks** → Add: URL `https://<your site>/api/webhooks/razorpay`, events `payment.captured` and `order.paid`, and a secret, which goes in `RAZORPAY_WEBHOOK_SECRET`. (Webhooks need a public HTTPS address, so set this up once the server is hosted.)
4. Keep **automatic capture** on (Payment Capture settings, the default). An order is marked paid once its payment is captured.
5. **Ask Razorpay support to switch on "UPI QR code, non-redirect flow" for Custom Checkout.** It's what puts the QR code on the page, and Razorpay enables it per account. Until it's on, computers get the fallback QR (if `MERCHANT_UPI_ID` is set) or a message to pay by card or from a phone. Phones and cards don't need it.
6. Cards are typed into the site's own form and sent straight to Razorpay by its script (Custom Checkout). Razorpay may ask for a PCI DSS self-assessment questionnaire (SAQ A-EP) for this. If you'd rather avoid it, the card tab can open Razorpay's own card window instead.
7. Complete Razorpay's KYC for live payments: PAN, bank account, GST if registered, business proof, probably an FSSAI licence for supplements. Razorpay also checks the website for **Terms, Privacy, Refund/Cancellation, Shipping and Contact pages**, which the site doesn't have yet. When approved, swap in the `rzp_live_…` keys and a live webhook.

**Fallback QR (your own UPI ID), optional:**

1. Use a **business (merchant) UPI ID** from your bank's merchant app, PhonePe Business, Paytm for Business, BharatPe or similar (the one printed on your company QR code). Business IDs are less likely to hit the limits some apps apply to personal IDs. Their apps also notify you of each payment, which makes checking UTRs quick.
2. In `backend/.env`: `MERCHANT_UPI_ID` and `MERCHANT_NAME` (as it appears to payers).

**Both:**

1. In `backend/.env`, a long `ADMIN_PASSWORD`.
2. Host the backend with a PostgreSQL database and route `/api` on the site's domain to it ([backend/README.md → Going live](backend/README.md#going-live)). The start-up log says what is on, and whether Razorpay is in test or live mode.
3. Build the site with `VITE_PAYMENT_API=/api` (or the backend's full URL plus `ALLOWED_ORIGIN` in `backend/.env`), then deploy it.
4. With test keys, pay test orders three ways: the QR code on a computer, a UPI app on a real Android phone, and a Razorpay test card. Check that each reaches **Paid** on the admin page by itself. Once live, place a real ₹1-₹10 order the same way.

### Notes

- Orders, customers and payments are kept in PostgreSQL (see [backend/README.md](backend/README.md#the-database)). Use your database host's backups.
- The delivery fee (₹49 under ₹999) is a placeholder in `src/data/shipping.js`. The backend and the site both read it.

## Customer accounts

The person icon in the top bar (every page) logs customers in with their **mobile number and a 6-digit code by SMS**, like the big shops: no passwords, and a new number gets an account straight away. Logged in, the icon shows their initial and opens a menu: **My Orders**, **My Profile**, **Saved addresses**, **Log out**. These open `account.html`:

- **My Orders:** every order placed while logged in, newest first, with its status. Opening one shows the **tracking steps** (Ordered → Payment confirmed → Packed → Shipped → Out for delivery → Delivered, with dates), the items and price, the delivery address and the payment.
- **Profile information:** name, gender and email. The mobile number is how they log in.
- **Manage addresses:** up to 10 addresses (home or work), one of them the default.

Login is **optional at checkout**: guests still check out as before. A logged-in customer sees their saved addresses at the top of the delivery step (the default one is filled in), their order goes to My Orders, and a new delivery address is saved to their address book.

Codes are texted by **Twilio Verify**. Until the backend has Twilio keys, login runs in test mode: the code shows on the login screen. Setting it up: [backend/README.md → What you do manually](backend/README.md#what-you-do-manually).

## Project structure

```
src/
├── main.js        entry point: loads styles, boots features in order
├── app/           app-wide plumbing: state, loader, brand, sections, smooth scroll, scroll animations, intro
├── assets/        images and logo parts (imported by CSS/HTML, hashed at build)
├── components/    small shared UI (toast, design lightbox)
├── data/          content: products, delivery fees and states, product story cards, herbs, needs, lab, sections, pipeline stages
├── features/      one folder per page feature (hero, product-story, products, pipeline, science, lab, finder, cart, checkout, account, contact, navigation)
├── lib/           GSAP setup, canvas artwork, 3D reflection environments (molecule scenes)
├── styles/        base/, components/, sections/, account/, responsive.css, imported by main.css in cascade order
└── utils/         dom, html, math/easing, formatting, media preferences, order pricing, card/UPI checks, account checks
account.html       the customer's account page (src/account-page.js)
backend/           the API: Express + PostgreSQL. Login by SMS code, accounts, orders, Razorpay, admin page (backend/README.md)
public/            files copied as-is (favicons)
tests/             unit tests mirroring src/
scripts/           Python tools that regenerate the logo cut-out, the botanical background and the product images
docs/              architecture notes and changelog
```

See `docs/architecture.md` for how the pieces talk to each other.

## Editing content

- Products, prices and ingredients: `src/data/products.js`
- Delivery fee, free-delivery threshold and order limits: `src/data/shipping.js`
- Product story cards: `src/data/product-story.js` (same order as products)
- Benefits panel rows for each product: `src/data/benefits.js`
- Product finder: `src/data/needs.js`
- Science herbs: `src/data/herbs.js`
- R&D board: `src/data/lab.js`
- Pipeline stages: `src/data/pipeline.js`
- Menu sections: `src/data/sections.js` (each `id` must match a section `id` in `index.html`; a test checks this)

## Notes

- Fonts load from Google Fonts: Archivo and Caveat.
- The logo lives in `src/assets/logo/`. To replace only the emblem (the tree picture) and keep the TRANZLIFE wordmark, run `python scripts/cut-emblem.py emblem-on-white.png`, then `python scripts/make-logo-sketch.py`, and set the `aspect-ratio` it prints in `src/styles/components/logo.css` and `loader.css`. To replace the whole logo, run `python scripts/cut-logo.py new-logo-on-white.png` (or drop in your own transparent WebP files with the same names), then run `python scripts/make-logo-sketch.py` to redraw the loading-screen sketch, and rebuild.
- Product images live in `src/assets/products/`. To update them after a design changes, put the five design files (`gummies.png`, `inhaler.png`, `rollon.png`, `reviva.png`, `liver.png`) in a folder and run `python scripts/make-product-assets.py path/to/folder`. The cut-outs used in the hero and the product story come from `python scripts/make-product-cutouts.py path/to/folder` (needs `rembg`, see `scripts/requirements.txt`). The crop boxes at the top of each script match the current designs.
- Prices in `src/data/products.js` are placeholders until the client confirms them.
- The contact form is front-end only until `VITE_CONTACT_ENDPOINT` is set. Login and checkout run in test mode until the backend is connected (see Payments and Customer accounts).
