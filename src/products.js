// TranzLife Biosciences - Products Catalog Page Interactive Controller
import './styles/main.css';
import { thumbs } from './app/state.js';
import { PRODUCTS, PIPELINE_PRODUCTS } from './data/products.js';
import { SHOTS } from './features/products/product-images.js';
import { initCart, renderCart } from './features/cart/cart.js';
import { inr } from './utils/format.js';
import { buildNeeds } from './features/finder/product-finder.js';
import { fillShots } from './features/products/product-grid.js';
import { initStory } from './features/product-story/product-story.js';
import { initScroll } from './app/scroll-animations.js';
import { initLightbox } from './components/lightbox.js';
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

  // 2b. Render Pipeline Formulations
  const pipeGrid = $('#pipelineGrid');
  if (pipeGrid && PIPELINE_PRODUCTS) {
    pipeGrid.innerHTML = PIPELINE_PRODUCTS.map(p => `
      <article class="pipeline-card" style="background: var(--panel); border: 1px solid var(--line); border-radius: 20px; padding: 28px 24px; display: flex; flex-direction: column; gap: 14px; box-shadow: 0 4px 16px rgba(20, 52, 26, 0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; font-weight: 750; color: var(--forest); background: rgba(36, 80, 42, 0.08); padding: 4px 10px; border-radius: 999px; text-transform: uppercase;">${p.category}</span>
          <span style="font-size: 11.5px; font-weight: 700; color: var(--moss);">${p.stage}</span>
        </div>
        <h4 style="font-size: 18px; font-weight: 850; color: var(--forest); margin: 0;">${p.name}</h4>
        <p style="font-size: 13.5px; line-height: 1.55; color: var(--muted); margin: 0;">${p.desc}</p>
        <div style="font-size: 12.5px; color: var(--ink); background: var(--panel-2); padding: 10px 12px; border-radius: 10px;">
          <strong style="color: var(--forest);">Key Actives:</strong> ${p.actives}
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: auto; padding-top: 8px;">
          ${p.formats.map(fmt => `<span style="font-size: 11px; font-family: var(--f-mono); background: rgba(255,255,255,0.7); border: 1px solid var(--line); padding: 3px 8px; border-radius: 6px; color: var(--faint);">${fmt}</span>`).join('')}
        </div>
      </article>
    `).join('');
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

  // 3b. Product finder, product story and benefits
  try { initLightbox(); } catch (e) { console.warn('Lightbox unavailable:', e); }
  try { buildNeeds(); } catch (e) { console.warn('Product finder unavailable:', e); }
  try { fillShots(); } catch (e) { console.warn('Product shots unavailable:', e); }
  try { initStory(); } catch (e) { console.warn('Product story unavailable:', e); }
  try { initScroll(); } catch (e) { console.warn('Scroll reveals unavailable:', e); }

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
