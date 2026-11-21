// Our Roots, "Root Map" (home, section #roots, pinned for its height on every screen size).
// Six roots grow down from the hero's films as the section scrolls in, one for each moment of "A Day with TranzLife"
// below; their tips sit exactly above that section's six timeline dots. Hover, focus or tap a root: it glows, sap runs
// up it and the moment's real ingredients (cut-outs) rise along it; click (or tap again) jumps to that moment.
// Scrolling on (the pinned part, q 0..1): the roots draw together into one golden thread that drops to where the
// day's sun waits, while the night sky turns to dawn and ends on exactly the colour "A Day" starts with, so the two
// sections meet without an edge. A short gold thread at the top of "A Day" (#dayThread) carries it on to the sun.
// Reduced motion: no pin; the map is drawn once (interaction still works, without movement) and fades to dawn at its foot.
import { PRODUCTS, EXTRA_PRODUCTS } from '../../data/products.js';
import { MOMENTS, BOTANICALS } from '../../data/day.js';
import { state } from '../../app/state.js';
import { $, $$ } from '../../utils/dom.js';
import { clamp, lerp, seeded, ease } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

const band = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const sm = x => x * x * (3 - 2 * x);
const bez = (a, b, c, d, t) => { const u = 1 - t; return u*u*u*a + 3*u*u*t*b + 3*u*t*t*c + t*t*t*d; };
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixC = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cutout = id => `assets/ingredients/cutout/${id.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}.webp`;

// the golden thread's look, shared by the canvas line and the short line in "A Day" that carries it on to the sun
// (styles: .day-thread), so the two read as one line
const THREAD_W = 2.8, THREAD_GLOW = 16, BEAD_R = 3, BEAD_SPEED = .28;   // beads: thread lengths per second
const DAY_DAWN = '#f7e3c4';
const THREAD_INK = [196, 132, 40];
function threadStyle(g, alpha, ink = THREAD_INK){
  g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = THREAD_W;
  g.shadowColor = `rgba(${THREAD_INK.join(',')},.8)`; g.shadowBlur = THREAD_GLOW;
  g.strokeStyle = `rgba(${ink.join(',')},${alpha.toFixed(3)})`;
}
function bead(g, x, y, alpha){
  g.fillStyle = `rgba(255,248,226,${alpha.toFixed(3)})`;
  g.beginPath(); g.arc(x, y, BEAD_R, 0, Math.PI * 2); g.fill();
}   // the colour "A Day" starts with (its first moment's sky; also its stacked layout's band)
const NIGHT = hex('#0b1f13'), GLOW = hex('#17402a'), GOLD = [231, 198, 128], AMBER = [196, 132, 40], SAP = [255, 236, 186];
// the sunrise, stop by stop (d 0..1): forest night, deep teal, dusky rose, amber, then the day's own dawn colour
const SKY_TOP = [[0, '#0b1f13'], [.35, '#15302a'], [.62, '#7d6157'], [.85, '#e0b68c'], [1, '#efcf9f']];
const SKY_MID = [[0, '#0b1f13'], [.3, '#1e3c33'], [.58, '#b5866a'], [.82, '#eebf8d'], [1, '#f3d3a6']];
const SKY_BOT = [[0, '#0b1f13'], [.25, '#2c4a3c'], [.5, '#cc946b'], [.75, '#f0c48f'], [1, null]];   // null: the day's colour
const ramp = (stops, d, end) => {
  let k = 0; while (k < stops.length - 2 && d > stops[k + 1][0]) k++;
  const [a, ca] = stops[k], [b, cb] = stops[k + 1];
  return mixC(hex(ca || end), hex(cb || end), sm(clamp((d - a) / (b - a), 0, 1)));
};
const ALL = [...PRODUCTS, ...EXTRA_PRODUCTS];
const productName = id => (ALL.find(p => p.id === id)?.name || '').replace(/^TranzLife\s+/, '');

