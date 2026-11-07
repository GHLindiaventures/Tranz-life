// Product hand-off transition between #home and #lineup.
// The settled hero product lifts off the stone plinth, flies down in an arc, spins,
// and lands exactly in its lineup slot, while the other 4 products rise into their slots.
import { ScrollTrigger, gsap, hasGsap } from '../../lib/gsap.js';
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
  if (!flightCanvas || !lineupSec || !heroStage || !hasGsap || !ScrollTrigger) return null;

  const isMobile = window.innerWidth < 768;

  // 1. Setup Three.js flight layer using jarLayer
  const L = jarLayer(flightCanvas);
  const flightJars = PRODUCTS.map((p, i) => L.jar(p, i));
  flightJars.forEach(j => { j.G.visible = false; });

  let isRendering = false;
  let rafId = 0;

  function renderFlight() {
    if (!isRendering) return;
    L.renderer.render(L.scene, L.cam);
    rafId = requestAnimationFrame(renderFlight);
  }

  function startFlight() {
    if (isRendering) return;
    isRendering = true;
    flightCanvas.classList.add('active');
    L.resize();
    rafId = requestAnimationFrame(renderFlight);
  }

  function stopFlight() {
    isRendering = false;
    cancelAnimationFrame(rafId);
    flightCanvas.classList.remove('active');
  }

  window.addEventListener('resize', () => {
    L.resize();
  });

  // Reduced motion: simple fade-in of lineup without 3D flight
  if (reduce) {
    $$('.lineup-item').forEach((item, idx) => {
      gsap.fromTo(
        item,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: idx * 0.08,
          scrollTrigger: {
            trigger: lineupSec,
            start: 'top 80%',
            once: true
          }
        }
      );
    });
    return null;
  }

  // 2. Hand-off state tracking
  let activeIndex = -1;
  let startSnapshot = null;
  const items = $$('.lineup-item');

  function getSlotMetrics(productIndex) {
    const p = PRODUCTS[productIndex];
    if (!p) return null;
    const slot = document.querySelector(`.lineup-slot[data-slot="${p.id}"]`);
    if (!slot) return null;
    const r = slot.getBoundingClientRect();
    const fit = flightJars[productIndex] ? flightJars[productIndex].fit : 1;
    return {
      slot,
      slotEl: slot,
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      h: r.height * 0.88 * fit
    };
  }

  function getPlinthMetrics() {
    const heroApi = state.heroApi;
    if (!heroApi || !heroApi.current) return null;
    const cur = heroApi.current();
    const canvas = cur.canvas || $('#heroCanvas');
    const c = canvas.getBoundingClientRect();
    const fit = cur.jarFit || 1;
    const pxH = cur.table.ph * fit;
    return {
      index: cur.index,
      product: cur.product,
      x: c.left + cur.table.x,
      y: c.top + cur.table.y - pxH / 2,
      h: pxH,
      rotY: cur.rotY || 0,
      fit
    };
  }

  // Set initial opacity and transform for non-hero lineup items
  function updateOtherItems(prog, activeIdx) {
    items.forEach((item, i) => {
      if (i === activeIdx) {
        // Active item stays visible; its static shot opacity is controlled by .landing class
        item.style.opacity = '1';
        item.style.transform = 'none';
      } else {
        // Other items rise & fade in between prog 0.25 and 0.85 with stagger
        const staggerOffset = (i > activeIdx ? i - 1 : i) * 0.08;
        const itemProg = clamp((prog - 0.25 - staggerOffset) / 0.45, 0, 1);
        const easeProg = itemProg * itemProg * (3 - 2 * itemProg);
        item.style.opacity = easeProg.toFixed(3);
        item.style.transform = `translate3d(0, ${(36 * (1 - easeProg)).toFixed(1)}px, 0)`;
      }
    });
  }

  // 3. ScrollTrigger timeline scrubbed from #lineup top bottom to top 15%
  ScrollTrigger.create({
    trigger: lineupSec,
    start: 'top bottom',
    end: 'top 15%',
    scrub: 0.8,
    onEnter: () => {
      // Starting scroll down into lineup
      const heroApi = state.heroApi;
      if (heroApi) {
        heroApi.hold(true);
        startSnapshot = getPlinthMetrics();
        if (startSnapshot) {
          activeIndex = startSnapshot.index;
          heroApi.setVisible(false);
          const targetSlot = document.querySelector(`.lineup-slot[data-slot="${PRODUCTS[activeIndex].id}"]`);
          if (targetSlot) targetSlot.classList.add('landing');
          flightJars.forEach((j, i) => { j.G.visible = (i === activeIndex); });
          startFlight();
        }
      }
    },
    onLeave: () => {
      // Scrolled past lineup further down the page
      flightJars.forEach(j => { j.G.visible = false; });
      $$('.lineup-slot').forEach(s => s.classList.remove('landing'));
      items.forEach(item => {
        item.style.opacity = '1';
        item.style.transform = 'none';
      });
      stopFlight();
    },
    onEnterBack: () => {
      // Scrolling back up into lineup from below
      if (activeIndex >= 0) {
        startFlight();
        const targetSlot = document.querySelector(`.lineup-slot[data-slot="${PRODUCTS[activeIndex].id}"]`);
        if (targetSlot) targetSlot.classList.add('landing');
        flightJars.forEach((j, i) => { j.G.visible = (i === activeIndex); });
      }
    },
    onLeaveBack: () => {
      // Scrolled completely back up to home
      const heroApi = state.heroApi;
      if (heroApi) {
        heroApi.setVisible(true);
        heroApi.hold(false);
      }
      flightJars.forEach(j => { j.G.visible = false; });
      $$('.lineup-slot').forEach(s => s.classList.remove('landing'));
      items.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translate3d(0, 36px, 0)';
      });
      stopFlight();
      activeIndex = -1;
      startSnapshot = null;
    },
    onUpdate: (self) => {
      const p = self.progress;

      // Handle jumping or re-entry if activeIndex wasn't set yet
      if (activeIndex === -1 && p > 0 && p < 1) {
        const heroApi = state.heroApi;
        if (heroApi) {
          heroApi.hold(true);
          startSnapshot = getPlinthMetrics();
          if (startSnapshot) {
            activeIndex = startSnapshot.index;
            heroApi.setVisible(false);
            const targetSlot = document.querySelector(`.lineup-slot[data-slot="${PRODUCTS[activeIndex].id}"]`);
            if (targetSlot) targetSlot.classList.add('landing');
            flightJars.forEach((j, i) => { j.G.visible = (i === activeIndex); });
            startFlight();
          }
        }
      }

      if (activeIndex < 0) return;
      const jar = flightJars[activeIndex];
      const slot = getSlotMetrics(activeIndex);
      if (!jar || !slot) return;

      // When p >= 1 (completely landed)
      if (p >= 0.99) {
        jar.G.visible = false;
        slot.slotEl.classList.remove('landing');
        items.forEach(item => {
          item.style.opacity = '1';
          item.style.transform = 'none';
        });
        stopFlight();
        return;
      }

      // If in flight (0 < p < 0.99)
      startFlight();
      jar.G.visible = true;
      slot.slotEl.classList.add('landing');
      updateOtherItems(p, activeIndex);

      const start = startSnapshot || {
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.55,
        h: slot.h * 1.15,
        rotY: 0
      };

      let curX, curY, curH, curRotY, curRotX, curRotZ;
      const spinCount = isMobile ? 1 : 1.5;

      if (p <= 0.20) {
        // Phase 1: Lift off the plinth
        const t = p / 0.20;
        const lift = Math.sin(t * Math.PI * 0.5);
        curX = start.x;
        curY = start.y - lift * 45;
        curH = start.h * (1 + lift * 0.06);
        curRotY = start.rotY + t * 0.4;
        curRotX = 0.04 - lift * 0.02;
        curRotZ = -0.02;
      } else if (p <= 0.85) {
        // Phase 2: Parabolic flight toward slot with spins
        const t = (p - 0.20) / 0.65;
        const easeT = t * t * (3 - 2 * t);
        const arcY = -Math.sin(t * Math.PI) * (isMobile ? 35 : 70);
        curX = lerp(start.x, slot.x, easeT);
        curY = lerp(start.y - 45, slot.y, easeT) + arcY;
        curH = lerp(start.h * 1.06, slot.h, easeT);
        curRotY = lerp(start.rotY, 0, easeT) + Math.sin(t * Math.PI) * (Math.PI * 2 * spinCount);
        curRotX = 0.02 + Math.sin(t * Math.PI) * 0.12;
        curRotZ = -0.02 + Math.sin(t * Math.PI) * 0.08;
      } else {
        // Phase 3: Settle into slot
        const t = (p - 0.85) / 0.14;
        const easeT = t * t * (3 - 2 * t);
        curX = slot.x;
        curY = slot.y;
        curH = slot.h;
        curRotY = lerp(curRotY || 0, 0, easeT);
        curRotX = 0;
        curRotZ = 0;
      }

      // Map to 3D world space coordinates
      L.place(jar.G, curX, curY);
      L.size(jar, Math.max(1, curH));
      jar.G.rotation.set(curRotX, curRotY, curRotZ);
    }
  });

  return { flightJars, L };
}

export { initProductHandOff };
