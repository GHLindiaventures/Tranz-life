/**
 * Calculates hero exit fade stages from f = scrollY / fadeLen (0..1):
 *   HOLD & TEXTS: f in 0..0.30 -> hero held in place, small texts fade 1 -> 0
 *   DIM:         f in 0.30..0.80 -> solid mint overlay fades 0 -> 1 over hero
 *   FLAT:        f in 0.80..1.00 -> flat mint overlay fully opaque (1.0)
 *   DONE:        f >= 1.00      -> hero hidden, product zoom complete
 */
/**
 * The two intro text groups that stay fixed beside the product after the zoom (the card on the left, the lead block on
 * the right). sy: scroll position; F: hero height (the zoom and the hero's exit end at sy = F); vh: screen height.
 *   F - 0.15vh .. F + 0.15vh  fade in (letters light up left to right): it starts while the hero is already flat
 *                          mint and the zoom is finishing, so there is never an empty screen
 *   .. F + 1.05vh          hold, fixed beside the product
 *   from F + 1.05vh        the rest of the page reaches the bottom of the screen; the two groups let go and scroll
 *                          up WITH it, 1:1, at full opacity, until they have left the top (no fade-out)
 * The flow content starts at 305vh in the section (see flowTop), i.e. at the bottom of the screen at F + 1.05vh.
 * Returns { o: opacity 0..1, tin: fade-in progress 0..1 (drives the letters and a small sideways settle),
 *           lift: px to move the groups up (0 while they hold) }. Pure.
 */
const INTRO_START = -0.15, INTRO_IN = 0.30, INTRO_RELEASE = 1.05;
function calcIntroText(sy, F, vh) {
  const d = (sy - F) / Math.max(1, vh);
  const tin = clamp((d - INTRO_START) / INTRO_IN, 0, 1);
  const lift = Math.max(0, d - INTRO_RELEASE) * vh;
  const o = (1 - Math.pow(1 - tin, 3)) * (lift > vh * 1.2 ? 0 : 1);   // hidden once it is well above the screen
  return { o, tin, lift };
}

/**
 * The thin rounded outline around the product (like the frame around the can on brewdistrict24.com's beer panel).
 * x, y: the product's centre on screen; h: its height in px; ratio: its width / height (from the 3D model).
 * Returns the rectangle { x, y, w, h, r } in screen px, with room around the product. Pure.
 */
function calcProductFrame(x, y, h, ratio) {
  const w = h * ratio, padX = Math.max(18, h * 0.05), padY = Math.max(24, h * 0.09);   // snug at the sides, airier above and below
  const fw = w + padX * 2, fh = h + padY * 2;
  return { x: x - fw / 2, y: y - fh / 2, w: fw, h: fh, r: Math.min(fw / 2, fw * 0.3) };
}
// How far the outline has grown (0..1), against the progress counter ((P - ARRIVE) / (1 - ARRIVE) x 100):
//   005 -> 013  grows (tendrils climb, leaves sprout, the bud opens)
//   013 -> 017  stays complete
//   017 -> 020  withdraws, the exact reverse of the growth (bud closes, leaves fold, tendrils retract): gone at 020
// Pure.
const FRAME_FROM = 0.05, FRAME_TO = 0.13, FRAME_HOLD = 0.17, FRAME_OUT = 0.20;
function calcFrameDraw(P) {
  const counter = clamp((P - ARRIVE) / (1 - ARRIVE), 0, 1);
  const g = clamp((counter - FRAME_FROM) / (FRAME_TO - FRAME_FROM), 0, 1);
  const w = clamp((counter - FRAME_HOLD) / (FRAME_OUT - FRAME_HOLD), 0, 1);
  const sm = t => t * t * (3 - 2 * t);
  return sm(g) * (1 - sm(w));
}

// The outline as two tendrils: each half starts at the bottom centre and climbs one side to meet the other at the top
// centre (a rounded rectangle split down the middle). inflate pushes it outwards (the second, fainter line). Pure.
function frameHalfPaths(box, inflate = 0) {
  const x = box.x - inflate, y = box.y - inflate, w = box.w + inflate * 2, h = box.h + inflate * 2;
  const r = Math.min(box.r + inflate, w / 2, h / 2), cx = x + w / 2, f = n => n.toFixed(1);
  const left = ['M', f(cx), f(y + h), 'H', f(x + r), 'A', f(r), f(r), 0, 0, 1, f(x), f(y + h - r),
    'V', f(y + r), 'A', f(r), f(r), 0, 0, 1, f(x + r), f(y), 'H', f(cx)].join(' ');
  const right = ['M', f(cx), f(y + h), 'H', f(x + w - r), 'A', f(r), f(r), 0, 0, 0, f(x + w), f(y + h - r),
    'V', f(y + r), 'A', f(r), f(r), 0, 0, 0, f(x + w - r), f(y), 'H', f(cx)].join(' ');
  return [left, right];
}
// where leaves sprout along each tendril (fraction of its length) and how far a leaf has opened for growth u. Pure.
const FRAME_LEAVES = [0.18, 0.4, 0.62, 0.84];
function leafOpen(u, at) {
  const t = clamp((u - at) / 0.1, 0, 1), c1 = 2.2, c3 = c1 + 1;
  return t <= 0 ? 0 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);   // back-out: overshoots a little, settles
}

function calcHeroFadeStages(rawF) {
  const f = clamp(rawF, 0, 1);
  const textO = 1 - clamp(f / 0.30, 0, 1);
  const dimO = clamp((f - 0.30) / 0.50, 0, 1);
  const isFlat = f >= 0.80;
  const isDone = f >= 1.0;
  return { f, textO, dimO, isFlat, isDone };
}

