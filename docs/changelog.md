# Changelog

## v13.4 (25 Nov 2026): − / + quantity on the bag bar and in the order summary
- **Bag bar:** after adding a product, the bar shows **− n +** for it (its thumbnail comes first, with a ring). The text flashes "Calm Inhaler × 3" as it changes. − on the last one is a bin that takes the product out, and the control moves to the next product (the bar goes away when the bag is empty). + stops at 10 of a product. The bar now shows the total first ("₹747 · 3 items"), so a narrow phone cuts the count, not the money.
- **Checkout order summary:** every item has **− n +** and "₹249 each". The bag changes with it. − on the last one of a product is a bin, except for the only product left (an order needs one). The receipt shows "3 × ₹249" without the buttons.
- On the **payment step**, a quantity change makes the order again for the new amount (its QR code and Razorpay order were for the old one). The payment area greys out with "Updating your order for the new amount…", waits for the clicks to stop, then shows the new order number and amount, so quick clicks make one new order.
- One quantity rule for the bag drawer, the bar and the summary (`setQty` in `features/cart/cart.js`). Screen readers hear each change ("Calm Inhaler: 4. Total ₹1,345.") and keep their place on the button.

## v13.3 (25 Nov 2026): new payment step, QR code with UPI app logos, and cards
- The payment step is laid out like a shop's payment page: the methods on the left (**UPI** "Pay by any UPI app", **Credit / Debit / ATM Card**), the chosen method in the middle, and the order summary with the total amount on the right. A "100% secure" badge sits by the heading. On narrow screens the methods sit in a row above the method, and on phones the summary folds at the top.
- **UPI on a computer:** "Scan QR and pay", with the amount, a blurred QR and a **Show QR code** button. Clicking it makes a QR code for this order (Razorpay), valid for 10 minutes with a countdown. Under it, "Scan with any UPI app" and the **Google Pay, PhonePe, BHIM and Paytm** logos, plus "+ more". The page confirms by itself once the customer pays from their phone. When the code runs out, **Show new QR code**.
- **UPI on a phone:** the app logos are buttons (Google Pay, PhonePe, Paytm, BHIM, and "Other UPI app" on Android) that open the app with the amount filled in, as before.
- **Cards** are live with Razorpay: credit, debit and ATM cards (Visa, Mastercard, RuPay, Amex, Maestro; the matching network lights up as the number is typed). The details go from the browser straight to Razorpay, the bank asks for an OTP in Razorpay's window, and the order confirms by itself. The receipt says, for example, "Visa card ending 1111".
- Razorpay now runs through one script (Custom Checkout, `razorpay.js`) on every device. The computer QR code uses Razorpay's on-page QR flow, which Razorpay switches on per account (README → Payments → Setting it up).
- The separate "QR code" tab is gone. TranzLife's own UPI ID (`MERCHANT_UPI_ID`) is now a fallback: its QR code and the UTR form show only when Razorpay is not set up, is down, or can't make a QR code.
- Admin page: Razorpay payments show "Paid by UPI · Razorpay" or "Paid by card · Razorpay".
- Test mode: the QR code is a test code (not payable), with "Customer scans and pays" and "Bank declines" buttons under it.

## v13.2 (25 Nov 2026): UPI tab pays through Razorpay, with no UTR
- The **UPI** tab now shows one button per app: **Google Pay, PhonePe, Paytm, BHIM**, and "Other UPI app" on Android. On a phone, tapping one opens that app with the amount filled in. The customer approves with their UPI PIN and comes back to **Payment confirmed**. On a computer, which can't open UPI apps, the same buttons open Razorpay's window with a QR code for the order.
- No UTR on the UPI tab: Razorpay reports the payment. The server marks the order paid only when Razorpay says the payment is captured for that order and the full amount. It hears through the checkout's signed response, a signed webhook (`/api/webhooks/razorpay`), or by asking Razorpay when the customer's page or the admin page checks. So it still confirms if the customer closes the page. If the bank is slow, the receipt says "Payment received" and changes to confirmed by itself.
- "Enter your UPI ID and approve the request" (UPI collect) is not offered: NPCI stopped online shops sending collect requests on Android and computers from 28 February 2026.
- The **QR code** tab is unchanged: pay TranzLife's own UPI ID, then send the UTR for the admin to check. The UTR form now shows only on this tab.
- Admin page: UPI-app orders show under Paid with the UTR, Razorpay payment ID and payer's UPI ID, and "Paid twice" (with the payment to refund) if one order is paid twice.
- Each tab shows only when it is set up. New server settings: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (README → Payments). Still no new dependencies: `server/razorpay.js` uses plain `fetch`.
- Test mode: a test screen walks through what happens on the customer's phone (the app opens, they pick a bank account and enter their UPI PIN **in the app**, the bank approves) and lets you choose the outcome: pays, bank declines, or backs out. It has no PIN box: a website never asks for a UPI PIN, and the checkout now says so.
- Fixed: the receipt left an empty cell when it showed both a UTR and a payment ID. The page no longer gets a stray 16px bottom margin while the checkout is open.
- Tests: the Razorpay flow end to end against a fake Razorpay API (amount in paise, forged signatures, short, uncaptured and failed payments, webhooks and repeats, double payment, Razorpay down, missed webhooks).

