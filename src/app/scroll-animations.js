// Scroll-triggered content choreography: masked word reveals, line draws, staggered cards, number count-ups, and multi-layer parallax.
import { ScrollTrigger, gsap, hasGsap } from '../lib/gsap.js';
import { MOTION } from './motion-tokens.js';
import { $, $$ } from '../utils/dom.js';
import { clamp } from '../utils/math.js';
import { reduce } from '../utils/media.js';

function splitWords(el) {
  const walk = node => {
    [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (!w.trim()) {
            frag.appendChild(document.createTextNode(w));
          } else {
            const o = document.createElement('span');
            o.className = 'wl';
            const i = document.createElement('span');
            i.className = 'w';
            i.textContent = w;
            o.appendChild(i);
            frag.appendChild(o);
          }
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1 && !ch.classList.contains('wl')) {
        walk(ch);
      }
    });
  };
  walk(el);
}

// Animate a number counting up from 0 to target
function animateCountUp(el, target, duration = 1.2) {
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = Math.round(obj.val);
    }
  });
}

function initScroll() {
  if (!hasGsap || !ScrollTrigger) return;

  // Reduced motion: simple instantaneous opacity reveals, no parallax
  if (reduce) {
    $$('.reveal').forEach(el => gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: MOTION.dur.base }));
    $$('.eyebrow').forEach(el => el.classList.add('drawn'));
    return;
  }

  // 1. Masked Word Reveals & Section Heading Entrance
  $$('.rv-words').forEach(el => {
    splitWords(el);
    gsap.from($$('.w', el), {
      yPercent: 110,
      duration: MOTION.dur.slow,
      stagger: MOTION.stagger.fast,
      ease: MOTION.ease.entrance,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true }
    });
  });

  // 2. Eyebrow reveals with accent line draw
  $$('.eyebrow').forEach(el => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        el.classList.add('drawn');
        gsap.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: MOTION.dur.base, ease: MOTION.ease.entrance });
      }
    });
  });

  // 3. General body & subheading reveals
  $$('.reveal').forEach(el => {
    if (el.classList.contains('eyebrow')) return; // handled above
    gsap.from(el, {
      opacity: 0,
      y: MOTION.dist.md,
      duration: MOTION.dur.base,
      ease: MOTION.ease.entrance,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  // 4. Staggered Cards & Rows Entrances
  // 4a. Shop product catalog cards (.pc)
  const shopGrid = $('#grid');
  if (shopGrid) {
    ScrollTrigger.create({
      trigger: shopGrid,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.fromTo('.pc',
          { opacity: 0, y: 36, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, stagger: MOTION.stagger.base, duration: MOTION.dur.base, ease: MOTION.ease.entrance }
        );
      }
    });
  }

  // 4b. Benefits comparison table rows
  const benTable = $('.ben-table');
  if (benTable) {
    ScrollTrigger.create({
      trigger: benTable,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.fromTo('.ben-table tbody tr',
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, stagger: 0.05, duration: MOTION.dur.base, ease: MOTION.ease.entrance }
        );
      }
    });
  }

  // 4c. Product finder need cards
  const needsGrid = $('.needs-grid');
  if (needsGrid) {
    ScrollTrigger.create({
      trigger: needsGrid,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.fromTo('.need-card',
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, stagger: MOTION.stagger.fast, duration: MOTION.dur.base, ease: MOTION.ease.entrance }
        );
      }
    });
  }

  // 4d. Lab testing rows (.b-row) & progress bars (.b-bar i)
  $$('.b-bar i').forEach(i => i.style.setProperty('--s', 0));
  const labBoard = $('#board');
  if (labBoard) {
    ScrollTrigger.create({
      trigger: labBoard,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        gsap.fromTo('.b-row',
          { opacity: 0, x: -24 },
          { opacity: 1, x: 0, stagger: 0.07, duration: MOTION.dur.base, ease: MOTION.ease.entrance }
        );
        $$('.b-bar i').forEach((i, k) => setTimeout(() => i.style.setProperty('--s', 1), 200 + k * 120));
      }
    });
  }

  // 5. Number Count-Ups (Hero stats badges: 5, 4, 6)
  const factsSec = $('.facts');
  if (factsSec) {
    ScrollTrigger.create({
      trigger: factsSec,
      start: 'top 95%',
      once: true,
      onEnter: () => {
        $$('.fact b').forEach(b => {
          const num = parseInt(b.textContent.trim(), 10);
          if (!isNaN(num) && num > 0) {
            animateCountUp(b, num, 1.4);
          }
        });
      }
    });
  }

  // 6. Multi-Layer Parallax Depth
  // 6a. #insider: Official TranzLife Tagline Monumental Reveals
  const insiderSec = $('#insider');
  if (insiderSec) {
    const badge = $('.in-tagline-badge', insiderSec);
    const lines = $$('.it-line', insiderSec);
    const footer = $('.in-creed-footer', insiderSec);
    const infDraw = $('.it-inf-draw', insiderSec);

    const tlTagline = gsap.timeline({
      scrollTrigger: {
        trigger: insiderSec,
        start: 'top 75%',
        once: true
      }
    });

    if (badge) {
      tlTagline.from(badge, {
        y: -24,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out'
      }, 0);
    }

    if (lines.length) {
      tlTagline.from(lines, {
        y: 46,
        opacity: 0,
        duration: 1.1,
        stagger: 0.16,
        ease: 'power3.out'
      }, 0.15);
    }

    if (infDraw) {
      tlTagline.fromTo(infDraw,
        { strokeDashoffset: 170 },
        { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out' },
        0.4
      );
    }

    if (footer) {
      tlTagline.from(footer, {
        y: 28,
        opacity: 0,
        duration: 1.0,
        ease: 'power3.out'
      }, 0.7);
    }
  }

  // 6c. #science: floating DNA helix with subtle 3D-like parallax rotation
  const sciDna = $('#sciDna');
  if (sciDna) {
    gsap.fromTo(sciDna,
      { y: 80, rotation: -3 },
      { y: -80, rotation: 3, ease: 'none', scrollTrigger: { trigger: '#science', start: 'top bottom', end: 'bottom top', scrub: 0.6 } }
    );
  }

  // 6d. #benefits: image container float
  const benImg = $('.ben-img');
  if (benImg) {
    gsap.fromTo(benImg,
      { y: 35 },
      { y: -35, ease: 'none', scrollTrigger: { trigger: '#benefits', start: 'top bottom', end: 'bottom top', scrub: 0.6 } }
    );
  }

  // 7. Marquee leans with scroll velocity
  const mq = $('#mq');
  if (mq) {
    let skew = 0;
    ScrollTrigger.create({
      onUpdate: self => {
        skew = clamp(self.getVelocity() / -300, -7, 7);
      }
    });
    gsap.ticker.add(() => {
      skew *= 0.9;
      mq.style.transform = `skewX(${skew.toFixed(2)}deg)`;
    });
  }
}

export { initScroll };
