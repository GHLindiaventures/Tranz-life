// Product-site motion for the sections below the hero. Phase A: split-wipe menu, benefits column highlight,
// highlighter pills, shop quick-add. Phase B: scallop edges, back-to-top wipe, footer reveal.
// The hero (#home) and #lineup are not touched.
// Styles: src/styles/components/motion-extras.css
import { ScrollTrigger, gsap, hasGsap } from '../lib/gsap.js';
import { MOTION } from './motion-tokens.js';
import { state } from './state.js';
import { $, $$ } from '../utils/dom.js';
import { reduce } from '../utils/media.js';
import { LAYOUT, scrollToPage, pageProgress } from './page-sections.js';
import { badgeState, badgeSpot, pad3, smoothstep } from './scroll-math.js';
import { PRODUCTS } from '../data/products.js';
import { STORY } from '../data/product-story.js';

const CONFIG = {
  wipe: { half: MOTION.dur.wipe, ease: MOTION.ease.wipe, slitDelay: 0.55 },  // two halves = 0.8s
  menu: { stagger: MOTION.stagger.menu, staggerSmall: 0.04 },
  benefits: { table: '#benefits table.tbl', rowStagger: 0.05, settle: 0.6 },
  pills: { insider: '#insider .in-h .lt', story: '#seqTitle .l2', storyFinal: '#seqFinal', duration: 0.7, delay: 0.45 },
  // B1/B2: scallop edges (row of half-circles) on these sections' tops; the shop turns dark green
  scallop: { dark: '#shop', edges: ['#shop', '#contact', 'footer', '#insider'], from: 0.35, settle: 0.45, scrub: 0.4 },
  // Palmo-style extras
  // badges: round stickers with each product's own ingredient chips rise around its jar in the product story
  // (spots are [x vw, y vh] for a product whose jar sits right of centre; odd products mirror)
  badges: { spots: [[82, 20], [91, 64], [70, 84]], tilt: [-9, 7, -4] },
  split: { shop: '#shop .shop-head .h2', footer: 'footer .f-big', shift: 14, shiftSmall: 6 },
  insider: { cards: '#insider .in-card', from: [-150, 40, 170], scale: 0.86 },
  footer: { logo: 'footer .f-brand', big: 'footer .f-big', cols: 'footer .f-row > div', bottom: 'footer .f-bot', stagger: 0.09 },
  small: '(max-width:767px)'
};

// ---- split wipe: two brand-green panels close from the sides, a gold slit flashes in the seam, they part ----
let wipeEl = null, wiping = false;
function wipeLayer(){
  if (wipeEl) return wipeEl;
  wipeEl = document.createElement('div');
  wipeEl.className = 'tl-wipe'; wipeEl.setAttribute('aria-hidden', 'true');
  wipeEl.innerHTML = '<i class="tw-l"></i><i class="tw-r"></i><i class="tw-slit"></i>';
  document.body.appendChild(wipeEl);
  if (hasGsap){ gsap.set($('.tw-l', wipeEl), { x:0, xPercent:-100 }); gsap.set($('.tw-r', wipeEl), { x:0, xPercent:100 }); }
  return wipeEl;
}
// mid() runs while the panels fully cover the screen; returns a promise that resolves when the wipe is done
function slitWipe(mid){
  if (reduce || !hasGsap || wiping){ if (mid) mid(); return Promise.resolve(); }
  wiping = true;
  const w = wipeLayer(), l = $('.tw-l', w), r = $('.tw-r', w), slit = $('.tw-slit', w), h = CONFIG.wipe.half, ease = CONFIG.wipe.ease;
  return new Promise(done => {
    gsap.timeline({ onComplete(){ gsap.set(w, { visibility:'hidden' }); wiping = false; done(); } })
      .set(w, { visibility:'visible' })
      .fromTo(l, { xPercent:-100 }, { xPercent:0, duration:h, ease }, 0)
      .fromTo(r, { xPercent:100 }, { xPercent:0, duration:h, ease }, 0)
      .fromTo(slit, { scaleY:0, opacity:1 }, { scaleY:1, duration:h*.6, ease:'power2.out' }, h*CONFIG.wipe.slitDelay)
      .add(() => { if (mid) mid(); }, h)
      .to(l, { xPercent:-100, duration:h, ease }, h + .04)
      .to(r, { xPercent:100, duration:h, ease }, h + .04)
      .to(slit, { opacity:0, duration:.25 }, h + .12);
  });
}