// Showcase Scene: Premium scroll-scrubbed product showcase.
// Coordinates 3D jar staging, masked headlines, sticker badges, callouts, and progress driver.
import * as THREE from 'three';
import { PRODUCTS } from './data/products.js';
import { STORY } from './data/product-story.js';
import { berryGeometry, gummyMaterial, studioLeaf } from '../features/products/product-model.js';
import { DETAILS } from './data/product-details.js';
import { NEEDS } from './data/needs.js';
import { HERBS } from './data/herbs.js';
import { SHOTS, DESIGNS } from '../features/products/product-images.js';
import { icon } from '../features/product-story/icons.js';
import { storeCta } from '../app/store.js';
import { clamp, lerp } from '../utils/math.js';

/**
 * Calculates stage progress and normalized sub-progress values for the 5 stages.
 * Stage 1: 0.00 - 0.12 Arrival
 * Stage 2: 0.12 - 0.40 Spin and reveal
 * Stage 3: 0.40 - 0.70 Detail state
 * Stage 4: 0.70 - 0.90 Settle and exit
 * Stage 5: 0.90 - 1.00 Landing
 */
function calcStageProgress(rawP) {
  const p = clamp(rawP, 0, 1);
  let stage = 1;
  let stageProgress = 0;

  if (p < 0.12) {
    stage = 1;
    stageProgress = p / 0.12;
  } else if (p < 0.40) {
    stage = 2;
    stageProgress = (p - 0.12) / 0.28;
  } else if (p < 0.70) {
    stage = 3;
    stageProgress = (p - 0.40) / 0.30;
  } else if (p < 0.90) {
    stage = 4;
    stageProgress = (p - 0.70) / 0.20;
  } else {
    stage = 5;
    stageProgress = (p - 0.90) / 0.10;
  }

  return {
    p,
    stage,
    stageProgress: clamp(stageProgress, 0, 1),
    tArrival: clamp(p / 0.12, 0, 1),
    tSpin: clamp((p - 0.12) / 0.28, 0, 1),
    tDetail: clamp((p - 0.40) / 0.30, 0, 1),
    tExit: clamp((p - 0.70) / 0.20, 0, 1),
    tLanding: clamp((p - 0.90) / 0.10, 0, 1)
  };
}

/**
 * Computes 3D jar screen position, height, and Euler angles for any progress p.
 */
function calcShowcaseJarTransform(p, plinth, center, slot, mouse = { x: 0, y: 0 }, tTime = 0, isMobile = false) {
  const info = calcStageProgress(p);
  const restRotY = slot.restRotY != null ? slot.restRotY : -0.38;

  let x, y, h, rotX, rotY, rotZ;

  if (p <= 0.12) {
    // Stage 1: Arrival (Plinth -> Center)
    const t = info.tArrival;
    const easeT = t * t * (3 - 2 * t);
    const lift = Math.sin(t * Math.PI) * (isMobile ? 18 : 34);

    x = lerp(plinth.x, center.x, easeT);
    y = lerp(plinth.y, center.y, easeT) - lift;
    h = lerp(plinth.h, center.h * 0.85, easeT);
    rotY = lerp(plinth.rotY, -0.35, easeT) + t * 0.25;
    rotX = lerp(plinth.rotX != null ? plinth.rotX : 0.04, 0.04, easeT);
    rotZ = lerp(plinth.rotZ != null ? plinth.rotZ : -0.02, 0, easeT);
  } else if (p <= 0.40) {
    // Stage 2: Spin and reveal (Center 360 spin + scale up)
    const t = info.tSpin;
    const easeT = t * t * (3 - 2 * t);
    const startRotY = -0.35 + 0.25;

    x = center.x;
    y = center.y;
    h = lerp(center.h * 0.85, center.h, easeT);
    rotY = startRotY + easeT * (Math.PI * 2);
    rotX = 0.04 + Math.sin(t * Math.PI) * 0.05;
    rotZ = Math.sin(t * Math.PI) * 0.03;
  } else if (p <= 0.70) {
    // Stage 3: Detail state (Center slow zoom and tilt + mouse parallax)
    const t = info.tDetail;
    const zoom = Math.sin(t * Math.PI) * (isMobile ? 0.04 : 0.07);
    const tilt = Math.sin(t * Math.PI) * (isMobile ? 0.08 : 0.13);
    const baseRotY = -0.35 + 0.25 + Math.PI * 2;

    x = center.x;
    y = center.y;
    h = center.h * (1 + zoom);
    const env = Math.sin(t * Math.PI); // pointer and idle sway fade to zero at both ends, so stages join without a jump
    rotX = 0.04 + tilt + (mouse.y || 0) * 0.12 * env;
    rotY = baseRotY + Math.sin(t * Math.PI * 2) * 0.16 + ((mouse.x || 0) * 0.35 + Math.sin(tTime * 0.6) * 0.03) * env;
    rotZ = (mouse.x || 0) * 0.04 * env;
  } else if (p <= 0.90) {
    // Stage 4: Settle and exit (Center -> Slot)
    const t = info.tExit;
    const easeT = t * t * (3 - 2 * t);
    const arcY = -Math.sin(t * Math.PI) * (isMobile ? 22 : 44);
    const startRotY = -0.35 + 0.25 + Math.PI * 2;
    const targetRotY = restRotY + Math.PI * 2;

    x = lerp(center.x, slot.x, easeT);
    y = lerp(center.y, slot.y, easeT) + arcY;
    h = lerp(center.h, slot.h, easeT);
    rotY = lerp(startRotY, targetRotY, easeT);
    rotX = lerp(0.04, 0, easeT);
    rotZ = -Math.sin(t * Math.PI) * 0.04;
  } else {
    // Stage 5: Landing (Slot settle)
    const t = info.tLanding;
    const easeT = t * t * (3 - 2 * t);
    const settle = Math.sin(t * Math.PI) * 5 * (1 - t);

    x = slot.x;
    y = slot.y + settle;
    h = slot.h;
    rotY = restRotY + (slot.idleY != null ? slot.idleY : Math.sin(tTime * 0.85) * 0.04) * easeT;
    rotX = (mouse.y || 0) * 0.1 * easeT;
    rotZ = 0;
  }

  return { x, y, h, rotX, rotY, rotZ };
}

