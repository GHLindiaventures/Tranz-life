// TranzLife Biosciences - Sustainability & Ecological Stewardship Interactive Controller
import './features/footer/night-footer.js';
import './features/navigation/dropdown.js';
import './components/page-scrollbar.js';
import { $ } from './utils/dom.js';

function initSustainabilityPage() {
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


  // 5. Interactive Impact Calculator
  const slider = $('#impactSlider');
  const bottleCountEl = $('#impactCountDisplay');
  const plasticEl = $('#impactPlastic');
  const carbonEl = $('#impactCarbon');
  const treesEl = $('#impactTrees');
  const soilEl = $('#impactSoil');

  function updateImpact(bottles) {
    const b = parseInt(bottles, 10) || 3;
    if (bottleCountEl) bottleCountEl.textContent = `${b} ${b === 1 ? 'bottle' : 'bottles'} / month`;

    const plasticGrams = b * 45;
    const carbonKg = (b * 1.35).toFixed(1);
    const trees = Math.max(1, Math.floor(b * 0.75));
    const soilSqFt = b * 35;

    if (plasticEl) plasticEl.textContent = `${plasticGrams}g`;
    if (carbonEl) carbonEl.textContent = `${carbonKg}kg`;
    if (treesEl) treesEl.textContent = `${trees}`;
    if (soilEl) soilEl.textContent = `${soilSqFt} ft²`;
  }

  if (slider) {
    slider.addEventListener('input', e => {
      updateImpact(e.target.value);
    });
    updateImpact(slider.value || 3);
  }
}

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSustainabilityPage);
} else {
  initSustainabilityPage();
}

export { initSustainabilityPage };

