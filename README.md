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

## Requirements

- Node.js 18 or newer (20 LTS recommended)
- Python 3.10+ only if you want to regenerate the image assets in `scripts/`

## Setup and run

```bash
npm install
npm run dev          # http://localhost:5173 with live reload
npm run server       # payment API and admin page on http://localhost:8787 (only needed for real payments, see Payments)
```

Without the payment server the checkout runs in **test mode**: the whole flow works and nothing is charged.

## Build

```bash
npm run build        # static site in dist/  (upload this folder to any static host)
npm run preview      # serve dist/ locally to check the build
npm run build:single # one self-contained file: dist-single/index.html (works from disk, easy to email)
```

`dist/` uses ES modules, so open it through a web server (`npm run preview` or your host), not by double-clicking. Use `build:single` when you need a file that opens straight from disk.

## Test

```bash
npm test             # Vitest: helpers, catalogue data, order pricing, UPI/UTR/card checks, and the payment API end to end
```

## Configuration

Copy `.env.example` to `.env`. Everything is optional:

| Variable | Read by | What it does when set |
|---|---|---|
| `VITE_PAYMENT_API` | site | Payment server base URL (e.g. `/api`). Empty means the checkout runs in test mode |
| `VITE_CONTACT_ENDPOINT` | site | The contact form is posted to this URL as JSON |
| `RAZORPAY_KEY_ID` | server | Razorpay key ID (`rzp_test_…` or `rzp_live_…`). With the secret, turns on the UPI QR code, the UPI app buttons and the card tab |
| `RAZORPAY_KEY_SECRET` | server | Razorpay key secret. Never put it in a `VITE_` variable |
| `RAZORPAY_WEBHOOK_SECRET` | server | Secret of the Razorpay webhook to `/api/webhooks/razorpay`, so payments confirm even if the customer closes the page |
| `MERCHANT_UPI_ID` | server | Your own UPI ID for the fallback QR code (used when Razorpay is not available), e.g. `tranzlife@okhdfcbank`. Optional |
| `MERCHANT_NAME` | server | Payee name shown in the customer's UPI app (default `TranzLife Biosciences`) |
| `ADMIN_PASSWORD` | server | Password for the admin page where you confirm payments (use 12+ characters) |
| `PAYMENT_PORT` | server, dev proxy | Payment server port (default 8787) |
| `PAYMENT_ALLOWED_ORIGIN` | server | The site's origin, only when the site and the payment server are on different domains |
| `PAYMENT_TRUST_PROXY` | server | `true` behind a reverse proxy, so rate limiting sees the shopper's IP |
| `PAYMENT_DATA_FILE` | server | Where orders are saved (default `server/data/orders.json`) |

Anything starting with `VITE_` ends up in the public site, so never put a secret there. The other values are read only by the payment server.

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

How a Razorpay payment is confirmed (`server/app.js`, `server/razorpay.js`): the server creates a Razorpay order for the exact amount it priced, and every payment (QR code, UPI app or card) is made against that order. The server marks the order paid only after **Razorpay itself** reports the payment captured, for this order and the full amount. Three things can report it, and any one is enough: the checkout's signed response, Razorpay's signed **webhook**, and the server asking Razorpay (whenever the customer's page or the admin page checks an unpaid order; the customer's page asks every few seconds while a QR code is showing). So an order is still confirmed if the customer closes the page right after paying. The browser's word alone never marks an order paid.

### You (the admin page)

Open **`/api/admin`** on the site (or `http://localhost:8787/api/admin` locally) and sign in with `ADMIN_PASSWORD`.

