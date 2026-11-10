// TranzLife Biosciences - Products Catalog Page Interactive Controller
import './styles/main.css';
import { thumbs } from './app/state.js';
import { PRODUCTS } from './data/products.js';
import { SHOTS } from './features/products/product-images.js';
import { initCart, renderCart } from './features/cart/cart.js';
import { inr } from './utils/format.js';
import { $, $$ } from './utils/dom.js';

function initProductsPage() {
  // Populate image thumbs for the cart drawer
  Object.assign(thumbs, SHOTS);

  // 1. Initialize shopping bag state & render initial counts
  try {
    initCart();
    renderCart();
  } catch (e) {
    console.warn('Cart initialization deferred:', e);
  }

  // 2. Render Product Cards dynamically
  const grid = $('#catalogGrid');
  if (grid) {
    grid.innerHTML = PRODUCTS.map((p) => {
      const imgSrc = SHOTS[p.id] || '';
      return `
        <article class="catalog-card" data-cat="${p.cat}" data-id="${p.id}">
          <div class="catalog-media">
            <img src="${imgSrc}" alt="${p.name}" loading="lazy" width="600" height="600">
            <span class="catalog-badge-tag">${p.tag}</span>
            <span class="catalog-num-tag">#${p.no}</span>
          </div>
          <div class="catalog-body">
            <h3 class="catalog-card-title">${p.name}</h3>
            <p class="catalog-card-desc">${p.desc}</p>
            <div class="catalog-card-ings">
              ${p.ing.map(ing => `<span>${ing}</span>`).join('')}
            </div>
            <div class="catalog-foot">
              <div class="catalog-price">
                ${inr(p.price)}
                <small>${p.size}</small>
              </div>
              <div class="catalog-card-actions">
                <a href="product-details.html?id=${p.id}" class="catalog-details-link">
                  Details <i>→</i>
                </a>
                <button class="add pill" data-id="${p.id}" type="button">
                  <i aria-hidden="true">+</i>Add to bag
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // 3. Category / Need Filters
  const filterBtns = $$('#catalogFilters button');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.toggle('on', b === btn));
      const f = btn.dataset.f;
      $$('.catalog-card').forEach(card => {
        const matches = (f === 'all') || (card.dataset.cat === f) || (card.dataset.id === f);
        card.classList.toggle('hide', !matches);
      });
    });
  });

  // 4. Navigation scroll header styling
  const nav = $('#nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 5. Mobile / Full-screen Navigation Menu Controller
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
}

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductsPage);
} else {
  initProductsPage();
}