// ---- A1: menu opens and closes behind the split wipe; links rise one by one and leave in reverse ----
function initMenuMotion(){
  const menu = $('#menu'), list = $('#menuList');
  if (!menu || !list || reduce || !hasGsap) return;
  menu.classList.add('wipe-mode');
  const setStagger = () => {
    const n = list.children.length, st = matchMedia(CONFIG.small).matches ? CONFIG.menu.staggerSmall : CONFIG.menu.stagger;
    list.style.setProperty('--n', n); list.style.setProperty('--mstag', st + 's');
  };
  setStagger(); window.addEventListener('resize', setStagger);
  state.menuWipe = (open, apply) => {
    if (open) return slitWipe(apply);
    menu.classList.add('closing');            // links leave in reverse while the panels close in
    return slitWipe(() => { apply(); menu.classList.remove('closing'); });
  };
}

// ---- A2: once the comparison rows have landed, the TranzLife column takes a steady soft highlight ----
function initBenefits(){
  const table = $(CONFIG.benefits.table); if (!table) return;
  const rows = $$('tbody tr', table).length;
  if (reduce || !hasGsap || !ScrollTrigger){ table.classList.add('tl-col'); return; }
  ScrollTrigger.create({ trigger: table, start: 'top 85%', once: true,
    onEnter: () => gsap.delayedCall(rows*CONFIG.benefits.rowStagger + CONFIG.benefits.settle, () => table.classList.add('tl-col')) });
}

// ---- A3: marker-style highlight grows behind existing accent words when their heading reveals ----
function initPills(){
  const ins = $(CONFIG.pills.insider), story = $(CONFIG.pills.story), fin = $(CONFIG.pills.storyFinal);
  [ins, story].forEach(el => el && el.classList.add('hl-pill'));
  if (reduce || !hasGsap) return;                       // pill shows at full size (CSS default)
  const grow = (el, on, delay = 0) => gsap.to(el, { '--hl': on ? 1 : 0, duration: CONFIG.pills.duration, delay, ease: MOTION.ease.smooth, overwrite: true });
  if (ins && ScrollTrigger){
    gsap.set(ins, { '--hl': 0 });
    ScrollTrigger.create({ trigger: ins.closest('h2') || ins, start: 'top 86%', once: true, onEnter: () => grow(ins, true, CONFIG.pills.delay) });
  }
  if (story && fin){
    gsap.set(story, { '--hl': 0 });
    // the product story finale plays by toggling .play on #seqFinal (product-story.js); follow it
    new MutationObserver(() => grow(story, fin.classList.contains('play'), fin.classList.contains('play') ? CONFIG.pills.delay + .3 : 0))
      .observe(fin, { attributes: true, attributeFilter: ['class'] });
  }
}

