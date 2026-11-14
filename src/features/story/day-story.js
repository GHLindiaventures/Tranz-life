// "A Day with TranzLife" (section #day): one moment per product, from morning to night.
// Pinned on wide screens: the sky warms and darkens with the hour, the sun travels the golden arc, the product of each
// moment spins in on its own 3D layer and its real botanicals drift in and dissolve into it. Hovering or focusing a
// botanical opens the science lens (its key compound and formula). Phones and reduced motion get stacked cards instead.
import { PRODUCTS, EXTRA_PRODUCTS } from '../../data/products.js';
import { MOMENTS, BOTANICALS } from '../../data/day.js';
import { SHOTS } from '../products/product-images.js';
import { jarLayer } from '../products/jar-layer.js';
import { state } from '../../app/state.js';
import { storeCta } from '../../app/store.js';
import { $, $$ } from '../../utils/dom.js';
import { clamp, lerp, seeded } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

const ALL = [...PRODUCTS, ...EXTRA_PRODUCTS];
const byId = Object.fromEntries(ALL.map(p => [p.id, p]));
const sm = x => x * x * (3 - 2 * x);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shortName = p => p.name.replace(/^TranzLife\s+/, '');
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };

// where the botanical chips sit around the product (fractions of the stage)
const RING = [[.16, .24], [.84, .3], [.12, .7], [.86, .74]];

// the product's page, plus "Buy online" once the online store is live (src/app/store.js)
function buyRow(p, cls = ''){
  return `<div class="dc-buy ${cls}"><a class="btn-amber" href="product-details.html?id=${p.id}">Explore ${esc(shortName(p))} <i aria-hidden="true">→</i></a>${storeCta(p.id, { quiet: true, cls: 'dc-more' })}</div>`;
}

function copyHTML(m){
  const p = byId[m.productId];
  return `
    <p class="dc-time">${esc(m.name)}</p>
    <h2 class="dc-title"><span>${esc(m.title[0])}</span> <span>${esc(m.title[1])}</span></h2>
    <p class="dc-text">${esc(m.copy)}</p>
    <div class="dc-product">
      <p class="dc-name"><b>${esc(shortName(p))}</b><span>${esc(m.benefit)}</span></p>
      ${buyRow(p)}
    </div>`;
}

function lensHTML(b){
  return `<b>${esc(b.name)}</b><i>${esc(b.latin)}</i><span class="dl-cmp"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><circle cx="12" cy="12" r="2.4"/></svg>${esc(b.cmp)}</span><code>${esc(b.formula)}</code>`;
}

function cardsHTML(){
  return MOMENTS.map(m => {
    const p = byId[m.productId], img = SHOTS[p.id];
    return `<li class="day-card${m.night ? ' is-night' : ''}" style="--sky-a:${m.sky[0]};--sky-b:${m.sky[1]};--ink:${m.ink}">
      <div class="dk-copy">
        <p class="dc-time">${esc(m.name)}</p>
        <h3 class="dc-title"><span>${esc(m.title[0])}</span> <span>${esc(m.title[1])}</span></h3>
        <p class="dc-text">${esc(m.copy)}</p>
        <ul class="dk-bots">${m.botanicals.map(id => { const b = BOTANICALS[id]; return `<li style="--c:${b.color}" title="${esc(b.cmp)} · ${esc(b.formula)}">${esc(b.name)}</li>`; }).join('')}</ul>
        <p class="dc-name"><b>${esc(shortName(p))}</b><span>${esc(m.benefit)}</span></p>
        ${buyRow(p)}
      </div>
      ${img ? `<img class="dk-img" src="${img}" alt="${esc(p.name)}" loading="lazy" width="480" height="480">` : ''}
    </li>`;
  }).join('');
}