- **Paid:** Razorpay orders land here by themselves, showing "Paid by UPI · Razorpay" (with the UTR and the payer's UPI ID) or "Paid by card · Razorpay", and Razorpay's payment ID. If a customer somehow pays one order twice, the order shows **Paid twice** with the extra payment's ID. Refund it from the Razorpay dashboard.
- **To verify:** fallback QR orders with a UTR. Each shows the amount to look for, the UTR (with Copy), the customer's name, phone, email and address, and the items. Find the UTR and amount in your bank or UPI app, then click **Confirm payment**. If it isn't there, or the amount is short, click **Reject** and give a reason (the customer sees it).
- **Awaiting payment:** orders not paid yet (including people who showed a QR code or opened their UPI app and didn't finish). Opening the admin page also asks Razorpay about the last two days' unpaid Razorpay orders, so a payment whose webhook went missing still shows up as paid. If you find a fallback QR payment in your bank with that order number in the note, use **Mark paid** and enter the UTR from your bank app.
- **WhatsApp** opens a chat with the customer, with a message for the order's status already written.
- The server refuses a UTR that is already on another order being checked or paid, and refuses a UTR you rejected if it's sent again for the same order.

A UTR typed by a customer is **not proof of payment**. Confirm only after you see the money arrive with that UTR and amount.

### Setting it up

**Razorpay (UPI QR code, UPI apps, cards):**

1. Sign up at Razorpay. **Test mode works straight away**, before KYC, with no real money.
2. Dashboard → Account & Settings → **API Keys**: generate test keys. In `.env` set `RAZORPAY_KEY_ID` (`rzp_test_…`) and `RAZORPAY_KEY_SECRET`. The secret stays on the server and never reaches the browser.
3. Dashboard → **Webhooks** → Add: URL `https://<your site>/api/webhooks/razorpay`, events `payment.captured` and `order.paid`, and a secret, which goes in `RAZORPAY_WEBHOOK_SECRET`. (Webhooks need a public HTTPS address, so set this up once the server is hosted.)
4. Keep **automatic capture** on (Payment Capture settings, the default). An order is marked paid once its payment is captured.
5. **Ask Razorpay support to switch on "UPI QR code, non-redirect flow" for Custom Checkout.** It's what puts the QR code on the page, and Razorpay enables it per account. Until it's on, computers get the fallback QR (if `MERCHANT_UPI_ID` is set) or a message to pay by card or from a phone. Phones and cards don't need it.
6. Cards are typed into the site's own form and sent straight to Razorpay by its script (Custom Checkout). Razorpay may ask for a PCI DSS self-assessment questionnaire (SAQ A-EP) for this. If you'd rather avoid it, the card tab can open Razorpay's own card window instead.
7. Complete Razorpay's KYC for live payments: PAN, bank account, GST if registered, business proof, probably an FSSAI licence for supplements. Razorpay also checks the website for **Terms, Privacy, Refund/Cancellation, Shipping and Contact pages**, which the site doesn't have yet. When approved, swap in the `rzp_live_…` keys and a live webhook.

**Fallback QR (your own UPI ID), optional:**

1. Use a **business (merchant) UPI ID** from your bank's merchant app, PhonePe Business, Paytm for Business, BharatPe or similar (the one printed on your company QR code). Business IDs are less likely to hit the limits some apps apply to personal IDs. Their apps also notify you of each payment, which makes checking UTRs quick.
2. In `.env`: `MERCHANT_UPI_ID` and `MERCHANT_NAME` (as it appears to payers).

**Both:**

1. In `.env`, a long `ADMIN_PASSWORD`.
2. Run the payment server (`npm run server`, Node 18+) on a host that stays up. Route `/api` on the site's domain to it, with a reverse proxy such as nginx or Caddy, or your host's rewrites. Serve it over HTTPS and set `PAYMENT_TRUST_PROXY=true`. The start-up log says what is on, and whether Razorpay is in test or live mode.
3. Build the site with `VITE_PAYMENT_API=/api` (or the server's full URL plus `PAYMENT_ALLOWED_ORIGIN`), then upload `dist/`.
4. With test keys, pay test orders three ways: the QR code on a computer, a UPI app on a real Android phone, and a Razorpay test card. Check that each reaches **Paid** on the admin page by itself. Once live, place a real ₹1-₹10 order the same way.

### Notes

- Orders are saved to a JSON file (`server/data/orders.json`, which git ignores because it holds customer details). That suits one small server. Move to a database before running several instances. Back the file up.
- The delivery fee (₹49 under ₹999) is a placeholder in `src/data/shipping.js`. The server and the site both read it.

## Project structure

```
src/
├── main.js        entry point: loads styles, boots features in order
├── app/           app-wide plumbing: state, loader, brand, sections, smooth scroll, scroll animations, intro
├── assets/        images and logo parts (imported by CSS/HTML, hashed at build)
├── components/    small shared UI (toast, design lightbox)
├── data/          content: products, delivery fees and states, product story cards, herbs, needs, lab, sections, pipeline stages
├── features/      one folder per page feature (hero, product-story, products, pipeline, science, lab, finder, cart, checkout, contact, navigation)
├── lib/           GSAP setup, canvas artwork, 3D reflection environments (molecule scenes)
├── styles/        base/, components/, sections/, responsive.css, imported by main.css in cascade order
└── utils/         dom, math/easing, formatting, media preferences, order pricing, card/UPI checks
server/            payment API and admin page (plain Node, no dependencies): orders, Razorpay (UPI QR code, UPI apps, cards), UTRs, confirming payments
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
- The logo lives in `src/assets/logo/`. To replace it, run `python scripts/cut-logo.py new-logo-on-white.png` (or drop in your own transparent WebP files with the same names), then run `python scripts/make-logo-sketch.py` to redraw the loading-screen sketch, and rebuild.
- Product images live in `src/assets/products/`. To update them after a design changes, put the five design files (`gummies.png`, `inhaler.png`, `rollon.png`, `reviva.png`, `liver.png`) in a folder and run `python scripts/make-product-assets.py path/to/folder`. The cut-outs used in the hero and the product story come from `python scripts/make-product-cutouts.py path/to/folder` (needs `rembg`, see `scripts/requirements.txt`). The crop boxes at the top of each script match the current designs.
- Prices in `src/data/products.js` are placeholders until the client confirms them.
- The contact form is front-end only until `VITE_CONTACT_ENDPOINT` is set. The checkout runs in test mode until the payment server is connected (see Payments).