// ---- A4 (Palmo flavour cards): framed tile, colour fill + tilted product + line-art on hover, rolling name ----
// Nothing is removed: the name is split into letter spans (same text, read out via aria-label), and decorative
// leaf outlines are added to the photo tile. The price row stays in the card; its "Add to bag" label opens on hover.
const DOODLE = '<svg class="pc-doodle" viewBox="0 0 200 200" aria-hidden="true"><path d="M30 168c10-46 40-82 92-104M30 168c40-6 78-34 92-104-40 4-76 30-92 104z"/><path d="M150 40c-8 22-4 44 14 60 6-24 0-44-14-60zM150 40c4 30 10 46 14 60"/><path d="M118 176c14-14 34-18 54-10-16 14-36 16-54 10zM118 176c20-4 38-8 54-10"/></svg>';
function initShopCards(){
  const grid = $('#grid'); if (!grid) return;
  $$('.pc', grid).forEach(card => {
    card.classList.add('pc-palmo');
    const media = $('.pc-media', card); if (media && !$('.pc-doodle', media)) media.insertAdjacentHTML('beforeend', DOODLE);
    const h = $('h3', card);
    if (h && !h.dataset.rolled){
      const name = h.textContent.trim(); let i = 0;
      h.setAttribute('aria-label', name); h.dataset.rolled = '1';
      h.innerHTML = name.split(/(\s+)/).map(w => /^\s+$/.test(w) ? ' ' :
        `<span class="pw" aria-hidden="true">${[...w].map(ch => `<span class="pl" style="--i:${i++}">${ch}</span>`).join('')}</span>`).join('');
    }
  });
  // the shop heading spreads to one line with a leaf mark between its two halves (desktop)
  const head = $(CONFIG.split.shop);
  if (head && !$('.sh-mark', head)){
    const l2 = $('.lt', head);
    if (l2) l2.insertAdjacentHTML('beforebegin', '<span class="sh-mark" aria-hidden="true"><svg viewBox="0 0 120 120"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="60" cy="60" r="14"/>' +
      Array.from({ length: 12 }, (_, k) => `<path transform="rotate(${k * 30} 60 60)" d="M60 38c-5-8-5-16 0-24 5 8 5 16 0 24z"/>`).join('') + '</g></svg></span>');
    // group the first line's words so the flex row keeps them together
    const mk = $('.sh-mark', head), l1 = document.createElement('span'); l1.className = 'sh-l1';
    while (head.firstChild && head.firstChild !== mk) l1.appendChild(head.firstChild);
    head.insertBefore(l1, mk);
    head.classList.add('sh-spread');
    if (!reduce && hasGsap && ScrollTrigger){
      const mark = $('.sh-mark svg', head);
      gsap.to(mark, { rotation: 180, ease: 'none', scrollTrigger: { trigger: head, start: 'top bottom', end: 'bottom top', scrub: .6 } });
    }
  }
}

// ---- B1/B2: Palmo-style scallop edges ----
// A row of half-circles in a section's own colour overlaps the bottom of the section above (CSS shape: .tl-scallop
// in motion-extras.css; the section moves up by one radius and its content padding grows by the same, so nothing shifts).
// The shop becomes a dark green band like Palmo's flavours block; the bumps grow from small as each edge comes into view.
function initScallops(){
  const shop = $(CONFIG.scallop.dark);
  if (shop){ shop.classList.add('t-green', 'tl-dark'); shop.dataset.theme = 'green'; }
  const edges = CONFIG.scallop.edges.map(sel => $(sel)).filter(Boolean);
  edges.forEach(el => el.classList.add('tl-scallop'));
  if (reduce || !hasGsap || !ScrollTrigger) return;                      // bumps stay at full size
  // page-coordinate top: LAYOUT.tops for <main> sections (sticky sheets report a stuck offsetTop), offsetTop for the footer
  const top = el => { const i = LAYOUT.pages.indexOf(el); return i >= 0 && LAYOUT.tops[i] !== undefined ? LAYOUT.tops[i] : el.offsetTop; };
  edges.forEach(el => gsap.fromTo(el, { '--sc-k': CONFIG.scallop.from }, { '--sc-k': 1, ease: 'none', scrollTrigger: {
    start: () => top(el) - innerHeight, end: () => top(el) - innerHeight * CONFIG.scallop.settle, scrub: CONFIG.scallop.scrub, invalidateOnRefresh: true } }));
}

