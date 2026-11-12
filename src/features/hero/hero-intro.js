// Home page opening: one sequence instead of separate fades (about 2.6 s after the loader).
//   0.00  the stone plinth rises from below with a small overshoot; a wave of moss runs across it once
//   0.25  the headline rises letter by letter out of its word masks
//   0.35  the tag line's gold rules grow, then its letters type in
//   1.25  the first product drops onto the plinth and bounces (hero-jar.js), with a ripple on the stone
//   2.60  the bird flies in and perches on the S (layered-depth.js)
// Only transform, opacity and CSS variables are animated. With reduced motion (or no GSAP)
// everything is shown in its final state at once.
import { gsap, hasGsap } from '../../lib/gsap.js';
import { state } from '../../app/state.js';
import { $, $$ } from '../../utils/dom.js';
import { reduce } from '../../utils/media.js';

const PRODUCT_AT = 1.25, BIRD_AT = 2.6;   // seconds after the loader

// headline: each word becomes a mask, each letter rises inside it. The S of "science" is where the bird perches
// (data-perch). Screen readers get the plain text from aria-label.
function splitHero() {
  const title = $('.hero__title'), tag = $('.hero__tag');
  if (title && !title.dataset.split) {
    title.dataset.split = '1';
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    $$('.ln', title).forEach(ln => {
      ln.setAttribute('aria-hidden', 'true');
      ln.innerHTML = ln.textContent.trim().split(/\s+/).map(w => {
        const hl = w.toLowerCase() === 'science';
        const chars = [...w].map((c, i) => '<span class="hch"' + (hl && i === 0 ? ' data-perch' : '') + '>' + c + '</span>').join('');
        return '<span class="hw">' + chars + '</span>';
      }).join(' ');
    });
  }
  if (tag && !tag.dataset.split) {
    tag.dataset.split = '1';
    const t = tag.textContent.trim();
    tag.setAttribute('aria-label', t);
    tag.innerHTML = '<span class="tch-w" aria-hidden="true">' + [...t].map(c => '<span class="tch">' + c + '</span>').join('') + '</span>';
  }
}

// call while the loader still covers the page: splits the text and puts everything in its starting state
function prepareHeroIntro() {
  splitHero();
  const animate = hasGsap && !reduce;
  if (animate) {
    gsap.set('.hero__title .hch', { yPercent: 115 });
    gsap.set('.hero__tag .tch', { opacity: 0 });
    gsap.set('.hero__tag', { '--tl': 0 });
    gsap.set('.hero__slab', { '--rise': 34, opacity: 0 });
  }
  return {
    productDelay: animate ? PRODUCT_AT * 1000 : 0,
    birdDelay: animate ? BIRD_AT * 1000 : 0,
    play() {
      if (!animate) return null;
      const tl = gsap.timeline();
      tl.to('.hero__slab', { '--rise': 0, duration: 1.3, ease: 'back.out(1.5)' }, 0)
        .to('.hero__slab', { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0)
        .call(() => { if (state.moss && state.moss.sweep) state.moss.sweep(1100); }, null, 0.9)
        .to('.hero__title .hch', { yPercent: 0, duration: 1.05, stagger: 0.03, ease: 'power4.out', clearProps: 'transform' }, 0.25)
        .to('.hero__tag', { '--tl': 1, duration: 0.6, ease: 'power2.out' }, 0.35)
        .to('.hero__tag .tch', { opacity: 1, duration: 0.01, stagger: 0.035 }, 0.5);
      return tl;
    }
  };
}

export { prepareHeroIntro, splitHero, PRODUCT_AT, BIRD_AT };
