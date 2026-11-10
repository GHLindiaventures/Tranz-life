// TranzLife Biosciences - Product Details Page Interactive Controller
import './styles/main.css';
import { cart, thumbs } from './app/state.js';
import { PRODUCTS } from './data/products.js';
import { SHOTS, DESIGNS } from './features/products/product-images.js';
import { initCart, renderCart } from './features/cart/cart.js';
import { inr } from './utils/format.js';
import { $, $$ } from './utils/dom.js';

// Deep formulation scientific metadata
const CLINICAL_DETAILS = {
  gummies: {
    category: 'Daily Immunity & Vitality',
    eyebrow: 'FORMULATION // 01 · CELLULAR METABOLISM',
    rating: '4.9/5 (128 reviews)',
    highlights: [
      'High-potency botanical antioxidant complex',
      'Supports daily immune resilience & cellular defense',
      'Natural fruit pectin base — 100% gelatin-free & vegan',
      'Zero artificial flavors, synthetic colors, or high-fructose syrup'
    ],
    botanicals: 'Elderberry extract (Sambucus nigra), Standardized Curcumin C3 Complex (Curcuma longa), Vitamin C (Ascorbic acid from Amla fruit), Zinc bisglycinate, Citrus bioflavonoids.',
    usage: 'Chew 2 gummies once daily, preferably in the morning with breakfast. No water needed. Safe for daily long-term wellness maintenance.',
    mechanism: 'Bioactive polyphenols and anthocyanins neutralize reactive oxygen species (ROS), down-regulating inflammatory cytokines while activating natural killer (NK) cell responses.',
    packaging: '100% biodegradable PET-free amber jar with compostable plant-fiber seal cap, preventing photodegradation of delicate phytonutrients.',
    scienceCards: [
      { title: 'Antioxidant Scavenging', text: 'Anthocyanins from elderberry cross cellular barriers to neutralize free radicals before lipid peroxidation occurs.' },
      { title: 'Gut-Immune Axis', text: 'Natural plant pectin serves as a gentle prebiotic, nourishing beneficial microbiota that govern 70% of human immune response.' },
      { title: 'Bio-Enhanced Zinc', text: 'Chelated zinc bisglycinate offers 43% higher absorption than standard zinc sulfate without gastrointestinal distress.' }
    ]
  },
  inhaler: {
    category: 'Calm & Respiratory Support',
    eyebrow: 'FORMULATION // 02 · OLFACTORY BIOCHEMISTRY',
    rating: '4.8/5 (94 reviews)',
    highlights: [
      'Immediate olfactory sensory calming within seconds',
      'Opens nasal pathways and supports mindful deep breathing',
      '100% pure organic therapeutic-grade essential oils',
      'Compact, leak-proof aluminum shell built for daily pocket carry'
    ],
    botanicals: 'Organic Eucalyptus globulus oil, Mentha piperita (Peppermint) essential oil, Lavandula angustifolia (True Lavender) flower oil, Natural L-terpenes.',
    usage: 'Uncap and hold directly under one nostril. Inhale deeply through the nose for 4 seconds while holding the other nostril closed. Repeat on the other side. Use whenever stress or mental fog arises.',
    mechanism: 'Inhaled aromatic volatile terpenes rapidly stimulate olfactory receptors (CN I) which project directly to the amygdala and hippocampus, attenuating cortisol release and activating parasympathetic tone.',
    packaging: 'Precision machined recyclable aluminum casing with dual-seal airtight thread, preserving terpene vapor pressure for over 180 days of regular use.',
    scienceCards: [
      { title: 'Limbic Regulation', text: 'Linalool vapors cross the nasal cribriform plate to modulate GABA-A neuroreceptors, promoting centered focus.' },
      { title: 'Bronchial Expansion', text: 'Natural 1,8-cineole reduces mucosal viscosity and relaxes bronchial smooth muscle for unimpeded air exchange.' },
      { title: 'Zero Synthetic Additives', text: '100% undiluted steam-distilled plant essences with zero propylene glycol, parabens, or synthetic fragrance agents.' }
    ]
  },
  rollon: {
    category: 'Period Comfort & Cramp Relief',
    eyebrow: 'FORMULATION // 03 · TRANSDERMAL BOTANICALS',
    rating: '5.0/5 (214 reviews)',
    highlights: [
      'Fast-acting topical transdermal cramp relief',
      'Cooling-to-warming herbal sensory modulation',
      'Rosemary, rose & peppermint botanical synergy',
      'Convenient rollerball application — non-sticky & rapid drying'
    ],
    botanicals: 'Rosmarinus officinalis (Rosemary) leaf oil, Rosa damascena flower extract, Natural L-menthol, Caprylic/Capric triglyceride (Fractionated coconut carrier), Simmondsia chinensis (Jojoba) seed oil.',
    usage: 'Roll generously onto the lower abdomen, lower back, or inner thighs in gentle circular strokes at the onset of menstrual cramps. Reapply every 3–4 hours as needed.',
    mechanism: 'Topical menthol activates TRPM8 cold-sensitive receptors to trigger sensory gating (pain blocking), while rosemary bioactives inhibit local COX-2 pathways, mitigating uterine muscle spasms.',
    packaging: 'Frosted amber glass vial with medical-grade stainless steel rollerball and eco-crafted wooden cap, housed in an embossed gift box.',
    scienceCards: [
      { title: 'Sensory Pain Gating', text: 'Menthol generates a cooling sensation that overrides nociceptive pain signals along the spinal cord dorsal horn.' },
      { title: 'Microvascular Flow', text: 'Rosmarinic acid stimulates local capillary perfusion, preventing ischemic pain caused by uterine muscle constriction.' },
      { title: 'Skin-Friendly Lipids', text: 'Non-comedogenic jojoba carrier esters allow rapid transdermal delivery without greasiness or clothing residue.' }
    ]
  },
  reviva: {
    category: 'Diabetic & Tired Foot Care',
    eyebrow: 'FORMULATION // 04 · MICROCIRCULATION RECOVERY',
    rating: '4.9/5 (160 reviews)',
    highlights: [
      'Engineered specifically for diabetic foot care & tired soles',
      'Soothes tingling, heaviness, and neuropathic discomfort',
      'Restores skin lipid moisture to prevent deep heel fissures',
      'No-mess rollerball applicator — apply without touching soles'
    ],
    botanicals: 'Centella asiatica (Gotu Kola / Madecassoside), Melaleuca alternifolia (Tea Tree) oil, Aloe barbadensis leaf extract, Shea butter lipid esters, Vegetable squalane.',
    usage: 'Roll directly over clean, dry soles, heels, and ankles twice daily (morning and before sleep). Allow 60 seconds to absorb before wearing socks.',
    mechanism: 'Triterpenoid saponins enhance collagen synthesis and microvascular capillary resistance, while plant squalane locks in deep stratum corneum hydration to prevent diabetic fissures.',
    packaging: 'Ergonomic easy-grip roll-on bottle designed for individuals with limited hand mobility, providing hygienic, touch-free daily application.',
    scienceCards: [
      { title: 'Capillary Perfusion', text: 'Active madecassoside stimulates endothelial nitric oxide production to improve distal microcirculation in tired feet.' },
      { title: 'Barrier Repair', text: 'Phytosterols and squalane replenish natural intercellular ceramides, sealing fissures against bacterial ingress.' },
      { title: 'Gentle Antimicrobial', text: 'Terpinen-4-ol from tea tree oil provides gentle antiseptic protection suitable for delicate diabetic skin.' }
    ]
  },
  liver: {
    category: 'Hepatic Function & Detoxification',
    eyebrow: 'FORMULATION // 05 · PHYTOCHEMICAL ELIXIR',
    rating: '4.9/5 (182 reviews)',
    highlights: [
      'Comprehensive Phase I & Phase II liver enzyme support',
      'Protects hepatocytes against metabolic and toxic oxidative stress',
      'Standardized Milk Thistle (80% Silymarin) + Kutki + Kalmegh',
      'Bio-enhanced liquid suspension for accelerated gastric absorption'
    ],
    botanicals: 'Silybum marianum (Milk Thistle seed extract standardized to 80% Silymarin), Picrorhiza kurroa (Kutki root extract), Andrographis paniculata (Kalmegh), Phyllanthus niruri (Bhumi Amla), Boerhavia diffusa (Punarnava).',
    usage: 'Take 5 ml (approx. 1 teaspoon) twice daily diluted in 100 ml of lukewarm water, 30 minutes before meals. Shake bottle well before each use.',
    mechanism: 'Silymarin promotes hepatocyte ribosomal RNA synthesis to accelerate liver tissue repair, while andrographolide enhances phase II glutathione S-transferase activity, promoting safe toxin clearance.',
    packaging: 'Pharmaceutical-grade UV-protective green glass bottle with custom calibrated dropper cap and recyclable wooden overcap.',
    scienceCards: [
      { title: 'Hepatocyte Protection', text: 'Silymarin alters outer liver cell membrane structure to block the penetration of environmental toxins.' },
      { title: 'Phase II Enzyme Induction', text: 'Kutki and Kalmegh stimulate cellular glutathione synthesis, neutralizing reactive metabolic byproducts.' },
      { title: 'Biliary Secretion', text: 'Phyllanthin bioactives stimulate healthy bile flow, promoting optimal fat emulsification and systemic detoxification.' }
    ]
  }
};