function initRootMap(){
  const sec = $('#roots'), canvas = $('#rootsCanvas'), list = $('#rmRoots');
  if (!sec || !canvas || !list) return null;
  const ctx = canvas.getContext('2d');
  const copy = $('#rootsCopy'), day = $('#day'), dawnEl = $('#rootsDawn'), hello = $('#rootsHello');

  // the greeting under the dawn card follows the visitor's own clock
  function greet(){
    if (!hello) return;
    const h = new Date().getHours();
    hello.textContent = h >= 5 && h < 12 ? 'Good morning. Your day begins here.'
      : h >= 12 && h < 17 ? 'Good afternoon. Here is your whole day, from sunrise.'
      : h >= 17 && h < 21 ? 'Good evening. Here is your whole day, from sunrise.'
      : 'Still up? Your day begins here.';
  }
  greet();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) greet(); });
  const N = MOMENTS.length;

  // ---------- markup: one root per moment (tip button + its ingredients)
  list.innerHTML = MOMENTS.map((m, i) => {
    const names = m.botanicals.map(b => BOTANICALS[b]?.name || b);
    return `<li class="rm-root" style="--i:${i}">
      <button type="button" class="rm-tip" data-i="${i}" aria-label="${esc(m.name)}: ${esc(productName(m.productId))}, with ${esc(names.join(', '))}. Go to this moment of the day.">
        <i class="rm-node" aria-hidden="true"></i><b>${esc(m.name)}</b><small>${esc(productName(m.productId))}</small>
        <span class="rm-list" aria-hidden="true">${esc(names.join(' · '))}</span>
      </button>
      <ul class="rm-ings" aria-hidden="true">${m.botanicals.map((b, k) => `<li class="${k % 2 ? 'is-left' : ''}"><img src="${cutout(b)}" alt="" loading="lazy" decoding="async" width="160" height="160"><span>${esc(BOTANICALS[b]?.name || b)}</span></li>`).join('')}</ul>
    </li>`;
  }).join('');
  const roots = $$('.rm-root', list).map((li, i) => ({
    li, tip: $('.rm-tip', li), ings: $$('.rm-ings li', li), pts: [], tx: 0, ty: 0, lvl: 0, dim: 0, grow: 0, delay: 0
  }));

  // ---------- geometry
  let W = 1, H = 1, dpr = 1, phone = false, sunX = 0, fine = [];
  const R = seeded(23);
  roots.forEach(r => { r.delay = R() * .22; r.w1 = (R() - .5) * 90; r.w2 = (R() - .5) * 70; r.ph = R() * 6; });

  // the tips sit above the day's six timeline dots (pinned layout); evenly spread otherwise
  function tipXs(){
    const dots = $$('#dayDots button');
    if (dots.length === N && day && day.classList.contains('is-pinned')){
      const xs = dots.map(b => { const r = b.getBoundingClientRect(); return r.left + r.width / 2; });
      if (xs.every(x => x > 0 && x < W)) return xs;
    }
    return roots.map((_, i) => W * ((phone ? .12 : .1) + (phone ? .76 : .8) * i / (N - 1)));
  }
  function daySunX(){
    const s = $('#daySun');
    if (s && day && day.classList.contains('is-pinned')){ const r = s.getBoundingClientRect(); if (r.width) return r.left + r.width / 2; }
    return W / 2;
  }

  function build(){
    dirty = true;   // new geometry: repaint
    phone = W < 768;
    const xs = tipXs(); sunX = daySunX();
    roots.forEach((r, i) => {
      r.tx = xs[i];
      r.ty = H * (phone ? (i % 2 ? .5 : .4) : .5);
      const ox = W * (.14 + .72 * i / (N - 1)), steps = 56;
      r.pts = [];
      for (let k = 0; k <= steps; k++){
        const t = k / steps;
        const x = bez(ox, ox + r.w1, r.tx + r.w2, r.tx, t) + Math.sin(t * 7 + r.ph) * 6 * t * (1 - t) * 4;
        r.pts.push([x, bez(-10, r.ty * .3, r.ty * .72, r.ty, t)]);
      }
      // two fine rootlets off each root
      r.twigs = [.35, .62].map((at, j) => {
        const base = r.pts[Math.round(at * steps)], dir = (i + j) % 2 ? 1 : -1, len = 34 + R() * 40, tp = [];
        for (let k = 0; k <= 10; k++){ const t = k / 10; tp.push([base[0] + dir * len * t, base[1] + len * .5 * t * t]); }
        return { at, pts: tp };
      });
    });
    // quiet background roots, for depth
    fine = Array.from({ length: phone ? 6 : 12 }, (_, j) => {
      const sx = W * (.04 + .92 * R()), ex = sx + (R() - .5) * W * .2, ey = H * (.22 + R() * .22), c1 = sx + (R() - .5) * 60, pts = [];
      for (let k = 0; k <= 30; k++){ const t = k / 30; pts.push([bez(sx, c1, ex, ex, t), bez(-10, ey * .4, ey * .8, ey, t)]); }
      return { pts, w: .6 + R() * .7, delay: R() * .4 };
    });
    buildThread();
  }
  // the thread all six become: from the top centre down to the day's sun, off the bottom edge
  function buildThread(){
    thread = [];
    for (let k = 0; k <= 56; k++){ const t = k / 56; thread.push([phone ? bez(W * .1, W * .1, W * .1, sunX, t) : bez(W * .5, W * .5, sunX, sunX, t), bez(-10, H * .32, H * .62, H + THREAD_W, t)]); }   // just past the edge: the day's line picks it up from there
    // how fast a bead is moving as it leaves the bottom edge (px per second), so it carries on at that speed below
    const a = thread[thread.length - 2], b = thread[thread.length - 1];
    beadExit = BEAD_SPEED * Math.hypot(b[0] - a[0], b[1] - a[1]) * (thread.length - 1);
  }
  let beadExit = 300;
  let thread = [];

  function resize(){
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  // ---------- drawing helpers
  const path = (pts, upto) => {
    const n = Math.max(1, Math.floor(upto * (pts.length - 1)));
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k <= n; k++) ctx.lineTo(pts[k][0], pts[k][1]);
  };
  const at = (pts, t) => {   // point at fraction t (0 top .. 1 tip)
    const f = clamp(t, 0, 1) * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(f)), u = f - k;
    return [lerp(pts[k][0], pts[k + 1][0], u), lerp(pts[k][1], pts[k + 1][1], u)];
  };
  const morph = (pts, c) => c <= 0 ? pts : pts.map((p, k) => { const q = thread[Math.round(k / (pts.length - 1) * (thread.length - 1))]; return [lerp(p[0], q[0], c), lerp(p[1], q[1], c)]; });

  // night -> dawn: the horizon warms first; d = 1 ends on exactly the colour "A Day" starts with
  function sky(d){
    const end = DAY_DAWN;
    const top = ramp(SKY_TOP, d, end), mid = ramp(SKY_MID, d, end), bot = ramp(SKY_BOT, d, end);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, css(top)); g.addColorStop(.6, css(mid)); g.addColorStop(1, css(bot));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (d < 1){   // the forest glow, fading as the light comes up
      const r = ctx.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, Math.max(W, H) * .6);
      r.addColorStop(0, css(GLOW, .9 * (1 - d))); r.addColorStop(1, css(GLOW, 0));
      ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    }
    const glow = .55 * sm(d) * (1 - sm(band(d, .7, 1)));   // gone by the end, so the foot is exactly the day's colour
    if (glow > .002){   // first light, where the sun is about to rise
      const r = ctx.createRadialGradient(sunX, H, 0, sunX, H, H * .7);
      r.addColorStop(0, `rgba(255,214,140,${glow.toFixed(3)})`); r.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    }
  }

  function draw(e, q, time){
    const d = sm(band(q, .56, .94)), c = ease.io(band(q, .55, .84));
    if (c > 0){ const sx = daySunX(); if (Math.abs(sx - sunX) > .5){ sunX = sx; buildThread(); } }   // the day's sun can still be settling
    sky(reduce ? 0 : d);
    if (reduce){   // a still dawn at the foot, so the section still meets "A Day" without an edge
      const end = hex(DAY_DAWN), g = ctx.createLinearGradient(0, H * .86, 0, H);
      g.addColorStop(0, css(NIGHT, 0)); g.addColorStop(1, css(end));
      ctx.fillStyle = g; ctx.fillRect(0, H * .86, W, H * .14);
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const ink = mixC(GOLD, AMBER, d), grow = clamp(e * 1.1, 0, 1);

    // background roots
    fine.forEach(f => {
      const g = sm(clamp((grow - f.delay * .5) / (1 - f.delay * .5), 0, 1)) * (1 - c);
      if (g <= 0) return;
      path(f.pts, g); ctx.lineWidth = f.w; ctx.strokeStyle = css(ink, .22); ctx.stroke();
    });

    // the six roots
    const anyActive = roots.some(r => r.lvl > .02);
    roots.forEach(r => {
      r.grow = sm(clamp((grow - r.delay * .4) / (1 - r.delay * .4), 0, 1));
      if (r.grow <= 0) return;
      // once they lie on the thread they hand over to it (fading out), so only one line is left, exactly like the day's
      const pts = morph(r.pts, c), a = (1 - r.dim * .6) * (1 - sm(band(c, .85, 1)));
      if (a <= .002) return;
      ctx.shadowColor = css(ink, .7); ctx.shadowBlur = 8 + r.lvl * 16;
      path(pts, r.grow); ctx.lineWidth = 2 + r.lvl * 1.8 + c * .6; ctx.strokeStyle = css(mixC(ink, SAP, r.lvl * .5), (.85 * a)); ctx.stroke();
      ctx.shadowBlur = 0;
      if (c < .6) r.twigs.forEach(tw => {
        const tg = clamp((r.grow - tw.at) / (1 - tw.at), 0, 1) * (1 - c / .6);
        if (tg > 0){ path(tw.pts, tg); ctx.lineWidth = 1; ctx.strokeStyle = css(ink, .45 * a); ctx.stroke(); }
      });
      // sap: bright beads running up the active root
      if (r.lvl > .02 && !reduce){
        for (let s = 0; s < 3; s++){
          const t = 1 - ((time * .32 + s / 3) % 1), p = at(pts, t);
          ctx.fillStyle = css(SAP, r.lvl * Math.sin(t * Math.PI) * .95);
          ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
    // once they are one, the thread glows and light runs down it, towards the day
    if (c > .85){
      const k = band(c, .85, 1);
      threadStyle(ctx, k, mixC(GOLD, AMBER, d));
      path(thread, 1); ctx.stroke();
      ctx.shadowBlur = 0;
      // beads fade in at the top and stay bright to the bottom edge, where the day's line takes them on
      if (!reduce) for (let s = 0; s < 3; s++){
        const t = (time * BEAD_SPEED + s / 3) % 1, p = at(thread, t);
        bead(ctx, p[0], p[1], k * Math.min(1, t * 5));
      }
    }
    return { anyActive, d, c };
  }

  // ---------- DOM: tips, ingredients, copy
  // style writes only when a value actually changes: a still section then costs no restyle at all
  const put = (el, name, v) => { const c = el._v || (el._v = {}); if (c[name] !== v){ c[name] = v; if (name[0] === '-') el.style.setProperty(name, v); else el.style[name] = v; } };
  const flag = (el, cls, on) => { if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on); };
  function setDom(e, q, time, dt){
    const out = sm(band(q, .5, .6));
    if (dawnEl) put(dawnEl, '--rd', band(q, .7, .9).toFixed(3));   // the dawn card, line by line (CSS)
    flag(sec, 'is-done', out > .5);
    if (copy) put(copy, 'opacity', (sm(band(e, .55, .95)) * (1 - out)).toFixed(3));
    roots.forEach((r, i) => {
      const goal = act === i && out < .5 ? 1 : 0, dimGoal = act >= 0 && act !== i && out < .5 ? 1 : 0, k = reduce ? 1 : 1 - Math.exp(-dt * 7);
      r.lvl += (goal - r.lvl) * k; r.dim += (dimGoal - r.dim) * k;
      if (Math.abs(goal - r.lvl) < .002) r.lvl = goal;
      const tv = sm(clamp((r.grow - .9) / .1, 0, 1)) * (1 - out);
      put(r.li, '--x', r.tx.toFixed(1) + 'px');
      put(r.li, '--y', r.ty.toFixed(1) + 'px');
      put(r.li, '--tv', tv.toFixed(3));
      put(r.li, '--lvl', r.lvl.toFixed(3));
      put(r.li, '--dim', r.dim.toFixed(3));
      flag(r.li, 'is-on', act === i);
      // ingredients rise from the tip to their places along the root, one after another
      const n = r.ings.length;
      r.ings.forEach((li, k) => {
        const a = sm(clamp(r.lvl * 1.7 - k * .2, 0, 1));
        if (a <= .001){ if (li._on !== false){ li.style.opacity = '0'; li._on = false; } return; }
        li._on = true;
        const rest = n > 2 ? .8 - k * .17 : .72 - k * .24, p = at(r.pts, lerp(1, rest, ease.out(a)));
        const side = k % 2 ? -1 : 1, bob = reduce ? 0 : Math.sin(time * 1.4 + k * 1.7 + i) * 3;
        li.style.opacity = a.toFixed(3);
        li.style.transform = `translate3d(${(p[0] + side * (phone ? 18 : 30)).toFixed(1)}px, ${(p[1] + bob).toFixed(1)}px, 0) translate(-50%, -50%) scale(${(.55 + .45 * a).toFixed(3)})`;
      });
    });
  }

  // ---------- interaction
  let hover = -1, focus = -1, tap = -1, act = -1;
  const pickAt = (px, py) => {
    let best = -1, bd = 1e9;
    roots.forEach((r, i) => {
      if (r.grow < .9) return;
      if (py > r.ty + 80) return;
      const p = at(r.pts, clamp((py + 10) / (r.ty + 10), 0, 1)), dx = Math.abs(p[0] - px);
      if (dx < (phone ? 34 : 48) && dx < bd){ bd = dx; best = i; }
    });
    return best;
  };
  const update = () => { act = focus >= 0 ? focus : hover >= 0 ? hover : tap; };
  const pin = $('#rootsPin');
  pin.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || sec.classList.contains('is-done')) return;
    const r = pin.getBoundingClientRect(), b = e.target.closest('.rm-tip');
    hover = b ? +b.dataset.i : pickAt(e.clientX - r.left, e.clientY - r.top); update();
  });
  pin.addEventListener('pointerleave', () => { hover = -1; update(); });
  let tapOnly = false;
  pin.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || sec.classList.contains('is-done')) return;
    const r = pin.getBoundingClientRect(), b = e.target.closest('.rm-tip');
    const i = b ? +b.dataset.i : pickAt(e.clientX - r.left, e.clientY - r.top);
    tapOnly = !!b && tap !== i;          // first tap on a tip shows its ingredients; a second tap goes to the moment
    tap = i; update();
  });
  list.addEventListener('focusin', e => { const b = e.target.closest('.rm-tip'); if (b){ focus = +b.dataset.i; update(); } });
  list.addEventListener('focusout', () => { focus = -1; update(); });
  list.addEventListener('click', e => {
    const b = e.target.closest('.rm-tip'); if (!b) return;
    if (tapOnly){ tapOnly = false; return; }
    goMoment(+b.dataset.i);
  });

  function goMoment(i){
    if (!day) return;
    let y;
    if (day.classList.contains('is-pinned')) y = day.offsetTop + (i + .5) / N * (day.offsetHeight - window.innerHeight);
    else { const card = $$('#dayCards > li')[i]; y = (card || day).getBoundingClientRect().top + window.scrollY - 70; }
    if (state.lenis) state.lenis.scrollTo(y, { duration: 1.8 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  // ---------- the hand-over thread at the top of "A Day": from the top edge to its sun, fading once the day settles
  // It is drawn with the very same canvas strokes as the thread above (threadStyle / bead), so the two are one line:
  // same colour, width and glow, and the beads leaving the bottom of the roots carry on down it at the same speed.
  const PAD = 40;   // room either side for the glow
  let dayThread = null, dctx = null, threadLen = 0, beadRaf = 0;
  function placeThread(){
    if (!day || !day.classList.contains('is-pinned')) return;
    const dpin = $('#dayPin', day), sun = $('#daySun', day);
    if (!dpin || !sun) return;
    if (!dayThread){
      dayThread = document.createElement('canvas'); dayThread.className = 'day-thread'; dayThread.id = 'dayThread'; dayThread.setAttribute('aria-hidden', 'true');
      dayThread.style.marginLeft = -PAD + 'px'; dctx = dayThread.getContext('2d'); dpin.appendChild(dayThread);
    }
    if (drawDayThread(performance.now()) > 0 && !reduce && !beadRaf) beadRaf = requestAnimationFrame(tickThread);
  }
  // from the day's top edge straight down to the sun's centre, wherever the sun is right now (it settles in as the
  // day section arrives, so this runs every frame while the line is on screen); returns its opacity
  function drawDayThread(now){
    const top = day.getBoundingClientRect().top, vh = window.innerHeight;
    if (top > vh || top < -vh) return 0;
    const pr = $('#dayPin', day).getBoundingClientRect(), s = $('#daySun', day).getBoundingClientRect();
    threadLen = Math.max(0, s.top + s.height / 2 - pr.top);
    const w = PAD * 2, h = Math.ceil(threadLen + PAD), r = Math.min(window.devicePixelRatio || 1, 2);
    if (dayThread.width !== Math.round(w * r) || dayThread.height !== Math.round(h * r)){
      dayThread.width = Math.round(w * r); dayThread.height = Math.round(h * r);
      dayThread.style.width = w + 'px'; dayThread.style.height = h + 'px';
    }
    dayThread.style.left = (s.left + s.width / 2 - pr.left).toFixed(1) + 'px';
    const op = top > 0 ? 1 : 1 - clamp(-top / (vh * .3), 0, 1);
    dayThread.style.opacity = op.toFixed(3);
    dctx.setTransform(r, 0, 0, r, 0, 0); dctx.clearRect(0, 0, w, h);
    threadStyle(dctx, 1);
    dctx.beginPath(); dctx.moveTo(PAD, -THREAD_W); dctx.lineTo(PAD, threadLen); dctx.stroke();
    dctx.shadowBlur = 0;
    if (!reduce){
      const time = now / 1000;
      for (let k = 0; k < 3; k++){
        const u = (time * BEAD_SPEED + k / 3) % 1, dist = u / BEAD_SPEED * beadExit;   // time since it left the roots' line, times its speed
        if (dist < threadLen) bead(dctx, PAD, dist, 1 - Math.pow(dist / Math.max(1, threadLen), 3));
      }
    }
    return op;
  }
  function tickThread(now){
    beadRaf = 0;
    if (!dayThread || drawDayThread(now) <= 0) return;
    beadRaf = requestAnimationFrame(tickThread);
  }
  window.addEventListener('scroll', placeThread, { passive: true });

  // ---------- frame loop (only while the section is near the screen)
  const progress = () => {
    const r = sec.getBoundingClientRect(), vh = window.innerHeight;
    return { e: clamp((vh - r.top) / vh, 0, 1), q: clamp(-r.top / Math.max(1, r.height - vh), 0, 1) };
  };
  let visible = false, raf = 0, last = 0, t = 0, drawn = '', dirty = true;
  function frame(now){
    if (!visible){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; t = now / 1000;   // wall clock: shared with tickThread, so beads line up
    let { e, q } = progress();
    if (reduce){ e = 1; q = 0; }
    // the canvas is repainted only when something on it moves: the scroll position, a root easing in or out or
    // carrying sap (an active root), the thread's beads, or a resize. A still, idle map is not redrawn every frame.
    const moving = roots.some(r => r.lvl > 0 || r.dim > 0) || q > .5;
    const key = e.toFixed(4) + '|' + q.toFixed(4);
    if (moving || key !== drawn || dirty){ draw(e, q, t); drawn = key; dirty = false; }
    setDom(e, q, t, dt);
  }
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && !raf){ last = 0; raf = requestAnimationFrame(frame); }
  }, { rootMargin: '120px 0px' }).observe(sec);

  if (reduce) sec.classList.add('is-static');
  resize();
  window.addEventListener('resize', () => { resize(); placeThread(); });
  // the day section lays out its dots and sun after this runs: line the tips up with them once it has
  requestAnimationFrame(() => requestAnimationFrame(() => { build(); placeThread(); }));
  window.addEventListener('load', () => { build(); placeThread(); });
  return { resize };
}

export { initRootMap };
