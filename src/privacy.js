// TranzLife Biosciences - Privacy Policy Interactive Controller
import { initCart } from './features/cart/cart.js';
import { $ } from './utils/dom.js';

export function initPrivacyPage() {
  // 1. Initialize shopping bag state
  try {
    initCart();
  } catch (e) {
    console.warn('Cart initialization deferred:', e);
  }

  // 2. Navigation scroll header styling
  const nav = $('#nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 3. Mobile / Full-screen Navigation Menu Controller
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

  // 4. Cart Bag Drawer Controller
  const bagBtn = $('#bagBtn');
  const drawer = $('#drawer');
  const scrim = $('#scrim');
  const closeBag = $('#closeBag');

  function setDrawerOpen(open) {
    if (!drawer || !scrim) return;
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', !open);
    scrim.classList.toggle('open', open);
    document.documentElement.classList.toggle('drawer-open', open);
  }

  if (bagBtn) bagBtn.addEventListener('click', () => setDrawerOpen(true));
  if (closeBag) closeBag.addEventListener('click', () => setDrawerOpen(false));
  if (scrim) scrim.addEventListener('click', () => setDrawerOpen(false));
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      setDrawerOpen(false);
    }
  });

  // 5. Sticky Table-of-Contents Active Highlighting
  const navLinks = document.querySelectorAll('.leg-nav-link');
  const sections = document.querySelectorAll('.leg-section');

  if (sections.length && navLinks.length) {
    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -60% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => sectionObserver.observe(section));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrivacyPage);
} else {
  initPrivacyPage();
}

