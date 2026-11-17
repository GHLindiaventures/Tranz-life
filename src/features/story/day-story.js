// "A Day with TranzLife" (section #day): one moment per product, from morning to night.
// Pinned on wide screens: the sky warms and darkens with the hour, the sun travels the golden arc, and each moment's
// product sits centre stage with its real ingredients (transparent photo cut-outs) orbiting it in 3D.
//
// Scroll choreography, per moment (all driven by scroll position, so it reverses exactly and can't skip):
//   hold      the product is centred and still, its ingredients orbit while you read
//   pull-in   near the end of the moment the ingredients spiral back into the product
//   swap      at the boundary the product slides out left and the next one slides in from the right (never both)
//   push-out  the next product's ingredients spiral out of its centre onto their orbits
// On first reaching the section the ingredients emerge from the product the same way (time based).
// Hovering or focusing an ingredient pauses it, lifts it forward and opens the science lens (compound + formula).
// Phones and reduced motion get stacked cards instead.
import { PRODUCTS, EXTRA_PRODUCTS } from '../../data/products.js';
import { MOMENTS, BOTANICALS } from '../../data/day.js';
import { SHOTS } from '../products/product-images.js';
import { jarLayer } from '../products/jar-layer.js';
import { state } from '../../app/state.js';
import { storeCta } from '../../app/store.js';
import { $, $$ } from '../../utils/dom.js';
import { clamp, lerp, seeded, ease } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

const ALL = [...PRODUCTS, ...EXTRA_PRODUCTS];
const byId = Object.fromEntries(ALL.map(p => [p.id, p]));
const sm = x => x * x * (3 - 2 * x);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shortName = p => p.name.replace(/^TranzLife\s+/, '');
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`; };
// botanical id -> its cut-out (public/assets/ingredients/cutout/, made by scripts/make-ingredient-cutouts.py): longPepper -> long-pepper
const cutout = id => `assets/ingredients/cutout/${id.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}.webp`;

// share of each moment's scroll spent on the pull-in (end) and push-out (start); the rest is the hold
const EDGE = .2;
// how long the first emergence takes when the section is reached (s)
const INTRO = 1.5;
// auto-play: seconds on each moment (after the last scroll or move) before moving on; the sun counts it down
const AUTO = 6;

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
    const ings = m.botanicals.map((id, k) => `<img class="dk-ing" src="${cutout(id)}" alt="" loading="lazy" decoding="async" style="--k:${k}">`).join('');
    return `<li class="day-card${m.night ? ' is-night' : ''}" style="--sky-a:${m.sky[0]};--sky-b:${m.sky[1]};--ink:${m.ink}">
      <div class="dk-copy">
        <p class="dc-time">${esc(m.name)}</p>
        <h3 class="dc-title"><span>${esc(m.title[0])}</span> <span>${esc(m.title[1])}</span></h3>
        <p class="dc-text">${esc(m.copy)}</p>
        <ul class="dk-bots">${m.botanicals.map(id => { const b = BOTANICALS[id]; return `<li style="--c:${b.color}" title="${esc(b.cmp)} · ${esc(b.formula)}">${esc(b.name)}</li>`; }).join('')}</ul>
        <p class="dc-name"><b>${esc(shortName(p))}</b><span>${esc(m.benefit)}</span></p>
        ${buyRow(p)}
      </div>
      ${img ? `<div class="dk-vis" aria-hidden="true">${ings}<img class="dk-img" src="${img}" alt="${esc(p.name)}" loading="lazy" width="480" height="480"></div>` : ''}
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

