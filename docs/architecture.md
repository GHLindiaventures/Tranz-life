# Architecture

## Page flow

`index.html` is the brand introduction only:

1. hero (`#home`)
2. product lineup (`#lineup`)
3. company tagline (`#insider`)
4. nature video: Ayurveda botanical frame (`#nature`)
5. Explore band (`#explore`): one card per dedicated page
6. government trust strip (`#gov-trust`)
7. footer

Every other section lives on the page that owns it:

| Section | Page | Booted by |
|---|---|---|
| Product finder (`#finder`), product story (`#story`), benefits (`#benefits`) | `products.html` | `src/products.js` |
| Seed-to-shelf reactor (`#process`), R&D lab board (`#lab`) | `science.html` | `src/science.js` |
| Contact form | `contact.html` | `src/contact.js` |

The old Home science, shop and contact blocks were removed rather than moved: the Science page's 3D compound explorer, the Products catalog and the Contact page form already cover them.

JavaScript only fills in and animates that markup.

## Boot order (`src/main.js`)

1. **Static UI.** Cart, marquee, dock and menu.
2. **Hero jar.** `features/hero/hero-jar.js` (the 3D product on the plinth), layered depth and moss reveal, after the web fonts load.
3. **Product images.** `features/products/product-images.js` fills `thumbs` (menu card, bag). `components/lightbox.js` opens the full design board for any `[data-design]` button.
4. **Page tracking.** `app/page-sections.js` tracks the current Home section and dispatches `tl:page` events for the dock.
5. **Smooth scroll and reveals.** Lenis smooth scroll, the ScrollTrigger reveals, the tagline sheet transition over the lineup, the hero-to-lineup product hand-off, then the intro timeline hides the loader.

The tagline motion and Ayurveda video boot from `src/main.js`. The product story (`features/product-story`), finder and benefits boot from `src/products.js`. The molecule reactor (`features/pipeline`) and lab board boot from `src/science.js`. Both pages call `initScroll()` for the same reveal animations.

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
