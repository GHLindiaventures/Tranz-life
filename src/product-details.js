// TranzLife Biosciences - Product Details Page Interactive Controller
import './features/footer/night-footer.js';
import { thumbs } from './app/state.js';
import { storeCta } from './app/store.js';
import { PRODUCTS, EXTRA_PRODUCTS } from './data/products.js';
import { SHOTS, DESIGNS } from './features/products/product-images.js';
import './features/navigation/dropdown.js';
import './components/page-scrollbar.js';
import { $, $$ } from './utils/dom.js';
import { initBeforeAfter } from './features/compare/before-after.js';

// Product page content per product. Ingredients follow the official composition sheet (src/data/ingredients.js);
// wording follows the client brief: relaxation, comfort and wellness positioning, no treatment claims.
// rating: null (no verified reviews yet). mechanism: null and scienceCards: [] hide those parts of the page.
const CLINICAL_DETAILS = {
  gummies: {
    category: 'Respiratory Wellness Gummies',
    eyebrow: 'BOTANICAL GUMMIES · VITAMINS & MINERALS · BERRY FLAVOUR',
    rating: null,
    highlights: [
      'Traditional botanicals for everyday respiratory wellness',
      'Tulsi, Vasaka, dry ginger, long pepper and licorice root in every gummy',
      'With Vitamin C, Vitamin D3 and Zinc',
      'Convenient, berry-flavoured gummy format'
    ],
    botanicals: 'Tulsi (Ocimum tenuiflorum), Vasaka (Justicia adhatoda), Dry Ginger / Sukku (Zingiber officinale), Long Pepper / Thippili (Piper longum), Black Pepper (Piper nigrum), Black Turmeric / Karumanjal (Curcuma caesia), Cumin / Jeera (Cuminum cyminum), Licorice Root (Glycyrrhiza glabra), Small Onion Extract (Allium cepa), Vitamin C, Vitamin D3 and Zinc. See the product label for quantities.',
    usage: 'Adults: 2 gummies twice daily after meals, or as directed on the label. Chew well before swallowing. Do not exceed the recommended daily usage. Not recommended for pregnant or lactating women. Consult a healthcare professional if you have a respiratory condition or take regular medication.',
    mechanism: null,
    packaging: 'Tamper-evident container. 60 gummies. Barcode: 8 906132 540147.',
    scienceCards: []
  },
  inhaler: {
    category: 'Aromatherapy & Relaxation',
    eyebrow: 'PORTABLE AROMATHERAPY · SIX ESSENTIAL OILS',
    rating: null,
    highlights: [
      'A compact, portable aromatherapy inhaler',
      'A blend of six essential oils for a refreshing aromatic moment',
      'Bring a brief pause and mindful breathing into your day',
      'Fits easily in a pocket or bag'
    ],
    botanicals: 'Peppermint Oil, Lavender Oil, Eucalyptus Oil, Lemon Oil, Black Pepper Oil and Tulsi Oil.',
    usage: 'Remove the cap and inhale gently through each nostril 2–3 times whenever you want a moment to pause. Pair with slow, deep breathing. For inhalation only; do not apply to skin. Aromatherapy is a complementary wellness practice, not a replacement for professional healthcare.',
    mechanism: null,
    packaging: 'Airtight 10 ml pocket inhaler with a secure cap.',
    scienceCards: []
  },
  rollon: {
    category: 'Menstrual Comfort Roll-On',
    eyebrow: 'WOMEN’S MENSTRUAL WELLNESS · PLANT-BASED ROLL-ON',
    rating: null,
    highlights: [
      'Designed around comfort throughout your cycle',
      'Wintergreen, Peppermint, Ginger, Lavender and Eucalyptus in a Sesame oil base',
      'Fast-absorbing, non-greasy roll-on',
      'Convenient 50 ml roll-on and 8 ml pocket size'
    ],
    botanicals: 'Wintergreen Oil (Gaultheria procumbens), Peppermint Oil (Mentha × piperita), Ginger (Zingiber officinale), Lavender Oil (Lavandula angustifolia) and Eucalyptus Oil (Eucalyptus globulus) in a Sesame Oil (Sesamum indicum) base.',
    usage: 'Roll gently around the belly button every morning on an empty stomach, as directed on the label. For external use only. Avoid eyes and broken skin. Consult a healthcare professional if your symptoms are severe, unusual or persistent.',
    mechanism: null,
    packaging: '50 ml roll-on bottle (and 8 ml travel size) with stainless steel rollerball. Barcode: 8 906132 540154.',
    scienceCards: []
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
    category: 'Ayurvedic Liver Wellness (500 ml)',
    eyebrow: 'CLASSICAL POLYHERBAL LIQUID · 11 AYURVEDIC BOTANICALS',
    rating: null,
    highlights: [
      'Eleven classical Ayurvedic botanicals in every 10 ml',
      'Made to complement a balanced diet and healthy lifestyle',
      'Bhumyamalaki, Kalmegh and Kutki lead the formulation',
      'Simple routine: 10 ml twice daily after meals'
    ],
    botanicals: 'Each 10 ml contains: Bhumyamalaki (Phyllanthus niruri) 500mg, Kalmegh (Andrographis paniculata) 400mg, Kutki (Picrorhiza kurroa) 400mg, Punarnava (Boerhavia diffusa) 300mg, Bhringraj (Eclipta alba) 300mg, Daruharidra (Berberis aristata) 200mg, Guduchi (Tinospora cordifolia) 200mg, Amla (Emblica officinalis) 200mg, Haritaki (Terminalia chebula) 200mg, Turmeric (Curcuma longa) 150mg, Black Pepper (Piper nigrum) 50mg.',
    usage: 'Adults: 10 ml (2 teaspoons) twice daily after meals. Shake well before use. Refrigerate after opening. Store away from direct sunlight. Not a replacement for medical assessment or prescribed treatment; consult a healthcare professional if you have concerns about liver function.',
    mechanism: null,
    packaging: '500 ml amber bottle with calibrated dosing cap. Barcode: 8 906132 540130.',
    scienceCards: []
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


  // 1. Identify active product from URL query
  const params = new URLSearchParams(window.location.search);
  const activeId = params.get('id') || 'gummies';
  const prod = [...PRODUCTS, ...EXTRA_PRODUCTS].find(p => p.id === activeId) || PRODUCTS[0];
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
      <div class="pdp-price-box pdp-pack">
        <span class="pdp-pack-k">Pack</span>
        <span class="pdp-pack-v">${prod.size}</span>
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

      <!-- Actions: an enquiry (the contact form opens with this product filled in) and the online store
           (a "coming soon" note until VITE_STORE_URL is set: src/app/store.js) -->
      <div class="pdp-actions-row">
        <a class="pill pdp-btn-add" href="contact.html?product=${prod.id}#contact-form"><i aria-hidden="true">↗</i><b>Enquire about this product</b></a>
        ${storeCta(prod.id, { cls: 'pdp-store' })}
      </div>
      <p class="pdp-partner">Retailer, pharmacy or distributor? <a href="contact.html?topic=retail#contact-form">Partner with us →</a></p>

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
            ${clinical.packagingTitle || 'Pack &amp; Storage'} <span class="pdp-acc-icon">+</span>
          </button>
          <div class="pdp-acc-body">
            <p>${clinical.packaging}</p>
          </div>
        </div>
      </div>
    `;
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

  // 9. More from TranzLife: the other products
  const crossGrid = $('#pdpCrossGrid');
  if (crossGrid) {
    const others = [...PRODUCTS, ...EXTRA_PRODUCTS].filter(p => p.id !== prod.id && SHOTS[p.id]);
    crossGrid.innerHTML = others.map(p => `
      <article class="pdp-mini-card">
        <div class="pdp-mini-media">
          <img src="${SHOTS[p.id]}" alt="${p.name}" loading="lazy" width="400" height="400">
        </div>
        <div class="pdp-mini-body">
          <h4>${p.name}</h4>
          <div class="pdp-mini-foot">
            <span class="size">${p.size}</span>
            <a href="product-details.html?id=${p.id}">View details →</a>
          </div>
        </div>
      </article>
    `).join('');
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

}

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductDetailsPage);
} else {
  initProductDetailsPage();
}