## v13.1 (23 Nov 2026): a mini bag bar when a product is added
- Adding a product now slides up a small bag bar at the bottom centre of the screen, instead of the one-line "added to your bag" message. It shows the product just added (and how many are in the bag), the whole bag as thumbnails with quantities (up to four, then "+n"), the item count and subtotal, and a progress bar to free delivery ("Add ₹450 more for free delivery" / "You get free delivery").
- **View bag** opens the bag drawer and **Checkout** goes straight to the checkout. The bar hides itself after 5 seconds, but not while the pointer or keyboard focus is on it. × or Escape closes it. Screen readers hear "<product> added. 3 items in your bag, ₹1,747."
- It never shows over the open bag or the checkout, and it hides when an order is placed. On phones it spans the screen width with full-width buttons. With reduced motion it fades instead of sliding.
- Fixed: after "Added ✓" the Add button lost its "+" icon, and clicking it twice quickly could leave it stuck on "Added ✓".
- Code: `features/cart/mini-bag.js` and `styles/components/mini-bag.css`.

## v13.0 (23 Nov 2026): checkout with UPI and QR payments to TranzLife's own UPI ID
- "Checkout" in the bag opens a checkout dialog: delivery details (name, mobile, email, address, state, PIN code, all checked), then payment, then a receipt. Every order gets a number like `TL-261123-7K3QXM2A` that carries the customer's details, so you always know who paid.
- Customers pay TranzLife's own UPI ID with no payment gateway and no fees:
  - **UPI:** on phones, "Open my UPI app" opens their UPI app with the amount and order number filled in. On any device they can copy the UPI ID, amount and order number.
  - **QR code:** a UPI QR for the exact amount, with the order number as the payment note.
- After paying, the customer sends the **UTR** (the 12-digit UPI reference number, with help on where each app shows it). The order moves to "verifying", the bag empties, and the page updates by itself to "Payment confirmed", or shows your reason if the UTR is rejected so they can send a corrected one.
- New **admin page** at `/api/admin` (password `ADMIN_PASSWORD`). It lists orders to verify with the amount, UTR, customer details and items, with Confirm, Reject and "Mark paid" (for payments found in the bank without a UTR), plus a WhatsApp link to the customer. Sign-in is rate-limited, sessions expire after 12 hours, and the page runs under a strict content security policy.
- New payment server in `server/` (`npm run server`, plain Node, no new dependencies). It prices every order from the catalogue (prices sent by the browser are ignored). It refuses a UTR already used on another order, and refuses a rejected UTR if it is sent again. Orders are saved to `server/data/orders.json` (git-ignored).
- **Card** payments need a licensed gateway, so the Card option shows only in test mode for now (form, OTP step and receipt ready). README → Payments → "Card payments (later)" describes how to connect one.
- Without the payment server (`VITE_PAYMENT_API` empty) the checkout runs in **test mode**, clearly labelled, including test buttons that stand in for the admin's confirm and reject.
- Delivery: ₹49 below ₹999, free from ₹999 (placeholders in `src/data/shipping.js`). Up to 10 of each product per order (the bag now stops at 10). The bag note now says prices include taxes.
- `VITE_CHECKOUT_URL` (hand the bag to an external hosted checkout) is removed. New settings: `VITE_PAYMENT_API`, `MERCHANT_UPI_ID`, `MERCHANT_NAME` and `ADMIN_PASSWORD` (see README → Payments).
- New dependency: `qrcode-generator` (MIT, no dependencies) draws the UPI QR code.
- Tests cover order pricing, UPI ID, UTR, card and address checks, and the payment API end to end (server-side pricing, UTR rules, admin sign-in, confirm and reject).

