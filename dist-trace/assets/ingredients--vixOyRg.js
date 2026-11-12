import { i as initCart, $ } from "./cart-DFQXMGTx.js";
/* empty css              */
const BOTANICAL_INGREDIENTS = [
  {
    id: "curcumin",
    name: "Curcumin (Turmeric Extract)",
    latin: "Curcuma longa",
    category: ["immunity", "liver"],
    part: "Standardized Rhizome Extract",
    origin: "Certified Cultivation, India",
    compound: "Curcuminoids (Curcumin C3 Complex)",
    target: "Antioxidant Defense & Anti-Inflammatory Support",
    product: "PulmoClear™ Gummies & LiverDetox™",
    productId: "gummies",
    desc: "A powerful natural anti-inflammatory and antioxidant. Protects lung and liver cells from oxidative stress, neutralizes free radicals, and strengthens the body's natural defenses."
  },
  {
    id: "peppermint",
    name: "Peppermint Oil",
    latin: "Mentha × piperita",
    category: ["respiratory", "stress"],
    part: "Steam-Distilled Leaf Oil",
    origin: "Pure Steam Distillation, India",
    compound: "Natural Menthol",
    target: "Craving Reduction & Airway Sensory Refreshment",
    product: "BreatheFree™ & Craving Control™ Inhalers",
    productId: "inhaler",
    desc: "Pure therapeutic essential oil that reduces nicotine cravings, refreshes the senses, and opens airways to support an easy, natural smoke-free journey."
  },
  {
    id: "eucalyptus",
    name: "Eucalyptus Oil",
    latin: "Eucalyptus globulus",
    category: ["respiratory"],
    part: "Pure Leaf Essential Oil (E.O)",
    origin: "Steam-Distilled, Nilgiri Foothills",
    compound: "1,8-Cineole",
    target: "Airway Clearing & Muscle Comfort",
    product: "BreatheFree™ Inhaler, CycleRelief™ & Reviva™",
    productId: "inhaler",
    desc: "Opens up airways and supports easy breathing. In topical roll-on formulations (CycleRelief™ & Reviva™), it eases discomfort and relaxes tense muscles."
  },
  {
    id: "tulsi",
    name: "Tulsi (Holy Basil)",
    latin: "Ocimum sanctum",
    category: ["respiratory", "immunity"],
    part: "Leaf Extract & Pure Essential Oil",
    origin: "Organic Ayurvedic Cultivation, India",
    compound: "Eugenol",
    target: "Lung Detoxification & Natural Immunity",
    product: "PulmoClear™ Gummies & BreatheFree™ Inhaler",
    productId: "gummies",
    desc: "Holy Basil purifies, detoxifies, and supports respiratory health naturally. Strengthens the body's natural defenses, clears congestion, and protects lung tissue from oxidative stress."
  },
  {
    id: "ashwagandha",
    name: "Ashwagandha",
    latin: "Withania somnifera",
    category: ["stress", "immunity"],
    part: "Standardized Root Extract",
    origin: "Ayurvedic Cultivation, India",
    compound: "Withanolides (Root Extract)",
    target: "Stress Reduction, Calm Mind & Vitality",
    product: "PulmoClear™ Craving Control Gummies & Rasayana Elite™",
    productId: "gummies",
    desc: "Premier adaptogenic herb that reduces stress, calms the mind, and relieves anxiety and irritability, supporting stamina, inner balance, and healthy living."
  },
  {
    id: "kutki",
    name: "Kutki",
    latin: "Picrorhiza kurroa",
    category: ["liver"],
    part: "Standardized Rhizome Extract",
    origin: "Himalayan Herbal Reserves",
    compound: "Kutkin & Picrosides (400 mg)",
    target: "Liver Detoxification & Hepatoprotection",
    product: "LiverDetox™ Polyherbal Concoction",
    productId: "liver",
    desc: "Classical Ayurvedic hepatoprotective herb. Flushes out toxins, shields liver cells from oxidative stress, and rejuvenates natural liver function."
  },
  {
    id: "kalmegh",
    name: "Kalmegh",
    latin: "Andrographis paniculata",
    category: ["liver"],
    part: "Whole Plant Extract",
    origin: "Herbal Reserves, India",
    compound: "Andrographolide (400 mg)",
    target: "Liver Cleansing & Digestive Balance",
    product: "LiverDetox™ Polyherbal Concoction",
    productId: "liver",
    desc: "Known as the King of Bitters, Kalmegh promotes natural liver cleansing, protects hepatic tissues, aids healthy digestion, and supports overall vitality."
  },
  {
    id: "amla",
    name: "Amla (Amalaki)",
    latin: "Emblica officinalis",
    category: ["immunity", "liver"],
    part: "Fruit Extract & Rasayana Concentrate",
    origin: "Organic Ayurvedic Groves, India",
    compound: "Natural Vitamin C & Polyphenols (200 mg)",
    target: "Immunity Boost, Antioxidant Defense & Liver Support",
    product: "LiverDetox™ Concoction & Rasayana Elite™",
    productId: "liver",
    desc: "Revered Ayurvedic Rasayana exceptionally rich in natural Vitamin C and bio-antioxidants. Combats oxidative stress, strengthens immunity, and supports liver health."
  }
];
function initIngredientsPage() {
  try {
    initCart();
  } catch (e) {
    console.warn("Cart initialization deferred:", e);
  }
  const nav = $("#nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const btn = $("#dockMenu");
  const menu = $("#menu");
  const menuX = $("#menuX");
  function setMenuOpen(open) {
    if (!menu) return;
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", !open);
    if (btn) {
      btn.setAttribute("aria-expanded", open);
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    document.documentElement.classList.toggle("menu-open", open);
  }
  if (btn) btn.addEventListener("click", () => setMenuOpen(!menu.classList.contains("open")));
  if (menuX) menuX.addEventListener("click", () => setMenuOpen(false));
  if (menu) {
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenuOpen(false);
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && menu.classList.contains("open")) {
      setMenuOpen(false);
    }
  });
  const bagBtn = $("#bagBtn");
  const drawer = $("#drawer");
  const scrim = $("#scrim");
  const closeBag = $("#closeBag");
  function setDrawerOpen(open) {
    if (!drawer || !scrim) return;
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", !open);
    scrim.classList.toggle("open", open);
    document.documentElement.classList.toggle("bag-open", open);
  }
  if (bagBtn) bagBtn.addEventListener("click", () => setDrawerOpen(true));
  if (closeBag) closeBag.addEventListener("click", () => setDrawerOpen(false));
  if (scrim) scrim.addEventListener("click", () => setDrawerOpen(false));
  let currentFilter = "all";
  let searchQuery = "";
  const gridContainer = $("#ingGrid");
  const searchInput = $("#ingSearch");
  const filterBtns = document.querySelectorAll(".ing-filter-btn");
  function renderGrid() {
    if (!gridContainer) return;
    const filtered = BOTANICAL_INGREDIENTS.filter((item) => {
      const matchCat = currentFilter === "all" || (Array.isArray(item.category) ? item.category.includes(currentFilter) : item.category === currentFilter);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || item.name.toLowerCase().includes(q) || item.latin.toLowerCase().includes(q) || item.compound.toLowerCase().includes(q) || item.target.toLowerCase().includes(q) || item.origin.toLowerCase().includes(q) || item.product.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <p style="font-size: 1.2rem; color: var(--muted); margin-bottom: 12px;">No botanical ingredients found matching "${searchQuery}".</p>
          <button class="pill" id="clearFilterBtn" type="button"><b>Reset Search</b></button>
        </div>
      `;
      const clearBtn = $("#clearFilterBtn");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          currentFilter = "all";
          searchQuery = "";
          if (searchInput) searchInput.value = "";
          filterBtns.forEach((b) => b.classList.toggle("active", b.dataset.category === "all"));
          renderGrid();
        });
      }
      return;
    }
    gridContainer.innerHTML = filtered.map((item) => `
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
            Explore ${item.product.split("&")[0].trim()} →
          </a>
        </div>
      </article>
    `).join("");
  }
  filterBtns.forEach((btn2) => {
    btn2.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn2.classList.add("active");
      currentFilter = btn2.dataset.category || "all";
      renderGrid();
    });
  });
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      if (searchQuery.trim().length > 0 && currentFilter !== "all") {
        currentFilter = "all";
        filterBtns.forEach((b) => b.classList.toggle("active", b.dataset.category === "all"));
      }
      renderGrid();
    });
  }
  renderGrid();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initIngredientsPage);
} else {
  initIngredientsPage();
}
