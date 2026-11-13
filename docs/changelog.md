# Changelog

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