// ---- B3: back to top: the footer logo plays the split wipe and jumps to the top behind it ----
function initBackToTop(){
  const brand = $(CONFIG.footer.logo); if (!brand) return;
  const word = $('.logo-word', brand), mark = $('.logo-em', brand);
  const go = () => slitWipe(() => scrollToPage('home', { immediate: true }));
  [mark, word].forEach(t => { if (!t) return; t.classList.add('to-top'); t.addEventListener('click', go); });
  // keyboard: the wordmark (already announced as "TranzLife Biosciences") becomes a link; its label is unchanged
  if (word){
    word.setAttribute('role', 'link'); word.tabIndex = 0;
    word.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
  }
}

// ---- B4: footer: the big wordmark lines rise out of a mask, then the columns follow one by one ----
function initFooterMotion(){
  const big = $(CONFIG.footer.big); if (!big || reduce || !hasGsap || !ScrollTrigger) return;
  // wrap each existing line in a mask (same text, same order)
  const lines = [];
  [...big.childNodes].forEach(node => {
    if (node.nodeType === 3 && !node.textContent.trim()) return;
    const mask = document.createElement('span'), inner = document.createElement('span');
    mask.className = 'fb-l'; inner.className = 'fb-i';
    if (node.nodeType === 3){ node.replaceWith(mask); inner.appendChild(node); mask.appendChild(inner); }
    else { while (node.firstChild) inner.appendChild(node.firstChild); node.appendChild(inner); node.classList.add('fb-l'); }
    lines.push(inner);
  });
  const cols = $$(CONFIG.footer.cols), bot = $(CONFIG.footer.bottom), small = matchMedia(CONFIG.small).matches;
  gsap.set(lines, { yPercent: 105 });
  gsap.set([...cols, bot].filter(Boolean), { opacity: 0, y: 26 });
  ScrollTrigger.create({ trigger: big, start: 'top 88%', once: true, onEnter: () => {
    gsap.to(lines, { yPercent: 0, duration: MOTION.dur.slow, stagger: small ? .08 : .14, ease: MOTION.ease.entrance });
    gsap.to([...cols, bot].filter(Boolean), { opacity: 1, y: 0, duration: MOTION.dur.base, ease: MOTION.ease.entrance,
      stagger: small ? .05 : CONFIG.footer.stagger, delay: .25, clearProps: 'transform' });
  } });
}

// ---- Palmo 1: split headings: the two lines of a big heading slide in from opposite sides as you scroll ----
function initSplitHeads(){
  if (reduce || !hasGsap || !ScrollTrigger) return;
  const shift = () => innerWidth * (matchMedia(CONFIG.small).matches ? CONFIG.split.shiftSmall : CONFIG.split.shift) / 100;
  const pair = (a, b, st) => {
    if (a.length) gsap.fromTo(a, { x: () => -shift() }, { x: 0, ease: 'none', scrollTrigger: { ...st, invalidateOnRefresh: true } });
    if (b.length) gsap.fromTo(b, { x: () => shift() }, { x: 0, ease: 'none', scrollTrigger: { ...st, invalidateOnRefresh: true } });
  };
  // shop: first line's words (masked by rv-words) from the left, the accent line from the right
  const h = $(CONFIG.split.shop);
  if (h){
    const l2 = $('.lt', h), l1 = $('.sh-l1', h), st = { trigger: h, start: 'top bottom', end: 'top 35%', scrub: .5, invalidateOnRefresh: true };
    if (l1 && l2 && matchMedia('(min-width:900px)').matches){
      // spread on one line (Palmo): the halves start beside the leaf mark and open out to the edges
      const inward = () => innerWidth * .06;
      gsap.fromTo(l1, { x: () => inward() }, { x: 0, ease: 'none', scrollTrigger: st });
      gsap.fromTo(l2, { x: () => -inward() }, { x: 0, ease: 'none', scrollTrigger: { ...st } });
      gsap.fromTo($('.sh-mark', h), { scale: .4 }, { scale: 1, ease: 'none', scrollTrigger: { ...st } });
    } else pair($$('.wl', h).filter(w => !l2 || !l2.contains(w)), l2 ? [l2] : [], st);
  }
  // footer wordmark: settles exactly at the bottom of the page
  const big = $(CONFIG.split.footer);
  if (big){ const ls = $$('.fb-l', big); pair(ls.slice(0, 1), ls.slice(1), { trigger: 'footer', start: 'top bottom', end: 'bottom bottom', scrub: .5 }); }
}

