// The TranzLife home page film (#xp): one full-screen stage played through like a short film, after the reference the
// client chose. Nothing scrolls while it plays: the wheel, a finger or the arrow keys move the story inside the current
// stage, and a press-and-hold ring carries you to the next stage. The story:
//   0  Begin    a water-light loader with a counter, then "Draw the sun": draw a circle and the day begins
//   1  Seed     "Long ago, we knew." / "Nature was our first teacher." / a banyan garden: "the wisdom of Ayurveda"
//               hold -> the garden drains to red and shatters: "But."
//   2  Leaf     "We forgot." / glass shards of modern life / palm-leaf manuscripts burn: "Old wisdom, lost in
//               translation." / "but your body still remembers."  (runs straight on into 3)
//   3  Lab      "Balance." / a golden portal round a dewdrop with a helix inside: "where Ayurveda meets the lab"
//               hold -> a white bloom
//   4  Formula  "Introducing" above the clouds / the TranzLife wordmark / "Rooted in nature. Backed by science." / the
//               clouds part, the six products rise / a beacon "Find your ritual": hold -> A Day with TranzLife
//   5  You      the page itself: A Day with TranzLife (features/story/day-story.js) and the footer
// HUD: the sound switch (top left), a ruler of the five stages (top centre; click to jump), a leaf counter (top
// right), "Scroll" when it is time to scroll. The bottom bar (logo, "Find your ritual", menu) stays on the page.
// Sound: the score (features/cinema/score.js) changes with each stage; the hold and the drawing have their own tones.
import { initBg } from './bg.js';
import { initFx } from './fx.js';
import { makeHold } from '../features/cinema/hold.js';
import { PRODUCTS, EXTRA_PRODUCTS } from '../data/products.js';
import { state } from '../app/state.js';
import { clamp, lerp } from '../utils/math.js';
import { reduce } from '../utils/media.js';

const band = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const sm = x => x * x * (3 - 2 * x);
const wait = ms => new Promise(r => setTimeout(r, ms));
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

const STAGES = [
  { id: 'begin',   label: 'Begin',   look: 'water', bed: 'gate',    theme: 'dark',  len: 0 },
  { id: 'seed',    label: 'Seed',    look: 'mint',  bed: 'windows', theme: 'light', len: 2800, hold: true },
  { id: 'leaf',    label: 'Leaf',    look: 'red',   bed: 'tension', theme: 'dark',  len: 3800, auto: true },
  { id: 'lab',     label: 'Lab',     look: 'black', bed: 'lens',    theme: 'dark',  len: 2200, hold: true },
  { id: 'formula', label: 'Formula', look: 'cloud', bed: 'ritual',  theme: 'light', len: 3400, hold: true }
];
const RULER = [...STAGES.slice(1).map(s => s.label), 'You'];
const ALL = [...PRODUCTS, ...EXTRA_PRODUCTS];
const ORDER = ['gummies', 'liver', 'energy', 'inhaler', 'rollon', 'reviva'];

