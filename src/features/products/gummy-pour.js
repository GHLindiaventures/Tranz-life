// Lung Booster gummies: real gummies packed in the jar, and the ingredients moment (cap unscrews and lifts away, the bottle
// tilts to the bottom of the frame, the gummies pour out and float between the two, each ingredient called out on a gummy).
//
//   attachGummies(root)            adds an InstancedMesh of packets (src/assets/products/packet.glb, one shared geometry and
//                                  material) to the jar's model, packed at the bottom of the bottle. Cheap enough to stay
//                                  in every scene that shows the jar. Returns a controller (see below).
//   createIngredientsDirector(L)   drives the moment from ONE number, `open` (0 = closed, 1 = poured and floating), plus the
//                                  callout progress; scrolling back simply runs the numbers backwards. journey.js feeds it.
//
// Tuning (all in this file): GUMMY_COUNT, GS (gummy size, model units), PALETTE (colours), CALLOUTS (ingredient lines are
// taken from DETAILS.gummies.list in data/product-details.js, picked by index), TURNS (cap turns) and the open schedule in
// poseFor() / director.update().
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import packetUrl from '../../assets/products/packet.glb?url';
import packetLiteUrl from '../../assets/products/packet-lite.glb?url';   // 5k-triangle copy, used only while the jar is closed (62 full packets = millions of triangles per frame)
import { createPacketModel } from './gummy-packet.js';
import { DETAILS } from '../../products-page/data/product-details.js';

const GUMMY_COUNT = 62;                            // gummy packets in the jar
const POUR_COUNT = 26;                             // how many of them float out (the rest stay in the jar, so it still looks full)
const GS = 0.3;                                    // a packet's width in model units (the jar is ~1 unit wide); it is 0.57 as tall and 0.12 as thick
const PALETTE = ['#2f6b3a'];
const AXIS = { x: -0.0025, z: -0.0148 };          // the neck/cap axis of lungbooster.glb
const MOUTH_Y = 0.86, INSIDE_Y = 0.42;            // the open mouth, and a point inside the body the gummies funnel through
const CAP_Y = 0.8;                                // middle of the cap
const TURNS = 3;                                  // turns of the cap while it unscrews
const T0 = 0.3, SPAN = 0.25, DUR = 0.45, S1 = 0.38;   // pour schedule (in `open`): first gummy leaves at T0, the last one starts T0+SPAN, each takes DUR; S1 = share spent inside the jar
// the ingredient callouts: indices into DETAILS.gummies.list
const CALLOUTS = [0, 1, 2, 3, 4, 5, 7, 9];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = t => t * t * (3 - 2 * t);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// where the poured gummies float to, in a unit disc: a blue-noise scatter (best-candidate sampling), so it looks thrown, not arranged
const CLOUD = (() => {
  const R = rng(21), pts = [];
  for (let i = 0; i < POUR_COUNT; i++) {
    let best = null, bd = -1;
    for (let c = 0; c < 40; c++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()), p = { u: Math.cos(a) * d, v: Math.sin(a) * d };
      let md = 9; for (const q of pts) md = Math.min(md, Math.hypot(p.u - q.u, (p.v - q.v) * 1.25));
      if (md > bd) { bd = md; best = p; }
    }
    best.z = (R() - 0.5) * 2; best.r = Math.hypot(best.u, best.v); best.th = Math.atan2(best.v, best.u); pts.push(best);
  }
  return pts;
})();

