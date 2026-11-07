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



  return { updateStickyTops };
}

export { CONFIG, initTransitions };