function initProductDetailsPage() {
  Object.assign(thumbs, SHOTS);

  try {
    initCart();
    renderCart();
  } catch (e) {
    console.warn('Cart initialization deferred:', e);
  }

  // 1. Identify active product from URL query
  const params = new URLSearchParams(window.location.search);
  const activeId = params.get('id') || 'gummies';
  const prod = PRODUCTS.find(p => p.id === activeId) || PRODUCTS[0];
  const clinical = CLINICAL_DETAILS[prod.id] || CLINICAL_DETAILS.gummies;

  // 2. Update page title & SEO meta
  document.title = `${prod.name} | TranzLife Biosciences`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', prod.desc);

  // 3. Render Breadcrumbs
  const crumbEl = $('#pdpBreadcrumb');
  if (crumbEl) {
    crumbEl.innerHTML = `
      <a href="index.html">Home</a>
      <i>/</i>
      <a href="products.html">Products</a>
      <i>/</i>
      <span>${prod.name}</span>
    `;
  }

  // 4. Render Gallery & Tabs
  const studioImg = SHOTS[prod.id];
  const designImg = DESIGNS[prod.id];
  const imgBox = $('#pdpImgBox');
  if (imgBox) {
    imgBox.innerHTML = `
      <img id="pdpMainImg" src="${studioImg}" alt="${prod.name}" width="800" height="800">
      <span class="pdp-badge-tag">${prod.tag}</span>
    `;
  }

  const tabBtns = $$('.pdp-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.toggle('on', b === btn));
      const target = btn.dataset.view;
      const mainImg = $('#pdpMainImg');
      if (mainImg) {
        mainImg.src = (target === 'design' && designImg) ? designImg : studioImg;
      }
    });
  });

  // 5. Render Product Details
  const infoEl = $('#pdpInfo');
  if (infoEl) {
    infoEl.innerHTML = `
      <p class="eyebrow drawn">${clinical.eyebrow}</p>
      <h1 class="pdp-title">${prod.name}</h1>
      <div class="pdp-rating-row">
        <div class="pdp-stars">★★★★★</div>
        <span class="pdp-rating-text">${clinical.rating}</span>
        <span class="pdp-badge-clinical">Clinical Rigor</span>
      </div>
      <div class="pdp-price-box">
        <span class="pdp-price">${inr(prod.price)}</span>
        <span class="pdp-size">/ ${prod.size}</span>
        <span class="pdp-tax-note">Inclusive of all taxes · Free delivery ₹999+</span>
      </div>
      <p class="pdp-desc">${prod.desc}</p>
      <div class="pdp-highlights">
        ${clinical.highlights.map(h => `
          <div class="pdp-highlight-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>${h}</span>
          </div>
        `).join('')}
      </div>

      <!-- Action Row: Qty + Add to Bag -->
      <div class="pdp-actions-row">
        <div class="pdp-qty-control">
          <button type="button" id="pdpQtyDec" aria-label="Decrease quantity">−</button>
          <span class="pdp-qty-val" id="pdpQtyVal">1</span>
          <button type="button" id="pdpQtyInc" aria-label="Increase quantity">+</button>
        </div>
        <button class="add pill pdp-btn-add" id="pdpAddBtn" data-id="${prod.id}" type="button">
          <i aria-hidden="true">+</i><b>Add to bag · ${inr(prod.price)}</b>
        </button>
      </div>

      <!-- Accordion Specifications -->
      <div class="pdp-accordions">
        <div class="pdp-acc-item open">
          <button class="pdp-acc-header" type="button">
            Key Botanical Actives <span class="pdp-acc-icon">+</span>
          </button>
          <div class="pdp-acc-body">
            <p>${clinical.botanicals}</p>
          </div>
        </div>

        <div class="pdp-acc-item">
          <button class="pdp-acc-header" type="button">
            Recommended Daily Usage <span class="pdp-acc-icon">+</span>
          </button>
          <div class="pdp-acc-body">
            <p>${clinical.usage}</p>
          </div>
        </div>

        <div class="pdp-acc-item">
          <button class="pdp-acc-header" type="button">
            Biological Mechanism of Action <span class="pdp-acc-icon">+</span>
          </button>
          <div class="pdp-acc-body">
            <p>${clinical.mechanism}</p>
          </div>
        </div>

        <div class="pdp-acc-item">
          <button class="pdp-acc-header" type="button">
            Eco-Packaging &amp; Storage <span class="pdp-acc-icon">+</span>
          </button>
          <div class="pdp-acc-body">
            <p>${clinical.packaging}</p>
          </div>
        </div>
      </div>
    `;
  }

  // 6. Quantity Counter & Add to Bag logic
  let qty = 1;
  const decBtn = $('#pdpQtyDec');
  const incBtn = $('#pdpQtyInc');
  const valSpan = $('#pdpQtyVal');
  const addBtn = $('#pdpAddBtn');

  if (decBtn && incBtn && valSpan && addBtn) {
    decBtn.addEventListener('click', () => {
      if (qty > 1) {
        qty--;
        valSpan.textContent = qty;
        addBtn.querySelector('b').textContent = `Add to bag · ${inr(prod.price * qty)}`;
      }
    });
    incBtn.addEventListener('click', () => {
      qty++;
      valSpan.textContent = qty;
      addBtn.querySelector('b').textContent = `Add to bag · ${inr(prod.price * qty)}`;
    });
    addBtn.addEventListener('click', () => {
      cart.set(prod.id, (cart.get(prod.id) || 0) + qty);
      renderCart();
      setDrawerOpen(true);
      showToast(`${qty} × ${prod.name} added to your bag`);
    });
  }

  // 7. Accordions Interactive Toggle
  $$('.pdp-acc-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.pdp-acc-item');
      item.classList.toggle('open');
    });
  });

  // 8. Render Science / Mechanism Cards
  const sciGrid = $('#pdpScienceGrid');
  if (sciGrid) {
    sciGrid.innerHTML = clinical.scienceCards.map(sc => `
      <div class="pdp-science-card">
        <div class="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h4>${sc.title}</h4>
        <p>${sc.text}</p>
      </div>
    `).join('');
  }

  // 9. Render Cross-Sell Formulations
  const crossGrid = $('#pdpCrossGrid');
  if (crossGrid) {
    const others = PRODUCTS.filter(p => p.id !== prod.id);
    crossGrid.innerHTML = others.map(p => `
      <article class="pdp-mini-card">
        <div class="pdp-mini-media">
          <img src="${SHOTS[p.id]}" alt="${p.name}" loading="lazy" width="400" height="400">
        </div>
        <div class="pdp-mini-body">
          <h4>${p.name}</h4>
          <div class="pdp-mini-foot">
            <span class="price">${inr(p.price)}</span>
            <a href="product-details.html?id=${p.id}">View Details →</a>
          </div>
        </div>
      </article>
    `).join('');
  }

  // 10. Toast Notification
  const toastEl = $('#toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2400);
  }

  // 11. Navigation scroll header styling
  const nav = $('#nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 12. Mobile / Full-screen Navigation Menu Controller
  const menuBtn = $('#dockMenu');
  const menu = $('#menu');
  const menuX = $('#menuX');

  function setMenuOpen(open) {
    if (!menu) return;
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', !open);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', open);
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    document.documentElement.classList.toggle('menu-open', open);
  }

  if (menuBtn) menuBtn.addEventListener('click', () => setMenuOpen(!menu.classList.contains('open')));
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

  // 13. Cart Bag Drawer Controller
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
}

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductDetailsPage);
} else {
  initProductDetailsPage();
}
