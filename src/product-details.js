// TranzLife Biosciences - Product Details Page Interactive Controller
import './styles/main.css';
import { cart, thumbs } from './app/state.js';
import { PRODUCTS } from './data/products.js';
import { SHOTS, DESIGNS } from './features/products/product-images.js';
import { initCart, renderCart } from './features/cart/cart.js';
import { $, $$ } from './utils/dom.js';

// Deep formulation scientific metadata directly aligned with official TranzLife documentation
const CLINICAL_DETAILS = {
  gummies: {
    category: 'Respiratory Wellness · PulmoClear™ Formulation',
    eyebrow: 'NATURE-INSPIRED RESPIRATORY WELLNESS · BOTANICAL GUMMIES',
    rating: '4.9/5 (240+ reviews)',
    highlights: [
      'Convenient Gummy Format: Designed for convenient consumption as directed on the product label.',
      'Botanical-Inspired Formulation: Inspired by traditional plant-based wellness practices.',
      'Micronutrient Inclusion: Incorporating vitamins and minerals as specified in the final formulation.',
      'Quality-Focused Development: Emphasising ingredient specifications and formulation consistency.',
      'Modern Wellness Approach: Bringing botanical inspiration and contemporary product development together.'
    ],
    botanicals: 'Tulsi (Holy Basil), Vasaka, Dry Ginger (Sukku), Long Pepper (Thippili), Black Pepper, Black Turmeric (Karumanjal), Cumin (Jeera), Licorice Root, Small Onion Extract, Vitamin C, Vitamin D3 and Zinc.',
    usage: 'Use only as directed on the product label. This product should not be presented as a substitute for medical treatment or as a means of preventing or curing respiratory disease. Consult a qualified healthcare professional if you have a respiratory condition or take regular medication.',
    mechanism: 'Inspired by traditional botanical knowledge and contemporary product innovation, bringing together selected botanicals, vitamins and minerals in a convenient pectin gummy format designed for modern lifestyles.',
    packaging: 'High-barrier biophotonic container with tamper-evident seal. 60 Gummies. Barcode: 8 906132 540147. Mfg. Lic. No.: TN/AYU/24/1234.',
    scienceCards: [
      { title: 'The Power of Botanicals', text: 'Combines traditional Indian botanicals with essential micronutrients inspired by India’s rich botanical heritage.' },
      { title: 'Wellness Inspired by Nature', text: 'At TranzLife Biosciences, responsible innovation begins with understanding nature and advances through scientific knowledge.' },
      { title: 'Innovating Life Beyond Limits', text: 'Thoughtfully developed wellness products that align with contemporary consumer needs and strict quality expectations.' }
    ]
  },
  inhaler: {
    category: 'Aromatherapy & Sensory Wellness',
    eyebrow: 'A MOMENT OF CALM, WHEREVER LIFE TAKES YOU',
    rating: '4.9/5 (180+ reviews)',
    highlights: [
      'Convenient Wellness Companion: Compact, portable format designed to fit easily into everyday routines.',
      'Aromatic Sensory Experience: Distinctive aroma of natural botanical ingredients as part of a personal wellness ritual.',
      'A Moment to Pause: Incorporates brief pauses and mindful breathing into busy work and travel schedules.',
      'Inspired by Nature: Reflects TranzLife’s commitment to botanical ingredients and quality-conscious development.',
      'Designed for Modern Lifestyles: Practical format for people who value effortless daily self-care.'
    ],
    botanicals: 'Formulated with pure botanical essential oil aromas and natural plant extracts.',
    usage: 'Use according to product directions. Individual experiences with aromas may differ. Aromatherapy should be viewed as a complementary wellness practice rather than a replacement for professional mental healthcare.',
    mechanism: 'Volatile aromatic molecules engage olfactory sensory pathways to create a refreshing sensory pause, encouraging conscious breathing and mental clarity.',
    packaging: 'Airtight portable pocket inhaler preserving volatile aromatic compounds for daily on-the-go use.',
    scienceCards: [
      { title: 'Sensory Perception', text: 'Engages olfactory sensory pathways to provide a distinct, refreshing pause during demanding routines.' },
      { title: 'Mindful Breathing', text: 'Functions as a sensory anchor for conscious, deep breathing breaks during high-pressure work.' },
      { title: 'Responsible Wellness', text: 'Developed under TranzLife Biosciences’ quality-conscious standards for modern self-care.' }
    ]
  },
  rollon: {
    category: 'Women’s Menstrual Wellness & Comfort',
    eyebrow: 'EMBRACE EVERY CYCLE. CELEBRATE EVERY YOU.',
    rating: '5.0/5 (310+ reviews)',
    highlights: [
      'A Focus on Comfort: Positioned as a women’s wellness solution recognising the importance of well-being during menstruation.',
      'Convenience for Everyday Life: Designed with modern lifestyles in mind, fitting seamlessly into daily routines.',
      'Inspired by Thoughtful Innovation: Combining scientific understanding, formulation expertise, and botanical innovation.',
      'Quality-Conscious Development: Committed to responsible formulation practices, appropriate testing, and clear consumer info.'
    ],
    botanicals: 'Formulated with selected botanical oils and soothing plant extracts in a nourishing, non-greasy carrier base.',
    usage: 'Use only as directed on the product label. Positioned around menstrual wellness, comfort, and everyday self-care. Consult a qualified healthcare professional if symptoms are severe, unusual, or persistent.',
    mechanism: 'Thoughtfully formulated with botanical ingredients to deliver soothing topical comfort and sensory ease across localized abdominal and lower back areas.',
    packaging: 'Ergonomic roll-on applicator for smooth, mess-free topical glide. Travel-ready design.',
    scienceCards: [
      { title: 'Comfort & Well-Being', text: 'Recognising the physical changes throughout the menstrual cycle, supporting daily comfort and confidence.' },
      { title: 'Thoughtful Innovation', text: 'Uniting nature-inspired ingredients with contemporary formulation standards for women’s wellness.' },
      { title: 'Science-Led Care', text: 'TranzLife Biosciences is dedicated to accessible, quality-controlled self-care options.' }
    ]
  },
  reviva: {
    category: 'Natural Support for Diabetes & Vitality',
    eyebrow: '100% NATURAL PRODUCT · THE SPIRIT OF ORGANICS',
    rating: '4.9/5 (195+ reviews)',
    highlights: [
      'Supports healthy blood sugar levels and metabolic balance',
      'Improves peripheral circulation and strengthens nerve vitality',
      'Relieves localized pain, numbness, and neuropathic discomfort',
      'Targeted belly-button application for enhanced Ayurvedic transdermal uptake'
    ],
    botanicals: 'Pure Dill E.O (Anethum graveolens) and Eucalyptus E.O (Eucalyptus globulus) formulated in the Spirit of Organics.',
    usage: 'Roll gently around the belly button every morning on an empty stomach. Use daily for consistent vitality. Avoid contact with eyes.',
    mechanism: 'Bioactive terpenes stimulate metabolic micro-circulation and dermal sensory nerve pathways, supporting neuro-vascular tone and balanced glycemic responses.',
    packaging: '50 ml roll-on bottle. ISO 9001:2015 & GMP Certified. Barcode: 8 906132 540147.',
    scienceCards: [
      { title: 'Neuro-Vascular Support', text: 'Eucalyptus and Dill terpenes improve local nitric oxide release, enhancing microvascular capillary flow to peripheral nerves.' },
      { title: 'Ayurvedic Nabhi Therapy', text: 'Umbilical application targets central meridian points recognized in classical Ayurveda to nourish systemic vitality.' },
      { title: 'Metabolic Balance', text: 'Phytochemical compounds support healthy cellular glucose uptake and reduce oxidative stress in peripheral tissues.' }
    ]
  },
  liver: {
    category: 'Nature-Inspired Liver Wellness',
    eyebrow: 'NOURISH YOUR WELLNESS. SUPPORT YOUR LIVER. EMBRACE A HEALTHIER LIFESTYLE.',
    rating: '4.9/5 (210+ reviews)',
    highlights: [
      'Botanical Inspiration: Exploring the potential of plant-derived ingredients and traditional botanical knowledge.',
      'Quality-Focused Formulation: Prioritising ingredient identity, quality standards, and formulation consistency.',
      'Science-Led Innovation: Bringing together scientific understanding to meet evolving consumer wellness needs.',
      'Responsible Wellness: Encouraging informed lifestyle choices and a holistic approach to health and vitality.',
      'Preventive Wellness Vision: Exploring the intersection of nature, biotechnology, and scientific innovation.'
    ],
    botanicals: 'Selected traditional botanicals and plant extracts formulated according to quality-tested specifications.',
    usage: 'Use only as directed on the approved product label. Liver wellness products should not replace a balanced lifestyle, appropriate medical assessment, or prescribed treatment. Consult a qualified healthcare professional for persistent health concerns.',
    mechanism: 'Combines traditional botanical ingredients known for supporting internal balance, digestion, and metabolic vitality with modern quality-focused preparation.',
    packaging: 'High-barrier amber glass bottle protecting botanical phytonutrients. 100 ml.',
    scienceCards: [
      { title: 'Botanical Knowledge', text: 'Drawing on centuries of traditional botanical wisdom, verified through modern laboratory testing.' },
      { title: 'Holistic Liver Health', text: 'Supporting internal balance in synergy with balanced nutrition, hydration, and healthy lifestyle habits.' },
      { title: 'Responsible Innovation', text: 'Advancing life sciences and preventive wellness through transparent, evidence-based practices.' }
    ]
  },
  energy: {
    category: 'Herbal & Bioactive Oral Liquid (500 ml)',
    eyebrow: 'ENERGY BOOSTER™ · ENERGY • STAMINA • VITALITY',
    rating: 'New launch',
    highlights: [
      'Designed to complement daily energy, activity and general well-being',
      'Selected botanical and mineral-origin ingredients in one measured routine',
      'Ready-to-use oral liquid with a measuring device in the pack',
      'For adults aged 14 and above, as directed on the label'
    ],
    botanicals: 'Ruta graveolens (Q), Hecla lava (3X), Symphytum officinale (Q), Calcarea phosphorica (8X), Echinacea angustifolia (Q). Refer to the approved product specification for the complete composition and ingredient quantities.',
    usage: '7.5 ml twice daily, or as advised by a healthcare professional. Shake well if directed on the label. Use the measuring device supplied with the pack. Do not exceed the recommended serving.',
    mechanism: 'Energy Booster combines selected botanical and mineral-origin ingredients in a simple, measured daily liquid, made to complement an active lifestyle. How the full blend works has not been published, so it is positioned as everyday wellness support, not a medicine.',
    packaging: '500 ml bottle with a screw-on wooden-finish cap and measuring device.',
    scienceCards: [
      { title: 'Botanical Ingredients', text: 'Ruta graveolens, Symphytum officinale and Echinacea angustifolia, taken from the supplied formulation artwork.' },
      { title: 'Mineral-Origin Preparations', text: 'Hecla lava (3X) and Calcarea phosphorica (8X), mineral-origin homeopathic preparations.' },
      { title: 'Measured Daily Routine', text: 'A simple 7.5 ml serving twice a day, designed around an easy, consistent everyday habit.' }
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
        <span class="pdp-size">${prod.size}</span>
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
          <i aria-hidden="true">+</i><b>Add to bag</b>
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
      }
    });
    incBtn.addEventListener('click', () => {
      qty++;
      valSpan.textContent = qty;
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
