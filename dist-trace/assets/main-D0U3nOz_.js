import { $, s as state, P as PRODUCTS, a as $$, b as initNavDropdowns, t as thumbs, i as initCart, r as renderCart } from "./cart-DFQXMGTx.js";
/* empty css              */
import { r as reduce, g as gsapWithCSS, S as ScrollTrigger, T as THREE, j as jarLayer, b as berryGeometry, a as gummyMaterial, M as Mesh, e as ease, c as clamp, s as seeded, l as lerp } from "./jar-layer-CvE_SCn1.js";
import { i as initPages, a as initScroll } from "./scroll-animations-BO_1nBQJ.js";
import { i as initSmooth } from "./smooth-scroll-BCoiyism.js";
import { D as DESIGNS, S as SHOTS } from "./product-images-B5PeIIKH.js";
const loadBar = $("#loadBar"), loadPct = $("#loadPct");
let loadP = 0;
function setLoad(p) {
  loadP = Math.max(loadP, p);
  loadBar.style.transform = `scaleX(${loadP / 100})`;
  loadPct.textContent = `GROWING ${Math.round(loadP)}%`;
}
function intro() {
  const loader = $("#loader");
  setLoad(100);
  setTimeout(() => {
    loader.classList.add("done");
    state.heroApi && state.heroApi.start && state.heroApi.start();
    state.layeredDepth && state.layeredDepth.start && state.layeredDepth.start();
    if (!reduce) {
      const tl = gsapWithCSS.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(".hero__brand > *", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.4, stagger: 0.15, ease: "power3.out" }, 0.2).fromTo(".hero__slab", { opacity: 0, y: 60, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 1.8, ease: "power3.out" }, 0.1).fromTo(".fact", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, stagger: 0.12, ease: "back.out(2)", clearProps: "transform" }, 0.7).fromTo(".nav > *", { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, clearProps: "all" }, 0.3).fromTo(".dock", { x: -90, opacity: 0 }, { x: 0, opacity: 1, duration: 1.1, ease: "expo.out", clearProps: "all" }, 0.5);
    }
  }, 300);
}
const CONFIG$1 = {
  // Key storytelling cover moment: the tagline (#insider) slides over the lineup
  stackIds: ["insider"],
  contactId: "contact",
  maxRadius: 36
};
function initTransitions() {
  if (reduce) return null;
  const isMobile = window.innerWidth < 768;
  const maxR = isMobile ? 24 : CONFIG$1.maxRadius;
  const pages = Array.from(document.querySelectorAll("main > .page"));
  pages.forEach((page, i) => {
    page.style.zIndex = i + 1;
  });
  const sheetElements = [];
  CONFIG$1.stackIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("sheet-stack");
      sheetElements.push(el);
    }
  });
  const contactEl = document.getElementById(CONFIG$1.contactId);
  if (contactEl) {
    contactEl.classList.add("sheet-stack");
    sheetElements.push(contactEl);
  }
  function updateStickyTops() {
    const vh = window.innerHeight;
    sheetElements.forEach((sheet) => {
      const topOffset = Math.min(0, vh - sheet.offsetHeight);
      sheet.style.setProperty("--sticky-top", `${topOffset}px`);
    });
  }
  updateStickyTops();
  window.addEventListener("resize", updateStickyTops);
  if (!ScrollTrigger) return { updateStickyTops };
  sheetElements.forEach((sheet) => {
    gsapWithCSS.fromTo(
      sheet,
      { "--sheet-radius": `${maxR}px` },
      {
        "--sheet-radius": "0px",
        ease: "power2.inOut",
        scrollTrigger: {
          trigger: sheet,
          start: "top 85%",
          end: "top top",
          scrub: true,
          invalidateOnRefresh: true
        }
      }
    );
  });
  return { updateStickyTops };
}
const SLAB = { topX: 0.5, topY: 22 / 1080, productW: 0.2 };
const PHOTO = { productH: 0.25 };
const HOLD = 3.4;
function initHeroJar() {
  const canvas = $("#heroCanvas"), stage = $("#home"), photo = $(".st-photo");
  if (!canvas || !photo || typeof THREE === "undefined") return null;
  const L = jarLayer(canvas), p = PRODUCTS[0], jars = PRODUCTS.map((q, i) => L.jar(q, i)), N = jars.length;
  const R = seeded(5), props = [];
  const gGeo = berryGeometry(0.17, 1.4);
  for (let k = 0; k < 7; k++) {
    const mat = gummyMaterial();
    mat.color.set(p.gummy[k % p.gummy.length]).convertSRGBToLinear();
    const m = new Mesh(gGeo, mat);
    L.scene.add(m);
    props.push({ m, a: k * 1.05 + R(), r: 1.25 + R() * 0.45, y: (R() - 0.5) * 1.1, s: 0.55 + R() * 0.5, sp: 0.25 + R() * 0.25 });
  }
  let prog = 0, progT = 0, nextAt = 0, shown = 0;
  const wrap = (d) => d - N * Math.round(d / N), sm = (x) => x * x * (3 - 2 * x);
  const tint = (q) => {
    const g = q.gummy || p.gummy;
    props.forEach((o, k) => o.m.material.color.set(g[k % g.length]).convertSRGBToLinear());
  };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX / innerWidth - 0.5;
    mouse.ty = e.clientY / innerHeight - 0.5;
  });
  const phone = matchMedia("(max-width:980px)");
  const table = { x: 0, y: 0, ph: 1 };
  const layout = () => {
    L.resize();
    if (photo && photo.style) {
      photo.style.objectPosition = "50% 50%";
    }
  };
  let needsMeasure = true;
  const measure = () => {
    needsMeasure = false;
    const c = canvas.getBoundingClientRect();
    if (slab && slab.offsetWidth) {
      const r = slab.getBoundingClientRect();
      table.x = r.left - c.left + SLAB.topX * r.width;
      table.y = r.top - c.top + SLAB.topY * r.height;
      table.ph = r.width * SLAB.productW * (phone.matches ? 1.45 : 1);
    } else {
      const r = stage.getBoundingClientRect();
      table.x = r.left - c.left + r.width / 2;
      table.y = r.top - c.top + r.height * 0.5;
      table.ph = r.height * PHOTO.productH;
    }
  };
  const requestMeasure = () => {
    needsMeasure = true;
  };
  window.addEventListener("resize", () => {
    layout();
    requestMeasure();
  });
  window.addEventListener("scroll", requestMeasure, { passive: true });
  phone.addEventListener("change", () => {
    layout();
    requestMeasure();
  });
  layout();
  measure();
  const play = () => {
    if (photo && photo.paused) {
      const p2 = photo.play();
      if (p2 && p2.catch) p2.catch(() => {
      });
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) play();
  });
  const shadow = $(".st-shadow");
  let shadowKey = "";
  const setShadow = (x, y, w) => {
    if (!shadow) return;
    const key = `${x.toFixed(1)},${y.toFixed(1)},${(w / 100).toFixed(3)}`;
    if (key === shadowKey) return;
    shadowKey = key;
    shadow.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) scale(${(w / 100).toFixed(3)})`;
  };
  let at = -1, tNow = 0, last = performance.now();
  let isHeld = false, isHidden = false, isVisible = true, rafId = 0;
  function frame(now) {
    if (!isVisible) {
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1e3);
    last = now;
    tNow += dt;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    if (needsMeasure) measure();
    const e = at < 0 ? 0 : ease.back(clamp((now - at) / 1700, 0, 1));
    if (at >= 0) {
      const ns = now / 1e3;
      if (!isHeld) {
        if (!nextAt) nextAt = ns + HOLD;
        if (ns >= nextAt) {
          progT += 1;
          nextAt = ns + HOLD;
        }
      } else {
        nextAt = ns + HOLD;
      }
    }
    prog += (progT - prog) * (1 - Math.exp(-dt * 3.2));
    const cur = (Math.round(prog) % N + N) % N;
    if (cur !== shown) {
      shown = cur;
      tint(PRODUCTS[cur]);
    }
    const pxH = table.ph;
    let bigH = 0;
    jars.forEach((jar2, i) => {
      const d = wrap(prog - i), w = sm(clamp(1 - Math.abs(d) * 1.6, 0, 1)), on = w > 1e-3 && !isHidden;
      jar2.G.visible = on;
      if (!on) return;
      const jh = pxH * jar2.fit * (0.6 + 0.4 * e) * w;
      if (jh > bigH) bigH = jh;
      L.size(jar2, Math.max(1, jh));
      L.place(jar2.G, table.x, table.y - jh / 2 + (1 - e) * L.H * 0.5);
      jar2.G.rotation.set(0.04 + mouse.y * 0.08, -0.35 + (1 - e) * -5 + Math.sin(tNow * 0.45) * 0.25 + mouse.x * 0.35 - d * 3.2, -0.02 + Math.sin(tNow * 0.6) * 0.015);
    });
    setShadow(table.x, table.y + 4, isHidden ? 0 : bigH * 0.58 * e);
    const jar = jars[cur], u = pxH / L.ppu(), gw = sm(clamp(1 - Math.abs(wrap(prog - cur)) * 1.6, 0, 1));
    props.forEach((o, k) => {
      o.m.visible = !isHidden;
      if (isHidden) return;
      const a = o.a + tNow * o.sp, rr = o.r * u * 0.42 * (1 + (1 - e) * 0.6);
      o.m.position.set(jar.G.position.x + Math.cos(a) * rr, jar.G.position.y + o.y * u * 0.45 + Math.sin(tNow + k) * u * 0.03, Math.sin(a) * rr * 0.6);
      o.m.scale.setScalar(o.s * u * (o.leaf ? 0.16 : 0.1) * e * gw);
      o.m.rotation.set(tNow * 0.4 + k, tNow * 0.3 + a, o.leaf ? 0.6 : k);
    });
    L.renderer.render(L.scene, L.cam);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !rafId) {
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    }, { rootMargin: "100px 0px" }).observe(stage);
  }
  rafId = requestAnimationFrame(frame);
  return {
    start() {
      if (at < 0) at = performance.now();
      play();
    },
    current() {
      return {
        index: shown,
        product: PRODUCTS[shown],
        table: { ...table },
        canvas,
        rotY: jars[shown] ? jars[shown].G.rotation.y : 0,
        jarFit: jars[shown] ? jars[shown].fit : 1
      };
    },
    hold(freeze) {
      isHeld = !!freeze;
      if (freeze && Math.abs(progT - prog) > 0.05) {
        prog = progT = Math.round(progT);
      }
    },
    setVisible(visible) {
      isHidden = !visible;
      if (shadow) shadow.style.opacity = visible ? "1" : "0";
    }
  };
}
function initProductHandOff() {
  const flightCanvas = $("#flightCanvas");
  const lineupSec = $("#lineup");
  const heroStage = $("#home");
  if (!flightCanvas || !lineupSec || !heroStage || !ScrollTrigger) return null;
  const isMobile = window.innerWidth < 768;
  const L = jarLayer(flightCanvas);
  const flightJars = PRODUCTS.map((p, i) => L.jar(p, i));
  flightJars.forEach((j) => {
    j.G.visible = false;
  });
  L.warm();
  const slotEls = PRODUCTS.map((p) => document.querySelector(`.lineup-slot[data-slot="${p.id}"]`));
  const items = $$(".lineup-item");
  let slotMetrics = [];
  let lineupTop = 0;
  let lineupHeight = 0;
  function measureSlots() {
    L.resize();
    lineupTop = lineupSec.offsetTop;
    lineupHeight = lineupSec.offsetHeight;
    slotMetrics = slotEls.map((slot, i) => {
      if (!slot) return { docX: 0, docY: 0, h: 220, fit: 1 };
      const r = slot.getBoundingClientRect();
      const fit = flightJars[i].fit || 1;
      return {
        docX: r.left + r.width / 2,
        docY: r.top + window.scrollY + r.height / 2,
        h: r.height * 0.86 * fit,
        fit
      };
    });
  }
  measureSlots();
  let hoveredIndex = -1;
  items.forEach((item, i) => {
    item.addEventListener("pointerenter", () => {
      hoveredIndex = i;
    });
    item.addEventListener("pointerleave", () => {
      if (hoveredIndex === i) hoveredIndex = -1;
    });
  });
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX / window.innerWidth - 0.5;
    mouse.ty = e.clientY / window.innerHeight - 0.5;
  });
  let activeIndex = -1;
  let plinthBase = null;
  let animProgress = 0;
  let rafId = 0;
  function getPlinthBase() {
    const heroApi = state.heroApi;
    if (!heroApi || !heroApi.current) return null;
    const cur = heroApi.current();
    const fit = cur.jarFit || 1;
    const pxH = cur.table.ph * fit;
    return {
      index: cur.index,
      product: cur.product,
      x: cur.table.x,
      y: cur.table.y,
      h: pxH,
      rotY: cur.rotY || -0.35,
      fit
    };
  }
  function updateLineupDOM(prog, activeIdx) {
    items.forEach((item, i) => {
      if (i === activeIdx) {
        item.style.opacity = "1";
        item.style.transform = "none";
      } else {
        const stagger = (i > activeIdx ? i - 1 : i) * 0.08;
        const p = clamp((prog - 0.2 - stagger) / 0.45, 0, 1);
        const ease2 = p * p * (3 - 2 * p);
        item.style.opacity = ease2.toFixed(3);
        item.style.transform = `translate3d(0, ${(30 * (1 - ease2)).toFixed(1)}px, 0)`;
      }
    });
  }
  let isHandOffVisible = true;
  function loop(now) {
    if (!isHandOffVisible) {
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(loop);
    const scrollY = window.scrollY;
    const inLineupZone = scrollY + window.innerHeight > lineupTop && scrollY < lineupTop + lineupHeight;
    const inFlightZone = scrollY >= 0 && scrollY < lineupTop + 100;
    if (!inLineupZone && !inFlightZone) {
      if (flightCanvas.classList.contains("active")) {
        flightCanvas.classList.remove("active");
      }
      return;
    }
    if (!flightCanvas.classList.contains("active")) {
      flightCanvas.classList.add("active");
    }
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    const tTime = (now || performance.now()) * 1e-3;
    const p = animProgress;
    const activeIdx = activeIndex >= 0 ? activeIndex : 0;
    const plinth = plinthBase || {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.58,
      h: slotMetrics[activeIdx] ? slotMetrics[activeIdx].h : 220,
      rotY: -0.35
    };
    const plinthScreenX = plinth.x;
    const plinthScreenY = plinth.y - scrollY - plinth.h / 2;
    PRODUCTS.forEach((prod, i) => {
      const jar = flightJars[i];
      const slot = slotMetrics[i] || { docX: window.innerWidth / 2, docY: scrollY + 400, h: 220 };
      const slotScreenX = slot.docX;
      const slotScreenY = slot.docY - scrollY;
      const isHovered = i === hoveredIndex;
      const restRotY = prod.shape === "tube" ? -0.32 : -0.38;
      if (i === activeIdx) {
        let curX, curY, curH, curRotY, curRotX, curRotZ;
        const spinCount = isMobile ? 1 : 1.5;
        if (p <= 0.15) {
          const t = p / 0.15;
          const lift = Math.sin(t * Math.PI * 0.5);
          curX = plinthScreenX;
          curY = plinthScreenY - lift * 32;
          curH = lerp(plinth.h, slot.h, p * 0.15);
          curRotY = plinth.rotY + t * 0.25;
          curRotX = 0.04 - lift * 0.02;
          curRotZ = -0.02;
        } else if (p <= 0.9) {
          const t = (p - 0.15) / 0.75;
          const easeT = t * t * (3 - 2 * t);
          const arcY = -Math.sin(t * Math.PI) * (isMobile ? 25 : 55);
          curX = lerp(plinthScreenX, slotScreenX, easeT);
          curY = lerp(plinthScreenY - 32, slotScreenY, easeT) + arcY;
          curH = lerp(plinth.h, slot.h, easeT);
          curRotY = lerp(plinth.rotY, restRotY, easeT) + Math.sin(t * Math.PI) * (Math.PI * 2 * spinCount);
          curRotX = 0.04 * (1 - easeT) + Math.sin(t * Math.PI) * 0.09;
          curRotZ = -0.02 * (1 - easeT) + Math.sin(t * Math.PI) * 0.06;
        } else {
          const t = (p - 0.9) / 0.1;
          const easeT = t * t * (3 - 2 * t);
          curX = slotScreenX;
          curY = slotScreenY;
          curH = slot.h;
          curRotY = lerp(restRotY, restRotY + (isHovered ? mouse.x * 0.8 : Math.sin(tTime * 0.85 + i) * 0.06), easeT);
          curRotX = isHovered ? mouse.y * 0.2 : 0;
          curRotZ = 0;
        }
        jar.G.visible = p > 0 || scrollY > 10;
        L.place(jar.G, curX, curY);
        L.size(jar, Math.max(1, curH));
        jar.G.rotation.set(curRotX, curRotY, curRotZ);
      } else {
        jar.G.visible = p >= 0.18 || p >= 1 || inLineupZone;
        L.place(jar.G, slotScreenX, slotScreenY);
        L.size(jar, Math.max(1, slot.h));
        const targetRotY = isHovered ? restRotY + mouse.x * 0.8 : restRotY + Math.sin(tTime * 0.85 + i * 1.2) * 0.06;
        const targetRotX = isHovered ? mouse.y * 0.2 : 0;
        jar.G.rotation.y += (targetRotY - jar.G.rotation.y) * 0.1;
        jar.G.rotation.x += (targetRotX - jar.G.rotation.x) * 0.1;
        jar.G.rotation.z = 0;
      }
    });
    const anyVisible = flightJars.some((j) => j.G.visible);
    if (!anyVisible && drewEmpty) return;
    drewEmpty = !anyVisible;
    L.renderer.render(L.scene, L.cam);
  }
  let drewEmpty = false;
  let heroVisible = true;
  let lineupVisible = false;
  const handOffObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target === heroStage) heroVisible = entry.isIntersecting;
      if (entry.target === lineupSec) lineupVisible = entry.isIntersecting;
    });
    isHandOffVisible = heroVisible || lineupVisible;
    if (isHandOffVisible && !rafId) {
      rafId = requestAnimationFrame(loop);
    }
  }, { rootMargin: "100px 0px" });
  handOffObserver.observe(heroStage);
  handOffObserver.observe(lineupSec);
  rafId = requestAnimationFrame(loop);
  function handleResize() {
    measureSlots();
  }
  window.addEventListener("resize", handleResize);
  if (reduce) {
    animProgress = 1;
    flightJars.forEach((j) => {
      j.G.visible = true;
    });
    updateLineupDOM(1, -1);
    return { flightJars, L };
  }
  ScrollTrigger.create({
    trigger: lineupSec,
    start: "top bottom",
    end: "top 15%",
    scrub: 0.3,
    onEnter: () => {
      const heroApi = state.heroApi;
      if (heroApi) {
        heroApi.hold(true);
        plinthBase = getPlinthBase();
        if (plinthBase) {
          activeIndex = plinthBase.index;
          heroApi.setVisible(false);
          const targetSlot = slotEls[activeIndex];
          if (targetSlot) targetSlot.classList.add("landing");
          flightCanvas.classList.add("active");
        }
      }
    },
    onLeave: () => {
      animProgress = 1;
      updateLineupDOM(1, activeIndex);
      slotEls.forEach((s) => {
        if (s) s.classList.remove("landing");
      });
    },
    onEnterBack: () => {
      if (activeIndex >= 0) {
        const targetSlot = slotEls[activeIndex];
        if (targetSlot) targetSlot.classList.add("landing");
        flightCanvas.classList.add("active");
      }
    },
    onLeaveBack: () => {
      animProgress = 0;
      const heroApi = state.heroApi;
      if (heroApi) {
        heroApi.setVisible(true);
        heroApi.hold(false);
      }
      flightJars.forEach((j) => {
        j.G.visible = false;
      });
      slotEls.forEach((s) => {
        if (s) s.classList.remove("landing");
      });
      updateLineupDOM(0, -1);
      flightCanvas.classList.remove("active");
      activeIndex = -1;
      plinthBase = null;
    },
    onUpdate: (self) => {
      const p = self.progress;
      animProgress = p;
      if (activeIndex === -1 && p > 0 && p < 1) {
        const heroApi = state.heroApi;
        if (heroApi) {
          heroApi.hold(true);
          plinthBase = getPlinthBase();
          if (plinthBase) {
            activeIndex = plinthBase.index;
            heroApi.setVisible(false);
            const targetSlot = slotEls[activeIndex];
            if (targetSlot) targetSlot.classList.add("landing");
            flightCanvas.classList.add("active");
          }
        }
      }
      if (activeIndex < 0) return;
      if (p >= 0.98) {
        const targetSlot = slotEls[activeIndex];
        if (targetSlot) targetSlot.classList.remove("landing");
      } else {
        const targetSlot = slotEls[activeIndex];
        if (targetSlot) targetSlot.classList.add("landing");
      }
      updateLineupDOM(p, activeIndex);
    }
  });
  return { flightJars, L };
}
const parse = (s) => s.split(" ").map((p) => p.split(",").map(Number));
const BIRD_WALK_FPS = 30;
const BIRD_WALK = {
  idle1: parse("0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 0,0 -1,0 -8,-4 -9,-4 -10,-5 -12,-5 -15,-5 -16,-5 -17,-5 -17,-5 -17,-5 -17,-5 -17,-5 -17,-5 -17,-5 -17,-5 -17,-5 -17,-5 -17,-5 -17,-5 -17,-5 -19,-6 -20,-7 -21,-7 -23,-7 -23,-5 -25,-4 -26,-2 -27,-2 -28,-2 -35,-6 -37,-6 -37,-6 -38,-6 -38,-6 -38,-5 -37,-5 -37,-5 -37,-5 -37,-6 -37,-6 -37,-6 -38,-6 -38,-6 -38,-6 -38,-6 -38,-6 -38,-6 -38,-6 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -37,-5 -38,-5 -38,-5 -38,-4 -38,-4 -37,-3 -35,-1 -34,-1 -34,-1 -33,-1 -33,0 -33,0 -31,0 -27,2 -23,2 -22,2 -21,2 -21,1 -21,1 -21,1 -21,1 -21,1 -21,1 -21,1 -21,1 -20,1 -20,1 -20,1 -20,1 -20,1 -20,1 -20,1 -20,1 -20,1 -20,1 -20,1 -20,1 -20,1 -20,2 -17,3 -13,3 -9,3 -6,1 -4,1 -3,1 -3,1 -3,1 -3,1 -4,1 -4,1 -4,1 -4,1 -4,1 -4,1 -4,1 -4,1 -4,1 -4,1 -4,2 -4,2 -2,2 0,2 0,1 0,0 1,0 2,-1 2,-2 2,-2 0,-2 0,-1 0,-1 0,0 0,0 1,-1 1,-1 1,-1 1,-1 1,-1 1,-1 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 0,-1 0,-1 0,-1 0,-1 0,-1 0,-1 0,-1 0,-1 0,-1 0,-1 0,-1 0,0 0,0 0,0 0,0 0,0 0,0"),
  idle2: parse("0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 1,1 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,1 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 1,0 1,0 1,0 1,0 1,0 2,0 2,0 3,0 3,0 3,0 2,0 1,0 0,0 -1,0 -3,0 -4,-1 -8,-3 -11,-3 -13,-3 -14,-3 -15,-3 -15,-3 -15,-3 -16,-3 -16,-3 -16,-3 -16,-3 -16,-4 -17,-4 -18,-4 -20,-3 -21,-3 -21,-3 -22,-3 -22,-3 -22,-3 -22,-3 -22,-3 -22,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-3 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -21,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -21,-2 -21,-2 -21,-2 -21,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-1 -22,-1 -22,-1 -22,-1 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-2 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -22,-1 -21,-1 -20,-1 -19,-1 -18,-1 -17,-1 -16,-1 -16,-1 -16,0 -17,0 -18,0 -19,0 -19,0 -20,0 -20,0 -20,0 -20,0 -20,0 -20,0 -20,0 -20,0 -20,0 -20,-1 -20,-2 -24,-4 -27,-4 -29,-4 -31,-2 -33,-2 -33,0 -33,0 -33,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -39,-5 -39,-5 -39,-5 -33,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -32,0 -33,0 -33,0 -38,-4 -38,-4 -38,-4 -33,-1 -32,-1 -32,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -31,-1 -32,-1 -32,-1 -32,-1 -32,-1 -32,-1 -32,-1 -32,-1 -32,-1 -32,-1 -31,-1 -30,-3 -28,-4 -27,-6 -26,-6 -26,-6 -25,-5 -25,-5 -24,-5 -24,-5 -24,-5 -24,-5 -24,-5 -24,-5 -24,-5 -24,-5 -24,-5 -23,-5 -23,-5 -23,-5 -23,-5 -21,-5 -21,-5 -21,-5 -21,-5 -21,-5 -21,-5 -21,-4 -21,-4 -21,-4 -21,-4 -22,-4 -22,-3 -22,-3 -22,-3 -21,-3 -20,-3 -14,0 -14,0 -13,0 -12,0 -11,-1 -11,-1 -11,-1 -10,-2 -10,-2 -10,-3 -10,-3 -10,-3 -10,-2 -10,-1 -11,-1 -11,-1 -11,0 -11,0 -11,0 -11,0 -12,0 -12,0 -12,0 -12,0 -12,0 -11,-1 -10,-2 -8,-2 -7,-2 -7,-2 -7,-1 -8,-1 -9,-1 -9,-1 -9,-1 -9,-1 -9,-1 -8,-1 -7,-1 -7,-1 -3,-4 0,-4 1,-4 1,-3 1,-1 1,-1 1,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 1,0 1,0 1,0 1,0 1,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,-1 0,0 0,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 1,0 0,-1 0,-1 0,-1 0,-1 0,-1 0,-1 0,-1 0,-1")
};
function initLayeredDepth() {
  const stage = $("#home");
  $("#slab");
  const brand = $(".hero__brand");
  const panels = $("#panels");
  const bg = $(".hero__bg");
  if (!stage) return null;
  const enter = $("#bird-enter");
  const idle1 = $("#bird-idle1");
  const idle2 = $("#bird-idle2");
  const leave = $("#bird-leave");
  const birds = [enter, idle1, idle2, leave].filter(Boolean);
  let birdState = "hidden";
  const showBird = (el) => {
    birds.forEach((v) => {
      v.style.display = v === el ? "block" : "none";
    });
  };
  const playBird = (el) => {
    if (!el) return;
    try {
      el.currentTime = 0;
      if (el.readyState >= 2) {
        const p = el.play();
        if (p && p.catch) p.catch(() => {
        });
      } else {
        const onCanPlay = () => {
          el.removeEventListener("canplay", onCanPlay);
          const p = el.play();
          if (p && p.catch) p.catch(() => {
          });
        };
        el.addEventListener("canplay", onCanPlay);
      }
    } catch (e) {
    }
  };
  const setBirdState = (next) => {
    birdState = next;
    if (next === "hidden") {
      showBird(null);
      return;
    }
    const map = { enter, idle1, idle2, leave };
    const target = map[next];
    if (target) {
      showBird(target);
      playBird(target);
    }
  };
  if (enter && idle1 && idle2 && leave) {
    birds.forEach((v) => {
      try {
        v.load();
      } catch (e) {
      }
    });
    enter.addEventListener("ended", () => {
      if (birdState === "enter") setBirdState("idle1");
    });
    idle1.addEventListener("ended", () => {
      if (birdState === "idle1") setBirdState("idle2");
    });
    idle2.addEventListener("ended", () => {
      if (birdState === "idle2") setBirdState("idle1");
    });
    setTimeout(() => setBirdState("enter"), 400);
    const SCROLL_THRESHOLD = 15;
    window.addEventListener("scroll", () => {
      const y = window.scrollY || window.pageYOffset;
      if (y > SCROLL_THRESHOLD) {
        if (birdState !== "leave" && birdState !== "hidden") {
          [enter, idle1, idle2].forEach((v) => {
            try {
              v.pause();
              v.currentTime = 0;
            } catch (e) {
            }
          });
          setBirdState("leave");
        }
      } else {
        if (birdState === "leave") {
          try {
            leave.pause();
            leave.currentTime = 0;
          } catch (e) {
          }
          setBirdState("enter");
        }
      }
    }, { passive: true });
  }
  const slabEls = [...stage.querySelectorAll(".hero__slab")];
  const birdLayer = $("#birds");
  let stageH = stage.offsetHeight, lastY = NaN, scrollQueued = false;
  const applyScroll = () => {
    scrollQueued = false;
    const y = Math.min(window.scrollY || window.pageYOffset, stageH * 1.1);
    if (y === lastY) return;
    lastY = y;
    const slabY = `${(-y * 0.28).toFixed(1)}px`;
    const brandY = `${(y * 0.15).toFixed(1)}px`;
    slabEls.forEach((el) => el.style.setProperty("--slab-y", slabY));
    if (birdLayer) {
      birdLayer.style.setProperty("--slab-y", slabY);
      birdLayer.style.setProperty("--brand-y", brandY);
    }
    if (panels && window.innerWidth >= 768) {
      panels.style.setProperty("--panel-offset", `${Math.max(-80, -y * 0.35).toFixed(1)}px`);
    }
    if (brand) {
      brand.style.setProperty("--brand-y", brandY);
    }
  };
  const onScroll = () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(applyScroll);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    stageH = stage.offsetHeight;
    lastY = NaN;
    onScroll();
  });
  if ("IntersectionObserver" in window) {
    const vids = [bg, ...stage.querySelectorAll(".birds video")].filter(Boolean);
    new IntersectionObserver(([entry]) => {
      vids.forEach((v) => {
        if (!entry.isIntersecting) {
          if (!v.paused) {
            v.dataset.wasPlaying = "1";
            v.pause();
          }
        } else if (v.dataset.wasPlaying === "1" && v.style.display !== "none") {
          delete v.dataset.wasPlaying;
          const p = v.play();
          if (p && p.catch) p.catch(() => {
          });
        }
      });
    }, { threshold: 0 }).observe(stage);
  }
  applyScroll();
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canHover && !reduceMotion) {
    let tx = 0, ty = 0, cx = 0, cy = 0, rafId = 0;
    let stageVisible = true;
    new IntersectionObserver((entries) => {
      stageVisible = entries[0].isIntersecting;
      if (!stageVisible && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }).observe(stage);
    const renderParallax = () => {
      if (!stageVisible) {
        rafId = 0;
        return;
      }
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      stage.style.setProperty("--mx", cx.toFixed(4));
      stage.style.setProperty("--my", cy.toFixed(4));
      if (Math.abs(tx - cx) > 5e-4 || Math.abs(ty - cy) > 5e-4) {
        rafId = requestAnimationFrame(renderParallax);
      } else {
        rafId = 0;
      }
    };
    window.addEventListener("pointermove", (e) => {
      if (!stageVisible) return;
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!rafId) rafId = requestAnimationFrame(renderParallax);
    }, { passive: true });
  }
  const birdsEl = $("#birds");
  const title = $(".hero__title");
  const FEET = { x: 2328 / 3840, y: 1082 / 2160 };
  const translation = (el) => {
    const m = getComputedStyle(el).transform;
    if (!m || m === "none") return [0, 0];
    const v = new DOMMatrixReadOnly(m);
    return [v.m41, v.m42];
  };
  const capTop = (el) => {
    const cs = getComputedStyle(el), ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ctx.measureText("S");
    return (m.fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.95) - (m.actualBoundingBoxAscent || parseFloat(cs.fontSize) * 0.72);
  };
  const placeBird = () => {
    if (!birdsEl || !title) return;
    const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
    let node, at = -1;
    while (node = walker.nextNode()) {
      at = node.textContent.toLowerCase().indexOf("science");
      if (at >= 0) break;
    }
    if (!node || at < 0) return;
    const range = document.createRange();
    range.setStart(node, at);
    range.setEnd(node, at + 1);
    const s = range.getBoundingClientRect(), st = stage.getBoundingClientRect();
    if (!s.width) return;
    const [bx, by] = translation(brand), [tx, ty] = translation(title);
    const target = { x: s.left - st.left - bx - tx + s.width * 0.5, y: s.top - st.top - by - ty + capTop(title) };
    const W = birdsEl.offsetWidth, H = birdsEl.offsetHeight, sc = Math.max(W / 3840, H / 2160);
    const fx = (W - 3840 * sc) / 2 + FEET.x * 3840 * sc, fy = (H - 2160 * sc) / 2 + FEET.y * 2160 * sc;
    const [ox, oy] = getComputedStyle(birdsEl).transformOrigin.split(" ").map(parseFloat);
    const k = parseFloat(getComputedStyle(stage).getPropertyValue("--bird-k")) || 0.74;
    stage.style.setProperty("--bird-dx", (target.x - (ox + k * (fx - ox))).toFixed(1) + "px");
    stage.style.setProperty("--bird-dy", (target.y - (oy + k * (fy - oy))).toFixed(1) + "px");
  };
  const pinFeet = (video, table) => {
    if (!video || !table) return;
    const apply = (t) => {
      const p = table[Math.min(table.length - 1, Math.max(0, Math.round(t * BIRD_WALK_FPS)))];
      const W = birdsEl.offsetWidth, H = birdsEl.offsetHeight, sc = Math.max(W / 1920, H / 1080);
      video.style.transform = `translate3d(${(-p[0] * sc).toFixed(1)}px, ${(-p[1] * sc).toFixed(1)}px, 0)`;
    };
    if ("requestVideoFrameCallback" in video) {
      const onFrame = (now, meta) => {
        apply(meta.mediaTime);
        video.requestVideoFrameCallback(onFrame);
      };
      video.requestVideoFrameCallback(onFrame);
    } else {
      const loop = () => {
        if (!video.paused) apply(video.currentTime);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
    video.addEventListener("seeked", () => apply(video.currentTime));
  };
  pinFeet($("#bird-idle1"), BIRD_WALK.idle1);
  pinFeet($("#bird-idle2"), BIRD_WALK.idle2);
  placeBird();
  window.addEventListener("resize", placeBird);
  if (title && "ResizeObserver" in window) new ResizeObserver(() => placeBird()).observe(title);
  window.addEventListener("load", placeBird);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeBird);
  [600, 2500, 4500].forEach((t) => setTimeout(placeBird, t));
  return {
    start() {
      setTimeout(placeBird, 50);
      if (enter && birdState === "hidden") setBirdState("enter");
    }
  };
}
const RES = { w: 960, h: 540 };
const BRUSH = 74;
const FADE = 0.75;
function initMossReveal() {
  const view = $("#slabMoss");
  if (!view) return null;
  const ctx = view.getContext("2d");
  view.width = RES.w;
  view.height = RES.h;
  const mask = document.createElement("canvas");
  mask.width = RES.w;
  mask.height = RES.h;
  const mctx = mask.getContext("2d");
  const moss = new Image();
  moss.decoding = "async";
  let ready = false;
  moss.onload = () => {
    ready = true;
  };
  moss.src = "/layered-depth-slab-set-moss.webp";
  const dab = (x, y) => {
    const g = mctx.createRadialGradient(x, y, 0, x, y, BRUSH);
    g.addColorStop(0, "rgba(0,0,0,.9)");
    g.addColorStop(0.55, "rgba(0,0,0,.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    mctx.fillStyle = g;
    mctx.beginPath();
    mctx.arc(x, y, BRUSH, 0, Math.PI * 2);
    mctx.fill();
  };
  let running = false, last = 0, idle = 0, lx = null, ly = null;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1e3);
    last = now;
    idle += dt;
    mctx.globalCompositeOperation = "destination-out";
    mctx.fillStyle = `rgba(0,0,0,${(1 - Math.exp(-dt * FADE)).toFixed(4)})`;
    mctx.fillRect(0, 0, RES.w, RES.h);
    mctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, RES.w, RES.h);
    if (ready) {
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.drawImage(moss, 0, 0, RES.w, RES.h);
      ctx.globalCompositeOperation = "source-over";
    }
    if (idle < 6) requestAnimationFrame(frame);
    else {
      running = false;
      mctx.clearRect(0, 0, RES.w, RES.h);
      ctx.clearRect(0, 0, RES.w, RES.h);
    }
  };
  const kick = () => {
    idle = 0;
    if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  };
  view.addEventListener("pointermove", (e) => {
    const w = view.clientWidth || RES.w, h = view.clientHeight || RES.h;
    const x = e.offsetX / w * RES.w, y = e.offsetY / h * RES.h;
    if (lx !== null) {
      const d = Math.hypot(x - lx, y - ly), steps = Math.min(40, Math.ceil(d / (BRUSH * 0.35)));
      for (let i = 1; i <= steps; i++) dab(lx + (x - lx) * i / steps, ly + (y - ly) * i / steps);
    } else dab(x, y);
    lx = x;
    ly = y;
    kick();
  }, { passive: true });
  view.addEventListener("pointerleave", () => {
    lx = ly = null;
  }, { passive: true });
  return {};
}
function buildMarquee() {
  const one = "<span>Live naturally</span><span>Live healthier</span>";
  $("#mq").innerHTML = one.repeat(4);
}
const SECTIONS = [
  { id: "home", name: "Home", sub: "Nature meets science", tags: ["3D jar", "Facts arc", "Marquee"] },
  { id: "lineup", name: "Lineup", sub: "All five products", tags: ["The lineup", "5 products"] },
  { id: "insider", name: "Our Vision", sub: "Company Tagline", tags: ["Roots of nature", "Infinity of science"] },
  { id: "nature", name: "Nature", sub: "Ayurvedic wisdom", tags: ["Botanical video"] },
  { id: "explore", name: "Explore", sub: "Find your way around", tags: ["About", "Products", "Science", "Contact"] }
];
const SEC_IC = {
  home: '<path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z"/>',
  nature: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  explore: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  insider: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  products: '<rect x="7" y="9" width="10" height="12" rx="2.5"/><path d="M8 4.5h8V9H8z"/><path d="M10 14h4"/>',
  benefits: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.3l2.4 2.4 4.6-5"/>',
  process: '<circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="9" r="2.2"/><circle cx="11" cy="17.5" r="2.2"/><path d="M8.1 7.4l7.7 1.2M7.1 9l2.9 6.5M16.6 10.8l-4.1 4.9"/>',
  science: '<path d="M8 3c0 5 8 5 8 9s-8 4-8 9"/><path d="M16 3c0 5-8 5-8 9s8 4 8 9"/><path d="M9.5 6.5h5M9.5 17.5h5"/>',
  lab: '<path d="M9.5 3h5M10.5 3v6l-5 9a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.6 15h8.8"/>',
  finder: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  shop: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  contact: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>'
};
const svgI = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
function initNav() {
  const nav = $("#nav"), dock = $("#dock"), btn = $("#dockMenu"), menu = $("#menu"), ind = $("#dockInd");
  const pad = (n) => String(n).padStart(2, "0");
  const SITE_PAGES = [
    { no: "01", name: "Home", sub: "Nature meets science", href: "index.html#home" },
    { no: "02", name: "About Us", sub: "Our mission & innovation", href: "about.html" },
    { no: "03", name: "Our Products", sub: "All five formulations", href: "products.html" },
    { no: "04", name: "Science & Innovation", sub: "Molecular delivery & 3D lab", href: "science.html" },
    { no: "05", name: "Our Ingredients", sub: "Botanical pharmacopeia", href: "ingredients.html" },
    { no: "06", name: "Quality & Manufacturing", sub: "Cleanrooms & batch audit", href: "quality.html" },
    { no: "07", name: "Sustainability", sub: "Regeneration & zero-plastic", href: "sustainability.html" },
    { no: "08", name: "Certifications & Compliance", sub: "Regulatory accreditations", href: "certifications.html" },
    { no: "09", name: "Contact", sub: "Say hello", href: "contact.html" }
  ];
  $("#dockList").innerHTML = SECTIONS.map((s, i) => `<li style="--i:${i}"><a href="#${s.id}" data-sec="${s.id}" aria-label="${s.name}" tabindex="-1">${svgI(SEC_IC[s.id])}<b>${s.name}</b></a></li>`).join("");
  $("#menuList").innerHTML = SITE_PAGES.map((p, i) => `<li style="--i:${i}"><a href="${p.href}"><span class="mi-no">${p.no}</span><span class="mi-name">${p.name}</span><span class="mi-sub">${p.sub}</span></a></li>`).join("");
  const links = $$("#dockList a");
  const fImg = $("#mfImg");
  let fi = 1, ft = null;
  const showFeat = (i) => {
    fi = i;
    const p = PRODUCTS[i];
    $$("img", fImg).forEach((im, k) => im.classList.toggle("on", k === i));
    $("#mfName").textContent = p.name;
    $("#mfNo").textContent = `Product ${p.no} · ${p.tag}`;
    $("#mfAdd").dataset.id = p.id;
  };
  const startFeat = () => {
    if (!fImg.children.length && thumbs.gummies) fImg.innerHTML = PRODUCTS.map((p) => `<img src="${thumbs[p.id]}" alt="${p.name}">`).join("");
    showFeat(fi);
    clearInterval(ft);
    if (!reduce) ft = setInterval(() => showFeat((fi + 1) % PRODUCTS.length), 2800);
  };
  const setOpen = (open) => {
    const r = btn.getBoundingClientRect();
    menu.style.setProperty("--ox", (r.left + r.width / 2).toFixed(0) + "px");
    menu.style.setProperty("--oy", (r.top + r.height / 2).toFixed(0) + "px");
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", !open);
    btn.setAttribute("aria-expanded", open);
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.documentElement.classList.toggle("menu-open", open);
    if (state.lenis) open ? state.lenis.stop() : state.lenis.start();
    if (open) startFeat();
    else clearInterval(ft);
  };
  const touch = !matchMedia("(hover:hover) and (pointer:fine)").matches;
  dock.classList.toggle("touch", touch);
  let foldT = 0, setT = 0;
  const unfold = (open) => {
    clearTimeout(foldT);
    if (open === dock.classList.contains("open")) return;
    clearTimeout(setT);
    dock.classList.toggle("open", open);
    dock.classList.remove("settled", "peek");
    links.forEach((a) => a.tabIndex = open ? 0 : -1);
    if (open) {
      setT = setTimeout(() => {
        dock.classList.add("settled");
        place();
      }, 560);
      requestAnimationFrame(place);
    }
  };
  if (!touch) {
    dock.addEventListener("mouseenter", () => unfold(true));
    dock.addEventListener("mouseleave", () => {
      foldT = setTimeout(() => unfold(false), 380);
    });
  }
  dock.addEventListener("focusin", () => unfold(true));
  dock.addEventListener("focusout", (e) => {
    if (!dock.contains(e.relatedTarget)) foldT = setTimeout(() => unfold(false), 200);
  });
  document.addEventListener("pointerdown", (e) => {
    if (dock.classList.contains("open") && !dock.contains(e.target)) unfold(false);
  });
  $("#dockList").addEventListener("click", () => setTimeout(() => unfold(false), touch ? 250 : 600));
  let wasOpen = false;
  btn.addEventListener("pointerdown", () => {
    wasOpen = dock.classList.contains("open");
  });
  btn.addEventListener("click", () => {
    if (touch && !wasOpen && !menu.classList.contains("open")) {
      wasOpen = true;
      unfold(true);
      return;
    }
    unfold(false);
    setOpen(!menu.classList.contains("open"));
  });
  $("#menuX").addEventListener("click", () => setOpen(false));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
  let cur = "home", peekT = 0;
  const place = () => {
    const a = links.find((x) => x.dataset.sec === cur);
    if (a) ind.style.transform = `translateY(${a.parentElement.offsetTop}px)`;
  };
  const setOn = (id) => {
    const changed = id !== cur;
    cur = id;
    links.forEach((a) => a.classList.toggle("on", a.dataset.sec === id));
    $$("#menuList li").forEach((li) => li.classList.toggle("on", li.dataset.sec === id));
    $$(".nav-pills > a").forEach((a) => a.classList.toggle("on", a.dataset.sec === id));
    const si = Math.max(0, SECTIONS.findIndex((s) => s.id === id)), cl = $("#dockCur");
    cl.textContent = SECTIONS[si].name;
    cl.dataset.no = pad(si + 1);
    place();
    if (changed && !menu.classList.contains("open")) {
      dock.classList.add("peek");
      clearTimeout(peekT);
      peekT = setTimeout(() => dock.classList.remove("peek"), 1600);
    }
  };
  setOn("home");
  window.addEventListener("resize", place);
  initNavDropdowns();
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 20);
  }, { passive: true });
  let pageDark = false, footDark = false;
  const foot = $("footer");
  const updateTone = () => {
    const dark = pageDark || footDark;
    nav.classList.toggle("t-green", dark);
    dock.classList.toggle("t-green", dark);
  };
  if (foot && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      footDark = entry.isIntersecting;
      updateTone();
    }, { rootMargin: "0px 0px -50% 0px" }).observe(foot);
  }
  window.addEventListener("tl:page", (e) => {
    setOn(e.detail.id);
    pageDark = e.detail.theme === "green";
    updateTone();
  });
}
function initLightbox() {
  const box = document.createElement("div");
  box.className = "lb";
  box.id = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Product design");
  box.hidden = true;
  box.innerHTML = `<div class="lb-scrim" data-close></div><figure class="lb-fig"><img alt=""><figcaption><span class="lb-name"></span><button class="lb-x" type="button" data-close>Close <i aria-hidden="true">×</i></button></figcaption></figure>`;
  document.body.appendChild(box);
  const img = $("img", box), name = $(".lb-name", box);
  let lastFocus = null;
  const open = (id) => {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p || !DESIGNS[id]) return;
    img.src = DESIGNS[id];
    img.alt = `${p.name} packaging design`;
    name.textContent = `${p.no} · ${p.name}`;
    lastFocus = document.activeElement;
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add("open"));
    if (state.lenis) state.lenis.stop();
    $(".lb-x", box).focus();
  };
  const close = () => {
    if (box.hidden) return;
    box.classList.remove("open");
    setTimeout(() => {
      box.hidden = true;
    }, 350);
    if (state.lenis) state.lenis.start();
    if (lastFocus) lastFocus.focus();
  };
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-design]");
    if (t) {
      e.preventDefault();
      open(t.dataset.design);
    } else if (e.target.closest("[data-close]")) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}
const TOTAL_FRAMES = 201;
const TRANS_END_FRAME = 112;
const LIVING_START_FRAME = 113;
const LIVING_END_FRAME = 200;
const TRANS_SCROLL_THRESHOLD = 0.65;
function initAyurveda() {
  const root = $("#ayurSeq");
  const pin = $("#ayurPin");
  const canvas = $("#ayurCanvas");
  const power = $("#ayurPower");
  const content = $("#ayurContent");
  const hint = $("#ayurHint");
  if (!root || !canvas) return null;
  const ctx = canvas.getContext("2d", { alpha: false });
  const frames = new Array(TOTAL_FRAMES);
  let lastDrawnIndex = -1;
  const useBitmaps = typeof createImageBitmap === "function" && typeof fetch === "function";
  const loaded = (i) => frames[i] !== void 0;
  const bitmaps = /* @__PURE__ */ new Map();
  const decoding = /* @__PURE__ */ new Set();
  const AHEAD = 16, KEEP = 26;
  let travel = 1;
  let wanted = 0;
  function warmWindow(center) {
    if (!useBitmaps) return;
    for (let k = -6; k <= AHEAD; k++) {
      const i = center + k * travel;
      if (i < 0 || i >= TOTAL_FRAMES || bitmaps.has(i) || decoding.has(i) || !loaded(i)) continue;
      if (decoding.size >= 4) break;
      decoding.add(i);
      createImageBitmap(frames[i]).then((bmp) => {
        decoding.delete(i);
        if (Math.abs(i - wanted) > KEEP) {
          if (bmp.close) bmp.close();
          return;
        }
        bitmaps.set(i, bmp);
        drawFrame(wanted);
        warmWindow(wanted);
      }, () => decoding.delete(i));
    }
    for (const [i, bmp] of bitmaps) if (Math.abs(i - center) > KEEP) {
      if (bmp.close) bmp.close();
      bitmaps.delete(i);
    }
  }
  function drawFrame(index) {
    const want = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(index)));
    if (want !== wanted) {
      travel = want > wanted ? 1 : -1;
      wanted = want;
    }
    const has = useBitmaps ? (i) => bitmaps.has(i) : (i) => loaded(i) && frames[i].naturalWidth > 0;
    if (useBitmaps) warmWindow(want);
    let idx = -1;
    for (let d = 0; d < TOTAL_FRAMES && idx < 0; d++) {
      if (want - d >= 0 && has(want - d)) idx = want - d;
      else if (want + d < TOTAL_FRAMES && has(want + d)) idx = want + d;
    }
    if (idx < 0) return false;
    if (idx === lastDrawnIndex) return idx === want;
    ctx.drawImage(useBitmaps ? bitmaps.get(idx) : frames[idx], 0, 0, canvas.width, canvas.height);
    lastDrawnIndex = idx;
    return idx === want;
  }
  const frameUrl = (i) => `./frames/ayurveda/frame_${String(i).padStart(3, "0")}.webp`;
  const order = [];
  {
    const seen = /* @__PURE__ */ new Set();
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < TOTAL_FRAMES; i += step) if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
    if (!seen.has(TOTAL_FRAMES - 1)) order.push(TOTAL_FRAMES - 1);
  }
  let started = false;
  function loadFrames() {
    if (started) return;
    started = true;
    let next = 0;
    const arrived = (i) => {
      if (useBitmaps) {
        if (lastDrawnIndex < 0 || Math.abs(i - wanted) <= AHEAD) warmWindow(wanted);
      } else if (lastDrawnIndex < 0 || Math.abs(i - wanted) <= 2) drawFrame(wanted);
    };
    const pump = () => {
      if (next >= order.length) return;
      const i = order[next++];
      if (useBitmaps) {
        fetch(frameUrl(i)).then((r) => r.ok ? r.blob() : null).then((blob) => {
          if (blob) {
            frames[i] = blob;
            arrived(i);
          }
        }, () => {
        }).finally(pump);
      } else {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          frames[i] = img;
          arrived(i);
          pump();
        };
        img.onerror = pump;
        img.src = frameUrl(i);
      }
    };
    for (let k = 0; k < 6; k++) pump();
  }
  if ("IntersectionObserver" in window) {
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        loadFrames();
        near.disconnect();
      }
    }, { rootMargin: "200% 0px" });
    near.observe(root);
  } else {
    loadFrames();
  }
  const styleCache = /* @__PURE__ */ new WeakMap();
  const setStyle = (el, prop, value) => {
    let c = styleCache.get(el);
    if (!c) {
      c = {};
      styleCache.set(el, c);
    }
    if (c[prop] === value) return;
    c[prop] = value;
    el.style[prop] = value;
  };
  let curP = 0;
  let targetP = 0;
  let lastTime = performance.now();
  let livingIdx = LIVING_START_FRAME;
  let livingDir = 1;
  let lastLivingStep = performance.now();
  let isVisible = false;
  let rafId = null;
  function tick(now) {
    if (!isVisible) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(tick);
    const rect = root.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.bottom < 0 || rect.top > vh) {
      lastTime = now;
      return;
    }
    const dt = Math.min(0.1, (now - lastTime) / 1e3);
    lastTime = now;
    const travel2 = Math.max(1, rect.height - vh);
    targetP = clamp(-rect.top / travel2, 0, 1);
    const easeRate = reduce ? 60 : 12;
    curP += (targetP - curP) * (1 - Math.exp(-dt * easeRate));
    if (Math.abs(targetP - curP) < 1e-4) curP = targetP;
    if (power) {
      const isMobile = window.innerWidth <= 860;
      const fadeThreshold = 0.32;
      const alpha = clamp(1 - curP / fadeThreshold, 0, 1);
      const shift = (1 - alpha) * (isMobile ? -24 : -36);
      setStyle(power, "opacity", alpha.toFixed(3));
      if (isMobile) {
        setStyle(power, "transform", `translate(-50%, -50%) translateY(${shift.toFixed(1)}px)`);
      } else {
        setStyle(power, "transform", `translateY(-50%) translateX(${shift.toFixed(1)}px)`);
      }
      setStyle(power, "pointerEvents", alpha > 0.05 ? "auto" : "none");
      const hiddenNow = String(alpha < 0.05);
      if (power.getAttribute("aria-hidden") !== hiddenNow) power.setAttribute("aria-hidden", hiddenNow);
    }
    if (curP < TRANS_SCROLL_THRESHOLD) {
      const transProgress = curP / TRANS_SCROLL_THRESHOLD;
      const targetFrame = Math.round(transProgress * TRANS_END_FRAME);
      drawFrame(targetFrame);
      if (content.classList.contains("is-visible")) {
        content.classList.remove("is-visible");
      }
      if (hint) {
        setStyle(hint, "opacity", Math.max(0, 1 - curP * 4).toFixed(3));
      }
    } else {
      if (!content.classList.contains("is-visible")) {
        content.classList.add("is-visible");
      }
      if (hint) {
        setStyle(hint, "opacity", "0");
      }
      if (now - lastLivingStep >= 48) {
        lastLivingStep = now;
        livingIdx += livingDir;
        if (livingIdx >= LIVING_END_FRAME) {
          livingIdx = LIVING_END_FRAME;
          livingDir = -1;
        } else if (livingIdx <= LIVING_START_FRAME) {
          livingIdx = LIVING_START_FRAME;
          livingDir = 1;
        }
      }
      drawFrame(livingIdx);
    }
    if (curP > 0.92) {
      const exitProgress = clamp((curP - 0.92) / 0.08, 0, 1);
      setStyle(pin, "opacity", (1 - exitProgress * 0.92).toFixed(3));
      setStyle(pin, "transform", `translateY(${(-exitProgress * 30).toFixed(1)}px)`);
    } else {
      setStyle(pin, "opacity", "1");
      setStyle(pin, "transform", "none");
    }
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      isVisible = entry.isIntersecting;
      if (isVisible) {
        lastTime = performance.now();
        if (!rafId) rafId = requestAnimationFrame(tick);
      }
    },
    { rootMargin: "150px 0px" }
  );
  observer.observe(root);
  return {
    redraw: () => drawFrame(lastDrawnIndex >= 0 ? lastDrawnIndex : 0),
    destroy: () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    }
  };
}
function initTaglineMotion() {
  const canvas = $("#inMotionCanvas");
  const section = $("#insider");
  if (!canvas || !section || reduce) return null;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let isVisible = false;
  let rafId = null;
  const PARTICLE_COUNT = 24;
  const particles = [];
  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * (width || window.innerWidth),
        y: Math.random() * (height || window.innerHeight),
        radius: 1.2 + Math.random() * 2.2,
        speedY: -(0.18 + Math.random() * 0.35),
        speedX: (Math.random() - 0.5) * 0.25,
        alpha: 0.15 + Math.random() * 0.45,
        baseAlpha: 0.15 + Math.random() * 0.45,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseAngle: Math.random() * Math.PI * 2,
        // Alternate between leaf green and science bioluminescent emerald/gold
        colorType: i % 3 === 0 ? "gold" : i % 3 === 1 ? "science" : "nature"
      });
    }
  }
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  function onPointerMove(e) {
    if (!isVisible) return;
    const h = height || window.innerHeight;
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 35;
    mouse.targetY = (e.offsetY / h - 0.5) * 25;
  }
  function onPointerLeave() {
    mouse.targetX = 0;
    mouse.targetY = 0;
  }
  section.addEventListener("pointermove", onPointerMove, { passive: true });
  section.addEventListener("pointerleave", onPointerLeave, { passive: true });
  function resize() {
    const rect = section.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    if (particles.length === 0) initParticles();
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();
  const waves = [
    { yFraction: 0.78, amplitude: 22, wavelength: 35e-4, speed: 12e-4, color: "rgba(36, 80, 42, 0.05)", stroke: "rgba(36, 80, 42, 0.12)" },
    { yFraction: 0.84, amplitude: 28, wavelength: 28e-4, speed: -9e-4, color: "rgba(59, 177, 130, 0.04)", stroke: "rgba(59, 177, 130, 0.10)" },
    { yFraction: 0.9, amplitude: 34, wavelength: 22e-4, speed: 16e-4, color: "rgba(217, 159, 54, 0.035)", stroke: "rgba(217, 159, 54, 0.08)" }
  ];
  let time = 0;
  function draw(now) {
    if (!isVisible) {
      rafId = null;
      return;
    }
    time = now;
    ctx.clearRect(0, 0, width, height);
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;
    for (let w = 0; w < waves.length; w++) {
      const wave = waves[w];
      const baseY = height * wave.yFraction + mouse.y * (w + 1) * 0.3;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, baseY);
      for (let x = 0; x <= width; x += 16) {
        const offset = Math.sin(x * wave.wavelength + time * wave.speed + w) * wave.amplitude + Math.cos(x * wave.wavelength * 0.6 - time * wave.speed * 0.8) * (wave.amplitude * 0.4);
        ctx.lineTo(x, baseY + offset);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = wave.color;
      ctx.fill();
      ctx.strokeStyle = wave.stroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(time * 1e-3 + i) * 0.15;
      p.pulseAngle += p.pulseSpeed;
      p.alpha = p.baseAlpha + Math.sin(p.pulseAngle) * 0.15;
      if (p.y < -20) {
        p.y = height + 20;
        p.x = Math.random() * width;
      }
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      const px = p.x + mouse.x * 0.4;
      const py = p.y + mouse.y * 0.4;
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      let fillCol;
      let glowCol;
      if (p.colorType === "gold") {
        fillCol = `rgba(217, 159, 54, ${p.alpha})`;
        glowCol = `rgba(217, 159, 54, ${p.alpha * 0.4})`;
      } else if (p.colorType === "science") {
        fillCol = `rgba(45, 184, 132, ${p.alpha})`;
        glowCol = `rgba(45, 184, 132, ${p.alpha * 0.4})`;
      } else {
        fillCol = `rgba(62, 148, 79, ${p.alpha})`;
        glowCol = `rgba(62, 148, 79, ${p.alpha * 0.4})`;
      }
      ctx.fillStyle = fillCol;
      ctx.shadowColor = glowCol;
      ctx.shadowBlur = p.radius * 3;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    rafId = requestAnimationFrame(draw);
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      isVisible = entry.isIntersecting;
      section.classList.toggle("is-idle", !isVisible);
      if (isVisible && !rafId) {
        rafId = requestAnimationFrame(draw);
      }
    },
    { rootMargin: "100px 0px" }
  );
  observer.observe(section);
  return {
    destroy: () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      if (rafId) cancelAnimationFrame(rafId);
    }
  };
}
const CONFIG = {
  displacementScale: 6,
  wobbleAmplitude: 1.06
};
function injectFilterDefs() {
  if (document.getElementById("droplet-filters")) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "droplet-filters";
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svg.style.width = "0";
  svg.style.height = "0";
  svg.style.pointerEvents = "none";
  svg.style.overflow = "hidden";
  svg.innerHTML = `
    <defs>
      <filter id="drop-refract" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="${CONFIG.displacementScale}" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);
  const isChromium = !!window.chrome && (navigator.userAgent.indexOf("Chrome") > -1 || navigator.userAgent.indexOf("Chromium") > -1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isChromium && !isSafari) {
    document.documentElement.classList.add("has-svg-refract");
  }
}
function setupDropletBadges() {
  const badges = $$(".facts .fact");
  if (!badges.length) return;
  badges.forEach((badge, idx) => {
    let liquid = badge.querySelector(".fact-liquid");
    if (!liquid) {
      liquid = document.createElement("div");
      liquid.className = "fact-liquid";
      liquid.setAttribute("aria-hidden", "true");
      badge.appendChild(liquid);
    }
    if (!liquid.querySelector(".drop-glint-bar")) {
      const glint = document.createElement("div");
      glint.className = "drop-glint-bar";
      glint.setAttribute("aria-hidden", "true");
      liquid.appendChild(glint);
    }
    if (!badge.querySelector(".micro-drop")) {
      const md1 = document.createElement("div");
      md1.className = "micro-drop md-1";
      md1.setAttribute("aria-hidden", "true");
      const md2 = document.createElement("div");
      md2.className = "micro-drop md-2";
      md2.setAttribute("aria-hidden", "true");
      badge.appendChild(md1);
      badge.appendChild(md2);
      if (idx !== 1) {
        const md3 = document.createElement("div");
        md3.className = "micro-drop md-3";
        md3.setAttribute("aria-hidden", "true");
        badge.appendChild(md3);
      }
      setTimeout(() => {
        badge.querySelectorAll(".micro-drop").forEach((md) => md.classList.add("settled"));
      }, 700 + idx * 120);
    }
    if (reduce) return;
    badge.addEventListener("pointerenter", () => {
      const r1 = document.createElement("div");
      r1.className = "droplet-ripple";
      r1.setAttribute("aria-hidden", "true");
      const r2 = document.createElement("div");
      r2.className = "droplet-ripple r2";
      r2.setAttribute("aria-hidden", "true");
      badge.appendChild(r1);
      badge.appendChild(r2);
      setTimeout(() => {
        r1.remove();
        r2.remove();
      }, 950);
      {
        gsapWithCSS.killTweensOf(badge);
        gsapWithCSS.fromTo(
          badge,
          { "--drop-scale": 1 },
          {
            "--drop-scale": CONFIG.wobbleAmplitude,
            duration: 0.16,
            ease: "power2.out",
            yoyo: true,
            repeat: 1,
            onComplete: () => {
              gsapWithCSS.to(badge, {
                "--drop-scale": 1,
                duration: 0.45,
                ease: "elastic.out(1, 0.4)"
              });
            }
          }
        );
      }
    });
    badge.addEventListener("pointerdown", () => {
      {
        gsapWithCSS.to(badge, {
          "--drop-sx": 1.05,
          "--drop-sy": 0.93,
          duration: 0.12,
          ease: "power1.out"
        });
      }
    });
    const releaseSquish = () => {
      {
        gsapWithCSS.to(badge, {
          "--drop-sx": 1,
          "--drop-sy": 1,
          duration: 0.45,
          ease: "elastic.out(1.2, 0.4)"
        });
      }
    };
    badge.addEventListener("pointerup", releaseSquish);
    badge.addEventListener("pointerleave", releaseSquish);
    badge.addEventListener("pointercancel", releaseSquish);
  });
}
function setupShineControls() {
  const heroStage = $("#home");
  if (!heroStage) return;
  const togglePause = (shouldPause) => {
    if (shouldPause) {
      document.body.classList.add("hero-shine-paused");
    } else {
      document.body.classList.remove("hero-shine-paused");
    }
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      togglePause(!entry.isIntersecting);
    }, { threshold: 0.05 });
    observer.observe(heroStage);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      togglePause(true);
    } else {
      togglePause(false);
    }
  });
}
function initPremiumFx() {
  injectFilterDefs();
  setupDropletBadges();
  setupShineControls();
}
async function boot() {
  setLoad(8);
  initCart();
  buildMarquee();
  renderCart();
  initNav();
  setLoad(20);
  try {
    if (document.fonts) await Promise.race([Promise.all(["850 40px Archivo", "600 20px Archivo", "600 24px Caveat"].map((f) => document.fonts.load(f))).then(() => document.fonts.ready), new Promise((r) => setTimeout(r, 2500))]);
  } catch (e) {
  }
  setLoad(36);
  try {
    state.heroApi = initHeroJar();
  } catch (err) {
    console.warn("hero jar unavailable", err);
  }
  try {
    state.layeredDepth = initLayeredDepth();
  } catch (err) {
    console.warn("layered depth unavailable", err);
  }
  try {
    initMossReveal();
  } catch (err) {
    console.warn("moss reveal unavailable", err);
  }
  Object.assign(thumbs, SHOTS);
  initLightbox();
  setLoad(88);
  try {
    state.ayurApi = initAyurveda();
  } catch (err) {
    console.warn("ayurveda video unavailable", err);
  }
  try {
    initPages();
  } catch (err) {
    console.warn("page tracking unavailable", err);
  }
  setLoad(96);
  initSmooth();
  initScroll();
  initTransitions();
  try {
    state.handOffApi = initProductHandOff();
  } catch (err) {
    console.warn("product hand-off unavailable", err);
  }
  try {
    state.taglineMotion = initTaglineMotion();
  } catch (err) {
    console.warn("tagline motion unavailable", err);
  }
  window.state = state;
  intro();
  try {
    initPremiumFx();
  } catch (err) {
    console.warn("premium fx unavailable", err);
  }
}
const failSafe = setTimeout(() => $("#loader").classList.add("done"), 25e3);
boot().catch((err) => {
  console.error(err);
  $("#loader").classList.add("done");
}).finally(() => clearTimeout(failSafe));
