# Architecture

## Page flow

`index.html` holds the markup for every section, in this order:

1. hero (`#home`)
2. Why TranzLife (`#insider`)
3. product story (`#products`)
4. benefits (`#benefits`)
5. pipeline (`#process`)
6. science (`#science`)
7. R&D lab (`#lab`)
8. product finder (`#finder`)
9. shop (`#shop`)
10. contact (`#contact`)
11. footer

JavaScript only fills in and animates that markup.

## Boot order (`src/main.js`)

1. **Static UI.** Cart and contact handlers (the checkout dialog is built the first time someone opens it), the curved band at the foot of the hero, lab board, product finder buttons, dock and menu.
2. **Product images.** `features/products/product-images.js` imports the client's five product images into `thumbs`. The shop cards, finder, menu card, bag, Why TranzLife cards and benefits panel all use them. `components/lightbox.js` opens the full design board for any `[data-design]` button.
3. **Hero product.** `features/hero/hero-jar.js` places the Lung Booster Gummies tub (cut out of the client's photo) in the hero. On desktop it then flies down the page in a zig-zag, on a fixed `#flight` layer driven by the scroll: it fills the empty Lung Booster card in the Why TranzLife section, then carries on and hands over to the product story's first tub (`state.heroFlight`); when the story lets go it leaves the lineup and fills the empty Lung Booster photo in the Benefits section (empty slots come from the `flight-on` class on `<html>`).
4. **Content that needs the images.** Shop grid, finder match, molecule viewer and herb picker.
5. **Scroll scenes.** The product story (`features/product-story`) and the molecule reactor (`features/pipeline`), plus `app/page-sections.js`, which tracks the current section and dispatches `tl:page` events.
6. **Smooth scroll and reveals.** Lenis smooth scroll, the ScrollTrigger reveals, then the intro timeline hides the loader.

A 25-second fail-safe always hides the loader, even if a 3D scene fails.

## How modules share things

- **`app/state.js`** holds the mutable shared objects:
  - `thumbs` (product image URLs, by product id)
  - `cart` (Map of id to quantity)
  - `state` (the Lenis instance and scene handles)

  ES module imports are read-only, so shared values live on these objects rather than as `let` exports.
- **Content lives in `src/data/`.** Features import it and never hard-code copy.
- **Events.**
  - `tl:page` fires when the current section or theme changes. The nav and dock listen to it.
  - `tl:goStage` jumps to a pipeline stage.
  - `tl:ordered` fires when the customer has paid (UTR sent, or test card paid; `detail`: ref, total, status, method). The bag listens to it and empties.
- **Product images.** Only the client's own product images are shown. `features/products/product-images.js` exports `SHOTS` (square shots), `CUTS` (transparent cut-outs for the hero and the product story) and `DESIGNS` (full boards for the lightbox).
- **Checkout and payments.**
  - Adding a product shows the mini bag bar (`features/cart/mini-bag.js`): the item just added, the bag's thumbnails, count, subtotal and free-delivery progress, with View bag / Checkout.
  - `features/cart/cart.js` hands the bag lines (`[{ id, qty }]`) to `features/checkout/checkout.js`, the dialog: delivery details, then payment, then a receipt. The payment step has the methods (UPI, card) on the left, the chosen one beside them and the order summary on the right. UPI on a computer: "Show QR code", scan, confirmed by itself. UPI on a phone: tap a UPI app, approve, confirmed by itself. Card: details, the bank's OTP, confirmed by itself. Fallback (no Razorpay): TranzLife's own QR code, send the UTR, then a "verifying" page that turns into "confirmed".
  - `features/checkout/gateway.js` is the payment logic behind one interface (`methods`, `createOrder`, `prepare`, `showQr`, `payUpi`, `payCard`, `submitUtr`, `status`). Everything goes through Razorpay Custom Checkout (`razorpay.js`), each payment made against the order's Razorpay order: `showQr` uses the UPI QR non-redirect flow (`createPayment(..., { app:'any', flow:'qr' })`, then `payment.upi.qr` gives the QR content, drawn by `qr-code.js`, valid 10 minutes); `payUpi` opens the chosen app (`createPayment(..., { app })`); `payCard` sends the card fields (`method:'card'`) and Razorpay opens the bank's OTP page. They must run straight from the tap. If Razorpay cannot show a QR code (`qr_unavailable`, the feature is off for the account), the checkout switches to the fallback QR when there is one. The UPI app logos are in `assets/payment/`. With `VITE_PAYMENT_API` set it is the **live** provider, which calls the payment server. Without it, it is the **demo** provider, which runs the same flow in the browser.
  - Razorpay payments are reported by Razorpay, so they need no UTR (see `server/` below).
  - Fallback QR payments go to TranzLife's own UPI ID through a QR code (`utils/payment.js` `upiUri`, `features/checkout/qr-code.js`), with the order number as the payment note. Nothing reports the payment automatically: the customer sends the UTR, and an admin confirms it after finding it in the bank app.
  - `utils/order.js` (`priceOrder`, `orderRef`) and `utils/payment.js` (field, UPI ID, UTR and card checks) are pure and shared with the server, so the browser and the server price an order the same way. The server's price is the one used.
  - `server/` is a dependency-free Node payment API: `app.js` (orders, Razorpay confirmation, UTR rules, admin sign-in and confirm/reject), `razorpay.js` (Razorpay orders, payments and signature checks with plain `fetch`), `admin.html` (the admin page, served at `/api/admin` with a strict content security policy), `store.js` (orders in a JSON file), `index.js` (reads `.env`, starts on `PAYMENT_PORT`). Vite proxies `/api` to it in dev and preview.
  - A Razorpay order (QR code, UPI app or card) is marked paid only when Razorpay reports a captured payment for that Razorpay order and the full amount. It hears through the checkout's signed response (`POST /api/orders/:ref/razorpay`), the signed webhook (`POST /api/webhooks/razorpay`), or by asking Razorpay when the customer's page or the admin page checks an unpaid order (at most every 8 s per order). All three go through one idempotent function, so repeats are harmless, and a second payment on a paid order is recorded for a refund.
  - Order status: Razorpay: `awaiting_payment` → `paid`. Fallback QR: `awaiting_payment` → `verifying` (UTR sent) → `paid`, or → `rejected` (the customer can send a corrected UTR).
- **3D.** Three.js is used only for the molecule scenes (science viewer and pipeline reactor).
  - `lib/environment.js` provides the reflection cube maps.

## Styles

`src/styles/main.css` imports the files in cascade order:

1. tokens
2. global base
3. components (logo, loader, nav, dock, menu, drawer, lightbox, checkout, mini bag)
4. sections
5. `responsive.css`

Colour themes are CSS custom properties. Adding `.t-green` or `.t-cream` to any element switches its palette.

## Assets

| File | Source |
|---|---|
| `src/assets/products/*` | Made by `scripts/make-product-assets.py` from the client's five product designs (Nov 2026): square product images and full design boards; `*-cut.webp` cut-outs by `scripts/make-product-cutouts.py` |
| `src/assets/logo/*` | Made by `scripts/cut-logo.py` from the client's banyan-tree logo (Nov 2026) |
| `src/assets/images/botanical-background.jpg` | Original image made by `scripts/make-botanical-background.py` |
| `src/assets/images/dna-helix.webp` | Client-supplied DNA reference image, cut out and upscaled. **Confirm usage rights before launch.** |
