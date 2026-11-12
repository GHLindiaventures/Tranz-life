import { $, a as $$, i as initCart } from "./cart-DFQXMGTx.js";
/* empty css              */
import { W as WebGLRenderer, f as sRGBEncoding, A as ACESFilmicToneMapping, h as Scene, P as PerspectiveCamera, i as envCube, H as HemisphereLight, D as DirectionalLight, G as Group, k as SphereGeometry, C as CylinderGeometry, l as lerp, r as reduce, g as gsapWithCSS, m as MeshPhysicalMaterial, n as MeshStandardMaterial, V as Vector3, M as Mesh, Q as Quaternion, o as Color, s as seeded, p as Sprite, q as SpriteMaterial, t as AdditiveBlending, u as TorusGeometry, v as MeshBasicMaterial, w as BufferGeometry, x as BufferAttribute, y as Points, z as PointsMaterial, I as InstancedMesh, E as Matrix4, F as warmUp, J as CanvasTexture, K as MathUtils, c as clamp, L as smooth } from "./jar-layer-CvE_SCn1.js";
import { N as NSTAGE, R as RX, p as pageProgress, a as initScroll } from "./scroll-animations-BO_1nBQJ.js";
function initMolecule() {
  const canvas = $("#molCanvas");
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = sRGBEncoding;
  renderer.toneMapping = ACESFilmicToneMapping;
  const scene = new Scene();
  const cam = new PerspectiveCamera(35, 1, 0.1, 50);
  cam.position.set(0, 0, 15.5);
  scene.environment = envCube();
  scene.add(new HemisphereLight(15791328, 1714202, 0.6));
  const dl = new DirectionalLight(16771268, 1.6);
  dl.position.set(4, 6, 5);
  scene.add(dl);
  const holder = new Group();
  scene.add(holder);
  let mol = null;
  const sphere = new SphereGeometry(1, 32, 24), cyl = new CylinderGeometry(0.09, 0.09, 1, 12);
  function rng(seed) {
    let s = seed * 9301 + 49297;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  function build(herb) {
    const R = rng(herb.seed), g = new Group();
    const main = new MeshPhysicalMaterial({ color: herb.color, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
    const cream = new MeshPhysicalMaterial({ color: 15721669, roughness: 0.3, clearcoat: 0.8 });
    const gold = new MeshPhysicalMaterial({ color: 15189632, roughness: 0.2, metalness: 0.5, clearcoat: 1 });
    const bondM = new MeshStandardMaterial({ color: 13620928, roughness: 0.4 });
    const atoms = [new Vector3()];
    const ringN = 6;
    for (let i = 1; i < ringN; i++) {
      const a = i / ringN * Math.PI * 2;
      atoms.push(new Vector3(Math.cos(a) * 1.4 - 1.4, Math.sin(a) * 1.4, (R() - 0.5) * 0.4));
    }
    const bonds = [];
    for (let i = 0; i < ringN; i++) bonds.push([i, (i + 1) % ringN]);
    const extra = 7 + Math.floor(R() * 7);
    for (let i = 0; i < extra; i++) {
      const from = Math.floor(R() * atoms.length);
      let v;
      for (let tries = 0; tries < 20; tries++) {
        const dir = new Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize().multiplyScalar(1.35);
        v = atoms[from].clone().add(dir);
        if (atoms.every((a) => a.distanceTo(v) > 1.05)) break;
      }
      atoms.push(v);
      bonds.push([from, atoms.length - 1]);
    }
    const center = atoms.reduce((s, a) => s.add(a.clone()), new Vector3()).multiplyScalar(1 / atoms.length);
    atoms.forEach((a, i) => {
      a.sub(center);
      const big = i < ringN || R() > 0.55;
      const m = new Mesh(sphere, i < ringN ? main : R() > 0.7 ? gold : big ? main : cream);
      m.scale.setScalar(big ? 0.42 : 0.27);
      m.position.copy(a);
      g.add(m);
    });
    bonds.forEach(([a, b]) => {
      const A = atoms[a], B = atoms[b];
      const m = new Mesh(cyl, bondM);
      m.position.copy(A).lerp(B, 0.5);
      m.scale.y = A.distanceTo(B);
      m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), B.clone().sub(A).normalize());
      g.add(m);
    });
    return g;
  }
  function show(herb) {
    const next = build(herb);
    next.scale.setScalar(1e-3);
    holder.add(next);
    const old = mol;
    mol = next;
    {
      gsapWithCSS.to(next.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: "elastic.out(1,.6)" });
      gsapWithCSS.fromTo(holder.rotation, { y: holder.rotation.y }, { y: holder.rotation.y + Math.PI, duration: 1.2, ease: "power3.out" });
      if (old) gsapWithCSS.to(old.scale, { x: 1e-3, y: 1e-3, z: 1e-3, duration: 0.4, ease: "power2.in", onComplete: () => holder.remove(old) });
    }
  }
  const st = { drag: false, lx: 0, ly: 0, vx: 4e-3, vy: 0, visible: false };
  canvas.addEventListener("pointerdown", (e) => {
    st.drag = true;
    st.lx = e.clientX;
    st.ly = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!st.drag) return;
    st.vx = (e.clientX - st.lx) * 8e-3;
    st.vy = (e.clientY - st.ly) * 8e-3;
    st.lx = e.clientX;
    st.ly = e.clientY;
  });
  ["pointerup", "pointercancel"].forEach((ev) => canvas.addEventListener(ev, () => st.drag = false));
  let rafId = null;
  function loop() {
    if (!st.visible) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(loop);
    holder.rotation.y += st.vx;
    holder.rotation.x += st.vy;
    if (!st.drag) {
      st.vx = lerp(st.vx, reduce ? 0 : 4e-3, 0.03);
      st.vy = lerp(st.vy, 0, 0.05);
      holder.rotation.x = lerp(holder.rotation.x, 0.25, 0.01);
    }
    renderer.render(scene, cam);
  }
  const observer = new IntersectionObserver((es2) => {
    es2.forEach((en) => {
      st.visible = en.isIntersecting;
      if (st.visible && !rafId) {
        rafId = requestAnimationFrame(loop);
      }
    });
  }, { rootMargin: "100px 0px" });
  observer.observe(canvas);
  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    cam.aspect = r.width / Math.max(1, r.height);
    cam.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();
  return {
    show,
    destroy: () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    }
  };
}
const ATOMCOL = { leaf: 6267450, deep: 2910772, gold: 14394431, sage: 10273402, cream: 15391654, bark: 9202234, mint: 6274971, white: 16184036, lilac: 10127049 };
const ring = (n, r, col, rad, z = 0) => Array.from({ length: n }, (_, i) => {
  const a = i / n * Math.PI * 2;
  return [Math.cos(a) * r, Math.sin(a) * r, Math.sin(i * 2.1) * z, col, rad];
});
const SEED = { atoms: [...ring(6, 1.25, "leaf", 0.42, 0.25), [2.3, 0.9, 0.2, "gold", 0.3]], bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6]] };
const FRAGS = [
  { atoms: [[0, 0, 0, "gold", 0.4], [0.85, -0.62, 0.1, "white", 0.25], [-0.85, -0.62, -0.1, "white", 0.25]], bonds: [[0, 1], [0, 2]], anchor: 0 },
  { atoms: [[-1.15, 0, 0, "sage", 0.32], [0, 0, 0, "bark", 0.34], [1.15, 0, 0, "sage", 0.32]], bonds: [[0, 1], [1, 2]], anchor: 0 },
  { atoms: ring(5, 0.95, "cream", 0.3, 0.15), bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], anchor: 0 },
  { atoms: [[0, 0, 0, "gold", 0.36], [0.95, 0.55, 0, "mint", 0.28], [-0.95, 0.55, 0.1, "mint", 0.28], [0, -1.05, -0.1, "mint", 0.28]], bonds: [[0, 1], [0, 2], [0, 3]], anchor: 3 },
  { atoms: [[-1.3, 0.35, 0, "deep", 0.3], [-0.45, -0.25, 0.1, "deep", 0.34], [0.45, 0.25, -0.1, "deep", 0.34], [1.3, -0.35, 0, "mint", 0.3]], bonds: [[0, 1], [1, 2], [2, 3]], anchor: 0 },
  { atoms: [...ring(5, 0.85, "gold", 0.28, 0.1), [0, 0, 0.2, "cream", 0.36]], bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [5, 0], [5, 2], [5, 3]], anchor: 0 }
];
const THETA = [0.35, -0.45, 0.6, -0.3, 0.5, -0.55];
function bestView(pos, atoms, yawLo, yawHi, pitches) {
  const ids = [...pos.keys()], P = ids.map((id) => pos.get(id)), Rr = ids.map((id) => atoms[id].rad), n = ids.length;
  let best = { sc: -1e9, yaw: yawLo, pitch: 0 };
  const X = new Float32Array(n), Yv = new Float32Array(n);
  pitches.forEach((pitch) => {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    for (let yaw = yawLo; yaw <= yawHi; yaw += 0.04) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (let i = 0; i < n; i++) {
        const v = P[i], a = v.x * cy + v.z * sy, z = -v.x * sy + v.z * cy;
        X[i] = a;
        Yv[i] = v.y * cp - z * sp;
        x0 = Math.min(x0, a);
        x1 = Math.max(x1, a);
        y0 = Math.min(y0, Yv[i]);
        y1 = Math.max(y1, Yv[i]);
      }
      let sc = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const d = Math.hypot(X[i] - X[j], Yv[i] - Yv[j]);
        sc += Math.min(1, d / ((Rr[i] + Rr[j]) * 1.4));
      }
      sc -= 1.1 * Math.max(x1 - x0, (y1 - y0) * 1.4) + Math.abs(pitch) * 1.2;
      if (sc > best.sc) best = { sc, yaw, pitch };
    }
  });
  return best;
}
function buildChain() {
  const THREEV = (a) => new Vector3(a[0], a[1], a[2]);
  const R = seeded(11);
  const atoms = [], bonds = [], stages = [];
  const addAtom = (def, stage) => {
    atoms.push({ stage, base: new Color(ATOMCOL[def[3]]), rad: def[4], frames: {}, dock: null });
    return atoms.length - 1;
  };
  let cur = /* @__PURE__ */ new Map();
  const seedIds = SEED.atoms.map((d) => addAtom(d, -1));
  const sc0 = SEED.atoms.reduce((s, d) => s.add(THREEV(d)), new Vector3()).multiplyScalar(1 / SEED.atoms.length);
  SEED.atoms.forEach((d, i) => cur.set(seedIds[i], THREEV(d).sub(sc0)));
  SEED.bonds.forEach(([i, j]) => bonds.push({ i: seedIds[i], j: seedIds[j], stage: -1, t0: -1, t1: -1 }));
  const frames = [new Map(cur)];
  const Y = new Vector3(0, 1, 0);
  const YAW = [0];
  let PITCH = 0;
  for (let k = 0; k < NSTAGE; k++) {
    const F = FRAGS[k], yaw = YAW[k];
    const w = new Vector3(Math.cos(THETA[k]), Math.sin(THETA[k]) * 0.65, 0.32).normalize();
    const d = w.clone().applyAxisAngle(Y, -yaw);
    let aId = -1, best = -1e9;
    cur.forEach((v, id) => {
      const s = v.dot(d);
      if (s > best) {
        best = s;
        aId = id;
      }
    });
    const ids = F.atoms.map((def) => addAtom(def, k));
    const loc = F.atoms.map(THREEV);
    const cen = loc.reduce((s, v) => s.add(v), new Vector3()).multiplyScalar(1 / loc.length);
    let u = loc[F.anchor].clone().sub(cen);
    if (u.length() < 0.01) u.set(1, 0, 0);
    u.normalize();
    const q = new Quaternion().setFromUnitVectors(u, d.clone().negate());
    const tw = new Quaternion().setFromAxisAngle(d, (R() - 0.5) * 1.6);
    q.premultiply(tw);
    const bondLen = atoms[aId].rad + F.atoms[F.anchor][4] + 0.55;
    const placed = /* @__PURE__ */ new Map();
    let push = 0;
    for (let tries = 0; tries < 8; tries++) {
      placed.clear();
      const origin = cur.get(aId).clone().add(d.clone().multiplyScalar(bondLen + push));
      F.atoms.forEach((def, i) => placed.set(ids[i], loc[i].clone().sub(loc[F.anchor]).applyQuaternion(q).add(origin)));
      let ok = true;
      placed.forEach((pv, pid) => {
        cur.forEach((cv, cid) => {
          if (cid !== aId && pv.distanceTo(cv) < (atoms[pid].rad + atoms[cid].rad) * 1.5) ok = false;
        });
      });
      if (ok) break;
      push += 0.25;
    }
    const aDock = ids[F.anchor];
    F.bonds.forEach(([i, j]) => bonds.push({ i: ids[i], j: ids[j], stage: k, t0: -1, t1: -1 }));
    bonds.push({ i: aId, j: aDock, stage: k, t0: 0.46, t1: 0.58 });
    let rb = null, rd = 1e9;
    placed.forEach((pv, pid) => {
      if (pid === aDock) return;
      cur.forEach((cv, cid) => {
        if (cid === aId) return;
        const dd = pv.distanceTo(cv);
        if (dd < rd) {
          rd = dd;
          rb = [cid, pid];
        }
      });
    });
    if (rb && rd < 2.5) bonds.push({ i: rb[0], j: rb[1], stage: k, t0: 0.64, t1: 0.74 });
    const pre = new Map(cur);
    placed.forEach((v, id) => pre.set(id, v));
    const cn = new Vector3();
    pre.forEach((v) => cn.add(v));
    cn.multiplyScalar(1 / pre.size);
    const shift = cn.clone().negate();
    let Rpre = 0;
    pre.forEach((v, id) => {
      Rpre = Math.max(Rpre, v.length() + atoms[id].rad);
    });
    const next = /* @__PURE__ */ new Map();
    pre.forEach((v, id) => next.set(id, v.clone().add(shift)));
    let Rpost = 0;
    next.forEach((v, id) => {
      Rpost = Math.max(Rpost, v.length() + atoms[id].rad);
    });
    const J = cur.get(aId).clone().add(placed.get(aDock)).multiplyScalar(0.5);
    stages.push({ ids, aId, aDock, d, placed, shift, J, Rpre, Rpost, ring: rb && rd < 2.5 ? rb : null, start: cur.size });
    cur = next;
    frames.push(new Map(cur));
    const last = k === NSTAGE - 1, bv = bestView(cur, atoms, YAW[k] + 0.5, YAW[k] + 2.7, last ? [-0.4, -0.25, -0.1, 0, 0.1, 0.25, 0.4] : [0]);
    YAW.push(bv.yaw);
    if (last) PITCH = bv.pitch;
  }
  return { atoms, bonds, stages, frames, yaw: YAW, pitch: PITCH };
}
function radialCanvas(inner, outer = "rgba(0,0,0,0)", size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner);
  gr.addColorStop(1, outer);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}