// the packet (packet.glb: a wrapped gummy packet, flat, 1.9 x 1.08 x 0.23). Normalised to width 1 and turned to lie flat (its thickness
// along y), so an instance scale of GS gives the packet's width. Its own textured material is used as it is.
const geoPromises = new Map();
function loadGeo(url = packetUrl) {
  if (!geoPromises.has(url)) geoPromises.set(url, new Promise((res, rej) => new GLTFLoader().load(url, g => {
    let mesh = null; g.scene.traverse(n => { if (n.isMesh && !mesh) mesh = n; });
    if (!mesh) return rej(new Error('packet.glb has no mesh'));
    const geo = mesh.geometry.clone(); geo.computeBoundingBox();
    const bb = geo.boundingBox, k = 1 / (bb.max.x - bb.min.x);
    geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -(bb.max.z + bb.min.z) / 2); geo.scale(k, k, k); geo.rotateX(Math.PI / 2);
    geo.computeBoundingBox();
    const mat = mesh.material; mat.envMapIntensity = 0.55; mat.roughness = Math.max(0.35, mat.roughness != null ? mat.roughness : 0.5);
    res({ geo, mat, half: geo.boundingBox.max.clone() });
  }, undefined, rej)));
  return geoPromises.get(url);
}
// how far a packet reaches sideways from its centre when turned by q (its half-sizes are 0.5, 0.285 and 0.06 of its width)
const HALF = new THREE.Vector3(0.5, 0.06, 0.285);
function reachOf(q, size) {
  const m = new THREE.Matrix4().makeRotationFromQuaternion(q).elements;      // column-major
  const ex = (Math.abs(m[0]) * HALF.x + Math.abs(m[4]) * HALF.y + Math.abs(m[8]) * HALF.z) * size;
  const ez = (Math.abs(m[2]) * HALF.x + Math.abs(m[6]) * HALF.y + Math.abs(m[10]) * HALF.z) * size;
  return Math.hypot(ex, ez);
}
// the pile: packets dropped into the jar and let settle (a small simulation run once, deterministic), so it is a real, uneven heap.
// Collision is a sphere that is wide and squashed (packets are flat: they stack close vertically and need room sideways), and
// each packet's sideways reach, from its own turn, keeps it inside the glass.
const INNER = 0.475;                                                        // the jar's inside radius (the glass is ~0.5 wide)
function settlePile(n, quats, sizes) {
  const R = rng(11), VF = 2.3, floor = -0.835;
  const reach = quats.map((q, i) => reachOf(q, sizes[i]));
  const wallAt = (y, i) => INNER - reach[i] - 0.012 - 0.07 * clamp((-0.62 - y) / 0.2);   // the base curves in
  const pos = [], prev = [];
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 0.25;
    const p = new THREE.Vector3(AXIS.x + Math.cos(a) * d, -0.78 + (i / n) * 1.5 + R() * 0.08, AXIS.z + Math.sin(a) * d);
    pos.push(p); prev.push(p.clone());
  }
  const g = -0.0016, tmp = new THREE.Vector3(), diam = GS * 0.92;
  for (let it = 0; it < 560; it++) {
    for (let i = 0; i < n; i++) {                                    // verlet step with gravity and damping
      const p = pos[i], q = prev[i];
      tmp.copy(p).sub(q).multiplyScalar(0.985); q.copy(p); p.add(tmp); p.y += g;
    }
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {  // no two packets share space
        const a = pos[i], b = pos[j], dx = b.x - a.x, dy = (b.y - a.y) * VF, dz = b.z - a.z, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < diam * diam && d2 > 1e-9) {
          const d = Math.sqrt(d2), push = (diam - d) / d * 0.5;
          a.x -= dx * push; a.z -= dz * push; a.y -= dy * push / VF; b.x += dx * push; b.z += dz * push; b.y += dy * push / VF;
        }
      }
      for (let i = 0; i < n; i++) {                                  // the jar's wall and floor
        const p = pos[i], dx = p.x - AXIS.x, dz = p.z - AXIS.z, d = Math.hypot(dx, dz);
        const wall = Math.max(0.02, wallAt(p.y, i));
        if (d > wall) { p.x = AXIS.x + dx / d * wall; p.z = AXIS.z + dz / d * wall; }
        if (p.y < floor + sizes[i] * 0.06) p.y = floor + sizes[i] * 0.06;
      }
    }
  }
  return pos;
}

