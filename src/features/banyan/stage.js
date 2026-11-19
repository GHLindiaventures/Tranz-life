// "The Living Banyan" (banyan.html): the parallax stage.
// The page is one journey down a single banyan, top to bottom, while the day passes: dawn above the canopy, through
// the leaves, down the ancient trunk (Ayurveda), along the aerial roots into science, to the six products where six
// roots meet the ground, and on into the earth. A fixed stage holds the layers; scrolling moves each one at its own
// speed (k: 1 = the tree itself, less = further away, more = nearer the eye). Layer content is placed so that it is
// level with the tree when centred on screen: y = (Y - H/2) * k + H/2, for a world height Y.
// A golden thread (a canvas) runs from one leaf down the whole tree, drawn as far as the visitor has come.
// Reduced motion: everything moves with the page (no depth), no drifting particles, no smooth scrolling.
import Lenis from 'lenis';
import { clamp, lerp, seeded } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';
import * as A from './art.js';

const HERBS = [
  { id: 'tulsi', name: 'Tulsi', latin: 'Ocimum tenuiflorum' },
  { id: 'ginger', name: 'Ginger', latin: 'Zingiber officinale' },
  { id: 'turmeric', name: 'Turmeric', latin: 'Curcuma longa' },
  { id: 'amla', name: 'Amla', latin: 'Emblica officinalis' },
  { id: 'guduchi', name: 'Guduchi', latin: 'Tinospora cordifolia' },
  { id: 'long-pepper', name: 'Long pepper', latin: 'Piper longum' }
];