// Where we are in the story for a scroll position f (0..N, in moments):
//   i      the moment on screen
//   s      how far its ingredients are spread out (0 = inside the product, 1 = on their orbits)
//   pos    the product carousel position in moment units: i during the hold, i +- .5 exactly at a boundary
// In order: the product slides in, then its ingredients spread out ... then they go back in, then it slides out.
function phase(f, N){
  const i = clamp(Math.floor(f), 0, N - 1), u = f - i;
  let s = 1, pos = i;
  // v: 0 at the boundary, 1 at the start of the hold
  const v = i > 0 && u < EDGE ? u / EDGE : i < N - 1 && u > 1 - EDGE ? (1 - u) / EDGE : 1;
  if (v < 1){
    s = sm(clamp((v - .4) / .6, 0, 1));                       // ingredients: the 60% of the edge nearest the hold
    const slide = .5 * (1 - sm(clamp(v / .5, 0, 1)));          // product: the 50% nearest the boundary
    pos = u < .5 ? i - slide : i + slide;
  }
  return { i, s, pos };
}

function buildPinned(sec){
  const N = MOMENTS.length;
  sec.style.setProperty('--moments', N);
  sec.classList.add('is-pinned');
  const pin = $('#dayPin'), sky = $('#daySky'), copy = $('#dayCopy'), stage = $('#dayStage');
  const orbitEl = $('#dayOrbit'), lens = $('#dayLens'), dots = $('#dayDots');
  const arcFill = $('#dayArcFill'), sun = $('#daySun'), arcSvg = $('.day-arc', sec);
  const flow = $('#dayFlow'), fctx = flow.getContext('2d');

  // ---------- dots: one per moment, click to jump to the middle of its hold
  dots.innerHTML = MOMENTS.map((m, i) => `<li><button type="button" data-i="${i}"><span>${esc(m.name)}</span><i aria-hidden="true"></i></button></li>`).join('');
  const dotBtns = $$('button', dots);
  const momentY = i => sec.offsetTop + (i + .5) / N * (sec.offsetHeight - window.innerHeight);
  dots.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const y = momentY(+b.dataset.i);
    if (state.lenis) state.lenis.scrollTo(y, { duration: 1.1 }); else window.scrollTo({ top: y, behavior: 'smooth' });
  });

  // ---------- 3D product layer: one product per moment, in moment order
  let L = null, jars = [];
  try {
    L = jarLayer($('#dayProduct'));
    jars = MOMENTS.map(m => { const p = byId[m.productId]; return L.jar(p, ALL.indexOf(p)); });
    jars.forEach(j => { j.G.visible = false; });
    L.warm();
  } catch (e) { console.warn('day story 3D unavailable', e); sec.classList.add('no-3d'); }
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, px: -1e4, py: -1e4 };
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    mouse.px = e.clientX - r.left; mouse.py = e.clientY - r.top;
    mouse.tx = mouse.px / r.width - .5; mouse.ty = mouse.py / r.height - .5;
  });
  stage.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = 0; mouse.px = mouse.py = -1e4; });

  // ---------- ingredient orbits: one set per moment, built once (images preload), only the current set is shown
  const sets = MOMENTS.map((m, mi) => {
    const R = seeded(11 + mi * 7), n = m.botanicals.length;
    const wrap = document.createElement('div');
    wrap.className = 'day-set'; wrap.hidden = true;
    const items = m.botanicals.map((id, k) => {
      const b = BOTANICALS[id];
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'day-ing'; el.dataset.b = id;
      el.setAttribute('aria-describedby', 'dayLens');
      el.style.setProperty('--c', b.color);
      el.innerHTML = `<img src="${cutout(id)}" alt="" draggable="false" decoding="async"><span>${esc(b.name)}</span>`;
      wrap.appendChild(el);
      return {
        el, b, k, n,
        slot: k / n * Math.PI * 2,                        // equal spacing: its fixed place on the shared ring
        off: 0,                                           // how far it has fallen behind its slot (hover pause), rad
        size: .88 + R() * .26, spin: R() * 6.28,
        hov: false, pause: 1, pop: 0, z: '', far: null, x: 0, y: 0
      };
    });
    orbitEl.appendChild(wrap);
    // one ring per moment, so the ingredients stay evenly spaced: same size, tilt and speed for all of them
    const ring = { ang: mi % 2 ? .6 : -.3, w: .32, rx: 1, ry: .3, tilt: (R() - .5) * .28 };
    return { wrap, items, ring };
  });

  // ---------- science lens: follows the ingredient it describes
  let lensFor = null;
  const placeLens = () => {
    if (!lensFor) return;
    const sr = stage.getBoundingClientRect(), r = lensFor.el.getBoundingClientRect();
    const above = r.top - sr.top > sr.height * .5;
    lens.style.left = clamp(r.left - sr.left + r.width / 2, 120, sr.width - 120) + 'px';
    lens.style.top = (above ? r.top - sr.top - 8 : r.bottom - sr.top + 8) + 'px';
    lens.classList.toggle('is-above', above);
  };
  const itemOf = el => { const btn = el?.closest?.('.day-ing'); return btn && sets[cur]?.items.find(q => q.el === btn); };
  const showLens = q => {
    if (lensFor && lensFor !== q) lensFor.hov = false;
    lensFor = q; q.hov = true;
    lens.innerHTML = lensHTML(q.b); placeLens(); lens.classList.add('on');
  };
  const hideLens = () => { if (lensFor) lensFor.hov = false; lensFor = null; lens.classList.remove('on'); };
  orbitEl.addEventListener('pointerover', e => { const q = itemOf(e.target); if (q) showLens(q); });
  orbitEl.addEventListener('pointerout', e => { if (itemOf(e.target) && !e.relatedTarget?.closest?.('.day-ing')) hideLens(); });
  orbitEl.addEventListener('focusin', e => { const q = itemOf(e.target); if (q) showLens(q); });
  orbitEl.addEventListener('focusout', hideLens);
  orbitEl.addEventListener('click', e => { const q = itemOf(e.target); if (q) showLens(q); });

  // ---------- canvas behind everything: faint orbit rings and the glow as ingredients merge
  let FW = 1, FH = 1, dpr = 1;
  function size(){
    const r = flow.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    FW = Math.max(1, r.width); FH = Math.max(1, r.height);
    flow.width = Math.round(FW * dpr); flow.height = Math.round(FH * dpr); fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (L) L.resize();
  }

  // ---------- moments: copy, dots, theme and which ingredient set is live (switches at the boundary, when s = 0)
  let cur = -1, swapT = 0;
  function setMoment(i){
    if (i === cur) return;
    const first = cur < 0;
    if (cur >= 0){ sets[cur].wrap.hidden = true; hideLens(); }
    cur = i;
    const m = MOMENTS[i];
    sets[i].wrap.hidden = false;
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
  }

  // ---------- auto-play: after AUTO seconds without input, glide the page on to the next moment.
  // It moves the scroll position itself, so it plays exactly the same scroll-driven transition as scrolling by hand,
  // and scrolling, touching, a key or a click takes over at once (and restarts the countdown).
  // The sun is the countdown: it drifts along the arc towards the next moment's hour while you read, and reaches it
  // exactly as the glide lands, so over a full run it travels morning to night without stopping.
  // Pauses (sun included) while the pointer is over the product stage or an ingredient is focused; stops at the last moment.
  let autoWait = 0, autoBusy = false, autoSafe = 0, busyStart = 0, busyDur = 1, stageHover = false;
  const auto = { from: 0, to: 0, posFrom: 0, posTo: 0 };     // sun (0..1 on the arc) and sky (moment units) for this run
  const autoDone = () => { autoBusy = false; autoWait = 0; clearTimeout(autoSafe); };
  // a wheel already redirects Lenis's glide by itself; a touch, key or click stops it where it is
  const takeOver = e => { autoWait = 0; if (autoBusy){ autoDone(); if (state.lenis && e.type !== 'wheel') state.lenis.scrollTo(window.scrollY, { immediate: true }); } };
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(t => window.addEventListener(t, takeOver, { passive: true }));
  stage.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') stageHover = true; });
  stage.addEventListener('pointerleave', () => { stageHover = false; });
  // the next moment's centre, or the current one's if we stopped short of it (a half-finished transition settles first)
  function autoNext(f){ const i = clamp(Math.floor(f), 0, N - 1); return f - i < .45 ? i : i + 1; }
  const glideDur = y => clamp(Math.abs(y - window.scrollY) / Math.max(1, (sec.offsetHeight - window.innerHeight) / N) * 2.6, .8, 3);
  function autoAdvance(f){
    const next = autoNext(f);
    if (next > N - 1) return;
    const y = momentY(next);
    busyDur = glideDur(y); busyStart = performance.now();
    autoBusy = true; clearTimeout(autoSafe);
    autoSafe = setTimeout(autoDone, busyDur * 1000 + 500);   // in case the scroll is cut short
    if (state.lenis) state.lenis.scrollTo(y, { duration: busyDur, easing: ease.io, onComplete: autoDone });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  }

  // ---------- frame loop (only while the section is on screen)
  let last = performance.now(), visible = false, raf = 0, tNow = 0;
  let intro = 0, introOn = false, fPrev = -1, boost = 0, lean = 1, sunShown = -1, skyShown = -1;
  const progress = () => { const r = sec.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - window.innerHeight), 0, 1); };
  const pathLen = arcFill.getTotalLength ? arcFill.getTotalLength() : 1;

  function frame(now){
    if (!visible){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    const real = Math.max(0, (now - last) / 1000), dt = Math.min(.05, real); last = now; tNow += dt;
    const f = progress() * N, ph = phase(f, N);
    setMoment(ph.i);

    // scrolling speed (moments per second) spins the orbits up a little
    if (fPrev >= 0) boost = lerp(boost, clamp(Math.abs(f - fPrev) / Math.max(dt, 1e-3) * 1.6, 0, 3), 1 - Math.exp(-dt * 6));
    fPrev = f;
    if (introOn) intro = Math.min(1, intro + Math.min(real, .25) / INTRO);   // wall-clock, so slow frames don't stretch it

    // sky + sun follow the continuous position between moments
    // centred on the moments: at the middle of moment i the sky and sun are exactly moment i's
    const pos = clamp(f - .5, 0, N - 1), sunAt = q => { const a = Math.floor(q), b = Math.min(N - 1, a + 1); return lerp(MOMENTS[a].sun, MOMENTS[b].sun, sm(q - a)); };
    let sunGoal = sunAt(pos), skyGoal = pos;

    // auto-play countdown: only while the section fills the screen, after the first emergence, and not at the end
    const r = sec.getBoundingClientRect(), vh = window.innerHeight, next = autoNext(f);
    const inView = r.top <= vh * .15 && r.bottom >= vh * .85, more = next <= N - 1;
    let k = -1;                                                   // how far through this run the sun is (0..1)
    if (autoBusy){ k = clamp((AUTO + (now - busyStart) / 1000) / (AUTO + busyDur), 0, 1); }
    else if (!inView || !more || intro < 1) autoWait = 0;
    else {
      if (!stageHover && !lensFor) autoWait += Math.min(real, .25);
      // the run starts wherever the scroll left the sun, and ends on the next moment's hour
      Object.assign(auto, { from: sunGoal, to: MOMENTS[next].sun, posFrom: pos, posTo: next });
      k = autoWait / (AUTO + glideDur(momentY(next)));
      if (autoWait >= AUTO){ autoWait = 0; autoAdvance(f); }
    }
    if (k > 0){
      sunGoal = lerp(auto.from, auto.to, k);
      skyGoal = Math.max(pos, lerp(auto.posFrom, auto.posTo, k * .35));   // the sky warms or darkens a little ahead of it
    }
    // eased, so it settles back smoothly when the countdown is interrupted
    const follow = 1 - Math.exp(-dt * 10);
    sunShown = sunShown < 0 ? sunGoal : lerp(sunShown, sunGoal, follow);
    skyShown = skyShown < 0 ? skyGoal : lerp(skyShown, skyGoal, follow);

    const sa = Math.floor(skyShown), sb = Math.min(N - 1, sa + 1), t = sm(skyShown - sa), A = MOMENTS[sa], B = MOMENTS[sb];
    sky.style.background = `linear-gradient(180deg, ${mix(A.sky[0], B.sky[0], t)} 0%, ${mix(A.sky[1], B.sky[1], t)} 100%)`;
    arcFill.style.strokeDasharray = `${(sunShown * pathLen).toFixed(1)} ${pathLen.toFixed(1)}`;
    if (arcSvg && sun){
      const pt = arcFill.getPointAtLength(sunShown * pathLen), w = arcSvg.clientWidth, h = arcSvg.clientHeight;
      sun.style.transform = `translate(${(pt.x / 1000 * w).toFixed(1)}px, ${(pt.y / 60 * h).toFixed(1)}px) translate(-50%, -50%)`;
    }

    const cx = FW / 2, cy = FH * .52;
    mouse.x += (mouse.tx - mouse.x) * .06; mouse.y += (mouse.ty - mouse.y) * .06;

    // product: the moment's own, slid by exact scroll position; at a boundary (|d| = .5) both are fully hidden
    if (L){
      const baseH = L.H * .6;
      jars.forEach((jar, k) => {
        const d = ph.pos - k, w = sm(clamp(1 - Math.abs(d) * 2, 0, 1)); jar.G.visible = w > .002;
        if (!jar.G.visible) return;
        L.size(jar, Math.max(1, baseH * jar.fit * (.4 + .6 * w)));
        L.place(jar.G, L.W / 2 - d * L.W * .34, L.H * .52 + Math.sin(tNow * 1.1) * 6);
        jar.G.rotation.set(.05 + mouse.y * .25, -.35 + Math.sin(tNow * .45) * .22 + mouse.x * .9 - d * 4, -.02 + Math.sin(tNow * .6) * .015);
      });
      L.renderer.render(L.scene, L.cam);
    }

    // ingredients
    fctx.clearRect(0, 0, FW, FH);
    const set = sets[ph.i], spread = ph.s * ease.out(intro), base = Math.min(FW * .4, FH * .62);
    const unit = Math.min(FW, FH) * .27, ring = set.ring, step = ring.w * (1 + boost) * dt;
    const ct = Math.cos(ring.tilt), stt = Math.sin(ring.tilt);
    ring.ang += step;
    // the cursor lean eases off while an ingredient is hovered, so the others keep their exact orbit
    lean = lerp(lean, lensFor ? 0 : 1, 1 - Math.exp(-dt * 6));
    let merged = 0;
    set.items.forEach(q => {
      // staggered: the first ingredient leaves the product first and goes back last
      const st = .3 / Math.max(1, q.n - 1);
      const sk = clamp((spread * (1 + st * (q.n - 1)) - q.k * st), 0, 1), e = ease.back(sk), on = sm(clamp(sk * 2.5, 0, 1));
      merged += 1 - sk;
      q.pause = lerp(q.pause, q.hov ? 0 : 1, 1 - Math.exp(-dt * 8));   // eases to a stop, eases back up
      q.pop = lerp(q.pop, q.hov ? 1 : 0, 1 - Math.exp(-dt * 10));
      // hovered: it holds still while the ring turns on, so it falls behind its slot; released: it glides back
      q.off -= step * (1 - q.pause);
      if (!q.hov) q.off *= Math.exp(-dt * 1.8 * q.pause);
      q.off = Math.atan2(Math.sin(q.off), Math.cos(q.off));          // back to its slot by the shorter way round
      const th = ring.ang + q.slot + q.off + (1 - sk) * 2.4;          // spiral in/out rather than a straight line
      const ox = Math.cos(th) * base * ring.rx * e, oy = Math.sin(th) * base * ring.ry * e;
      let x = cx + ox * ct - oy * stt, y = cy + ox * stt + oy * ct + Math.sin(tNow * 1.3 + q.spin) * 7 * sk * (1 - q.pop);
      const depth = Math.sin(th);                              // +1 nearest the viewer, -1 behind the product
      // lean towards the cursor
      const dx = mouse.px - x, dy = mouse.py - y, pull = Math.max(0, 1 - Math.hypot(dx, dy) / 260) * .12 * sk * lean;
      x += dx * pull; y += dy * pull;
      q.x = x; q.y = y;
      const sc = (.74 + .34 * (depth + 1) / 2) * q.size * (.25 + .75 * sk) * (1 + .16 * q.pop);
      const rot = Math.sin(tNow * .6 + q.spin) * 8 * (1 - q.pop), ry = Math.cos(th) * 26 * (1 - q.pop);
      const el = q.el;
      // --u sizes the item (width/height: a layout change), so it is written only when it changes, not every frame
      const u = unit.toFixed(0) + 'px';
      if (u !== q.u){ el.style.setProperty('--u', u); q.u = u; }
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) perspective(700px) rotateY(${ry.toFixed(1)}deg) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(3)})`;
      el.style.opacity = on.toFixed(3);
      const vis = on > .01 ? 'visible' : 'hidden';
      if (vis !== q.vis){ el.style.visibility = vis; q.vis = vis; }
      // in front of or behind the product (a stacking sibling of the product canvas); still emerging = behind
      const z = q.hov ? '5' : (sk < .45 || depth < 0) ? '1' : '3';
      if (z !== q.z){ el.style.zIndex = z; q.z = z; }
      const far = !q.hov && depth < -.35;
      if (far !== q.far){ el.classList.toggle('is-far', far); q.far = far; }
      const out = sk > .9;
      if (out !== q.out){ el.classList.toggle('is-out', out); q.out = out; }
    });
    // the shared orbit ring
    if (spread > .02){
      const e = ease.out(spread);
      fctx.save();
      fctx.translate(cx, cy); fctx.rotate(ring.tilt);
      fctx.strokeStyle = `rgba(${pin.classList.contains('is-night') ? '220,235,255' : '60,90,40'},${(.2 * sm(clamp(spread * 2, 0, 1))).toFixed(3)})`;
      fctx.lineWidth = 1; fctx.setLineDash([2, 7]);
      fctx.beginPath(); fctx.ellipse(0, 0, base * ring.rx * e, base * ring.ry * e, 0, 0, Math.PI * 2); fctx.stroke();
      fctx.restore();
    }
    if (lensFor) placeLens();

    // the warm core while ingredients are inside the product (emerging, merging, the swap itself)
    const glow = clamp(merged / set.items.length, 0, 1) * (introOn ? 1 : 0);
    if (glow > .01){
      const g = fctx.createRadialGradient(cx, cy, 0, cx, cy, FH * .34);
      g.addColorStop(0, `rgba(255,236,180,${(.45 * glow).toFixed(3)})`); g.addColorStop(1, 'rgba(255,236,180,0)');
      fctx.fillStyle = g; fctx.fillRect(0, 0, FW, FH);
    }
  }

  size();
  window.addEventListener('resize', size);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf){ last = performance.now(); raf = requestAnimationFrame(frame); }
    if (!visible){ intro = 0; introOn = false; fPrev = -1; }   // replay the emergence on the next visit
  }, { rootMargin: '100px 0px' }).observe(sec);
  // the first emergence starts once the stage is well into view
  new IntersectionObserver(([e]) => { if (e.isIntersecting) introOn = true; }, { threshold: .5 }).observe(stage);
  setMoment(0);
  return { resize: size };
}

export { initDay };