/**
 * Maps the page scroll position to the scene progress P (0..1) for the hero path.
 *   pre-roll [showcaseTop - preRoll, showcaseTop]  -> 0 .. ARRIVE      (product leaves the plinth for the centre)
 *   pinned   [showcaseTop, pinEnd - vh]            -> ARRIVE .. EXIT_AT (spin, reveal, detail)
 *   curtain  [pinEnd - vh, pinEnd]                 -> EXIT_AT .. 1      (the dark curtain rises over the pin; stickers
 *                                                                        and headline leave, the product is covered)
 * pinEnd is the page top of the statement that covers the pin. Pure, so any driver can reuse it.
 */
const ARRIVE = 0.12, EXIT_AT = 0.70;
function journeyProgress(scrollY, g) {
  const { showcaseTop, pinEnd, vh } = g;
  const preRoll = g.preRoll != null ? g.preRoll : vh * 0.85;
  const curtainStart = pinEnd - vh;
  if (scrollY <= showcaseTop) return ARRIVE * clamp((scrollY - (showcaseTop - preRoll)) / Math.max(1, preRoll), 0, 1);
  if (scrollY <= curtainStart) return lerp(ARRIVE, EXIT_AT, clamp((scrollY - showcaseTop) / Math.max(1, curtainStart - showcaseTop), 0, 1));
  return lerp(EXIT_AT, 1, clamp((scrollY - curtainStart) / Math.max(1, vh), 0, 1));
}

/**
 * Where the product is for scene progress p. As on the reference, the product HOLDS STILL in the middle of the
 * screen and only turns; the page scrolls up past it, which makes it feel like it is falling.
 *   0 .. ARRIVE   zooms in from the plinth and eases to its place (view.x, view.y, view.h) while the hero fades out
 *   ARRIVE .. 1   stays at that place, turning steadily (about three turns) with a gentle tumble
 * The glide ends exactly where the hold begins (position, height, rotation), so nothing jumps.
 * start: the product on the plinth {x, y, h, rotX, rotY, rotZ}; view: {x, y, h}. Pure.
 */
function calcHoldTransform(p, start, view, mouse = { x: 0, y: 0 }, tTime = 0, isMobile = false) {
  const q = clamp(p, 0, 1);
  const sm = t => t * t * (3 - 2 * t);
  const lead = clamp(q / ARRIVE, 0, 1), e = sm(lead);
  const u = clamp((q - ARRIVE) / (1 - ARRIVE), 0, 1);
  const env = Math.sin(Math.PI * u);                                   // tumble fades in after the glide and out at the end
  const x = lerp(start.x, view.x, e);
  const y = lerp(start.y, view.y, e);                                  // eases up to its place while it zooms in (no hop)
  const h = lerp(start.h, view.h, e);
  // it turns to face front while it zooms in (view.rotY), then makes three full turns from there, so the display
  // always starts, and ends, with the front of the product facing you
  const front = view.rotY != null ? view.rotY : start.rotY;
  const rotY = lerp(start.rotY, front, e) + Math.PI * 2 * 3 * u + (mouse.x || 0) * 0.3 * env + Math.sin(tTime * 0.6) * 0.02 * env;
  const rotZ = lerp(start.rotZ != null ? start.rotZ : -0.012, 0, e) + Math.sin(u * Math.PI * 4) * 0.12 * env;
  const rotX = lerp(start.rotX != null ? start.rotX : 0.04, 0.06, e) + Math.sin(u * Math.PI * 3) * 0.07 * env + (mouse.y || 0) * 0.1 * env;
  return { x, y, h, rotX, rotY, rotZ };
}

/**
 * Fills the showcase page for one product, using only existing copy:
 *   the card (STORY[i]: icon, title, description), the badges (PRODUCTS[i].ing), and down the page the full
 *   write-up from product-details.js (eyebrow, tagline, intro, botanicals list, highlights, closing, small print),
 *   the product finder's line for it (needs.js), its botanicals (herbs.js), price and size, the product photo and
 *   the design board. Reviva has no write-up, so its page uses the catalogue copy instead.
 * Builds a mask for each title letter. Call again when the product changes.
 */