function initExperience(){
  const xp = $('#xp'), root = document.documentElement;
  if (!xp) return null;
  const score = () => state.score;
  const bg = initBg($('#xpBg'));
  const fx = initFx($('#xpFx'));
  const scenes = $$('.xs', xp);
  const flash = $('#xpFlash'), but = $('#xpBut');
  const holdEl = $('#hold'), holdBtn = $('#holdBtn');
  const hudScroll = $('#hudScroll'), hudLeaves = $('#hudLeaves'), rulerTrack = $('#hrTrack'), rulerLabel = $('#hrLabel');

  let s = 0, p = 0, pt = 0, busy = false, open = true, leaves = 0, shown = 0, lastInput = 0;

  // ---------------------------------------------------------------- words: every line rises word by word
  function split(el){
    const words = [];
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3){
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(t => { if (!t) return; if (/^\s+$/.test(t)){ frag.append(t); return; } const w = document.createElement('span'); w.className = 'xw'; w.textContent = t; frag.append(w); words.push(w); });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return words;
  }
  const beats = scenes.map(sc => $$('.bt', sc).map(el => ({ el, a: +el.dataset.a, b: +el.dataset.b, words: split(el), key: '' })));
  function drawBeats(i, q){
    beats[i].forEach(bt => {
      const k = (q - bt.a) / (bt.b - bt.a), inK = reduce ? (k > 0 ? 1 : 0) : clamp(k / .3, 0, 1), outK = bt.b > 1 ? 0 : (reduce ? (k >= 1 ? 1 : 0) : clamp((k - .72) / .28, 0, 1));
      const key = inK.toFixed(3) + outK.toFixed(3);
      if (key === bt.key) return; bt.key = key;
      const on = inK > 0 && outK < 1;
      bt.el.classList.toggle('on', on);
      bt.el.style.opacity = ((bt.words.length ? (inK > 0 ? 1 : 0) : sm(inK)) * (1 - outK)).toFixed(3);   // (a beat without words, the wordmark, fades in whole)
      bt.el.style.filter = outK > .01 ? `blur(${(outK * 16).toFixed(1)}px)` : '';
      bt.el.style.transform = `translate(-50%,-50%) scale(${(1 + outK * .14).toFixed(3)})`;
      bt.words.forEach((w, j) => {
        const e = sm(clamp((inK - j * .07) * 2.4, 0, 1));
        w.style.opacity = e.toFixed(3);
        w.style.transform = e >= 1 ? '' : `translateY(${((1 - e) * 34).toFixed(1)}px)`;
        w.style.filter = e >= 1 ? '' : `blur(${((1 - e) * 10).toFixed(1)}px)`;
      });
    });
  }

  // ---------------------------------------------------------------- stage scrubs
  const sc1 = { garden: $('.s1-garden', xp), chips: $$('.chip', xp) };
  const sc2 = { shards: $$('.shard', xp), scraps: $$('.scrap', xp), threads: $$('.s2-threads path', xp), pulse: $('.s2-pulse', xp) };
  const sc3 = { portal: $('.s3-portal', xp) };
  const sc4 = { clouds: $$('.cloud', xp), world: $('.s4-world', xp), names: $('.s4-names', xp), beacon: $('.s4-beacon', xp), jarsCv: $('#s4Jars') };
  let jars = null;

  function scrub(t){
    const q = p;
    drawBeats(s, q);
    if (s === 1){
      sc1.chips.forEach((c, i) => {
        const ein = sm(band(q, .15 + i * .009, .3 + i * .009)), eout = sm(band(q, .43, .55));
        const x = +c.dataset.x, y = +c.dataset.y, z = +c.dataset.z || 1;
        const k = (.3 + .7 * ein) * (1 + eout * 1.4);                    // in from the centre, then out past the camera
        const fx_ = x * k + Math.sin(t * .5 + i * 1.7) * .8, fy = y * k + Math.cos(t * .6 + i) * 1.1;
        c.style.opacity = (ein * (1 - eout)).toFixed(3);
        c.style.transform = `translate(-50%,-50%) translate(${fx_.toFixed(2)}vw, ${fy.toFixed(2)}vh) scale(${((.45 + .55 * ein) * z * (1 + eout * 1.2)).toFixed(3)}) rotate(${((1 - ein) * 30 * (i % 2 ? 1 : -1) + Math.sin(t * .4 + i) * 4).toFixed(1)}deg)`;
        c.style.filter = z < .8 ? `blur(${((.8 - z) * 6 + eout * 6).toFixed(1)}px)` : (eout > .02 ? `blur(${(eout * 8).toFixed(1)}px)` : '');
        c.style.setProperty('--lab', clamp((ein - .7) / .3, 0, 1).toFixed(3));
      });
      fx.leafs(sm(band(q, .16, .3)) * (1 - sm(band(q, .44, .52))));
      const gi = sm(band(q, .44, .58));
      sc1.garden.style.opacity = gi.toFixed(3);
      sc1.garden.style.transform = `scale(${(1.22 - .2 * sm(band(q, .44, 1))).toFixed(4)})`;
      fx.petals(gi);
    }
    if (s === 2){
      sc2.shards.forEach((el, i) => {
        const f = band(q, .04 + i * .072, .17 + i * .072), on = Math.sin(Math.PI * f);
        const x = +el.dataset.x, y = +el.dataset.y, r = +el.dataset.r;
        el.style.opacity = clamp(on * 1.4, 0, 1).toFixed(3);
        el.style.transform = `translate(-50%,-50%) translate(${(x * (1 + f * 1.8)).toFixed(1)}vw, ${(y * (1 + f)).toFixed(1)}vh) scale(${(.3 + f * 1.9).toFixed(3)}) rotate(${(r * (1 - f * .6)).toFixed(1)}deg) rotateY(${((f - .5) * 30).toFixed(1)}deg)`;
        el.style.filter = on > .9 ? '' : `blur(${((1 - on) * 8).toFixed(1)}px)`;
      });
      bg.set(q < .46 ? 'red' : 'chalk', 3);
      fx.leaves(band(q, .52, .57) * (1 - band(q, .8, .86)), band(q, .59, .81));
      fx.motes(band(q, .46, .55), '231,198,128');
      sc2.scraps.forEach((el, i) => {
        const f = sm(band(q, .78 + i * .025, .88 + i * .025));
        el.style.opacity = f.toFixed(3);
        el.style.transform = `translate(-50%,-50%) translate(${(Math.sin(t * .25 + i) * 6).toFixed(1)}px, ${((1 - f) * 24 + Math.cos(t * .3 + i) * 5).toFixed(1)}px)`;
      });
      sc2.threads.forEach((el, i) => { el.style.strokeDashoffset = (1 - sm(band(q, .82 + i * .02, .94 + i * .02))).toFixed(3); });
      if (sc2.pulse) sc2.pulse.style.opacity = sm(band(q, .76, .86)).toFixed(3);
    }
    if (s === 3){
      const a = sm(band(q, .28, .5)), z = .3 + .7 * sm(band(q, .3, .82));
      sc3.portal.style.opacity = a.toFixed(3);
      sc3.portal.style.setProperty('--z', z.toFixed(4));
      sc3.portal.style.setProperty('--spin', `${(t * 14 + q * 160).toFixed(1)}deg`);
      fx.motes(.8, '140,220,170');
    }
    if (s === 4){
      const part = sm(band(q, .12, .62));
      sc4.clouds.forEach(c => {
        const side = +c.dataset.side, d = +c.dataset.d;
        c.style.transform = `translate(${(side * part * 70 * d).toFixed(2)}vw, ${(Math.sin(t * .1 + d) * 1.5 - part * 10 * (1 - d)).toFixed(2)}vh) scale(${(1.1 + part * .35 * d).toFixed(3)})`;
        c.style.opacity = (side === 0 ? 1 - sm(band(q, .1, .4)) : 1 - sm(band(q, .45, .7)) * .85).toFixed(3);
      });
      const wv = sm(band(q, .12, .55));                  // the world beneath, hazy through the clouds, then clear
      sc4.world.style.opacity = (.32 + .68 * wv).toFixed(3);
      sc4.world.style.filter = wv > .98 ? '' : `blur(${((1 - wv) * 8).toFixed(1)}px)`;
      sc4.world.style.transform = `scale(${(1.14 - .14 * sm(band(q, .1, 1))).toFixed(4)})`;
      jarsFrame(q, t);
      const bOn = sm(band(q, .82, .92));
      sc4.beacon.style.opacity = bOn.toFixed(3);
      sc4.beacon.style.setProperty('--spin', `${(t * 22).toFixed(1)}deg`);
    }
  }

  // ---------------------------------------------------------------- the six products, rising in 3D (stage 4)
  async function makeJars(){
    if (jars || !sc4.jarsCv) return;
    try {
      const { jarLayer } = await import('../features/products/jar-layer.js');
      const L = jarLayer(sc4.jarsCv);
      const list = ORDER.map((id, i) => { const pr = ALL.find(x => x.id === id); return pr ? { pr, j: L.jar(pr, i) } : null; }).filter(Boolean);
      list.forEach(x => { x.j.G.visible = false; });
      L.warm({ eager: true });
      sc4.names.innerHTML = list.map(x => `<span class="nm">${x.pr.name.replace(/^TranzLife\s+/, '')}</span>`).join('');
      jars = { L, list, names: $$('.nm', sc4.names) };
      addEventListener('resize', () => jars.L.resize());
    } catch (e) { console.warn('3D products unavailable', e); }
  }
  function jarsFrame(q, t){
    if (!jars) return;
    const { L, list, names } = jars, W = innerWidth, H = innerHeight, phone = W < 760, n = list.length;
    const rise = q, any = band(q, .56, .6) > 0, dim = sm(band(q, .82, .92));
    sc4.jarsCv.style.opacity = any ? (1 - dim * .55).toFixed(3) : '0';
    list.forEach((x, i) => {
      const f = sm(band(rise, .58 + i * .03, .74 + i * .03));
      const col = phone ? i % 3 : i, row = phone ? Math.floor(i / 3) : 0, per = phone ? 3 : n;
      const u = (col - (per - 1) / 2) / ((per - 1) / 2 || 1);
      const cx = W / 2 + u * W * (phone ? .3 : .37), cy = (phone ? H * (.46 + row * .2) : H * .56) - Math.abs(u) * H * .05;
      x.j.G.visible = f > .002;
      if (!x.j.G.visible) { names[i] && (names[i].style.opacity = 0); return; }
      L.size(x.j, (phone ? H * .14 : H * .23) * (x.j.fit || 1) * (.6 + .4 * f));
      L.place(x.j.G, cx, cy + (1 - f) * H * .4);
      x.j.G.rotation.y = -.4 + Math.sin(t * .6 + i) * .25 + (1 - f) * 2;
      if (names[i]){ names[i].style.opacity = (f * (1 - dim * .7)).toFixed(3); names[i].style.left = `${cx}px`; names[i].style.top = `${cy + (phone ? H * .085 : H * .135)}px`; }
    });
    L.renderer.render(L.scene, L.cam);
  }

  // ---------------------------------------------------------------- the loader: a sprig grows, then draw the infinity
  // Loading: a tulsi sprig grows leaf by leaf with the page's progress (--lp on the stage; CSS draws the stem and opens
  // each leaf at its own threshold). Ready: the sprig settles, a dotted infinity appears and a point of light traces it
  // to show the way. The visitor traces it (anywhere along its path; 90 % covered is enough) and a brush of gold ink
  // follows the finger. "Or tap here to begin" draws it for them, like a hand would: unhurried, slowing into the
  // curves, with a slight natural wobble. Then the light blooms from the centre of the infinity.
  const ld = { stage: $('.xs-0', xp), ring: $('#ldRing'), track: $('#ldTrack'), arc: $('#ldArc'), tip: $('#ldTip'), begin: $('#ldBegin'), sun: $('#ldSun'),
    shown: 0, ready: false, drawing: false, done: false, auto: false, bins: null };
  const INF = (() => {                                  // a lemniscate, 160 points, in the ring's own units (-160..160)
    const pts = [];
    for (let i = 0; i < 160; i++){ const t = i / 160 * Math.PI * 2, d = 1 + Math.sin(t) ** 2; pts.push([150 * Math.cos(t) / d, 150 * Math.sin(t) * Math.cos(t) / d]); }
    return pts;
  })();
  const infD = 'M' + INF.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
  ld.track && ld.track.setAttribute('d', infD); ld.arc && ld.arc.setAttribute('d', infD);
  const BINS = 64;
  ld.bins = new Uint8Array(BINS);
  const PRELOAD = ['/assets/homepage-concept/act1-primordial-roots.jpg', '/assets/homepage-concept/act2-dewdrop-dna.jpg', '/assets/about/about-hero-roots-to-infinity.webp', '/fog/fog-1.webp', '/fog/fog-2.webp', '/fog/fog-3.webp', ...$$('.chip img', xp).map(i => i.getAttribute('src'))];
  let got = 0;
  PRELOAD.forEach(src => { const im = new Image(); im.onload = im.onerror = () => { got++; }; im.src = src; });
  const t0 = performance.now();
  let tipT = 0;
  function loaderTick(dt){
    const target = Math.min(got / PRELOAD.length, (performance.now() - t0) / 2600);
    ld.shown += (target - ld.shown) * (1 - Math.exp(-dt * 4));
    ld.stage.style.setProperty('--lp', ld.shown.toFixed(4));
    if (!ld.ready && ld.shown > .995){ ld.ready = true; xp.classList.add('ld-ready'); setTimeout(() => xp.classList.add('ld-draw'), 900); }
    // the guiding light: once round the infinity every 3.4 s while nobody is drawing
    if (ld.ready && ld.tip){
      const on = !ld.drawing && !ld.done && !ld.auto;
      ld.tip.style.opacity = on ? '1' : '0';
      if (on){ tipT = (tipT + dt / 3.4) % 1; const p = INF[Math.floor(tipT * INF.length) % INF.length]; ld.tip.setAttribute('cx', p[0].toFixed(1)); ld.tip.setAttribute('cy', p[1].toFixed(1)); }
    }
  }
  // screen <-> the ring's units
  function ringBox(){ const r = ld.ring.getBoundingClientRect(); const k = r.width / 320; return { r, k, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }
  const toLocal = (x, y, b) => [(x - b.cx) / b.k, (y - b.cy) / b.k];
  const toScreen = (p, b) => [b.cx + p[0] * b.k, b.cy + p[1] * b.k];
  function cover(lx, ly){
    let best = 1e9, bi = 0;
    for (let i = 0; i < INF.length; i++){ const d = (INF[i][0] - lx) ** 2 + (INF[i][1] - ly) ** 2; if (d < best){ best = d; bi = i; } }
    if (best < 30 * 30) ld.bins[Math.floor(bi / INF.length * BINS)] = 1;
  }
  const progress = () => ld.bins.reduce((a, v) => a + v, 0) / BINS;
  function showProgress(){
    const prog = clamp(progress() / .9, 0, 1);
    ld.arc.style.strokeDashoffset = (1 - prog).toFixed(4);
    score() && score().hold(prog);
    if (prog >= 1) sunrise();
  }
  function drawDown(e){
    if (s !== 0 || !ld.ready || ld.done || ld.auto || busy || e.target.closest('button, a')) return;
    ld.drawing = true; ld.bins.fill(0);
    score() && (score().unlock(), score().holdStart());
    try { xp.setPointerCapture(e.pointerId); } catch (err) {}
    drawMove(e);
  }
  function drawMove(e){
    if (!ld.drawing) return;
    const b = ringBox(), [lx, ly] = toLocal(e.clientX, e.clientY, b);
    fx.stroke.add(e.clientX, e.clientY);
    cover(lx, ly);
    showProgress();
  }
  function drawUp(){
    if (!ld.drawing) return;
    ld.drawing = false; score() && score().holdEnd();
    if (!ld.done){ ld.arc.style.strokeDashoffset = '1'; fx.stroke.fade(.35); setTimeout(() => !ld.done && !ld.drawing && fx.stroke.clear(), 600); }
  }
  xp.addEventListener('pointerdown', drawDown);
  xp.addEventListener('pointermove', drawMove);
  ['pointerup', 'pointercancel'].forEach(ev => xp.addEventListener(ev, drawUp));
  // drawn for you, as a hand would draw it
  async function autoDraw(){
    if (ld.done || ld.auto) return;
    ld.auto = true; fx.stroke.clear(); ld.bins.fill(0);
    score() && (score().unlock(), score().holdStart());
    const b = ringBox(), DUR = reduce ? 300 : 2600, start = performance.now(), N = INF.length;
    await new Promise(res => {
      const step = now => {
        const u = clamp((now - start) / DUR, 0, 1);
        // a hand slows into the tight turns and speeds along the long sweeps
        const e = u - Math.sin(u * Math.PI * 4) * .025;
        const f = e * N, i = Math.floor(f) % N, j = (i + 1) % N, k = f - Math.floor(f);
        const p = [INF[i][0] + (INF[j][0] - INF[i][0]) * k, INF[i][1] + (INF[j][1] - INF[i][1]) * k];
        const w = Math.sin(u * 47) * 1.4 + Math.sin(u * 13) * 1.1;              // the hand's slight tremor
        const [x, y] = toScreen([p[0] + w * .6, p[1] + w], b);
        fx.stroke.add(x, y); cover(p[0], p[1]);
        const prog = clamp(u, 0, 1);
        ld.arc.style.strokeDashoffset = (1 - prog).toFixed(4); score() && score().hold(prog);
        if (u < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
    ld.auto = false;
    sunrise();
  }
  ld.begin && ld.begin.addEventListener('click', () => { if (ld.ready) autoDraw(); });

  async function sunrise(){
    if (ld.done) return;
    ld.done = true; ld.drawing = false; busy = true;
    score() && (score().holdEnd(), score().sfx('plant'));
    ld.arc.style.strokeDashoffset = '0';
    xp.classList.add('ld-complete');
    await wait(reduce ? 50 : 500);
    const b = ringBox();
    ld.sun.style.left = `${b.cx}px`; ld.sun.style.top = `${b.cy}px`;
    xp.classList.add('ld-sunrise');
    fx.stroke.fade(0);
    await wait(reduce ? 200 : 1100);
    fx.wipe(); ld.ring.style.visibility = 'hidden';
    await goStage(1, { bloom: true });
    busy = false;
  }

  // ---------------------------------------------------------------- moving between stages
  function setStage(i){
    s = i; p = pt = 0;
    const st = STAGES[i];
    scenes.forEach((el, k) => el.classList.toggle('is-on', k === i));
    xp.dataset.stage = st.id; xp.dataset.theme = st.theme;
    document.body.dataset.xpTheme = st.theme;
    bg.set(st.look);
    score() && score().setScene(st.bed);
    fx.petals(0); fx.motes(0); fx.leaves(0); fx.leafs(0); if (i > 0) fx.wipe();
    if (i === 3 || i === 4) makeJars();
    beats[i].forEach(b => { b.key = ''; });
    ruler();
  }
  async function goStage(i, { bloom = false } = {}){
    if (bloom){ flash.className = 'xp-flash is-white on'; await wait(reduce ? 50 : 700); }
    setStage(i);
    setLeaves(Math.max(0, i - 1) * 100 + (i >= 1 ? 100 : 0));
    if (bloom){ await wait(60); flash.classList.remove('on'); }
  }
  async function advance(){
    if (busy) return; busy = true; hideHold();
    const sc = score();
    if (s === 1){                                  // the garden drains to red, breaks, and then: "But."
      xp.classList.add('tx-red'); bg.set('red', 4);
      await wait(reduce ? 100 : 900);
      sc && sc.sfx('shatter');
      flash.className = 'xp-flash is-black on'; fx.shatter('#120202');
      await wait(260);
      but.classList.add('on');
      await wait(1500);
      but.classList.remove('on'); xp.classList.remove('tx-red');
      setStage(2); setLeaves(200);
      await wait(120); flash.classList.remove('on');
    } else if (s === 2){                           // straight on into the lab
      flash.className = 'xp-flash is-black on'; sc && sc.sfx('whoosh');
      await wait(700); setStage(3); setLeaves(300); await wait(100); flash.classList.remove('on');
    } else if (s === 3){                           // the portal opens into white light
      xp.classList.add('tx-portal'); sc && sc.sfx('shimmer');
      await wait(reduce ? 100 : 900);
      flash.className = 'xp-flash is-white on'; sc && sc.sfx('whoosh');
      await wait(900); xp.classList.remove('tx-portal');
      setStage(4); setLeaves(400);
      await wait(200); flash.classList.remove('on');
    } else if (s === 4){                           // into A Day with TranzLife
      xp.classList.add('tx-beacon'); sc && sc.sfx('bowl');
      setLeaves(500);
      await wait(reduce ? 100 : 1100);
      close();
    }
    busy = false;
  }

  // ---------------------------------------------------------------- the hold ring
  let holdShown = false;
  const H = makeHold(holdBtn, {
    duration: 1.25, drain: .5,
    onStart(){ score() && (score().unlock(), score().holdStart()); holdEl.classList.add('is-holding'); },
    onProgress(v, holding){ holdEl.style.setProperty('--hp', v.toFixed(4)); score() && score().hold(v); if (!holding && v <= 0) holdEl.classList.remove('is-holding'); },
    onRelease(){ score() && score().holdEnd(); holdEl.classList.remove('is-holding'); },
    onComplete(){ score() && score().holdEnd(); advance(); }
  });
  function showHold(){
    if (holdShown) return; holdShown = true;
    let x = innerWidth / 2, y = innerHeight / 2;
    const anchor = s === 3 ? sc3.portal : s === 4 ? sc4.beacon : null;
    if (anchor){ const r = $('.anchor', anchor)?.getBoundingClientRect(); if (r && r.width){ x = r.left + r.width / 2; y = r.top + r.height / 2; } }
    holdEl.style.left = `${x}px`; holdEl.style.top = `${y}px`;
    holdEl.classList.add('on'); H.reset();
    setTimeout(() => { try { holdBtn.focus({ preventScroll: true }); } catch (e) {} }, 300);
  }
  function hideHold(){ holdShown = false; holdEl.classList.remove('on', 'is-holding'); }

  // ---------------------------------------------------------------- input: the story moves only inside the stage
  const nudge = d => {
    if (!open || busy || s === 0) return;
    const L = STAGES[s].len || 2000;
    pt = clamp(pt + d / L, 0, 1); lastInput = performance.now();
  };
  addEventListener('wheel', e => { if (!open) return; e.preventDefault(); nudge(e.deltaY * (e.deltaMode === 1 ? 32 : 1)); }, { passive: false });
  let ty = null;
  xp.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  xp.addEventListener('touchmove', e => { if (ty === null) return; const y = e.touches[0].clientY; nudge((ty - y) * 2.6); ty = y; e.preventDefault(); }, { passive: false });
  xp.addEventListener('touchend', () => { ty = null; });
  addEventListener('keydown', e => {
    if (!open || e.target.closest('input, textarea')) return;
    if (['ArrowDown', 'PageDown'].includes(e.key)){ e.preventDefault(); nudge(160); }
    if (['ArrowUp', 'PageUp'].includes(e.key)){ e.preventDefault(); nudge(-160); }
    if (e.key === ' ' && e.target === document.body){ e.preventDefault(); nudge(240); }
  });

  // ---------------------------------------------------------------- HUD
  function setLeaves(v){ leaves = v; }
  function ruler(){
    const g = s === 0 ? 0 : (s - 1 + p) / (RULER.length - 1);
    if (rulerTrack) rulerTrack.style.transform = `translateX(${(-g * 100).toFixed(3)}%)`;
    const k = s === 0 ? 0 : s - 1;
    if (rulerLabel) rulerLabel.textContent = `${String(k + 1).padStart(2, '0')} · ${RULER[k]}`;
  }
  // the ruler opens a list of the stages (jump to any)
  const menu = $('#hudMenu'), rulerBtn = $('#hudRuler');
  if (menu && rulerBtn){
    menu.innerHTML = RULER.map((r, i) => `<button type="button" data-i="${i}"><b>${String(i + 1).padStart(2, '0')}</b> ${r}</button>`).join('');
    rulerBtn.addEventListener('click', () => { const on = !menu.classList.contains('on'); menu.classList.toggle('on', on); rulerBtn.setAttribute('aria-expanded', on); });
    menu.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      menu.classList.remove('on'); rulerBtn.setAttribute('aria-expanded', 'false');
      const i = +b.dataset.i;
      if (i === RULER.length - 1){ close(); return; }
      jump(i + 1);
    });
  }
  async function jump(i){
    if (busy) return; busy = true; hideHold();
    ld.done = true; xp.classList.add('ld-sunrise');
    flash.className = 'xp-flash is-black on'; await wait(400);
    setStage(i); setLeaves(i * 100);
    await wait(80); flash.classList.remove('on'); busy = false;
  }

  // ---------------------------------------------------------------- open / close (the film over the page)
  function close(){
    open = false; hideHold();
    xp.classList.add('is-leaving');
    root.classList.remove('xp-on');
    window.scrollTo(0, 0);
    state.lenis && (state.lenis.scrollTo(0, { immediate: true }), state.lenis.start());
    score() && score().setScene('day');
    setTimeout(() => { xp.hidden = true; xp.classList.remove('is-leaving', 'tx-beacon'); }, reduce ? 0 : 1300);
    document.dispatchEvent(new CustomEvent('tl:film-closed'));
  }
  function reopen(i = 1){
    xp.hidden = false; open = true; root.classList.add('xp-on');
    state.lenis && state.lenis.stop(); window.scrollTo(0, 0);
    ld.done = true; xp.classList.add('ld-sunrise');
    setStage(i); setLeaves(i * 100);
  }

  // ---------------------------------------------------------------- the clock
  let last = performance.now();
  function frame(now){
    requestAnimationFrame(frame);
    if (!open && xp.hidden) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
    if (s === 0) loaderTick(dt);
    p += (pt - p) * (1 - Math.exp(-dt * (reduce ? 30 : 5.5)));
    if (Math.abs(pt - p) < .0004) p = pt;
    if (s > 0 && !busy) scrub(t);
    if (s > 0) ruler();
    bg.frame(t, dt); fx.frame(t);
    // the end of a stage: the ring (or, between 2 and 3, straight on)
    const st = STAGES[s];
    if (open && !busy && s > 0 && p > .965){
      if (st.hold) showHold(); else if (st.auto) advance();
    } else if (holdShown && p < .9) hideHold();
    // "Scroll" when the visitor has paused mid-stage
    const idle = now - lastInput > 1800;
    hudScroll && hudScroll.classList.toggle('on', open && s > 0 && !busy && idle && p < .96);
    shown += (leaves - shown) * (1 - Math.exp(-dt * 4));
    if (hudLeaves) hudLeaves.textContent = Math.round(shown);
  }
  setStage(0);
  requestAnimationFrame(frame);
  root.classList.add('xp-on');

  return { close, reopen, jump, seek(v){ pt = clamp(v, 0, 1); }, get open(){ return open; }, get stage(){ return s; } };
}

export { initExperience };
