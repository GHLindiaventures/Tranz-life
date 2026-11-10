// Product-site motion for the sections below the hero (phase A): split-wipe menu, benefits column
// highlight, highlighter pills on accent words, shop quick-add. The hero (#home) and #lineup are not touched.
// Styles: src/styles/components/motion-extras.css
import { ScrollTrigger, gsap, hasGsap } from '../lib/gsap.js';
import { MOTION } from './motion-tokens.js';
import { state } from './state.js';
import { $, $$ } from '../utils/dom.js';
import { reduce } from '../utils/media.js';

const CONFIG = {
  wipe: { half: MOTION.dur.wipe, ease: MOTION.ease.wipe, slitDelay: 0.55 },  // two halves = 0.8s
  menu: { stagger: MOTION.stagger.menu, staggerSmall: 0.04 },
  benefits: { table: '#benefits table.tbl', rowStagger: 0.05, settle: 0.6 },
  pills: { insider: '#insider .in-h .lt', story: '#seqTitle .l2', storyFinal: '#seqFinal', duration: 0.7, delay: 0.45 },
  shop: { quickMedia: '(hover:hover) and (pointer:fine) and (min-width:768px)' },
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

function initProductMotion(){
  initMenuMotion();
  initBenefits();
  initPills();
  initShopCards();
  return { slitWipe, CONFIG };
}

export { initProductMotion, slitWipe, CONFIG };