function attachGummies(root) {
  const ctl = { ready: false, mesh: null, n: GUMMY_COUNT, world: new Float32Array(GUMMY_COUNT * 3), colors: [], arrived: new Float32Array(GUMMY_COUNT), atRest: true };
  const push = new Float32Array(GUMMY_COUNT * 3);   // how far the pointer has pushed each floating gummy (eased)
  const R = rng(5);
  const restQ = [], ph = [], wy = [], order = [], size = [], axes = [], arcK = [], eu = new THREE.Euler();
  for (let i = 0; i < GUMMY_COUNT; i++) {
    // every packet lies at its own turn, leaning a good deal (as if poured in), up to ~57 degrees, so faces and edges both show
    restQ.push(new THREE.Quaternion().setFromEuler(eu.set((R() - 0.5) * 2.0, R() * Math.PI * 2, (R() - 0.5) * 2.0, 'YXZ')));
    ph.push(R() * Math.PI * 2); wy.push(0.5 + R());
    size.push(GS * (0.94 + R() * 0.12)); arcK.push(0.6 + R() * 0.9);
    axes.push(new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize());
  }
  const rest = settlePile(GUMMY_COUNT, restQ, size);
  // gummies near the top of the pile leave first
  const byTop = rest.map((p, i) => [p.y + R() * 0.35, i]).sort((a, b) => b[0] - a[0]);   // top of the heap first, but not in strict order
  const pourOf = new Int16Array(POUR_COUNT), rank = new Int16Array(GUMMY_COUNT).fill(-1);
  byTop.forEach(([, i], k) => { if (k < POUR_COUNT) { pourOf[k] = i; rank[i] = k; order[i] = k / (POUR_COUNT - 1); } else order[i] = 2; });
  ctl.pourOf = pourOf; ctl.rank = rank;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eul = new THREE.Euler(), sc = new THREE.Vector3(), pl = new THREE.Vector3();
  const rm = new THREE.Matrix4(), rinv = new THREE.Matrix4(), A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), P = new THREE.Vector3();
  const mouthW = new THREE.Vector3(), ctrlW = new THREE.Vector3(), upW = new THREE.Vector3(), ws = new THREE.Vector3(), tmpQ = new THREE.Quaternion(), tmpP = new THREE.Vector3();
  const bez = (a, c, b, s, out) => { const t = 1 - s; return out.set(t * t * a.x + 2 * t * s * c.x + s * s * b.x, t * t * a.y + 2 * t * s * c.y + s * s * b.y, t * t * a.z + 2 * t * s * c.z + s * s * b.z); };

  ctl.setIdle = () => {
    if (!ctl.mesh) return;
    for (let i = 0; i < GUMMY_COUNT; i++) { m4.compose(rest[i], restQ[i], sc.set(size[i], size[i], size[i])); ctl.mesh.setMatrixAt(i, m4); }
    ctl.mesh.instanceMatrix.needsUpdate = true; ctl.atRest = true;
  };
  // open: 0..1; time: seconds; targets: Float32Array(n*3) world positions the gummies float to. Call after the jar's matrices are current.
  ctl.update = (open, time, targets, ptr, heroHideK = 0) => {
    if (ctl.mesh && ctl.liteGeo) {
      const wantFull = open > 0.0005;
      if (wantFull && !ctl.fullGeo && !ctl.fullLoading) { ctl.fullLoading = true; loadGeo().then(({ geo }) => { ctl.fullGeo = geo; }).catch(() => {}); }
      const g = wantFull && ctl.fullGeo ? ctl.fullGeo : ctl.liteGeo;
      if (ctl.mesh.geometry !== g) ctl.mesh.geometry = g;
    }   // ptr: { x, y, r } the pointer in world units and its reach, or null
    if (!ctl.mesh) return;
    if (open <= 0.0005) { if (!ctl.atRest) ctl.setIdle(); return; }
    ctl.atRest = false;
    root.updateWorldMatrix(true, false); rm.copy(root.matrixWorld); rinv.copy(rm).invert();
    root.matrixWorld.decompose(tmpP, tmpQ, ws);
    const unit = ws.x * GS;                                       // a gummy's width in world units
    mouthW.set(AXIS.x, MOUTH_Y, AXIS.z).applyMatrix4(rm); ctrlW.set(AXIS.x, INSIDE_Y, AXIS.z).applyMatrix4(rm);
    upW.set(0, 1, 0);
    for (let i = 0; i < GUMMY_COUNT; i++) {
      const tau = rank[i] < 0 ? 0 : clamp((open - T0 - order[i] * SPAN) / DUR);   // (order has its own jitter)
      if (tau <= 0) {
        let sc0 = size[i];
        if (rank[i] === 0 && heroHideK > 0) sc0 *= Math.max(0, 1 - heroHideK);
        m4.compose(rest[i], restQ[i], sc.set(sc0, sc0, sc0));
        ctl.mesh.setMatrixAt(i, m4);
        ctl.arrived[i] = 0;
        continue;
      }
      let u2 = 0, scale = size[i], arrived = 0;
      A.copy(rest[i]).applyMatrix4(rm);
      if (tau < S1) {
        bez(A, ctrlW, mouthW, easeIO(tau / S1), P);                  // inside the jar: funnel to the mouth
      } else {
        u2 = (tau - S1) / (1 - S1);
        const e = easeOut(u2);
        B.set(targets[rank[i] * 3], targets[rank[i] * 3 + 1], targets[rank[i] * 3 + 2]);
        const arc = mouthW.distanceTo(B) * 0.34 * arcK[i];
        C.copy(mouthW).lerp(B, 0.5).addScaledVector(upW, arc);
        bez(mouthW, C, B, e, P);
        if (u2 > 0.5) P.y += Math.sin((u2 - 0.5) * Math.PI * 4) * (1 - u2) * unit * 0.7;   // a light bounce as it settles
        scale = size[i] * (1 + 0.28 * e * (0.8 + 0.4 * wy[i] / 1.5));
        arrived = u2 >= 1 ? 1 : 0;
      }
      if (arrived) P.y += Math.sin(time * 1.2 + ph[i]) * unit * 0.12;
      // the pointer pushes the floating gummies away (they ease back when it leaves), and they spin a little as they are pushed
      const pw = clamp((u2 - 0.6) / 0.4);
      let tx = 0, ty = 0, tz = 0;
      if (ptr && pw > 0) {
        const dx = P.x - ptr.x, dy = P.y - ptr.y, d = Math.hypot(dx, dy) || 1e-4, f = Math.pow(clamp(1 - d / ptr.r), 2);
        tx = dx / d * f * ptr.r * 0.6 * pw; ty = dy / d * f * ptr.r * 0.6 * pw; tz = f * ptr.r * 0.25 * pw;
      }
      push[i * 3] += (tx - push[i * 3]) * 0.14; push[i * 3 + 1] += (ty - push[i * 3 + 1]) * 0.14; push[i * 3 + 2] += (tz - push[i * 3 + 2]) * 0.14;
      P.x += push[i * 3]; P.y += push[i * 3 + 1]; P.z += push[i * 3 + 2];
      const kick = Math.hypot(push[i * 3], push[i * 3 + 1]) / (unit * 2);
      ctl.world[i * 3] = P.x; ctl.world[i * 3 + 1] = P.y; ctl.world[i * 3 + 2] = P.z;
      ctl.arrived[i] = arrived;
      pl.copy(P).applyMatrix4(rinv);
      const tumble = (1 - easeOut(u2)) * (4 + 5 * wy[i]) + (arrived ? time * 0.25 * wy[i] : 0) + kick * 2.2;   // each one tumbles about its own axis
      q.setFromAxisAngle(axes[i], tumble).multiply(restQ[i]);
      if (rank[i] === 0 && heroHideK > 0) {
        scale *= Math.max(0, 1 - heroHideK);
      }
      m4.compose(pl, q, sc.set(scale, scale, scale));
      ctl.mesh.setMatrixAt(i, m4);
    }
    ctl.mesh.instanceMatrix.needsUpdate = true;
  };
  ctl.restWorld = (i, out) => out.copy(rest[i]).applyMatrix4(root.matrixWorld);

  // the jar on the product card starts with the light packets; the full-detail ones are swapped in as soon as the jar opens
  loadGeo(packetLiteUrl).then(({ geo, mat }) => {
    const mesh = new THREE.InstancedMesh(geo, mat, GUMMY_COUNT);
    ctl.liteGeo = geo;
    // fetch the full-detail packets quietly in the background so they are ready by the time the jar opens
    const pre = () => { if (!ctl.fullLoading) { ctl.fullLoading = true; loadGeo().then(({ geo: g }) => { ctl.fullGeo = g; }).catch(() => {}); } };
    if ('requestIdleCallback' in window) requestIdleCallback(pre, { timeout: 4000 }); else setTimeout(pre, 1500);
    mesh.frustumCulled = false; mesh.name = 'Gummies'; mesh.renderOrder = 0;
    for (let i = 0; i < GUMMY_COUNT; i++) ctl.colors.push(PALETTE[0]);
    ctl.mesh = mesh; root.add(mesh); ctl.ready = true; ctl.setIdle();
  }).catch(() => { /* no packets if the file cannot load: the jar stays as it was */ });
  return ctl;
}

