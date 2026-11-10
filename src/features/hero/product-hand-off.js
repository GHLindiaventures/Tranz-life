// Product journey on one fixed #flightCanvas (one WebGL context):
//   hero plinth -> showcase scene (pinned) -> covered by the dark curtain -> products inside the grid cards.
// Scroll drives one progress value P (0..1) through the showcase: see journeyProgress() in showcase-scene.js.
//   0 .. 0.12     the plinth product lifts off and glides to the centre
//   0.12 .. 0.70  pinned scene: spin, reveal, detail
//   0.70 .. 1     the statement's scalloped curtain rises over the pin; the product drifts up and is covered
// Below the curtain, #lineup shows five cards; each product stands on the panel of its card (measured from the DOM).
import { ScrollTrigger } from '../../lib/gsap.js';
import { PRODUCTS } from '../../data/products.js';
import { STORY } from '../../data/product-story.js';
import { jarLayer } from '../products/jar-layer.js';
import { state } from '../../app/state.js';
import { LAYOUT } from '../../app/page-sections.js';
import {
  journeyProgress, calcHoldTransform, populateShowcaseDOM, updateShowcaseDOM, createShowcaseDecor
} from '../showcase/showcase-scene.js';
import { entranceOrder, highlightIndex } from '../showcase/grid-math.js';
import { $, $$ } from '../../utils/dom.js';
import { clamp, ease } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

// cream line-art that slides into the panel from its corners on highlight (decorative; leaf, herb and petal outlines)
const ART = [
  ['a', '<path d="M20 168c10-46 40-82 92-104M20 168c40-6 78-34 92-104-40 4-76 30-92 104z"/><path d="M52 134l22-6M70 108l22-4M44 148l-4-22"/>'],
  ['b', '<path d="M100 188V70M100 120c-26-6-40-26-40-50 26 4 40 22 40 50zM100 96c24-6 38-24 38-48-24 4-38 22-38 48zM100 150c-22-4-34-20-34-40 22 4 34 18 34 40z"/>'],
  ['c', '<path d="M30 160C40 100 80 52 160 40c-6 70-48 118-130 120z"/><path d="M30 160c34-36 66-68 108-98"/>'],
  ['d', '<path d="M100 30c26 26 26 66 0 96-26-30-26-70 0-96zM100 126v62M100 150c-16-4-26-14-30-28M100 164c14-4 24-12 28-26"/>']
];
const ART_HTML = ART.map(([k, d]) => '<span class="lu-art lu-art--' + k + '" aria-hidden="true"><svg viewBox="0 0 200 200">' + d + '</svg></span>').join('');

// offset of an element inside an ancestor from offsetLeft/offsetTop, which ignore CSS transforms and scroll
function offsetWithin(el, anc) {
  let x = 0, y = 0, n = el;
  while (n && n !== anc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x, y };
}