// The section starts under the hero, so its first screen (100vh) is what the hero's fade reveals: only the card sits
// there. Everything else is placed in the rest of the section, ending a little before the curtain. A layout value
// 4..72 (the old percentages) maps onto that range; it is a CSS calc, so it follows the section's real height.
const FLOW_A = 18, FLOW_B = 72;                  // 18 = the first block left in the flow (the two intro groups are pinned)
const flowK = v => clamp((v - FLOW_A) / (FLOW_B - FLOW_A), 0, 1);
// the flow runs from 305vh in the section to FLOW_END screens before its end: the last screens are the highlights
// moment (calcHlCallout) and then the curtain
const FLOW_END = 2.6;
const flowTop = v => 'calc(305vh + (100% - ' + (305 + FLOW_END * 100) + 'vh) * ' + flowK(v).toFixed(4) + ')';
// the design boards' pixel sizes (product shots are all 960 x 960), so their space is kept before they load
const DESIGN_SIZE = { gummies: [1536, 1024], inhaler: [1254, 1254], rollon: [1155, 1362], liver: [1536, 1024] };
// The ingredient badges beside the product: badge k of 3 rises in during its own stretch of the details, drifts, and
// floats away (as the old product display's badges did). u: progress through the details 0..1. Returns
// { o, y (screens), s }. Pure.
function calcPinBadge(u, k, from) {
  const t = clamp((u - (from != null ? from : k * 0.27)) / 0.46, 0, 1), sm = (a, b, x) => { const q = clamp((x - a) / (b - a), 0, 1); return q * q * (3 - 2 * q); };
  const enter = sm(0, 0.3, t), exit = sm(0.62, 0.9, t);
  return { o: Math.min(1, enter * 2.5) * (1 - exit), y: (1 - enter) * 0.5 - exit * 0.35 - (t - 0.5) * 0.06, s: 0.8 + 0.2 * enter };
}
// Splits the details' words into spans for the reveals (CSS, when the block gets .in): each kind of text has its own
// entrance, so the page does not reveal everything the same way. The text itself is unchanged (aria-label keeps it
// readable as one).
function splitDetailWords(root) {
  const kinds = [['.sc-blk__h', 'rise'], ['.sc-quote', 'blur'], ['.sc-tagline', 'blur'], ['.sc-kick', 'spread'],
    ['.sc-list b', 'slide'], ['.sc-herb b', 'slide']];
  kinds.forEach(([sel, kind]) => root.querySelectorAll(sel).forEach(el => {
    if (el.dataset.split || el.children.length) return;
    const text = el.textContent; if (!text.trim()) return;
    el.dataset.split = kind; el.setAttribute('aria-label', text.trim());
    let n = 0;
    el.innerHTML = text.trim().split(/\s+/).map(w => '<span class="dw" aria-hidden="true"><span class="dwi" style="--w:' + (n++) + '">' + esc(w) + '</span></span>').join(' ');
  }));
}
// a big name as letter spans, each with its place in the word (0..1) for the reveal
function bigLetters(text) {
  const chars = [...String(text)], n = Math.max(1, chars.length - 1);
  return chars.map((c, i) => '<span class="bl" style="--li:' + (i / n).toFixed(3) + '">' + (c === ' ' ? '&nbsp;' : esc(c)) + '</span>').join('');
}
const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function populateShowcaseDOM(container, activeIndex) {
  if (!container || activeIndex < 0 || activeIndex >= PRODUCTS.length) return;
  const product = PRODUCTS[activeIndex], story = STORY[activeIndex], D = DETAILS[product.id];
  const need = NEEDS.find(n => n.p === activeIndex), herbs = HERBS.filter(h => h.p === activeIndex);
  const $q = s => container.querySelector(s);

  const letters = t => [...(t || '')].map(ch => `<span class="sc-ch" aria-hidden="true"><span class="sc-chi">${ch === ' ' ? '&nbsp;' : ch}</span></span>`).join('');
  const lineA = $q('#scHeadA'), lineB = $q('#scHeadB'), head = $q('#scHead');
  // only the given details are used: a product without a write-up shows just its name (no catalogue copy)
  const hasD = !!D, nameWords = product.name.split(' '), tl = hasD && story ? story.t : [nameWords[0], nameWords.slice(1).join(' ')];
  if (lineA) lineA.innerHTML = letters(tl[0]);
  if (lineB) lineB.innerHTML = letters(tl[1]);
  if (head) head.setAttribute('aria-label', tl.join(' '));
  if (story) container.style.setProperty('--sc-tint', story.c);
  const ico = $q('#scIco'); if (ico && story) ico.innerHTML = icon(hasD ? story.ic : 'leaf');
  const kick = $q('#scKick'); if (kick) kick.textContent = `${product.no} · ${product.name}`;
  const no = $q('#scNo'); if (no) no.textContent = product.no;
  const desc = $q('#scDesc'); if (desc) desc.innerHTML = hasD && story ? `${icon('spark', 'sc-i')}<span>${esc(story.d)}</span>` : '';

  // right-hand lead card (counterpart to the title card flanking the 3D product)
  const leadKick = $q('#scLeadKick'); if (leadKick) leadKick.textContent = D ? D.eyebrow : '';
  const leadTag = $q('#scLeadTag'); if (leadTag) leadTag.textContent = D ? D.tagline : '';
  const leadHead = $q('#scLeadHead'); if (leadHead) leadHead.textContent = D ? D.title : product.name;
  const leadDesc = $q('#scLeadDesc'); if (leadDesc) leadDesc.textContent = D ? D.intro[0] : '';

  const layer = $q('#scStickers'); if (layer) layer.innerHTML = '';
  // the ingredient badges, held beside the product (product-hand-off.js places and moves them)
  const pb = $q('#scPinBadges');
  if (pb) pb.innerHTML = '';   // (the ingredient badges are gone: only the given details are shown)

  // ---- the details: the important ones are held (one set at a time, big), the others fall past in between ----
  buildDetails(container, product, D, story);

  // the highlights moment: the points split into a left and a right column beside the product (the ingredients when
  // the product has no write-up)
  const hl = $q('#scHl');
  if (hl) {
    const pts = D && D.highlights ? D.highlights : [];   // only the given details
    const half = Math.ceil(pts.length / 2);
    const words = (txt, from, total) => txt.split(/\s+/).map((w, k) => '<span class="hw"><span class="hwi" style="--wn:' + ((from + k) / Math.max(1, total - 1)).toFixed(3) + '">' + esc(w) + '</span></span>').join(' ');
    const col = list => list.map(([t, d]) => {
      const tw = t.split(/\s+/).length, total = tw + (d ? d.split(/\s+/).length : 0);
      return `<div class="sc-hl__item" aria-label="${esc(t + (d ? '. ' + d : ''))}"><b aria-hidden="true">${words(t, 0, total)}</b>${d ? `<span aria-hidden="true">${words(d, tw, total)}</span>` : ''}</div>`;
    }).join('');
    hl.setAttribute('aria-label', D && D.highlightsTitle ? D.highlightsTitle : product.name);
    hl.innerHTML = `<div class="sc-hl__col sc-hl__col--l">${col(pts.slice(0, half))}</div><div class="sc-hl__col sc-hl__col--r">${col(pts.slice(half))}</div>`;
  }

  placeBadges(container);
  container.querySelectorAll('.sc-photo img').forEach(img => { if (!img.complete) img.addEventListener('load', () => placeBadges(container), { once: true }); });

  const arcs = [...container.querySelectorAll('.sc-arcs path')].map(path => ({ path, len: path.getTotalLength() }));
  container._sc = {
    chars: [...container.querySelectorAll('.sc-chi')],
    badges: [...container.querySelectorAll('.sc-badge')],
    blocks: [...container.querySelectorAll('.sc-blk')], bigs: [...container.querySelectorAll('.sc-big')], arcs,
    fill: $q('#scProgFill'), num: $q('#scProgNum'), label: $q('#scProgLabel'),
    labelText: `${product.no} / ${String(PRODUCTS.length).padStart(2, '0')}`, labelSet: false
  };
}

