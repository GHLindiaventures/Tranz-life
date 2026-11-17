// Energy Booster: the ingredients moment, the liquid way (the Lung Booster's gummy pour, gummy-pour.js, is the model).
// The cap unscrews and lifts away, the bottle tips, and the liquid SPLASHES out of the open neck: ribbons of liquid curl
// out and break up into droplets at their ends, frozen mid-air like a product photo. The camera then dollies in to one
// droplet of the splash (the splash and the bottle sweep past as it moves) and the ingredients are called out around it.
// Scrolling back runs it all backwards: the camera pulls out, the liquid draws back into the bottle and the cap screws on.
//
//   createLiquidDirector(L)   same interface as gummy-pour.js's director (pose / update / hide / reset): journey.js
//                             feeds it `open` (0 closed .. 1 poured), u / v (the stretch's progress) and the callout numbers.
//
// The liquid has its own shader (this three.js cannot render real liquid): see FRAG. The ribbons are tubes rebuilt every
// frame from a curve: they thin out along their length, carry ripples that travel along them, and pinch into beads where
// they break up. The droplets are teardrops stretched along their flight.
//
// Tuning (all here): STRANDS (the splash's shape, in bottle heights), LIQUID (colours), the schedule (SPLASH in `open`,
// ZOOM in u) and CALLOUT_SIDES (which ingredients go left / right).
import * as THREE from 'three';
import { DETAILS } from '../../products-page/data/product-details.js';

const TURNS = 2.5;                                 // cap turns (the bottle's thread has 2.5 turns: scripts/add_energy_threads.mjs)
const NECK_TOP = 0.84, BASE_Y = -0.95;             // the open mouth and the base, in the model's own units
const SPLASH = [0.22, 0.52];                       // the splash grows over this part of `open`
const ZOOM_IN = [0.2, 0.36], ZOOM_OUT = [0.93, 0.98];   // the camera's dolly to the droplet (in u)
const LIQUID = { edge: '#5a2504', body: '#c7680a', glow: '#ffc04a', sky: '#fff4dc' };
const BG = ['#f1dc95', '#ddb24a', '#a77a22'];          // the Energy Booster overlay's backdrop (journey.js OV_BG.energy): top, middle, bottom
const CALLOUT_SIDES = [0, 0, 0, 1, 1];             // per ingredient (DETAILS.energy.list order): 0 = left column, 1 = right
const SEG = 150, RAD = 18;                         // a ribbon's rings along its length, and points around each ring