// ---- Palmo 2: round badges rise around each product as it turns in the product story ----
function initStoryBadges(){
  const api = state.storyApi, pin = $('#seqPin');
  if (!api || !api.progress || !pin || reduce || !hasGsap || !ScrollTrigger) return;
  const layer = document.createElement('div');
  layer.className = 'seq-badges'; layer.setAttribute('aria-hidden', 'true');   // same words as the shop cards' chips
  const items = [];
  PRODUCTS.forEach((p, i) => (p.ing || []).slice(0, CONFIG.badges.spots.length).forEach((txt, k) => {
    const el = document.createElement('span'), at = badgeSpot(CONFIG.badges.spots[k], i);
    el.className = 'sb'; el.textContent = txt;
    el.style.cssText = `left:${at.x}vw;top:${at.y}%;--c:${(STORY[i] || {}).c || '#8cb86a'}`;
    if (k % 2) el.classList.add('sb-alt');
    layer.appendChild(el); items.push({ el, i, k, tilt: CONFIG.badges.tilt[k] * (i % 2 ? -1 : 1), shown: false });
  }));
  pin.appendChild(layer);
  let active = false;
  ScrollTrigger.create({ trigger: '#seq', start: 'top bottom', end: 'bottom top', onToggle: s => { active = s.isActive; if (!active) hideAll(); } });
  const hideAll = () => items.forEach(b => { if (b.shown){ b.el.style.visibility = 'hidden'; b.shown = false; } });
  gsap.ticker.add(() => {
    if (!active) return;
    if (api.small() || matchMedia(CONFIG.small).matches){ hideAll(); return; }          // no stickers on small screens
    const p = api.progress(), fin = $('#seqFinal');
    if (fin && fin.classList.contains('play')){ hideAll(); return; }
    items.forEach(b => {
      const { start, dur } = api.slot(b.i), st = badgeState((p - start) / dur, b.k);
      const on = st.o > .002;
      if (on !== b.shown){ b.el.style.visibility = on ? 'visible' : 'hidden'; b.shown = on; }
      if (on){ b.el.style.opacity = st.o.toFixed(3); b.el.style.transform = `translate(-50%,-50%) translateY(${st.y.toFixed(2)}vh) rotate(${b.tilt}deg) scale(${st.s.toFixed(3)})`; }
    });
  });
}