/**
 * Puts each badge in a free gap on its side of the page, near its preferred height, so it never sits on a block
 * (the blocks are different lengths for each product). Uses offsetTop/offsetHeight, which ignore transforms.
 */
// ---- the details as ONE continuous falling page with stops ----
// The page falls past the still product like a normal page, so the screen is never empty. The important details are
// "frames" (a left and a right column around the product) placed in that page; when a frame is centred on the product
// the falling STOPS, the frame's cards animate in one after another (each with its own entrance), and then the page
// falls on, taking the frame away. The other pieces (photos, big names, small print) are in the page between the
// frames. Only the product's given details are used (product-details.js); nothing from the catalogue copy.
function buildDetails(container, product, D, story) {
  const root = container.querySelector('.sc-chs'), blocksEl = container.querySelector('.sc-blocks');
  if (!root || !blocksEl) return;
  const small = innerWidth < 768, hasD = !!D;
  const li = items => '<ul class="sc-list">' + items.map(([t, d], i) =>
    '<li style="--i:' + i + '"><b>' + esc(t) + '</b>' + (d ? '<span>' + esc(d) + '</span>' : '') + '</li>').join('') + '</ul>';

  // the given details
  const list = hasD && D.list && D.list.length ? D.list.slice(0, 8) : [];
  const listHtml = (items, k) => (k === 0 ? '<p class="sc-kick">' + esc(D.listTitle || '') + '</p>' : '') + li(items);
  // as many botanicals to a frame as fit the screen at the big size (4, or fewer when the copy is long)
  const maxH = innerHeight * (small ? 0.62 : 0.66);
  const measure = html => { root.innerHTML = '<div class="sc-slot sc-slot--l sc-slot--measure"><div class="sc-c sc-c--list">' + html + '</div></div>'; return root.firstChild.firstChild.offsetHeight; };
  const chunk = n => { const out = []; for (let k = 0; k < list.length; k += n) out.push(list.slice(k, k + n)); return out; };
  let chunks = chunk(4);
  if (list.length) for (let size = 4; size >= 2; size--) { chunks = chunk(size); if (chunks.every((c, k) => measure(listHtml(c, k)) <= maxH)) break; }
  root.innerHTML = '';
  const ledeHtml = hasD && D.intro[1] ? '<p class="sc-lede">' + esc(D.intro[1]) + '</p>' : '';
  const closingHtml = hasD && D.closing ? '<h4 class="sc-blk__h">' + esc(D.closingTitle) + '</h4><p>' + esc(D.closing) + '</p>' : '';
  // the closing frame: the pack (no price: this is the corporate site; buying happens on the online store, src/app/store.js)
  const buyHtml = (hasD ? '<p class="sc-kick">' + esc(product.tag) + '</p>' : '') + '<p class="sc-price sc-price--pack">' + esc(product.size) + '</p><p class="sc-size">Plant-based · Made in India</p><a class="pill" href="product-details.html?id=' + product.id + '"><i aria-hidden="true">↗</i><b>View full details</b></a>' + storeCta(product.id, { quiet: true, cls: 'sc-store' });

  // the frames, top to bottom, made only from what was given: the botanicals (a frame each, with the intro's second
  // paragraph and the closing words on the right), or - for a product without a botanicals list - the paragraph and the
  // closing words side by side; then the price. A side with nothing for it is simply left out.
  const frames = [], Lq = chunks.map((c, k) => ['sc-c--list', listHtml(c, k)]);
  const Rq = [ledeHtml && ['sc-c--lede', ledeHtml], closingHtml && ['sc-c--closing', closingHtml]].filter(Boolean);
  if (Lq.length) { Lq.forEach(item => frames.push({ l: [item], r: Rq.length ? [Rq.shift()] : [] })); while (Rq.length) frames.push({ l: [Rq.shift()], r: [] }); }
  else while (Rq.length) frames.push({ l: [Rq.shift()], r: Rq.length ? [Rq.shift()] : [] });
  const lastF = frames[frames.length - 1];
  if (lastF && !lastF.r.length) lastF.r = [['sc-c--buy', buyHtml]]; else frames.push({ l: [], r: [['sc-c--buy', buyHtml]] });
  const nF = frames.length; container._frames = nF;

  // the pieces that fall between the frames: the product photo and the design board (the client's images), the big
  // outlined names, and the small print. Each belongs to the stretch before frame st (st = nF: after the last frame).
  const B = [], add = (st, side, cls, html) => { if (html) B.push('<div class="sc-blk sc-blk--' + side + ' ' + cls + '" data-st="' + st + '">' + html + '</div>'); };
  const bigName = (st, text, cls) => B.push('<p class="sc-big ' + cls + '" data-st="' + st + '" aria-hidden="true">' + bigLetters(text) + '</p>');
  bigName(0, hasD && story ? story.t.join(' ') : product.name, '');
  add(0, 'r', 'sc-blk--photo sc-m-hide', SHOTS[product.id] ? '<figure class="sc-photo"><img src="' + SHOTS[product.id] + '" alt="' + esc(product.name) + '" width="960" height="960" loading="lazy" decoding="async"><figcaption>' + esc(product.short) + ' · ' + esc(product.size) + '</figcaption></figure>' : '');
  const sz = DESIGN_SIZE[product.id] || [1536, 1024], mid = Math.min(1, nF);
  add(mid, 'l', 'sc-blk--photo sc-m-hide', DESIGNS[product.id] ? '<figure class="sc-photo sc-photo--wide"><img src="' + DESIGNS[product.id] + '" alt="' + esc(product.name) + ' design" width="' + sz[0] + '" height="' + sz[1] + '" loading="lazy" decoding="async"></figure>' : '');
  bigName(mid, product.short, 'sc-big--2');
  if (hasD && D.note) add(nF, 'l', 'sc-blk--fine', '<p>' + esc(D.note) + '</p>');
  frames.forEach((f, k) => {
    ['l', 'r'].forEach(side => {
      const arr = small ? (side === 'l' ? f.l.concat(f.r) : []) : f[side];
      if (arr.length) B.push('<div class="sc-slot sc-slot--' + side + '" data-fr="' + k + '">' + arr.map(([cls, html]) => '<div class="sc-c ' + cls + '">' + html + '</div>').join('') + '</div>');
    });
  });
  blocksEl.innerHTML = B.join('');
  splitDetailWords(blocksEl);
  container._frameCards = frames.map((f, k) => [...blocksEl.querySelectorAll('.sc-slot[data-fr="' + k + '"] .sc-c')]);
  container._frameSlots = frames.map((f, k) => [...blocksEl.querySelectorAll('.sc-slot[data-fr="' + k + '"]')]);
}

