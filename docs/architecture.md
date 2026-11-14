# Architecture

## Page flow

`index.html` tells one story from dawn to night ("Root to Ritual"):

1. hero (`#home`): 3D products on the stone plinth, the offer and two calls to action. As it scrolls away the product
   sinks into the stone (`features/hero/hero-jar.js`) and the headline stretches (`features/hero/hero-scroll.js`)
2. Roots to Helix (`#roots`, pinned): roots grow into a DNA helix that unwinds into a golden thread (`features/story/roots-helix.js`, one 2D canvas)
3. A Day with TranzLife (`#day`, pinned on wide screens): one moment per product, the sky and sun follow the hour, the
   product spins in on its own 3D layer and its botanicals flow into it (`features/story/day-story.js`, content in
   `data/day.js`). Phones and reduced motion get stacked cards
4. Your Ritual (`#ritual`): all six products as 3D models on the fixed `#flightCanvas`, filtered by need (`features/story/ritual-lineup.js`)
5. Proof (`#proof`): government recognition, certifications and links to the other pages
6. footer

The vision tagline section now lives on `about.html` (`#vision`), the Ayurveda frame sequence on `ingredients.html` (`#ayurveda`).

Every other section lives on the page that owns it:

| Section | Page | Booted by |
|---|---|---|
| Product journey from dhina-dev: showcase (`#showcase`), statement curtain (`#statement`), "Which one is yours?" grid with a display per product (`#lineup`) | `products.html` | `src/products.js` → `src/products-page/` |
| Seed-to-shelf reactor (`#process`), R&D lab board (`#lab`) | `science.html` | `src/science.js` |
| Contact form | `contact.html` | `src/contact.js` |

The old Home science, shop and contact blocks were removed rather than moved: the Science page's 3D compound explorer, the Products catalog and the Contact page form already cover them.

JavaScript only fills in and animates that markup.

### Products page isolation

`products.html` is the product journey from the `dhina-dev` branch. Everything it needs that differs from the rest of
the site is private to it, so no other page loads or is affected by it:

- `src/products-page/`: the journey (`journey.js`, adapted from dhina-dev's `product-hand-off.js` to start without
  the Home hero), `showcase-scene.js`, `statement-page.js`, `grid-math.js`, `grain.js`, and `data/` (dhina-dev's
  product copy and write-ups; the rest of the site keeps `src/data/`).
- `src/styles/products-page.css`: the page's own stylesheet (shared base/components/footer plus
  `src/styles/products-page/*`). It does not load `main.css`.
- Shared modules it reuses unchanged: `jar-layer.js`, `product-model.js`, `product-images.js`, `cart.js`,
  `smooth-scroll.js`.

## Boot order (`src/main.js`)

1. **Static UI.** Cart, dock and menu.
2. **Hero jar.** `features/hero/hero-jar.js` (the 3D product on the plinth), layered depth and moss reveal, after the web fonts load.
3. **Product images.** `features/products/product-images.js` fills `thumbs` (menu card, bag). `components/lightbox.js` opens the full design board for any `[data-design]` button.
4. **Page tracking.** `app/page-sections.js` tracks the current Home section and dispatches `tl:page` events for the dock.
5. **The story.** Roots to Helix, A Day with TranzLife and Your Ritual, each drawing only while on screen.
6. **Smooth scroll and reveals.** Lenis smooth scroll, the ScrollTrigger reveals and the hero exit, then the intro timeline hides the loader.

The tagline motion boots from `src/about.js`, the Ayurveda video from `src/ingredients.js`. The product story (`features/product-story`), finder and benefits boot from `src/products.js`. The molecule reactor (`features/pipeline`) and lab board boot from `src/science.js`. Both pages call `initScroll()` for the same reveal animations.

A 5-second fail-safe always hides the loader, even if a 3D scene is slow or fails.

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
- **3D.**
  - `features/products/product-model.js` builds the five products from each product's `model` field (`jar`, `inhaler`, `rollon`, `reviva`, `liver`). The printed labels are artwork lifted from the client's designs (`src/assets/products/decal-*.webp`), wrapped onto the bottle shapes.
  - `features/products/jar-layer.js` is a transparent Three.js canvas that places models in screen pixels. `fit` in `data/products.js` evens out their sizes. The hero and the product story use it.
  - `lib/environment.js` provides the reflection cube maps.

## Styles

`src/styles/main.css` imports the files in cascade order:

1. tokens
2. global base
3. components (logo, loader, nav, dock, menu, drawer)
4. sections
5. `responsive.css`

Colour themes are CSS custom properties. Adding `.t-green` or `.t-cream` to any element switches its palette.

## Assets

| File | Source |
|---|---|
| `src/assets/products/*` | Made by `scripts/make-product-assets.py` from the client's five product designs (Nov 2026): square product images, full design boards and the 3D label artwork |
| `src/assets/logo/*` | Made by `scripts/cut-logo.py` from the client's banyan-tree logo (Nov 2026) |
| `src/assets/images/botanical-background.jpg` | Original image made by `scripts/make-botanical-background.py` |
| `src/assets/images/dna-helix.webp` | Client-supplied DNA reference image, cut out and upscaled. **Confirm usage rights before launch.** |
