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
  const key = new THREE.DirectionalLight(0xfff1d0, 1.1); key.position.set(-6, 9, 11); scene.add(key);
  const rim = new THREE.DirectionalLight(0xe2f3c4, .6); rim.position.set(9, 4, -7); scene.add(rim);
  const T = c => { const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; };
  const L = { renderer, scene, cam, T, W:1, H:1, halfH:1, halfW:1 };
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
  L.warm = opts => warmUp(renderer, scene, cam, opts);
  L.resize();
  return L;
}

// Warm-up, in small pieces: compiling every shader and uploading every texture at once blocks the page for over a
// second (measured: 1.25 s, then 0.4 s for the second layer), which froze the home page's hero. three.js 0.128 cannot
// compile in the background, so each mesh is warmed on its own (one material's shaders, then its textures), one piece
// per idle moment, never while the visitor is scrolling. three.js only compiles visible objects, so a mesh is shown
// for its own compile, then hidden again.
let lastScroll = 0;
addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
const QUIET = 450;                         // ms without scrolling before a piece may run
// Shader compiling also busies the graphics process, which makes a playing film drop frames (measured on the home page:
// 10 dropped frames of the hero film). So no piece runs while a film is playing on screen.
const filmOnScreen = () => [...document.querySelectorAll('video')].some(v => {
  if (v.paused || v.ended || v.readyState < 2) return false;
  const r = v.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0;
});
const START = 3500;                        // ms after the page has loaded (the hero's title has settled) before the first piece

// eager: the home page warms its 3D before its hero film starts (see warmAll), piece by piece with frames in between,
// so compiling never overlaps the playing film or a scroll; elsewhere the pieces wait for idle, quiet moments.
const eagerWarm = [];
function warmAll(){ return Promise.all(eagerWarm); }

function warmUp(renderer, scene, cam, { eager = false } = {}){
  const mats = o => o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
  // one piece per mesh: shown on its own (with its parents), compiled, hidden again; lights stay on. Meshes whose
  // materials are already compiled cost almost nothing, so they run back to back in the same idle moment.
  const meshes = []; scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine) meshes.push(o); });
  const done = m => mats(m).every(x => renderer.properties.get(x).program);
  const compileOne = m => {
    if (done(m)) return false;
    const vis = []; scene.traverse(o => { vis.push([o, o.visible]); if (o !== scene && !o.isLight) o.visible = false; });
    for (let o = m; o && o !== scene; o = o.parent) o.visible = true;
    try { renderer.compile(scene, cam); } finally { vis.forEach(([o, v]) => { o.visible = v; }); }
    return true;
  };
  const textures = m => { if (renderer.initTexture) mats(m).forEach(x =>
    ['map', 'normalMap', 'roughnessMap', 'alphaMap', 'bumpMap', 'envMap'].forEach(k => { if (x[k] && x[k].isTexture && !x[k].isCubeTexture) renderer.initTexture(x[k]); })); };
  const piece = () => {
    const t0 = performance.now();
    while (meshes.length && performance.now() - t0 < 6){
      const m = meshes.shift();
      try { const heavy = compileOne(m); textures(m); if (heavy) break; } catch (e) { /* warming is best-effort */ }
    }
  };
  if (eager){
    eagerWarm.push(new Promise(resolve => {
      const next = () => { piece(); if (meshes.length) requestAnimationFrame(() => setTimeout(next, 0)); else resolve(); };
      requestAnimationFrame(() => setTimeout(next, 0));
    }));
    return;
  }
  const later = () => ('requestIdleCallback' in window) ? requestIdleCallback(step, { timeout: 6000 }) : setTimeout(step, 250);
  function step(){
    if (performance.now() - lastScroll < QUIET || filmOnScreen()){ setTimeout(later, QUIET); return; }
    piece();
    if (meshes.length) later();
  }
  const begin = () => setTimeout(later, START);
  if (document.readyState === 'complete') begin(); else addEventListener('load', begin, { once: true });
}

export { jarLayer, warmUp, warmAll };