export function initBanyan(products){
  const stage = document.getElementById('bnStage'), space = document.getElementById('bnSpace');
  const nav = document.getElementById('bnNav'), rail = document.getElementById('bnRail');
  if (!stage || !space) return null;
  const $ = id => document.getElementById(id);
  const layer = (id, k, z) => { const el = document.createElement('div'); el.className = 'bn-layer'; el.id = id; el.dataset.k = k; el.style.zIndex = z; return el; };

  // the layers, back to front (z), with their depth (k)
  const L = {
    hillFar: layer('bnHillFar', .1, 1), hillNear: layer('bnHillNear', .2, 2), trees: layer('bnTrees', .38, 3),
    trunk: layer('bnTrunk', 1, 4), roots: layer('bnRoots', 1, 5), shafts: layer('bnShafts', .7, 6), canopy: layer('bnCanopy', 1, 7),
    ground: layer('bnGround', 1, 8), under: layer('bnUnder', 1, 9), herbs: layer('bnHerbs', 1.12, 10)
  };
  const content = $('bnContent');            // the words and the products: in the page (HTML), moving with the tree
  const curtain = layer('bnCurtain', 1.3, 14), front = layer('bnFront', 1.9, 15);
  const threadCv = document.createElement('canvas'), dustCv = document.createElement('canvas');
  threadCv.className = 'bn-canvas'; threadCv.style.zIndex = 11; dustCv.className = 'bn-canvas'; dustCv.style.zIndex = 16;
  stage.append(...Object.values(L), threadCv, curtain, front, dustCv);
  content.style.zIndex = 12;
  const moving = [...Object.values(L), content, curtain, front];
  if (reduce) moving.forEach(el => { if (+el.dataset.k > .5 || el === content) el.dataset.k = 1; });
  const tctx = threadCv.getContext('2d'), dctx = dustCv.getContext('2d');

  let G = null, lines = [], dpr = 1, chapters = [];
  const place = k => Y => (Y - G.H / 2) * k + G.H / 2;
  const put = (el, y) => { el.style.top = `${y.toFixed(1)}px`; };

  // ---------- build everything for this screen size ----------
  function build(){
    const W = innerWidth, H = innerHeight;
    G = A.geometry(W, H);
    const reach = k => H * (1 + (G.world / H - 1) * k) + H;      // how tall a layer must be to cover the whole journey
    L.hillFar.innerHTML = A.hills(W, H, H * .6, H * .035, A.PAL.hillFar, 3, reach(.1));
    L.hillNear.innerHTML = A.hills(W, H, H * .69, H * .05, A.PAL.hillNear, 5, reach(.2));
    L.trees.innerHTML = A.treeline(W, H, H * .78, 7, reach(.38));
    L.trunk.innerHTML = A.trunk(G); put(L.trunk, G.trunkTop - 4);
    L.roots.innerHTML = A.aerialRoots(G); put(L.roots, G.canopyBase - H * .2);
    L.canopy.innerHTML = `<div class="bn-intro">${A.canopy(G)}</div>`; put(L.canopy, G.canopyTop - H * .12);
    L.ground.innerHTML = A.groundPlate(G); put(L.ground, G.ground - H * .14);
    L.under.innerHTML = A.underground(G); put(L.under, G.ground + H * .04);
    curtain.innerHTML = A.curtain(G, place(1.3), reach(1.3)); put(curtain, 0);
    buildShafts(); buildFront(); buildHerbs(); layout();
    lines = A.threads(G);
    lines.forEach(ln => { ln.maxY = Math.max(...ln.pts.map(p => p[1])); });
    space.style.height = `${G.world.toFixed(0)}px`;
    dpr = Math.min(devicePixelRatio || 1, 2);
    for (const c of [threadCv, dustCv]){ c.width = W * dpr; c.height = H * dpr; }
    chapters = [
      { id: 'dawn', y: 0 }, { id: 'canopy', y: H * .8 }, { id: 'wisdom', y: H * 1.75 },
      { id: 'science', y: G.h0 - H * .45 }, { id: 'roots', y: G.ground - H * 1.05 }, { id: 'earth', y: G.ground + H * .1 }
    ];
    last = -1;
  }

  // light falling through the canopy from the upper left
  function buildShafts(){
    const p = place(.7), R = seeded(71); let h = '';
    for (let i = 0; i < 5; i++){
      const x = G.W * (.08 + i * .2 + R() * .08), y = p(G.canopyBase - G.H * .1), w = 50 + R() * 110;
      h += `<i style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;width:${w.toFixed(0)}px;height:${(G.H * 1.7).toFixed(0)}px;opacity:${(.35 + R() * .4).toFixed(2)}"></i>`;
    }
    L.shafts.innerHTML = h;
  }
  // the nearest leaves: big, soft, rushing past as the camera sinks through the canopy
  function buildFront(){
    const p = place(1.9), R = seeded(83), { W, H } = G; let h = '';
    const leafEl = (x, Y, s, rot, blur, tone) => {
      const fill = A.PAL.leafMid[tone % 3], sz = s * 2.7;
      return `<span class="bn-leaf" style="left:${(x - sz / 2).toFixed(0)}px;top:${(p(Y) - sz / 2).toFixed(0)}px;width:${sz.toFixed(0)}px;height:${sz.toFixed(0)}px;--b:${blur.toFixed(1)}px;--d:${(5 + R() * 5).toFixed(1)}s;--r:${(R() * 6 - 3).toFixed(1)}deg">` +
        `<svg viewBox="-1.35 -1.35 2.7 2.7" aria-hidden="true">${A.leaf(0, 0, 1, rot, fill, 'rgba(240, 246, 222, .5)', .035)}</svg></span>`;
    };
    // framing the opening shot
    h += leafEl(-W * .02, H * .08, Math.min(W, H) * .2, 140, 3, 0) + leafEl(W * .04, H * .22, Math.min(W, H) * .12, 110, 2, 1);
    h += leafEl(W * 1.01, H * .12, Math.min(W, H) * .18, -150, 3, 2) + leafEl(W * .95, H * .3, Math.min(W, H) * .1, -120, 1.5, 0);
    // the pass through the canopy, at the screen's edges, clear of the words in the middle
    for (let i = 0; i < (G.phone ? 10 : 18); i++){
      // low in the canopy the Ayurveda card sits on the left: the leaves keep to the right there
      const Y = H * (.95 + R() * 1.1), x = R() < .5 && Y < H * 1.55 ? W * (R() * .2 - .04) : W * (1.04 - R() * .2);
      h += leafEl(x, Y, Math.min(W, H) * (.08 + R() * .14), R() * 360, 2 + R() * 5, i);
    }
    front.innerHTML = h; put(front, 0);
  }
  // Ayurveda on the trunk: real ingredient cut-outs, a little nearer than the bark
  function buildHerbs(){
    const p = place(1.12), { W, H, cx, tw, phone } = G;
    const spots = phone
      ? [[.19, 2.22], [.81, 2.38], [.18, 2.56], [.82, 2.72], [.19, 2.9], [.81, 3.04]]
      : [[cx / W + tw / W / 2 + .1, 1.92], [cx / W + tw / W / 2 + .18, 2.2], [cx / W + tw / W / 2 + .08, 2.46], [cx / W - tw / W / 2 - .09, 2.5], [cx / W + tw / W / 2 + .17, 2.74], [cx / W - tw / W / 2 - .17, 2.8]];
    const size = phone ? Math.min(88, W * .22) : clamp(W * .1, 110, 170);
    L.herbs.innerHTML = HERBS.map((h, i) => {
      const [x, Y] = spots[i];
      return `<figure class="bn-herb" style="left:${(x * W - size / 2).toFixed(0)}px;top:${(p(H * Y) - size / 2).toFixed(0)}px;width:${size.toFixed(0)}px" data-y="${(H * Y).toFixed(0)}">` +
        `<img src="/assets/ingredients/cutout/${h.id}.webp" alt="" width="${size.toFixed(0)}" height="${size.toFixed(0)}" loading="lazy" decoding="async">` +
        `<figcaption><b>${h.name}</b><i>${h.latin}</i></figcaption></figure>`;
    }).join('');
  }
  // the words and the products, placed on the tree
  function layout(){
    const { H, ground, h0, h1, phone, canopyTop } = G;
    const at = (id, y) => { const el = $(id); if (el){ el.style.top = `${y.toFixed(0)}px`; el.dataset.y = y.toFixed(0); } };
    at('bnHero', canopyTop * .52);
    at('bnCue', H * .9);
    at('bnOne', H * 1.28);
    at('bnWisdom', H * (phone ? 1.95 : 2.05));
    at('bnScience', phone ? h0 - H * .36 : (h0 + h1) / 2);
    at('bnSix', ground - H * (phone ? .78 : .42));
    at('bnEarth', ground + H * .82);
    at('bnFoot', G.world - H * .42);
    const spots = A.productSpots(G), list = $('bnProducts');
    list.style.top = '0px';
    [...list.children].forEach((li, i) => {
      const s = spots[i];
      li.style.left = `${(s.x - s.r).toFixed(0)}px`; li.style.top = `${(s.y - s.r).toFixed(0)}px`; li.style.width = `${(s.r * 2).toFixed(0)}px`;
      li.dataset.y = s.y.toFixed(0);
    });
  }

  // the products
  $('bnProducts').innerHTML = products.map(p => `<li><a href="product-details.html?id=${p.id}"><span class="bn-pod"><img src="${p.img}" alt="" loading="lazy" decoding="async"></span><b>${p.name}</b></a></li>`).join('');

  // ---------- drifting pollen and falling leaves ----------
  const R = seeded(97), leafPath = new Path2D(A.LEAF);
  const pollen = Array.from({ length: innerWidth < 700 ? 26 : 46 }, () => ({ x: R(), y: R(), r: 1 + R() * 2.6, v: .008 + R() * .02, ph: R() * 6 }));
  const falling = Array.from({ length: innerWidth < 700 ? 5 : 9 }, () => ({ x: R(), y: R(), s: 7 + R() * 9, v: .03 + R() * .04, rot: R() * 6, vr: (R() - .5) * 1.6, ph: R() * 6 }));
  function drawDust(dt, time, cam){
    const { W, H } = G; dctx.setTransform(dpr, 0, 0, dpr, 0, 0); dctx.clearRect(0, 0, W, H);
    const under = cam > G.ground - H * .4;                 // below ground: no falling leaves, the pollen becomes motes of light
    for (const p of pollen){
      p.y -= p.v * dt; if (p.y < -.02){ p.y = 1.02; p.x = R(); }
      const x = (p.x + Math.sin(time * .3 + p.ph) * .01) * W, y = p.y * H;
      dctx.globalAlpha = (.35 + .35 * Math.sin(time * 1.4 + p.ph)) * (under ? .9 : .7);
      dctx.fillStyle = under ? '#e2b25a' : '#f2d796';
      dctx.beginPath(); dctx.arc(x, y, p.r, 0, 6.283); dctx.fill();
    }
    const leafy = cam > G.H * .5 && cam < G.ground - H * .6;
    for (const l of falling){
      l.y += l.v * dt; l.rot += l.vr * dt;
      if (l.y > 1.05){ l.y = -.05; l.x = R(); }
      if (!leafy) continue;
      const x = (l.x + Math.sin(time * .8 + l.ph) * .04) * W, y = l.y * H;
      dctx.globalAlpha = .85; dctx.fillStyle = A.PAL.leafMid[Math.floor(l.ph) % 3];
      dctx.save(); dctx.translate(x, y); dctx.rotate(l.rot); dctx.scale(l.s, l.s * (.6 + .4 * Math.abs(Math.sin(time * 1.6 + l.ph)))); dctx.fill(leafPath); dctx.restore();
    }
    dctx.globalAlpha = 1;
  }

  // ---------- the golden thread, drawn as far as the visitor has come ----------
  function drawThreads(cam, ox){
    const { W, H } = G; tctx.setTransform(dpr, 0, 0, dpr, 0, 0); tctx.clearRect(0, 0, W, H);
    const reveal = cam + H * .74, top = cam - 40;
    tctx.lineCap = 'round'; tctx.lineJoin = 'round';
    for (const ln of lines){
      const pts = ln.pts;
      if (pts[0][1] > reveal || ln.maxY < top) continue;     // not reached yet, or long passed
      tctx.beginPath();
      for (let i = 0; i < pts.length; i++){
        const [x, y] = pts[i];
        if (y > reveal){                                      // the growing tip
          const [px, py] = pts[i - 1], k = (reveal - py) / ((y - py) || 1);
          tctx.lineTo(lerp(px, x, k) + ox, reveal - cam);
          break;
        }
        i ? tctx.lineTo(x + ox, y - cam) : tctx.moveTo(x + ox, y - cam);
      }
      if (!ln.soft){ tctx.strokeStyle = A.PAL.goldSoft; tctx.lineWidth = ln.w * 5; tctx.stroke(); }
      tctx.strokeStyle = ln.soft ? 'rgba(214, 161, 68, .55)' : A.PAL.gold; tctx.lineWidth = ln.w; tctx.stroke();
    }
  }

  // ---------- the frame loop ----------
  const lenis = reduce ? null : new Lenis({ lerp: .085, smoothWheel: true });
  let mx = 0, tmx = 0, last = -1, lastOx = 0, prev = 0, clock = 0;
  if (!reduce) window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') tmx = e.clientX / innerWidth * 2 - 1; }, { passive: true });
  const blocks = () => [...content.querySelectorAll('[data-y]'), ...L.herbs.querySelectorAll('[data-y]')];
  let watch = [];
  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (prev || now)) / 1000); prev = now; clock += dt;
    if (lenis) lenis.raf(now);
    const cam = window.scrollY;
    mx += (tmx - mx) * .05;
    const ox = -mx * 10, moved = cam !== last || Math.abs(ox - lastOx) > .05;
    if (moved){
      for (const el of moving){ const k = +el.dataset.k; el.style.transform = `translate3d(${(ox * k).toFixed(2)}px, ${(-cam * k).toFixed(1)}px, 0)`; }
      drawThreads(cam, ox);
      // the words arrive as they come into view
      for (let i = watch.length - 1; i >= 0; i--){ const el = watch[i]; if (+el.dataset.y < cam + G.H * .86){ el.classList.add('in'); watch.splice(i, 1); } }
      // where we are: the rail, the sky, the nav
      let cur = chapters[0].id; for (const c of chapters) if (cam + G.H * .5 >= c.y) cur = c.id;
      if (rail && rail.dataset.cur !== cur){ rail.dataset.cur = cur; rail.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.dataset.ch === cur)); }
      stage.style.setProperty('--sky', clamp(cam / (G.ground - G.H), 0, 1).toFixed(3));
      nav && nav.classList.toggle('scrolled', cam > 30);
      last = cam; lastOx = ox;
    }
    if (!reduce) drawDust(dt, clock, cam);
  }

  // the rail: jump to a chapter
  rail && rail.addEventListener('click', e => {
    const a = e.target.closest('a[data-ch]'); if (!a) return; e.preventDefault();
    const c = chapters.find(x => x.id === a.dataset.ch); if (!c) return;
    const y = Math.max(0, c.y - (c.id === 'dawn' ? 0 : G.H * .15));
    lenis ? lenis.scrollTo(y, { duration: 2.2 }) : window.scrollTo(0, y);
  });

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const r = window.scrollY / Math.max(1, G.world - G.H);
      build(); watch = blocks().filter(el => !el.classList.contains('in'));
      window.scrollTo(0, r * (G.world - G.H));
    }, 160);
  });
  build();
  watch = blocks();
  requestAnimationFrame(frame);
  requestAnimationFrame(() => document.body.classList.add('bn-ready'));
  return { lenis };
}