// ---- Palmo showcase for the product story: big title with a masked rise, page tint in the product's colour,
// and a bottom-left progress row ("01 / 05", bar, 000-100). product-story.js still moves the jars and toggles
// each card's visibility; here the card is restyled (CSS .seq.palmo) and only its opacity / "on" state is driven.
function initStoryShowcase(){
  const api = state.storyApi, seq = $('#seq'), pin = $('#seqPin'), fin = $('#seqFinal');
  if (!api || !api.progress || !seq || !pin) return;
  seq.classList.add('palmo');
  const cards = $$('.sc', seq);
  // title lines rise out of a mask: wrap each line's text (same words) in an inner span
  cards.forEach(c => $$('h3 > span', c).forEach(l => { if (!$('.sr-in', l)){ const i = document.createElement('span'); i.className = 'sr-in'; while (l.firstChild) i.appendChild(l.firstChild); l.appendChild(i); } }));
  const prog = document.createElement('div');
  prog.className = 'seq-prog'; prog.setAttribute('aria-hidden', 'true');
  prog.innerHTML = '<span class="sp-no">01 / 05</span><i class="pp-track"><b></b></i><span class="sp-n">000</span>';
  pin.appendChild(prog);
  const no = $('.sp-no', prog), fill = $('.pp-track b', prog), n = $('.sp-n', prog);
  let active = !ScrollTrigger, lastNo = '', lastN = '', lastTint = '';
  if (ScrollTrigger) ScrollTrigger.create({ trigger: seq, start: 'top bottom', end: 'bottom top', onToggle: s => { active = s.isActive; } });
  const tick = () => {
    if (!active) return;
    const p = api.progress(), ended = !!(fin && fin.classList.contains('play'));
    let best = 0, bestW = -1;
    cards.forEach((c, i) => {
      const { start, dur } = api.slot(i), t = (p - start) / dur;
      const o = ended ? 0 : smoothstep(0, .14, t) * (1 - smoothstep(.6, .78, t));
      c.style.opacity = o.toFixed(3);
      c.classList.toggle('is-on', !ended && t > .02 && t < .7);
      if (o > bestW){ bestW = o; best = i; }
    });
    prog.classList.toggle('done', ended);
    const lbl = `${(PRODUCTS[best] || {}).no || '01'} / ${String(PRODUCTS.length).padStart(2, '0')}`;
    if (lbl !== lastNo){ lastNo = lbl; no.textContent = lbl; }
    const v = Math.min(1, p / .8);                                   // the five products fill the bar; the finale follows
    fill.style.transform = `scaleX(${v.toFixed(4)})`;
    const nv = pad3(v * 100); if (nv !== lastN){ lastN = nv; n.textContent = nv; }
    const tint = (STORY[best] || {}).c || '';
    if (tint !== lastTint){ lastTint = tint; pin.style.setProperty('--seq-tint', tint); }
  };
  if (hasGsap) gsap.ticker.add(tick); else (function loop(){ requestAnimationFrame(loop); tick(); })();
}

// ---- Palmo 3: process progress: a thin bar and a three-digit counter (000 to 100) in the pinned scene ----
function initProcessBar(){
  const pin = $('#pin'); if (!pin || !hasGsap) return;
  const bar = document.createElement('div');
  bar.className = 'pp-bar'; bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<i class="pp-track"><b></b></i><span class="pp-n">000</span>';
  pin.appendChild(bar);
  const fill = $('b', bar), n = $('.pp-n', bar);
  let last = '';
  gsap.ticker.add(() => {
    const pr = pageProgress('process'); if (!pr.visible) return;
    fill.style.transform = `scaleX(${pr.p.toFixed(4)})`;
    const v = pad3(pr.p * 100); if (v !== last){ last = v; n.textContent = v; }
    bar.classList.toggle('on-green', !!(LAYOUT.reactor && LAYOUT.reactor.theme && LAYOUT.reactor.theme() === 'green'));
  });
}

// ---- Palmo 4: insider photo cards fly in from scattered spots, then keep their tilted scroll drift ----
function initInsiderFlyIn(){
  const cards = $$(CONFIG.insider.cards);
  if (!cards.length || reduce || !hasGsap || !ScrollTrigger) return;
  const k = matchMedia(CONFIG.small).matches ? .45 : 1;
  // x / scale / opacity only: y and rotation belong to the scroll drift in scroll-animations.js
  gsap.from(cards, { x: i => CONFIG.insider.from[i % 3] * k, scale: CONFIG.insider.scale, opacity: 0, duration: 1.1,
    stagger: .12, ease: 'back.out(1.3)', scrollTrigger: { trigger: cards[0].parentElement, start: 'top 82%', once: true } });
}

function initProductMotion(){
  initMenuMotion();
  initBenefits();
  initPills();
  initShopCards();
  initScallops();
  initBackToTop();
  initFooterMotion();
  initSplitHeads();
  initStoryShowcase();
  initStoryBadges();
  initProcessBar();
  initInsiderFlyIn();
  return { slitWipe, CONFIG };
}

export { initProductMotion, slitWipe, CONFIG };
