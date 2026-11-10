// TranzLife Biosciences - Our Ingredients Interactive Controller
import './styles/main.css';
import { initCart } from './features/cart/cart.js';
import { $ } from './utils/dom.js';

export const BOTANICAL_INGREDIENTS = [
  {
    id: 'curcumin',
    name: 'Curcumin C3 Complex',
    latin: 'Curcuma longa L.',
    category: 'immunity',
    part: 'Supercritical Rhizome',
    origin: 'Western Ghats, Kerala',
    compound: 'Curcuminoids (95%)',
    target: 'NF-κB Inflammatory Blockade & Longevity',
    product: 'Reviva Drops & Liver Protect',
    productId: 'reviva',
    desc: 'Extracted via subcritical CO₂ and formulated into phytosome liposomal complexes, Curcumin C3 targets nuclear inflammatory signaling switches, delivering 29x higher bioavailability than standard raw turmeric root.'
  },
  {
    id: 'milk-thistle',
    name: 'Milk Thistle (Silymarin)',
    latin: 'Silybum marianum',
    category: 'liver',
    part: 'Standardized Seed Extract',
    origin: 'Mediterranean Bio-Zone',
    compound: 'Silymarin (80% Silybin A/B)',
    target: 'Hepatocyte Membrane Stabilization',
    product: 'Liver Protect Drops',
    productId: 'liver',
    desc: 'Silymarin reinforces hepatic outer cell membranes against xenobiotics and metabolic waste products, while stimulating intracellular protein synthesis and accelerating endogenous glutathione replenishment.'
  },
  {
    id: 'peppermint',
    name: 'Peppermint',
    latin: 'Mentha × piperita',
    category: 'stress',
    part: 'Steam-Distilled Leaf Oil',
    origin: 'Nilgiri Foothills, Tamil Nadu',
    compound: 'L-Menthol (High Purity)',
    target: 'TRPM8 Cold Sensory Receptors',
    product: 'Calm Roll-On',
    productId: 'rollon',
    desc: 'Standardized L-menthol stimulates TRPM8 neuro-receptors to provoke a biological cooling feedback cascade, soothing tense cranial muscles, relaxing temples, and refreshing sensory nerve endings.'
  },
  {
    id: 'eucalyptus',
    name: 'Tasmanian Blue Gum',
    latin: 'Eucalyptus globulus',
    category: 'respiratory',
    part: 'Supercritical Leaf Oil',
    origin: 'Nilgiri High Altitudes',
    compound: '1,8-Cineole (99.2%)',
    target: 'Bronchial Ciliary Motility',
    product: 'Forest Breathe Inhaler',
    productId: 'inhaler',
    desc: 'Standardized 1,8-cineole vapor liquefies thick mucosal secretions and elevates ciliary beat frequency in the upper respiratory tract, creating instantaneous open-air breathing comfort.'
  },
  {
    id: 'rose',
    name: 'Damask Rose',
    latin: 'Rosa damascena',
    category: 'stress',
    part: 'Hydro-Distilled Petals',
    origin: 'Valley of Roses / Kannauj',
    compound: 'Geraniol & Citronellol',
    target: 'Central GABA-A Receptors',
    product: 'Calm Roll-On',
    productId: 'rollon',
    desc: 'Rare volatile monoterpenoids interact with olfactory-limbic autonomic centers, dialing down stress-induced sympathetic hyperactivity and blunting acute cortisol secretion.'
  },
  {
    id: 'tulsi',
    name: 'Holy Basil (Tulsi)',
    latin: 'Ocimum tenuiflorum',
    category: 'respiratory',
    part: 'Flowering Aerial Tops',
    origin: 'Organic Farms, Madhya Pradesh',
    compound: 'Eugenol & Ursolic Acid',
    target: 'COX-2 & 5-LOX Enzyme Inhibition',
    product: 'Forest Breathe Inhaler',
    productId: 'inhaler',
    desc: 'Eugenol and ursolic acid fortify delicate mucosal barriers against environmental micro-pollutants and urban PM2.5 particulate matter while providing potent adaptogenic antioxidant cellular defense.'
  },
  {
    id: 'ashwagandha',
    name: 'Ashwagandha',
    latin: 'Withania somnifera',
    category: 'stress',
    part: 'Standardized Root Extract',
    origin: 'Semi-Arid Rajasthan Terroir',
    compound: 'Withaferin A (5% Withanolides)',
    target: 'HPA Axis Homeostasis & REM Sleep',
    product: 'Reviva Drops & Focus Gummies',
    productId: 'reviva',
    desc: 'Bio-standardized withanolide glycosides recalibrate the hypothalamic-pituitary-adrenal stress axis, calming baseline adrenaline spikes and fostering deep restorative cellular recovery during night rest.'
  },
  {
    id: 'gotu-kola',
    name: 'Gotu Kola (Brahmi)',
    latin: 'Centella asiatica',
    category: 'focus',
    part: 'Whole Fresh Leaf Extract',
    origin: 'Sub-Himalayan Wetlands',
    compound: 'Asiaticoside & Madecassoside',
    target: 'Cerebral Microvascular Circulation',
    product: 'Focus Gummies',
    productId: 'gummies',
    desc: 'Potent triterpenic saponins stimulate brain-derived neurotrophic factor (BDNF) synthesis and microvascular oxygen delivery to cerebral cortex tissues, sharpening focus and cognitive retention.'
  },
  {
    id: 'elderberry',
    name: 'Black Elderberry',
    latin: 'Sambucus nigra',
    category: 'immunity',
    part: 'Cold-Pressed Whole Berries',
    origin: 'Alpine European Orchards',
    compound: 'Anthocyanins (Cyanidin-3-Glucoside)',
    target: 'Viral Envelope Glycoprotein Blockade',
    product: 'Focus Gummies & Reviva',
    productId: 'gummies',
    desc: 'Rich in dark bio-flavonoid anthocyanins that prevent viral adherence to mucosal membranes while accelerating innate natural killer (NK) cell mobilization during seasonal weather shifts.'
  },
  {
    id: 'kutki',
    name: 'Kutki',
    latin: 'Picrorhiza kurroa',
    category: 'liver',
    part: 'Alpine Wildcrafted Rhizome',
    origin: 'Himalayan Slopes (3,200m+)',
    compound: 'Kutkin & Picrosides I/II',
    target: 'Hepatic Bile Secretion & Detox',
    product: 'Liver Protect Drops',
    productId: 'liver',
    desc: 'A revered alpine bitter tonic whose iridoid glycosides stimulate natural bile acid flow, accelerate lipid excretion from hepatocytes, and neutralize systemic free radical lipid peroxidation.'
  },
  {
    id: 'kalmegh',
    name: 'Kalmegh (Andrographis)',
    latin: 'Andrographis paniculata',
    category: 'liver',
    part: 'Matured Aerial Leaves',
    origin: 'Deciduous Central Forests',
    compound: 'Andrographolides (50%)',
    target: 'Phase II Enzyme Sulfation',
    product: 'Liver Protect Drops',
    productId: 'liver',
    desc: 'Potent diterpenoid lactones activate hepatic Phase II glucuronidation and sulfation pathways, facilitating rapid binding and safe renal clearance of fat-soluble metabolic toxins.'
  },
  {
    id: 'amla',
    name: 'Indian Gooseberry (Amla)',
    latin: 'Phyllanthus emblica',
    category: 'immunity',
    part: 'Fresh Whole Forest Fruit',
    origin: 'Western Ghats Biosphere',
    compound: 'Emblicanin A/B & Natural Vitamin C',
    target: 'Intracellular Glutathione Sparing',
    product: 'Liver Protect & Focus Gummies',
    productId: 'liver',
    desc: 'Tannoid-bound vitamin C in emblicanin polymers resists heat and oxidative degradation 12x longer than synthetic ascorbic acid, neutralizing reactive oxygen species in cellular membranes.'
  }
];

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

  // 5. Filter & Search State
  let currentFilter = 'all';
  let searchQuery = '';

  const gridContainer = $('#ingGrid');
  const searchInput = $('#ingSearch');
  const filterBtns = document.querySelectorAll('.ing-filter-btn');

  function renderGrid() {
    if (!gridContainer) return;

    const filtered = BOTANICAL_INGREDIENTS.filter(item => {
      const matchCat = currentFilter === 'all' || item.category === currentFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        item.latin.toLowerCase().includes(q) ||
        item.compound.toLowerCase().includes(q) ||
        item.target.toLowerCase().includes(q) ||
        item.origin.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <p style="font-size: 1.2rem; color: var(--muted); margin-bottom: 12px;">No botanical ingredients found matching "${searchQuery}".</p>
          <button class="pill" id="clearFilterBtn" type="button"><b>Reset Search</b></button>
        </div>
      `;
      const clearBtn = $('#clearFilterBtn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          currentFilter = 'all';
          searchQuery = '';
          if (searchInput) searchInput.value = '';
          filterBtns.forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
          renderGrid();
        });
      }
      return;
    }

    gridContainer.innerHTML = filtered.map(item => `
      <article class="ing-card" data-id="${item.id}">
        <div class="ing-card-top">
          <span class="ing-card-badge">${item.compound}</span>
          <span class="ing-card-origin">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${item.origin}
          </span>
        </div>
        <h3>${item.name}</h3>
        <div class="ing-card-latin">${item.latin}</div>
        <p class="ing-card-desc">${item.desc}</p>
        <div class="ing-card-specs">
          <div class="ing-spec-item">
            <small>Part Used</small>
            <b>${item.part}</b>
          </div>
          <div class="ing-spec-item">
            <small>Active Compound</small>
            <b>${item.compound}</b>
          </div>
        </div>
        <div class="ing-card-foot">
          <span class="ing-card-target">Target: ${item.target}</span>
          <a href="product-details.html?id=${item.productId}" class="ing-prod-pill">
            Explore ${item.product.split('&')[0].trim()} →
          </a>
        </div>
      </article>
    `).join('');
  }

  // Filter Button Clicks
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.category || 'all';
      renderGrid();
    });
  });

  // Search Input Events
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      if (searchQuery.trim().length > 0 && currentFilter !== 'all') {
        // Automatically expand search across all categories
        currentFilter = 'all';
        filterBtns.forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
      }
      renderGrid();
    });
  }

  // Initial Render
  renderGrid();
}

// Auto-boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIngredientsPage);
} else {
  initIngredientsPage();
}

export { initIngredientsPage };