## v12.32 (20 Nov 2026): card slot stays empty until product touchdown
- Enforced empty card slots across all products in Benefits while in flight: the card container remains completely empty (clean mint background with no product inside) both during scroll-flight and click transitions.
- The product fills the card slot only upon exact docking and touchdown (`.flight-on.ben-docked:not(.ben-flying)`), completely eliminating double tubs/ghosting where a product appeared inside the card before the flying tub landed.
- When scrolling back up, the card immediately empties as the product lifts out and flies back to the lineup.

## v12.31 (20 Nov 2026): dynamic multi-product scroll return and ghost elimination
- Fixed product overlap where Lung Booster Gummies appeared ghosted behind other active products (such as Calm Inhaler) in Benefits: `#flight` layer is now cleanly hidden while docked at the Benefits card, preventing any visual leakage or double rendering on rapid clicks.
- Dynamic scroll reversal: when scrolling back up towards the Product Story lineup, whichever product was active in Benefits (`state.benefitIdx`) now lifts out and returns to its exact column in the lineup ($col = -2, -1, 0, +1, +2$), rather than always defaulting to Gummies.
- Rapid-click handling: multiple consecutive clicks cleanly kill in-progress flight timelines, reset the flyer element, and display only the currently selected product without visual collision.

## v12.30 (20 Nov 2026): multi-product flight from the lineup line into Benefits
- When navigating between products in "More of what matters. See the difference." (`#benefits`), the incoming product now descends dynamically from its exact column on the lineup line in the preceding section (`#seq`) down into the card photo slot (`.bi-img`), mirroring the hero jar's descent trajectory.
- Each product cutout (`CUTS`: Gummies, Inhaler, Calm Roll-On, Reviva, Liver Booster) calculates its starting horizontal coordinates from its story lineup column ($col = -2, -1, 0, 1, 2$) and swoops down along a parabolic arc ($y$: `power3.out`, $x$: `power2.out`), leaning naturally into the turn with atmospheric drop-shadow and settling with a subtle touchdown bounce.
- Slide rows and capsule pill stagger in to meet the product as it docks, and handover to the hero flight tub is synchronized cleanly without double rendering.

## v12.29 (16 Nov 2026): two marked stops under the hero, with a ground shadow
- On the way down to the Lung Booster card the tub now rests at the two places the client marked: first top-centre just under the curved band as "You deserve the best" comes up, then down the left side of the headline. Between them it curves left above the headline instead of crossing it.
- At each stop a soft ground shadow settles under the tub (a blurred ellipse in the `#flight` layer); it fades out while the tub is flying and while it is docked on the card.

## v12.28 (16 Nov 2026): the tub fills empty card slots, and flies on to "See the difference"
- The Lung Booster card in "You deserve the best" is now an empty mint slot (no tub photo in it). The flying tub comes down the left side of the headline (no longer through the upper-left corner), arrives at the card, fills it exactly (same place, size and tilt, tracked through the card's zoom and drift) and then moves on.
- The same idea in "More of what matters. See the difference.": the Lung Booster photo card is empty, and when the product story lets go, the tub lifts out of the lineup (from the "Lung Booster" place on the left), curves down the left side and fills that card, where it stays. If the carousel moves to another product the tub fades out with that slide.
- The empty slots only exist while the flight is on (desktop, motion allowed); phones and reduced motion keep the normal photos. Implemented with a `flight-on` class on `<html>` (`styles/sections/insider.css`, `benefits.css`) and a second path (route B) in `features/hero/hero-jar.js`.

## v12.27 (16 Nov 2026): the tub drops straight down out of the hero
- The tub no longer swings out to the right of the product when you start scrolling. It drops straight down out of the hero, in line with where it stands in the arc, and only then moves across to the left towards the Lung Booster card. The rest of the route (dock on the card, drop out below it, hand over to the product story) is unchanged.

## v12.26 (16 Nov 2026): the flying tub follows the client's route and docks on the Lung Booster card
- The tub's flight now follows the route marked on the screenshots: it swings out to the right, back across to the left (coming down from the upper right), then up to the upper left and in to the **Lung Booster card** in "You deserve the best", the matching product. It no longer crosses the story text card on the right.
- On the card it settles exactly on the card's own photo of the tub (same place, size and tilt, tracked live through the card's zoom and drift) and rides along with it; as the card scrolls away the tub drops out below it, straight down and then down to the right, and carries on towards the product story.
- It hands over to the product story's own first tub earlier: when that tub comes up into the bottom of the screen (45% of a screen before the story pins), so the tub never jumps. The path is now set by scroll position rather than by the share of the page.
- Without the card (or with it too close to the story) the tub just weaves to the story as before. Phones and reduced motion are unchanged.

