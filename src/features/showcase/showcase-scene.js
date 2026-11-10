// Showcase Scene: Premium scroll-scrubbed product showcase.
// Coordinates 3D jar staging, masked headlines, sticker badges, callouts, and progress driver.
import * as THREE from 'three';
import { PRODUCTS } from '../../data/products.js';
import { STORY } from '../../data/product-story.js';
import { berryGeometry, gummyMaterial, studioLeaf } from '../products/product-model.js';
import { DETAILS } from '../../data/product-details.js';
import { NEEDS } from '../../data/needs.js';
import { HERBS } from '../../data/herbs.js';
import { SHOTS, DESIGNS } from '../products/product-images.js';
import { icon } from '../product-story/icons.js';
import { inr } from '../../utils/format.js';
import { clamp, lerp } from '../../utils/math.js';

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
 *   0 .. ARRIVE   lifts off the plinth and glides to its place (view.x, view.y), growing to view.h
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
  const y = lerp(start.y, view.y, e) - Math.sin(lead * Math.PI) * (isMobile ? 18 : 34);
  const h = lerp(start.h, view.h, e);
  const rotY = start.rotY + Math.PI * 2 * 3 * q + (mouse.x || 0) * 0.3 * env + Math.sin(tTime * 0.6) * 0.02 * env;
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
const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function populateShowcaseDOM(container, activeIndex) {
  if (!container || activeIndex < 0 || activeIndex >= PRODUCTS.length) return;
  const product = PRODUCTS[activeIndex], story = STORY[activeIndex], D = DETAILS[product.id];
  const need = NEEDS.find(n => n.p === activeIndex), herbs = HERBS.filter(h => h.p === activeIndex);
  const $q = s => container.querySelector(s);

  const letters = t => [...(t || '')].map(ch => `<span class="sc-ch" aria-hidden="true"><span class="sc-chi">${ch === ' ' ? '&nbsp;' : ch}</span></span>`).join('');
  const lineA = $q('#scHeadA'), lineB = $q('#scHeadB'), head = $q('#scHead');
  if (lineA && story) lineA.innerHTML = letters(story.t[0]);
  if (lineB && story) lineB.innerHTML = letters(story.t[1]);
  if (head && story) head.setAttribute('aria-label', story.t.join(' '));
  if (story) container.style.setProperty('--sc-tint', story.c);
  const ico = $q('#scIco'); if (ico && story) ico.innerHTML = icon(story.ic);
  const kick = $q('#scKick'); if (kick) kick.textContent = `${product.no} · ${product.name}`;
  const desc = $q('#scDesc'); if (desc && story) desc.innerHTML = `${icon('spark', 'sc-i')}<span>${esc(story.d)}</span>`;

  const layer = $q('#scStickers');
  if (layer) layer.innerHTML = (product.ing || []).slice(0, BADGE_SPOTS.length).map((txt, k) =>
    `<span class="sc-badge${k % 2 ? ' sc-badge--alt' : ''}" style="left:${BADGE_SPOTS[k][0]}vw;top:${BADGE_SPOTS[k][1]}%">${esc(txt)}</span>`).join('');

  // ---- the blocks down the page: [top in % of the section, side, class, html] ----
  const B = [];
  const add = (top, side, cls, html) => { if (html) B.push(`<div class="sc-blk sc-blk--${side} ${cls}" style="top:${top}%">${html}</div>`); };
  const rows = (items, numbered) => `<ul class="sc-list${numbered ? ' sc-list--num' : ''}">${items.map(([t, d], i) =>
    `<li style="--i:${i}">${numbered ? `<i>${String(i + 1).padStart(2, '0')}</i>` : ''}<b>${esc(t)}</b>${d ? `<span>${esc(d)}</span>` : ''}</li>`).join('')}</ul>`;

  add(4, 'r', 'sc-blk--lead', `<p class="sc-kick">${esc(D ? D.eyebrow : `${product.tag} · ${product.size}`)}</p><p class="sc-tagline">${esc(D ? D.tagline : story.note)}</p>`);
  add(11, 'r', '', `<h4 class="sc-blk__h">${esc(D ? D.title : product.name)}</h4><p>${esc(D ? D.intro[0] : product.desc)}</p>`);
  B.push(`<p class="sc-big" style="top:18%" aria-hidden="true">${esc(story.t.join(' '))}</p>`);
  // botanicals / list (or the badges' own words when there is no write-up)
  if (D && D.list && D.list.length) add(24, 'l', 'sc-blk--list', `<p class="sc-kick">${esc(D.listTitle)}</p>${rows(D.list.slice(0, 7))}`);
  else if (D && D.highlights) add(24, 'l', 'sc-blk--list', `<p class="sc-kick">${esc(D.highlightsTitle)}</p>${rows(D.highlights)}`);
  else add(24, 'l', 'sc-blk--list', `<p class="sc-kick">${esc(product.tag)}</p>${rows((product.ing || []).map(t => [t, '']))}`);
  add(26, 'r', 'sc-blk--photo sc-m-hide', SHOTS[product.id] ? `<figure class="sc-photo"><img src="${SHOTS[product.id]}" alt="${esc(product.name)}" loading="lazy" decoding="async"><figcaption>${esc(product.short)} · ${esc(product.size)}</figcaption></figure>` : '');
  if (D && D.list && D.list.length && D.highlights) add(38, 'r', 'sc-blk--list', `<p class="sc-kick">${esc(D.highlightsTitle)}</p>${rows(D.highlights, true)}`);
  else if (D && D.closing) add(38, 'r', '', `<h4 class="sc-blk__h">${esc(D.closingTitle)}</h4><p>${esc(D.closing)}</p>`);
  if (need) add(44.5, 'l', 'sc-blk--need sc-m-hide', `<p class="sc-quote">“${esc(need.t)}”</p><p>${esc(need.why)}</p>`);
  add(50, 'l', 'sc-blk--photo sc-m-hide', DESIGNS[product.id] ? `<figure class="sc-photo sc-photo--wide"><img src="${DESIGNS[product.id]}" alt="${esc(product.name)} design" loading="lazy" decoding="async"></figure>` : '');
  add(53, 'r', 'sc-blk--buy', `<p class="sc-kick">${esc(product.tag)}</p><p class="sc-price">${inr(product.price)}</p><p class="sc-size">${esc(product.size)}</p><button class="pill mini-add" type="button" data-id="${product.id}"><i aria-hidden="true">+</i><b>Add to bag</b></button>`);
  B.push(`<p class="sc-big sc-big--2" style="top:60%" aria-hidden="true">${esc(product.short)}</p>`);
  add(64, 'l', '', D && D.intro[1] ? `<p class="sc-lede">${esc(D.intro[1])}</p>` : `<p class="sc-tagline">${esc(story.note)}</p>`);
  if (herbs.length) add(64, 'r', 'sc-blk--herbs sc-m-hide', `<p class="sc-kick">${esc(product.name)}</p>${herbs.map((h, i) => `<div class="sc-herb" style="--i:${i}"><b>${esc(h.n)}</b><em>${esc(h.latin)}</em><span>${esc(h.part)} · ${esc(h.cmp)}</span></div>`).join('')}`);
  else if (D && D.closing && D.list && D.list.length) add(64, 'r', 'sc-m-hide', `<h4 class="sc-blk__h">${esc(D.closingTitle)}</h4><p>${esc(D.closing)}</p>`);
  else add(64, 'r', 'sc-blk--lead sc-m-hide', `<p class="sc-tagline">${esc(story.note)}</p>`);
  if (D && D.note) add(72, 'l', 'sc-blk--fine', `<p>${esc(D.note)}</p>`);

  const blocks = $q('#scBlocks'); if (blocks) blocks.innerHTML = B.join('');

  placeBadges(container);

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
function placeBadges(container) {
  const flow = container.querySelector('.sc-flow'), badges = [...container.querySelectorAll('.sc-badge')];
  if (!flow || !badges.length) return;
  const H = flow.offsetHeight, limit = H * 0.74, mid = innerWidth / 2, pad = 36;
  const taken = { l: [], r: [] };
  [...container.querySelectorAll('.sc-card, .sc-blk')].forEach(el => {
    if (getComputedStyle(el).display === 'none') return;
    const side = el.offsetLeft + el.offsetWidth / 2 < mid ? 'l' : 'r';
    taken[side].push([el.offsetTop - pad, el.offsetTop + el.offsetHeight + pad]);
  });
  badges.forEach((b, k) => {
    const [x, yPct] = BADGE_SPOTS[k] || BADGE_SPOTS[0], side = x < 50 ? 'l' : 'r', size = b.offsetHeight || 150;
    const want = H * yPct / 100, list = taken[side].slice().sort((p, q) => p[0] - q[0]);
    const gaps = []; let at = 0;
    list.forEach(([a, z]) => { if (a - at >= size) gaps.push([at, a]); at = Math.max(at, z); });
    if (limit - at >= size) gaps.push([at, limit]);
    let best = null, bestD = Infinity;
    gaps.forEach(([a, z]) => { const y = clamp(want, a, z - size), d = Math.abs(y - want); if (d < bestD) { bestD = d; best = y; } });
    const y = best == null ? want : best;
    b.style.top = (y / H * 100).toFixed(2) + '%';
    taken[side].push([y - pad, y + size + pad]);
  });
}
let badgeResize = 0;
if (typeof window !== 'undefined') window.addEventListener('resize', () => { clearTimeout(badgeResize); badgeResize = setTimeout(() => { const c = document.getElementById('showcase'); if (c && c._sc) placeBadges(c); }, 120); });

// badges down the page: [left in vw, preferred top in % of the section], alternating sides of the product; tilt in degrees
const BADGE_SPOTS = [[22, 15.5], [20, 38.4], [74, 49]];
const BADGE_TILT = [-9, 7, -4];
const easeOut3 = t => 1 - Math.pow(1 - t, 3);
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

  s.chars.forEach((c, k) => {
    const tin = easeOut3(rise(p, 0.02 + k * 0.007, 0.08));
    c.style.transform = `translate3d(0, ${((1 - tin) * 115).toFixed(1)}%, 0)`;
  });
  s.badges.forEach((el, k) => {
    const r = el.getBoundingClientRect(); if (r.bottom < -40 || r.top > vh + 40) return;
    const t = onScreen(r, vh, 0.3), e = t < 1 ? easeOut3(t) * (t < 0.8 ? 1.12 : 1) : 1;
    el.style.transform = `rotate(${(BADGE_TILT[k] * (1 + (1 - t) * 4)).toFixed(1)}deg) scale(${e.toFixed(3)})`;
  });
  s.blocks.forEach(el => {
    const r = el.getBoundingClientRect(); if (r.bottom < -60 || r.top > vh + 60) return;
    const t = easeOut3(onScreen(r, vh, 0.32));
    el.style.opacity = t.toFixed(3);
    el.style.transform = `translate3d(0, ${((1 - t) * 40).toFixed(1)}px, 0)`;
    const on = t > 0.15; if (el.classList.contains('in') !== on) el.classList.toggle('in', on);
  });
  s.bigs.forEach((el, k) => {
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
    const t = clamp((vh - r.top) / (vh + r.height), 0, 1);
    el.style.transform = `translate3d(${((k ? -1 : 1) * (t - 0.5) * 14).toFixed(2)}vw, 0, 0)`;
  });

  // white swooshes draw down the page, tied to where the section is so the tip stays on screen
  const sr = container.getBoundingClientRect(), along = clamp((vh * 0.85 - sr.top) / Math.max(1, sr.height), 0, 1);
  s.arcs.forEach((a, k) => {
    const hd = clamp(along * 1.12 - k * 0.04, 0, 1);
    a.path.style.strokeDasharray = `${(hd * a.len).toFixed(1)} ${a.len.toFixed(1)}`;
  });

  if (s.label && !s.labelSet) { s.label.textContent = s.labelText; s.labelSet = true; }
  if (s.fill) s.fill.style.transform = `scaleX(${p.toFixed(4)})`;
  if (s.num) s.num.textContent = String(Math.min(100, Math.max(0, Math.round(p * 100)))).padStart(3, '0');
}

/**
 * Creates 3D orbiting decorative props for the Detail state (gummies berryGeometry or botanical leaves).
 */
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
    if (p < 0.38 || p > 0.72 || isMobile) {
      decorGroup.visible = false;
      return;
    }

    decorGroup.visible = true;
    const isGummy = (activeIndex === 0);

    berryMeshes.forEach(m => { m.visible = isGummy; });
    leafMeshes.forEach(m => { m.visible = !isGummy; });

    const activeMeshes = isGummy ? berryMeshes : leafMeshes;
    const t = clamp((p - 0.40) / 0.30, 0, 1);
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

export {
  ARRIVE,
  EXIT_AT,
  journeyProgress,
  calcStageProgress,
  calcShowcaseJarTransform,
  calcHoldTransform,
  populateShowcaseDOM,
  updateShowcaseDOM,
  createShowcaseDecor
};

