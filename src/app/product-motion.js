// Product-site motion for the sections below the hero. Phase A: split-wipe menu, benefits column highlight,
// highlighter pills, shop quick-add. Phase B: leaf curtains, back-to-top wipe, footer reveal.
// The hero (#home) and #lineup are not touched.
// Styles: src/styles/components/motion-extras.css
import { ScrollTrigger, gsap, hasGsap } from '../lib/gsap.js';
import { MOTION } from './motion-tokens.js';
import { state } from './state.js';
import { $, $$ } from '../utils/dom.js';
import { reduce } from '../utils/media.js';
import { LAYOUT, scrollToPage } from './page-sections.js';
import { leafEdgePath, leafVeinPath, curtainCovers, VB_W, VB_H } from './curtain-geometry.js';

const CONFIG = {
  wipe: { half: MOTION.dur.wipe, ease: MOTION.ease.wipe, slitDelay: 0.55 },  // two halves = 0.8s
  menu: { stagger: MOTION.stagger.menu, staggerSmall: 0.04 },
  benefits: { table: '#benefits table.tbl', rowStagger: 0.05, settle: 0.6 },
  pills: { insider: '#insider .in-h .lt', story: '#seqTitle .l2', storyFinal: '#seqFinal', duration: 0.7, delay: 0.45 },
  shop: { quickMedia: '(hover:hover) and (pointer:fine) and (min-width:768px)' },
  // B1/B2: a green curtain with leaf edges passes over the screen as these sections arrive;
  // it fully covers at the halfway point and is gone exactly when the section top reaches the top
  curtain: { ids: ['process', 'contact'], range: 1, leaves: 12, leavesSmall: 6, edge: 0.11, edgeSmall: 0.07, scrub: 0.5, drift: 3 },
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

// ---- A4: shop cards: hover tint (CSS) and a quick-add panel built from the card's own price row ----
function initShopCards(){
  const grid = $('#grid'); if (!grid) return;
  const mq = matchMedia(CONFIG.shop.quickMedia);
  const place = () => {
    $$('.pc', grid).forEach(card => {
      const foot = $('.pc-foot', card), media = $('.pc-media', card), body = $('.pc-body', card);
      if (!foot || !media || !body) return;
      if (mq.matches && foot.parentElement !== media){ media.appendChild(foot); foot.classList.add('pc-quick'); card.classList.add('has-quick'); }
      else if (!mq.matches && foot.parentElement === media){ body.appendChild(foot); foot.classList.remove('pc-quick'); card.classList.remove('has-quick'); }
    });
  };
  place();
  if (mq.addEventListener) mq.addEventListener('change', place);
}

// ---- B1/B2: leaf-scallop curtains on #process and #contact ----
// One fixed layer per section, scrubbed by scroll: rises from below, covers the whole screen when the section top
// is halfway up, and has left the top of the screen when the section top reaches it (so anchor jumps land clean).
// It sits under the nav and dock, which take the green tone while the curtain is behind them.
function buildCurtain(small){
  const n = small ? CONFIG.curtain.leavesSmall : CONFIG.curtain.leaves;
  const edge = `<svg viewBox="0 0 ${VB_W} ${VB_H}" preserveAspectRatio="none" aria-hidden="true"><path class="tc-fill" d="${leafEdgePath(n)}"/><path class="tc-vein" d="${leafVeinPath(n)}"/></svg>`;
  const el = document.createElement('div');
  el.className = 'tl-curtain'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="tc-edge tc-top">${edge}</div><div class="tc-body"></div><div class="tc-edge tc-bot">${edge}</div>`;
  document.body.appendChild(el);
  return el;
}
function initCurtains(){
  if (reduce || !hasGsap || !ScrollTrigger) return;
  const small = matchMedia(CONFIG.small).matches;
  const edgeH = () => Math.round(innerHeight * (small ? CONFIG.curtain.edgeSmall : CONFIG.curtain.edge));
  const live = [];
  CONFIG.curtain.ids.forEach(id => {
    const sec = document.getElementById(id); if (!sec) return;
    const el = buildCurtain(small), edges = $$('.tc-edge', el);
    sec.classList.add('has-curtain');
    // body height from innerHeight, not CSS 100vh (taller than the visible area on phones with a collapsing address bar)
    const size = () => { const e = edgeH(); el.style.setProperty('--tc-edge', e + 'px'); el.style.setProperty('--tc-vh', innerHeight + 'px'); return e; };
    size();
    // section top in page coordinates: LAYOUT.tops (not the trigger's own box, which reports a stuck position on sticky sheets)
    const top = () => { const i = LAYOUT.pages.indexOf(sec); return i >= 0 && LAYOUT.tops[i] !== undefined ? LAYOUT.tops[i] : sec.offsetTop; };
    const c = { el, edge: size, active: false };
    live.push(c);
    gsap.set(el, { y: innerHeight });
    gsap.timeline({
      scrollTrigger: {
        start: () => top() - innerHeight * CONFIG.curtain.range, end: () => top(),
        scrub: CONFIG.curtain.scrub, invalidateOnRefresh: true,
        onRefresh: size,
        onToggle: self => { c.active = self.isActive; gsap.set(el, { visibility: self.isActive ? 'visible' : 'hidden' }); if (state.navTone) state.navTone(); }
      },
      onUpdate: () => { if (state.navTone) state.navTone(); }
    })
      .fromTo(el, { y: () => innerHeight }, { y: () => -(innerHeight + 2 * edgeH()), ease: 'none' }, 0)
      .fromTo(edges, { xPercent: 0 }, { xPercent: -CONFIG.curtain.drift, ease: 'none' }, 0);
  });
  if (!live.length) return;
  // nav/dock tone: true while a curtain's solid part is behind the element's centre
  state.curtainOver = target => {
    const r = target.getBoundingClientRect(), cy = r.top + r.height / 2;
    return live.some(c => c.active && curtainCovers(gsap.getProperty(c.el, 'y'), edgeH(), innerHeight, cy));
  };
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

function initProductMotion(){
  initMenuMotion();
  initBenefits();
  initPills();
  initShopCards();
  initCurtains();
  initBackToTop();
  initFooterMotion();
  return { slitWipe, CONFIG };
}

export { initProductMotion, slitWipe, CONFIG };
