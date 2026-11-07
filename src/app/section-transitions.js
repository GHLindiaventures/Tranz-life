// Section transitions: Stacking rounded cards, Card-to-Fullscreen Morph, and Atmospheric Mist Wipe.
import { ScrollTrigger, gsap, hasGsap } from '../lib/gsap.js';
import { reduce } from '../utils/media.js';
import { MOTION } from './motion-tokens.js';
import { $, $$ } from '../utils/dom.js';

const CONFIG = {
  stackIds: ['insider', 'benefits', 'science', 'lab', 'finder', 'shop'],
  contactId: 'contact',
  outgoingScale: 0.94,
  dimBrightness: 0.75
};

function initTransitions() {
  if (reduce) return null;

  const isMobile = window.innerWidth < 768;
  const targetScale = isMobile ? 0.97 : CONFIG.outgoingScale;
  const targetDim = isMobile ? 0.85 : CONFIG.dimBrightness;

  // 1. Establish natural DOM z-index hierarchy across all main > .page sections
  const pages = Array.from(document.querySelectorAll('main > .page'));
  pages.forEach((page, i) => {
    page.style.zIndex = i + 1;
  });

  // 2. Mark stack sections as .card
  const cardElements = [];
  CONFIG.stackIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('card');
      cardElements.push(el);
    }
  });

  // #contact also reveals as a rounded card rising over #shop
  const contactEl = document.getElementById(CONFIG.contactId);
  if (contactEl) {
    contactEl.classList.add('card');
    cardElements.push(contactEl);
  }

  // 3. For sections taller than viewport, set sticky top so user sees full content before stacking
  function updateStickyTops() {
    const vh = window.innerHeight;
    cardElements.forEach(card => {
      const topOffset = Math.min(0, vh - card.offsetHeight);
      card.style.setProperty('--sticky-top', `${topOffset}px`);
    });
  }

  updateStickyTops();
  window.addEventListener('resize', updateStickyTops);

  if (!hasGsap || !ScrollTrigger) return { updateStickyTops };

  // 4. Scroll-driven outgoing card scaling & brightness dimming
  CONFIG.stackIds.forEach(id => {
    const currentCard = document.getElementById(id);
    if (!currentCard) return;

    // Find the next section in main that covers this card
    let nextEl = currentCard.nextElementSibling;
    while (nextEl && !nextEl.classList.contains('page')) {
      nextEl = nextEl.nextElementSibling;
    }
    if (!nextEl) return;

    gsap.fromTo(
      currentCard,
      { scale: 1, filter: 'brightness(1)' },
      {
        scale: targetScale,
        filter: `brightness(${targetDim})`,
        ease: 'none',
        scrollTrigger: {
          trigger: nextEl,
          start: 'top bottom',
          end: 'top top',
          scrub: true,
          invalidateOnRefresh: true
        }
      }
    );
  });

  // 5. Card-to-Fullscreen Morph: #products 3D scene expands from rounded card to full bleed
  const productsSec = document.getElementById('products');
  if (productsSec && !isMobile) {
    productsSec.classList.add('card-morph');
    gsap.fromTo(
      productsSec,
      { clipPath: 'inset(16px round 36px)' },
      {
        clipPath: 'inset(0px round 0px)',
        ease: 'none',
        scrollTrigger: {
          trigger: productsSec,
          start: 'top bottom',
          end: 'top 20%',
          scrub: true
        }
      }
    );
  }

  // 6. Atmospheric Mist Wipe between #process (green) and #science (cream)
  const fogGate = document.getElementById('fogProcessScience');
  const fogPanel = document.getElementById('fogPanel');
  const fogL1 = document.getElementById('fogL1');
  const fogL2 = document.getElementById('fogL2');
  const fogL3 = document.getElementById('fogL3');
  const fogLeaves = $$('#fogLeaves .fog-leaf');

  if (fogGate && fogPanel && fogL1 && fogL2 && fogL3) {
    const fogTl = gsap.timeline({
      scrollTrigger: {
        trigger: fogGate,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        onUpdate: (self) => {
          // At midpoint (when screen is obscured by rising mist), swap background color
          if (self.progress >= 0.5) {
            fogPanel.style.backgroundColor = '#e9efe3'; // cream
          } else {
            fogPanel.style.backgroundColor = '#1d4424'; // green
          }
        }
      }
    });

    // Mist layers rise at staggered speeds to obscure the screen
    fogTl.fromTo(fogL1, { yPercent: 120 }, { yPercent: -30, ease: 'none' }, 0);
    fogTl.fromTo(fogL2, { yPercent: 140 }, { yPercent: -45, ease: 'none' }, 0);
    fogTl.fromTo(fogL3, { yPercent: 160 }, { yPercent: -60, ease: 'none' }, 0);

    // Floating leaves with rotation and parallax drift
    fogLeaves.forEach((leaf, idx) => {
      const rot = (idx % 2 === 0 ? 1 : -1) * (40 + idx * 10);
      fogTl.fromTo(
        leaf,
        { yPercent: 80 + idx * 15, rotation: -rot * 0.5 },
        { yPercent: -80 - idx * 15, rotation: rot, ease: 'none' },
        0
      );
    });

    // In the second half (progress 0.55 -> 1.0), mist disperses revealing #science
    fogTl.to([fogL1, fogL2, fogL3], { opacity: 0, ease: 'power2.inOut' }, 0.55);
  }

  return { updateStickyTops };
}

export { CONFIG, initTransitions };
