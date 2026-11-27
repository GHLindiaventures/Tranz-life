// Hero product: the TranzLife Lung Booster Gummies tub, cut out of the client's pack photo (features/products/
// product-images.js, CUTS.gummies). It stands in the white arc on the first screen, sways gently and leans towards
// the mouse; then, as you scroll, it flies down the page in a zig-zag (leaning into every turn):
//   1. straight down out of the hero, then curving in from the top centre to the left and down,
//   2. onto the Lung Booster card in "You deserve the best": the card's photo slot is empty, and the tub arrives and fills
//      it, rides along with the card, then drops out below it and carries on down towards the product story,
//   3. it hands over to the product story's own first tub when that tub comes up into the bottom of the screen; the
//      story's tub is the one that comes forward and lines up with the other products,
//   4. when the story lets go, the tub lifts out of the lineup, travels down the left side and fills the empty photo slot of
//      Lung Booster in "See the difference", and stays there.
// (state.heroFlight.landed is true while the story's own tub is the one on show: features/product-story hides it otherwise.)
// The flight is driven by the scroll position through GSAP's ticker. It runs on the desktop layout (wider than 980px in
// landscape, which includes tablets in landscape) with motion allowed. On phones, tablets in portrait and with reduced
// motion the tub just stays in the hero: it tips over and settles above the ribbon as you scroll.
// (The old 3D jar model in features/products/jar-layer.js carried the previous label, so the hero uses the photo.)
import { PRODUCTS } from '../../data/products.js';
import { CUTS } from '../products/product-images.js';
import { state } from '../../app/state.js';
import { gsap, ScrollTrigger } from '../../lib/gsap.js';
import { $ } from '../../utils/dom.js';
import { clamp, lerp, smooth } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

// a smooth curve through values vs at positions us (cubic Hermite, flat at both ends so the tub leaves and lands gently)
function curve(us, vs){
  const n = us.length, m = vs.map((_, k) => k === 0 || k === n - 1 ? 0 : (vs[k + 1] - vs[k - 1]) / (us[k + 1] - us[k - 1]));
  return u => {
    u = clamp(u, us[0], us[n - 1]);
    let k = 0; while (k < n - 2 && u > us[k + 1]) k++;
    const d = us[k + 1] - us[k], t = (u - us[k]) / d, t2 = t * t, t3 = t2 * t;
    return (2*t3 - 3*t2 + 1) * vs[k] + (t3 - 2*t2 + t) * d * m[k] + (-2*t3 + 3*t2) * vs[k + 1] + (t3 - t2) * d * m[k + 1];
  };
}

