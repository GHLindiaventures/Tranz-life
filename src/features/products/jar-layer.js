// Transparent Three.js layer that places product models in screen pixels.
import * as THREE from 'three';
import { makeProduct } from './product-model.js';
import { envCube } from '../../lib/environment.js';

let shadowTexture = null;
function shadowTex(){
  if (shadowTexture) return shadowTexture;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(14,26,10,.9)'); gr.addColorStop(.45, 'rgba(14,26,10,.38)'); gr.addColorStop(1, 'rgba(14,26,10,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  shadowTexture = new THREE.CanvasTexture(cv); return shadowTexture;
}

function jarLayer(canvas){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  const scene = new THREE.Scene(); scene.environment = envCube();
  const ZC = 24, cam = new THREE.PerspectiveCamera(30, 1, .5, 120); cam.position.set(0, 0, ZC);
  scene.add(new THREE.HemisphereLight(0xfff8e6, 0x4a5c30, .75));
  // 1. Key Light: Softbox style warm sunlight illumination
  const key = new THREE.DirectionalLight(0xfff8e8, 1.15); key.position.set(-6, 9, 11); scene.add(key);
  // 2. Fill Light: Soft botanical sage fill, keeps label text and brand logo crisp
  const fill = new THREE.DirectionalLight(0xb4cca0, 0.45); fill.position.set(7, -1, 9); scene.add(fill);
  // 3. Multi-source Additive Hero Lighting Rig:
  //    [0] Left Golden Rim (warm amber/gold edge separation)
  //    [1] Right Warm-White Rim (balances edge silhouette)
  //    [2] Top Light (cool overhead highlight)
  //    [3] Backlight / Atmospheric Depth (radiant glow separating bottle from smoke)
  //    [4] Wooden Cap Accent (directed at chamfered wood grain)
  //    [5] Frosted Glass Base Accent (caustic fresh emerald rim)
  const heroRims = [
    { pos: [-11, 4, -8], col: 0xffd866, i: 2.7 },
    { pos: [11, 5, -7], col: 0xfff3d6, i: 2.1 },
    { pos: [0, 14, -2], col: 0xffffff, i: 1.1 },
    { pos: [0, -4, -12], col: 0xd4ea80, i: 1.35 },
    { pos: [1.5, 14, 4], col: 0xffdfa8, i: 1.2 },
    { pos: [-3, -7, 6], col: 0x9ef0b8, i: 0.85 }
  ].map(spec => {
    const l = new THREE.DirectionalLight(spec.col, 0);
    l.position.set(...spec.pos);
    scene.add(l);
    return { light: l, maxI: spec.i, basePos: [...spec.pos] };
  });
  let heroK = -1;
  const T = c => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; };
  const L = { renderer, scene, cam, T, W:1, H:1, halfH:1, halfW:1 };
  L.setHeroLight = k => {
    k = Math.round(Math.max(0, Math.min(1, k)) * 1000) / 1000; if (k === heroK) return; heroK = k;
    heroRims.forEach(({ light, maxI }) => { light.intensity = maxI * k; });
    key.intensity = 1.15 + 0.5 * k;
    fill.intensity = 0.45 + 0.2 * k;
    renderer.toneMappingExposure = 1 + 0.12 * k;
  };
  L.updateHeroLights = (pointer, time, rotY = 0) => {
    if (heroK <= 0.01) return;
    const px = (pointer && pointer.x) || 0, py = (pointer && pointer.y) || 0;
    // Traveling softbox highlight moving across bottle curvature
    key.position.set(-6 + px * 2.8, 9 + py * 1.8, 11);
    // Subtle breathing rim shimmer coordinated with rotation
    if (heroRims[0]) heroRims[0].light.intensity = heroRims[0].maxI * heroK * (1 + 0.12 * Math.sin(time * 0.8 + rotY));
    if (heroRims[1]) heroRims[1].light.intensity = heroRims[1].maxI * heroK * (1 + 0.12 * Math.cos(time * 1.0 + rotY));
    // Dynamic cap highlight tracking light drift
    if (heroRims[4]) heroRims[4].light.position.set(1.5 + px * 1.5, 14, 4 + py * 1.2);
  };
  L.resize = () => { const r = canvas.getBoundingClientRect(); L.W = Math.max(1, r.width); L.H = Math.max(1, r.height); renderer.setSize(L.W, L.H, false); cam.aspect = L.W/L.H; cam.updateProjectionMatrix(); L.halfH = Math.tan(THREE.MathUtils.degToRad(15))*ZC; L.halfW = L.halfH*cam.aspect; };
  L.ppu = () => L.H/(2*L.halfH);
  L.place = (obj, x, y) => obj.position.set((x/L.W - .5)*2*L.halfW, -(y/L.H - .5)*2*L.halfH, obj.position.z);
  L.jar = (p, i, o = {}) => {
    const b = makeProduct(p, i, o);
    const G = new THREE.Group(); G.add(b); scene.add(G);
    // a soft contact shadow on the ground under the product. It is a child of the product (so it moves, scales and sits at
    // its foot) that cancels the product's rotation, so it always faces the camera; its strength is G.userData.shadowA
    // (0 by default: only the scene that wants it, the product list, turns it on each frame)
    const h = b.userData.h, mat = new THREE.MeshBasicMaterial({ map:shadowTex(), transparent:true, depthWrite:false, opacity:0, fog:false });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    sh.renderOrder = -1; sh.frustumCulled = false; sh.position.set(0, -h/2 - h*.005, 0); sh.scale.set(h*.62, h*.62*.2, 1);
    const upd = sh.updateMatrixWorld;
    sh.updateMatrixWorld = function(force){ this.quaternion.copy(this.parent.quaternion).invert(); mat.opacity = this.parent.userData.shadowA || 0; this.visible = mat.opacity > .003; upd.call(this, force); };
    G.add(sh);
    return { G, b, h, fit:p.fit || 1, p };
  };
  L.size = (jar, pxH) => jar.G.scale.setScalar(Math.max(.0001, pxH/L.ppu()/jar.h));
  // Compile every shader and upload every texture ahead of time, while the browser is idle.
  // Otherwise the first frame a product becomes visible stalls for 100-250 ms mid-scroll.
  L.warm = () => warmUp(renderer, scene, cam);
  L.resize();
  return L;
}

// three.js only compiles visible objects, so show everything for the duration of the compile, then restore.
function warmUp(renderer, scene, cam){
  const run = () => {
    try {
      const hidden = [];
      scene.traverse(o => { if (!o.visible){ hidden.push(o); o.visible = true; } });
      renderer.compile(scene, cam);
      if (renderer.initTexture) scene.traverse(o => {
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        mats.forEach(m => ['map', 'normalMap', 'roughnessMap', 'alphaMap', 'bumpMap', 'envMap'].forEach(k => { if (m[k] && m[k].isTexture && !m[k].isCubeTexture) renderer.initTexture(m[k]); }));
      });
      hidden.forEach(o => { o.visible = false; });
    } catch (e) { /* warming is best-effort */ }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2500 }); else setTimeout(run, 300);
}

export { jarLayer, warmUp };
