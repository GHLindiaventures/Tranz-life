// Products page: the product journey from dhina-dev (its product-hand-off.js), on one fixed #flightCanvas
// (one WebGL context): showcase scene (pinned) -> covered by the dark curtain -> products inside the grid cards.
// Scroll drives one progress value P (0..1) through the showcase: see journeyProgress() in showcase-scene.js.
//   0.12 .. 0.70  pinned scene: spin, reveal, detail
//   0.70 .. 1     the statement's scalloped curtain rises over the pin; the product drifts up and is covered
// Below the curtain, #lineup shows a card per product; each product stands on the panel of its card (measured from the DOM).
//
// Changes from dhina-dev for this page:
//  - there is no hero here: the page opens where dhina-dev's journey has the product in the middle (P = ARRIVE),
//    and the product and its title come in on load the way a card's display opens (OPEN_MS), instead of lifting
//    off the hero's plinth. The showcase's -100vh top margin (made for the hero's fade) cuts that first screen off.
//  - performance, to this site's standard: the frame loop sleeps while nothing of the journey or the grid is on
//    screen (woken by scroll, resize or a click), layout is read once at the start of a frame before anything is
//    written, and shaders/textures are compiled while idle (L.warm) instead of on the first visible frame.
import * as THREE from 'three';
import { ScrollTrigger } from '../lib/gsap.js';
import { PRODUCTS } from './data/products.js';
import { STORY } from './data/product-story.js';
import { jarLayer } from '../features/products/jar-layer.js';
import { createIngredientsDirector } from '../features/products/gummy-pour.js';
import Lenis from 'lenis';
import { state } from '../app/state.js';
import { entranceOrder, highlightIndex } from './grid-math.js';
import { makeScheduler } from './frame-scheduler.js';
import {
  calcIntroText, calcHlCallout, calcPinBadge, walkAt, chapterCardAlpha, calcProductFrame, calcFrameDraw, frameHalfPaths, leafOpen, FRAME_LEAVES, journeyProgress, calcHoldTransform, populateShowcaseDOM, updateShowcaseDOM, placeBadges, createShowcaseDecor
} from './showcase-scene.js';
import { $, $$ } from '../utils/dom.js';
import { clamp, ease } from '../utils/math.js';
import { reduce } from '../utils/media.js';

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

const FLIP_AXIS = new THREE.Vector3(), FLIP_Q = new THREE.Quaternion();