// The splash: each strand is a cubic curve from the mouth. Points are offsets from the mouth in bottle heights along
// A (the bottle's axis), S (screen right), G (world up) and Z (towards the camera). r0: radius at the mouth (bottle
// heights); brk: where along it the ribbon starts to break into beads; bf: bead frequency; drops: droplets thrown off it.
const STRANDS = [
  { p1: { A: 0.3 }, p2: { A: 0.56, S: -0.2, G: 0.14 }, p3: { S: -0.76, G: 0.44, Z: 0.05 }, r0: 0.05, brk: 0.62, bf: 46, drops: 20, delay: 0, ph: 0.3 },
  { p1: { A: 0.33, S: 0.02 }, p2: { A: 0.62, S: 0.26, G: 0.16 }, p3: { S: 0.86, G: 0.54, Z: 0.12 }, r0: 0.046, brk: 0.6, bf: 44, drops: 20, delay: 0.03, ph: 1.7 },
  { p1: { A: 0.34 }, p2: { A: 0.7, S: 0.06, G: 0.1 }, p3: { A: 0.7, S: -0.18, G: 0.26, Z: 0.1 }, r0: 0.034, brk: 0.55, bf: 52, drops: 12, delay: 0.02, ph: 2.3 },
  { p1: { A: 0.24 }, p2: { A: 0.48, S: -0.06, Z: 0.18 }, p3: { A: 0.6, S: -0.22, G: 0.04, Z: 0.34 }, r0: 0.022, brk: 0.5, bf: 64, drops: 10, delay: 0.06, ph: 2.9 },
  { p1: { A: 0.2, Z: 0.1 }, p2: { A: 0.34, S: 0.16, Z: 0.36 }, p3: { S: 0.36, G: 0.16, Z: 0.62 }, r0: 0.018, brk: 0.45, bf: 72, drops: 10, delay: 0.08, ph: 4.1 },
  { p1: { A: 0.22, S: -0.03 }, p2: { A: 0.34, S: -0.3, G: 0.02 }, p3: { S: -0.5, G: 0.06, Z: -0.1 }, r0: 0.02, brk: 0.5, bf: 70, drops: 10, delay: 0.05, ph: 5.2 },
];
const HERO = { strand: 1, t: 1.12, up: 0.03, r: 0.03 };   // the droplet the camera flies to (on strand 1, just past its end)

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = t => t * t * (3 - 2 * t);
const smooth = (a, b, x) => sm(clamp((x - a) / (b - a)));
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ------------------------------------------------------------------------------------------------ the liquid look */
const VERT = /* glsl */`
  uniform float uTime;
  uniform float uWobble;
  #ifdef DROPLET
    attribute float aPhase;
    attribute vec3 aStretch;          // stretch direction (unit, world) * amount
  #endif
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 p = position;
    vec3 n = normal;
    #ifdef DROPLET
      float t = uTime * 2.1 + aPhase * 6.28;
      p += n * (sin(p.x * 4.7 + t) * sin(p.y * 3.9 + t * 1.3) * 0.6 + sin(p.z * 5.6 - t) * 0.4) * uWobble;
      float s = length(aStretch);
      if (s > 0.0001) {               // a teardrop: longer along its flight, pointed at the back
        vec3 d = aStretch / s;
        float along = dot(p, d);
        p += d * along * s * 0.8 - (p - d * along) * s * 0.12;
        p -= d * max(0.0, -along) * max(0.0, -along) * s * 0.9;
      }
    #endif
    #ifdef USE_INSTANCING
      mat4 m = modelMatrix * instanceMatrix;
    #else
      mat4 m = modelMatrix;
    #endif
    vec4 wp = m * vec4(p, 1.0);
    vN = normalize(mat3(m) * n);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
// Real amber liquid is see-through: a drop works like a lens, so it shows the backdrop behind it bent and flipped
// (light at the bottom, darker at the top), tinted amber by the liquid. The thicker the liquid the light passes through,
// the deeper the amber; the very edge is a long, dark path. The surface mirrors the studio (a bright sky above, dark
// below), seen mostly at the edges (fresnel), plus small, sharp highlights. (This three.js cannot refract for real, so
// the backdrop is the overlay's own gradient, BG.)
const FRAG = /* glsl */`
  uniform vec3 uEdge, uBody, uGlow, uSky, uBgTop, uBgMid, uBgBot;
  uniform float uOpacity;
  varying vec3 vN;
  varying vec3 vV;
  vec3 backdrop(float y) { y = clamp(y, 0.0, 1.0); return y < 0.5 ? mix(uBgBot, uBgMid, y * 2.0) : mix(uBgMid, uBgTop, y * 2.0 - 1.0); }
  void main() {
    vec3 N = normalize(vN), V = normalize(vV);
    if (dot(N, V) < 0.0) N = -N;
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
    vec3 rd = refract(-V, N, 0.72);
    vec3 bg = backdrop(0.5 - rd.y * 0.9);                                   // flipped by the lens
    vec3 tint = mix(uGlow, uBody, smoothstep(0.2, 1.0, ndv) * 0.8);
    vec3 col = bg * tint * 1.3;
    float caustic = pow(max(0.0, dot(N, normalize(vec3(0.35, -0.8, 0.5)))), 3.0) * smoothstep(0.35, 0.9, ndv);
    col += uGlow * caustic * 1.1;                                                // light focused low inside the drop
    col = mix(col, uEdge, pow(1.0 - ndv, 1.8) * 0.85);                          // the dark edge
    vec3 R = reflect(-V, N);
    vec3 env = mix(uEdge * 0.5, uSky, smoothstep(-0.15, 0.7, R.y));
    env += uSky * smoothstep(0.86, 0.97, dot(R, normalize(vec3(0.95, 0.25, 0.2)))) * 0.6;
    col = mix(col, env, clamp(fres * 1.2, 0.0, 0.85));
    vec3 L1 = normalize(vec3(-0.4, 0.8, 0.5)), L2 = normalize(vec3(0.55, 0.3, 0.75));
    col += vec3(1.0) * pow(max(dot(R, L1), 0.0), 420.0) * 2.4 + vec3(1.0, 0.96, 0.88) * pow(max(dot(R, L2), 0.0), 140.0) * 0.6;
    gl_FragColor = vec4(col, mix(0.94, 1.0, fres) * uOpacity);
    #include <encodings_fragment>
  }`;
function liquidMaterial(defines = {}) {
  const c = h => new THREE.Color(h).convertSRGBToLinear();
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, defines, transparent: true, depthWrite: true, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uWobble: { value: 0.05 }, uOpacity: { value: 1 },
      uEdge: { value: c(LIQUID.edge) }, uBody: { value: c(LIQUID.body) }, uGlow: { value: c(LIQUID.glow) }, uSky: { value: c(LIQUID.sky) },
      uBgTop: { value: c(BG[0]) }, uBgMid: { value: c(BG[1]) }, uBgBot: { value: c(BG[2]) } },
  });
}

/* ------------------------------------------------------------------------------------------------ the ribbons */
function makeRibbon(mat) {
  const n = (SEG + 1) * (RAD + 1), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const idx = [];
  for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) {
    const a = i * (RAD + 1) + j, b = a + RAD + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.visible = false;
  return mesh;
}

/* ------------------------------------------------------------------------------------------------ the director */
let styled = false;
function addStyle() {
  if (styled) return; styled = true;
  const s = document.createElement('style');
  s.textContent = `
  #dropLayer{position:fixed;inset:0;z-index:47;pointer-events:none !important;visibility:hidden}
  #dropLayer svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none !important}
  #dropLayer line{stroke:#6b3d06;stroke-width:1.4;stroke-linecap:round}
  #dropLayer circle{fill:#fff8e6;stroke:#a5600a;stroke-width:2}
  .drop-label{position:absolute;box-sizing:border-box;padding:12px 16px 13px;border-radius:14px;background:rgba(255,250,236,.9);
    -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:#3d2a06;box-shadow:0 8px 26px rgba(90,60,10,.16);will-change:opacity,transform}
  .drop-label b{display:block;font-size:15.5px;line-height:1.2;font-weight:700;letter-spacing:.01em}
  .drop-label b em{font-style:normal;font-weight:600;color:#a8650a;margin-left:6px}
  .drop-label span{display:block;margin-top:5px;font-size:12.5px;line-height:1.4;opacity:.8}
  .drop-label i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:8px;background:#c4700a;box-shadow:0 0 0 3px rgba(196,112,10,.22)}
  @media (max-width:720px){.drop-label{padding:10px 13px 11px}.drop-label b{font-size:14.5px}.drop-label span{font-size:12px}}`;
  document.head.appendChild(s);
}

function createLiquidDirector(L) {
  addStyle();
  // the callouts: name (potency picked out) and one line, from DETAILS.energy.list
  const layer = document.createElement('div'); layer.id = 'dropLayer'; layer.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); layer.appendChild(svg);
  const items = (DETAILS.energy ? DETAILS.energy.list : []).map(([name, text], k) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line'), dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '4.5'); svg.appendChild(line); svg.appendChild(dot);
    const m = name.match(/^(.*?)\s*(\([^)]*\))$/), el = document.createElement('div'); el.className = 'drop-label';
    el.innerHTML = '<b><i></i>' + (m ? m[1] + '<em>' + m[2] + '</em>' : name) + '</b><span>' + text + '</span>'; layer.appendChild(el);
    return { line, dot, el, side: CALLOUT_SIDES[k] || 0 };
  });
  document.body.appendChild(layer);

  // the meshes: a ribbon per strand, the thrown droplets (instanced), and the hero droplet (finer)
  const ribbonMat = liquidMaterial(), dropMat = liquidMaterial({ DROPLET: '' }), heroMat = liquidMaterial({ DROPLET: '' });
  const ribbons = STRANDS.map(() => { const r = makeRibbon(ribbonMat); L.scene.add(r); return r; });
  const R = rng(17), drops = [];
  STRANDS.forEach((st, si) => {
    for (let k = 0; k < st.drops; k++) {
      let t = lerp(st.brk - 0.04, 1.45, Math.pow(R(), 0.8)); const a = R() * Math.PI * 2;
      if (si === HERO.strand && Math.abs(t - HERO.t) < 0.16) t = HERO.t + (t < HERO.t ? -0.16 : 0.16);   // room around the hero droplet
      drops.push({ si, t, a, off: (0.5 + R() * 2.0) * (0.6 + t * 0.6), size: 0.14 + Math.pow(R(), 2.2) * 0.5, ph: R(), fall: 0.2 + R() * 0.5 });
    }
  });
  const DN = drops.length, dGeo = new THREE.IcosahedronGeometry(1, 5);
  const dPhase = new Float32Array(DN), dStretch = new Float32Array(DN * 3);
  drops.forEach((d, i) => { dPhase[i] = d.ph; });
  dGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(dPhase, 1));
  dGeo.setAttribute('aStretch', new THREE.InstancedBufferAttribute(dStretch, 3));
  const dMesh = new THREE.InstancedMesh(dGeo, dropMat, DN);
  dMesh.frustumCulled = false; dMesh.renderOrder = 7; dMesh.visible = false; L.scene.add(dMesh);
  const hGeo = new THREE.IcosahedronGeometry(1, 7), hn = hGeo.attributes.position.count;
  hGeo.setAttribute('aPhase', new THREE.BufferAttribute(new Float32Array(hn).fill(0.41), 1));
  const hStretch = new Float32Array(hn * 3); hGeo.setAttribute('aStretch', new THREE.BufferAttribute(hStretch, 3));
  const hero = new THREE.Mesh(hGeo, heroMat);
  hero.frustumCulled = false; hero.renderOrder = 8; hero.visible = false; L.scene.add(hero);

  const v = new THREE.Vector3(), mouth = new THREE.Vector3(), base = new THREE.Vector3(), A = new THREE.Vector3(), S = new THREE.Vector3(1, 0, 0), G = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  const P = new THREE.Vector3(), T = new THREE.Vector3(), Nv = new THREE.Vector3(), Bv = new THREE.Vector3(), O = new THREE.Vector3();
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  const capW = new THREE.Vector3(), capT = new THREE.Vector3(), l0 = new THREE.Vector3(), l1 = new THREE.Vector3(), rinv = new THREE.Matrix4();
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), posZoom = new THREE.Vector3(), lookZoom = new THREE.Vector3(), camR = new THREE.Vector3();
  const curves = STRANDS.map(() => [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
  const D = { shown: false, zk: 0, hp: new THREE.Vector3(), rh: 1 };   // zk / hp / rh: last frame's zoom, hero position and radius (for the focus fade)
  const VIEW = new THREE.Vector3(-0.22, 0.08, 1).normalize();          // the direction the camera looks at the hero droplet from
  const toWorld = (px, py, z, out) => out.set((px / L.W - 0.5) * 2 * L.halfW, -(py / L.H - 0.5) * 2 * L.halfH, z);
  const toScreen = (w, out) => { v.copy(w).project(L.cam); out.x = (v.x * 0.5 + 0.5) * L.W; out.y = (-v.y * 0.5 + 0.5) * L.H; };
  const sp = { x: 0, y: 0 }, sp2 = { x: 0, y: 0 };

  const resetCamera = () => {
    L.cam.position.set(0, 0, 24); L.cam.up.set(0, 1, 0); L.cam.lookAt(0, 0, 0);
    if (Math.abs(L.cam.fov - 30) > 0.001) { L.cam.fov = 30; L.cam.updateProjectionMatrix(); }
    L.cam.updateMatrixWorld(true);
  };
  // a point / tangent on strand i's cubic curve
  const bez = (c, t, out) => { const s = 1 - t; return out.set(0, 0, 0).addScaledVector(c[0], s * s * s).addScaledVector(c[1], 3 * s * s * t).addScaledVector(c[2], 3 * s * t * t).addScaledVector(c[3], t * t * t); };
  const bezT = (c, t, out) => { const s = 1 - t; out.set(0, 0, 0).addScaledVector(c[1], 3 * s * s - 6 * s * t).addScaledVector(c[0], -3 * s * s).addScaledVector(c[2], 6 * s * t - 3 * t * t).addScaledVector(c[3], 3 * t * t); return out.normalize(); };
  const offs = (o, Hb, out) => out.copy(mouth).addScaledVector(A, (o.A || 0) * Hb).addScaledVector(S, (o.S || 0) * Hb).addScaledVector(G, (o.G || 0) * Hb).addScaledVector(Z, (o.Z || 0) * Hb);
  // where a thrown droplet is: along its strand (or flying on past its end), off to one side
  function dropAt(d, Hb, time, out) {
    const c = curves[d.si], st = STRANDS[d.si], r0 = st.r0 * Hb;
    if (d.t <= 1) { bez(c, d.t, out); bezT(c, d.t, T); }
    else { bez(c, 1, out); bezT(c, 1, T); const k = d.t - 1; out.addScaledVector(T, k * Hb * 0.55).addScaledVector(G, -k * k * Hb * d.fall); }
    Bv.crossVectors(T, Z); if (Bv.lengthSq() < 1e-6) Bv.set(1, 0, 0); Bv.normalize(); Nv.crossVectors(Bv, T);
    const drift = Math.sin(time * 0.6 + d.ph * 6.28) * 0.15;
    return out.addScaledVector(Nv, Math.cos(d.a + drift) * d.off * r0).addScaledVector(Bv, Math.sin(d.a + drift) * d.off * r0);
  }
  function parts(jar) {
    const ud = jar.b.userData;
    if (!ud._liquid) {
      const pivot = jar.b.getObjectByName('Jar_Cap_Pivot');
      if (!pivot) return null;
      ud._liquid = { pivot, rest: pivot.position.clone(), restRotY: pivot.rotation.y };
    }
    return ud._liquid;
  }
  function hideMeshes() { ribbons.forEach(r => { r.visible = false; }); dMesh.visible = false; hero.visible = false; }

  return {
    // the bottle's pose for `open`: it sinks low in the frame, a little smaller, turns to face front and tips to the
    // right, like a bottle caught mid-pour (the splash leaves it up and to both sides)
    pose(hold, open, o) {
      if (open <= 0) return hold;
      const k = sm(clamp((open - 0.06) / 0.3));
      const d = ((hold.rotY - o.front + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      hold.y = hold.y + (o.vh * (o.mobile ? 0.8 : 0.76) - hold.y) * k;
      hold.h = hold.h * (1 - 0.28 * k);
      hold.rotY = hold.rotY - k * d;
      hold.rotX = hold.rotX + (0.05 - hold.rotX) * k;
      hold.rotZ = hold.rotZ + (-0.26 - hold.rotZ) * k;
      return hold;
    },
    update(jar, o) {
      const pt = parts(jar); if (!pt) return;
      const { pivot } = pt, host = pivot.parent;
      const open = o.open, u = o.u || 0, vv = o.v || 0, vh = o.vh, time = o.time;
      if (open <= 0.0005) { resetCamera(); hideMeshes(); this.hide(); pivot.rotation.y = pt.restRotY; pivot.position.copy(pt.rest); return; }
      resetCamera();                                      // the splash is laid out from the resting camera; the dolly comes last
      jar.G.updateMatrixWorld(true);
      ribbonMat.uniforms.uTime.value = dropMat.uniforms.uTime.value = heroMat.uniforms.uTime.value = time;

      // the cap: unscrews (2.5 turns, rising up the thread), then lifts to the top of the frame
      const turnK = sm(clamp(open / 0.2)), riseK = sm(clamp(open / 0.2)), liftK = sm(clamp((open - 0.12) / 0.16));
      pivot.rotation.y = pt.restRotY + turnK * TURNS * Math.PI * 2;
      pivot.position.copy(pt.rest); pivot.position.y += riseK * 0.16;
      if (liftK > 0) {
        capW.set(pt.rest.x, 0.8, pt.rest.z); host.localToWorld(capW);
        toWorld(o.vw * 0.5, vh * (o.mobile ? 0.1 : 0.11), capW.z, capT);
        rinv.copy(host.matrixWorld).invert(); l0.set(pt.rest.x, 0.96, pt.rest.z); l1.copy(capT).applyMatrix4(rinv);
        pivot.position.x += (l1.x - l0.x) * liftK; pivot.position.y += (l1.y - l0.y) * liftK; pivot.position.z += (l1.z - l0.z) * liftK;
      }

      // the bottle's frame in the world: its mouth, axis and height
      mouth.set(pt.rest.x, NECK_TOP - 0.02, pt.rest.z); host.localToWorld(mouth);
      base.set(pt.rest.x, BASE_Y, pt.rest.z); host.localToWorld(base);
      A.copy(mouth).sub(base); const Hb = A.length(); A.normalize();
      STRANDS.forEach((st, i) => { const c = curves[i]; c[0].copy(mouth).addScaledVector(A, -0.07 * Hb);   // (starts inside the neck: its open end never shows)
        offs(st.p1, Hb, c[1]); offs(st.p2, Hb, c[2]); offs(st.p3, Hb, c[3]); });

      // the ribbons: grown along their curve by g (0..1.45: past 1 only the thrown droplets go on)
      const gOf = st => clamp((open - SPLASH[0] - st.delay) / (SPLASH[1] - SPLASH[0])) * 1.45;
      STRANDS.forEach((st, si) => {
        const mesh = ribbons[si], g = gOf(st), h = Math.min(1, g);
        if (g <= 0.001) { mesh.visible = false; return; }
        mesh.visible = true;
        const c = curves[si], r0 = st.r0 * Hb, pos = mesh.geometry.attributes.position.array;
        // the curve's length, for the round head
        let len = 0; bez(c, 0, O); for (let k = 1; k <= 12; k++) { bez(c, k / 12, P); len += P.distanceTo(O); O.copy(P); }
        const cap = Math.min(0.12, r0 * 1.3 / Math.max(1e-4, len));
        for (let i = 0; i <= SEG; i++) {
          const t = (i / SEG) * h;
          bez(c, t, P); bezT(c, t, T);
          Bv.crossVectors(T, Z); if (Bv.lengthSq() < 1e-6) Bv.set(1, 0, 0); Bv.normalize(); Nv.crossVectors(Bv, T);
          let r = r0 * (1 - 0.5 * t) * (1 + 0.2 * Math.sin(t * 26 - time * 6.5 + st.ph) + 0.1 * Math.sin(t * 61 - time * 9 + st.ph * 2.3));          // thins out; ripples travel along it
          const bk = smooth(st.brk, 1, t), bead = 0.5 + 0.5 * Math.sin(t * st.bf + st.ph + time * 1.5);
          r *= lerp(1, Math.pow(bead, 1.6), bk);                                                    // it pinches into beads as it breaks up
          if (h - t < cap) r *= Math.sqrt(Math.max(0, 1 - Math.pow((t - (h - cap)) / cap, 2)));    // a round head
          r = Math.max(r, 1e-5);
          const tw = t * 2.4 + st.ph;                                                               // a flattened, twisting ribbon
          for (let j = 0; j <= RAD; j++) {
            const a = (j / RAD) * Math.PI * 2, wob = 1 + 0.08 * Math.sin(a * 3 + t * 22 + time * 3);
            const ca = Math.cos(a) * r * wob, sa = Math.sin(a) * r * wob * 0.62;
            const x = ca * Math.cos(tw) - sa * Math.sin(tw), y = ca * Math.sin(tw) + sa * Math.cos(tw), k3 = (i * (RAD + 1) + j) * 3;
            pos[k3] = P.x + Nv.x * x + Bv.x * y; pos[k3 + 1] = P.y + Nv.y * x + Bv.y * y; pos[k3 + 2] = P.z + Nv.z * x + Bv.z * y;
          }
        }
        mesh.geometry.attributes.position.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
      });

      // the thrown droplets
      dMesh.visible = true;
      drops.forEach((d, i) => {
        const st = STRANDS[d.si], g = gOf(st), r0 = st.r0 * Hb;
        const k = smooth(d.t - 0.06, d.t, g);
        dropAt(d, Hb, time, P);
        let s = r0 * d.size * k;
        if (D.zk > 0) { const f = O.copy(P).sub(D.hp).dot(VIEW); s *= 1 - D.zk * smooth(D.rh * 0.3, D.rh * 2, f); }   // focus: droplets between the camera and the hero fade away
        bezT(curves[d.si], Math.min(1, d.t), T);
        dStretch[i * 3] = T.x * 0.3; dStretch[i * 3 + 1] = T.y * 0.3; dStretch[i * 3 + 2] = T.z * 0.3;
        m4.compose(P, q.identity(), sc.set(s, s, s)); dMesh.setMatrixAt(i, m4);
      });
      dMesh.instanceMatrix.needsUpdate = true; dGeo.attributes.aStretch.needsUpdate = true;

      // the hero droplet: thrown off strand HERO.strand, a little bigger than the rest
      const hst = STRANDS[HERO.strand], hk = smooth(HERO.t - 0.08, HERO.t, gOf(hst)), Rh = HERO.r * Hb;
      dropAt({ si: HERO.strand, t: HERO.t, a: 0, off: 0, ph: 0.4, fall: 0.25 }, Hb, time, P);
      P.addScaledVector(G, HERO.up * Hb + Math.sin(time * 1.1) * Rh * 0.08);
      hero.position.copy(P); hero.scale.setScalar(Rh * hk); hero.visible = hk > 0.001;
      bezT(curves[HERO.strand], 1, T);
      for (let k = 0; k < hn; k++) { hStretch[k * 3] = T.x * 0.12; hStretch[k * 3 + 1] = T.y * 0.12; hStretch[k * 3 + 2] = T.z * 0.12; }
      hGeo.attributes.aStretch.needsUpdate = true;

      // the camera: dollies in to the hero droplet (and narrows its lens a little), the splash sweeping past
      const zoomK = vv > 0 ? 0 : smooth(ZOOM_IN[0], ZOOM_IN[1], u) * (1 - smooth(ZOOM_OUT[0], ZOOM_OUT[1], u));
      D.zk = zoomK; D.hp.copy(hero.position); D.rh = Rh;
      heroMat.uniforms.uWobble.value = lerp(0.06, 0.035, zoomK);
      if (zoomK > 0.001 && hero.visible) {
        const k = sm(zoomK), fov = lerp(30, o.mobile ? 26 : 24, k);
        const dist = Rh / ((o.mobile ? 0.16 : 0.13) * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
        lookZoom.copy(hero.position);
        posZoom.copy(hero.position).addScaledVector(VIEW, dist);   // a little from the left and above: the splash shows its depth
        camLook.lerpVectors(v.set(0, 0, 0), lookZoom, k);
        camPos.lerpVectors(O.set(0, 0, 24), posZoom, k);
        L.cam.position.copy(camPos); L.cam.up.set(0, 1, 0); L.cam.lookAt(camLook);
        L.cam.fov = fov; L.cam.updateProjectionMatrix(); L.cam.updateMatrixWorld(true);
      }

      // the callouts, around the hero droplet
      const Acall = o.calloutA;
      if (Acall <= 0.001 || !hero.visible || zoomK < 0.5 || !items.length) { this.hide(); return; }
      layer.style.visibility = 'visible'; D.shown = true;
      toScreen(hero.position, sp);
      camR.setFromMatrixColumn(L.cam.matrixWorld, 0).multiplyScalar(hero.scale.x).add(hero.position); toScreen(camR, sp2);
      const gx = sp.x, gy = sp.y, W = o.vw, H = vh, rPx = Math.hypot(sp2.x - gx, sp2.y - gy);
      if (!Number.isFinite(gx) || !Number.isFinite(gy)) return;
      const K = items.length, cur = o.c * K;
      const nSide = [items.filter(it => !it.side).length, items.filter(it => it.side).length], idx = [0, 0];
      items.forEach((it, k) => {
        const j = idx[it.side]++, n = nSide[it.side];
        const a = (o.mobile ? clamp(1 - Math.abs(cur - k - 0.5) * 1.6) : clamp((cur - k) / 0.7)) * Acall;
        if (a <= 0.003) { it.el.style.opacity = '0'; it.line.setAttribute('opacity', '0'); it.dot.setAttribute('opacity', '0'); return; }
        let lx, ly, ax, ay, w, dx, dy;
        if (o.mobile) {
          w = Math.min(W * 0.86, 360); lx = (W - w) / 2; ly = H * 0.66; ax = W / 2; ay = ly;
          dx = gx; dy = gy + rPx;
        } else {
          const isLeft = !it.side, f = n > 1 ? j / (n - 1) - 0.5 : 0;
          w = Math.min(290, W * 0.24);
          lx = isLeft ? Math.max(16, W * 0.06) : W - Math.max(16, W * 0.06) - w;
          ly = H * (n > 2 ? 0.2 : 0.3) + (f + 0.5) * H * (n > 2 ? 0.46 : 0.26);
          ax = isLeft ? lx + w : lx; ay = ly + 28;
          const ang = isLeft ? Math.PI - f * 1.1 : f * 1.1;
          dx = gx + Math.cos(ang) * rPx * 0.96; dy = gy + Math.sin(ang) * rPx * 0.96;
        }
        it.el.style.width = w + 'px';
        it.el.style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + (ly + (1 - a) * 10).toFixed(1) + 'px,0)';
        it.el.style.opacity = a.toFixed(3);
        const t = clamp(a * 1.3), ex = dx + (ax - dx) * t, ey = dy + (ay - dy) * t;
        it.line.setAttribute('x1', dx.toFixed(1)); it.line.setAttribute('y1', dy.toFixed(1));
        it.line.setAttribute('x2', ex.toFixed(1)); it.line.setAttribute('y2', ey.toFixed(1));
        it.line.setAttribute('opacity', a.toFixed(3));
        it.dot.setAttribute('cx', dx.toFixed(1)); it.dot.setAttribute('cy', dy.toFixed(1)); it.dot.setAttribute('opacity', a.toFixed(3));
      });
    },
    hide() {
      if (!D.shown) return;
      layer.style.visibility = 'hidden'; D.shown = false;
      items.forEach(it => { it.el.style.opacity = '0'; });
    },
    // put everything back (overlay closed / another product)
    reset(jar) {
      this.hide(); hideMeshes(); resetCamera();
      const pt = jar && jar.b && jar.b.userData && jar.b.userData._liquid;
      if (pt) { pt.pivot.rotation.y = pt.restRotY; pt.pivot.position.copy(pt.rest); }
    },
  };
}

export { createLiquidDirector };
