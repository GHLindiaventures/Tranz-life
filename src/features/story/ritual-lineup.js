// "Your ritual" (section #ritual): all six products as 3D models standing in their cards at night.
// They rise into place as the section scrolls in, turn towards the pointer on hover, and the "What does your day
// need?" chips bring the matching products forward. One fixed, transparent WebGL layer (#flightCanvas) draws them,
// only while the section is on screen. Without WebGL each card shows the product photo instead.
import { PRODUCTS, EXTRA_PRODUCTS } from '../../data/products.js';
import { MOMENTS, NEEDS } from '../../data/day.js';
import { SHOTS } from '../products/product-images.js';
import { jarLayer } from '../products/jar-layer.js';
import { storeCta } from '../../app/store.js';
import { $, $$ } from '../../utils/dom.js';
import { clamp } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

const ALL = [...PRODUCTS, ...EXTRA_PRODUCTS];
const BENEFIT = Object.fromEntries(MOMENTS.map(m => [m.productId, m.benefit]));
const TINT = { gummies: '#e49a52', liver: '#a4b955', energy: '#b06ab0', inhaler: '#38a58b', rollon: '#d6969f', reviva: '#4d8b47' };
const sm = x => x * x * (3 - 2 * x);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shortName = p => p.name.replace(/^TranzLife\s+/, '');

function cardHTML(p){
  // the product's page, plus "Buy online" once the online store is live (src/app/store.js)
  const buy = `<a class="rc-add" href="product-details.html?id=${p.id}">View product <i aria-hidden="true">→</i></a>${storeCta(p.id, { quiet: true, cls: 'rc-store' })}`;
  return `<li class="rc" data-id="${p.id}" style="--c:${TINT[p.id] || '#8cb86a'}">
    <a class="rc-slot" href="product-details.html?id=${p.id}" aria-label="${esc(shortName(p))}: product details">
      ${SHOTS[p.id] ? `<img class="rc-img" src="${SHOTS[p.id]}" alt="" loading="lazy" width="320" height="320">` : ''}
      <span class="rc-shadow" aria-hidden="true"></span>
    </a>
    <div class="rc-body">
      <p class="rc-k">${esc(p.tag)}</p>
      <h3 class="rc-name"><a href="product-details.html?id=${p.id}">${esc(shortName(p))}</a></h3>
      <p class="rc-b">${esc(BENEFIT[p.id] || '')}</p>
      <div class="rc-buy">${buy}</div>
    </div>
  </li>`;
}

function initRitual(){
  const sec = $('#ritual'), grid = $('#ritualGrid'), needsEl = $('#ritualNeeds'), canvas = $('#flightCanvas');
  if (!sec || !grid) return null;
  grid.innerHTML = ALL.map(cardHTML).join('');
  if (needsEl) needsEl.insertAdjacentHTML('beforeend', NEEDS.map((n, i) => `<button type="button" class="rn-chip${i ? '' : ' on'}" data-need="${n.id}" aria-pressed="${i ? 'false' : 'true'}">${esc(n.label)}</button>`).join(''));
  const cards = $$('.rc', grid), slots = $$('.rc-slot', grid);

  // ---------- filter by need
  let match = null;
  needsEl && needsEl.addEventListener('click', e => {
    const b = e.target.closest('.rn-chip'); if (!b) return;
    $$('.rn-chip', needsEl).forEach(c => { const on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    const need = NEEDS.find(n => n.id === b.dataset.need);
    match = need && need.products ? new Set(need.products) : null;
    cards.forEach(c => c.classList.toggle('is-dim', !!match && !match.has(c.dataset.id)));
  });

  // ---------- 3D layer
  if (!canvas) { sec.classList.add('no-3d'); return null; }
  let L, jars;
  try {
    L = jarLayer(canvas);
    jars = ALL.map((p, i) => L.jar(p, i));
    jars.forEach(j => { j.G.visible = false; });
    L.warm();
  } catch (e) { console.warn('ritual 3D unavailable', e); sec.classList.add('no-3d'); return null; }
  sec.classList.add('has-3d');

  let metrics = [];
  const measure = () => {
    L.resize();
    const y = window.scrollY;
    metrics = slots.map((s, i) => { const r = s.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + y + r.height * .53, h: r.height * .8 * (jars[i].fit || 1) }; });
  };
  measure();
  window.addEventListener('resize', measure);
  if ('ResizeObserver' in window) new ResizeObserver(() => measure()).observe(grid);
  window.addEventListener('load', measure);

  let hover = -1;
  cards.forEach((c, i) => { c.addEventListener('pointerenter', () => { hover = i; }); c.addEventListener('pointerleave', () => { if (hover === i) hover = -1; }); });
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; }, { passive: true });

  const emph = ALL.map(() => 1);
  let visible = false, raf = 0, last = performance.now(), tNow = 0;
  function frame(now){
    if (!visible){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now; tNow += dt;
    mouse.x += (mouse.tx - mouse.x) * .08; mouse.y += (mouse.ty - mouse.y) * .08;
    const sy = window.scrollY, vh = window.innerHeight;
    const r = sec.getBoundingClientRect(), enter = reduce ? 1 : clamp((vh - r.top) / (vh * .75), 0, 1);
    jars.forEach((jar, i) => {
      const m = metrics[i]; if (!m) return;
      const e = reduce ? 1 : sm(clamp((enter - i * .07) / .55, 0, 1));
      const want = match ? (match.has(ALL[i].id) ? 1.1 : .78) : 1;
      emph[i] += (want - emph[i]) * (1 - Math.exp(-dt * 6));
      jar.G.visible = e > .002;
      if (!jar.G.visible) return;
      L.size(jar, Math.max(1, m.h * (.7 + .3 * e) * emph[i] * (hover === i ? 1.06 : 1)));
      L.place(jar.G, m.x, m.y - sy + (1 - e) * 90);
      const ry = -.38 + (hover === i ? mouse.x * 1.1 : Math.sin(tNow * .8 + i * 1.3) * .12);
      jar.G.rotation.y += (ry - jar.G.rotation.y) * .1;
      jar.G.rotation.x += ((hover === i ? mouse.y * .25 : 0) - jar.G.rotation.x) * .1;
    });
    L.renderer.render(L.scene, L.cam);
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    canvas.classList.toggle('active', visible);
    if (visible){ measure(); if (!raf){ last = performance.now(); raf = requestAnimationFrame(frame); } }
    else jars.forEach(j => { j.G.visible = false; });
  }, { rootMargin: '0px' }).observe(sec);
  return { measure };
}

export { initRitual };