/* ------------------------------------------------------------------------------------------------ the director */
let styled = false;
function addStyle() {
  if (styled) return; styled = true;
  const s = document.createElement('style');
  s.textContent = `
  #ingLayer{position:fixed;inset:0;z-index:47;pointer-events:none !important;visibility:hidden}
  #ingLayer svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none !important}
  
  .ing-tendril-path{
    fill:none;
    stroke:#2f6b3a;
    stroke-width:1.5;
    stroke-linecap:round;
    pointer-events:none !important;
  }
  .ing-dot-glow{
    fill:none;
    stroke:rgba(47,107,58,0.32);
    stroke-width:2.2;
    pointer-events:none !important;
  }
  .ing-dot-core{
    fill:#fff;
    stroke:#2f6b3a;
    stroke-width:2;
    pointer-events:none !important;
  }

  .ing-label.glass-pill{
    position:absolute;
    box-sizing:border-box;
    padding:11px 15px 12px;
    border-radius:16px;
    background:rgba(255,255,255,0.78);
    -webkit-backdrop-filter:blur(14px) saturate(160%);
    backdrop-filter:blur(14px) saturate(160%);
    border:1px solid rgba(255,255,255,0.85);
    box-shadow:0 12px 30px -8px rgba(24,52,30,0.13), 0 2px 6px rgba(0,0,0,0.03);
    color:#1a3d24;
    will-change:opacity,transform;
    pointer-events:none !important;
    transition:box-shadow 0.25s ease, border-color 0.25s ease;
  }
  :root.dark .ing-label.glass-pill, [data-theme="dark"] .ing-label.glass-pill{
    background:rgba(20,32,24,0.82);
    border:1px solid rgba(255,255,255,0.14);
    box-shadow:0 12px 30px -8px rgba(0,0,0,0.48);
    color:#e4f2e7;
  }

  .ing-pill-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:8px;
  }
  .ing-pill-title{
    display:flex;
    align-items:center;
    gap:6px;
    font-size:13.5px;
    line-height:1.25;
    font-weight:700;
    letter-spacing:-0.01em;
    color:inherit;
    pointer-events:none !important;
  }
  .ing-pill-dot{
    display:inline-block;
    width:6.5px;
    height:6.5px;
    border-radius:50%;
    background:#2f6b3a;
    flex-shrink:0;
    pointer-events:none !important;
  }
  .ing-pill-badge{
    display:inline-block;
    font-size:8.5px;
    font-weight:700;
    letter-spacing:0.06em;
    text-transform:uppercase;
    padding:2px 6px;
    border-radius:6px;
    line-height:1.2;
    flex-shrink:0;
    pointer-events:none !important;
  }
  .ing-pill-text{
    margin:5px 0 0;
    font-size:11.5px;
    line-height:1.38;
    opacity:0.80;
    font-weight:400;
    color:inherit;
    pointer-events:none !important;
  }

  @media (max-width:720px){
    .ing-label.glass-pill{padding:9px 13px 10px;border-radius:14px}
    .ing-pill-title{font-size:13px}
    .ing-pill-text{font-size:11px;margin-top:4px}
    .ing-pill-badge{font-size:8px;padding:1.5px 5px}
  }`;
  document.head.appendChild(s);
}

const CALLOUT_TAGS = [
  { tag: 'ADAPTOGEN', badgeBg: 'rgba(47, 107, 58, 0.12)', badgeColor: '#245a30' },
  { tag: 'BRONCHODILATOR', badgeBg: 'rgba(47, 107, 58, 0.12)', badgeColor: '#245a30' },
  { tag: 'METABOLIC HEAT', badgeBg: 'rgba(180, 100, 20, 0.12)', badgeColor: '#94530f' },
  { tag: 'BIO-ENHANCER', badgeBg: 'rgba(180, 100, 20, 0.12)', badgeColor: '#94530f' },
  { tag: 'PIPERINE 95%', badgeBg: 'rgba(180, 100, 20, 0.12)', badgeColor: '#94530f' },
  { tag: 'PHYTO-SHIELD', badgeBg: 'rgba(47, 107, 58, 0.12)', badgeColor: '#245a30' },
  { tag: 'SOOTHING', badgeBg: 'rgba(47, 107, 58, 0.12)', badgeColor: '#245a30' },
  { tag: 'IMMUNE BARRIER', badgeBg: 'rgba(30, 120, 90, 0.12)', badgeColor: '#166249' },
];

