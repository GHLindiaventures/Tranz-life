// TranzLife Biosciences - Official Ingredients Directory & 3D Coverflow Controller
import './styles/main.css';
import { initCart } from './features/cart/cart.js';
import { $ } from './utils/dom.js';
import { BOTANICAL_INGREDIENTS } from './data/ingredients.js';

export { BOTANICAL_INGREDIENTS };

function initIngredientsPage() {
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
    if (e.key === 'Escape') {
      if (menu && menu.classList.contains('open')) setMenuOpen(false);
      closeModal();
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

  // Helper string escaper
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Nav Search Button: Smooth-scroll to directory and focus search input
  const navSearchBtn = $('#navSearchBtn');
  if (navSearchBtn) {
    navSearchBtn.addEventListener('click', e => {
      e.preventDefault();
      const dir = $('#directory');
      const search = $('#ingSearch');
      if (dir) {
        dir.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { if (search) search.focus(); }, 400);
      }
    });
  }

  // ==========================================================================
  // 5. 3D COVERFLOW CAROUSEL CONTROLLER
  // ==========================================================================
  const stageTrack = $('#stageTrack');
  const stagePrev = $('#stagePrev');
  const stageNext = $('#stageNext');
  const filterPillBtns = document.querySelectorAll('.ing-pill-btn[data-category]');
  const morePillsBtn = $('#morePillsBtn');
  const moreDropdown = $('#morePillsDropdown');
  const dropdownItems = document.querySelectorAll('.ing-dropdown-item');

  let currentCategory = 'all';

  // Build curated carousel deck matching the mockup's coverflow presentation
  function buildInitialDeck() {
    // Lead items strictly matching mockup: Ginger (far left), Wintergreen (left), Peppermint (center), Ginger (right), Tulsi (far right)
    const gingerItem = BOTANICAL_INGREDIENTS.find(i => i.id === 'ginger') || BOTANICAL_INGREDIENTS[2];
    const wintergreenItem = BOTANICAL_INGREDIENTS.find(i => i.id === 'wintergreen') || BOTANICAL_INGREDIENTS[0];
    const peppermintItem = BOTANICAL_INGREDIENTS.find(i => i.id === 'peppermint') || BOTANICAL_INGREDIENTS[1];
    const tulsiItem = BOTANICAL_INGREDIENTS.find(i => i.id === 'tulsi') || BOTANICAL_INGREDIENTS[19];

    const leadItems = [gingerItem, wintergreenItem, peppermintItem, { ...gingerItem }, tulsiItem];
    const leadIds = new Set(['ginger', 'wintergreen', 'peppermint', 'tulsi']);
    const rest = BOTANICAL_INGREDIENTS.filter(i => !leadIds.has(i.id));

    return [...leadItems, ...rest];
  }

  let carouselDeck = buildInitialDeck();
  // Center card is Peppermint (index 2 in leadItems)
  let activeIndex = 2;

  function updateCarouselDeck() {
    if (currentCategory === 'all') {
      carouselDeck = buildInitialDeck();
      activeIndex = 2;
    } else {
      carouselDeck = BOTANICAL_INGREDIENTS.filter(item =>
        Array.isArray(item.category)
          ? item.category.includes(currentCategory)
          : item.category === currentCategory
      );
      if (carouselDeck.length === 0) {
        carouselDeck = [...BOTANICAL_INGREDIENTS];
      }
      activeIndex = 0;
    }
    renderCarousel();
  }

  function getSlotItem(offset) {
    const n = carouselDeck.length;
    if (n === 0) return null;
    const idx = (activeIndex + offset + n * 100) % n;
    return { item: carouselDeck[idx], index: idx };
  }

  function renderCarousel() {
    if (!stageTrack) return;
    const n = carouselDeck.length;
    if (n === 0) return;

    const slots = [-2, -1, 0, 1, 2];
    stageTrack.innerHTML = slots.map(offset => {
      const { item, index } = getSlotItem(offset);
      const slotClass = `slot-${offset}`;
      const isCenter = offset === 0;

      return `
        <article class="ing-glass-card ${slotClass}" data-offset="${offset}" data-index="${index}" data-id="${item.id}" role="group" aria-label="${esc(item.name)}">
          <span class="ing-card-glass-badge">🍃 ${esc(item.tradition || 'Botanical')}</span>
          <div class="ing-card-visual">
            <div class="ing-card-aura" aria-hidden="true"></div>
            <img class="ing-card-img" src="assets/ingredients/${item.id}.webp" alt="${esc(item.name)}" loading="${isCenter ? 'eager' : 'lazy'}" width="200" height="200">
          </div>
          <h3 class="ing-glass-name">${esc(item.name)}</h3>
          <span class="ing-glass-latin">${esc(item.latin)}</span>
          <p class="ing-glass-desc">${esc(item.desc)}</p>
          <button class="ing-glass-btn ing-view-detail-btn" data-detail-id="${item.id}" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:13px;height:13px;opacity:0.85;" aria-hidden="true">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16" y2="16"/>
            </svg>
            <span>View Details</span> <i aria-hidden="true">→</i>
          </button>
        </article>
      `;
    }).join('');
  }

  function goToNext() {
    if (carouselDeck.length <= 1) return;
    activeIndex = (activeIndex + 1) % carouselDeck.length;
    renderCarousel();
  }

  function goToPrev() {
    if (carouselDeck.length <= 1) return;
    activeIndex = (activeIndex - 1 + carouselDeck.length) % carouselDeck.length;
    renderCarousel();
  }

  if (stageNext) stageNext.addEventListener('click', goToNext);
  if (stagePrev) stagePrev.addEventListener('click', goToPrev);

  // Card click navigation (click side cards to rotate to them)
  if (stageTrack) {
    stageTrack.addEventListener('click', e => {
      const detailBtn = e.target.closest('.ing-view-detail-btn');
      if (detailBtn) {
        e.stopPropagation();
        const id = detailBtn.dataset.detailId;
        openModal(id);
        return;
      }

      const card = e.target.closest('.ing-glass-card');
      if (!card) return;
      const offset = parseInt(card.dataset.offset, 10);
      if (offset === -1 || offset === -2) {
        goToPrev();
      } else if (offset === 1 || offset === 2) {
        goToNext();
      } else if (offset === 0) {
        openModal(card.dataset.id);
      }
    });
  }

  // Keyboard navigation when carousel is in view
  window.addEventListener('keydown', e => {
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    const hero = $('#hero');
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const inView = rect.bottom > 100 && rect.top < window.innerHeight - 100;
    if (!inView) return;

    if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'ArrowLeft') {
      goToPrev();
    }
  });

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;
  if (stageTrack) {
    stageTrack.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    stageTrack.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) goToNext();
        else goToPrev();
      }
    }, { passive: true });
  }

  // Category Filter Pill Clicks
  function setCategory(cat, sourceBtn) {
    currentCategory = cat;
    filterPillBtns.forEach(b => b.classList.toggle('active', b.dataset.category === cat));
    dropdownItems.forEach(b => b.classList.toggle('active', b.dataset.category === cat));

    if (morePillsBtn) {
      const isMore = ['stress', 'energy', 'nutrients'].includes(cat);
      morePillsBtn.classList.toggle('active', isMore);
      if (isMore && sourceBtn) {
        morePillsBtn.innerHTML = `${sourceBtn.textContent} ▾`;
      } else {
        morePillsBtn.innerHTML = `More ▾`;
      }
    }
    if (moreDropdown) moreDropdown.classList.remove('open');

    updateCarouselDeck();
    renderGrid();
  }

  filterPillBtns.forEach(btn => {
    btn.addEventListener('click', () => setCategory(btn.dataset.category, btn));
  });

  // More Dropdown Controller
  if (morePillsBtn && moreDropdown) {
    morePillsBtn.addEventListener('click', e => {
      e.stopPropagation();
      const open = moreDropdown.classList.toggle('open');
      morePillsBtn.setAttribute('aria-expanded', open);
    });

    document.addEventListener('click', e => {
      if (!moreDropdown.contains(e.target) && e.target !== morePillsBtn) {
        moreDropdown.classList.remove('open');
        morePillsBtn.setAttribute('aria-expanded', 'false');
      }
    });

    dropdownItems.forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        setCategory(item.dataset.category, item);
      });
    });
  }

  // ==========================================================================
  // 6. COMPLETE BOTANICAL DIRECTORY GRID CONTROLLER
  // ==========================================================================
  const gridContainer = $('#ingGrid');
  const searchInput = $('#ingSearch');
  const searchClearBtn = $('#searchClearBtn');
  const dirCount = $('#dirCount');
  let searchQuery = '';

  function renderGrid() {
    if (!gridContainer) return;
    const q = searchQuery.toLowerCase().trim();

    const filtered = BOTANICAL_INGREDIENTS.filter(item => {
      const matchCat =
        currentCategory === 'all' ||
        (Array.isArray(item.category)
          ? item.category.includes(currentCategory)
          : item.category === currentCategory);

      const haystack = [
        item.name, item.latin, item.compound, item.target, item.tradition,
        item.part, item.dose, ...(item.products ? item.products.map(p => p.label) : [])
      ].join(' ').toLowerCase();

      return matchCat && (!q || haystack.includes(q));
    });

    if (dirCount) {
      dirCount.textContent = `Showing ${filtered.length} of ${BOTANICAL_INGREDIENTS.length} botanicals`;
    }

    if (searchClearBtn) {
      searchClearBtn.style.display = q ? 'block' : 'none';
    }

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <p style="font-size: 1.2rem; color: var(--muted); margin-bottom: 12px;">No ingredients found matching "${esc(searchQuery)}".</p>
          <button class="pill" id="clearFilterBtn" type="button"><b>Reset Search</b></button>
        </div>
      `;
      const clearBtn = $('#clearFilterBtn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          searchQuery = '';
          if (searchInput) searchInput.value = '';
          setCategory('all');
        });
      }
      return;
    }

    gridContainer.innerHTML = filtered.map(item => `
      <article class="ing-card" data-id="${item.id}">
        <figure class="ing-card-media" data-initial="${esc(item.name.charAt(0))}">
          <img src="assets/ingredients/${item.id}.webp" alt="${esc(item.name)}" loading="lazy" decoding="async" width="640" height="400">
        </figure>
        <div class="ing-card-top">
          <span class="ing-card-badge">${esc(item.tradition || 'Botanical')}</span>
          ${item.dose ? `<span class="ing-card-origin">${esc(item.dose)}</span>` : ''}
        </div>
        <h3>${esc(item.name)}</h3>
        <div class="ing-card-latin">${esc(item.latin)}</div>
        <p class="ing-card-desc">${esc(item.desc)}</p>
        <div class="ing-card-specs">
          <div class="ing-spec-item">
            <small>Part Used</small>
            <b>${esc(item.part || 'Standardized extract')}</b>
          </div>
          <div class="ing-spec-item">
            <small>Key Compound</small>
            <b>${esc(item.compound || 'Bioactive phytochemicals')}</b>
          </div>
        </div>
        <div class="ing-card-foot">
          <span class="ing-card-target">${esc(item.target)}</span>
          <div class="ing-card-actions">
            <div class="ing-card-prods">
              ${(item.products || []).map(p => `<a href="product-details.html?id=${p.id}" class="ing-prod-pill">${esc(p.label)} →</a>`).join('')}
            </div>
            <button class="ing-dir-detail-btn ing-view-detail-btn" data-detail-id="${item.id}" type="button">
              Details ↗
            </button>
          </div>
        </div>
      </article>
    `).join('');
  }

  // Search input listeners
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      renderGrid();
    });
  }
  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      renderGrid();
    });
  }

  // Image load / error handlers
  if (gridContainer) {
    gridContainer.addEventListener('load', e => {
      if (e.target.tagName === 'IMG') e.target.closest('.ing-card-media')?.classList.add('is-loaded');
    }, true);
    gridContainer.addEventListener('error', e => {
      if (e.target.tagName === 'IMG') e.target.closest('.ing-card-media')?.classList.add('is-missing');
    }, true);

    // Detail button clicks inside grid
    gridContainer.addEventListener('click', e => {
      const btn = e.target.closest('.ing-view-detail-btn');
      if (btn) {
        openModal(btn.dataset.detailId);
      }
    });
  }

  // Smooth scroll for "Explore All Ingredients" button
  const exploreBtn = $('#exploreAllBtn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', e => {
      e.preventDefault();
      const dirSec = $('#directory');
      if (dirSec) {
        dirSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // ==========================================================================
  // 7. BOTANICAL DOSSIER MODAL CONTROLLER
  // ==========================================================================
  const modalOverlay = $('#ingModalOverlay');
  const modalCloseX = $('#modalCloseX');
  const modalBody = $('#modalIngBody');

  function openModal(ingredientId) {
    const item = BOTANICAL_INGREDIENTS.find(i => i.id === ingredientId);
    if (!item || !modalOverlay || !modalBody) return;

    modalBody.innerHTML = `
      <div class="ing-modal-grid">
        <div class="ing-modal-media">
          <img src="assets/ingredients/${item.id}.webp" alt="${esc(item.name)}" class="ing-modal-img" width="220" height="220">
          <div class="ing-modal-badges">
            <span class="ing-card-badge">${esc(item.tradition || 'Botanical')}</span>
            ${item.dose ? `<span class="ing-card-badge">${esc(item.dose)}</span>` : ''}
          </div>
        </div>
        <div class="ing-modal-content">
          <span class="ing-modal-kicker">Botanical Monograph</span>
          <h2 id="modalTitle">${esc(item.name)}</h2>
          <div class="ing-modal-latin">${esc(item.latin)}</div>
          <p class="ing-modal-desc">${esc(item.desc)}</p>

          <div class="ing-modal-specs-list">
            <div class="ing-mspec">
              <small>Part Used</small>
              <b>${esc(item.part || 'Standardized extract')}</b>
            </div>
            <div class="ing-mspec">
              <small>Key Bioactive</small>
              <b>${esc(item.compound || 'Bioactive monoterpenes')}</b>
            </div>
            <div class="ing-mspec">
              <small>Target Action</small>
              <b>${esc(item.target || 'Cellular wellness')}</b>
            </div>
            <div class="ing-mspec">
              <small>Tradition</small>
              <b>${esc(item.tradition || 'Ayurveda & Modern Botany')}</b>
            </div>
          </div>

          <div class="ing-modal-prods-sec">
            <h4>Featured In Formulations</h4>
            <div class="ing-modal-prods-list">
              ${(item.products || []).map(p => `
                <a href="product-details.html?id=${p.id}" class="ing-modal-prod-btn">
                  <span>${esc(p.label)}</span> <i aria-hidden="true">→</i>
                </a>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    modalOverlay.classList.add('open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('modal-open');
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('modal-open');
  }

  if (modalCloseX) modalCloseX.addEventListener('click', closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Initial renders
  renderCarousel();
  renderGrid();
}

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIngredientsPage);
} else {
  initIngredientsPage();
}

export { initIngredientsPage };