function initProductJourney() {
  const flightCanvas = $('#flightCanvas');
  const lineupSec = $('#lineup');
  const showcaseSec = $('#showcase');
  const flowEl = showcaseSec ? showcaseSec.querySelector('.sc-flow') : null;
  const progEl = showcaseSec ? showcaseSec.querySelector('.sc-progress') : null;
  const introCard = showcaseSec ? showcaseSec.querySelector('#scCard') : null;
  const introLead = showcaseSec ? showcaseSec.querySelector('#scLead') : null;
  const pinEl = $('#lineupPin');
  const stmEl = $('#statement');
  if (!flightCanvas || !lineupSec || !pinEl || !ScrollTrigger) return null;

  const L = jarLayer(flightCanvas);
  const flightJars = PRODUCTS.map((p, i) => L.jar(p, i));
  // each product's width / height from its 3D model (widest of x and z, so the frame fits it from every angle)
  // (measured again when a scanned model finishes loading: until then the drawn stand-in, or nothing, is measured)
  let ratios = [];
  const measureRatios = () => { ratios = flightJars.map(j => {
    j.G.updateMatrixWorld(true);
    const s = new THREE.Box3().setFromObject(j.b).getSize(new THREE.Vector3());
    return s.y < 1e-3 ? 0.55 : Math.max(s.x, s.z) / s.y;
  }); };
  measureRatios();
  window.addEventListener('tl:model-ready', measureRatios);
  // the outline around the product, grown like a plant: two tendrils climb from the bottom centre up both sides and
  // meet at the top, leaves sprout along them as they pass, a bud in the product's colour opens at the top with a
  // ripple, and a fainter second line follows just outside. makeOutline builds it into a showcase layer's #scFrame and
  // returns its setter (one for the page's showcase, one for the overlay a card click opens).
  function makeOutline(frameSvg) {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const LEAF_D = 'M0 0C5-7 15-8 22 0C15 8 5 7 0 0Z';
  const svgEl = (tag, cls, parent) => { const e = document.createElementNS(SVGNS, tag); if (cls) e.setAttribute('class', cls); parent.appendChild(e); return e; };
  let frameParts = null, frameKey = '', frameBoxKey = '';
  if (frameSvg) {
    frameSvg.textContent = '';
    const outer = svgEl('g', 'sc-frame__outer', frameSvg), main = svgEl('g', 'sc-frame__main', frameSvg), leaves = svgEl('g', 'sc-frame__leaves', frameSvg);
    const mk = (g) => [0, 1].map(() => { const p = svgEl('path', null, g); p.setAttribute('pathLength', '1'); return p; });
    frameParts = {
      outer: mk(outer), main: mk(main),
      leaves: [0, 1].flatMap(side => FRAME_LEAVES.map((at, k) => {
        const g = svgEl('g', 'sc-frame__leaf', leaves); const p = svgEl('path', null, g); p.setAttribute('d', LEAF_D);
        const vein = svgEl('path', 'sc-frame__vein', g); vein.setAttribute('d', 'M1 0H19');
        return { g, side, at, out: (k + side) % 2 === 0 };
      })),
      ring: svgEl('circle', 'sc-frame__ring', frameSvg), bud: svgEl('circle', 'sc-frame__bud', frameSvg),
      top: { x: 0, y: 0 }
    };
  }
  function setFrame(box, u) {
    if (!frameParts) return;
    if (!box || u <= 0.001) {
      if (frameKey !== 'off') { frameKey = 'off'; frameSvg.style.visibility = 'hidden'; }
      return;
    }
    const bk = [box.x, box.y, box.w, box.h].map(v => v.toFixed(1)).join('|');
    if (bk !== frameBoxKey) {
      // the shape changed (product, zoom or resize): new paths, and the leaves re-seated along them
      frameBoxKey = bk;
      const [l, r] = frameHalfPaths(box), [ol, or] = frameHalfPaths(box, 7);
      frameParts.main[0].setAttribute('d', l); frameParts.main[1].setAttribute('d', r);
      frameParts.outer[0].setAttribute('d', ol); frameParts.outer[1].setAttribute('d', or);
      frameParts.leaves.forEach(lf => {
        const path = frameParts.main[lf.side], len = path.getTotalLength(), at = len * lf.at;
        const p = path.getPointAtLength(at), q = path.getPointAtLength(Math.min(len, at + 1));
        let ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
        // lean the leaf off the line, alternately outwards and inwards, pointing the way the tendril grows
        const outwards = lf.side === 0 ? -1 : 1;
        lf.base = `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(ang + (lf.out ? -38 : 38) * outwards).toFixed(1)})`;
      });
      frameParts.top = { x: box.x + box.w / 2, y: box.y };
      frameParts.bud.setAttribute('cx', frameParts.top.x.toFixed(1)); frameParts.bud.setAttribute('cy', frameParts.top.y.toFixed(1));
      frameParts.ring.setAttribute('cx', frameParts.top.x.toFixed(1)); frameParts.ring.setAttribute('cy', frameParts.top.y.toFixed(1));
    }
    const key = bk + '|' + u.toFixed(4);
    if (key === frameKey) return; frameKey = key;
    frameSvg.style.visibility = 'visible';
    const u2 = clamp((u - 0.12) / 0.88, 0, 1);                    // the outer line follows a little behind
    frameParts.main.forEach(p => { p.style.strokeDashoffset = (1 - u).toFixed(4); });
    frameParts.outer.forEach(p => { p.style.strokeDashoffset = (1 - u2).toFixed(4); });
    frameParts.leaves.forEach(lf => {
      const s = leafOpen(u, lf.at);
      lf.g.setAttribute('transform', `${lf.base} scale(${Math.max(0, s).toFixed(3)})`);
    });
    // the bud opens when the tendrils meet, and one ripple spreads from it
    const b = clamp((u - 0.94) / 0.06, 0, 1), rip = clamp((u - 0.9) / 0.1, 0, 1);
    frameParts.bud.setAttribute('r', (6 * leafOpen(b, 0)).toFixed(2));
    frameParts.ring.setAttribute('r', (6 + 26 * rip).toFixed(1));
    frameParts.ring.style.opacity = (rip > 0 && rip < 1 ? (1 - rip) * 0.7 : 0).toFixed(3);
  }
    return setFrame;
  }
  const setFrame = makeOutline(showcaseSec ? showcaseSec.querySelector('#scFrame') : null);

  // The highlights moment near the end of the details: the product stands in corner brackets ([ ]) with its highlight
  // points on the left and on the right, each joined to its bracket by a thin line. The points scroll up right behind
  // the last block of the details, hold beside the product, and scroll away with the curtain (calcHlCallout).
  // The two columns are placed from the product's own frame (CSS variables on the pinned layer), so they never cover
  // it at any screen size; on phones they stack on the left of the product. One setter per showcase layer (the page's
  // and the copy a card click opens).
  function makeCallout(pin) {
    if (!pin) return () => {};
    const hl = pin.querySelector('.sc-hl');
    const SVGNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'sc-callout'); svg.setAttribute('aria-hidden', 'true');
    const mk = cls => { const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('class', cls); p.setAttribute('pathLength', '1'); svg.appendChild(p); return p; };
    const brL = mk('sc-callout__br'), brR = mk('sc-callout__br');
    let lines = [], items = [];
    pin.insertBefore(svg, pin.firstChild);
    let key = '', lastO = -1, lastD = -1, lastL = -1, lastY = NaN, filled = null;
    let lastEx = -1;
    return function setCallout(box, o, draw, lineDraw = 0, y = 0, ex = 0) {
      const on = !!box && o > 0.003 && !!hl && hl.children.length > 0;
      svg.style.visibility = on ? 'visible' : 'hidden';
      if (hl) hl.style.visibility = on ? 'visible' : 'hidden';
      if (!on) { lastO = -1; lastY = NaN; lastEx = -1; return; }
      // the bracket box: a little outside the product's frame
      const m = Math.max(10, box.h * 0.04);
      const l = box.x - m, r = box.x + box.w + m, t = box.y - m, b = box.y + box.h + m, cy = (t + b) / 2;
      const gap = geo.mobile ? 30 : Math.max(56, Math.min(120, geo.vw * 0.07));   // line + room between text and bracket
      const sc = pin.closest('.showcase'), ver = sc && sc._sc;            // a new product's points: measure again
      const k = [l, r, t, b, gap, geo.vw, geo.vh].map(v => Math.round(v)).join(',');
      if (k !== key || ver !== filled) {
        key = k; filled = ver;
        pin.style.setProperty('--co-l', l.toFixed(0) + 'px');
        pin.style.setProperty('--co-r', r.toFixed(0) + 'px');
        pin.style.setProperty('--co-cy', cy.toFixed(0) + 'px');
        pin.style.setProperty('--co-gap', gap.toFixed(0) + 'px');
        const arm = Math.max(16, Math.min(44, (r - l) * 0.2));
        brL.setAttribute('d', 'M' + (l + arm) + ' ' + t + 'H' + l + 'V' + b + 'H' + (l + arm));
        brR.setAttribute('d', 'M' + (r - arm) + ' ' + t + 'H' + r + 'V' + b + 'H' + (r - arm));
        // one line per point: from the point's edge to the nearest bracket, landing within the bracket's height
        lines.forEach(p => p.remove()); lines = [];
        items = [...hl.querySelectorAll('.sc-hl__item')];
        hl.style.transform = ''; lastY = NaN;                               // measure the points where they hold
        const pr = pin.getBoundingClientRect(), mid = (l + r) / 2;
        items.forEach(it => {
          const q = it.getBoundingClientRect(), left = q.left + q.width / 2 < mid;
          const y1 = q.top - pr.top + Math.min(q.height / 2, 14), y2 = Math.max(t + arm, Math.min(b - arm, y1));
          const x1 = left ? q.right - pr.left + 12 : q.left - pr.left - 12, x2 = left ? l - 8 : r + 8;
          const p = mk('sc-callout__ln'); p.setAttribute('d', 'M' + x2.toFixed(1) + ' ' + y2.toFixed(1) + 'L' + x1.toFixed(1) + ' ' + y1.toFixed(1));
          lines.push(p);
        });
        lastD = -1; lastL = -1; lastEx = -1;
      }
      // the group's place: below while it arrives, pinned, then above as it leaves with the curtain. The brackets and
      // lines stay round the product while the points arrive, and go up with them when they leave.
      if (y !== lastY) {
        lastY = y;
        hl.style.transform = y ? 'translate3d(0,' + y.toFixed(1) + 'px,0)' : '';
        svg.style.transform = y < 0 ? 'translate3d(0,' + y.toFixed(1) + 'px,0)' : '';
      }
      if (Math.abs(o - lastO) > 0.002) { lastO = o; svg.style.opacity = o.toFixed(3); }
      const d = Math.max(0, Math.min(1, draw)), e = Math.max(0, Math.min(1, ex));
      if (Math.abs(d - lastD) > 0.002 || Math.abs(e - lastEx) > 0.002) {
        lastD = d; lastEx = e;
        // in: the brackets draw, the points' words rise in one after another; out: the words leave upwards one after
        // another, then the brackets draw back
        const db = Math.max(1 - Math.min(1, d / 0.7), Math.max(0, Math.min(1, e * 1.4 - 0.4)));
        brL.style.strokeDashoffset = brR.style.strokeDashoffset = db.toFixed(3);
        const n = Math.max(1, items.length);
        items.forEach((it, i) => {
          const sh = Math.max(0, Math.min(1, (d - 0.15 - i * (0.35 / n)) / 0.5)), xo = Math.max(0, Math.min(1, (e - i * (0.3 / n)) / 0.6));
          it.style.setProperty('--sh', sh.toFixed(3)); it.style.setProperty('--ex', xo.toFixed(3));
        });
        lastL = -1;
      }
      // the lines run out from the brackets to the points once they are in, and back when they leave
      const ld = Math.max(0, Math.min(1, lineDraw));
      if (Math.abs(ld - lastL) > 0.002) {
        lastL = ld;
        lines.forEach((p, i) => { const u = Math.max(0, Math.min(1, (ld - i * 0.06) / 0.7)); p.style.strokeDashoffset = Math.max(1 - u, Math.min(1, e * 2)).toFixed(3); });
      }
    };
  }
  const setCallout = makeCallout(showcaseSec ? showcaseSec.querySelector('.showcase-pin') : null);

  // the ingredient badges: in the empty spaces right of the product (top, bottom, middle), each rising in during its
  // own part of the scene, drifting, then floating away (calcPinBadge). Never on the product, and a badge that would
  // touch any text fades out until the text has passed. Not on phones. The product's left and right edges are also
  // handed to CSS (--pl / --pr), so the big outlined names can leave a gap where it stands.
  const BADGE_SPOT = [[0.85, 0.2], [0.86, 0.79], [0.84, 0.47]];   // x, y as fractions of the screen
  const BADGE_FROM = [0, 0.06, 0.5];   // when each comes in: the first two fill the first screens' empty corners
  function makeBadges(pin) {
    const layer = pin && pin.querySelector('.sc-pbadges'), sc = pin && pin.closest('.showcase');
    return () => {};   // (the ingredient badges are gone: only the given details are shown)
    if (!layer) return () => {};
    let shown = false, edges = '';
    return function setBadges(box, P, k) {
      if (box && sc) {
        const e = Math.round(box.x) + ',' + Math.round(box.x + box.w);
        if (e !== edges) { edges = e; sc.style.setProperty('--pl', Math.round(box.x) + 'px'); sc.style.setProperty('--pr', Math.round(box.x + box.w) + 'px'); }
      }
      const els = [...layer.children], on = !!box && !geo.mobile && k > 0;
      if (!on) { if (shown) { els.forEach(el => { el.style.visibility = 'hidden'; }); shown = false; } return; }
      shown = true;
      const u = clamp((P - 0.13) / 0.43, 0, 1);   // from the end of the zoom to the end of the details
      const texts = [...sc.querySelectorAll('.sc-flow .sc-blk, .sc-card, .sc-blk--lead, .sc-hl__item')]
        .filter(el => el.style.visibility !== 'hidden' && parseFloat(el.style.opacity || '1') > 0.15)
        .map(el => el.getBoundingClientRect()).filter(r => r.bottom > 0 && r.top < geo.vh && r.width > 0);
      els.forEach((el, i) => {
        const b = calcPinBadge(u, i, BADGE_FROM[i]), at = BADGE_SPOT[i] || BADGE_SPOT[0];
        const rad = (el.offsetWidth || 120) * b.s / 2;
        const x = Math.max(geo.vw * at[0], box.x + box.w + 24 + rad), y = geo.vh * (at[1] + b.y);
        const hit = texts.some(r => r.left < x + rad + 12 && r.right > x - rad - 12 && r.top < y + rad + 12 && r.bottom > y - rad - 12);
        el._f = (el._f == null ? 1 : el._f) + ((hit ? 0 : 1) - (el._f == null ? 1 : el._f)) * 0.2;
        const o = b.o * k * el._f;
        el.style.visibility = o > 0.003 ? 'visible' : 'hidden';
        if (o <= 0.003) return;
        el.style.opacity = o.toFixed(3);
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-50%) rotate(' + ((i % 2 ? 7 : -8)) + 'deg) scale(' + b.s.toFixed(3) + ')';
      });
    };
  }
  const setBadges = makeBadges(showcaseSec ? showcaseSec.querySelector('.showcase-pin') : null);

  // The details as one falling page with stops: showcase-scene.js builds it and plans the scroll (walkAt). Each frame,
  // the page layer is moved by how far it has fallen (e: it stands still during a stop), and each card of a frame
  // gets .in (its own entrance, in CSS) once the falling has stopped for it; it keeps it as it falls away afterwards.
  // The product's frame is handed to CSS (--co-l / --co-r) so the frames' columns sit beside the product.
  function makeChapters(pin) {
    const sc = pin && pin.closest('.showcase');
    if (!sc) return () => {};
    const blocks = sc.querySelector('.sc-blocks');
    let key = '', lastE = NaN;
    return function setChapters(box, r, H, k) {
      if (box) {
        const m = Math.max(10, box.h * 0.04), l = box.x - m, rr = box.x + box.w + m, cy = box.y + box.h / 2;
        const gap = geo.mobile ? 24 : Math.max(48, Math.min(96, geo.vw * 0.055));
        const kk = [l, rr, cy, gap].map(Math.round).join(',');
        if (kk !== key) {
          key = kk;
          sc.style.setProperty('--pl', Math.round(box.x) + 'px'); sc.style.setProperty('--pr', Math.round(box.x + box.w) + 'px');   // the big names leave a gap where the product stands
          [pin, sc].forEach(el => {
            el.style.setProperty('--co-l', l.toFixed(0) + 'px'); el.style.setProperty('--co-r', rr.toFixed(0) + 'px');
            el.style.setProperty('--co-cy', cy.toFixed(0) + 'px'); el.style.setProperty('--ch-gap', gap.toFixed(0) + 'px');
          });
        }
      }
      const b = sc._beats, w = walkAt(box ? r : 0, b);
      sc._e = w.e;
      sc._r = box ? r : 0;   // the scroll position, for the ribbons behind (they never stop)
      if (blocks && w.e !== lastE) { lastE = w.e; blocks.style.transform = 'translate3d(0,' + (-w.e).toFixed(1) + 'px,0)'; }
      if (blocks) {
        // the falling page appears as the falling starts, and dissolves as the highlights begin: the last frame stays
        // parked at the top once the falling ends, so it must be gone while the highlights show (and until the curtain)
        let o = b ? Math.max(0, Math.min(1, (r - b.r0 + 30) / 120)) : 1;
        if (b) o *= 1 - Math.max(0, Math.min(1, (r - (b.hlFrom - 0.05 * geo.vh)) / (0.2 * geo.vh)));
        const op = o.toFixed(2); if (blocks._op !== op) { blocks._op = op; blocks.style.opacity = op; }
      }
      if (!b || !sc._frameCards) return;
      sc._frameCards.forEach((cards, f) => {
        const h = b.holds[f]; if (!h) return;
        const len = h.end - h.start;
        cards.forEach((el, j) => {
          const on = !!box && k > 0 && r >= h.start + (0.05 + j * 0.28) * len;
          if (el.classList.contains('in') !== on) el.classList.toggle('in', on);
        });
        // while the page stands still the frame drifts slowly (15px down to 15px up), so a stop never looks frozen
        const drift = 'translate3d(0,' + ((0.5 - (box ? clamp((r - h.start) / len, 0, 1) : 0)) * 30).toFixed(1) + 'px,0)';
        (sc._frameSlots[f] || []).forEach(sl => { if (sl._dr !== drift) { sl._dr = drift; sl.style.transform = drift; } });
        const price = cards.map(c => c.querySelector('.sc-price[data-v]')).find(Boolean);   // the price counts up
        if (price) {
          const u = box ? clamp((r - h.start) / len, 0, 1) : 0, txt = '₹' + Math.round(+price.dataset.v * clamp((u - 0.1) / 0.3, 0, 1)).toLocaleString('en-IN');
          if (price.textContent !== txt) price.textContent = txt;
        }
      });
    };
  }
  const setChapters = makeChapters(showcaseSec ? showcaseSec.querySelector('.showcase-pin') : null);

  flightJars.forEach(j => { j.G.visible = false; });
  const decor = createShowcaseDecor(L);
  L.warm();                                              // compile shaders / upload textures while idle
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
  // page top of an element from its offsets (not getBoundingClientRect: sticky pins report their stuck position)
  const docTop = el => { let y = 0, n = el; while (n) { y += n.offsetTop; n = n.offsetParent; } return y; };
  function measure() {
    L.resize();
    geo.vh = innerHeight; geo.vw = innerWidth; geo.mobile = innerWidth < 768;
    geo.pinEnd = stmEl ? docTop(stmEl) : geo.vh * 6;
    // no hero on this page: the screen that was the hero's fade is one screen height, and the showcase's -100vh top
    // margin puts it above the top of the page, so the page opens with the scene proper (P = ARRIVE)
    geo.fadeLen = Math.max(1, geo.vh);
    geo.secTop = showcaseSec ? docTop(showcaseSec) : -geo.fadeLen; // the section's own top (its scroll range starts here)
    geo.showcaseTop = geo.secTop + geo.fadeLen;
    geo.preRoll = geo.fadeLen;
    geo.secH = showcaseSec ? showcaseSec.offsetHeight : 0;
    geo.hasScene = geo.secH > 0;                          // false when the page does not show the details inline: they open from a product's card instead
    geo.lineupTop = docTop(lineupSec); geo.lineupH = lineupSec.offsetHeight;
    geo.pinTop = docTop(pinEl); { let x = 0, n = pinEl; while (n) { x += n.offsetLeft; n = n.offsetParent; } geo.pinLeft = x; }
    // each panel's offset inside the lineup pin (scroll independent, so it stays right while the pin is stuck)
    geo.slots = slotEls.map(slot => {
      if (!slot) return { ox: 0, oy: 0, w: 160, h: 220 };
      const o = offsetWithin(slot, pinEl);
      return { ox: o.x, oy: o.y, w: slot.offsetWidth, h: slot.offsetHeight };
    });
    if (showcaseSec) placeBadges(showcaseSec);
  }
  if (showcaseSec) populateShowcaseDOM(showcaseSec, 0);
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
  // a click (or Enter / Space) on a card asks for that product's showcase: openOverlay listens for it (below)
  itemEls.forEach((btn, i) => { if (btn) btn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('tl:showcase', { detail: { index: i, id: PRODUCTS[i].id } }))); });
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; });

  /* ---------- which product the page's showcase shows ---------- */
  // dhina-dev took whichever product stood on the hero's plinth; here it is the first product, or the one named in
  // the address (products.html?id=rollon or #rollon), so other pages can link straight to a product's showcase
  const wanted = (new URLSearchParams(location.search).get('id') || location.hash.slice(1) || '').toLowerCase();
  let active = Math.max(0, PRODUCTS.findIndex(p => p.id === wanted)), lastIdx = -1;
  let handStart = null;                                  // set when a product's display hands over to the page

  const restRot = i => (PRODUCTS[i].model === 'rollon' ? -0.32 : -0.38);
  // the products in the list sway left and right through about 40 degrees (20 each way), each on its own beat
  const idleRot = (i, t) => (reduce ? 0 : Math.sin(t * 0.9 + i * 1.3) * 0.35);

  // where the product holds still while the page scrolls past it: the middle of the screen
  function viewFor(i) {
    const fit = flightJars[i].fit || 1, vh = geo.vh, m = geo.mobile;
    // phones: at the right edge, smaller, so the page can run down the left side
    // rotY: the angle that shows the front of the product (as it stands in its card)
    return { x: geo.vw * (m ? 0.82 : 0.5), y: vh * (m ? 0.55 : 0.52), h: (m ? Math.min(vh * 0.3, geo.vw * 0.62) : vh * 0.56) * fit, rotY: restRot(i) };
  }

  /* ---------- a click on a card: that product's display, in an overlay over the grid ---------- */
  // The overlay holds a copy of the showcase (same layout, same blocks, same outline) filled for the clicked product,
  // and scrolls on its own; the page behind stays exactly where it was (Lenis is stopped while it is open). The product
  // flies from its card to the middle on open and back into its card on close (Close, Esc, or reaching the end).
  const ov = { el: null, sec: null, btn: null, card: null, lead: null, setFrame: null, idx: -1, state: 'closed', t0: 0,
    from: null, last: null, pending: null, returnFocus: null };
  const OPEN_MS = reduce ? 1 : 1400, CLOSE_MS = reduce ? 1 : 650;
  const easeIO = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

  /* ---------- the Lung Booster's ingredients moment (gummy-pour.js) ----------
     Two stretches of extra scroll are spliced into the display for the Lung Booster only: ING_LEN screens right after the
     product has settled (the cap unscrews, the bottle tilts to the bottom of the frame, the gummies pour out and the
     ingredients are called out) and ING_CL screens just before the highlights moment (the gummies go back, the cap screws on).
     While a stretch plays, the rest of the display is frozen: ingWarp maps the real scroll to the scroll the rest of the code
     sees (sy). (The display's layers are all sticky and driven by sy, so nothing else needs shifting.) Scrolling back up runs it
     all in reverse. */
  const FLIP_LEN = 0.9;                              // screens the Lung Booster takes to finish its flip: only then does the outline start to draw
  const BORDER = { grow: 1.0, hold: 0.5, away: 1.4 };   // screens the Lung Booster's outline takes to draw, to stay, and to withdraw (after the flip)
  const ING_LEN = 6.4, ING_CL = 1.6;   // ING_LEN: the callouts get their own long, slow stretch
  // the run-up (flip, outline in, outline out) in screens. On a short section (small screens) the highlights moment comes sooner (it starts
  // at H - 3 screens), so the run-up is squeezed to end before it: the gummy moment never starts under the highlights or the curtain
  function ingT(vh, F, H) {
    const room = (H - 3.5 * vh - F) / vh, tb = BORDER.grow + BORDER.hold + BORDER.away;
    const k = clamp((room - FLIP_LEN - 0.1) / tb, 0.25, 1);
    return { k, grow: BORDER.grow * k, hold: BORDER.hold * k, away: BORDER.away * k, flip: FLIP_LEN, A: FLIP_LEN + 0.1 + tb * k };
  }
  let ingDir = null;
  const ingOn = () => ov.idx === 0 && !reduce;
  function ingWarp(syRaw) {
    const vh = geo.vh, F = geo.fadeLen, H0 = ov.sec.offsetHeight - (ov.sec._extra || 0);
    const A = F + ingT(vh, F, H0).A * vh, LEN = ING_LEN * vh, CL = ING_CL * vh;
    const r0 = ov.sec._beats ? ov.sec._beats.r0 : F + 1.05 * vh;           // where the falling page (the details) starts
    let sy = syRaw, u = 0, v = 0;
    if (syRaw >= A) {
      if (syRaw < A + LEN) { sy = A; u = (syRaw - A) / LEN; }                                  // letters leave, the cap unscrews, the gummies pour, callouts
      else if (syRaw < A + LEN + CL) {                                                            // the very next scroll: the gummies go back in, the cap goes on
        u = 1; v = (syRaw - A - LEN) / CL; const k = v * v * (3 - 2 * v); sy = A + (r0 - A) * k;  // (the display eases back to where the details begin)
      } else { u = 1; v = 1; sy = r0 + (syRaw - A - LEN - CL); }                                  // then the details rise from the bottom, as they always did
    }
    return { sy, u, v, shift: syRaw - sy };
  }

  function buildOverlay() {
    if (ov.el || !showcaseSec) return;
    const el = document.createElement('div');
    el.className = 'sc-overlay'; el.id = 'showcaseOverlay'; el.tabIndex = -1;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.setAttribute('data-lenis-prevent', '');                 // Lenis leaves this scroller alone
    const sec = showcaseSec.cloneNode(true);
    sec.id = 'showcaseOv'; sec.removeAttribute('data-dock'); sec.removeAttribute('data-theme');
    sec.querySelectorAll('[style]').forEach(n => { if (!n.closest('.sc-badge') && !n.classList.contains('sc-blk') && !n.classList.contains('sc-big')) n.removeAttribute('style'); });
    sec.querySelectorAll('.sc-callout').forEach(n => n.remove());   // the overlay builds its own
    el.appendChild(sec); document.body.appendChild(el);
    const spacer = document.createElement('div'); spacer.setAttribute('aria-hidden', 'true'); spacer.style.cssText = 'height:0;pointer-events:none'; el.appendChild(spacer); ov.spacer = spacer;   // the Lung Booster's extra scroll
    // the product's name, big, behind the product while it spins in and settles; it gives way to the intro words
    const pinHost = sec.querySelector('.showcase-pin');
    if (pinHost) { const hn = document.createElement('div'); hn.className = 'sc-heroname'; hn.setAttribute('aria-hidden', 'true'); pinHost.appendChild(hn); ov.heroName = hn; }
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'sc-overlay__close'; btn.setAttribute('aria-label', 'Close');
    btn.innerHTML = '<span aria-hidden="true">×</span>';
    document.body.appendChild(btn);
    btn.addEventListener('click', closeOverlay);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && (ov.state === 'open' || ov.state === 'opening')) closeOverlay(); });
    // a safety net: reaching the end of the details hands over to the page (normally that happens a screen earlier)
    el.addEventListener('scroll', () => { if (ov.state === 'open' && el.scrollTop >= el.scrollHeight - el.clientHeight - 2) handOff(ingOn() ? ingWarp(el.scrollTop + geo.fadeLen).sy : el.scrollTop + geo.fadeLen); }, { passive: true });
    // the same smooth scroll as the page (same settings), so the display moves exactly like the page's showcase; its
    // frames are driven from our own frame loop. It is stopped while the display is closed.
    const lenis = reduce ? null : new Lenis({ wrapper: el, content: sec, lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.5, autoRaf: false });
    Object.assign(ov, { lenis, el, sec, btn, card: sec.querySelector('#scCard'), lead: sec.querySelector('#scLead'),
      setFrame: makeOutline(sec.querySelector('#scFrame')), setCallout: makeCallout(sec.querySelector('.showcase-pin')),
      setBadges: makeBadges(sec.querySelector('.showcase-pin')), setChapters: makeChapters(sec.querySelector('.showcase-pin')) });
  }

  // where the product sits in its card right now (screen px), to fly from / back to
  function cardSpot(i) {
    const r = slotEls[i].getBoundingClientRect(), jar = flightJars[i];
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.52, h: r.height * 0.72 * (jar.fit || 1),
      rx: jar.G.rotation.x, ry: jar.G.rotation.y, rz: jar.G.rotation.z };
  }

  // matte gradient behind each product: [top, middle, bottom]
  const OV_BG = { gummies: ['#ebcba0', '#d99a68', '#b86b43'], inhaler: ['#b0dccd', '#72b8a2', '#418f7c'], rollon: ['#ecbcc5', '#d68b9e', '#ab5a76'], reviva: ['#cddca4', '#9fba66', '#6c903c'], liver: ['#e3d68c', '#bfb24f', '#8c8531'], energy: ['#f0cfa0', '#d79a55', '#a2622b'] };
  function openOverlay(i) {
    if (i == null || i < 0 || i >= N) return;
    if (ov.state === 'opening' || ov.state === 'closing') { ov.pending = i; return; }   // finish the current one first
    if (ov.state === 'open') { if (i !== ov.idx) { ov.pending = i; closeOverlay(); } return; }
    buildOverlay(); if (!ov.el) return;
    ov.idx = i; ov.returnFocus = itemEls[i];
    { const g = OV_BG[PRODUCTS[i].id] || OV_BG.gummies; ov.el.style.setProperty('--ov-a', g[0]); ov.el.style.setProperty('--ov-b', g[1]); ov.el.style.setProperty('--ov-c', g[2]); [['--ov-a', g[0]], ['--ov-b', g[1]], ['--ov-c', g[2]]].forEach(([k, v]) => document.documentElement.style.setProperty(k, v)); ov.handed = null; }
    populateShowcaseDOM(ov.sec, i);
    if (ov.heroName) {
      const srEl = itemEls[i] && itemEls[i].querySelector('.sr'), nm = (srEl ? srEl.textContent : PRODUCTS[i].short || '').trim();
      const parts = nm.split(/\s+/), l1 = parts.length > 1 ? parts[0] : nm, l2 = parts.length > 1 ? parts.slice(1).join(' ') : '';
      ov.heroName.innerHTML = '<span>' + l1 + '</span>' + (l2 ? '<span>' + l2 + '</span>' : '');
      ov.heroName.style.opacity = '0';
    }
    ov.el.setAttribute('aria-label', PRODUCTS[i].name);
    ov.from = cardSpot(i);
    if (state.lenis) state.lenis.stop();
    document.body.classList.add('sc-ov-open');
    ov.el.classList.remove('instant');
    ov.el.classList.add('open'); ov.btn.classList.add('open');
    // the copy starts where the page's showcase starts once the hero has gone: its first screen (the hero's fade on the
    // page) is cut off, so the display cannot be scrolled up into that empty space. Its scroll is section px - F.
    ov.sec.style.setProperty('margin-top', (-geo.fadeLen).toFixed(0) + 'px', 'important');
    ov.el.scrollTop = 0;
    // the Lung Booster's extra scroll is part of the section itself (its pinned layers cannot leave the section): taller by ING_LEN + ING_CL
    // screens, and `_extra` tells the layout (showcase-scene.js) and this file to plan the timeline on the original height
    ov.sec.style.height = ''; ov.sec._extra = 0;
    if (ingOn()) { const H0 = ov.sec.offsetHeight, Aq = geo.fadeLen + ingT(geo.vh, geo.fadeLen, H0).A * geo.vh, r0q = geo.fadeLen + 1.05 * geo.vh, extra = Math.round((ING_LEN + ING_CL) * geo.vh + Math.max(0, Aq - r0q));   // (+ the stretch the display winds back, so the details still run to their real end)
      ov.sec._extra = extra; ov.sec.style.height = (ov.sec.offsetHeight + extra) + 'px'; }
    if (ingOn() && !ingDir) ingDir = createIngredientsDirector(L);
    if (ov.lenis) { ov.lenis.resize(); ov.lenis.start(); ov.lenis.scrollTo(0, { immediate: true, force: true }); }
    const flow = ov.sec.querySelector('.sc-flow'); if (flow) { flow.style.visibility = 'visible'; flow.style.opacity = '1'; }
    placeBadges(ov.sec);
    [ov.card, ov.lead].forEach(el => { if (el) { el.style.opacity = '0'; el.style.setProperty('--tin', '0'); } });   // words start from nothing
    ov.state = 'opening'; ov.t0 = ov.openedAt = performance.now();
    flightCanvas.classList.add('active'); wasOn = true;
    ov.el.focus({ preventScroll: true });                  // arrow keys, Page keys and Space scroll it
  }

  function closeOverlay() {
    if (ov.state !== 'open' && ov.state !== 'opening') return;
    // If opened via product link from the homepage, closing returns directly to the homepage lineup:
    if (wanted || (document.referrer && document.referrer.includes('index.html'))) {
      window.location.href = 'index.html#products';
      return;
    }
    ov.from = cardSpot(ov.idx);                          // back into its card
    ov.state = 'closing'; ov.t0 = performance.now();
    ov.el.classList.remove('open'); ov.btn.classList.remove('open');
  }

  // The end of the details is the page's own ending: just before the statement page would come into view, the page
  // takes over. Its showcase is filled for this product and scrolled to exactly the same point (the display is a copy
  // of it, so nothing on screen changes), the display goes away, and the page's own scroll carries on with the scroll's
  // momentum: the statement rises over the product and the grid follows, exactly as from the home page.
  // The page shows only the products. The scene (details + statement curtain) is part of the layout only while a
  // display hands over to it, so the page's own scroll can carry the end of the details exactly as before: the
  // statement rises over the product, then the products come up. Once the products are on screen it is taken away again.
  function setScene(on) {
    document.body.classList.toggle('scene-on', on);
    measure();
    if (state.lenis && state.lenis.resize) state.lenis.resize();
  }
  function hideScene(sy) {
    ov.handed = null; showcaseSec._ppOff = 0;
    const shift = geo.lineupTop;
    setScene(false);
    const y = Math.max(0, sy - shift);
    if (state.lenis) state.lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y);
  }
  function handOff(sy) {
    const i = ov.idx;
    setScene(true);
    const pageY = showcaseSec.getBoundingClientRect().top + scrollY + sy;
    const ahead = ov.lenis ? ov.lenis.targetScroll - ov.lenis.animatedScroll : 0;
    active = i;
    handStart = { ...viewFor(i), rotX: 0.04, rotY: restRot(i), rotZ: 0 };   // the same path the display used
    lastIdx = i; populateShowcaseDOM(showcaseSec, i); placeBadges(showcaseSec); measure();
    ov.ppNeed = ov.sec._pp != null ? ov.sec._pp : null; ov.handed = i; ov.handY = null; ov.handT = performance.now();                                        // (scrolling back up re-opens the display: see reenter)
    lastIntro = ''; lastP = -1;                          // let the page redraw everything for its new position
    ov.el.classList.add('instant');
    ov.el.classList.remove('open'); ov.btn.classList.remove('open');
    ov.returnFocus = null;                                // stay here: focusing the card would scroll away
    finishClose();
    if (state.lenis) {
      state.lenis.scrollTo(pageY, { immediate: true, force: true });
      if (Math.abs(ahead) > 0.5) state.lenis.scrollTo(pageY + ahead);
    } else window.scrollTo(0, pageY);
  }

  // Scrolling back up from the page's ending: the page's own showcase has no ingredients moment, so the display (the full sequence)
  // takes over again at exactly the same point of the details.
  function reenter(sy) {
    const vh = geo.vh, secDoc = showcaseSec.getBoundingClientRect().top + scrollY, pSy = sy - secDoc, H0 = showcaseSec.offsetHeight;
    if (ov.handY == null || performance.now() - ov.handT < 700) { ov.handY = sy; return false; }   // settle first: the page is still taking the scroll over
    ov.handY = Math.max(ov.handY, sy);                     // the furthest the page has been carried
    if (sy > ov.handY - 0.3 * vh || pSy >= H0 - 1.5 * vh) return false;   // only when the reader really scrolls back up
    hideScene(sy);
    openOverlay(0);
    ov.state = 'open'; ov.el.classList.add('instant'); ov.t0 = performance.now();
    let lo = 0, hi = ov.sec.offsetHeight;
    for (let k = 0; k < 40; k++) { const mid = (lo + hi) / 2; if (ingWarp(mid).sy < pSy) lo = mid; else hi = mid; }
    const top = Math.max(0, hi - geo.fadeLen);
    ov.el.scrollTop = top;
    if (ov.lenis) { ov.lenis.resize(); ov.lenis.scrollTo(top, { immediate: true, force: true }); }
    return true;
  }

  function finishClose() {
    if (ingDir && ov.idx === 0) ingDir.reset(flightJars[0]);
    ov.state = 'closed';
    if (ov.lenis) ov.lenis.stop();
    document.body.classList.remove('sc-ov-open');
    if (state.lenis) state.lenis.start();
    if (ov.returnFocus) ov.returnFocus.focus({ preventScroll: true });
    ov.idx = -1;
    const next = ov.pending; ov.pending = null;
    if (next != null) openOverlay(next);
  }

  // the overlay's own frame: its scroll drives the same scene the page's scroll does
  function renderOverlay(now, tTime) {
    const i = ov.idx, jar = flightJars[i], vh = geo.vh, F = geo.fadeLen;
    const syRaw = (ov.lenis ? ov.lenis.animatedScroll : ov.el.scrollTop) + F, H = ov.sec.offsetHeight - (ov.sec._extra || 0);   // section px (the planned length)
    const ing = ingOn() ? ingWarp(syRaw) : { sy: syRaw, u: 0, v: 0, shift: 0 }, sy = ing.sy;
    const P = journeyProgress(ingOn() && ing.v < 1 ? Math.min(sy, H - 2 * vh - 1) : sy, { showcaseTop: F, pinEnd: H - vh, vh, preRoll: F });
    // the counter and its bar only ever grow with the scroll: while the gummies pour and return the display's time stands still / winds back,
    // so the counter runs straight from where the pour starts to where the details end instead of following that
    ov.sec._pp = null;
    if (ingOn()) {
      const A0 = F + ingT(vh, F, H).A * vh, rawMax = ov.sec.offsetHeight - vh + F;
      if (syRaw > A0 && rawMax > A0) {
        const pj = s0 => journeyProgress(s0, { showcaseTop: F, pinEnd: H - vh, vh, preRoll: F });
        const PA = pj(Math.min(A0, H - 2 * vh - 1)), PE = pj(ingWarp(rawMax).sy);
        ov.sec._pp = PA + (PE - PA) * clamp((syRaw - A0) / (rawMax - A0), 0, 1);
      }
    }
    updateShowcaseDOM(ov.sec, P, tTime);
    const view = viewFor(i);
    const base = calcHoldTransform(P, { x: view.x, y: view.y, h: view.h, rotX: 0.04, rotY: restRot(i), rotZ: 0 }, view, mouse, tTime, geo.mobile);
    // Opening: the product settles low on the screen, big, with its name above it. The first part of the scroll then
    // lifts it to its hold in the middle (s: 0 at rest, 1 when it has arrived), and only then do the intro words come in.
    const sc = Math.max(0, sy - F), s = reduce ? 1 : clamp(sc / (0.7 * vh), 0, 1), se = ease.io(s);
    const hx = geo.vw * 0.5, hh = (geo.mobile ? Math.min(vh * 0.5, geo.vw * 1.0) : vh * 0.6) * (jar.fit || 1), hy = vh * (geo.mobile ? 0.84 : 0.88);
    const hold = reduce ? base : { ...base, x: hx + (base.x - hx) * se, y: hy + (base.y - hy) * se, h: hh + (base.h - hh) * se };
    // a = 0 in the card, 1 in the middle: the fly on open and close
    let a = 1;
    if (ov.state === 'opening' || ov.state === 'closing') {
      const k = clamp((now - ov.t0) / (ov.state === 'opening' ? OPEN_MS : CLOSE_MS), 0, 1), e = easeIO(k);
      a = ov.state === 'opening' ? e : 1 - e;
      if (k >= 1) { if (ov.state === 'opening') ov.state = 'open'; else { finishClose(); return; } }
    }
    // the statement page would now come into view: from here on it is the page's own ending
    if (ov.state === 'open' && showcaseSec && (H - vh) - sy <= vh && (!ingOn() || ing.v >= 1)) { handOff(sy); return; }
    // the ingredients moment (Lung Booster): open 0 = closed .. 1 = poured. Its pose changes the hold before the product is placed.
    let open = 0, calloutC = 0, calloutA = 0;
    let letters = 0;                                  // 0..1: the side letters go up and away first, then the bottle opens
    if (ingOn()) {
      letters = clamp(ing.u / 0.045, 0, 1);
      open = ing.v > 0 ? 1 - clamp(ing.v / 0.9, 0, 1) : clamp((ing.u - 0.02) / 0.3, 0, 1);   // the cap starts to unscrew when the letters are half-way up
      calloutC = clamp((ing.u - 0.4) / 0.56, 0, 1);
      calloutA = ing.v > 0 ? 0 : clamp((ing.u - 0.38) / 0.03, 0, 1) * (1 - clamp((ing.u - 0.975) / 0.025, 0, 1));
      if (ov.state === 'closing') { open *= a; calloutA *= a; }
      if (ingDir && open > 0) ingDir.pose(hold, open, { vh, mobile: geo.mobile, front: restRot(i) });
    }
    if (ingOn()) { const fl = ov.sec.querySelector('.sc-flow'); if (fl) { const on = ing.v >= 1 ? '1' : '0.001'; if (fl._ing !== on) { fl._ing = on; fl.style.opacity = on; } } }   // the details (and the falling page behind) wait until the gummies are back in
    const f = ov.from, lerp = (p, q) => p + (q - p) * a;
    flightJars.forEach((j, k) => { j.G.visible = k === i; });
    L.place(jar.G, lerp(f.x, hold.x), lerp(f.y, hold.y));
    L.size(jar, Math.max(1, lerp(f.h, hold.h)));
    // opening: one full turn on the way (as before), then it settles. Scrolling from the name screen (1) to the details (2): one slow, light
    // flip around an axis tilted 20 degrees (it plays over 1.2 screens of scroll, easing in and out)
    jar.G.rotation.set(lerp(f.rx, hold.rotX), lerp(f.ry, hold.rotY) + (reduce ? 0 : (1 - a) * Math.PI * 2), lerp(f.rz, hold.rotZ));
    if (!reduce) {
      const fl = ease.io(clamp(sc / ((ingOn() ? FLIP_LEN : 1.2) * vh), 0, 1)), tilt = 20 * Math.PI / 180;
      FLIP_AXIS.set(Math.cos(tilt), Math.sin(tilt), 0);
      jar.G.quaternion.premultiply(FLIP_Q.setFromAxisAngle(FLIP_AXIS, fl * Math.PI * 2));
    }
    if (ingDir) { if (ingOn()) ingDir.update(jar, { open, c: calloutC, calloutA, vw: geo.vw, vh, mobile: geo.mobile, time: tTime, pointer: { x: mouse.x, y: mouse.y, on: canHover } }); else if (i !== 0) ingDir.hide(); }
    // the two side texts and the outline, as on the page (they fade with the fly)
    const sc0 = calcIntroText(sy, F, vh), timed = reduce ? 1 : clamp((s - 0.4) / 0.6, 0, 1);
    // here the words come in on time alone, from nothing, in one go as the product flies in (no half-played start);
    // the scroll only moves them up with the details later
    const fall = ov.sec._e || 0, tin = timed, it = { tin, lift: (ingOn() ? 0 : fall) + letters * vh * 1.5, o: (1 - Math.pow(1 - tin, 3)) * (!ingOn() && fall > vh * 1.2 ? 0 : 1) * (1 - letters) };
    const o = it.o * (ov.state === 'closing' ? a : 1);
    [ov.card, ov.lead].forEach((el, s) => {
      if (!el) return;
      el.style.opacity = o.toFixed(3); el.style.visibility = o > 0.003 ? 'visible' : 'hidden';
      el.style.transform = 'translate3d(' + ((s ? 24 : -24) * (1 - it.tin)).toFixed(1) + 'px, ' + (-it.lift).toFixed(1) + 'px, 0)';
    });
    if (ov.card) {
      const chars = ov.card.querySelectorAll('.sc-chi'), n = Math.max(1, chars.length);
      chars.forEach((ch, k) => { const u = clamp((it.tin - (k / n) * 0.6) / 0.4, 0, 1), e = 1 - Math.pow(1 - u, 3); ch.style.opacity = (0.15 + 0.85 * e).toFixed(3); ch.style.transform = 'translate3d(' + ((1 - e) * -0.5).toFixed(3) + 'em,0,0)'; });
      ov.card.style.setProperty('--tin', it.tin.toFixed(3)); if (ov.lead) ov.lead.style.setProperty('--tin', it.tin.toFixed(3));
    }
    if (ov.heroName) {                                   // the name: in while the product settles, out as the intro words come in
      const tt = (now - ov.openedAt) / 1000, kin = reduce ? 0 : clamp((tt - 0.5) / 0.9, 0, 1), kout = clamp(s / 0.45, 0, 1);
      const on = (1 - Math.pow(1 - kin, 3)) * (1 - kout) * (ov.state === 'closing' ? a : 1) * (fall > vh * 1.2 ? 0 : 1);
      ov.heroName.style.opacity = on.toFixed(3);
      ov.heroName.style.transform = 'translate3d(0,' + ((1 - Math.pow(1 - kin, 3)) * 0 + (1 - kin) * 46 - s * vh * 0.3 - fall).toFixed(1) + 'px,0)';
    }
    const ovBox = calcProductFrame(hold.x, hold.y, hold.h, ratios[i]);
    // the outline starts drawing once the flip has finished (Lung Booster), and is gone before the letters leave
    let frameDraw;
    if (ingOn()) {
      const T = ingT(vh, F, H), scB = Math.max(0, Math.min(syRaw, F + T.A * vh) - F - T.flip * vh), sm3 = t => t * t * (3 - 2 * t);
      frameDraw = sm3(clamp(scB / (T.grow * vh), 0, 1)) * (1 - sm3(clamp((scB - (T.grow + T.hold) * vh) / (T.away * vh), 0, 1)));
    } else frameDraw = calcFrameDraw(P);
    if (ov.setFrame) ov.setFrame(ovBox, frameDraw * (a > 0.999 && s > 0.999 ? 1 : 0) * (1 - clamp(open / 0.1, 0, 1)));
    const hlc = calcHlCallout(sy, H, vh, (ov.sec._beats ? ov.sec._beats.hlFrom : H - 2.9 * vh) + 0.25 * vh);   // the highlights start once the last piece has left
    if (ov.setCallout) ov.setCallout(ovBox, hlc.o * a, hlc.draw, hlc.lines, 0, hlc.ex);
    decor.update(0, i, 0, 0, 1, tTime, true);
    if (ov.setChapters) ov.setChapters(ovBox, (ingOn() && ing.v < 1) ? Math.min(sy, ov.sec._beats ? ov.sec._beats.r0 : F + 1.05 * vh) : sy, H, a);   // (the falling words wait at their start until the gummies are back: no early, hidden run that would play twice)
    if (ingOn() && ov.sec._beats) { const bt = ov.sec._beats, ex = ov.sec._extra || 0; ov.sec._r = bt.r0 + Math.max(0, syRaw - bt.r0) * (bt.hlFrom - bt.r0) / (bt.hlFrom + ex - bt.r0); }   // the ribbons never stop, not even while the display stands still
    L.renderer.render(L.scene, L.cam);
  }

  window.addEventListener('tl:showcase', e => openOverlay(e.detail && e.detail.index));
  if (wanted) {
    const targetIdx = PRODUCTS.findIndex(p => p.id === wanted || p.slug === wanted);
    if (targetIdx !== -1) {
      requestAnimationFrame(() => {
        openOverlay(targetIdx);
        wake();
      });
      setTimeout(() => {
        if (ov.state === 'closed') {
          openOverlay(targetIdx);
          wake();
        }
      }, 180);
    }
  }

  /* ---------- the frame loop ---------- */
  // Performance: geometry comes from page offsets measured on resize (geo), never from getBoundingClientRect inside the
  // loop, so a frame never forces a layout. The loop sleeps when nothing of the journey or the grid is on screen and no
  // display is open, and wakes on scroll, resize, pointer movement over the grid, or a card click.
  let wasOn = false, lastP = -1, lastIntro = '', last = performance.now();
  const hlv = new Array(N).fill(0);
  const cache = { y: new Array(N).fill(NaN), o: new Array(N).fill(NaN), h: new Array(N).fill(NaN) };
  // the page's own entrance (it has no hero to lift the product from): the product rises into its place and the title
  // lights up on time, the way a card's display opens, instead of from the hero's plinth
  const ENTER_MS = reduce ? 1 : 1100;
  let enterT0 = -1;
  const enterFrom = v => ({ x: v.x, y: geo.vh * 1.12, h: v.h * 0.72, rotX: 0.1, rotY: v.rotY - Math.PI * 1.2, rotZ: -0.08 });
  let rafId = 0;
  const schedule = makeScheduler();                     // after Lenis in the same frame (frame-scheduler.js)
  const wake = () => { if (!rafId) { last = performance.now(); rafId = schedule(frame); } };
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake);
  window.addEventListener('tl:showcase', wake);
  lineupSec.addEventListener('pointermove', wake, { passive: true });

  function frame(now) {
    rafId = 0;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    // the scroll position from Lenis (a plain number): reading window.scrollY here would force a layout whenever
    // anything has written a style earlier in this frame
    const sy = state.lenis ? state.lenis.scroll : scrollY, vh = geo.vh, tTime = now * 0.001;
    flightJars.forEach(j => { j.G.userData.shadowA = 0; });   // the ground shadow belongs to the list only: it is switched on there each frame
    if (ov.state === 'closed' && ov.handed === 0 && !reduce && document.body.classList.contains('scene-on') && reenter(sy)) { rafId = schedule(frame); return; }
    if (ov.state !== 'closed') { if (ov.lenis) ov.lenis.raf(now); renderOverlay(now, tTime); rafId = schedule(frame); return; }   // a product's display is open over the grid
    const lrTop = geo.lineupTop - sy, lrBottom = lrTop + geo.lineupH;
    const inLineup = lrBottom > 0 && lrTop < vh;
    if (geo.hasScene && ov.state === 'closed' && lrTop < -24) { hideScene(sy); rafId = schedule(frame); return; }   // the products are on screen: the scene is not needed any more
    const P = (reduce || !geo.hasScene) ? 1 : journeyProgress(sy, geo);
    if (ov.ppNeed != null) { showcaseSec._ppOff = ov.ppNeed - P; ov.ppNeed = null; }   // the page carries on counting from where the display stopped
    const inJourney = !reduce && geo.hasScene && P > 0 && P < 1;
    const on = inJourney || inLineup;
    if (enterT0 < 0) enterT0 = now;
    const entering = now - enterT0 < ENTER_MS + 1700;     // the product's rise and the title's letters are still playing

    // updateShowcaseDOM reads its blocks' positions first, so it runs before anything below writes a style
    if (showcaseSec && geo.hasScene && !reduce && (inJourney || P !== lastP)) { updateShowcaseDOM(showcaseSec, P, tTime); }
    lastP = P;

    // showcase flow: always shown here (on dhina-dev it waited for the hero to turn flat mint)
    if (flowEl && flowEl._shown !== true) { flowEl._shown = true; flowEl.style.visibility = 'visible'; flowEl.style.opacity = '1'; }

    // the two intro text groups, fixed beside the product: they come in on time as the page opens (letters lighting
    // up left to right), hold, then scroll up with the rest
    if (!reduce && introCard && introLead) {
      const sc0 = calcIntroText(sy - geo.secTop, geo.fadeLen, geo.vh);
      const timed = clamp((now - enterT0 - 200) / 1300, 0, 1);
      const tin = Math.max(sc0.tin, timed);
      const fall = showcaseSec._e || 0;   // the intro falls with the page: same distance as everything else
      const it = { tin, lift: fall, o: (1 - Math.pow(1 - tin, 3)) * (fall > vh * 1.2 ? 0 : 1) };
      const key = it.o.toFixed(3) + '|' + it.tin.toFixed(3) + '|' + it.lift.toFixed(1);
      if (key !== lastIntro) {
        lastIntro = key;
        const vis = it.o > 0.003 ? 'visible' : 'hidden', side = 1 - it.tin;
        introCard.style.opacity = it.o.toFixed(3); introCard.style.visibility = vis;
        introCard.style.transform = 'translate3d(' + (-24 * side).toFixed(1) + 'px, ' + (-it.lift).toFixed(1) + 'px, 0)';
        introLead.style.opacity = it.o.toFixed(3); introLead.style.visibility = vis;
        introCard.style.setProperty('--tin', it.tin.toFixed(3)); introLead.style.setProperty('--tin', it.tin.toFixed(3));
        introLead.style.transform = 'translate3d(' + (24 * side).toFixed(1) + 'px, ' + (-it.lift).toFixed(1) + 'px, 0)';
        const chars = introCard.querySelectorAll('.sc-chi'), n = Math.max(1, chars.length);
        chars.forEach((ch, k) => {
          const u = clamp((it.tin - (k / n) * 0.6) / 0.4, 0, 1);
          const e = 1 - Math.pow(1 - u, 3);
          ch.style.opacity = (0.15 + 0.85 * e).toFixed(3);
          ch.style.transform = 'translate3d(' + ((1 - e) * -0.5).toFixed(3) + 'em,0,0)';   // from the left
        });
      }
    }


    if (!on) {
      if (wasOn) { flightCanvas.classList.remove('active'); wasOn = false; }
      if (progEl) { progEl.style.opacity = '0'; progEl.style.visibility = 'hidden'; }
      setFrame(null, 0); setCallout(null, 0, 0); setChapters(null, 0, 0, 0);
      if (entering) rafId = schedule(frame);   // otherwise sleep until scroll / resize wakes the loop
      return;
    }
    rafId = schedule(frame);                    // on screen: keep turning
    if (!wasOn) { flightCanvas.classList.add('active'); wasOn = true; }

    const act = active;
    mouse.x += (mouse.tx - mouse.x) * 0.08; mouse.y += (mouse.ty - mouse.y) * 0.08;
    if (act !== lastIdx) { lastIdx = act; if (showcaseSec) populateShowcaseDOM(showcaseSec, act); lastIntro = ""; }   // new letters: light them again

    if (inJourney) {
      // showcase: the product holds still and turns while the page scrolls past it; the curtain covers it at the end
      const view = viewFor(act);
      let t = calcHoldTransform(P, handStart || view, view, mouse, tTime, geo.mobile);
      // the page's entrance: from below the screen into its place (the same ease as a card's display opening)
      const k = clamp((now - enterT0) / ENTER_MS, 0, 1);
      if (k < 1 && !handStart) {
        const e = easeIO(k), f = enterFrom(view), lp = (p, q) => p + (q - p) * e;
        t = { x: lp(f.x, t.x), y: lp(f.y, t.y), h: lp(f.h, t.h), rotX: lp(f.rotX, t.rotX), rotY: lp(f.rotY, t.rotY), rotZ: lp(f.rotZ, t.rotZ) };
      }
      // once the curtain's edge has passed the product's top it should be fully covered: hide it, so it never peeks out
      // below the (shorter than the screen) statement page
      const covered = !!stmEl && (geo.pinEnd - sy) < t.y - t.h / 2;
      PRODUCTS.forEach((prod, i) => {
        const jar = flightJars[i];
        if (i !== act) { jar.G.visible = false; return; }
        jar.G.visible = !covered;
        L.place(jar.G, t.x, t.y);
        L.size(jar, Math.max(1, t.h));
        jar.G.rotation.set(t.rotX, t.rotY, t.rotZ);
      });
      decor.update(0, act, 0, 0, 1, tTime, true);
      // the outline around the product: sized from it, grows while the counter runs 005 to 013, stays to 017, gone by 020
      const box = calcProductFrame(t.x, t.y, t.h, ratios[act]);
      setFrame(box, calcFrameDraw(P));
      const hlc = calcHlCallout(sy - geo.secTop, geo.secH, geo.vh, (showcaseSec._beats ? showcaseSec._beats.hlFrom : geo.secH - 2.9 * geo.vh) + 0.25 * geo.vh);
      setCallout(box, hlc.o, hlc.draw, hlc.lines, 0, hlc.ex);
      setChapters(box, sy - geo.secTop, geo.secH, 1);
      L.renderer.render(L.scene, L.cam);
      return;
    }
    setFrame(null, 0); setCallout(null, 0, 0);

    /* ---------- grid: each product stands on its card's panel ---------- */
    // Nothing here moves the cards (they scroll past with the page). Each product turns from a tilt to upright as its
    // card comes up the screen. The colour circle and the line-art follow the pointer; on touch (no hover) the
    // highlight walks through the cards with the scroll instead.
    decor.update(0, act, 0, 0, 1, tTime, true);
    const pr = { top: geo.pinTop - sy, left: geo.pinLeft };   // #lineupPin is not sticky: its page offset is enough
    const first = act;
    const c = clamp((vh - lrTop) / (geo.lineupH + vh), 0, 1);
    const cycleIdx = (reduce || canHover) ? -1 : highlightIndex(c, N, first);
    const inView = lrTop < vh * 0.6 && lrBottom > vh * 0.4;

    PRODUCTS.forEach((prod, i) => {
      const jar = flightJars[i], s = geo.slots[i], card = cardEls[i];
      const order = entranceOrder(i, first, N);                              // the showcase product turns first
      const slotTop = pr.top + s.oy;
      // the products assemble one after another when the page opens (each rises, turns upright and settles), and again
      // as a card scrolls up from below
      const te = reduce ? 1 : clamp((now - enterT0 - 300 - i * 150) / 1150, 0, 1);
      const e = reduce ? 1 : Math.min(te, clamp((vh * 0.97 - slotTop - order * vh * 0.035) / (vh * 0.42), 0, 1));
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
      if (shadowEls[i]) {
        const so = clamp(e * 1.4 - 0.2, 0, 1).toFixed(2);
        if (cache.o[i] !== so) { cache.o[i] = so; shadowEls[i].style.opacity = so; }
      }

      const sx = pr.left + s.ox + s.w / 2;
      const syy = pr.top + s.oy + s.h * 0.5 + s.h * 0.02 - hl * s.h * 0.02;
      jar.G.visible = e > 0.01 && slotTop < vh * 1.05 && slotTop + s.h > -vh * 0.05;
      jar.G.userData.shadowA = 0.5 * clamp(e * 1.3 - 0.3, 0, 1) * (1 - hl * 0.15);
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
  wake();

  // reduced motion: no pinned scene; the grid is shown static with the products upright
  if (reduce && showcaseSec) showcaseSec.hidden = true;

  return { flightJars, L, measure, geo, active: () => active };
}

export { initProductJourney };