function createIngredientsDirector(L) {
  addStyle();
  const layer = document.createElement('div'); layer.id = 'ingLayer'; layer.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); layer.appendChild(svg);
  const list = CALLOUTS.map(i => DETAILS.gummies.list[i]).filter(Boolean);
  const items = list.map(([name, text], k) => {
    const meta = CALLOUT_TAGS[k] || { tag: 'BOTANICAL', badgeBg: 'rgba(47, 107, 58, 0.12)', badgeColor: '#245a30' };
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'ing-tendril-path');
    const dotGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dotGlow.setAttribute('class', 'ing-dot-glow');
    dotGlow.setAttribute('r', '6.5');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('class', 'ing-dot-core');
    dot.setAttribute('r', '3.5');
    svg.appendChild(path);
    svg.appendChild(dotGlow);
    svg.appendChild(dot);

    const el = document.createElement('div');
    el.className = 'ing-label glass-pill';
    el.innerHTML = `
      <div class="ing-pill-head">
        <span class="ing-pill-title"><i class="ing-pill-dot"></i>${name}</span>
        <span class="ing-pill-badge" style="background:${meta.badgeBg};color:${meta.badgeColor}">${meta.tag}</span>
      </div>
      <p class="ing-pill-text">${text}</p>
    `;
    layer.appendChild(el);
    return { path, dotGlow, dot, el, g: -1, a: 0 };
  });
  document.body.appendChild(layer);

  const targets = new Float32Array(POUR_COUNT * 3);
  const v = new THREE.Vector3(), rest = new THREE.Vector3(), capRest = new THREE.Vector3(), capT = new THREE.Vector3(), l0 = new THREE.Vector3(), l1 = new THREE.Vector3(), rinv = new THREE.Matrix4();
  const cloudW = new THREE.Vector3(), cloudScreen = { x: 0, y: 0 };
  const D = { shown: false, capDirty: false, sel: null, selKey: '' };
  const toWorld = (px, py, z, out) => out.set((px / L.W - 0.5) * 2 * L.halfW, -(py / L.H - 0.5) * 2 * L.halfH, z);
  const toScreen = (w, out) => { v.copy(w).project(L.cam); out.x = (v.x * 0.5 + 0.5) * L.W; out.y = (-v.y * 0.5 + 0.5) * L.H; };
  const sp = { x: 0, y: 0 };

  // Camera tracking vectors for 3D camera zoom/dolly
  const camPos0 = new THREE.Vector3(0, 0, 24);
  const camLook0 = new THREE.Vector3(0, 0, 0);
  const curCamPos = new THREE.Vector3();
  const curCamLook = new THREE.Vector3();
  const heroPos = new THREE.Vector3();
  const lookZoom = new THREE.Vector3();
  const posZoom = new THREE.Vector3();
  const gClose = new THREE.Vector3();
  const lookClose = new THREE.Vector3();
  const posClose = new THREE.Vector3();
  let closeK = 0;      // 0..1: camera pushed in tight on the emerged gummy (ingredients are read from here)
  let exitK = 0;       // 0..1: the exit (ingredients gone, camera pulls back, gummy goes home)

  const resetCamera = () => {
    L.cam.position.set(0, 0, 24);
    L.cam.up.set(0, 1, 0);
    L.cam.lookAt(0, 0, 0);
    if (Math.abs(L.cam.fov - 30) > 0.001) {
      L.cam.fov = 30;
      L.cam.updateProjectionMatrix();
    }
    L.cam.updateMatrixWorld(true);
  };

  // Hero Packet model with progressive tear animation and photorealistic emerged gummy
  const heroPacket = createPacketModel({
    gummyScale: 1.0
  });
  heroPacket.root.visible = false;
  heroPacket.root.renderOrder = 20;
  L.scene.add(heroPacket.root);

  // where the gummies float to (screen px): a spiral cloud between the cap (top) and the bottle (bottom)
  function layout(vw, vh, mobile, mouthY) {
    // between the cap (top) and the bottle's mouth (with a clear gap above it, so no gummy touches the bottle)
    const top = vh * 0.19, bottom = Math.max(top + vh * 0.22, Math.min(vh * 0.62, mouthY - vh * 0.08));
    const cx = vw * 0.5, cy = (top + bottom) / 2, ry = (bottom - top) / 2, rx = mobile ? vw * 0.42 : Math.min(vw * 0.28, vh * 0.55);
    return CLOUD.map(c => ({ x: cx + rx * c.u, y: cy + ry * c.v, r: c.r, th: c.th, z: c.z }));
  }
  // which gummy carries which callout: items 0-3 go to the right column, 4-7 to the left; on each side the outer gummies are picked
  // from top to bottom, in the same order as the labels, so the leader lines do not cross
  function pick(cloud, vw) {
    const out = new Array(8).fill(0);
    const side = (isLeft, base) => {
      const c = cloud.map((p, i) => ({ i, y: p.y, x: p.x })).filter(o => (isLeft ? o.x < vw * 0.5 : o.x >= vw * 0.5) && cloud[o.i].r > 0.62).sort((a, b) => a.y - b.y);
      for (let j = 0; j < 4; j++) out[base + j] = c.length ? c[Math.min(c.length - 1, Math.round((0.06 + j * 0.29) * (c.length - 1)))].i : 0;
    };
    side(false, 0); side(true, 4);
    return out;
  }

  return {
    // how the bottle is posed for `open`: it sinks to the bottom of the frame, smaller, turns to face front and tips a little
    pose(hold, open, o) {
      if (open <= 0) return hold;
      const k = sm(clamp((open - 0.14) / 0.60));
      const d = ((hold.rotY - o.front + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      hold.y = hold.y + (o.vh * (o.mobile ? 0.82 : 0.78) - hold.y) * k;
      hold.h = hold.h * (1 - 0.26 * k);
      hold.rotY = hold.rotY - k * d;
      hold.rotX = hold.rotX + (0.08 - hold.rotX) * k;
      hold.rotZ = hold.rotZ + (-0.3 - hold.rotZ) * k;
      return hold;
    },
    // after the jar's own transform is set: cap, gummies and callouts. o: { u, v, open, c (callout progress 0..1), calloutA (0..1), vw, vh, mobile, time }
    update(jar, o) {
      const ud = jar.b.userData, ctl = ud.gummies, pivot = ud.capPivot, root = ud.modelRoot;
      if (!ctl || !pivot || !root) return;
      jar.G.updateMatrixWorld(true); L.cam.updateMatrixWorld();   // (the camera's view matrix is only refreshed at render time: bring it up to date before projecting)
      const open = o.open;
      const u = o.u != null ? o.u : 0;
      const vVal = o.v != null ? o.v : 0;
      if (open <= 0.0005) {
        resetCamera();
      }

      // the cap: unscrews (turning and rising), then lifts to rest at the top of the frame
      const turnK = sm(clamp(open / 0.58)), liftK = sm(clamp((open - 0.15) / 0.70));
      pivot.rotation.y = turnK * TURNS * Math.PI * 2;
      pivot.position.copy(ud.capRest);
      if (liftK > 0) {
        capRest.set(AXIS.x, CAP_Y, AXIS.z).applyMatrix4(root.matrixWorld);
        toWorld(o.vw * 0.5, o.vh * (o.mobile ? 0.13 : 0.15), capRest.z, capT);
        rinv.copy(root.matrixWorld).invert();
        l0.set(AXIS.x, CAP_Y, AXIS.z); l1.copy(capT).applyMatrix4(rinv);
        pivot.position.x += (l1.x - l0.x) * liftK; pivot.position.y += (l1.y - l0.y) * liftK; pivot.position.z += (l1.z - l0.z) * liftK;
      }
      D.capDirty = open > 0;

      // the gummies
      v.set(AXIS.x, MOUTH_Y, AXIS.z).applyMatrix4(root.matrixWorld); toScreen(v, sp);
      const cloud = layout(o.vw, o.vh, o.mobile, sp.y);
      for (let i = 0; i < POUR_COUNT; i++) { toWorld(cloud[i].x, cloud[i].y, jar.G.position.z + cloud[i].z * 0.9, v); targets[i * 3] = v.x; targets[i * 3 + 1] = v.y; targets[i * 3 + 2] = v.z; }
      pivot.updateMatrixWorld(true);
      let ptr = null;
      if (o.pointer && o.pointer.on && open >= 0.99) {
        toWorld((o.pointer.x + 0.5) * o.vw, (o.pointer.y + 0.5) * o.vh, jar.G.position.z, v);
        ptr = { x: v.x, y: v.y, r: o.vh * 0.17 * (2 * L.halfH / L.H) };
      }

      // 1. Camera Zoom schedule:
      // Emerges from packet #0 in cloud, camera dollies in to hero product focus
      let zoomK = 0;
      if (vVal <= 0) {
        const zIn = sm(clamp((u - 0.38) / 0.14, 0, 1));
        const zOut = sm(clamp((u - 0.95) / 0.04, 0, 1));
        zoomK = zIn * (1 - zOut);
      }

      // 1b. Close-up on the gummy: once it has emerged the camera pushes in tight, the ingredients are shown from there,
      // and when they have faded (u 0.86 to 0.90) the camera eases back out to the normal view while the gummy goes home.
      closeK = 0; exitK = 0;
      if (vVal <= 0) {
        const cIn = sm(clamp((u - 0.58) / 0.08, 0, 1));
        const cOut = sm(clamp((u - 0.86) / 0.08, 0, 1));
        closeK = cIn * (1 - cOut);
        exitK = sm(clamp((u - 0.86) / 0.13, 0, 1));
      }

      // 2. Tear schedule: flap peels, pouch mouth opens, and gummy emerges
      // Gummy stays fully emerged at tearK = 1 until u = 0.90.
      // Ingredients & pointing lines completely fade out between u = 0.86 and 0.90.
      // Only THEN at u = 0.90 does the gummy slide back inside the pocket and flap closes.
      let tearK = 0;
      if (vVal <= 0) {
        const tIn = sm(clamp((u - 0.52) / 0.14, 0, 1));
        const tOut = sm(clamp((u - 0.90) / 0.05, 0, 1));
        tearK = tIn * (1 - tOut);
      }

      // Update instanced cloud (hide packet #0 when zoomK is active)
      ctl.update(open, o.time, targets, ptr, zoomK);

      // Update hero packet 3D position, scale, and tear progress, and DOLLY / ZOOM CAMERA
      if (zoomK > 0.002 && ctl.ready) {
        const hIdx = ctl.pourOf[0];
        cloudW.set(ctl.world[hIdx * 3], ctl.world[hIdx * 3 + 1], ctl.world[hIdx * 3 + 2]);

        const targetHeroX = o.mobile ? -0.10 : -0.45;
        const targetHeroY = o.mobile ? 1.25 : 1.05;
        const targetHeroZ = 0.35;

        const kEase = sm(zoomK);
        heroPos.set(
          lerp(cloudW.x, targetHeroX, kEase),
          lerp(cloudW.y, targetHeroY, kEase),
          lerp(cloudW.z, targetHeroZ, kEase)
        );

        const idleY = zoomK > 0.85 ? Math.sin(o.time * 1.5) * 0.03 : 0;
        heroPacket.root.position.set(heroPos.x, heroPos.y + idleY, heroPos.z);

        const rotYIdle = zoomK > 0.85 ? Math.sin(o.time * 0.8) * 0.03 : 0;
        const swing = Math.sin(exitK * Math.PI);          // the exit: a little turn and wobble as the gummy heads home
        heroPacket.root.rotation.set(
          lerp(0, 0.08, kEase) + swing * 0.10,
          lerp(0, -0.18 + rotYIdle, kEase) - swing * 0.55,
          lerp(0, 0.04, kEase) + swing * 0.12
        );

        const baseWorldScale = 0.28;
        const targetWorldScale = o.mobile ? 0.35 : 0.38;
        const curScale = lerp(baseWorldScale, targetWorldScale, kEase) * (1 + Math.sin(exitK * Math.PI) * 0.06);
        heroPacket.root.scale.setScalar(curScale);

        heroPacket.updateOpen(tearK);
        heroPacket.root.visible = true;
        heroPacket.root.updateMatrixWorld(true);

        // --- TRUE 3D CAMERA ZOOM (DOLLY + FOV) ---
        // Look target: frames packet & emerged gummy perfectly
        if (o.mobile) {
          lookZoom.set(heroPos.x + 0.25, heroPos.y - 0.25, heroPos.z);
          posZoom.set(lookZoom.x, lookZoom.y, heroPos.z + 5.6);
        } else {
          lookZoom.set(heroPos.x + 0.58, heroPos.y, heroPos.z);
          posZoom.set(lookZoom.x, lookZoom.y, heroPos.z + 5.2);
        }

        const fov0 = 30;
        const fovZoom = o.mobile ? 25 : 23;
        const fovClose = o.mobile ? 20 : 18;

        // push in on the gummy itself
        if (closeK > 0.001) {
          if (typeof heroPacket.getGummyWorldPos === 'function') heroPacket.getGummyWorldPos(gClose);
          else { heroPacket.root.getWorldPosition(gClose); gClose.x += 1.0 * heroPacket.root.scale.x; }
          lookClose.copy(gClose);
          posClose.set(gClose.x, gClose.y, gClose.z + (o.mobile ? 3.4 : 3.0));
          lookZoom.lerp(lookClose, sm(closeK));
          posZoom.lerp(posClose, sm(closeK));
        }
        const curFov = lerp(lerp(fov0, fovZoom, kEase), fovClose, sm(closeK));

        curCamLook.lerpVectors(camLook0, lookZoom, kEase);
        curCamPos.lerpVectors(camPos0, posZoom, kEase);

        L.cam.position.copy(curCamPos);
        L.cam.up.set(0, 1, 0);
        L.cam.lookAt(curCamLook);
        L.cam.fov = curFov;
        L.cam.updateProjectionMatrix();
        L.cam.updateMatrixWorld(true);
      } else {
        heroPacket.root.visible = false;
        heroPacket.updateOpen(0);
        resetCamera();
      }

      // the callouts: anchored directly to the emerged gummy
      const A = o.calloutA;
      if (A <= 0.001 || !ctl.ready || !heroPacket.root.visible) { this.hide(); return; }

      layer.style.visibility = 'visible'; D.shown = true;
      const K = items.length, cur = o.c * K;

      // Exact screen position of the emerged gummy
      const gWorld = new THREE.Vector3();
      try {
        if (typeof heroPacket.getGummyWorldPos === 'function') {
          heroPacket.getGummyWorldPos(gWorld);
        } else if (heroPacket.root && heroPacket.root.userData && typeof heroPacket.root.userData.getGummyWorldPos === 'function') {
          heroPacket.root.userData.getGummyWorldPos(gWorld);
        } else if (heroPacket.userData && typeof heroPacket.userData.getGummyWorldPos === 'function') {
          heroPacket.userData.getGummyWorldPos(gWorld);
        } else {
          heroPacket.root.getWorldPosition(gWorld);
          gWorld.x += 1.0 * heroPacket.root.scale.x;
        }
      } catch (err) {
        heroPacket.root.getWorldPosition(gWorld);
        gWorld.x += 1.0 * heroPacket.root.scale.x;
      }
      toScreen(gWorld, sp);
      const gx = sp.x, gy = sp.y, W = o.vw, H = o.vh;
      if (!Number.isFinite(gx) || !Number.isFinite(gy)) return;

      const heroPxSize = Math.min(o.vw * (o.mobile ? 0.65 : 0.30), o.vh * (o.mobile ? 0.32 : 0.44));
      const gummyR0 = Math.max(14, Math.min(38, heroPxSize * 0.15));
      const gummyR = gummyR0 * (1 + sm(closeK) * (o.mobile ? 0.9 : 1.35));   // the gummy is bigger on screen in the close-up

      items.forEach((it, k) => {
        const a = (o.mobile ? clamp(1 - Math.abs(cur - k - 0.5) * 1.6) : clamp((cur - k) / 0.7)) * A;
        it.a = a;
        if (a <= 0.003) {
          it.el.style.opacity = '0';
          it.path.setAttribute('opacity', '0');
          it.dotGlow.setAttribute('opacity', '0');
          it.dot.setAttribute('opacity', '0');
          return;
        }

        const isLeft = k < 4;
        const j = isLeft ? k : k - 4; // index within column (0..3)
        const n = 4;
        let lx, ly, ax, ay, w, dotGx, dotGy;

        if (o.mobile) {
          w = Math.min(W * 0.88, 360);
          lx = (W - w) / 2;
          ly = H * 0.65;
          ax = W / 2;
          ay = ly;
          dotGx = gx;
          dotGy = gy + gummyR;
        } else {
          w = Math.min(270, W * 0.23);
          lx = isLeft ? Math.max(18, W * 0.045) : W - Math.max(18, W * 0.045) - w;
          ly = H * 0.18 + (j / (n - 1)) * (H * 0.56);
          ax = isLeft ? lx + w : lx;
          ay = ly + 28;

          // Anchor points distributed along gummy contour
          const angle = isLeft
            ? Math.PI - 0.55 + (j / (n - 1)) * 1.10
            : -0.55 + (j / (n - 1)) * 1.10;
          dotGx = gx + Math.cos(angle) * gummyR;
          dotGy = gy + Math.sin(angle) * gummyR;
        }

        // Slide card subtly inward as it fades in (spring entrance)
        const slideX = o.mobile ? 0 : (isLeft ? (1 - a) * -12 : (1 - a) * 12);
        it.el.style.width = w + 'px';
        it.el.style.transform = 'translate3d(' + (lx + slideX).toFixed(1) + 'px,' + ly.toFixed(1) + 'px,0)';
        it.el.style.opacity = a.toFixed(3);

        // Smooth Bezier Tendril:
        // P0 = (dotGx, dotGy) on gummy contour
        // P2 = (ax, ay) anchor at the edge of card
        // P1 = (cx, cy) control point producing a gentle organic curve
        let cx, cy;
        if (o.mobile) {
          cx = (dotGx + ax) * 0.5;
          cy = (dotGy + ay) * 0.5;
        } else {
          const bowX = isLeft ? -22 : 22;
          const bowY = (j - 1.5) * 8;
          cx = (dotGx + ax) * 0.5 + bowX;
          cy = (dotGy + ay) * 0.5 + bowY;
        }

        // Progressive tendril growth (0 to t) from gummy to card
        const t = clamp(a * 1.25, 0, 1);
        const q1x = dotGx + (cx - dotGx) * t;
        const q1y = dotGy + (cy - dotGy) * t;
        const p12x = cx + (ax - cx) * t;
        const p12y = cy + (ay - cy) * t;
        const q2x = q1x + (p12x - q1x) * t;
        const q2y = q1y + (p12y - q1y) * t;

        it.path.setAttribute('d', 'M ' + dotGx.toFixed(1) + ',' + dotGy.toFixed(1) + ' Q ' + q1x.toFixed(1) + ',' + q1y.toFixed(1) + ' ' + q2x.toFixed(1) + ',' + q2y.toFixed(1));
        it.path.setAttribute('opacity', (a * 0.85).toFixed(3));

        it.dotGlow.setAttribute('cx', dotGx.toFixed(1));
        it.dotGlow.setAttribute('cy', dotGy.toFixed(1));
        it.dotGlow.setAttribute('opacity', (a * 0.5).toFixed(3));

        it.dot.setAttribute('cx', dotGx.toFixed(1));
        it.dot.setAttribute('cy', dotGy.toFixed(1));
        it.dot.setAttribute('opacity', a.toFixed(3));
      });
    },
    hide() {
      if (!D.shown) return;
      layer.style.visibility = 'hidden'; D.shown = false;
      items.forEach(it => {
        it.el.style.opacity = '0';
        it.path.setAttribute('opacity', '0');
        it.dotGlow.setAttribute('opacity', '0');
        it.dot.setAttribute('opacity', '0');
      });
    },
    // put everything back (overlay closed / another product)
    reset(jar) {
      this.hide();
      resetCamera();
      if (heroPacket && heroPacket.root) {
        heroPacket.root.visible = false;
        heroPacket.updateOpen(0);
      }
      const ud = jar && jar.b && jar.b.userData; if (!ud) return;
      if (ud.capPivot && ud.capRest) { ud.capPivot.rotation.y = 0; ud.capPivot.position.copy(ud.capRest); }
      if (ud.gummies) ud.gummies.update(0, 0, targets, null, 0);
    },
  };
}

export { attachGummies, createIngredientsDirector, GUMMY_COUNT };
