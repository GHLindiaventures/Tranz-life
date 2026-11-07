// Product hand-off transition between #home and #lineup.
// The settled hero product lifts off the stone plinth, flies down in an arc, spins,
// and lands exactly in its lineup slot, while the other 4 products stand as live 3D models in their slots.
import { ScrollTrigger, gsap, hasGsap } from '../../lib/gsap.js';
import { PRODUCTS } from '../../data/products.js';
import { jarLayer } from '../products/jar-layer.js';
import { state } from '../../app/state.js';
import { $, $$ } from '../../utils/dom.js';
import { clamp, lerp } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

function initProductHandOff() {
  const flightCanvas = $('#flightCanvas');
  const lineupCanvas = $('#lineupCanvas');
  const lineupSec = $('#lineup');
  const heroStage = $('#home');
  if (!flightCanvas || !lineupCanvas || !lineupSec || !heroStage || !hasGsap || !ScrollTrigger) return null;

  const isMobile = window.innerWidth < 768;

  // 1. Setup Three.js flight layer for cross-section flight
  const flightL = jarLayer(flightCanvas);
  const flightJars = PRODUCTS.map((p, i) => flightL.jar(p, i));
  flightJars.forEach(j => { j.G.visible = false; });

  let isFlightRendering = false;
  let flightRafId = 0;

  function renderFlight() {
    if (!isFlightRendering) return;
    flightL.renderer.render(flightL.scene, flightL.cam);
    flightRafId = requestAnimationFrame(renderFlight);
  }

  function startFlight() {
    if (isFlightRendering) return;
    isFlightRendering = true;
    flightCanvas.classList.add('active');
    flightL.resize();
    flightRafId = requestAnimationFrame(renderFlight);
  }

  function stopFlight() {
    isFlightRendering = false;
    cancelAnimationFrame(flightRafId);
    flightCanvas.classList.remove('active');
  }

  // 2. Setup Three.js Lineup layer: all 5 products stand as 3D models in their slots
  const lineupL = jarLayer(lineupCanvas);
  const lineupJars = PRODUCTS.map((p, i) => lineupL.jar(p, i));
  const items = $$('.lineup-item');
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

  function layoutLineup() {
    lineupL.resize();
    const c = lineupCanvas.getBoundingClientRect();
    if (c.width <= 0 || c.height <= 0) return;

    PRODUCTS.forEach((p, i) => {
      const slot = document.querySelector(`.lineup-slot[data-slot="${p.id}"]`);
      const jar = lineupJars[i];
      if (!slot || !jar) return;
      const r = slot.getBoundingClientRect();
      const x = r.left - c.left + r.width / 2;
      const y = r.top - c.top + r.height / 2;
      const h = r.height * 0.88 * jar.fit;
      lineupL.size(jar, Math.max(1, h));
      lineupL.place(jar.G, x, y);
    });
  }

  layoutLineup();

  // Render loop for lineup 3D models (only renders when #lineup is visible)
  let lineupRafId = 0;
  function renderLineup(now) {
    lineupRafId = requestAnimationFrame(renderLineup);
    const r = lineupSec.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= window.innerHeight) return;

    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    const t = (now || performance.now()) * 0.001;

    lineupJars.forEach((jar, i) => {
      if (!jar.G.visible) return;
      const isHovered = (i === hoveredIndex);
      const baseRotY = (jar.p.shape === 'tube' ? -0.32 : -0.38);
      const targetRotY = isHovered ? (baseRotY + mouse.x * 0.85) : (baseRotY + Math.sin(t * 0.85 + i * 1.2) * 0.07);
      const targetRotX = isHovered ? (mouse.y * 0.22) : 0;
      jar.G.rotation.y += (targetRotY - jar.G.rotation.y) * 0.1;
      jar.G.rotation.x += (targetRotX - jar.G.rotation.x) * 0.1;
    });

    lineupL.renderer.render(lineupL.scene, lineupL.cam);
  }
  lineupRafId = requestAnimationFrame(renderLineup);

  function handleResize() {
    flightL.resize();
    layoutLineup();
  }
  window.addEventListener('resize', handleResize);

  // Reduced motion: all 5 3D models visible, gentle fade-up
  if (reduce) {
    lineupJars.forEach(j => { j.G.visible = true; });
    items.forEach((item, idx) => {
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
    return { flightJars, lineupJars, flightL, lineupL };
  }

  // 3. Hand-off state tracking
  let activeIndex = -1;
  let startSnapshot = null;

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

  // Update non-landing lineup cards during scroll
  function updateOtherItems(prog, activeIdx) {
    items.forEach((item, i) => {
      if (i === activeIdx) {
        item.style.opacity = '1';
        item.style.transform = 'none';
      } else {
        const staggerOffset = (i > activeIdx ? i - 1 : i) * 0.08;
        const itemProg = clamp((prog - 0.20 - staggerOffset) / 0.45, 0, 1);
        const easeProg = itemProg * itemProg * (3 - 2 * itemProg);
        item.style.opacity = easeProg.toFixed(3);
        item.style.transform = `translate3d(0, ${(36 * (1 - easeProg)).toFixed(1)}px, 0)`;
      }
    });
  }

  // 4. ScrollTrigger timeline scrubbed from #lineup top bottom to top 15%
  ScrollTrigger.create({
    trigger: lineupSec,
    start: 'top bottom',
    end: 'top 15%',
    scrub: 0.8,
    onEnter: () => {
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
          lineupJars.forEach((j, i) => { j.G.visible = (i !== activeIndex); });
          startFlight();
        }
      }
    },
    onLeave: () => {
      flightJars.forEach(j => { j.G.visible = false; });
      lineupJars.forEach(j => { j.G.visible = true; });
      $$('.lineup-slot').forEach(s => s.classList.remove('landing'));
      items.forEach(item => {
        item.style.opacity = '1';
        item.style.transform = 'none';
      });
      stopFlight();
    },
    onEnterBack: () => {
      if (activeIndex >= 0) {
        startFlight();
        const targetSlot = document.querySelector(`.lineup-slot[data-slot="${PRODUCTS[activeIndex].id}"]`);
        if (targetSlot) targetSlot.classList.add('landing');
        flightJars.forEach((j, i) => { j.G.visible = (i === activeIndex); });
        lineupJars.forEach((j, i) => { j.G.visible = (i !== activeIndex); });
      }
    },
    onLeaveBack: () => {
      const heroApi = state.heroApi;
      if (heroApi) {
        heroApi.setVisible(true);
        heroApi.hold(false);
      }
      flightJars.forEach(j => { j.G.visible = false; });
      lineupJars.forEach(j => { j.G.visible = true; });
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

      // Handle direct scroll into transition
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
            lineupJars.forEach((j, i) => { j.G.visible = (i !== activeIndex); });
            startFlight();
          }
        }
      }

      if (activeIndex < 0) return;
      const jar = flightJars[activeIndex];
      const slot = getSlotMetrics(activeIndex);
      if (!jar || !slot) return;

      // When p >= 0.99 (completely landed in lineup)
      if (p >= 0.99) {
        jar.G.visible = false;
        lineupJars[activeIndex].G.visible = true;
        if (slot.slotEl) slot.slotEl.classList.remove('landing');
        items.forEach(item => {
          item.style.opacity = '1';
          item.style.transform = 'none';
        });
        stopFlight();
        return;
      }

      // In flight (0 < p < 0.99)
      startFlight();
      jar.G.visible = true;
      lineupJars[activeIndex].G.visible = false;
      if (slot.slotEl) slot.slotEl.classList.add('landing');
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
        curRotY = lerp(start.rotY, (jar.p.shape === 'tube' ? -0.32 : -0.38), easeT) + Math.sin(t * Math.PI) * (Math.PI * 2 * spinCount);
        curRotX = 0.02 + Math.sin(t * Math.PI) * 0.12;
        curRotZ = -0.02 + Math.sin(t * Math.PI) * 0.08;
      } else {
        // Phase 3: Settle into slot
        const t = (p - 0.85) / 0.14;
        const easeT = t * t * (3 - 2 * t);
        curX = slot.x;
        curY = slot.y;
        curH = slot.h;
        curRotY = lerp(curRotY || 0, (jar.p.shape === 'tube' ? -0.32 : -0.38), easeT);
        curRotX = 0;
        curRotZ = 0;
      }

      // Map to 3D world space coordinates on flight canvas
      flightL.place(jar.G, curX, curY);
      flightL.size(jar, Math.max(1, curH));
      jar.G.rotation.set(curRotX, curRotY, curRotZ);
    }
  });

  return { flightJars, lineupJars, flightL, lineupL };
}

export { initProductHandOff };
