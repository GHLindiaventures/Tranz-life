// Hero: 3D products standing on the sculpted stone plinth, with gummies orbiting in 3D depth space.
// Every few seconds the product spins out and the next one spins in.
import * as THREE from 'three';
import { PRODUCTS } from '../../data/products.js';
import { jarLayer } from '../products/jar-layer.js';
import { berryGeometry, gummyMaterial } from '../products/product-model.js';
import { $ } from '../../utils/dom.js';
import { clamp, ease, seeded } from '../../utils/math.js';

// Layered depth stone pedestal (1920x1080): center top of stone plinth
const PHOTO = { w: 1920, h: 1080, tableX: 0.5, tableY: 0.535, productH: 0.25 };
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
  const table = { x:0, y:0, dh:1 };
  let posX = .5, posY = .5;
  const layout = () => {
    L.resize();
    posX = .5; posY = .5;
    if (photo && photo.style) {
      photo.style.objectPosition = '50% 50%';
    }
  };
  const measure = () => {
    const c = canvas.getBoundingClientRect(), r = stage.getBoundingClientRect();
    const s = Math.max(r.width/PHOTO.w, r.height/PHOTO.h), dw = PHOTO.w*s, dh = PHOTO.h*s;
    const ox = (r.width - dw)*posX, oy = (r.height - dh)*posY;
    table.x = r.left - c.left + ox + PHOTO.tableX*dw;
    table.y = r.top - c.top + oy + PHOTO.tableY*dh;
    table.dh = dh;
    stage.style.setProperty('--tx', table.x.toFixed(0) + 'px');
    stage.style.setProperty('--ty', Math.max(90, table.y - dh*PHOTO.productH*1.12 - 56).toFixed(0) + 'px');
  };
  window.addEventListener('resize', layout); phone.addEventListener('change', layout); layout();
  const play = () => { if (photo && photo.paused) { const p = photo.play(); if (p && p.catch) p.catch(() => {}); } };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });

  // soft contact shadow where the product meets the stone plinth (CSS layer .st-shadow)
  const setVar = (k, v) => stage.style.setProperty(k, v.toFixed(1) + 'px');

  let at = -1, tNow = 0, last = performance.now();
  (function frame(now){
    requestAnimationFrame(frame);
    const r = stage.getBoundingClientRect(); if (r.bottom < 0) { last = now; return; }
    const dt = Math.min(.05, (now - last)/1000); last = now; tNow += dt;
    mouse.x += (mouse.tx - mouse.x)*.05; mouse.y += (mouse.ty - mouse.y)*.05;
    measure();
    const e = at < 0 ? 0 : ease.back(clamp((now - at)/1700, 0, 1));
    if (at >= 0){ const ns = now/1000; if (!nextAt) nextAt = ns + HOLD; if (ns >= nextAt){ progT += 1; nextAt = ns + HOLD; } }
    prog += (progT - prog)*(1 - Math.exp(-dt*3.2));
    const cur = ((Math.round(prog) % N) + N) % N; if (cur !== shown){ shown = cur; tint(PRODUCTS[cur]); }
    const pxH = table.dh*PHOTO.productH;
    // the outgoing product shrinks and spins away while the next one grows and spins in, both on the plinth
    let bigH = 0;
    jars.forEach((jar, i) => { const d = wrap(prog - i), w = sm(clamp(1 - Math.abs(d)*1.6, 0, 1)), on = w > 0.001; jar.G.visible = on; if (!on) return;
      const jh = pxH*jar.fit*(.6 + .4*e)*w; if (jh > bigH) bigH = jh;
      L.size(jar, Math.max(1, jh));
      L.place(jar.G, table.x + mouse.x*10, table.y - jh/2 + (1 - e)*L.H*.5);
      jar.G.rotation.set(.04 + mouse.y*.08, -.35 + (1 - e)*-5 + Math.sin(tNow*.45)*.25 + mouse.x*.35 - d*3.2, -.02 + Math.sin(tNow*.6)*.015); });
    setVar('--sh-x', table.x + mouse.x*10); setVar('--sh-y', table.y + 4); setVar('--sh-w', bigH*.58*e);
    const jar = jars[cur], u = pxH/L.ppu(), gw = sm(clamp(1 - Math.abs(wrap(prog - cur))*1.6, 0, 1));
    props.forEach((o, k) => { const a = o.a + tNow*o.sp, rr = o.r*u*.42*(1 + (1 - e)*.6);
      o.m.position.set(jar.G.position.x + Math.cos(a)*rr, jar.G.position.y + o.y*u*.45 + Math.sin(tNow + k)*u*.03, Math.sin(a)*rr*.6);
      o.m.scale.setScalar(o.s*u*(o.leaf ? .16 : .1)*e*gw); o.m.rotation.set(tNow*.4 + k, tNow*.3 + a, o.leaf ? .6 : k); });
    L.renderer.render(L.scene, L.cam);
  })(performance.now());
  return { start(){ if (at < 0) at = performance.now(); play(); } };
}

export { initHeroJar };