function initProductHandOff() {
  const flightCanvas = $('#flightCanvas');
  const lineupSec = $('#lineup');
  const heroStage = $('#home');
  const showcaseSec = $('#showcase');
  const heroCanvas = $('#heroCanvas');
  const pinEl = $('#lineupPin');
  if (!flightCanvas || !lineupSec || !heroStage || !pinEl || !ScrollTrigger) return null;

  const L = jarLayer(flightCanvas);
  const flightJars = PRODUCTS.map((p, i) => L.jar(p, i));
  flightJars.forEach(j => { j.G.visible = false; });
  const decor = createShowcaseDecor(L);
  const N = PRODUCTS.length;

  const cardEls = PRODUCTS.map(p => document.querySelector(`.lineup-card[data-product="${p.id}"]`));
  const slotEls = PRODUCTS.map(p => document.querySelector(`.lineup-slot[data-slot="${p.id}"]`));
  const itemEls = PRODUCTS.map(p => document.querySelector(`.lineup-item[data-product="${p.id}"]`));
  const shadowEls = slotEls.map(s => s && s.querySelector('.lineup-shadow'));
  // panel tint from the product story colour, plus the line-art inside each panel
  cardEls.forEach((card, i) => { if (card && STORY[i]) card.style.setProperty('--c', STORY[i].c); });
  slotEls.forEach(s => { if (s && !s.querySelector('.lu-art')) s.insertAdjacentHTML('afterbegin', ART_HTML); });
  // the name's letters roll up on highlight: same text, read out once through a screen-reader-only copy
  itemEls.forEach((btn, i) => {
    const n = btn && btn.querySelector('.lineup-name'); if (!n || n.dataset.rolled) return;
    const name = n.textContent.trim(); let k = 0; n.dataset.rolled = '1';
    n.innerHTML = '<span class="sr">' + name + '</span><span aria-hidden="true">' + name.split(/(\s+)/).map(w => /^\s+$/.test(w) ? ' ' : '<span class="lu-w">' + [...w].map(ch => '<span class="lu-ch" style="--i:' + (k++) + '">' + ch + '</span>').join('') + '</span>').join('') + '</span>';
  });
  cardEls.forEach((card, i) => { if (card) card.style.setProperty('--c-deep', 'color-mix(in srgb, ' + STORY[i].c + ' 70%, #1d4424)'); });

  /* ---------- geometry, measured on init, resize, fonts and ScrollTrigger refresh ---------- */
  const geo = { vh: innerHeight, vw: innerWidth, showcaseTop: 0, pinEnd: 0, slots: [], mobile: innerWidth < 768, pinned: false };
  const pageTop = id => { const i = (LAYOUT.pages || []).findIndex(p => p.id === id); return i >= 0 && LAYOUT.tops[i] !== undefined ? LAYOUT.tops[i] : null; };
  function measure() {
    L.resize();
    geo.vh = innerHeight; geo.vw = innerWidth; geo.mobile = innerWidth < 768; 
    const sc = $('#statement');
    const st = pageTop('statement'), sh = pageTop('showcase');
    geo.pinEnd = st != null ? st : (sc ? sc.getBoundingClientRect().top + scrollY : geo.vh * 6);
    geo.showcaseTop = sh != null ? sh : (showcaseSec ? showcaseSec.getBoundingClientRect().top + scrollY : geo.vh);
    // each panel's offset inside the lineup pin (scroll independent, so it stays right while the pin is stuck)
    geo.slots = slotEls.map(slot => {
      if (!slot) return { ox: 0, oy: 0, w: 160, h: 220 };
      const o = offsetWithin(slot, pinEl);
      return { ox: o.x, oy: o.y, w: slot.offsetWidth, h: slot.offsetHeight };
    });
  }
  measure();
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  ScrollTrigger.addEventListener('refreshInit', measure);
  if ('ResizeObserver' in window) { let t; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(measure, 100); }).observe(document.querySelector('main')); }

  /* ---------- input ---------- */
  let hovered = -1;
  cardEls.forEach((card, i) => {
    if (!card) return;
    card.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hovered = i; });
    card.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && hovered === i) hovered = -1; });
    card.addEventListener('focusin', () => { hovered = i; });
    card.addEventListener('focusout', () => { if (hovered === i) hovered = -1; });
  });
  // HOOK (Phase 2): a click on a card asks for that product's showcase. Nothing listens yet, so it is a no-op.
  itemEls.forEach((btn, i) => { if (btn) btn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('tl:showcase', { detail: { index: i, id: PRODUCTS[i].id } }))); });
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; });

  /* ---------- the product leaving the plinth ---------- */
  let active = -1, base = null, lastIdx = -1;
  function capture() {
    const api = state.heroApi; if (!api || !api.current) return false;
    const cur = api.current();
    api.hold(true);
    base = { rotY: cur.rotY, h: cur.table.ph * (cur.jarFit || 1) };
    active = cur.index;
    api.setVisible(false);
    return true;
  }
  function release() {
    const api = state.heroApi;
    if (api) { api.setVisible(true); api.hold(false); }
    active = -1; base = null; lastIdx = -1;
  }
  // plinth position on screen right now (the hero scrolls away under it)
  function plinthNow() {
    const api = state.heroApi, cur = api.current();
    const c = heroCanvas ? heroCanvas.getBoundingClientRect() : { left: 0, top: -scrollY };
    return { x: c.left + cur.table.x, y: c.top + cur.table.y - base.h / 2, h: base.h, rotX: 0.04, rotY: base.rotY, rotZ: -0.012 };
  }

  const restRot = i => (PRODUCTS[i].model === 'rollon' ? -0.32 : -0.38);
  const idleRot = (i, t) => Math.sin(t * 0.85 + i * 1.2) * 0.06;

  // where the product holds still while the page scrolls past it: the middle of the screen
  function viewFor(i) {
    const fit = flightJars[i].fit || 1, vh = geo.vh, m = geo.mobile;
    // phones: at the right edge, smaller, so the page can run down the left side
    return { x: geo.vw * (m ? 0.82 : 0.5), y: vh * (m ? 0.55 : 0.52), h: (m ? Math.min(vh * 0.3, geo.vw * 0.62) : vh * 0.56) * fit };
  }

  /* ---------- the frame loop ---------- */
  let wasOn = false, lastP = -1, last = performance.now();
  const hlv = new Array(N).fill(0);
  const cache = { y: new Array(N).fill(NaN), o: new Array(N).fill(NaN), h: new Array(N).fill(NaN) };

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const sy = scrollY, vh = geo.vh, tTime = now * 0.001;
    const lr = lineupSec.getBoundingClientRect();
    const inLineup = lr.bottom > 0 && lr.top < vh;
    const P = reduce ? 1 : journeyProgress(sy, geo);
    const inJourney = !reduce && sy > 0 && P > 0 && P < 1;
    const on = inJourney || inLineup;

    if (showcaseSec && !reduce && (inJourney || P !== lastP)) { updateShowcaseDOM(showcaseSec, P, tTime); }
    lastP = P;

    if (!on) {
      if (wasOn) { flightCanvas.classList.remove('active'); wasOn = false; }
      if (P <= 0 && active >= 0) release();
      return;
    }
    if (!wasOn) { flightCanvas.classList.add('active'); wasOn = true; }

    // take the product off the plinth as soon as the journey starts; put it back when scrolled home
    if (!reduce && P > 0 && active < 0) { if (!capture()) active = Math.max(0, lastIdx); }
    if (P <= 0 && active >= 0) release();
    const act = active >= 0 ? active : Math.max(0, lastIdx);

    mouse.x += (mouse.tx - mouse.x) * 0.08; mouse.y += (mouse.ty - mouse.y) * 0.08;
    if (act !== lastIdx) { lastIdx = act; if (showcaseSec) populateShowcaseDOM(showcaseSec, act); }

    if (inJourney) {
      // showcase: the product holds still and turns while the page scrolls past it; the curtain covers it at the end
      const start = (active >= 0 && base) ? plinthNow() : { x: geo.vw / 2, y: vh * 0.6, h: vh * 0.25, rotX: 0.04, rotY: -0.35, rotZ: 0 };
      const view = viewFor(act);
      const t = calcHoldTransform(P, start, view, mouse, tTime, geo.mobile);
      PRODUCTS.forEach((prod, i) => {
        const jar = flightJars[i];
        if (i !== act) { jar.G.visible = false; return; }
        jar.G.visible = true;
        L.place(jar.G, t.x, t.y);
        L.size(jar, Math.max(1, t.h));
        jar.G.rotation.set(t.rotX, t.rotY, t.rotZ);
      });
      decor.update(0, act, 0, 0, 1, tTime, true);
      L.renderer.render(L.scene, L.cam);
      return;
    }

    /* ---------- grid: each product stands on its card's panel ---------- */
    // Nothing here moves the cards (they scroll past with the page). Each product turns from a tilt to upright as its
    // card comes up the screen. The colour circle and the line-art follow the pointer; on touch (no hover) the
    // highlight walks through the cards with the scroll instead.
    decor.update(0, act, 0, 0, 1, tTime, true);
    const pr = pinEl.getBoundingClientRect();
    const first = act;
    const c = clamp((vh - lr.top) / (lr.height + vh), 0, 1);
    const cycleIdx = (reduce || canHover) ? -1 : highlightIndex(c, N, first);
    const inView = lr.top < vh * 0.6 && lr.bottom > vh * 0.4;

    PRODUCTS.forEach((prod, i) => {
      const jar = flightJars[i], s = geo.slots[i], card = cardEls[i];
      const order = entranceOrder(i, first, N);                              // the showcase product turns first
      const slotTop = pr.top + s.oy;
      const e = reduce ? 1 : clamp((vh * 0.97 - slotTop - order * vh * 0.035) / (vh * 0.42), 0, 1);
      const eb = ease.back(e);                                              // overshoot, then settle
      const target = hovered >= 0 ? (hovered === i ? 1 : 0) : (inView && cycleIdx === i ? 1 : 0);
      hlv[i] += (target - hlv[i]) * (1 - Math.exp(-dt * 6));
      const hl = hlv[i];

      // card DOM: only a CSS variable and a class, written when they change
      if (card) {
        const rh = Math.round(hl * 100) / 100;
        if (cache.h[i] !== rh) { cache.h[i] = rh; card.style.setProperty('--hl', String(rh)); }
        const on = hl > 0.5; if (card.classList.contains('on') !== on) card.classList.toggle('on', on);
      }
      if (shadowEls[i]) shadowEls[i].style.opacity = clamp(e * 1.4 - 0.2, 0, 1).toFixed(2);

      const sx = pr.left + s.ox + s.w / 2;
      const syy = pr.top + s.oy + s.h * 0.5 + s.h * 0.02 - hl * s.h * 0.02;
      jar.G.visible = e > 0.01 && slotTop < vh * 1.05 && slotTop + s.h > -vh * 0.05;
      L.place(jar.G, sx, syy);
      L.size(jar, Math.max(1, s.h * 0.72 * (jar.fit || 1) * (0.7 + 0.3 * clamp(eb, 0, 1.1)) * (1 - hl * 0.04)));
      const hov = hovered === i;
      jar.G.rotation.set(
        hl * 0.05 + (hov ? mouse.y * 0.15 : 0),
        restRot(i) - (1 - eb) * Math.PI * 1.4 + idleRot(i, tTime) + hl * 0.25 + (hov ? mouse.x * 0.6 : 0),
        -0.61 * (1 - eb) - hl * 0.1                                         // about -35 degrees while arriving, -6 when highlighted
      );
    });

    L.renderer.render(L.scene, L.cam);
  }
  requestAnimationFrame(frame);

  // reduced motion: no pinned scene; the grid is shown static with the products upright
  if (reduce && showcaseSec) showcaseSec.hidden = true;

  return { flightJars, L, measure, geo, active: () => (active >= 0 ? active : lastIdx) };
}

export { initProductHandOff };