// Plans the section's scroll from the end of the intro to the highlights. naturals[k]: how far stretch k falls at the
// page's own speed (px); a stop of Lh px follows every stretch but the last. r0: where the falling starts; A: scroll
// available for all of it. A short section only makes the falling faster than the scroll (never slower than 1/1.6),
// and the stops shrink last. Pure.
function planBeats(naturals, V, r0, A) {
  const n = naturals.length, nh = Math.max(0, n - 1), N = naturals.reduce((s, x) => s + x, 0);
  let Lh = clamp((A - N) / Math.max(1, nh), 0.45 * V, 0.7 * V);
  const a = N > 0 ? clamp((A - nh * Lh) / N, 0.45, 1.7) : 1;       // scroll px per px of falling
  Lh = clamp((A - a * N) / Math.max(1, nh), 0.4 * V, 0.9 * V);
  const stretches = [], holds = []; let cur = r0, E = 0;
  naturals.forEach((Lf, k) => {
    stretches.push({ start: cur, end: cur + a * Lf, E, Lf }); cur += a * Lf; E += Lf;
    if (k < n - 1) { holds.push({ start: cur, end: cur + Lh }); cur += Lh; }
  });
  return { r0, a, Lh, stretches, holds, hlFrom: cur, Etot: E };
}
// Where the page is at scroll position r (section px): e = how far it has fallen (it stands still during a stop),
// hold = index of the stop in progress (-1 while falling), u = 0..1 through that stop. Pure.
function walkAt(r, b) {
  if (!b || r < b.r0) return { e: 0, hold: -1, u: 0 };
  for (let k = 0; k < b.stretches.length; k++) {
    const s = b.stretches[k], h = b.holds[k];
    if (r < s.end) return { e: s.E + (r - s.start) / b.a, hold: -1, u: 0 };
    if (h && r < h.end) return { e: s.E + s.Lf, hold: k, u: (r - h.start) / Math.max(1, h.end - h.start) };
  }
  return { e: b.Etot, hold: -1, u: 0 };
}
// Lays the page out in falling coordinates (y): the pieces between the frames stack in their own two columns (big
// names across), each frame's columns are centred on one y, and the falling stops when that y reaches the product's
// centre. Everything is stacked top to bottom with a gap, so nothing can overlap; the page starts at the bottom edge
// of the screen, so there is no empty screen at the start or between pieces. Then plans the scroll (planBeats).
function layoutBeats(container) {
  const flow = container.querySelector('.sc-flow'), nF = container._frames;
  if (!flow || !nF) return;
  const V = innerHeight, H = container.offsetHeight; if (!H) return;
  const small = innerWidth < 768, F = (document.getElementById('home') || {}).offsetHeight || V;
  const gap = Math.max(34, V * 0.045), cy = V * (small ? 0.55 : 0.52);
  const groups = Array.from({ length: nF + 1 }, () => []), slots = Array.from({ length: nF }, () => []);
  flow.querySelectorAll('.sc-blk, .sc-big').forEach(el => { if (getComputedStyle(el).display !== 'none') groups[Math.min(nF, +el.dataset.st || 0)].push(el); });
  flow.querySelectorAll('.sc-slot').forEach(s => slots[+s.dataset.fr].push(s));
  const stack = (els, y0) => {
    const bottom = { l: y0 - gap, r: y0 - gap };
    els.forEach(el => {
      if (el.classList.contains('sc-big')) {
        const top = Math.max(bottom.l, bottom.r) + gap, h = el.offsetHeight * 0.8;   // its ink, not its line box
        el.style.top = top.toFixed(0) + 'px'; bottom.l = bottom.r = top + h; return;
      }
      const side = small ? 'l' : el.classList.contains('sc-blk--r') ? 'r' : 'l', top = bottom[side] + gap;
      el.style.top = top.toFixed(0) + 'px'; bottom[side] = top + el.offsetHeight;
    });
    return Math.max(bottom.l, bottom.r);
  };
  // the first piece starts below where the intro texts are still lifting away (they move with the scroll, the page may
  // fall faster), so the two never meet; the intro is still on screen until then, so nothing is empty
  const stops = []; let cursor = V * 1.2;
  for (let g = 0; g <= nF; g++) {
    if (groups[g].length) cursor = stack(groups[g], cursor) + gap;
    if (g < nF) {
      const h = Math.max(0, ...slots[g].map(s => s.offsetHeight)), yc = cursor + h / 2;
      slots[g].forEach(s => { s.style.top = yc.toFixed(0) + 'px'; });
      stops.push(yc - cy); cursor += h + gap;
    }
  }
  const Etot = cursor - gap;                                // the last piece has left through the top
  const naturals = []; let prev = 0;
  stops.forEach(e => { naturals.push(e - prev); prev = e; });
  naturals.push(Math.max(V * 0.4, Etot - prev));
  const r0 = F + 1.05 * V, A = (H - 2 * V) - r0 - 1.0 * V;   // the highlights get a screen, the curtain two
  container._beats = planBeats(naturals, V, r0, A);
}

