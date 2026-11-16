import { a as $$, $, s as state } from "./cart-DFQXMGTx.js";
import { c as clamp, S as ScrollTrigger, r as reduce, g as gsapWithCSS } from "./jar-layer-CvE_SCn1.js";
const MOTION = {
  dur: {
    base: 0.6,
    slow: 1
  },
  ease: {
    entrance: "power3.out",
    // Lenis / JS curve matching expo.out
    easedScroll: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  },
  stagger: {
    fast: 0.06,
    base: 0.08
  },
  dist: {
    md: 24
  }
};
const RX = [
  {
    t: "Ethical sourcing",
    a: "Seed",
    b: "Sun & water",
    p: "Botanical",
    d: "Botanicals come from partner farms and wild-harvest collectives. Every lot is logged, so it can be traced back to the field it grew in.",
    s: ["Farm-traceable lots", "Seasonal harvest"]
  },
  {
    t: "Gentle extraction",
    a: "Botanical",
    b: "CO₂ solvent",
    p: "Extract",
    d: "Low-temperature water and CO₂ extraction protect heat-sensitive plant compounds and essential oils.",
    s: ["Low-heat process", "Standardised extracts"]
  },
  {
    t: "Formulation",
    a: "Extract",
    b: "Carrier base",
    p: "Formula",
    d: "Our formulators set plant actives at measured doses, then shape them into the right format: a gummy, a roll-on oil, an inhaler or a liquid.",
    s: ["Measured doses", "Plant-based bases"]
  },
  {
    t: "Batch testing",
    a: "Formula",
    b: "Assay markers",
    p: "Verified blend",
    d: "Each batch is checked for active content, heavy metals and microbial safety before it moves on to the next stage.",
    s: ["Actives assay", "Heavy metals", "Microbial"]
  },
  {
    t: "Stability & sensory",
    a: "Verified blend",
    b: "Antioxidant shield",
    p: "Stable formula",
    d: "Samples are aged and tasted so texture, scent and potency hold up until the last drop or gummy.",
    s: ["Shelf-life study", "Taste panel"]
  },
  {
    t: "Sealed & shipped",
    a: "Stable formula",
    b: "Batch-coded seal",
    p: "TranzLife product",
    d: "Every pack is sealed, batch-coded and boxed, with recycled kraft and biodegradable materials wherever we can, then shipped to your door or nearest store.",
    s: ["Batch-coded", "Recycled kraft sleeve"]
  }
];
const NSTAGE = RX.length;
const LAYOUT = { pages: [], tops: [], hs: [], vh: window.innerHeight, cur: -1, theme: "green" };
const GROUND = { green: "#112117", cream: "#eee3c6" };
function scrollToY(y) {
  if (state.lenis) {
    state.lenis.scrollTo(Math.max(0, y), {
      duration: 1.2,
      easing: MOTION.ease.easedScroll
    });
    return;
  }
  window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
}
function scrollToPage(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const pages = LAYOUT.pages || [];
  const i = pages.findIndex((p) => p.id === id);
  if (i >= 0 && LAYOUT.tops && LAYOUT.tops[i] !== void 0) {
    scrollToY(LAYOUT.tops[i]);
    return;
  }
  const r = el.getBoundingClientRect();
  scrollToY(r.top + window.scrollY);
}
function pageProgress(id) {
  const el = document.getElementById(id);
  if (!el) return { p: 0, visible: false };
  const r = el.getBoundingClientRect(), vh = window.innerHeight;
  return { p: clamp(-r.top / Math.max(1, r.height - vh), 0, 1), visible: r.top < vh && r.bottom > 0 };
}
function initPages() {
  const pages = $$("main > .page");
  LAYOUT.pages = pages;
  const last = (p) => p.id === "process" ? "green" : p.dataset.theme;
  const ring = document.querySelector(".dm-ring");
  let docH = document.documentElement.scrollHeight, lastSp = "";
  function measure() {
    LAYOUT.vh = window.innerHeight;
    docH = document.documentElement.scrollHeight;
    LAYOUT.hs = pages.map((p) => p.offsetHeight);
    LAYOUT.tops = pages.map((p) => p.offsetTop);
    pages.forEach((p, i) => {
      if (i && !p.querySelector(":scope > .show, :scope > .pin")) p.style.setProperty("--prev", GROUND[last(pages[i - 1])] + " ");
    });
    update();
    if (ScrollTrigger && ScrollTrigger.refresh) ScrollTrigger.refresh();
  }
  function update() {
    const y = window.scrollY;
    let cur = 0;
    pages.forEach((p, i) => {
      if (LAYOUT.tops[i] <= y + 72) cur = i;
    });
    const id = pages[cur].id;
    let theme = pages[cur].dataset.theme;
    if (cur !== LAYOUT.cur || theme !== LAYOUT.theme) {
      LAYOUT.cur = cur;
      LAYOUT.theme = theme;
      window.dispatchEvent(new CustomEvent("tl:page", { detail: { id, theme, index: cur, count: pages.length } }));
    }
    const sp = clamp(y / Math.max(1, docH - LAYOUT.vh), 0, 1).toFixed(3);
    if (sp !== lastSp && ring) {
      lastSp = sp;
      ring.style.setProperty("--sp", sp);
    }
  }
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }, { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(measure));
  if ("ResizeObserver" in window) {
    let t;
    new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(measure, 80);
    }).observe($("main"));
  }
  window.addEventListener("tl:reactor-theme", () => {
    if (pages[LAYOUT.cur] && pages[LAYOUT.cur].id === "process") update();
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    scrollToPage(id);
  });
  window.addEventListener("tl:goStage", (e) => {
    const i = pages.findIndex((p) => p.id === "process");
    if (i < 0) return;
    scrollToY(LAYOUT.tops[i] + (e.detail + 0.32) / NSTAGE * (LAYOUT.hs[i] - LAYOUT.vh));
  });
  measure();
  window.addEventListener("load", measure);
  if (document.fonts) document.fonts.ready.then(measure);
  return { measure, update };
}
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((ch) => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (!w.trim()) {
            frag.appendChild(document.createTextNode(w));
          } else {
            const o = document.createElement("span");
            o.className = "wl";
            const i = document.createElement("span");
            i.className = "w";
            i.textContent = w;
            o.appendChild(i);
            frag.appendChild(o);
          }
        });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1 && !ch.classList.contains("wl")) {
        walk(ch);
      }
    });
  };
  walk(el);
}
function animateCountUp(el, target, duration = 1.2) {
  const obj = { val: 0 };
  gsapWithCSS.to(obj, {
    val: target,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = Math.round(obj.val);
    }
  });
}
function initScroll() {
  if (!ScrollTrigger) return;
  if (reduce) {
    $$(".reveal").forEach((el) => gsapWithCSS.fromTo(el, { opacity: 0 }, { opacity: 1, duration: MOTION.dur.base }));
    $$(".eyebrow").forEach((el) => el.classList.add("drawn"));
    return;
  }
  $$(".rv-words").forEach((el) => {
    splitWords(el);
    gsapWithCSS.from($$(".w", el), {
      yPercent: 110,
      duration: MOTION.dur.slow,
      stagger: MOTION.stagger.fast,
      ease: MOTION.ease.entrance,
      scrollTrigger: { trigger: el, start: "top 86%", once: true }
    });
  });
  $$(".eyebrow").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        el.classList.add("drawn");
        gsapWithCSS.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: MOTION.dur.base, ease: MOTION.ease.entrance });
      }
    });
  });
  $$(".reveal").forEach((el) => {
    if (el.classList.contains("eyebrow")) return;
    gsapWithCSS.from(el, {
      opacity: 0,
      y: MOTION.dist.md,
      duration: MOTION.dur.base,
      ease: MOTION.ease.entrance,
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });
  const shopGrid = $("#grid");
  if (shopGrid) {
    ScrollTrigger.create({
      trigger: shopGrid,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsapWithCSS.fromTo(
          ".pc",
          { opacity: 0, y: 36, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, stagger: MOTION.stagger.base, duration: MOTION.dur.base, ease: MOTION.ease.entrance }
        );
      }
    });
  }
  const benTable = $(".ben-table");
  if (benTable) {
    ScrollTrigger.create({
      trigger: benTable,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsapWithCSS.fromTo(
          ".ben-table tbody tr",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, stagger: 0.05, duration: MOTION.dur.base, ease: MOTION.ease.entrance }
        );
      }
    });
  }
  const needsGrid = $(".needs-grid");
  if (needsGrid) {
    ScrollTrigger.create({
      trigger: needsGrid,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsapWithCSS.fromTo(
          ".need-card",
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, stagger: MOTION.stagger.fast, duration: MOTION.dur.base, ease: MOTION.ease.entrance }
        );
      }
    });
  }
  $$(".b-bar i").forEach((i) => i.style.setProperty("--s", 0));
  const labBoard = $("#board");
  if (labBoard) {
    ScrollTrigger.create({
      trigger: labBoard,
      start: "top 82%",
      once: true,
      onEnter: () => {
        gsapWithCSS.fromTo(
          ".b-row",
          { opacity: 0, x: -24 },
          { opacity: 1, x: 0, stagger: 0.07, duration: MOTION.dur.base, ease: MOTION.ease.entrance }
        );
        $$(".b-bar i").forEach((i, k) => setTimeout(() => i.style.setProperty("--s", 1), 200 + k * 120));
      }
    });
  }
  const factsSec = $(".facts");
  if (factsSec) {
    ScrollTrigger.create({
      trigger: factsSec,
      start: "top 95%",
      once: true,
      onEnter: () => {
        $$(".fact b").forEach((b) => {
          const num = parseInt(b.textContent.trim(), 10);
          if (!isNaN(num) && num > 0) {
            animateCountUp(b, num, 1.4);
          }
        });
      }
    });
  }
  const insiderSec = $("#insider");
  if (insiderSec) {
    const badge = $(".in-tagline-badge", insiderSec);
    const lines = $$(".it-line", insiderSec);
    const footer = $(".in-creed-footer", insiderSec);
    const infDraw = $(".it-inf-draw", insiderSec);
    const tlTagline = gsapWithCSS.timeline({
      scrollTrigger: {
        trigger: insiderSec,
        start: "top 75%",
        once: true
      }
    });
    if (badge) {
      tlTagline.from(badge, {
        y: -24,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out"
      }, 0);
    }
    if (lines.length) {
      tlTagline.from(lines, {
        y: 46,
        opacity: 0,
        duration: 1.1,
        stagger: 0.16,
        ease: "power3.out"
      }, 0.15);
    }
    if (infDraw) {
      tlTagline.fromTo(
        infDraw,
        { strokeDashoffset: 170 },
        { strokeDashoffset: 0, duration: 1.6, ease: "power2.out" },
        0.4
      );
    }
    if (footer) {
      tlTagline.from(footer, {
        y: 28,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      }, 0.7);
    }
  }
  const sciDna = $("#sciDna");
  if (sciDna) {
    gsapWithCSS.fromTo(
      sciDna,
      { y: 80, rotation: -3 },
      { y: -80, rotation: 3, ease: "none", scrollTrigger: { trigger: "#science", start: "top bottom", end: "bottom top", scrub: 0.6 } }
    );
  }
  const benImg = $(".ben-img");
  if (benImg) {
    gsapWithCSS.fromTo(
      benImg,
      { y: 35 },
      { y: -35, ease: "none", scrollTrigger: { trigger: "#benefits", start: "top bottom", end: "bottom top", scrub: 0.6 } }
    );
  }
  const mq = $("#mq");
  if (mq) {
    let skew = 0;
    ScrollTrigger.create({
      onUpdate: (self) => {
        skew = clamp(self.getVelocity() / -300, -7, 7);
      }
    });
    let shown = "";
    gsapWithCSS.ticker.add(() => {
      skew *= 0.9;
      if (Math.abs(skew) < 0.01) skew = 0;
      const v = skew.toFixed(2);
      if (v === shown) return;
      shown = v;
      mq.style.transform = `skewX(${v}deg)`;
    });
  }
}
export {
  NSTAGE as N,
  RX as R,
  initScroll as a,
  initPages as i,
  pageProgress as p
};
