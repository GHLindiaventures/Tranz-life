// TranzLife Biosciences - About Page Interactive Controller (Static)
import './styles/main.css';
import { state } from './app/state.js';
import { initCart } from './features/cart/cart.js';
import { $ } from './utils/dom.js';
import { milestones } from './data/milestones.js';

function initAboutPage() {
  // Ensure all eyebrows are drawn immediately without animation
  document.querySelectorAll('.eyebrow').forEach(el => el.classList.add('drawn'));

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
    document.documentElement.classList.toggle('bag-open', open);
  }

  if (bagBtn) bagBtn.addEventListener('click', () => setDrawerOpen(true));
  if (closeBag) closeBag.addEventListener('click', () => setDrawerOpen(false));
  if (scrim) scrim.addEventListener('click', () => setDrawerOpen(false));

  // 5. Anchor link navigation (instant jump, completely static)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (hash === '#') return;
    const target = document.querySelector(hash);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'auto' });
    }
  });

  // 6. Live Hero Journey Motion (Subtle ambient pulse, particles & gentle foliage parallax)
  initAboutHeroLive();
}

function initAboutHeroLive() {
  const hero = document.getElementById('hero');
  const particlesContainer = document.getElementById('aboutParticles');
  if (!hero) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // A. Generate subtle drifting golden dust particles on the right side
  if (particlesContainer) {
    const particleCount = 18;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < particleCount; i++) {
      const dot = document.createElement('span');
      dot.className = 'about-gold-dot';
      // Concentrate around the right side: 58% to 94% left, 20% to 75% top
      const left = 58 + Math.random() * 36;
      const top = 20 + Math.random() * 55;
      const size = (2 + Math.random() * 3.5).toFixed(1);
      const dur = (4.5 + Math.random() * 4).toFixed(1);
      const del = (Math.random() * 5).toFixed(1);
      const driftX = (-15 + Math.random() * 30).toFixed(0);

      dot.style.left = `${left}%`;
      dot.style.top = `${top}%`;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.setProperty('--dur', `${dur}s`);
      dot.style.setProperty('--del', `${del}s`);
      dot.style.setProperty('--drift-x', `${driftX}px`);
      frag.appendChild(dot);
    }
    particlesContainer.appendChild(frag);
  }

  // B. Gentle foliage micro-parallax on mouse move & scroll
  let ticking = false;
  let targetMx = 0;
  let targetMy = 0;
  let currentMx = 0;
  let currentMy = 0;
  let scrollY = window.scrollY;

  function updateTransform() {
    currentMx += (targetMx - currentMx) * 0.1;
    currentMy += (targetMy - currentMy) * 0.1;

    hero.style.setProperty('--about-mx', currentMx.toFixed(4));
    hero.style.setProperty('--about-my', currentMy.toFixed(4));
    hero.style.setProperty('--about-sy', scrollY.toFixed(1));

    if (Math.abs(targetMx - currentMx) > 0.001 || Math.abs(targetMy - currentMy) > 0.001) {
      requestAnimationFrame(updateTransform);
    } else {
      ticking = false;
    }
  }

  window.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    targetMx = (e.clientX / window.innerWidth) * 2 - 1;
    targetMy = (e.clientY / window.innerHeight) * 2 - 1;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateTransform);
    }
  }, { passive: true });

  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    if (scrollY < window.innerHeight * 1.5) {
      hero.style.setProperty('--about-sy', scrollY.toFixed(1));
    }
  }, { passive: true });
}

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAboutPage);
} else {
  initAboutPage();
}
