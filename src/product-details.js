// TranzLife Biosciences - Product Details Page Interactive Controller
import './features/footer/night-footer.js';
import { thumbs } from './app/state.js';
import { storeCta } from './app/store.js';
import { PRODUCTS } from './data/products.js';
import { SHOTS, DESIGNS } from './features/products/product-images.js';
import { jarLayer } from './features/products/jar-layer.js';
import { DETAILS } from './products-page/data/product-details.js';
import { STORY } from './products-page/data/product-story.js';
import './features/navigation/dropdown.js';
import './components/page-scrollbar.js';
import './components/chat-loader.js';
import { $, $$ } from './utils/dom.js';
import { initBeforeAfter } from './features/compare/before-after.js';
import { initAccountMenu } from './features/account/account-menu.js';

// Product page content per product: from the client's product sheet (Nov 2026): key benefits, ingredients as on the
// pack, directions, cautions, storage and pack details. Disease claims printed on some packs are left out.
const CLINICAL_DETAILS = {
  gummies: {
    category: 'Respiratory Wellness Gummies',
    eyebrow: 'Respiratory Wellness · PulmoClear™ formulation',
    rating: null,
    highlights: [
      'Supports respiratory wellness and everyday health',
      'Traditional Ayurvedic botanicals with Vitamin C, Vitamin D3 and Zinc',
      'Antioxidant support and support for natural immune function',
      'Natural berry-flavoured gummy, 60 per pack'
    ],
    botanicals: 'Botanical ingredients: Jeera (Cumin), Karumanjal (Black Turmeric), Sukku (Dry Ginger), Thippili (Long Pepper), Black Pepper, Tulsi, Vasaka, Licorice Root and Small Onion Extract. Added nutrients: Vitamin C, Vitamin D3 and Zinc.',
    usage: 'Follow the serving size and frequency on the approved product pack. Do not exceed the recommended daily intake. Consult a healthcare professional if you are pregnant, breastfeeding, have a respiratory condition or take regular medication.',
    mechanism: null,
    packaging: '60 gummies per pack, natural berry flavour. Tamper-evident container. Barcode: 8 906132 540147.',
    scienceCards: []
  },
  inhaler: {
    category: 'Aromatherapy · Smoke-Free Support',
    eyebrow: 'ESSENTIAL OIL AROMATHERAPY INHALER · SIX OILS',
    rating: null,
    highlights: [
      'Helps manage smoking cravings, on your way to a smoke-free lifestyle',
      'Promotes relaxation and emotional balance; helps manage stress and irritability',
      'Supports a refreshing breathing experience',
      'Compact, pocket-sized and discreet; marketed as a non-addictive formulation'
    ],
    botanicals: 'Peppermint Oil, Eucalyptus Oil, Lavender Oil, Lemon Oil, Black Pepper Oil and Tulsi Oil.',
    usage: '1. Gently remove the protective cap. 2. Place the inhaler near each nostril. 3. Take slow, deep inhalations. 4. Repeat whenever you experience cravings or feel stressed. For inhalation only.',
    mechanism: null,
    packaging: 'Compact, pocket-sized inhaler with a protective cap. Easy to carry while travelling or working.',
    scienceCards: []
  },
  rollon: {
    category: 'Menstrual Comfort Roll-On',
    eyebrow: 'WOMEN’S MENSTRUAL COMFORT · PLANT-BASED ROLL-ON',
    rating: null,
    activesTitle: 'Ingredients (as on the pack)',
    packagingTitle: 'Cautions, Storage & Pack',
    highlights: [
      'Designed to support menstrual comfort routines',
      'A soothing topical application that supports relaxation and personal comfort',
      'Easy-to-apply, non-greasy roll-on',
      'Compact 8 ml pack, portable and convenient to carry'
    ],
    botanicals: 'Wintergreen Oil, Peppermint Oil, Ginger Essential Oil, Lavender Essential Oil, Eucalyptus Oil and Sesame Oil.',
    usage: 'Do a patch test before first use. Roll onto the lower abdomen, lower back or inner wrists and massage gently until absorbed. Reapply 2–4 times daily, or as needed, during the menstrual cycle.',
    mechanism: null,
    packaging: 'For external use only. Avoid contact with eyes, mucous membranes and broken or irritated skin. Do not use on children. Discontinue use if irritation occurs. Keep out of reach of children. Store in a cool, dry place away from direct sunlight and keep the container tightly closed. 8 ml roll-on. Plant-based, not tested on animals, recyclable packaging. ISO 9001:2015, GMP certified, made in India. Barcode: 8 906132 540154.',
    scienceCards: []
  },
  reviva: {
    category: 'Botanical Massage Roll-On',
    eyebrow: 'BOTANICAL MASSAGE ROLL-ON · DAILY SELF-CARE',
    rating: null,
    pills: false,
    activesTitle: 'Ingredients',
    packagingTitle: 'Pack & Precautions',
    highlights: [
      'A refreshing topical application with Dill and Eucalyptus essential oils',
      'Supports a simple daily self-care routine',
      'Convenient massage roll-on: easy and direct, no preparation needed',
      'Portable, travel-friendly 50 ml roll-on'
    ],
    botanicals: 'Dill Essential Oil and Eucalyptus Essential Oil.',
    usage: 'Roll gently around the belly button every morning on an empty stomach and massage gently. Apply to intact skin only, follow the pack for how often to use it, and wash your hands after use.',
    mechanism: null,
    packaging: 'Massage roll-on, 50 ml. For external use only: avoid the eyes, wounds and irritated skin. Keep out of reach of children. ISO 9001:2015 and GMP certified.',
    scienceCards: []
  },
  liver: {
    category: 'Polyherbal Concoction · Liver Wellness (500 ml)',
    eyebrow: 'POLYHERBAL CONCOCTION · 11 AYURVEDIC BOTANICALS',
    rating: null,
    packagingTitle: 'Cautions, Storage & Pack',
    highlights: [
      'Supports normal liver function and natural metabolic processes',
      'Antioxidant support from traditional botanicals',
      'Supports digestive health and appetite',
      'Simple routine: 10 ml twice daily after meals'
    ],
    botanicals: 'Composition per 10 ml: Bhumyamalaki (Phyllanthus niruri) 500 mg, Kalmegh (Andrographis paniculata) 400 mg, Kutki (Picrorhiza kurroa) 400 mg, Punarnava (Boerhaavia diffusa) 300 mg, Bhringraj (Eclipta alba) 300 mg, Daruharidra (Berberis aristata) 200 mg, Guduchi (Tinospora cordifolia) 200 mg, Amla (Emblica officinalis) 200 mg, Haritaki (Terminalia chebula) 200 mg, Turmeric (Curcuma longa) 150 mg, Piper nigrum (Black Pepper) 50 mg, Excipients q.s.',
    usage: 'Adults: 10 ml (2 teaspoons) twice daily after meals, using a measuring cup. Shake well before use. Follow the dosage and duration on the approved label or as advised by a healthcare professional.',
    mechanism: null,
    packaging: 'Not recommended for pregnant or lactating women. Consult your physician if you are under medication. Store in a cool, dry place away from direct sunlight; refrigerate after opening. 500 ml, mixed flavour. 100% Ayurvedic, natural ingredients, no added colours, no added sugar. Ayurvedic proprietary medicine, GMP certified, made in India. Barcode: 8 906132 540130.',
    scienceCards: []
  },
  energy: {
    category: 'Energy & Everyday Vitality',
    eyebrow: 'HERBAL & BIOACTIVE WELLNESS FORMULATION · ORAL LIQUID',
    rating: null,
    pills: false,
    activesTitle: 'Key Ingredients',
    packagingTitle: 'Pack & Precautions',
    highlights: [
      'Supports everyday energy and stamina',
      'Promotes overall vitality and well-being',
      'Supports hormonal wellness and healthy immune function',
      'Easy-to-measure dosage: 7.5 ml twice daily, 500 ml pack'
    ],
    botanicals: 'Ruta graveolens (Q), Hecla lava (3X), Symphytum officinale (Q), Calcarea phosphorica (8X) and Echinacea angustifolia (Q).',
    usage: 'Suggested dosage: 7.5 ml twice daily, or as recommended by a healthcare professional. Use the measuring device supplied with the pack and follow the approved product label.',
    mechanism: null,
    packaging: 'Oral liquid, 500 ml, with a measuring device. Do not exceed the recommended serving. Consult a healthcare professional before use if pregnant, breastfeeding, taking medication or managing a health condition. Keep out of reach of children.',
    scienceCards: []
  }
};