// Which set is showing at scroll position r (section px), given where the sets start and end (r0, r1) and how many
// there are: { idx (-1 outside), u: 0..1 through that set }. Pure.
function chapterAt(r, r0, r1, n) {
  if (!(n > 0) || r < r0 || r >= r1) return { idx: -1, u: 0 };
  const w = (r1 - r0) / n, idx = Math.min(n - 1, Math.floor((r - r0) / w));
  return { idx, u: clamp((r - r0 - idx * w) / w, 0, 1) };
}
// How visible card j of m is at u through its set: the cards fade in one after another, hold, then all fade out
// together before the set ends (so the next set fades in on a clear screen). Pure.
function chapterCardAlpha(u, j, m) {
  const fin = clamp((u - (0.05 + j * (0.42 / Math.max(1, m)))) / 0.14, 0, 1);
  const fout = clamp((u - 0.84) / 0.12, 0, 1);
  const e = fin * fin * (3 - 2 * fin);
  return e * (1 - fout);
}

// (kept under its old name: called after a resize, on opening, and once photos have loaded)
function placeBadges(container) { layoutBeats(container); }
let badgeResize = 0;
if (typeof window !== 'undefined') window.addEventListener('resize', () => { clearTimeout(badgeResize); badgeResize = setTimeout(() => { const c = document.getElementById('showcase'); if (c && c._sc) placeBadges(c); }, 120); });

// badges down the page: [left in vw, preferred top in % of the section], alternating sides of the product; tilt in degrees
const BADGE_SPOTS = [[22, 15.5], [20, 38.4], [74, 49]];
const BADGE_TILT = [-9, 7, -4];
const easeOut3 = t => 1 - Math.pow(1 - t, 3);
// style writes only when the value changed: the per-frame update touches a handful of elements, and an unchanged
// opacity / transform / variable would still make the browser restyle and repaint them every frame
const put = (el, prop, val) => { const k = '_' + prop; if (el[k] !== val) { el[k] = val; el.style[prop] = val; } };
const putVar = (el, name, val) => { const k = '_v' + name; if (el[k] !== val) { el[k] = val; el.style.setProperty(name, val); } };
const rise = (p, a, d) => clamp((p - a) / d, 0, 1);
const onScreen = (r, vh, span = 0.35) => clamp((vh * 0.95 - r.top) / (vh * span), 0, 1);

/**
 * Updates the page around the product for scene progress p (0..1). The page itself scrolls normally (it is not
 * pinned); this reveals things as they come up the screen. Transform and opacity only (plus one class per block
 * that lets its list rows step in).
 */
function updateShowcaseDOM(container, p, tTime = 0) {
  const s = container && container._sc; if (!s) return;
  const vh = innerHeight;

  // (the title letters are lit by product-hand-off.js with calcIntroText: the card is pinned beside the product)

  // Performance (products page): every element's position is read first, in one pass, and only then is anything
  // written. Reading after each write (as dhina-dev did) forced a fresh layout for every block, every frame.
  const badgeR = s.badges.map(el => el.getBoundingClientRect());
  const blockR = s.blocks.map(el => (el.classList.contains('sc-blk--lead') ? null : el.getBoundingClientRect()));
  const bigR = s.bigs.map(el => el.getBoundingClientRect());

  s.badges.forEach((el, k) => {
    const r = badgeR[k]; if (r.bottom < -40 || r.top > vh + 40) return;
    const t = onScreen(r, vh, 0.3), e = t < 1 ? easeOut3(t) * (t < 0.8 ? 1.12 : 1) : 1;
    put(el, 'transform', `rotate(${(BADGE_TILT[k] * (1 + (1 - t) * 4)).toFixed(1)}deg) scale(${e.toFixed(3)})`);
  });
  s.blocks.forEach((el, bi) => {
    if (el.classList.contains('sc-blk--lead')) return; // handled by horizontal entrance
    const r = blockR[bi]; if (r.bottom < -60 || r.top > vh + 60) return;
    const raw = onScreen(r, vh, 0.32), t = easeOut3(raw);
    const photo = el.classList.contains('sc-blk--photo');
    // photos: no fade, they are uncovered by a wipe instead (--rv) and drift a little inside their frame (--py)
    put(el, 'opacity', photo ? '1' : t.toFixed(2));
    put(el, 'transform', `translate3d(0, ${((1 - t) * (photo ? 60 : 40)).toFixed(0)}px, 0)`);
    if (photo) {
      putVar(el, '--rv', easeOut3(clamp(raw * 1.25, 0, 1)).toFixed(2));
      putVar(el, '--py', clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1).toFixed(2));
    }
    const on = t > 0.15; if (el.classList.contains('in') !== on) el.classList.toggle('in', on);
  });
  // white ribbons behind the details: each draws in, then draws away, one after another (from the old display)
  s.ribbons = s.ribbons || [...container.querySelectorAll('.sc-ribbons path')].map(path => ({ path, len: path.getTotalLength() }));
  // they follow the scroll itself (not how far the page has fallen), so they keep drawing through the stops too
  const bt = container._beats, ru = bt ? clamp(((container._r || 0) - bt.r0) / Math.max(1, bt.hlFrom - bt.r0), 0, 1) : clamp((p - 0.2) / 0.38, 0, 1);
  s.ribbons.forEach((a, k) => {
    const st = k * 0.3, hd = clamp((ru - st) / 0.26, 0, 1), tl = clamp((ru - st - 0.2) / 0.26, 0, 1);
    put(a.path, 'strokeDasharray', ((hd - tl) * a.len).toFixed(0) + ' ' + a.len.toFixed(0));
    put(a.path, 'strokeDashoffset', (-tl * a.len).toFixed(0));
  });
  // big outlined names: the letters come in in reading order (first letter first), each sliding in from the left
  // and the whole name drifts sideways with the scroll (the first one right, the second one left), so it keeps moving
  // through the stops too
  const bt2 = container._beats, sp = bt2 ? clamp(((container._r || 0) - bt2.r0) / Math.max(1, bt2.hlFrom - bt2.r0), 0, 1) : 0;
  s.bigs.forEach((el, k) => {
    const r = bigR[k]; if (r.bottom < -40 || r.top > vh + 40) return;
    putVar(el, '--be', clamp((vh * 1.02 - r.top) / (vh * 0.62), 0, 1).toFixed(2));
    put(el, 'transform', 'translate3d(' + ((sp - 0.5) * 0.12 * innerWidth * (k ? -1 : 1)).toFixed(0) + 'px, 0, 0)');
  });

  // Progress row & swooshes: appear only when scrolling past arrival into the showcase scene
  const enterT = clamp((p - ARRIVE) / 0.04, 0, 1);
  s.prog = s.prog || container.querySelector('.sc-progress');
  if (s.prog) {
    put(s.prog, 'opacity', enterT.toFixed(2));
    put(s.prog, 'visibility', enterT > 0.005 ? 'visible' : 'hidden');
  }

  const along = enterT > 0 ? clamp((p - ARRIVE) / (1 - ARRIVE), 0, 1) : 0;
  s.arcs.forEach((a, k) => {
    const hd = along > 0 ? clamp(along * 1.15 - k * 0.04, 0, 1) : 0;
    put(a.path, 'strokeDasharray', `${(hd * a.len).toFixed(0)} ${a.len.toFixed(0)}`);
  });

  if (s.label && !s.labelSet) { s.label.textContent = s.labelText; s.labelSet = true; }
  const progP = clamp((p - ARRIVE) / (1 - ARRIVE), 0, 1);
  if (s.fill) put(s.fill, 'transform', `scaleX(${progP.toFixed(3)})`);
  if (s.num) { const t = String(Math.min(100, Math.max(0, Math.round(progP * 100)))).padStart(3, '0'); if (s.num._t !== t) { s.num._t = t; s.num.textContent = t; } }
}

