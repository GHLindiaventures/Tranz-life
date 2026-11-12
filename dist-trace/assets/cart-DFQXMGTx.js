(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const thumbs = {};
const cart = /* @__PURE__ */ new Map();
const state = { heroApi: null, storyApi: null, lenis: null, mol: null };
function initNavDropdowns() {
  if (window.__navDropdownsInitialized) return;
  window.__navDropdownsInitialized = true;
  const getDropdowns = () => document.querySelectorAll(".nav-drop");
  function closeAll() {
    getDropdowns().forEach((d) => {
      var _a;
      d.classList.remove("open");
      (_a = d.querySelector(".nav-drop-btn")) == null ? void 0 : _a.setAttribute("aria-expanded", "false");
    });
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-drop-btn");
    if (btn) {
      e.stopPropagation();
      const drop = btn.closest(".nav-drop");
      if (!drop) return;
      const wasOpen = drop.classList.contains("open");
      closeAll();
      if (!wasOpen) {
        drop.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
      return;
    }
    if (!e.target.closest(".nav-drop")) {
      closeAll();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAll();
    }
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavDropdowns);
} else {
  initNavDropdowns();
}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2400);
}
const PRODUCTS = [
  {
    id: "gummies",
    no: "01",
    short: "PulmoClear™",
    name: "PulmoClear™ Lung Booster Gummies",
    cat: "gummies",
    tag: "Lung Detox",
    price: 549,
    size: "60 Gummies",
    desc: "100% Ayurvedic Lung Booster & Craving Control Gummies for heavy smokers. Detoxifies, cleanses, and strengthens respiratory health with Vasaka, Tulsi, Mulethi, Vitamin C & Zinc. Natural Berry Flavour.",
    ing: ["Vasaka 100mg", "Tulsi 100mg", "Mulethi 100mg", "Turmeric 80mg", "Giloy 80mg", "Vitamin C 40mg", "Zinc 5mg"],
    model: "jar",
    fit: 1,
    gummy: ["#d2161f", "#ee7a12", "#f2a12c", "#97182c", "#e8551a"],
    barcode: "8906132540147",
    mfgLic: "TN/AYU/24/1234",
    dosage: "Adults: 2 gummies twice daily after meals"
  },
  {
    id: "inhaler",
    no: "02",
    short: "Craving Control™",
    name: "Craving Control™ Aromatherapy Inhaler",
    cat: "inhaler",
    tag: "Quit Smoking",
    price: 249,
    size: "10 ml Pocket Inhaler",
    desc: "100% natural, non-addictive aromatherapy inhaler for tobacco and smoking cessation. Pure therapeutic blend of Peppermint, Black Pepper, Tulsi, Lavender and Eucalyptus oils to curb nicotine cravings instantly on the go.",
    ing: ["Black Pepper Oil", "Peppermint Oil", "Tulsi Oil", "Lavender Oil", "Eucalyptus Oil"],
    model: "inhaler",
    fit: 1.16,
    dosage: "Inhale deeply through each nostril 2–3 times whenever cravings arise"
  },
  {
    id: "rollon",
    no: "03",
    short: "CycleRelief™",
    name: "CycleRelief™ Menstrual Comfort Roll-On",
    cat: "rollon",
    tag: "Period Relief",
    price: 399,
    size: "50 ml Roll-On (8 ml pocket)",
    desc: "100% natural plant-based formula that eases menstrual cramps, soothes abdominal discomfort, and relaxes tense pelvic muscles with pure Dill and Eucalyptus essential oils. Fast-absorbing and non-greasy.",
    ing: ["Dill E.O", "Eucalyptus E.O", "100% Plant-Based", "Non-Greasy Formula"],
    model: "rollon",
    fit: 1.06,
    barcode: "8906132540154",
    dosage: "Roll gently around the belly button every morning on an empty stomach"
  },
  {
    id: "reviva",
    no: "04",
    short: "Reviva™",
    name: "Reviva™ Diabetes & Vitality Roll-On",
    cat: "rollon",
    tag: "Blood Sugar & Vitality",
    price: 449,
    size: "50 ml Massage Roll-On",
    desc: "Natural support for diabetes, circulation, and vitality. Formulated with Dill and Eucalyptus in the Spirit of Organics to support healthy blood sugar levels, relieve neuropathic discomfort, and improve circulation.",
    ing: ["Dill E.O", "Eucalyptus E.O", "Blood Sugar Support", "Nerve Vitality"],
    model: "reviva",
    fit: 1.06,
    barcode: "8906132540147",
    dosage: "Roll gently around the belly button every morning on an empty stomach"
  },
  {
    id: "liver",
    no: "05",
    short: "LiverDetox™",
    name: "LiverDetox™ Polyherbal Concoction",
    cat: "liquid",
    tag: "Liver Booster",
    price: 649,
    size: "500 ml Classical Concoction",
    desc: "100% Ayurvedic Liver Booster. Detoxifies, protects, and rejuvenates liver parenchyma cells with 11 classical botanicals including Bhumyamalaki, Kalmegh, Kutki, Punarnava, and Daruharidra.",
    ing: ["Bhumyamalaki 500mg", "Kalmegh 400mg", "Kutki 400mg", "Punarnava 300mg", "Bhringraj 300mg", "Daruharidra 200mg"],
    model: "liver",
    fit: 1.14,
    barcode: "8906132540130",
    mfgLic: "TN/AYU/24/1234",
    dosage: "Adults: 10 ml (2 tsp) twice daily after meals"
  }
];
const inr = (n) => "₹" + n.toLocaleString("en-IN");
function renderCart() {
  const list = $("#dList");
  let total = 0, count = 0;
  if (!cart.size) {
    list.innerHTML = '<p class="d-empty">Your bag is empty. Add a product to get started.</p>';
  } else list.innerHTML = [...cart].map(([id, q]) => {
    const p = PRODUCTS.find((x) => x.id === id);
    total += p.price * q;
    count += q;
    return `<div class="d-item">${thumbs[id] ? `<img src="${thumbs[id]}" alt="">` : "<div></div>"}<div><b>${p.name}</b><small>${inr(p.price)}</small></div><div class="qty"><button data-id="${id}" data-d="-1" aria-label="Remove one">−</button>${q}<button data-id="${id}" data-d="1" aria-label="Add one">+</button></div></div>`;
  }).join("");
  $("#dTotal").textContent = inr(total);
  const c = $("#bagCount");
  c.textContent = count;
  c.classList.toggle("has", count > 0);
}
function addToCart(id, btn) {
  cart.set(id, (cart.get(id) || 0) + 1);
  renderCart();
  const bag = $("#bagBtn");
  bag.classList.remove("bump");
  void bag.offsetWidth;
  bag.classList.add("bump");
  const p = PRODUCTS.find((x) => x.id === id);
  toast(`${p.name} added to your bag`);
  if (btn && btn.classList.contains("add")) {
    const o = btn.textContent;
    btn.classList.add("ok");
    btn.textContent = "Added ✓";
    setTimeout(() => {
      btn.classList.remove("ok");
      btn.textContent = o;
    }, 1400);
  }
}
function openBag(open) {
  $("#drawer").classList.toggle("open", open);
  $("#scrim").classList.toggle("open", open);
  $("#drawer").setAttribute("aria-hidden", !open);
}
function initCart() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest(".add, .mini-add");
    if (a && a.dataset.id) addToCart(a.dataset.id, a);
    const q = e.target.closest(".qty button");
    if (q) {
      const id = q.dataset.id, n = (cart.get(id) || 0) + +q.dataset.d;
      if (n <= 0) cart.delete(id);
      else cart.set(id, n);
      renderCart();
    }
  });
  $("#bagBtn").addEventListener("click", () => openBag(true));
  $("#closeBag").addEventListener("click", () => openBag(false));
  $("#scrim").addEventListener("click", () => openBag(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") openBag(false);
  });
  $("#checkout").addEventListener("click", () => {
    if (!cart.size) return toast("Your bag is empty");
    toast("Checkout connects to your payment gateway at launch");
  });
}
export {
  $,
  PRODUCTS as P,
  $$ as a,
  initNavDropdowns as b,
  inr as c,
  cart as d,
  initCart as i,
  renderCart as r,
  state as s,
  thumbs as t
};
