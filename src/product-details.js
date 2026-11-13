// TranzLife Biosciences - Product Details Page Interactive Controller
import './styles/main.css';
import { cart, thumbs } from './app/state.js';
import { PRODUCTS, EXTRA_PRODUCTS } from './data/products.js';
import { SHOTS, DESIGNS } from './features/products/product-images.js';
import { initCart, renderCart } from './features/cart/cart.js';
import { inr } from './utils/format.js';
import { $, $$ } from './utils/dom.js';
import { initBeforeAfter } from './features/compare/before-after.js';

// Deep formulation scientific metadata directly aligned with official TranzLife documentation
const CLINICAL_DETAILS = {
  gummies: {
    category: 'Lung Booster & Craving Control',
    eyebrow: '100% AYURVEDIC NUTRACEUTICAL · FOR HEAVY SMOKERS',
    rating: '4.9/5 (240+ reviews)',
    highlights: [
      'Helps reduce the urge to smoke & manages withdrawal discomfort',
      'Vasaka, Tulsi & Mulethi soothe and cleanse respiratory airways',
      'Adaptogenic herbs ease stress, irritability, and restlessness',
      'Natural Berry Flavour — 100% Gelatin-Free, No Added Sugar, Zero Nicotine'
    ],
    botanicals: 'Vasaka (Adhatoda vasica) 100mg, Tulsi (Ocimum sanctum) 100mg, Mulethi (Glycyrrhiza glabra) 100mg, Turmeric (Curcuma longa) 80mg, Giloy (Tinospora cordifolia) 80mg, Black Pepper (Piper nigrum) 50mg, Vitamin C 40mg, Vitamin D3 10mcg, Zinc 5mg.',
    usage: 'Adults: 2 gummies twice daily after meals. Chew well before swallowing. Do not exceed the recommended daily usage. Not recommended for pregnant or lactating women.',
    mechanism: 'Vasicine from Vasaka acts as a natural bronchodilator and mucolytic agent to liquefy tar, while Tulsi and Mulethi soothe inflamed mucosal lining. Black pepper extract and adaptogens help stabilize dopamine receptors during acute craving spikes.',
    packaging: 'High-barrier biophotonic container with tamper-evident seal. 60 Gummies. Barcode: 8 906132 540147. Mfg. Lic. No.: TN/AYU/24/1234.',
    scienceCards: [
      { title: 'Bronchial Mucus Clearance', text: 'Vasicine stimulates ciliary movement in the bronchial tree, rapidly clearing accumulated particulate matter.' },
      { title: 'Nicotine Craving Regulation', text: 'Black pepper and adaptogenic actives interact with neuro-receptors to mitigate withdrawal irritability and craving frequency.' },
      { title: 'Antioxidant Lung Shield', text: 'Synergistic Vitamin C, Zinc, and Curcumin neutralize free radicals caused by tobacco smoke.' }
    ]
  },
  inhaler: {
    category: 'Tobacco & Smoking Cessation Aromatherapy',
    eyebrow: '100% NATURAL · ZERO NICOTINE · PORTABLE & DISCREET',
    rating: '4.9/5 (180+ reviews)',
    highlights: [
      'Helps resist the urge to smoke and manages withdrawal anxiety',
      'Unique aroma blend of 6 pure therapeutic essential oils',
      'Available in 4 Targeted Editions: Standard, Plus, Gold & Night',
      '100% Non-Addictive, Non-Toxic, Chemical-Free Pocket Inhaler'
    ],
    botanicals: 'Peppermint Oil, Lavender Oil, Eucalyptus Oil, Lemon Oil, Black Pepper Oil, and Tulsi Oil.',
    usage: 'Remove cap gently. Inhale deeply through each nostril 2–3 times whenever cravings arise or when experiencing stress. Combine with deep breathing.',
    mechanism: 'Inhaled volatile aroma molecules stimulate the olfactory bulb and trigeminal sensory nerve endings in the throat, creating the sensation of smoke inhalation without harmful combustion or chemicals.',
    packaging: 'Airtight medical-grade 10 ml pocket inhaler shell preserving volatile terpene vapor pressure for daily use.',
    scienceCards: [
      { title: 'Sensory Replacement', text: 'Black pepper volatile oil provides sensory throat satisfaction that blunts the habitual physical urge to smoke.' },
      { title: 'Limbic Stress Relief', text: 'Lavender and Peppermint vapors activate parasympathetic neuro-circuits, soothing withdrawal tension.' },
      { title: 'Airway Expansion', text: 'Eucalyptus cineole vaporizes across nasal passages to open airways and promote clear breathing.' }
    ]
  },
  rollon: {
    category: 'Natural Support for Menstrual Comfort',
    eyebrow: '100% NATURAL PRODUCT · CYCLE RELIEF',
    rating: '5.0/5 (310+ reviews)',
    highlights: [
      'Eases menstrual cramps and soothes deep abdominal discomfort',
      'Relaxes tense pelvic and abdominal smooth muscles',
      'Fast-absorbing, non-greasy topical formula (MRP: ₹399)',
      'Cruelty-free, recyclable packaging, zero added chemicals'
    ],
    botanicals: 'Pure essential oils of Dill (Anethum graveolens E.O) and Eucalyptus (Eucalyptus globulus E.O) in a nourishing plant-based carrier matrix.',
    usage: 'Roll gently around the belly button every morning on an empty stomach. Use daily during menstruation for best results. For external use only.',
    mechanism: 'Carvone and limonene from Dill essential oil deliver proven antispasmodic action across transdermal pathways, relaxing smooth uterine contractions while Eucalyptus promotes micro-vascular circulation.',
    packaging: '50 ml roll-on bottle (and 8 ml travel size) with stainless steel rollerball. Barcode: 8 906132 540154.',
    scienceCards: [
      { title: 'Antispasmodic Action', text: 'Dill volatile oils block calcium influx in visceral smooth muscle cells, preventing intense abdominal spasms.' },
      { title: 'Belly Button Absorption', text: 'The umbilical region (Nabhi) offers rich microvascular networks for rapid, non-systemic transdermal absorption.' },
      { title: 'Non-Greasy Dry Down', text: 'Rapidly absorbed natural botanical esters leave zero oil residue on skin or clothing.' }
    ]
  },
  // From the Reviva brochure only. It positions Reviva as a topical massage / personal-care product and rules out
  // any blood-glucose or diabetes claim, so none is made; no rating, mechanism or science cards (none given).
  reviva: {
    category: 'Botanical Massage Roll-On',
    eyebrow: 'BOTANICAL MASSAGE ROLL-ON · EVERYDAY WELLNESS & VITALITY RITUAL',
    rating: null,
    pills: false,
    activesTitle: 'Ingredients',
    packagingTitle: 'Pack &amp; Precautions',
    highlights: [
      'Convenient 50 ml massage roll-on format',
      'Designed for external application and gentle massage',
      'Portable format for a simple daily wellness ritual',
      'Botanical-inspired positioning for everyday personal care'
    ],
    botanicals: 'Dill essential oil and Eucalyptus essential oil. See the product label for the full ingredient declaration.',
    usage: 'Apply a small amount to intact skin and massage gently, as directed on the label. Do not apply to wounds or irritated skin. Wash hands after use. Patch test before first use and discontinue if irritation occurs.',
    mechanism: null,
    packaging: 'Massage roll-on, 50 ml. External use only. Avoid eyes and mucous membranes. Keep out of reach of children. Do not use as a replacement for diabetes medication, glucose monitoring or medical advice.',
    scienceCards: []
  },
  liver: {
    category: '100% Ayurvedic Liver Booster (500 ml)',
    eyebrow: 'POLYHERBAL CONCOCTION · DETOXIFIES • PROTECTS • REJUVENATES',
    rating: '4.9/5 (280+ reviews)',
    highlights: [
      'Flushes out accumulated toxins and supports natural liver cleansing',
      'Protects hepatocytes and supports healthy liver enzyme levels',
      'Potent antioxidant defense combating oxidative stress & fatigue',
      'Improves digestion, bile flow, and systemic nutrient absorption'
    ],
    botanicals: 'Each 10 ml contains: Bhumyamalaki (Phyllanthus niruri) 500mg, Kalmegh (Andrographis paniculata) 400mg, Kutki (Picrorhiza kurroa) 400mg, Punarnava (Boerhavia diffusa) 300mg, Bhringraj (Eclipta alba) 300mg, Daruharidra (Berberis aristata) 200mg, Guduchi (Tinospora cordifolia) 200mg, Amla (Emblica officinalis) 200mg, Haritaki (Terminalia chebula) 200mg, Turmeric (Curcuma longa) 150mg, Black Pepper (Piper nigrum) 50mg.',
    usage: 'Adults: 10 ml (2 teaspoons) twice daily after meals. Shake well before use. Refrigerate after opening. Store away from direct sunlight.',
    mechanism: 'Synergistic polyherbal bioactives protect liver parenchymal membranes, stimulate Phase II glutathione S-transferase enzymes, and promote bile acid synthesis to clear metabolic toxins.',
    packaging: 'Pharmaceutical 500 ml amber bottle with calibrated dosing cap. Barcode: 8 906132 540130. Mfg. Lic. No.: TN/AYU/24/1234.',
    scienceCards: [
      { title: 'Hepatocyte Protection', text: 'Phyllanthin and Kutkin alter outer hepatocyte membrane architecture, shielding cells against toxic metabolites.' },
      { title: 'Biliary Secretion', text: 'Andrographolide and Daruharidra stimulate natural bile flow, accelerating digestion and toxin elimination.' },
      { title: 'Antioxidant Defense', text: 'Amla and Haritaki deliver rich gallic and ellagic acid antioxidants that quench reactive oxygen species in hepatic tissue.' }
    ]
  },
  // From the draft brochure only. No rating, price, mechanism or science claims are given there, so none are shown
  // (the page leaves those parts out when they are missing), and no "plant-derived / GMP" pills (not stated).
  energy: {
    category: 'Energy & Everyday Vitality',
    eyebrow: 'HERBAL & BIOACTIVE WELLNESS FORMULATION · ORAL LIQUID',
    rating: null,
    pills: false,
    activesTitle: 'Key Ingredients',
    packagingTitle: 'Pack &amp; Storage',
    highlights: [
      'Designed to complement daily energy, activity and general well-being',
      'Selected botanical and mineral-origin ingredients in a ready-to-use liquid',
      'A simple, measured routine: 7.5 ml twice daily',
      '500 ml pack with measuring device'
    ],
    botanicals: 'Ruta graveolens (Q), Hecla lava (3X), Symphytum officinale (Q), Calcarea phosphorica (8X), Echinacea angustifolia (Q). Refer to the approved product label for the complete composition and ingredient quantities.',
    usage: '7.5 ml twice daily, or as recommended by a healthcare professional. Shake well if directed on the final label. Use the measuring device supplied with the pack and follow the approved label. Use only as directed; do not exceed the recommended serving. Consult a qualified healthcare professional before use if pregnant, breastfeeding, taking medication or managing a health condition.',
    mechanism: null,
    packaging: 'Oral liquid, net quantity 500 ml. Store as directed on the final pack. Keep out of reach of children.',
    scienceCards: []
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
  const prod = [...PRODUCTS, ...EXTRA_PRODUCTS].find(p => p.id === activeId) || PRODUCTS[0];
  const hasPrice = prod.price != null;
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
    imgBox.innerHTML = studioImg ? `
      <img id="pdpMainImg" src="${studioImg}" alt="${prod.name}" width="800" height="800">
      <span class="pdp-badge-tag">${prod.tag}</span>
    ` : `
      <div class="pdp-img-soon" role="img" aria-label="${prod.name}: product image coming soon">
        <span class="pdp-img-soon__mark" aria-hidden="true"></span>
        <b>${prod.short}</b>
        <small>${prod.size}</small>
        <em>Product image coming soon</em>
      </div>
      <span class="pdp-badge-tag">${prod.tag}</span>
    `;
  }
  const tabsEl = $('.pdp-gallery-tabs');
  if (tabsEl && (!studioImg || !designImg)) tabsEl.hidden = true;
  const pillsEl = $('.pdp-guarantee-pills');
  if (pillsEl && clinical.pills === false) pillsEl.hidden = true;

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
      ${clinical.rating ? `<div class="pdp-rating-row">
        <div class="pdp-stars">★★★★★</div>
        <span class="pdp-rating-text">${clinical.rating}</span>
        <span class="pdp-badge-clinical">Clinical Rigor</span>
      </div>` : ''}
      <div class="pdp-price-box">
        ${hasPrice ? `<span class="pdp-price">${inr(prod.price)}</span>
        <span class="pdp-size">/ ${prod.size}</span>
        <span class="pdp-tax-note">Inclusive of all taxes · Free delivery ₹999+</span>` : `<span class="pdp-price pdp-price--tba">Price to be announced</span>
        <span class="pdp-size">/ ${prod.size}</span>`}
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

      <!-- Action Row: Qty + Add to Bag (an enquiry instead while there is no price) -->
      ${hasPrice ? `<div class="pdp-actions-row">
        <div class="pdp-qty-control">
          <button type="button" id="pdpQtyDec" aria-label="Decrease quantity">−</button>
          <span class="pdp-qty-val" id="pdpQtyVal">1</span>
          <button type="button" id="pdpQtyInc" aria-label="Increase quantity">+</button>
        </div>
        <button class="add pill pdp-btn-add" id="pdpAddBtn" data-id="${prod.id}" type="button">
          <i aria-hidden="true">+</i><b>Add to bag · ${inr(prod.price)}</b>
        </button>
      </div>` : `<div class="pdp-actions-row">
        <a class="pill pdp-btn-add" href="contact.html"><i aria-hidden="true">↗</i><b>Enquire about availability</b></a>
      </div>`}

      <!-- Accordion Specifications -->
      <div class="pdp-accordions">
        <div class="pdp-acc-item open">
          <button class="pdp-acc-header" type="button">
            ${clinical.activesTitle || 'Key Botanical Actives'} <span class="pdp-acc-icon">+</span>
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

        ${clinical.mechanism ? `<div class="pdp-acc-item">
          <button class="pdp-acc-header" type="button">
            Biological Mechanism of Action <span class="pdp-acc-icon">+</span>
          </button>
          <div class="pdp-acc-body">
            <p>${clinical.mechanism}</p>
          </div>
        </div>` : ''}

        <div class="pdp-acc-item">
          <button class="pdp-acc-header" type="button">
            ${clinical.packagingTitle || 'Eco-Packaging &amp; Storage'} <span class="pdp-acc-icon">+</span>
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

  // 7b. Before / after comparison (products with one in src/data/compare.js)
  try { initBeforeAfter($('#pdpCompare'), prod.id); } catch (e) { console.warn('Comparison unavailable:', e); }

  // 8. Render Science / Mechanism Cards
  const sciGrid = $('#pdpScienceGrid');
  const sciBand = $('.pdp-science-band');
  if (sciBand && !clinical.scienceCards.length) sciBand.hidden = true;
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
