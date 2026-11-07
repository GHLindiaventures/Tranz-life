// Section transitions: Stacking rounded cards with scroll-driven scaling & dimming.
import { ScrollTrigger, gsap, hasGsap } from '../lib/gsap.js';
import { reduce } from '../utils/media.js';

const CONFIG = {
  stackIds: ['lineup', 'insider', 'benefits', 'science', 'lab', 'finder', 'shop'],
  contactId: 'contact',
  radius: 40,
  sideMargin: 16,
  outgoingScale: 0.94,
  dimBrightness: 0.75,
  mistDuration: 0.8,
  stagger: 0.12,
  parallaxSpeeds: {
    bg: 0.2,
    cards: 0.35,
    leaf: 0.4
  }
};

function initTransitions() {
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

  // 4. Scroll-driven outgoing card scaling & brightness dimming
  if (hasGsap && ScrollTrigger && !reduce) {
    CONFIG.stackIds.forEach(id => {
      const currentCard = document.getElementById(id);
      if (!currentCard) return;

      // Find the next section in main that covers this card
      const nextCard = currentCard.nextElementSibling;
      if (!nextCard || !nextCard.classList.contains('page')) return;

      gsap.fromTo(
        currentCard,
        { scale: 1, filter: 'brightness(1)' },
        {
          scale: targetScale,
          filter: `brightness(${targetDim})`,
          ease: 'none',
          scrollTrigger: {
            trigger: nextCard,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );
    });
  }

  return { updateStickyTops };
}

export { CONFIG, initTransitions };

