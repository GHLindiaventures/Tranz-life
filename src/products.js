// TranzLife Biosciences - Products page controller.
// The page is the product journey from dhina-dev (showcase, statement curtain, "Which one is yours?" grid with a
// display per product). Its modules and data live in src/products-page/ and load on this page only; the header,
// menu and footer are the shared ones every page uses.
import './features/footer/night-footer.js';
import { state, thumbs } from './app/state.js';
import { initSmooth } from './app/smooth-scroll.js';
import { SHOTS } from './features/products/product-images.js';
import './features/navigation/dropdown.js';
import './components/page-scrollbar.js';
import './components/chat-loader.js';
import { initGrain } from './products-page/grain.js';
import { initProductJourney } from './products-page/journey.js';
import { useScannedModels } from './features/products/product-model.js';
import { initStatementPage } from './products-page/statement-page.js';
import { $ } from './utils/dom.js';

function initProductsPage() {
  useScannedModels();   // this page shows the scanned 3D products (HD on close-up); other pages keep the light drawn ones
  // product photos for the menu card and the design lightbox
  Object.assign(thumbs, SHOTS);

  // 2. The product journey (smooth scroll as on dhina-dev: the display a card opens pauses and resumes it)
  try { initGrain(); } catch (e) { console.warn('Grain unavailable:', e); }
  try { initSmooth(); } catch (e) { console.warn('Smooth scroll unavailable:', e); }
  try { initStatementPage(); } catch (e) { console.warn('Statement page unavailable:', e); }
  try { state.journeyApi = initProductJourney(); } catch (e) { console.warn('Product journey unavailable:', e); }

  // 3. Navigation scroll header styling
  // Performance: reading window.scrollY in the scroll event (as the other pages do) forces a full style + layout
  // here, because the journey and Lenis have just written styles. The position comes from Lenis (a plain number)
  // and the class is only touched when it changes, once per frame.
  const nav = $('#nav');
  let navQueued = false, navScrolled = null;
  function applyNav() {
    navQueued = false;
    if (!nav) return;
    const y = state.lenis ? state.lenis.scroll : window.scrollY;
    const s = y > 20;
    if (s !== navScrolled) { navScrolled = s; nav.classList.toggle('scrolled', s); }
  }
  function onScroll() { if (!navQueued) { navQueued = true; requestAnimationFrame(applyNav); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  applyNav();

  // 4. Mobile / Full-screen Navigation Menu Controller
  const btn = $('#dockMenu');
  const menu = $('#menu');
  const menuX = $('#menuX');

  function setMenuOpen(open) {
    if (!menu) return;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', !open);
    if (btn) {
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    document.documentElement.classList.toggle('menu-open', open);
    if (state.lenis) open ? state.lenis.stop() : state.lenis.start();
  }

  if (btn) btn.addEventListener('click', () => setMenuOpen(!menu.classList.contains('open')));
  if (menuX) menuX.addEventListener('click', () => setMenuOpen(false));
  if (menu) {
    menu.addEventListener('click', e => {
      if (e.target.closest('a')) setMenuOpen(false);
    });
  }
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu && menu.classList.contains('open')) {
      setMenuOpen(false);
    }
  });
}

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductsPage);
} else {
  initProductsPage();
}
