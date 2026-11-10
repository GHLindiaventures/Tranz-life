// Product hand-off transition between #home and #lineup.
// Ultra-smooth, zero-lag single-canvas architecture:
// The settled hero product lifts off the stone plinth, flies down in a 3D arc,
// and lands directly in its slot on page 2, where all 5 products stand as interactive 3D models.
import { ScrollTrigger } from '../../lib/gsap.js';
import { PRODUCTS } from '../../data/products.js';
import { jarLayer } from '../products/jar-layer.js';
import { state } from '../../app/state.js';
import { $, $$ } from '../../utils/dom.js';
import { clamp, lerp } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

function initProductHandOff() {
  const flightCanvas = $('#flightCanvas');
  const lineupSec = $('#lineup');
  const heroStage = $('#home');
  if (!flightCanvas || !lineupSec || !heroStage || !ScrollTrigger) return null;

  const isMobile = window.innerWidth < 768;

  // 1. Single full-screen Three.js layer for flight and lineup
  const L = jarLayer(flightCanvas);
  const flightJars = PRODUCTS.map((p, i) => L.jar(p, i));
  flightJars.forEach(j => { j.G.visible = false; });

  const slotEls = PRODUCTS.map(p => document.querySelector(`.lineup-slot[data-slot="${p.id}"]`));
  const items = $$('.lineup-item');

  // Pre-calculate document coordinates of slots to avoid getBoundingClientRect() during scroll
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
    item.addEventListener('pointerenter', () => { hoveredIndex = i; });
    item.addEventListener('pointerleave', () => { if (hoveredIndex === i) hoveredIndex = -1; });
  });

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', e => {
    mouse.tx = (e.clientX / window.innerWidth) - 0.5;
    mouse.ty = (e.clientY / window.innerHeight) - 0.5;
  });

  // Track active transition state
  let activeIndex = -1;
  let plinthBase = null;
  let animProgress = 0;
  let isLoopRunning = false;
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

  // Update item DOM opacity and subtle translation
  function updateLineupDOM(prog, activeIdx) {
    items.forEach((item, i) => {
      if (i === activeIdx) {
        item.style.opacity = '1';
        item.style.transform = 'none';
      } else {
        const stagger = (i > activeIdx ? i - 1 : i) * 0.08;
        const p = clamp((prog - 0.20 - stagger) / 0.45, 0, 1);
        const ease = p * p * (3 - 2 * p);
        item.style.opacity = ease.toFixed(3);
        item.style.transform = `translate3d(0, ${(30 * (1 - ease)).toFixed(1)}px, 0)`;
      }
    });
  }

  // Unified 60fps render loop
  let isHandOffVisible = true;

  function loop(now) {
    if (!isHandOffVisible) {
      rafId = 0;
      return;
    }
    rafId = requestAnimationFrame(loop);
    const scrollY = window.scrollY;

    // Check if visible in transition zone or inside lineup section without layout thrashing
    const inLineupZone = (scrollY + window.innerHeight > lineupTop && scrollY < lineupTop + lineupHeight);
    const inFlightZone = (scrollY >= 0 && scrollY < lineupTop + 100);

    if (!inLineupZone && !inFlightZone) {
      if (flightCanvas.classList.contains('active')) {
        flightCanvas.classList.remove('active');
      }
      return;
    }

    if (!flightCanvas.classList.contains('active')) {
      flightCanvas.classList.add('active');
    }

    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    const tTime = (now || performance.now()) * 0.001;

    const p = animProgress;
    const activeIdx = (activeIndex >= 0 ? activeIndex : 0);
    const plinth = plinthBase || {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.58,
      h: slotMetrics[activeIdx] ? slotMetrics[activeIdx].h : 220,
      rotY: -0.35
    };

    // Current on-screen plinth coordinates (tracks hero scroll naturally)
    const plinthScreenX = plinth.x;
    const plinthScreenY = plinth.y - scrollY - plinth.h / 2;

    PRODUCTS.forEach((prod, i) => {
      const jar = flightJars[i];
      const slot = slotMetrics[i] || { docX: window.innerWidth / 2, docY: scrollY + 400, h: 220 };
      const slotScreenX = slot.docX;
      const slotScreenY = slot.docY - scrollY;
      const isHovered = (i === hoveredIndex);
      const restRotY = (prod.shape === 'tube' ? -0.32 : -0.38);

      if (i === activeIdx) {
        // Active jar: flight interpolation from plinth to slot
        let curX, curY, curH, curRotY, curRotX, curRotZ;
        const spinCount = isMobile ? 1 : 1.5;

        if (p <= 0.15) {
          // Phase 1: Lift off the stone plinth
          const t = p / 0.15;
          const lift = Math.sin(t * Math.PI * 0.5);
          curX = plinthScreenX;
          curY = plinthScreenY - lift * 32;
          curH = lerp(plinth.h, slot.h, p * 0.15); // Perfectly smooth size transition, no artificial bump
          curRotY = plinth.rotY + t * 0.25;
          curRotX = 0.04 - lift * 0.02;
          curRotZ = -0.02;
        } else if (p <= 0.90) {
          // Phase 2: Parabolic flight toward slot
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
          // Phase 3: Settle into slot
          const t = (p - 0.90) / 0.10;
          const easeT = t * t * (3 - 2 * t);
          curX = slotScreenX;
          curY = slotScreenY;
          curH = slot.h;
          curRotY = lerp(restRotY, restRotY + (isHovered ? mouse.x * 0.8 : Math.sin(tTime * 0.85 + i) * 0.06), easeT);
          curRotX = isHovered ? (mouse.y * 0.2) : 0;
          curRotZ = 0;
        }

        jar.G.visible = (p > 0 || scrollY > 10);
        L.place(jar.G, curX, curY);
        L.size(jar, Math.max(1, curH));
        jar.G.rotation.set(curRotX, curRotY, curRotZ);
      } else {
        // Other 4 lineup jars: stay locked to their slots in lineup
        jar.G.visible = (p >= 0.18 || p >= 1 || inLineupZone);
        L.place(jar.G, slotScreenX, slotScreenY);
        L.size(jar, Math.max(1, slot.h));

        const targetRotY = isHovered ? (restRotY + mouse.x * 0.8) : (restRotY + Math.sin(tTime * 0.85 + i * 1.2) * 0.06);
        const targetRotX = isHovered ? (mouse.y * 0.2) : 0;
        jar.G.rotation.y += (targetRotY - jar.G.rotation.y) * 0.1;
        jar.G.rotation.x += (targetRotX - jar.G.rotation.x) * 0.1;
        jar.G.rotation.z = 0;
      }
    });

    L.renderer.render(L.scene, L.cam);
  }

  let heroVisible = true;
  let lineupVisible = false;

  const handOffObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target === heroStage) heroVisible = entry.isIntersecting;
      if (entry.target === lineupSec) lineupVisible = entry.isIntersecting;
    });
    isHandOffVisible = heroVisible || lineupVisible;
    if (isHandOffVisible && !rafId) {
      rafId = requestAnimationFrame(loop);
    }
  }, { rootMargin: '100px 0px' });

  handOffObserver.observe(heroStage);
  handOffObserver.observe(lineupSec);

  rafId = requestAnimationFrame(loop);

  function handleResize() {
    measureSlots();
  }
  window.addEventListener('resize', handleResize);

  // Reduced motion: all 5 3D models resting in slots, simple fade
  if (reduce) {
    animProgress = 1;
    flightJars.forEach(j => { j.G.visible = true; });
    updateLineupDOM(1, -1);
    return { flightJars, L };
  }

  // ScrollTrigger timeline: snappy scrub (0.3s) for crisp, lag-free response
  ScrollTrigger.create({
    trigger: lineupSec,
    start: 'top bottom',
    end: 'top 15%',
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
          if (targetSlot) targetSlot.classList.add('landing');
          flightCanvas.classList.add('active');
        }
      }
    },
    onLeave: () => {
      animProgress = 1;
      updateLineupDOM(1, activeIndex);
      slotEls.forEach(s => { if (s) s.classList.remove('landing'); });
    },
    onEnterBack: () => {
      if (activeIndex >= 0) {
        const targetSlot = slotEls[activeIndex];
        if (targetSlot) targetSlot.classList.add('landing');
        flightCanvas.classList.add('active');
      }
    },
    onLeaveBack: () => {
      animProgress = 0;
      const heroApi = state.heroApi;
      if (heroApi) {
        heroApi.setVisible(true);
        heroApi.hold(false);
      }
      flightJars.forEach(j => { j.G.visible = false; });
      slotEls.forEach(s => { if (s) s.classList.remove('landing'); });
      updateLineupDOM(0, -1);
      flightCanvas.classList.remove('active');
      activeIndex = -1;
      plinthBase = null;
    },
    onUpdate: (self) => {
      const p = self.progress;
      animProgress = p;

      // Handle direct scroll into transition
      if (activeIndex === -1 && p > 0 && p < 1) {
        const heroApi = state.heroApi;
        if (heroApi) {
          heroApi.hold(true);
          plinthBase = getPlinthBase();
          if (plinthBase) {
            activeIndex = plinthBase.index;
            heroApi.setVisible(false);
            const targetSlot = slotEls[activeIndex];
            if (targetSlot) targetSlot.classList.add('landing');
            flightCanvas.classList.add('active');
          }
        }
      }

      if (activeIndex < 0) return;

      if (p >= 0.98) {
        const targetSlot = slotEls[activeIndex];
        if (targetSlot) targetSlot.classList.remove('landing');
      } else {
        const targetSlot = slotEls[activeIndex];
        if (targetSlot) targetSlot.classList.add('landing');
      }

      updateLineupDOM(p, activeIndex);
    }
  });

  return { flightJars, L };
}

export { initProductHandOff };
