// Hero: 3D products standing on the sculpted stone plinth.
// Every few seconds the product spins out and the next one spins in.
import * as THREE from 'three';
import { PRODUCTS } from '../../data/products.js';
import { jarLayer } from '../products/jar-layer.js';
import { $ } from '../../utils/dom.js';
import { clamp, ease } from '../../utils/math.js';
import { reduce } from '../../utils/media.js';

// Stone slab image (layered-depth-slab-set.webp: main rock + side rocks, 1920x1080; the main rock is unchanged): the middle of its flat top face, as fractions of
// the image, and the product height as a fraction of the slab's on-screen width.
const SLAB = { topX: 0.5, topY: 22/1080, productW: 0.2 };
const PHOTO = { productH: 0.25 }; // fallback product height (fraction of stage height) when the slab is missing
const HOLD = 3.4; // seconds each product stays on the pedestal
const DROP_MS = 1150; // the opening: the first product falls onto the plinth and bounces
// bounce-out (ends at 1; first touch of the stone at 1/2.75 of the time)
const bounce = x => { const n = 7.5625, d = 2.75;
  if (x < 1/d) return n*x*x; if (x < 2/d) return n*(x -= 1.5/d)*x + .75; if (x < 2.5/d) return n*(x -= 2.25/d)*x + .9375; return n*(x -= 2.625/d)*x + .984375; };

function initHeroJar(){
  const canvas = $('#heroCanvas'), stage = $('#home'), photo = $('.st-photo');
  if (!canvas || !photo || typeof THREE === 'undefined') return null;
  const L = jarLayer(canvas), jars = PRODUCTS.map((q, i) => L.jar(q, i)), N = jars.length;
  let prog = 0, progT = 0, nextAt = 0, shown = 0; const wrap = d => d - N*Math.round(d/N), sm = x => x*x*(3 - 2*x);
  const mouse = { x:0, y:0, tx:0, ty:0 };
  window.addEventListener('pointermove', e => { mouse.tx = e.clientX/innerWidth - .5; mouse.ty = e.clientY/innerHeight - .5; });

  const phone = matchMedia('(max-width:980px)');
  const table = { x:0, y:0, ph:1 };
  let posX = .5, posY = .5;
  const layout = () => {
    L.resize();
    posX = .5; posY = .5;
    if (photo && photo.style) {
      photo.style.objectPosition = '50% 50%';
    }
  };
  // stand the product on the slab's top face, read from where the slab actually is on screen
  // (its size, scroll and parallax offsets included), so it always sits on the rock
  const slab = $('#slab');
  const measure = () => {
    const c = canvas.getBoundingClientRect();
    if (slab && slab.offsetWidth){
      const r = slab.getBoundingClientRect();
      table.x = r.left - c.left + SLAB.topX*r.width;
      table.y = r.top - c.top + SLAB.topY*r.height;
      table.ph = r.width*SLAB.productW*(phone.matches ? 1.45 : 1); // the rock is narrow on phones
    } else {
      const r = stage.getBoundingClientRect();
      table.x = r.left - c.left + r.width/2; table.y = r.top - c.top + r.height*.5; table.ph = r.height*PHOTO.productH;
    }
  };
  window.addEventListener('resize', layout); phone.addEventListener('change', layout); layout();
  const play = () => { if (photo && photo.paused) { const p = photo.play(); if (p && p.catch) p.catch(() => {}); } };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });

  // soft contact shadow where the product meets the stone plinth (CSS layer .st-shadow).
  // Moved with a transform on its own element (no layout, no style recalc for the rest of the hero), only when it changes.
  const shadow = $('.st-shadow'); let shadowKey = '';
  // two rings spreading over the stone where the product lands
  const ripple = $('.st-ripple');
  const rippleAt = (x, y, w) => {
    if (!ripple || !ripple.animate) return;
    const base = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + (w/100).toFixed(3) + ')';
    [0, 140].forEach(delay => ripple.animate(
      [{ transform: base + ' scale(.25)', opacity: .85 }, { transform: base + ' scale(2.6)', opacity: 0 }],
      { duration: 950, delay, easing: 'cubic-bezier(.2,.7,.3,1)' }));
  };
  let landed = false;
  const setShadow = (x, y, w) => {
    if (!shadow) return;
    const key = `${x.toFixed(1)},${y.toFixed(1)},${(w/100).toFixed(3)}`; if (key === shadowKey) return; shadowKey = key;
    shadow.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) scale(${(w/100).toFixed(3)})`;
  };

  let at = -1, tNow = 0, last = performance.now();
  let isHeld = false, isHidden = false;
  (function frame(now){
    requestAnimationFrame(frame);
    const r = stage.getBoundingClientRect(); if (r.bottom < 0) { last = now; return; }
    const dt = Math.min(.05, (now - last)/1000); last = now; tNow += dt;
    mouse.x += (mouse.tx - mouse.x)*.05; mouse.y += (mouse.ty - mouse.y)*.05;
    measure();
    // the drop: k runs 0..1 from the start; the product falls with a bounce while it stops spinning
    const k = at < 0 ? 0 : reduce ? 1 : clamp((now - at)/DROP_MS, 0, 1);
    const fall = bounce(k), e = ease.out(k);
    if (at >= 0 && now >= at){
      const ns = now/1000;
      if (!isHeld){
        if (!nextAt) nextAt = ns + HOLD;
        if (ns >= nextAt){ progT += 1; nextAt = ns + HOLD; }
      } else {
        nextAt = ns + HOLD;
      }
    }
    prog += (progT - prog)*(1 - Math.exp(-dt*3.2));
    const cur = ((Math.round(prog) % N) + N) % N; if (cur !== shown) shown = cur;
    const pxH = table.ph;
    // the outgoing product shrinks and spins away while the next one grows and spins in, both on the plinth
    let bigH = 0;
    jars.forEach((jar, i) => { const d = wrap(prog - i), w = sm(clamp(1 - Math.abs(d)*1.6, 0, 1)), on = w > 0.001 && !isHidden; jar.G.visible = on; if (!on) return;
      const jh = pxH*jar.fit*(.82 + .18*e)*w; if (jh > bigH) bigH = jh;
      L.size(jar, Math.max(1, jh));
      L.place(jar.G, table.x, table.y - jh/2 - (1 - fall)*(table.y + jh*1.2));
      jar.G.rotation.set(.04 + mouse.y*.08, -.35 + (1 - e)*-5 + Math.sin(tNow*.45)*.25 + mouse.x*.35 - d*3.2, -.02 + Math.sin(tNow*.6)*.015); });
    setShadow(table.x, table.y + 4, isHidden ? 0 : bigH*.58*fall);
    if (!landed && k >= 1/2.75 && at >= 0) { landed = true; if (!reduce && !isHidden) rippleAt(table.x, table.y + 4, bigH*.9); }
    L.renderer.render(L.scene, L.cam);
  })(performance.now());
  return {
    start(delay = 0){ if (at < 0) at = performance.now() + delay; play(); },
    current(){
      return {
        index: shown,
        product: PRODUCTS[shown],
        table: { ...table },
        canvas: canvas,
        rotY: jars[shown] ? jars[shown].G.rotation.y : 0,
        jarFit: jars[shown] ? jars[shown].fit : 1
      };
    },
    hold(freeze){
      isHeld = !!freeze;
      if (freeze && Math.abs(progT - prog) > 0.05) {
        prog = progT = Math.round(progT);
      }
    },
    setVisible(visible){
      isHidden = !visible;
      if (shadow) shadow.style.opacity = visible ? '1' : '0';
    }
  };
}

export { initHeroJar };