function initDay(){
  const sec = $('#day'), pin = $('#dayPin');
  if (!sec || !pin) return null;
  const cards = $('#dayCards');
  if (cards) cards.innerHTML = cardsHTML();

  const wide = matchMedia('(min-width: 900px)');
  if (reduce || !wide.matches){
    sec.classList.add('is-static');
    if (cards && !sec.querySelector('.day-kicker--static')) cards.insertAdjacentHTML('beforebegin', '<p class="day-kicker day-kicker--static">A day with TranzLife</p>');
    // switching to a wide window later: build the pinned story then
    if (!reduce) wide.addEventListener('change', e => { if (e.matches && sec.classList.contains('is-static')) { sec.classList.remove('is-static'); buildPinned(sec); } }, { once: true });
    return null;
  }
  return buildPinned(sec);
}

function buildPinned(sec){
  const N = MOMENTS.length;
  sec.style.setProperty('--moments', N);
  sec.classList.add('is-pinned');
  const pin = $('#dayPin'), sky = $('#daySky'), copy = $('#dayCopy'), stage = $('#dayStage');
  const chipsEl = $('#dayChips'), lens = $('#dayLens'), dots = $('#dayDots');
  const arcFill = $('#dayArcFill'), sun = $('#daySun'), arcSvg = $('.day-arc', sec);
  const flow = $('#dayFlow'), fctx = flow.getContext('2d');

  // ---------- dots: one per moment, click to jump there
  dots.innerHTML = MOMENTS.map((m, i) => `<li><button type="button" data-i="${i}"><span>${esc(m.name)}</span><i aria-hidden="true"></i></button></li>`).join('');
  const dotBtns = $$('button', dots);
  const momentY = i => sec.offsetTop + (i + .5) / N * (sec.offsetHeight - window.innerHeight);
  dots.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const y = momentY(+b.dataset.i);
    if (state.lenis) state.lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
  });

  // ---------- 3D product layer: every product, the current one spins in
  let L = null, jars = [];
  try {
    L = jarLayer($('#dayProduct'));
    jars = ALL.map((p, i) => L.jar(p, i));
    jars.forEach(j => { j.G.visible = false; });
    L.warm();
  } catch (e) { console.warn('day story 3D unavailable', e); sec.classList.add('no-3d'); }
  const idxOf = id => ALL.findIndex(p => p.id === id);
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); mouse.tx = (e.clientX - r.left) / r.width - .5; mouse.ty = (e.clientY - r.top) / r.height - .5; });
  stage.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = 0; });

  // ---------- botanical chips + the science lens
  let chipPos = [];
  function setChips(m){
    chipsEl.innerHTML = m.botanicals.map((id, k) => {
      const b = BOTANICALS[id], [x, y] = RING[k % RING.length];
      return `<button class="day-chip" type="button" data-b="${id}" style="--x:${x};--y:${y};--c:${b.color};--d:${k * 90}ms" aria-describedby="dayLens"><i aria-hidden="true"></i>${esc(b.name)}</button>`;
    }).join('');
    chipPos = m.botanicals.map((id, k) => ({ id, x: RING[k % RING.length][0], y: RING[k % RING.length][1], b: BOTANICALS[id] }));
    lens.classList.remove('on');
  }
  const showLens = btn => {
    const b = BOTANICALS[btn.dataset.b]; if (!b) return;
    lens.innerHTML = lensHTML(b);
    const sr = stage.getBoundingClientRect(), r = btn.getBoundingClientRect();
    const left = clamp(r.left - sr.left + r.width / 2, 120, sr.width - 120), above = r.top - sr.top > sr.height * .5;
    lens.style.left = left + 'px';
    lens.style.top = (above ? r.top - sr.top - 12 : r.bottom - sr.top + 12) + 'px';
    lens.classList.toggle('is-above', above);
    lens.classList.add('on');
    burst(btn.dataset.b, 14);
  };
  const hideLens = () => lens.classList.remove('on');
  chipsEl.addEventListener('pointerover', e => { const b = e.target.closest('.day-chip'); if (b) showLens(b); });
  chipsEl.addEventListener('pointerout', e => { if (e.target.closest('.day-chip') && !e.relatedTarget?.closest?.('.day-chip')) hideLens(); });
  chipsEl.addEventListener('focusin', e => { const b = e.target.closest('.day-chip'); if (b) showLens(b); });
  chipsEl.addEventListener('focusout', hideLens);
  chipsEl.addEventListener('click', e => { const b = e.target.closest('.day-chip'); if (b) showLens(b); });

  // ---------- botanical flow: particles drift from the chips into the bottle and dissolve
  let FW = 1, FH = 1, dpr = 1;
  const parts = [], R = seeded(3);
  function sizeFlow(){
    const r = flow.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    FW = Math.max(1, r.width); FH = Math.max(1, r.height);
    flow.width = Math.round(FW * dpr); flow.height = Math.round(FH * dpr); fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (L) L.resize();
  }
  function spawn(c){
    if (!c) return;
    const sx = c.x * FW + (R() - .5) * 40, sy = c.y * FH + (R() - .5) * 30;
    parts.push({ sx, sy, cx: lerp(sx, FW / 2, .5) + (R() - .5) * FW * .25, cy: Math.min(sy, FH * .5) - FH * (.1 + R() * .2),
      t: 0, sp: .25 + R() * .3, rot: R() * 6.28, vr: (R() - .5) * 4, s: 5 + R() * 6, b: c.b });
  }
  function burst(id, n){ const c = chipPos.find(q => q.id === id); for (let k = 0; k < n; k++) spawn(c || chipPos[k % chipPos.length]); }
  let glow = 0;
  function drawFlow(dt){
    fctx.clearRect(0, 0, FW, FH);
    const tx = FW / 2, ty = FH * .52;
    for (let i = parts.length - 1; i >= 0; i--){
      const q = parts[i]; q.t += dt * q.sp; q.rot += q.vr * dt;
      if (q.t >= 1){ parts.splice(i, 1); glow = Math.min(1, glow + .08); continue; }
      const t = sm(q.t), u = 1 - t;
      const x = u * u * q.sx + 2 * u * t * q.cx + t * t * tx, y = u * u * q.sy + 2 * u * t * q.cy + t * t * ty;
      const a = Math.min(1, q.t * 5) * (1 - Math.pow(q.t, 3)), s = q.s * (1 - .7 * t);
      fctx.save(); fctx.translate(x, y); fctx.rotate(q.rot); fctx.globalAlpha = a;
      fctx.fillStyle = q.b.color; fctx.strokeStyle = 'rgba(255,255,255,.55)'; fctx.lineWidth = .8;
      if (q.b.shape === 'leaf'){ fctx.beginPath(); fctx.ellipse(0, 0, s, s * .45, 0, 0, Math.PI * 2); fctx.fill(); fctx.beginPath(); fctx.moveTo(-s, 0); fctx.lineTo(s, 0); fctx.stroke(); }
      else if (q.b.shape === 'petal'){ fctx.beginPath(); fctx.ellipse(0, 0, s * .8, s * .38, 0, 0, Math.PI * 2); fctx.fill(); }
      else if (q.b.shape === 'root'){ fctx.strokeStyle = q.b.color; fctx.lineWidth = s * .35; fctx.lineCap = 'round'; fctx.beginPath(); fctx.moveTo(-s, 0); fctx.quadraticCurveTo(0, -s * .6, s, 0); fctx.stroke(); }
      else { fctx.beginPath(); fctx.arc(0, 0, s * .45, 0, Math.PI * 2); fctx.fill(); }
      // near the bottle: a bright core as it dissolves
      if (t > .7){ fctx.globalAlpha = a * (t - .7) / .3; fctx.fillStyle = '#fff6d8'; fctx.beginPath(); fctx.arc(0, 0, s * .3, 0, Math.PI * 2); fctx.fill(); }
      fctx.restore();
    }
    glow *= Math.pow(.2, dt);
    if (glow > .01){
      const g = fctx.createRadialGradient(tx, ty, 0, tx, ty, FH * .32);
      g.addColorStop(0, `rgba(255,236,180,${(.35 * glow).toFixed(3)})`); g.addColorStop(1, 'rgba(255,236,180,0)');
      fctx.fillStyle = g; fctx.fillRect(0, 0, FW, FH);
    }
  }

  // ---------- moments
  let cur = -1, swapT = 0;
  function setMoment(i){
    if (i === cur) return;
    const first = cur < 0; cur = i;
    const m = MOMENTS[i];
    dotBtns.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i ? 'step' : 'false'); });
    pin.classList.toggle('is-night', !!m.night);
    pin.classList.toggle('is-cycle', !!m.cycle);
    pin.style.setProperty('--ink', m.ink);
    clearTimeout(swapT);
    if (first){ copy.innerHTML = copyHTML(m); copy.classList.add('in'); }
    else {
      copy.classList.remove('in'); copy.classList.add('out');
      swapT = setTimeout(() => { copy.innerHTML = copyHTML(m); copy.classList.remove('out'); void copy.offsetWidth; copy.classList.add('in'); }, 260);
    }
    setChips(m);
    setTimeout(() => burst(null, 26), first ? 0 : 200);
    target = idxOf(m.productId);
  }

  // ---------- frame loop (only while the section is on screen)
  let target = 0, prog = -1, last = performance.now(), visible = false, raf = 0, trickle = 0, tNow = 0;
  const progress = () => { const r = sec.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1); };
  const pathLen = arcFill.getTotalLength ? arcFill.getTotalLength() : 1;

  function frame(now){
    if (!visible){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now; tNow += dt;
    const p = progress(), f = p * N, i = Math.min(N - 1, Math.floor(f));
    setMoment(i);

    // sky + sun follow the continuous position between moments
    // centred on the moments: at the middle of moment i the sky and sun are exactly moment i's
    const pos = clamp(f - .5, 0, N - 1), a = Math.floor(pos), b = Math.min(N - 1, a + 1), t = sm(pos - a);
    const A = MOMENTS[a], B = MOMENTS[b];
    sky.style.background = `linear-gradient(180deg, ${mix(A.sky[0], B.sky[0], t)} 0%, ${mix(A.sky[1], B.sky[1], t)} 100%)`;
    const s = lerp(A.sun, B.sun, t);
    arcFill.style.strokeDasharray = `${(s * pathLen).toFixed(1)} ${pathLen.toFixed(1)}`;
    if (arcSvg && sun){
      const pt = arcFill.getPointAtLength(s * pathLen), w = arcSvg.clientWidth, h = arcSvg.clientHeight;
      sun.style.transform = `translate(${(pt.x / 1000 * w).toFixed(1)}px, ${(pt.y / 60 * h).toFixed(1)}px) translate(-50%, -50%)`;
    }

    // 3D product swap
    if (L){
      if (prog < 0) prog = target;
      prog += (target - prog) * (1 - Math.exp(-dt * 4));
      mouse.x += (mouse.tx - mouse.x) * .06; mouse.y += (mouse.ty - mouse.y) * .06;
      const baseH = L.H * .6;
      jars.forEach((jar, k) => {
        const d = prog - k, w = sm(clamp(1 - Math.abs(d) * 1.4, 0, 1)); jar.G.visible = w > .002;
        if (!jar.G.visible) return;
        const hh = baseH * jar.fit * (.55 + .45 * w);
        L.size(jar, Math.max(1, hh * w));
        L.place(jar.G, L.W / 2 + d * -L.W * .18, L.H * .52 + Math.sin(tNow * 1.1) * 6);
        jar.G.rotation.set(.05 + mouse.y * .25, -.35 + Math.sin(tNow * .45) * .22 + mouse.x * .9 - d * 3.4, -.02 + Math.sin(tNow * .6) * .015);
      });
      L.renderer.render(L.scene, L.cam);
    }

    // a gentle stream of botanicals, plus the bursts on each new moment
    trickle += dt * 6;
    while (trickle >= 1){ trickle -= 1; spawn(chipPos[Math.floor(R() * chipPos.length)]); }
    drawFlow(dt);
  }

  sizeFlow();
  window.addEventListener('resize', sizeFlow);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf){ last = performance.now(); raf = requestAnimationFrame(frame); }
  }, { rootMargin: '100px 0px' }).observe(sec);
  setMoment(0);
  return { resize: sizeFlow };
}

export { initDay };
