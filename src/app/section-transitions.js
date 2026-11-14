// Section transitions: Full-bleed layered sheets with top-corner radius transition.
import { ScrollTrigger, gsap, hasGsap } from '../lib/gsap.js';
import { reduce } from '../utils/media.js';

const CONFIG = {
  // No sticky sheets on the home page: #ritual's 3D products are placed from document positions, which a sticky
  // section would break. The night section's rounded top is plain CSS (home-story.css).
  stackIds: [],
  contactId: 'contact',
  maxRadius: 36
};

function initTransitions() {
  if (reduce) return null;

  const isMobile = window.innerWidth < 768;
  const maxR = isMobile ? 24 : CONFIG.maxRadius;

  // 1. Establish natural DOM z-index hierarchy across all main > .page sections
  const pages = Array.from(document.querySelectorAll('main > .page'));
  pages.forEach((page, i) => {
    page.style.zIndex = i + 1;
  });

  // 2. Mark only the curated sheet sections as .sheet-stack
  const sheetElements = [];
  CONFIG.stackIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('sheet-stack');
      sheetElements.push(el);
    }
  });

  const contactEl = document.getElementById(CONFIG.contactId);
  if (contactEl) {
    contactEl.classList.add('sheet-stack');
    sheetElements.push(contactEl);
  }

  // 3. For sections taller than viewport, set sticky top so user sees full content before stacking
  function updateStickyTops() {
    const vh = window.innerHeight;
    sheetElements.forEach(sheet => {
      const topOffset = Math.min(0, vh - sheet.offsetHeight);
      sheet.style.setProperty('--sticky-top', `${topOffset}px`);
    });
  }

  updateStickyTops();
  window.addEventListener('resize', updateStickyTops);

  if (!hasGsap || !ScrollTrigger) return { updateStickyTops };

  // 4. While a sheet is sliding over the previous section, top corners are rounded (36px).
  // Once it reaches top and is settled, radius eases to 0px so the page reads as continuous.
  sheetElements.forEach(sheet => {
    // Set initial rounded state when approaching
    gsap.fromTo(
      sheet,
      { '--sheet-radius': `${maxR}px` },
      {
        '--sheet-radius': '0px',
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: sheet,
          start: 'top 85%',
          end: 'top top',
          scrub: true,
          invalidateOnRefresh: true
        }
      }
    );
  });

  return { updateStickyTops };
}

export { CONFIG, initTransitions };
