// Hero: 3D products standing on the sculpted stone plinth, with gummies orbiting in 3D depth space.
// Every few seconds the product spins out and the next one spins in.
import * as THREE from 'three';
import { PRODUCTS } from '../../data/products.js';
import { jarLayer } from '../products/jar-layer.js';
import { berryGeometry, gummyMaterial } from '../products/product-model.js';
import { $ } from '../../utils/dom.js';
import { clamp, ease, seeded } from '../../utils/math.js';

// Stone slab image (layered-depth-slab-set.webp: main rock + side rocks, 1920x1080; the main rock is unchanged): the middle of its flat top face, as fractions of
// the image, and the product height as a fraction of the slab's on-screen width.
const SLAB = { topX: 0.5, topY: 22/1080, productW: 0.2 };
const PHOTO = { productH: 0.25 }; // fallback product height (fraction of stage height) when the slab is missing
const HOLD = 3.4; // seconds each product stays on the pedestal

function initHeroJar(){
  const canvas = $('#heroCanvas'), stage = $('#home'), photo = $('.st-photo');
  if (!canvas || !photo || typeof THREE === 'undefined') return null;
  const L = jarLayer(canvas), p = PRODUCTS[0], jars = PRODUCTS.map((q, i) => L.jar(q, i)), N = jars.length;
  const R = seeded(5), props = [];
  const gGeo = berryGeometry(.17, 1.4);
  for (let k = 0; k < 7; k++){ const mat = gummyMaterial(); mat.color.set(p.gummy[k % p.gummy.length]).convertSRGBToLinear(); const m = new THREE.Mesh(gGeo, mat); L.scene.add(m); props.push({ m, a:k*1.05 + R(), r:1.25 + R()*.45, y:(R() - .5)*1.1, s:.55 + R()*.5, sp:.25 + R()*.25 }); }
  let prog = 0, progT = 0, nextAt = 0, shown = 0; const wrap = d => d - N*Math.round(d/N), sm = x => x*x*(3 - 2*x);
  const tint = q => { const g = q.gummy || p.gummy; props.forEach((o, k) => o.m.material.color.set(g[k % g.length]).convertSRGBToLinear()); };
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
  let needsMeasure = true;
  const measure = () => {
    needsMeasure = false;
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
  const requestMeasure = () => { needsMeasure = true; };
  window.addEventListener('resize', () => { layout(); requestMeasure(); });
  window.addEventListener('scroll', requestMeasure, { passive: true });
  phone.addEventListener('change', () => { layout(); requestMeasure(); });
  layout();
  measure();
  const play = () => { if (photo && photo.paused) { const p = photo.play(); if (p && p.catch) p.catch(() => {}); } };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });

  // soft contact shadow where the product meets the stone plinth (CSS layer .st-shadow).
  // Moved with a transform on its own element (no layout, no style recalc for the rest of the hero), only when it changes.
  const shadow = $('.st-shadow'); let shadowKey = '';
  const setShadow = (x, y, w) => {
    if (!shadow) return;
    const key = `${x.toFixed(1)},${y.toFixed(1)},${(w/100).toFixed(3)}`; if (key === shadowKey) return; shadowKey = key;
    shadow.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) scale(${(w/100).toFixed(3)})`;
  };

  let at = -1, tNow = 0, last = performance.now();
  let isHeld = false, isHidden = false, isVisible = true, rafId = 0;

  function frame(now){
    if (!isVisible) { rafId = 0; return; }
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last)/1000); last = now; tNow += dt;
    mouse.x += (mouse.tx - mouse.x)*.05; mouse.y += (mouse.ty - mouse.y)*.05;
    if (needsMeasure) measure();
    const e = at < 0 ? 0 : ease.back(clamp((now - at)/1700, 0, 1));
    if (at >= 0){
      const ns = now/1000;
      if (!isHeld){
        if (!nextAt) nextAt = ns + HOLD;
        if (ns >= nextAt){ progT += 1; nextAt = ns + HOLD; }
      } else {
        nextAt = ns + HOLD;
      }
    }
    prog += (progT - prog)*(1 - Math.exp(-dt*3.2));
    const cur = ((Math.round(prog) % N) + N) % N; if (cur !== shown){ shown = cur; tint(PRODUCTS[cur]); }
    const pxH = table.ph;
    // the outgoing product shrinks and spins away while the next one grows and spins in, both on the plinth
    let bigH = 0;
    jars.forEach((jar, i) => { const d = wrap(prog - i), w = sm(clamp(1 - Math.abs(d)*1.6, 0, 1)), on = w > 0.001 && !isHidden; jar.G.visible = on; if (!on) return;
      const jh = pxH*jar.fit*(.6 + .4*e)*w; if (jh > bigH) bigH = jh;
      L.size(jar, Math.max(1, jh));
      L.place(jar.G, table.x, table.y - jh/2 + (1 - e)*L.H*.5);
      jar.G.rotation.set(.04 + mouse.y*.08, -.35 + (1 - e)*-5 + Math.sin(tNow*.45)*.25 + mouse.x*.35 - d*3.2, -.02 + Math.sin(tNow*.6)*.015); });
    setShadow(table.x, table.y + 4, isHidden ? 0 : bigH*.58*e);
    const jar = jars[cur], u = pxH/L.ppu(), gw = sm(clamp(1 - Math.abs(wrap(prog - cur))*1.6, 0, 1));
    props.forEach((o, k) => {
      o.m.visible = !isHidden;
      if (isHidden) return;
      const a = o.a + tNow*o.sp, rr = o.r*u*.42*(1 + (1 - e)*.6);
      o.m.position.set(jar.G.position.x + Math.cos(a)*rr, jar.G.position.y + o.y*u*.45 + Math.sin(tNow + k)*u*.03, Math.sin(a)*rr*.6);
      o.m.scale.setScalar(o.s*u*(o.leaf ? .16 : .1)*e*gw); o.m.rotation.set(tNow*.4 + k, tNow*.3 + a, o.leaf ? .6 : k); });
    L.renderer.render(L.scene, L.cam);
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !rafId) {
        last = performance.now();
        rafId = requestAnimationFrame(frame);
      }
    }, { rootMargin: '100px 0px' }).observe(stage);
  }

  rafId = requestAnimationFrame(frame);
  return {
    start(){ if (at < 0) at = performance.now(); play(); },
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