function initHeroJar(){
  const box = $('#heroProd'), stage = $('#home'), arc = $('.st-arc'), seq = $('#seq');
  if (!box || !stage) return null;
  const p = PRODUCTS.find(x => x.id === 'gummies') || PRODUCTS[0];
  box.innerHTML = `<img class="hp-photo" src="${CUTS[p.id]}" alt="${p.name}" decoding="async" fetchpriority="high">`;
  const img = $('.hp-photo', box);
  const G = { cx:0, y:0, h:100, lift:0 };   // lift: how far the tub is held above the ribbon on the first screen
  const mouse = { x:0, y:0 }, lean = { x:0, y:0 };
  let ribbonTop = null;   // the ribbon's top edge under the product, from features/hero/curve-band.js

  // ---- the flight layer: a fixed layer over the page that carries the tub while it travels ----
  const hf = state.heroFlight = { active:false, landed:false };
  let layer = null, shadow = null, path = null, cur = 0, last = performance.now();
  // the route is planned around the desktop layout, so phones and tablets in portrait keep the tub in the hero. This is
  // the opposite of styles/responsive.css's stacked layout: (max-width:980px), (orientation:portrait) and (max-width:1366px)
  const wide = matchMedia('(min-width: 981px) and (orientation: landscape), (min-width: 1367px)');
  const canFly = () => !reduce && !!arc && !!seq && wide.matches;
  function setFlight(on){
    if (on === hf.active) return;
    hf.active = on; hf.landed = false;
    document.documentElement.classList.toggle('flight-on', on);   // empties the Lung Booster photo slots the tub will fill
    if (on){
      if (!layer){ layer = document.createElement('div'); layer.id = 'flight'; layer.setAttribute('aria-hidden', 'true'); document.body.appendChild(layer); shadow = document.createElement('i'); shadow.className = 'flight-shadow'; layer.appendChild(shadow); }
      layer.appendChild(img); layer.style.visibility = 'visible';
      cur = scrollY;
    } else {
      box.appendChild(img); if (layer) layer.style.visibility = 'hidden';
      img.style.filter = ''; img.style.left = img.style.top = '';
    }
  }

  // the routes, in screen pixels, by scroll position s.
  // A (hero -> story): straight down out of the arc, in from the top centre to the left, down, across to the Lung
  //   Booster card in "You deserve the best" (docked on it around sDock), then below the card and in towards the
  //   product story's first tub, which it meets at sHand, when that tub is just coming up into the screen.
  // B (story -> benefits): from sLift, where the story's lineup is complete and lets go, the tub leaves the lineup,
  //   comes down the left side and docks on the Lung Booster photo slot in "See the difference" (from sDockB on).
  let slotA = null, slotB = null, itemB = null, stops = [];
  function plan(W, Hv){
    const ar = (img.naturalWidth || 814) / (img.naturalHeight || 1200);
    const hEnd = Math.min(Hv * .5, W * .27 / ar), kEnd = hEnd / G.h;
    const sr = seq.getBoundingClientRect(), B = sr.top + scrollY;
    const sHand = Math.max(B - Hv * .45, Hv * 1.5), yHand = B + Hv * .52 - sHand;
    slotA = $('#insider .in-card:nth-child(2)');
    let sDock = 0;
    if (slotA){ const r = slotA.getBoundingClientRect(); sDock = r.top + r.height / 2 + scrollY - Hv * .47; }
    let ss, xs, ys, ks; stops = [];
    if (slotA && sDock > Hv * 1.7 && sDock + Hv * .3 < sHand - Hv * .1){
      // straight down the page centre, through the headline, then slide across to fill the Lung Booster card
      ss = [0, Hv * .4, sDock - Hv * .7, sDock - Hv * .25, sDock, sDock + Hv * .3, sHand];
      xs = [G.cx, W * .5, W * .5, W * .5, W * .3, W * .3, W * .575];
      ys = [G.y - G.lift, Hv * .32, Hv * .5, Hv * .5, Hv * .5, Hv * .72, yHand];
      ks = [1, Hv * .34 / G.h, Hv * .32 / G.h, Hv * .3 / G.h, Hv * .32 / G.h, Hv * .34 / G.h, kEnd];
      stops = [];
    } else {   // no card to dock on: just weave to the story
      ss = [0, sHand * .2, sHand * .4, sHand * .6, sHand * .8, sHand];
      xs = [G.cx, G.cx, W * .22, W * .12, W * .3, W * .575];
      ys = [G.y - G.lift, Hv * .33, Hv * .5, Hv * .55, Hv * .6, yHand];
      ks = [1, Hv * .34 / G.h, Hv * .3 / G.h, Hv * .3 / G.h, Hv * .35 / G.h, kEnd];
      slotA = null;
    }
    const A = { x:curve(ss, xs), y:curve(ss, ys), s:curve(ss, ks) };
    // B: where the story's lineup puts its active product, and the benefits photo slot
    const sLift = sr.bottom + scrollY - Hv;
    const activeIdx = state.benefitIdx || 0;
    const mobile = W < 760 || W / Hv < .9;   // the same test as features/product-story's lineup
    const gap = Math.min(W * (mobile ? .19 : .16), mobile ? 120 : 270);
    const col = mobile ? (activeIdx < 3 ? activeIdx - 1 : (activeIdx - 3) - .5) : activeIdx - 2;
    const x2 = W * .5 + col * (mobile ? W * .3 : gap);
    const y2 = Hv * .67, k2 = Math.min(Hv * .31, (mobile ? W * .28 : gap * .92) / ar) / G.h;
    itemB = $('#benStage .bi.on') || $('#benStage .bi:first-child');
    slotB = itemB && $('.bi-img', itemB);
    let Bp = null, sDockB = 0;
    if (slotB){
      const r = slotB.getBoundingClientRect(); sDockB = r.top + r.height / 2 + scrollY - Hv * .55;
      if (sDockB > sLift + Hv * .6){
        const cx = r.left + r.width / 2, kDock = Math.max(r.width, r.height) * .86 / G.h, d = sDockB - sLift;
        const bs = [sLift, sLift + d * .45, sDockB - Hv * .3, sDockB];
        const mx1 = lerp(x2, cx, 0.35), mx2 = lerp(x2, cx, 0.7);
        Bp = { x:curve(bs, [x2, mx1, mx2, cx]), y:curve(bs, [y2, Hv * .5, Hv * .68, Hv * .55]), s:curve(bs, [k2, Hv * .26 / G.h, Hv * .28 / G.h, kDock]) };
      }
    }
    path = { A, B:Bp, W, Hv, sHand, sLift, sDockB, curIdx: activeIdx };
  }

  function layout(){
    // the stacked layout gives the tub its own space below the headline (.stage-space); the wide one stands it in the arc
    const W = stage.clientWidth, H = stage.clientHeight, mobile = !wide.matches, sp = $('.stage-space');
    let cx, y, h, lift = 0;
    if (mobile || !arc){
      cx = W*.5;
      const cy = sp ? sp.offsetTop + sp.offsetHeight*.48 : H*.66;
      h = sp ? Math.min(sp.offsetHeight*.8, H*.5, W*.9/.68) : H*.5;
      y = Math.min(cy, H - h/2 - 36);
    } else {
      // centred on the white arc, its base just above the ribbon
      const sr = stage.getBoundingClientRect(), ar = arc.getBoundingClientRect(), r = ar.width / 2;
      cx = ar.left + r - sr.left;
      h = r * 1.25;   // taller than the arc is wide: the tub stands up out of the top of it
      const base = ribbonTop ?? (ar.top - sr.top + r * .9);
      y = base - 8 - h / 2;
      // the band sits below the first screen, so on the first screen the tub is held up clear of the bottom edge
      lift = Math.max(0, base - 8 - innerHeight * .9);
    }
    Object.assign(G, { cx, y, h, lift });
    setFlight(canFly());
    img.style.height = h.toFixed(0) + 'px';
    if (hf.active){
      img.style.left = img.style.top = '0px';
      plan(W, innerHeight);
    } else {
      img.style.left = cx.toFixed(0) + 'px';
      img.style.top = y.toFixed(0) + 'px';
      box.style.transformOrigin = `${cx.toFixed(0)}px ${y.toFixed(0)}px`;
    }
    render();
  }

  // where the tub sits on a photo slot: the same place, size and tilt as the product's own photo would show it. The
  // photos are the square shot (the tub 86% of the height, a hair below the centre) cropped to the slot.
  function onSlot(el, inset){
    const r = el.getBoundingClientRect();
    const m = new DOMMatrix(getComputedStyle(el).transform), th = Math.atan2(m.b, m.a);
    const boxH = inset ? (el.offsetHeight - inset) * Math.hypot(m.a, m.b) : Math.max(r.width, r.height), off = boxH * .0104;
    const cy = r.top + r.height / 2;
    return { cy, x:r.left + r.width / 2 - Math.sin(th) * off, y:cy + Math.cos(th) * off, k:boxH * .86 / G.h, rot:th * 180 / Math.PI };
  }

  // while it flies: place the tub for the (smoothed) scroll position
  function flightRender(){
    const now = performance.now(), dt = Math.min(.1, (now - last) / 1000); last = now;
    cur += (scrollY - cur) * (1 - Math.exp(-dt * 12)); if (Math.abs(scrollY - cur) < .05) cur = scrollY;
    const activeIdx = state.benefitIdx || 0;
    if (!path || path.W !== stage.clientWidth || path.Hv !== innerHeight || path.curIdx !== activeIdx) plan(stage.clientWidth, innerHeight);
    const Hv = path.Hv, sc = cur, t = now / 1000;
    // the story's own copy of the tub is the one on show between the two flights
    const story = sc >= path.sHand - 1 && (!path.B || sc < path.sLift);
    hf.landed = story;
    if (story){ layer.style.visibility = 'hidden'; return; }
    layer.style.visibility = 'visible';
    const P = sc < path.sHand ? path.A : path.B;
    if (!P){ layer.style.visibility = 'hidden'; return; }
    lean.x += (mouse.x - lean.x) * .06; lean.y += (mouse.y - lean.y) * .06;
    const home = 1 - smooth(0, Hv * .25, sc);                           // the hero's own sway fades out once it sets off
    const e = 4, dx = (P.x(sc + e) - P.x(sc - e)) / (2 * e);            // sideways speed per px scrolled: lean into every turn
    let x = P.x(sc) + home * lean.x * G.h * .04;
    let y = P.y(sc) + home * (Math.sin(t * .8) * G.h * .012 + lean.y * G.h * .03);
    let k = P.s(sc);
    let rot = clamp(dx * Hv / path.W * 12.6, -14, 14) + home * (Math.sin(t * .55) * 2.2 + lean.x * 6);
    let op = 1;
    if (P === path.A){
      hf.flyingIdx = 0;
      if (img.dataset.curProd !== 'gummies'){
        img.src = CUTS.gummies;
        img.dataset.curProd = 'gummies';
      }
      if (sc < path.sHand * 0.4 && state.benefitIdx !== 0){
        state.benefitIdx = 0;
      }
      // fill the empty Lung Booster card in "You deserve the best" as it comes by, and let go as it scrolls away
      if (slotA){
        const d = onSlot(slotA, 18), w = 1 - smooth(.1, .42, Math.abs(d.cy - Hv * .47) / Hv);
        if (w > 0){ x = lerp(x, d.x, w); y = lerp(y, d.y, w); k = lerp(k, d.k, w); rot = lerp(rot, d.rot, w); }
      }
      rot += -1.06 * smooth(path.sHand - Hv * .3, path.sHand, sc);       // meets the story's tilt
      const q = smooth(path.sHand - Hv * .5, path.sHand, sc);            // the shadow settles into the story's
      img.style.filter = `drop-shadow(0 ${lerp(30, 24, q).toFixed(1)}px ${lerp(26, 22, q).toFixed(1)}px rgba(${lerp(20, 31, q) | 0},${lerp(52, 70, q) | 0},${lerp(24, 35, q) | 0},${lerp(.32, .22, q).toFixed(3)}))`;
    } else {
      // Route B: between story lineup and benefits slot
      hf.flyingIdx = activeIdx;
      const activeProd = PRODUCTS[activeIdx] || PRODUCTS[0];
      if (img.dataset.curProd !== activeProd.id){
        img.src = CUTS[activeProd.id];
        img.dataset.curProd = activeProd.id;
      }

      const docked = sc >= path.sDockB;
      document.documentElement.classList.toggle('ben-docked', docked);
      document.documentElement.classList.toggle('flight-in-air', !docked && sc >= path.sLift);

      if (docked){
        // While docked in Benefits, the card slot itself renders the active product.
        // Hiding #flight completely prevents any ghosting or overlap!
        layer.style.visibility = 'hidden';
        return;
      }

      // In air between story lineup and benefits:
      layer.style.visibility = 'visible';
      if (!slotB){
        itemB = $('#benStage .bi.on') || $('#benStage .bi:first-child');
        slotB = itemB && $('.bi-img', itemB);
      }
      const w = 1 - smooth(.1, .42, Math.abs(onSlot(slotB).cy - Hv * .55) / Hv);
      const d = onSlot(slotB);
      x = lerp(x, d.x, w); y = lerp(y, d.y, w); k = lerp(k, d.k, w); rot = lerp(rot, d.rot, w);
      op = 1;
      img.style.filter = 'drop-shadow(0 24px 22px rgba(31,70,35,.22))';
    }
    layer.style.opacity = op.toFixed(3);
    // the ground shadow: strongest while it rests at a marked stop, gone while docked or in flight between
    let sh = 0;
    if (P === path.A) for (const s0 of stops) sh = Math.max(sh, 1 - smooth(0, Hv * .12, Math.abs(sc - s0)));
    if (shadow){
      const th = G.h * k, tw = th * (img.naturalWidth || 814) / (img.naturalHeight || 1200), r = rot * Math.PI / 180;
      shadow.style.opacity = sh.toFixed(3);
      shadow.style.width = (tw * 1.05).toFixed(0) + 'px'; shadow.style.height = (th * .12).toFixed(0) + 'px';
      shadow.style.transform = `translate3d(${(x - Math.sin(r) * th * .5).toFixed(1)}px, ${(y + Math.cos(r) * th * .5 + th * .02).toFixed(1)}px, 0) translate(-50%, -50%)`;
    }
    img.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${k.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`;
  }

  function render(){
    if (hf.active) return flightRender();
    const t = performance.now() / 1000, live = !reduce;
    lean.x += (mouse.x - lean.x) * .06; lean.y += (mouse.y - lean.y) * .06;
    const rot = (live ? Math.sin(t * .55) * 2.2 : 0) + lean.x * 6;            // sways about 2° each way, leans to the mouse
    const bob = (live ? Math.sin(t * .8) * G.h * .012 : 0) + lean.y * G.h * .03;
    const dx = lean.x * G.h * .04;
    img.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${bob.toFixed(1)}px)) rotate(${rot.toFixed(2)}deg)`;
  }

  addEventListener('resize', layout);
  addEventListener('tl:bandfit', e => { ribbonTop = e.detail.topAtArc; layout(); });
  img.addEventListener('load', layout);
  layout();

  if (!reduce && matchMedia('(pointer:fine)').matches){
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) / r.width - .5; mouse.y = (e.clientY - r.top) / r.height - .5;
    });
    stage.addEventListener('pointerleave', () => { mouse.x = mouse.y = 0; });
  }

  // no flight (phones, reduced motion): over the first 60% of a screen the tub tips over and settles down onto the
  // ribbon as the band comes up
  if (!reduce && ScrollTrigger){
    gsap.fromTo(box, { y:() => -G.lift, rotation:0 }, { y:0, rotation:-20, ease:'none',
      scrollTrigger:{ trigger:stage, start:'top top', end:() => '+=' + innerHeight * .6, scrub:.9, invalidateOnRefresh:true } });
  }

  let running = false, started = false, seen = true;
  const play = () => { if (running || !started || reduce) return; running = true; gsap.ticker.add(render); };
  const pause = () => { if (!running) return; running = false; gsap.ticker.remove(render); };
  const sync = () => { if (hf.active || (seen && !document.hidden)) play(); else pause(); };   // the flight never stops: it follows the whole page
  gsap.set(img, { autoAlpha:0 });

  return {
    start(){
      if (started) return;
      started = true;
      gsap.to(img, { autoAlpha:1, duration:reduce ? 0 : 1.2, ease:'power2.out' });
      render(); play();
      // in the hero only: animate while it is on screen and the tab is visible
      if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { seen = e.isIntersecting; sync(); }).observe(stage);
      document.addEventListener('visibilitychange', sync);
      addEventListener('resize', sync);
    }
  };
}

export { initHeroJar };