function initReactor(getProgress) {
  const canvas = $("#reactCanvas"), pin = $("#pin"), tag = $("#molTag");
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = sRGBEncoding;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new Scene();
  scene.environment = envCube();
  const cam = new PerspectiveCamera(35, 1, 0.1, 80);
  cam.position.set(0, 0, 15);
  scene.add(new HemisphereLight(15922658, 2372895, 0.6));
  const key = new DirectionalLight(16773327, 1.7);
  key.position.set(4, 7, 8);
  scene.add(key);
  const rim = new DirectionalLight(12576424, 0.9);
  rim.position.set(-6, 2, -5);
  scene.add(rim);
  const T = (c) => {
    const t = new CanvasTexture(c);
    t.encoding = sRGBEncoding;
    return t;
  };
  const sparkTex = T(radialCanvas("rgba(255,244,214,1)", "rgba(255,220,150,0)", 64));
  const world = new Group();
  scene.add(world);
  const molG = new Group();
  world.add(molG);
  const CH = buildChain();
  const sphere = new SphereGeometry(1, 40, 28), cyl = new CylinderGeometry(1, 1, 1, 18, 1, true);
  const atomMesh = CH.atoms.map((a) => {
    const m = new Mesh(sphere, new MeshPhysicalMaterial({ color: a.base, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.2, emissive: 0 }));
    m.scale.setScalar(a.rad);
    m.visible = false;
    molG.add(m);
    return m;
  });
  const bondMat = new MeshStandardMaterial({ color: 14147528, roughness: 0.35, metalness: 0.05, envMapIntensity: 0.8 });
  const bondMesh = CH.bonds.map(() => {
    const m = new Mesh(cyl, bondMat);
    m.visible = false;
    molG.add(m);
    return m;
  });
  const flash = new Sprite(new SpriteMaterial({ map: sparkTex, color: 16769696, transparent: true, depthWrite: false, blending: AdditiveBlending }));
  flash.visible = false;
  molG.add(flash);
  const shock = new Mesh(new TorusGeometry(1, 0.011, 8, 120), new MeshBasicMaterial({ color: 14722362, transparent: true, depthWrite: false }));
  shock.visible = false;
  molG.add(shock);
  const NS = 36, sp = new Float32Array(NS * 3), sdir = [];
  {
    const R = seeded(5);
    for (let i = 0; i < NS; i++) {
      const v = new Vector3(R() - 0.5, R() - 0.5, R() - 0.5).normalize().multiplyScalar(0.6 + R() * 1.2);
      sdir.push(v);
    }
  }
  const sgeo = new BufferGeometry();
  sgeo.setAttribute("position", new BufferAttribute(sp, 3));
  const sparks = new Points(sgeo, new PointsMaterial({ size: 0.34, map: sparkTex, color: 16770728, transparent: true, depthWrite: false, blending: AdditiveBlending }));
  sparks.frustumCulled = false;
  sparks.visible = false;
  molG.add(sparks);
  const by = new Group();
  molG.add(by);
  by.visible = false;
  [[0, 0, 0, 0.2, 16184036], [0.38, -0.28, 0, 0.13, 12575743], [-0.38, -0.28, 0, 0.13, 12575743]].forEach(([x, y, z, r, c]) => {
    const m = new Mesh(sphere, new MeshPhysicalMaterial({ color: c, roughness: 0.15, clearcoat: 1, envMapIntensity: 1.2, transparent: true }));
    m.position.set(x, y, z);
    m.scale.setScalar(r);
    by.add(m);
  });
  const halo = new Sprite(new SpriteMaterial({ map: sparkTex, color: 16767370, transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 }));
  halo.scale.setScalar(13);
  halo.position.z = -2;
  world.add(halo);
  const crown = new Mesh(new TorusGeometry(4.1, 0.02, 8, 160), new MeshBasicMaterial({ color: 15189632, transparent: true, opacity: 0, depthWrite: false }));
  crown.rotation.x = 1.15;
  world.add(crown);
  const AN = 30, amb = new InstancedMesh(sphere, new MeshStandardMaterial({ roughness: 0.4, transparent: true, opacity: 0.42, envMapIntensity: 0.6 }), AN), ambD = [];
  {
    const R = seeded(23), c = new Color();
    for (let i = 0; i < AN; i++) {
      ambD.push({ x: (R() - 0.5) * 34, y: (R() - 0.5) * 18, z: -4 - R() * 12, s: 0.1 + R() * 0.24, sp: 0.4 + R() * 1.2 });
      c.setHex([6267450, 2910772, 14394431, 10273402][i % 4]);
      amb.setColorAt(i, c);
    }
  }
  scene.add(amb);
  const ambM = new Matrix4(), ambS = new Vector3();
  const slidesEl = $("#slides"), ringEl = $("#wipeRing");
  const pipe = (k) => `<div class="pipe" aria-hidden="true"><div class="pipe-line"><i></i></div><ol>${RX.map((r, i) => `<li class="${i <= k ? "lit" : ""}${i === k ? " cur" : ""}"><em></em><b>${String(i + 1).padStart(2, "0")}</b><span>${r.t}</span></li>`).join("")}</ol></div>`;
  slidesEl.innerHTML = RX.map((r, k) => `
    <article class="slide ${k % 2 === 0 ? "t-cream" : "t-green"}" data-k="${k}">
      <div class="halo"></div>
      <div class="slide-copy">
        <p class="eyebrow">The TranzLife pipeline</p>
        <p class="st-no"><b>${String(k + 1).padStart(2, "0")}</b> / ${String(NSTAGE).padStart(2, "0")}</p>
        <h3 class="st-title">${r.t}</h3>
        <div class="eq"><span class="m">${r.a}</span><i>+</i><span class="m">${r.b}</span><i>→</i><span class="m out">${r.p}</span></div>
        <p class="st-desc">${r.d}</p>
        <div class="spec">${r.s.map((x) => `<span>${x}</span>`).join("")}</div>
      </div>
      ${pipe(k)}
    </article>`).join("");
  const slides = $$(".slide", slidesEl);
  slides.forEach((s) => s.addEventListener("click", (e) => {
    const li = e.target.closest(".pipe li");
    if (li) window.dispatchEvent(new CustomEvent("tl:goStage", { detail: [...li.parentNode.children].indexOf(li) }));
  }));
  $$(".pipe li").forEach((li) => li.style.pointerEvents = "auto");
  const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3), easeInCubic = (x) => x * x * x, easeIO = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const easeOutBack = (x) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  };
  const bump = (u, c, w) => Math.exp(-Math.pow((u - c) / w, 2));
  const Sk = CH.stages.map((s) => Math.min(1, 3.35 / s.Rpre)), Sk1 = CH.stages.map((s) => Math.min(1, 3.35 / s.Rpost));
  const spinAxis = new Vector3(0.3, 1, 0.2).normalize(), up = new Vector3(0, 1, 0);
  const tmpQ = new Quaternion(), tmpV = new Vector3(), tmpV2 = new Vector3(), tmpC = new Color();
  const posCache = CH.atoms.map(() => new Vector3());
  const palCream = new Color(2902572), palGreen = new Color(14147528);
  let W = 1, H = 1, fit = 1, mobile = false, cur = 0, target = 0, visible = false, tNow = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    cam.aspect = W / H;
    cam.updateProjectionMatrix();
    const halfH = Math.tan(MathUtils.degToRad(17.5)) * 15, halfW = halfH * cam.aspect;
    mobile = W < 760 || cam.aspect < 0.9;
    if (!mobile) {
      world.position.set(halfW * 0.44, -0.2, 0);
      fit = Math.min(1.05, halfW * 0.5 / 3.7, halfH * 0.86 / 3.7);
    } else {
      world.position.set(0, halfH * 0.3, 0);
      fit = Math.min(1, halfW * 0.86 / 3.7, halfH * 0.4 / 3.7);
    }
    halo.position.set(0, 0, -2);
    crown.scale.setScalar(Math.max(0.55, fit * 0.9));
  }
  function apply(p) {
    const s = clamp(p, 0, 1) * NSTAGE;
    const k = Math.min(NSTAGE - 1, Math.floor(s));
    const u = Math.min(1, s - k);
    const ST = CH.stages[k], frame2 = CH.frames[k];
    const eShift = easeIO(clamp((u - 0.78) / 0.17, 0, 1));
    const t1 = clamp((u - 0.04) / 0.38, 0, 1), t2 = clamp((u - 0.42) / 0.18, 0, 1);
    const gap = tmpV2.copy(ST.d).multiplyScalar(1.05);
    const off0 = ST.d.clone().multiplyScalar(10.5).add(new Vector3(0, 4.2, 0));
    const off = new Vector3();
    if (u < 0.42) {
      const e = easeOutCubic(t1);
      off.copy(off0).lerp(gap, e);
      off.y += Math.abs(Math.sin(t1 * Math.PI * 3)) * (1.9 * (1 - t1) + 0.28);
    } else off.copy(gap).multiplyScalar(1 - easeInCubic(t2));
    const theta = u < 0.42 ? (1 - easeIO(t1)) * Math.PI * 5 : 0;
    tmpQ.setFromAxisAngle(spinAxis, theta);
    const dockB = ST.placed.get(ST.aDock);
    const colF = easeOutCubic(clamp((u - 0.6) / 0.18, 0, 1));
    const snap = bump(u, 0.6, 0.025), pulse = 1 + 0.07 * snap;
    CH.atoms.forEach((a, id) => {
      const m = atomMesh[id];
      if (a.stage > k) {
        m.visible = false;
        return;
      }
      const pv = posCache[id];
      let scale = a.rad;
      a.base;
      if (a.stage < k) {
        const base = frame2.get(id);
        pv.copy(base).addScaledVector(ST.shift, eShift);
      } else {
        const dp = ST.placed.get(id);
        tmpV.copy(dp).sub(dockB).applyQuaternion(tmpQ);
        pv.copy(dockB).add(off).add(tmpV).addScaledVector(ST.shift, eShift);
        if (u < 0.04) scale = a.rad * 1e-3;
      }
      if (k === 0 && a.stage === -1) {
        scale = a.rad * easeOutBack(clamp(p * NSTAGE / 0.1, 0, 1));
        if (scale < 1e-3) scale = 1e-3;
      }
      m.visible = true;
      m.position.copy(pv);
      m.scale.setScalar(scale * (1 + 0.03 * Math.sin(tNow * 2 + id)));
      const mat = m.material;
      if (a.stage === k) {
        tmpC.copy(a.base).lerp(CH.atoms[ST.aId].base, 0.45 * colF);
        mat.color.copy(tmpC);
      } else if (a.stage >= 0 && a.stage < k) mat.color.copy(a.base).lerp(CH.atoms[CH.stages[a.stage].aId].base, 0.45);
      else mat.color.copy(a.base);
      const glow = snap * 0.5 + (k === NSTAGE - 1 ? easeOutCubic(clamp((u - 0.8) / 0.2, 0, 1)) * 0.22 : 0);
      mat.emissive.setRGB(glow * 0.9, glow * 0.7, glow * 0.3);
    });
    const tcream = k % 2 === 0 ? 1 : 0, nextCream = (k + 1) % 2 === 0 ? 1 : 0;
    const wp = u > 0.86 && k < NSTAGE - 1 ? easeIO((u - 0.86) / 0.14) : 0;
    const tc = lerp(tcream, nextCream, wp);
    bondMat.color.copy(palGreen).lerp(palCream, tc);
    CH.bonds.forEach((b, bi) => {
      const m = bondMesh[bi];
      const A = atomMesh[b.i], B = atomMesh[b.j];
      if (CH.atoms[b.i].stage > k || CH.atoms[b.j].stage > k || b.stage > k) {
        m.visible = false;
        return;
      }
      let g = 1;
      if (b.stage === k && b.t0 >= 0) g = easeOutBack(clamp((u - b.t0) / (b.t1 - b.t0), 0, 1));
      else if (b.stage > k) g = 0;
      if (b.stage === -1 && k === 0) g = Math.min(1, A.scale.x > 0.01 ? 1 : 0);
      if (b.stage === k && b.t0 < 0 && u < 0.04) g = 0;
      if (g <= 1e-3) {
        m.visible = false;
        return;
      }
      const pa = A.position, pb = B.position;
      tmpV.copy(pb).sub(pa);
      const L = tmpV.length();
      if (L < 0.01) {
        m.visible = false;
        return;
      }
      tmpV.multiplyScalar(1 / L);
      m.position.copy(pa).addScaledVector(tmpV, L * 0.5);
      m.quaternion.setFromUnitVectors(up, tmpV);
      m.scale.set(0.085 * (1 + 0.5 * snap), L * Math.min(g, 1.04), 0.085 * (1 + 0.5 * snap));
      m.visible = true;
    });
    const J = tmpV2.copy(ST.J).addScaledVector(ST.shift, eShift);
    const fl = bump(u, 0.6, 0.022);
    flash.visible = fl > 0.02;
    flash.position.copy(J);
    flash.scale.setScalar(0.8 + fl * 5.5);
    flash.material.opacity = Math.min(1, fl * 1.1);
    const ts = clamp((u - 0.58) / 0.22, 0, 1);
    shock.visible = ts > 0 && ts < 1;
    if (shock.visible) {
      shock.position.copy(J);
      shock.quaternion.copy(cam.quaternion);
      shock.scale.setScalar(0.3 + easeOutCubic(ts) * 3.3);
      shock.material.opacity = (1 - ts) * 0.8;
    }
    const tp = clamp((u - 0.58) / 0.28, 0, 1);
    sparks.visible = tp > 0 && tp < 1;
    if (sparks.visible) {
      for (let i = 0; i < NS; i++) {
        const v = sdir[i], e = easeOutCubic(tp);
        sp[i * 3] = J.x + v.x * e * 2.6;
        sp[i * 3 + 1] = J.y + v.y * e * 2.6 - tp * tp * 0.6;
        sp[i * 3 + 2] = J.z + v.z * e * 2.6;
      }
      sgeo.attributes.position.needsUpdate = true;
      sparks.material.opacity = (1 - tp) * 0.95;
    }
    const tb = clamp((u - 0.6) / 0.34, 0, 1);
    by.visible = tb > 0 && tb < 1;
    if (by.visible) {
      const e = easeOutCubic(tb);
      by.position.copy(J).addScaledVector(tmpV.set(ST.d.x * 0.4 + 0.5, 1, ST.d.z * 0.4), 5.2 * e);
      by.position.y += Math.sin(tb * Math.PI) * 0.8;
      by.rotation.set(tb * 6, tb * 8, 0);
      by.scale.setScalar(1 - tb * tb);
      by.children.forEach((c) => c.material.opacity = 1 - tb * tb);
    }
    const sc = lerp(Sk[k], Sk1[k], eShift);
    const eY = easeIO(clamp((u - 0.78) / 0.22, 0, 1)), lastK = k === NSTAGE - 1;
    const yaw = CH.yaw[k] + eY * (CH.yaw[k + 1] - CH.yaw[k]) + Math.sin(p * 60) * 0.035 * (lastK ? 1 - eY : 1);
    molG.rotation.set(0.18 * Math.sin(p * 18) * (lastK ? 1 - eY : 1) + (lastK ? CH.pitch * eY : 0), yaw, 0);
    molG.scale.setScalar(sc * fit * pulse * (k === NSTAGE - 1 ? 1 + 0.3 * easeOutCubic(clamp((u - 0.8) / 0.2, 0, 1)) : 1));
    const fin = k === NSTAGE - 1 ? easeOutCubic(clamp((u - 0.78) / 0.22, 0, 1)) : 0;
    halo.material.opacity = fin * 0.55;
    halo.scale.setScalar(11 + fin * 5);
    crown.material.opacity = fin * 0.55;
    crown.rotation.z = p * 30;
    amb.material.color.copy(palGreen).lerp(palCream, tc);
    const hW = Math.tan(MathUtils.degToRad(17.5)) * 15 * cam.aspect, hH = Math.tan(MathUtils.degToRad(17.5)) * 15;
    ambD.forEach((a, i) => {
      const ax = a.x + Math.sin(tNow * 0.4 * a.sp + i) * 0.5, ay = (a.y + p * 30 * a.sp + 9) % 18 - 9;
      const vis = mobile ? smooth(-hH * 0.05, hH * 0.35, ay * (15 / (15 - a.z))) : smooth(-hW * 0.1, hW * 0.2, ax * (15 / (15 - a.z)));
      const sz = a.s * vis;
      tmpV.set(ax, ay, a.z);
      tmpQ.identity();
      ambM.compose(tmpV, tmpQ, ambS.set(sz, sz, sz));
      amb.setMatrixAt(i, ambM);
    });
    amb.instanceMatrix.needsUpdate = true;
    slides.forEach((el, i) => {
      const on = i === k || i === k + 1 && wp > 0;
      if (el.hidden === on) el.hidden = !on;
    });
    const cs = slides[k], ns = slides[k + 1];
    cs.style.zIndex = 1;
    cs.style.clipPath = "none";
    const diag = Math.hypot(W, H);
    if (ns && wp > 0) {
      const Rr = wp * diag * 1.06;
      ns.style.zIndex = 2;
      ns.style.clipPath = `circle(${Rr}px at 50% 100%)`;
      const cp = $(".slide-copy", ns);
      cp.style.transform = `translateY(${(1 - wp) * 36}px)`;
      cp.style.opacity = 0.35 + 0.65 * wp;
      ringEl.style.display = "block";
      ringEl.style.width = ringEl.style.height = Rr * 2 + "px";
      ringEl.style.left = W / 2 - Rr + "px";
      ringEl.style.top = H - Rr + "px";
      ringEl.style.opacity = 1 - wp * 0.9;
    } else {
      ringEl.style.display = "none";
      if (ns) {
        ns.style.clipPath = "circle(0px at 50% 100%)";
      }
    }
    $(".slide-copy", cs).style.transform = "";
    $(".slide-copy", cs).style.opacity = k === 0 ? clamp(p * NSTAGE / 0.06, 0, 1) : 1;
    const fill = (k + 0.5) / NSTAGE + wp / NSTAGE;
    pin.style.setProperty("--fill", fill.toFixed(4));
    const tagOn = u > 0.8 || k === NSTAGE - 1 && u > 0.7;
    tag.textContent = RX[k].p;
    tag.classList.toggle("on", tagOn && wp < 0.5);
    const halfH = Math.tan(MathUtils.degToRad(17.5)) * 15, rpx = Math.min(H * 0.3, 3.5 * sc * fit / halfH * (H / 2));
    tag.style.left = W / 2 + world.position.x / (halfH * cam.aspect) * (W / 2) + "px";
    tag.style.top = H / 2 - world.position.y / halfH * (H / 2) + rpx + 14 + "px";
    const prevTheme = lastTheme;
    lastTheme = wp > 0.6 ? (k + 1) % 2 === 0 ? "cream" : "green" : k % 2 === 0 ? "cream" : "green";
    if (prevTheme !== lastTheme) {
      window.dispatchEvent(new CustomEvent("tl:reactor-theme", { detail: lastTheme }));
    }
    activeStage = wp > 0.5 ? Math.min(k + 1, NSTAGE - 1) : k;
  }
  let lastTheme = "cream", activeStage = 0;
  const processSec = $("#process") || pin;
  let isSecVisible = false, rafId = null;
  let last = performance.now();
  function frame(now) {
    if (!isSecVisible) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1e3);
    last = now;
    tNow += dt;
    const st = getProgress();
    visible = st.visible;
    if (!visible) return;
    target = st.p;
    const diff = target - cur;
    cur += diff * (1 - Math.exp(-dt * (reduce ? 60 : 9)));
    if (Math.abs(target - cur) < 1e-5) cur = target;
    apply(cur);
    renderer.render(scene, cam);
  }
  window.addEventListener("resize", resize);
  resize();
  apply(0);
  warmUp(renderer, scene, cam);
  const observer = new IntersectionObserver((entries) => {
    isSecVisible = entries[0].isIntersecting;
    if (isSecVisible) {
      last = performance.now();
      if (!rafId) rafId = requestAnimationFrame(frame);
    }
  }, { rootMargin: "150px 0px" });
  if (processSec) observer.observe(processSec);
  return {
    resize,
    theme: () => lastTheme,
    stage: () => activeStage,
    count: NSTAGE,
    destroy: () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    }
  };
}
const LAB = [
  { n: "PulmoClear™ & Craving Control", d: "Lung detox gummies & aromatherapy cessation inhalers", p: 100, st: "Commercial Ready", eta: "Live", live: true },
  { n: "LiverDetox™ Polyherbal Concoction", d: "Classical 500 ml hepatic cleansing formula", p: 100, st: "Commercial Ready", eta: "Live", live: true },
  { n: "CycleRelief™ & Reviva™ Roll-Ons", d: "Menstrual relief & blood sugar support roll-ons", p: 100, st: "Commercial Ready", eta: "Live", live: true },
  { n: "TranzLife Rasayana Elite", d: "Capsule, Gummies & Effervescent (Ashwagandha, Shilajit, Curcumin C3)", p: 85, st: "Clinical Pilot", eta: "Q1 2027" },
  { n: "Femina™ Women’s Health Range", d: "Marine Collagen, Biotin, Shatavari, Lodhra & Iron", p: 74, st: "Pilot Batching", eta: "Q2 2027" },
  { n: "Viryamax™ Men’s Stamina Suite", d: "Ashwagandha KSM-66, Shilajit, Ginseng, L-Arginine", p: 62, st: "Formulation", eta: "Q3 2027" },
  { n: "KidZen™ Paediatric Growth & Focus", d: "Calcium D3+K2, DHA, Shankhpushpi & Organic Amla", p: 50, st: "Formulation", eta: "Q4 2027" },
  { n: "Autism Spectrum Disorder (ASD)", d: "Bioactive exploration: Bacopa monnieri, Juglans regia, Curcuma caesia", p: 28, st: "Discovery", eta: "2028" },
  { n: "Oncology / Cancer Bioactive Program", d: "Targeting Annonaceous acetogenins from Annona muricata", p: 20, st: "Preclinical Assay", eta: "2028" }
];
function buildLab() {
  $("#board").insertAdjacentHTML("beforeend", LAB.map((l) => `
    <div class="b-row">
      <div class="b-name"><b>${l.n}</b><small>${l.d}</small></div>
      <div class="b-bar${l.live ? " live" : ""}" role="img" aria-label="${l.n}: ${l.st}, ${l.p}% through the pipeline"><i style="--p:${l.p}%" data-stage="${l.st}"></i></div>
      <div class="b-eta"><b>${l.eta}</b>${l.live ? "In stores" : "Target"}</div>
    </div>`).join(""));
}
const SCIENCE_HERBS = [
  {
    id: "peppermint",
    n: "Peppermint",
    latin: "Mentha × piperita",
    part: "Steam-distilled leaf oil",
    cmp: "L-Menthol",
    formula: "C₁₀H₂₀O",
    mw: "156.27 g/mol",
    target: "TRPM8 Cold Receptor Agonist",
    color: 6202218,
    seed: 23,
    product: "Calm Roll-On",
    productId: "rollon",
    txt: "Natural menthol triggers peripheral TRPM8 thermosensory receptors, generating a sustained physiological cooling sensation that relieves localized tension, eases mental fatigue, and calms sensory nerve hyper-reactivity without tissue temperature drop.",
    metrics: { bioavailability: "+290%", onset: "3-5 mins", retention: "4.5 hrs" }
  },
  {
    id: "rosemary",
    n: "Rosemary",
    latin: "Salvia rosmarinus",
    part: "CO₂ needle extract",
    cmp: "1,8-Cineole (Eucalyptol)",
    formula: "C₁₀H₁₈O",
    mw: "154.25 g/mol",
    target: "AChE Neuro-Inhibitor & Vasodilator",
    color: 7771730,
    seed: 29,
    product: "Focus Gummies & Calm Roll-On",
    productId: "gummies",
    txt: "Standardized 1,8-cineole passes the blood-brain barrier with high lipophilic affinity, inhibiting acetylcholinesterase to sustain acetylcholine availability. This promotes uninterrupted executive focus, mental clarity, and cerebral microcirculation.",
    metrics: { bioavailability: "+310%", onset: "8-12 mins", retention: "6.0 hrs" }
  },
  {
    id: "rose",
    n: "Damask Rose",
    latin: "Rosa damascena",
    part: "Hydro-distilled fresh petals",
    cmp: "Geraniol & Citronellol",
    formula: "C₁₀H₁₈O",
    mw: "154.25 g/mol",
    target: "GABA-A Allosteric Modulation",
    color: 14057614,
    seed: 31,
    product: "Calm Roll-On",
    productId: "rollon",
    txt: "Aromatic monoterpenoids in Rosa damascena gently stimulate autonomic olfactory-limbic pathways, blunting acute cortisol secretion and facilitating parasympathetic rest without motor sedation or day-after drowsiness.",
    metrics: { bioavailability: "+280%", onset: "5-10 mins", retention: "5.2 hrs" }
  },
  {
    id: "tulsi",
    n: "Holy Basil (Tulsi)",
    latin: "Ocimum tenuiflorum",
    part: "Flowering aerial tops",
    cmp: "Eugenol & Ursolic Acid",
    formula: "C₁₀H₁₂O₂",
    mw: "164.20 g/mol",
    target: "COX-2 & 5-LOX Enzyme Suppression",
    color: 7249723,
    seed: 3,
    product: "Forest Breathe Inhaler",
    productId: "inhaler",
    txt: "Eugenol and triterpenic ursolic acid downregulate inflammatory cyclooxygenase pathways, shielding respiratory epithelial membranes from ambient oxidative stress and urban particulate micro-pollutants.",
    metrics: { bioavailability: "+330%", onset: "10-15 mins", retention: "6.8 hrs" }
  },
  {
    id: "eucalyptus",
    n: "Tasmanian Blue Gum",
    latin: "Eucalyptus globulus",
    part: "Supercritical fresh leaf oil",
    cmp: "1,8-Cineole (99.2% Standardized)",
    formula: "C₁₀H₁₈O",
    mw: "154.25 g/mol",
    target: "Bronchial Ciliary Motility Enhancer",
    color: 5678741,
    seed: 11,
    product: "Forest Breathe Inhaler",
    productId: "inhaler",
    txt: "High-purity cineole vapor decreases mucus viscosity and stimulates mucosal ciliary beat frequency, opening upper airways and relieving sinus constriction with immediate biological onset.",
    metrics: { bioavailability: "+380%", onset: "60 secs", retention: "3.5 hrs" }
  },
  {
    id: "ashwagandha",
    n: "Ashwagandha",
    latin: "Withania somnifera",
    part: "Standardized root extract",
    cmp: "Withaferin A & Withanolides",
    formula: "C₂₈H₃₈O₆",
    mw: "470.60 g/mol",
    target: "HPA Axis & Cortisol Homeostasis",
    color: 13145677,
    seed: 5,
    product: "Reviva Drops & Focus Gummies",
    productId: "reviva",
    txt: "Purified withanolide glycosides recalibrate the hypothalamic-pituitary-adrenal (HPA) axis, attenuating systemic adrenaline surges, elevating mitochondrial ATP resilience, and stabilizing REM sleep stages.",
    metrics: { bioavailability: "+350%", onset: "30-45 mins", retention: "8.5 hrs" }
  },
  {
    id: "turmeric",
    n: "Curcuma Longa",
    latin: "Curcuma longa L.",
    part: "Supercritical rhizome phytosome",
    cmp: "Curcuminoids C3 Complex",
    formula: "C₂₁H₂₀O₆",
    mw: "368.38 g/mol",
    target: "NF-κB Inflammatory Pathway Blockade",
    color: 14257192,
    seed: 14,
    product: "Reviva Drops & Liver Protect",
    productId: "reviva",
    txt: "Curcumin C3 Complex inhibits nuclear translocation of NF-κB, stopping cytokine amplification at the genetic level. Co-complexed with non-GMO sunflower phosphatidylcholine to achieve 29x higher plasma bioavailability than standard turmeric powder.",
    metrics: { bioavailability: "+2900%", onset: "20 mins", retention: "8.0 hrs" }
  },
  {
    id: "milk-thistle",
    n: "Milk Thistle",
    latin: "Silybum marianum",
    part: "Standardized seed extract",
    cmp: "Silymarin (80% Silybin A/B)",
    formula: "C₂₅H₂₂O₁₀",
    mw: "482.44 g/mol",
    target: "Hepatocyte Membrane Stabilization",
    color: 9984934,
    seed: 39,
    product: "Liver Protect Drops",
    productId: "liver",
    txt: "Silymarin suppresses lipid peroxidation and reinforces hepatic cellular outer membranes against metabolic xenobiotics, while simultaneously upregulating endogenous glutathione synthesis and Phase II sulfation pathways.",
    metrics: { bioavailability: "+340%", onset: "25 mins", retention: "7.2 hrs" }
  },
  {
    id: "amla",
    n: "Indian Gooseberry",
    latin: "Phyllanthus emblica",
    part: "Fresh cold-pressed berries",
    cmp: "Emblicanin A/B & Ascorbic Complex",
    formula: "C₆H₈O₆",
    mw: "176.12 g/mol",
    target: "Cellular Redox & ROS Neutralization",
    color: 9418807,
    seed: 2,
    product: "Liver Protect & Focus Gummies",
    productId: "liver",
    txt: "Tannoid-bound bio-vitamin C resists oxidation significantly longer than laboratory ascorbic acid, preserving cell wall integrity and recycling intracellular vitamins E and glutathione in liver hepatocytes.",
    metrics: { bioavailability: "+260%", onset: "15 mins", retention: "9.0 hrs" }
  },
  {
    id: "chamomile",
    n: "German Chamomile",
    latin: "Matricaria chamomilla",
    part: "Sun-dried flower blossoms",
    cmp: "Apigenin Flavonoid",
    formula: "C₁₅H₁₀O₅",
    mw: "270.24 g/mol",
    target: "Central Benzodiazepine Receptors",
    color: 14663244,
    seed: 17,
    product: "Calm Roll-On",
    productId: "rollon",
    txt: "Apigenin selectively binds central benzodiazepine receptors without risk of habituation or drowsiness, gently dampening neuronal hyper-excitability, quieting somatic muscle tension, and promoting restorative rest.",
    metrics: { bioavailability: "+300%", onset: "20 mins", retention: "5.5 hrs" }
  }
];
const SIMULATION_MODES = {
  crude: {
    title: "Crude Botanical Powder (Raw Plant Material)",
    desc: "Unextracted ground herbs contain cellulose and fiber that bind actives. Over 65% is destroyed by harsh stomach acid, leading to erratic, low-yield intestinal absorption.",
    permeability: 16,
    retention: 28,
    onset: 18,
    specs: {
      bioavailability: "12% – 16%",
      tmax: "180 mins",
      halfLife: "2.2 hrs",
      gastricSurvival: "< 35%"
    }
  },
  solvent: {
    title: "Conventional Solvent Extract (Hydro-Ethanolic)",
    desc: "Standard chemical extracts concentrate phytochemicals but lack protection against digestive enzymes. Actives undergo significant hepatic first-pass degradation before reaching circulation.",
    permeability: 42,
    retention: 52,
    onset: 55,
    specs: {
      bioavailability: "38% – 45%",
      tmax: "75 mins",
      halfLife: "4.0 hrs",
      gastricSurvival: "62%"
    }
  },
  phytosome: {
    title: "TranzLife Bio-Phytosome Delivery Platform",
    desc: "Botanical actives are molecularly complexed within non-GMO sunflower phosphatidylcholine bi-layers. Resists gastric acid, transits mucosal barriers intact, and achieves rapid 20-minute cellular delivery.",
    permeability: 92,
    retention: 94,
    onset: 95,
    specs: {
      bioavailability: "88% – 94%",
      tmax: "20 mins",
      halfLife: "8.5 hrs",
      gastricSurvival: "> 96%"
    }
  }
};
function initSciencePage() {
  try {
    initCart();
  } catch (e) {
    console.warn("Cart initialization deferred:", e);
  }
  const nav = $("#nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const btn = $("#dockMenu");
  const menu = $("#menu");
  const menuX = $("#menuX");
  function setMenuOpen(open) {
    if (!menu) return;
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", !open);
    if (btn) {
      btn.setAttribute("aria-expanded", open);
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    document.documentElement.classList.toggle("menu-open", open);
  }
  if (btn) btn.addEventListener("click", () => setMenuOpen(!menu.classList.contains("open")));
  if (menuX) menuX.addEventListener("click", () => setMenuOpen(false));
  if (menu) {
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setMenuOpen(false);
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu && menu.classList.contains("open")) {
      setMenuOpen(false);
    }
  });
  const bagBtn = $("#bagBtn");
  const drawer = $("#drawer");
  const scrim = $("#scrim");
  const closeBag = $("#closeBag");
  function setDrawerOpen(open) {
    if (!drawer || !scrim) return;
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", !open);
    scrim.classList.toggle("open", open);
    document.documentElement.classList.toggle("bag-open", open);
  }
  if (bagBtn) bagBtn.addEventListener("click", () => setDrawerOpen(true));
  if (closeBag) closeBag.addEventListener("click", () => setDrawerOpen(false));
  if (scrim) scrim.addEventListener("click", () => setDrawerOpen(false));
  let molViewer = null;
  const molCanvas = $("#molCanvas");
  if (molCanvas) {
    try {
      molViewer = initMolecule();
    } catch (e) {
      console.warn("Molecule 3D viewer initialization notice:", e);
    }
  }
  const chipsContainer = $("#sciHerbChips");
  if (chipsContainer) {
    chipsContainer.innerHTML = SCIENCE_HERBS.map((h, i) => `
      <button class="sci-herb-btn ${i === 0 ? "on" : ""}" data-index="${i}" type="button">
        ${h.n}
      </button>
    `).join("");
    const buttons = chipsContainer.querySelectorAll(".sci-herb-btn");
    buttons.forEach((btn2) => {
      btn2.addEventListener("click", () => {
        const idx = parseInt(btn2.dataset.index, 10);
        selectHerb(idx);
      });
    });
    selectHerb(0);
  }
  function selectHerb(idx) {
    const herb = SCIENCE_HERBS[idx];
    if (!herb) return;
    const buttons = document.querySelectorAll(".sci-herb-btn");
    buttons.forEach((b, i) => b.classList.toggle("on", i === idx));
    if (molViewer && typeof molViewer.show === "function") {
      molViewer.show(herb);
    }
    const nameEl = $("#dossierName");
    const latinEl = $("#dossierLatin");
    const cmpPillEl = $("#dossierCmpPill");
    const txtEl = $("#dossierTxt");
    const formulaEl = $("#dossierFormula");
    const mwEl = $("#dossierMw");
    const partEl = $("#dossierPart");
    const targetEl = $("#dossierTarget");
    const prodLinkEl = $("#dossierProdLink");
    const molNameHUD = $("#sciMolNameHUD");
    if (nameEl) nameEl.textContent = herb.n;
    if (latinEl) latinEl.textContent = herb.latin;
    if (cmpPillEl) cmpPillEl.textContent = herb.cmp;
    if (txtEl) txtEl.textContent = herb.txt;
    if (formulaEl) formulaEl.textContent = herb.formula;
    if (mwEl) mwEl.textContent = herb.mw;
    if (partEl) partEl.textContent = herb.part;
    if (targetEl) targetEl.textContent = herb.target;
    if (molNameHUD) molNameHUD.textContent = `${herb.cmp} (${herb.formula})`;
    if (prodLinkEl) {
      prodLinkEl.textContent = `Featured in: ${herb.product} →`;
      prodLinkEl.href = `product-details.html?id=${herb.productId}`;
    }
  }
  const simTabs = document.querySelectorAll(".sci-sim-tab");
  simTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const modeKey = tab.dataset.mode;
      simTabs.forEach((t) => t.classList.toggle("active", t === tab));
      updateSimulation(modeKey);
    });
  });
  function updateSimulation(modeKey) {
    const data = SIMULATION_MODES[modeKey] || SIMULATION_MODES.phytosome;
    const barPerm = $("#simBarPerm");
    const barRet = $("#simBarRet");
    const barOnset = $("#simBarOnset");
    const valPerm = $("#simValPerm");
    const valRet = $("#simValRet");
    const valOnset = $("#simValOnset");
    if (barPerm) barPerm.style.width = `${data.permeability}%`;
    if (barRet) barRet.style.width = `${data.retention}%`;
    if (barOnset) barOnset.style.width = `${data.onset}%`;
    if (valPerm) valPerm.textContent = `${data.permeability}% Intestinal Transport`;
    if (valRet) valRet.textContent = `${data.retention}% Retained Active`;
    if (valOnset) valOnset.textContent = `${data.onset}% Cellular Rate`;
    if (barPerm) barPerm.classList.toggle("highlight", modeKey === "phytosome");
    if (barRet) barRet.classList.toggle("highlight", modeKey === "phytosome");
    if (barOnset) barOnset.classList.toggle("highlight", modeKey === "phytosome");
    const titleEl = $("#simTitle");
    const descEl = $("#simDesc");
    const specBio = $("#simSpecBio");
    const specTmax = $("#simSpecTmax");
    const specHalf = $("#simSpecHalf");
    const specGastric = $("#simSpecGastric");
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.desc;
    if (specBio) specBio.textContent = data.specs.bioavailability;
    if (specTmax) specTmax.textContent = data.specs.tmax;
    if (specHalf) specHalf.textContent = data.specs.halfLife;
    if (specGastric) specGastric.textContent = data.specs.gastricSurvival;
  }
  updateSimulation("phytosome");
  try {
    initReactor(() => pageProgress("process"));
    window.addEventListener("tl:goStage", (e) => {
      const sec = document.getElementById("process");
      if (!sec) return;
      const top = sec.getBoundingClientRect().top + window.scrollY;
      const y = top + (e.detail + 0.32) / NSTAGE * (sec.offsetHeight - window.innerHeight);
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    });
  } catch (e) {
    console.warn("Pipeline reactor unavailable:", e);
  }
  try {
    buildLab();
  } catch (e) {
    console.warn("Lab board unavailable:", e);
  }
  try {
    initScroll();
  } catch (e) {
    console.warn("Scroll reveals unavailable:", e);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSciencePage);
} else {
  initSciencePage();
}