function createShowcaseDecor(L) {
  const decorGroup = new THREE.Group();
  decorGroup.visible = false;
  L.scene.add(decorGroup);

  const berryGeo = berryGeometry(0.18, 1.2);
  const berryMat = gummyMaterial();
  const gummyColors = PRODUCTS[0].gummy;

  // 4 gummy props
  const berryMeshes = [0, 1, 2, 3].map(k => {
    const m = new THREE.Mesh(berryGeo, berryMat.clone());
    m.material.color.set(gummyColors[k % gummyColors.length]).convertSRGBToLinear();
    decorGroup.add(m);
    return m;
  });

  // 4 botanical leaf props
  const leafColors = ['#5d9a44', '#6fa84f', '#4f8a3c', '#7cb858'];
  const leafMeshes = leafColors.map(col => {
    const m = studioLeaf(col);
    decorGroup.add(m);
    return m;
  });

  function update(p, activeIndex, centerX, centerY, centerH, tTime, isMobile) {
    if (true || p < 0.26 || p > 0.56 || isMobile) {   // switched off: no orbiting gummies / leaves
      decorGroup.visible = false;
      return;
    }

    decorGroup.visible = true;
    const isGummy = (activeIndex === 0);

    berryMeshes.forEach(m => { m.visible = isGummy; });
    leafMeshes.forEach(m => { m.visible = !isGummy; });

    const activeMeshes = isGummy ? berryMeshes : leafMeshes;
    const t = clamp((p - 0.27) / 0.28, 0, 1);
    const expand = Math.sin(t * Math.PI); // 0 -> 1 -> 0

    const orbitRadiusX = centerH * 0.44 * expand;
    const orbitRadiusY = centerH * 0.32 * expand;

    activeMeshes.forEach((mesh, idx) => {
      const angle = (idx / activeMeshes.length) * Math.PI * 2 + tTime * 0.8 + t * Math.PI;
      const px = centerX + Math.cos(angle) * orbitRadiusX;
      const py = centerY + Math.sin(angle) * orbitRadiusY + Math.sin(tTime * 1.5 + idx) * 8;

      L.place(mesh, px, py);
      mesh.position.z = Math.sin(angle) * 1.5;

      const ppu = L.ppu();
      const targetScale = Math.max(0.001, (centerH * 0.16 * expand) / ppu);
      mesh.scale.setScalar(targetScale);
      mesh.rotation.set(angle * 0.5 + tTime, angle + tTime * 0.7, tTime * 0.3);
    });
  }

  return { group: decorGroup, update };
}

/**
 * The highlights moment at the end of the details. r: scroll position measured from the top of the section; H: the
 * section's height; vh: screen height; flowBottom: where the last block of the details ends (all px).
 *   in     as soon as the last block is near the top of the screen (so the empty stretch after the details is used),
 *          the brackets draw in around the product and the points fade up word by word, in place (draw); then the
 *          lines run out to them (lines)
 *   out    just before the curtain arrives, the words leave upwards one after another and the brackets and lines
 *          draw back (ex), so nothing is left for the curtain to cover
 * Returns { o, draw, lines, ex (all 0..1), y: 0 }. Pure.
 */
function calcHlCallout(r, H, vh, flowBottom) {
  const leaveAt = H - 2 * vh;
  const fb = Number.isFinite(flowBottom) ? flowBottom : H - (FLOW_END - 0.3) * vh;
  const start = Math.min(fb - 0.25 * vh, leaveAt - 0.6 * vh);   // the last block is near the top: the space is free
  const draw = clamp((r - start) / (0.35 * vh), 0, 1);
  const lines = clamp((r - start - 0.18 * vh) / (0.2 * vh), 0, 1);
  const ex = clamp((r - (leaveAt - 0.12 * vh)) / (0.3 * vh), 0, 1);
  return { o: draw > 0 && ex < 1 ? 1 : 0, draw, lines, ex, y: 0 };
}

export {
  calcHlCallout, FLOW_END, calcPinBadge, chapterAt, chapterCardAlpha, planBeats, walkAt,
  calcHeroFadeStages,
  calcIntroText,
  calcProductFrame,
  calcFrameDraw,
  frameHalfPaths,
  leafOpen,
  FRAME_LEAVES,
  ARRIVE,
  EXIT_AT,
  journeyProgress,
  calcStageProgress,
  calcShowcaseJarTransform,
  calcHoldTransform,
  populateShowcaseDOM,
  updateShowcaseDOM,
  placeBadges,
  createShowcaseDecor
};