## v12.25 (16 Nov 2026): the hero tub flies down the page in a zig-zag and lands on the product story
- Scrolling down, the Lung Booster tub no longer just tips over and stays behind in the hero. It leaves the white arc and flies down the page, swinging right, left, right and left again (it leans into every turn, and shrinks to a third of the screen's height while it travels) until it lands on the first product of the product story, exactly where that scene shows it (`features/hero/hero-jar.js`).
- It rides on a fixed layer (`#flight`) over the sections and under the nav, driven by the scroll position through GSAP's ticker, with the path built from a smooth curve through the waypoints, so it also flies back if you scroll up.
- The product story's own first tub stays hidden until the flight lands (`state.heroFlight.landed`), so there is never a second tub on screen; the hand-over is within 2 px.
- GSAP and ScrollTrigger are already bundled with the site (`lib/gsap.js`), so nothing extra is loaded in the HTML.
- Phones and reduced motion keep the old behaviour: the tub stays in the hero and tips over onto the ribbon.

## v12.24 (16 Nov 2026): the "Live naturally · Live healthier" band comes in on the next scroll
- The first screen no longer shows the band. It is the Lung Booster tub standing up in the white arc (the arc's legs run off the bottom edge), the 5/4/6 facts on the left, and the headline, lede and "Buy now" on the right. The arc's centre moved down to 105% of the first screen's height, so the ribbon starts just below the fold.
- The tub is bigger (1.25 × the arc's radius, so it stands up out of the top of the arc) and is held clear of the bottom edge on the first screen. As you scroll on, the band rises into view while the tub tips over (20°) and settles down onto the ribbon, so its base ends just above the band as before.
- Phones are unchanged.

## v12.23 (16 Nov 2026): the big TranzLife wordmark is removed from the hero
- The big wordmark at the top of the hero is gone (its markup, styles and intro animation are deleted; the logo stays in the nav, menu and footer). The scene moves back up so there is no empty space: the arc's centre sits at 84% of the first screen's height, the hero is 1.12 screens tall, the headline starts at 20%, and "Buy now" sits under the lede. The tub stands fully inside the arc with its base just above the band, and on scroll it tips over and settles above the ribbon. Phones keep the headline first, then "Buy now", then the product.

## v12.22 (16 Nov 2026): the hero opens on the big wordmark again, like the reference
- The hero is back to the reference layout. The first screen is the huge TranzLife wordmark with "Buy now" centred under it, and the top of the Lung Booster tub, the white arc and the headline coming up from the bottom. The wordmark had gone from `index.html`, which left the empty band at the top; it is back (`.st-brand`), and v12.20's tighter layout is undone (arc centre at 106% of the first screen, hero 1.34 screens tall, "Buy now" under the wordmark, headline at 59%).
- On the next scroll the tub tips over (20°) and settles with its base just above the curved band, as in the reference's second screen. It no longer floats up faster than the page, which left a gap between the tub and the ribbon.

## v12.21 (16 Nov 2026): the product cut-out from the client's own background removal
- `gummies-cut.webp` and `gummies.webp` are rebuilt from the client's clean cut-out of the Lung Booster tub (`image-removebg-preview.png`): its outline is used as the mask on the full-size photo, so the edge is clean (no leaf, arc or badge left over) and the hero, product story, shop, finder and benefits all stay sharp at full resolution.

## v12.20 (16 Nov 2026): the hero fits the first screen
- The big wordmark is no longer in the hero, which left an empty band at the top and pushed the product's base below the first screen. The whole scene now moves up: the white arc's centre sits at 84% of the first screen's height (was 106%) and the hero is 1.12 screens tall (was 1.34). The curved band follows the arc as before.
- The Lung Booster tub stands fully inside the arc, its base just above the band, so nothing is cut off at the bottom.
- "Buy now" moved under the lede on the right (it used to sit on top of the product). The headline block starts at 20% of the first screen instead of 59%.
- Phones are unchanged.

## v12.19 (16 Nov 2026): Lung Booster Gummies replace the old gummies
- The gummies product is now **TranzLife Lung Booster Gummies**, from the client's new pack photo: herbal blend, immune support and respiratory care, natural apple mint flavour, 60 gummies, 100% biodegradable packaging with plant-based inks.
- New images in `src/assets/products/`: `gummies-cut.webp` (the tub cut out of the photo), `gummies.webp` (the tub on a soft mint background, for the shop, finder, menu and benefits) and `gummies-design.webp` (the client's full photo, for the lightbox).
- The hero shows the new tub as a photo instead of the old 3D jar, whose label was the previous design. It keeps the same place on the white arc above the band, fades in once, sways gently, leans towards the mouse and tips over on scroll.
- Copy updated to match the pack: product name, short name, tag ("Breathe"), description, benefit list, product story card ("Breathe well", now green), product finder text and the page meta description and intro lines.
- The "20G of Protein" badge on the client's photo is not used anywhere in the copy; it still appears in the full design board in the lightbox. Confirm with the client before launch.

## v12.18 (14 Nov 2026): one calm 3D gummies jar, a broader arc that ends on the band
- The hero shows only the TranzLife Gummies jar now, as a real 3D model drawn crisper (up to 2x pixel density). It fades in once and then just moves smoothly: it turns slowly from side to side (about 34° each way), tips very slightly and leans towards the mouse. No more jumping, popping, floating up and down or swapping to other products every 20 seconds. On scroll it still tips over and floats up a little. With reduced motion it stands still, facing front.
- The white arc is bigger (radius 56% of the first screen's height instead of 50%) and its line is broader (2.4% instead of 1.5%). The number circles and the handwritten note follow it.
- The curved band is drawn like the reference now: one long smooth sweep that rises from the bottom left, crests gently and falls away to the right (no more bump where it met the arc). It is still fitted to the arc so the arc ends on it as a semicircle: the ribbon's top edge passes through both ends of the circle's middle line. The lettering is a little lighter and taller so it nearly fills the ribbon, with small dots between the phrases ("LIVE NATURALLY · LIVE HEALTHIER"). `features/hero/curve-band.js` measures the arc and redraws the band whenever the layout changes, gives the next page just the room it needs, and tells the jar where the ribbon is so its base sits just above it.
- The headline block moved up slightly (59% of the first screen instead of 66%) so the ribbon never covers the last line of the lede on smaller laptops.

## v12.18 (14 Nov 2026): the hero laid out like a brand product page
- The hero is now one tall scene, laid out like the reference product page: the first screen shows the TranzLife wordmark huge and centred (the real logo, about 60% of the screen width) with "Buy now" centred under it; scrolling on shows the product, the white arc, the facts and the headline, and then the curved "LIVE NATURALLY • LIVE HEALTHIER" band at its foot. The hero is 1.34 screens tall and everything in it is placed from the first screen's height (clamped between 680 and 1000 px).
- The 3D product is much bigger (74% of the first screen's height) and leans over to the right like a product shot, sitting low inside the white arc. As you scroll it floats up a little slower than the page and leans a touch further.
- The white arc is centred on the product, the three fact circles sit on its left side (low, middle and high), and "Real herbs, honest care" sits above them.
- The headline "Innovating life beyond limits" is bigger and sits on the right beside the product, with the lede under it and a hand-drawn white underline.
- On phones the wordmark comes first, then the headline, "Buy now", the product, the facts and the band.

## v12.17 (14 Nov 2026): clean hero, a curved band that comes in with the scroll, and one product at a time in 3D
- The straight giant "Live naturally · Live healthier" words under the hero are gone (`features/hero/marquee.js` deleted, along with its styles and the lean-with-scroll code).
- The curved band now hangs from the foot of the hero like one scene, as in the reference (`features/hero/curve-band.js`): it sits just below the first screen, so the hero is clear when the page opens. The hero's green carries on down behind the white arc, which now runs on down behind the band, and in front a broad dark green ribbon (about 12% of the screen width) sweeps up from the bottom left, over a peak right of centre and off the right edge, with "LIVE NATURALLY • LIVE HEALTHIER" in big light green letters that nearly fill it. Below it the "You deserve the best" page starts with a domed top. The words move only with the scroll: they slide along the curve as you scroll down and back as you scroll up, and stand still when you stop.
- The product floats free over the band, so the dark green hill and the ground shadow are gone.
- The hero product is bigger (53% of the hero's height on desktop). As you scroll down it tips over to one side (20°) and floats up a little, keeping its size and its own 3D motion, so it rests above the band; scrolling back up reverses it.
- On phones the curve is drawn wider than the screen so the words stay readable.
- With reduced motion on, the band is simply there, its words stay still, and the products cross-fade every 20 seconds.

## v12.16 (13 Nov 2026): hero products take turns along the semicircle
- The hero no longer shows only the gummies jar. All five products take turns: each one rises in from the right along a semicircle that shares the white arc's centre, pops into place on the hill with a bounce and a soft white ring, stays a moment, then carries on to the left and sinks away as the next one comes in from the right. A new product arrives every 2.6 s and it loops.
- The products lean into the curve as they travel. The roll-on photo is turned upright, and wide products are scaled down to fit.
- It only plays while the hero is on screen and the tab is visible. With reduced motion on, the products simply cross-fade in place.

## v12.15 (13 Nov 2026): benefits change with a zoom when you click the product
- The Benefits panel no longer sits in a white card, and the row of product buttons is gone. One product shows at a time, straight on the page: its photo, name and its own "What goes in" table, with "Next: <product> →" under the table.
- Click anywhere on the product (or use the arrows by the 01 / 05 counter, the left and right arrow keys, or Enter) to see the next one. The current product rushes towards you, blurs and fades, while the next one zooms in from further off: the photo first, then its name and each row one after another. After the last product it goes back to the first.
- The product photo is smaller (at most 320 px wide on desktop) so the table has more room.
- On phones the photo is a short wide strip above the table.
- With reduced motion on, the products simply swap.

## v12.13 (13 Nov 2026): "Know more" as full-screen motion scenes
- The "Know more" panel no longer shows cards. Each of the six parts is now a full-screen scene with its own background, and scrolling plays a zoom transition like motion graphics: the camera flies forward, so the current scene's headline, text and decorations zoom past you and blur away while the next scene's layers zoom in from far off and the backgrounds cross-fade. Each line moves at its own depth, so the layers separate as they fly. Scrolling back plays it in reverse.
- Each scene has a giant outlined scene number and a thin ring behind the words that rush past the camera during the transition.
- The certificate symbols now sit on round white plates and pop in one after another. The close button, counter, arrows and dots switch colour to stay readable on the dark "How we work" scene.

## v12.12 (13 Nov 2026): "Know more" cards play like a stacked deck
- Scrolling in the "Know more" panel no longer slides a flat row. The current card shrinks back, darkens, blurs and tilts away a little, while the next card slides over it from the right, gradually grows to full size and its picture and text zoom in as it lands. It follows the scroll, so scrolling back plays it in reverse, and it always settles on one card.
- Cards are larger (up to 84% of the screen width). The up and down arrow keys now move between cards too, and a short flick or swipe always moves a whole card.

## v12.11 (13 Nov 2026): "Know more" company story
- In "You deserve the best", the story card's "Shop now" button is now "Know more". It opens the TranzLife story full screen: the card grows out to fill the screen, then six cards scroll sideways (who we are, our vision, what we stand for, how we work, the five registration logos, and a "Shop now" ending).
- The card in the middle is full size; the cards either side are smaller and faded, so each one grows to full size as it reaches the middle and settles there. Move with the mouse wheel or trackpad, by dragging or swiping, with the arrow keys, or with the arrows and dots at the bottom. Esc or Close shrinks it back into the story card.
- The certificates card shows the FSSAI, Make in India, DPIIT Startup India, MSME and GeM logos on their own, with no captions.
- New files: `features/insider/about-scroll.js` and `styles/sections/about.css`. With reduced motion on, the panel opens and moves without the animations.

## v12.10 (12 Nov 2026): registration logos in the footer
- The footer's bottom row now shows the FSSAI, Make in India, DPIIT Startup India, MSME and GeM logos between the disclaimer and the copyright, each on a small white tile so the colours read on the dark green.
- Files are in `src/assets/badges/` (trimmed of extra white space). On tablets and phones the logos sit above the disclaimer and wrap onto more lines.

## v12.9 (12 Nov 2026): "You deserve the best" back to the earlier design
- Undid v12.8: the section has the three tilted product photo cards and the story card over the botanical image again (no big drifting words along the bottom).
- The scroll zoom from v12.6 is kept: the headline grows in from a blur, the photos push forward and the story card zooms in.

## v12.7 (12 Nov 2026): sketch-drawn loading screen
- The loading screen now draws the real logo like a pen sketch: the DNA first, then the roots, trunk and leaves, then the name from left to right. The real colour logo then fills in over the sketch, and the tagline fades in (about 4.4 s).
- The lines are traced from the logo files by `scripts/make-logo-sketch.py`, which writes them into `index.html`; re-run it if the logo changes.
- The page waits for the sketch to finish before the loader fades (at most 6 s). With reduced motion on, the finished logo shows straight away.

## v12.6 (12 Nov 2026): scroll zoom in "You deserve the best"
- New `features/insider/insider-zoom.js`: as you scroll into the section, the headline grows in from small and blurred, then the product photos rise, push forward and settle, then the story card zooms in and its text fades up. It follows the scroll, so scrolling back plays it in reverse.
- Turned off for people who prefer reduced motion; a lighter zoom on phones.

## v12.5 (12 Nov 2026): floating capsule nav
- The top bar is now a floating glass capsule: one rounded, frosted bar below the top edge, with the four links in their own inner pill and the current section filled in green.
- It tightens slightly once you scroll, turns to dark glass over the dark sections, and gets a slimmer fit on phones.

## v12.4 (11 Nov 2026): compact glass shop cards
- Shop cards are smaller: five in a row on wide screens, three on laptops and tablets, two on phones (phones hide the description and chips).
- Cards use glassmorphism: frosted white glass with a light border over soft colour light in the shop background, glass tag and "View design" pills, a lift on hover, and a full-width "Add to bag" button.

## v12.3 (11 Nov 2026): no unstyled flash on load
- The stylesheet now loads from `index.html` (`<link rel="stylesheet" href="/src/styles/main.css">`) instead of being imported in `main.js`, so the page never paints before its styles arrive (this showed as plain text and a black shape in `npm run dev`).
- A small inline style in `<head>` paints the loading screen's colour from the very first frame.
## v13 (12 Nov 2026): Hero full product lineup
- Upgraded the hero section to showcase all five TranzLife products together in a balanced lineup on the grassy mound.
- Products enter with a choreographed staggered rise (TranzLife Gummies leading in the center, flanked by Calm Inhaler and Period Relief Roll-On, with Liver Booster and Reviva Roll-On framing the wings).
- Broadened the hero stage mound and adjusted arc framing for responsive display across desktop, tablet, and mobile.

## v12.2 (6 Nov 2026): benefits change on click
- The benefits panel no longer pins or changes while you scroll; the page scrolls straight on to the next section.
- Pick a product with the dots on the photo, or tap the photo for the next one. The photo and the benefits then slide over with the motion blur.

## v12.1 (5 Nov 2026): products on their own
- The hero and product story cut-outs now show only the product itself: no carton, gift box, roses, mint or loose cap. The roll-on stands upright.
- The white arcs in the product story always stay behind the products.

## v12 (5 Nov 2026): real products instead of 3D
- The hero and the product story now show the real products from the client's designs, cut out on transparent backgrounds, instead of 3D models. The floating 3D gummies and leaves are gone.
- The hero jar rises in once with the intro. In the product story each product comes forward out of a soft blur while its card glides past, then all five line up.
- New `scripts/make-product-cutouts.py`. Removed the 3D product models (`product-model.js`, `jar-layer.js`), their label artwork (`decal-*.webp`) and the studio lighting.

## v11 (5 Nov 2026): benefits for every product
- The hero headline is now the tagline "Innovating life beyond limits".
- The benefits panel stays pinned while you scroll and steps through all five products. The product box slides to the next product with a motion blur, and the table swaps to that product's benefits (`features/benefits/benefit-slides.js`, content in `data/benefits.js`).

## v10 (4 Nov 2026): realistic 3D products
- Gummies rebuilt as moulded raspberry jelly: rounded drupelets with soft creases, a flatter base, glossy clearcoat, deep colour at the rims and light glowing through the middle. Richer red, orange and amber colours, and the jar is packed fuller.
- The jar's clear lower half is now real clear glass: it only shows reflections, brighter at the edges, so the gummies read at full colour.
- New photo-studio lighting for every product (`studioEnv` in `lib/environment.js`): a dim room with strip softboxes and an overhead box, prefiltered for glossy and matte surfaces.
- Amber Reviva glass and the frosted Liver Booster bottle glow through the middle like tinted glass. The gummies jar top has a satin finish.
- The Calm Roll-On label no longer shows the photo's shadowed edge.

## v9 (4 Nov 2026): the five real products
- The catalogue is now the client's five products:
  - TranzLife Gummies (60 gummies, sustainable dual-finish jar)
  - Calm Inhaler
  - Calm Period Relief Roll-On (rosemary, rose and peppermint)
  - Reviva Roll-On for diabetic foot care
  - Liver Booster Liquid (100 ml)
- Every product photo on the site is the client's own product image:
  - shop cards, finder match, menu card and bag
  - Why TranzLife cards and the benefits panel
- A "View design" button on the shop cards and the finder opens the full design board in a lightbox.
- Each product has its own 3D model, with the label artwork taken from its design:
  - gummies jar with a frosted diagonal top, kraft eco cap and raspberry gummies
  - grey twin-tip inhaler with the teal CALM label
  - black roll-on with the cream relief label
  - amber Reviva roll-on with a steel ball and dark green label
  - frosted green Liver Booster bottle with an angled oak cap
- Copy, finder needs, product story cards, benefits rows, herbs and the R&D board now match the new products.
- New `scripts/make-product-assets.py` rebuilds the product images and label artwork from the design files.
- Removed the browser-rendered studio shots (`features/products/studio-shots.js`) and the logo loader for labels (`app/brand.js`).

## v8 (4 Nov 2026): new logo, "Products" naming
- New TranzLife Biosciences logo (banyan tree with the infinity DNA). It appears in the top bar, loader, menu and footer, with a cream wordmark on dark green.
- The jar labels now print the real logo emblem and wordmark instead of typed text. The Cinzel font is no longer loaded.
- "Rituals" is now "Products" in the nav, dock, menu and footer. The section id is `#products`, and "Ritual Finder" is now "Product Finder".
- The matching copy now says "product" instead of "ritual".
- Code renamed to match:
  - `features/product-story/`
  - `features/finder/product-finder.js`
  - `data/product-story.js`
  - `styles/sections/product-story.css`
  - `assets/images/botanical-background.jpg`
  - `scripts/make-botanical-background.py`

## v7 (3 Nov 2026): project structure
- Restructured into a Vite + vanilla JS project with feature-first ES modules.
- Libraries now come from npm instead of CDNs:
  - three 0.128.0
  - gsap 3.12.5
  - lenis 1.1.13
- Split the CSS into tokens, base, components, sections and responsive files.
- Added unit tests (Vitest), `.env` options for a hosted checkout and a contact endpoint, and the asset-generation scripts.

## v6: minimal dock and botanical panel
- The dock rests as a single menu symbol with a scroll-progress ring. It unfolds on hover, or on the first tap on touch screens.
- The current section's name peeks out beside the dock.
- The brand story panel sits on an original motion-blur botanical background.

## v5: official logo and new menu
- Logo used in the top bar, loader, menu, footer and on every 3D jar label.
- New full-screen sage menu with a circular reveal and a featured-product card.

## v4: rebuilt in the style of the client's reference site
- Lenis smooth scroll.
- Hero with a white arc and fact bubbles.
- Pinned ritual story: each product's jar turns while feature cards glide past, ending in a five-jar finale.
- New sections: benefits table, shop, contact and footer.

## v1–v3
- First 3D site, photoreal studio renders and the molecule pipeline.
- DNA helix showcase experiments.