let current3dViewer = null;

/**
 * Sets up the interactive 3D WebGL rotating product canvas
 */
function setup3DViewer(canvas, prod, index) {
  if (!canvas) return null;

  if (current3dViewer) {
    current3dViewer.destroy();
    current3dViewer = null;
  }

  const L = jarLayer(canvas);
  const jar = L.jar(prod, index);
  if (jar && jar.G) {
    jar.G.userData.shadowA = 0.55;
  }

  let isDragging = false;
  let prevX = 0, prevY = 0;
  let targetRotY = -0.32, currentRotY = -0.32;
  let targetRotX = 0.05, currentRotX = 0.05;
  let rafId = 0;

  function onPointerDown(e) {
    isDragging = true;
    prevX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    prevY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const badge = $('#pdp3dBadge');
    if (badge) badge.classList.add('hidden');
  }

  function onPointerMove(e) {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const dx = clientX - prevX;
    const dy = clientY - prevY;
    prevX = clientX;
    prevY = clientY;
    targetRotY += dx * 0.01;
    targetRotX += dy * 0.007;
    targetRotX = Math.max(-0.45, Math.min(0.45, targetRotX));
  }

  function onPointerUp() {
    isDragging = false;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  function resize() {
    if (!canvas) return;
    L.resize();
    if (jar && jar.G) {
      L.place(jar.G, L.W / 2, L.H / 2);
      L.size(jar, L.H * 0.68);
    }
  }
  resize();
  window.addEventListener('resize', resize);

  let lastTime = performance.now();
  function render(time) {
    rafId = requestAnimationFrame(render);
    const dt = Math.min(0.1, (time - lastTime) / 1000);
    lastTime = time;

    // Smooth continuous auto-rotation when idle
    if (!isDragging) {
      targetRotY += dt * 0.45;
    }

    currentRotY += (targetRotY - currentRotY) * 0.08;
    currentRotX += (targetRotX - currentRotX) * 0.08;

    if (jar && jar.G) {
      jar.G.rotation.y = currentRotY;
      jar.G.rotation.x = currentRotX;
      // Gentle floating bob
      jar.G.position.y = Math.sin(time * 0.0016) * 0.12;
    }

    L.renderer.render(L.scene, L.cam);
  }
  rafId = requestAnimationFrame(render);

  current3dViewer = {
    destroy() {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', resize);
      if (jar && jar.G) L.scene.remove(jar.G);
    }
  };
  return current3dViewer;
}

/**
 * Main Product Details Page Render Controller
 */
function renderProductDetails(productId) {
  Object.assign(thumbs, SHOTS);

  const prodList = PRODUCTS;
  let prodIndex = prodList.findIndex(p => p.id === productId);
  if (prodIndex === -1) prodIndex = 0;
  const prod = prodList[prodIndex];
  const clinical = CLINICAL_DETAILS[prod.id] || CLINICAL_DETAILS.gummies;
  const story = STORY[prodIndex] || { t: [prod.name, ''], d: prod.desc, c: '#4a825e' };
  const detail = DETAILS[prod.id] || null;

  // 1. Update Document Title
  document.title = `${prod.name} | TranzLife Biosciences`;

  // 2. Render 5-Formulation Switcher Bar
  const switcherEl = $('#pdpSwitcher');
  if (switcherEl) {
    switcherEl.innerHTML = PRODUCTS.map((p, i) => `
      <a class="pdp-switch-pill ${p.id === prod.id ? 'active' : ''}" data-id="${p.id}" href="?id=${p.id}">
        <span class="pdp-switch-no">0${i + 1}</span>
        <span class="pdp-switch-name">${p.short || p.name}</span>
      </a>
    `).join('');

    switcherEl.querySelectorAll('.pdp-switch-pill').forEach(pill => {
      pill.addEventListener('click', e => {
        e.preventDefault();
        const id = pill.dataset.id;
        try {
          history.pushState(null, '', `?id=${id}`);
        } catch (_) {}
        renderProductDetails(id);
      });
    });
  }

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

  // 4. Setup 3D Canvas & Gallery Tabs
  const canvas = $('#pdp3dCanvas');
  const mainImg = $('#pdpMainImg');
  const badge3d = $('#pdp3dBadge');
  const tagEl = $('#pdpTag');
  if (tagEl) tagEl.textContent = prod.tag;

  const studioImg = SHOTS[prod.id];
  const designImg = DESIGNS[prod.id];

  if (canvas) {
    canvas.hidden = false;
    setup3DViewer(canvas, prod, prodIndex);
  }
  if (mainImg) mainImg.hidden = true;
  if (badge3d) badge3d.classList.remove('hidden');

  // Wire Gallery Tabs
  const tabBtns = $$('.pdp-tab-btn');
  tabBtns.forEach(btn => {
    btn.classList.toggle('on', btn.dataset.view === '3d');
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.toggle('on', b === btn));
      const mode = btn.dataset.view;
      if (mode === '3d') {
        if (canvas) canvas.hidden = false;
        if (mainImg) mainImg.hidden = true;
        if (badge3d) badge3d.classList.remove('hidden');
      } else {
        if (canvas) canvas.hidden = true;
        if (badge3d) badge3d.classList.add('hidden');
        if (mainImg) {
          mainImg.hidden = false;
          mainImg.src = mode === 'design' && designImg ? designImg : studioImg;
        }
      }
    };
  });

  // Guarantee Pills
  const pillsEl = $('.pdp-guarantee-pills');
  if (pillsEl && clinical.pills === false) pillsEl.hidden = true;

  // 5. Render Rich Product Info & Story Copy
  const infoEl = $('#pdpInfo');
  if (infoEl) {
    const counterStr = `0${prodIndex + 1} / 0${PRODUCTS.length}`;
    const superTitle = story.t ? story.t.join(' ') : prod.name;
    const eyebrowText = detail ? detail.eyebrow : clinical.eyebrow;
    const taglineText = detail ? detail.tagline : 'Breathe Well. Live Better. Embrace Every Breath.';
    const introText = detail && detail.intro ? detail.intro[0] : prod.desc;
    const botanicalList = detail && detail.list ? detail.list : [];

    infoEl.innerHTML = `
      <div class="pdp-meta-row">
        <p class="eyebrow drawn">${eyebrowText}</p>
        <span class="pdp-counter">${counterStr}</span>
      </div>

      <h1 class="pdp-super-title">${superTitle}</h1>
      <p class="pdp-tagline">${taglineText}</p>
      <p class="pdp-story-desc">${introText}</p>

      <div class="pdp-price-box pdp-pack">
        <span class="pdp-pack-k">Pack</span>
        <span class="pdp-pack-v">${prod.size}</span>
        <span class="pdp-pack-k" style="margin-left:auto">Formulation</span>
        <span class="pdp-pack-v">${prod.tag}</span>
      </div>

      <!-- Highlights -->
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

      <!-- Botanical Ingredients Grid -->
      ${botanicalList.length ? `
        <div class="pdp-botanical-section">
          <p class="eyebrow drawn" style="font-size:11px; margin-bottom:8px;">${detail.listTitle || 'Key Botanical Actives'}</p>
          <div class="pdp-botanical-cards">
            ${botanicalList.slice(0, 6).map(([herb, benefit]) => `
              <div class="pdp-herb-chip">
                <b>${herb}</b>
                <span>${benefit}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="pdp-actions-row">
        <a class="pill pdp-btn-add" href="contact.html?product=${prod.id}#contact-form"><i aria-hidden="true">↗</i><b>Enquire about this product</b></a>
        ${storeCta(prod.id, { cls: 'pdp-store' })}
      </div>
      <p class="pdp-partner">Retailer, pharmacy or distributor? <a href="contact.html?topic=retail#contact-form">Partner with us →</a></p>

      <!-- Accordion Specifications -->
      <div class="pdp-accordions">
        <div class="pdp-acc-item open">
          <button class="pdp-acc-header" type="button">
            ${clinical.activesTitle || 'Full Botanical Composition'} <span class="pdp-acc-icon">+</span>
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
            ${clinical.packagingTitle || 'Pack & Packaging'} <span class="pdp-acc-icon">+</span>
          </button>
          <div class="pdp-acc-body">
            <p>${clinical.packaging}</p>
          </div>
        </div>
      </div>
    `;

    // Accordions Toggle
    infoEl.querySelectorAll('.pdp-acc-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.closest('.pdp-acc-item');
        item.classList.toggle('open');
      });
    });
  }

  // Before / After comparison
  try { initBeforeAfter($('#pdpCompare'), prod.id); } catch (e) { console.warn('Comparison unavailable:', e); }

  // Cross Grid
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
            <span class="size">${p.size}</span>
            <a href="?id=${p.id}">View 3D details →</a>
          </div>
        </div>
      </article>
    `).join('');
  }
}

function initProductDetailsPage() {
  const params = new URLSearchParams(window.location.search);
  const activeId = params.get('id') || 'gummies';
  renderProductDetails(activeId);

  // Navigation scroll header
  const nav = $('#nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Account icon (login / My Orders) in the top bar
  initAccountMenu();

  // Mobile navigation
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

  window.addEventListener('popstate', () => {
    const p = new URLSearchParams(window.location.search);
    renderProductDetails(p.get('id') || 'gummies');
  });
}

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductDetailsPage);
} else {
  initProductDetailsPage();
}
