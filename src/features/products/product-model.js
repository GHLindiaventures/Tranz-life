// 3D models of the six TranzLife products (procedural, or scanned .glb files). Shapes follow the client's design boards and the
// printed labels are the real artwork lifted from those boards (see scripts/make-product-assets.py).
import * as THREE from 'three';
import { seeded } from '../../utils/math.js';
import decalGummies from '../../assets/products/decal-gummies.webp';
import decalInhaler from '../../assets/products/decal-inhaler.webp';
import decalInhalerLogo from '../../assets/products/decal-inhaler-logo.webp';
import decalRollon from '../../assets/products/decal-rollon.webp';
import decalReviva from '../../assets/products/decal-reviva.webp';
import decalLiver from '../../assets/products/decal-liver.webp';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { attachGummies } from './gummy-pour.js';
import { applyJarGlass, applyBottleGlass, disposeGlass } from './glass.js';
import liverGlbUrl from '../../assets/products/liver-booster.glb?url';
import cycleReliefGlbUrl from '../../assets/products/cyclerelief.glb?url';
import lungBoosterGlbUrl from '../../assets/products/lungbooster.glb?url';
import energyGlbUrl from '../../assets/products/energy-booster.glb?url';   // scripts/add_energy_threads.mjs

const V2 = (x, y) => new THREE.Vector2(x, y);
const lin = hex => new THREE.Color(hex).convertSRGBToLinear();

/* ---------- textures (shared by every scene) ---------- */
const texCache = new Map();
function image(url){
  if (!texCache.has(url)){ const t = new THREE.TextureLoader().load(url); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; texCache.set(url, t); }
  return texCache.get(url);
}
function canvasTex(key, w, h, draw, srgb = true){
  if (!texCache.has(key)){ const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; texCache.set(key, t); }
  return texCache.get(key);
}
// pressed plant-fibre (the gummies eco cap)
const kraft = () => canvasTex('kraft', 512, 512, (g, w, h) => {
  const R = seeded(31); g.fillStyle = '#cfae84'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++){ const v = R(), a = R()*Math.PI; g.strokeStyle = v < .5 ? `rgba(120,86,50,${.06 + R()*.16})` : `rgba(250,232,200,${.08 + R()*.2})`;
    const x = R()*w, y = R()*h, l = 2 + R()*7; g.lineWidth = .6 + R()*1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a)*l, y + Math.sin(a)*l); g.stroke(); }
});
// the leaf embossed into the eco cap's top (used as a bump map)
const capLeaf = () => canvasTex('capLeaf', 512, 512, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.translate(w/2, h/2); g.rotate(-.35);
  g.strokeStyle = '#3a3a3a'; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-170, 0); g.bezierCurveTo(-90, -95, 90, -95, 175, 0); g.bezierCurveTo(90, 95, -90, 95, -170, 0); g.stroke();
  g.lineWidth = 6; g.beginPath(); g.moveTo(-190, 8); g.lineTo(150, 0); g.stroke();
  for (let k = -3; k <= 3; k++){ if (!k) continue; const x = k*40; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 34, -Math.sign(k)*0 - 52 + Math.abs(k)*8); g.moveTo(x, 0); g.lineTo(x + 34, 52 - Math.abs(k)*8); g.stroke(); }
}, false);
// light oak (the liver booster's angled cap)
const oak = () => canvasTex('oak', 512, 512, (g, w, h) => {
  const R = seeded(7); const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#c99a63'); gr.addColorStop(.5, '#d7ad78'); gr.addColorStop(1, '#c08f58'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i++){ let x = R()*w; g.strokeStyle = `rgba(${R() < .5 ? '120,78,40' : '235,205,160'},${.12 + R()*.22})`; g.lineWidth = .8 + R()*2.4; g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= h; y += 16){ x += (R() - .5)*2.4; g.lineTo(x, y); } g.stroke(); }
});

/* ---------- shared geometry helpers ---------- */
const radiusAt = (prof, y) => { for (let i = 1; i < prof.length; i++){ const a = prof[i - 1], b = prof[i]; if (y <= b.y || i === prof.length - 1){ const t = (y - a.y)/Math.max(1e-6, b.y - a.y); return a.x + (b.x - a.x)*Math.min(1, Math.max(0, t)); } } return prof[0].x; };
// a band of a lathe profile, resampled evenly in height so a texture maps straight onto it
const band = (prof, y0, y1, grow, n = 48) => Array.from({ length:n + 1 }, (_, k) => { const y = y0 + (y1 - y0)*k/n; return V2(radiusAt(prof, y)*grow, y); });
// a printed label on the front of a round body (u = angle, v = height)
function labelBand(prof, y0, y1, arc, grow, map, extra = {}){
  const m = new THREE.Mesh(new THREE.LatheGeometry(band(prof, y0, y1, grow), 96, -arc/2, arc), new THREE.MeshStandardMaterial({ map, transparent:true, roughness:.55, metalness:0, envMapIntensity:.6, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, ...extra }));
  m.renderOrder = 4; return m;
}
// see-through glass: a faint front shell plus a back shell for depth
function glassShell(geo, color, front = .12, back = .2){
  const f = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color:lin(color), roughness:.05, clearcoat:1, clearcoatRoughness:.04, envMapIntensity:1.6, transparent:true, opacity:front, depthWrite:false }));
  const b = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color:lin(color), roughness:.08, clearcoat:1, envMapIntensity:1.2, transparent:true, opacity:back, side:THREE.BackSide, depthWrite:false }));
  f.renderOrder = 3; b.renderOrder = 1; return [b, f];
}
// discard everything below a slanted plane (object space): y < y0 + k*x
function slantCut(mat, y0, k){
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec3 vObjPos;\nvoid main() {\n  vObjPos = position;');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', `varying vec3 vObjPos;\nvoid main() {\n  if (vObjPos.y < ${y0.toFixed(4)} + ${k.toFixed(4)}*vObjPos.x) discard;`);
  };
  mat.customProgramCacheKey = () => 'slant' + y0 + ':' + k;
  return mat;
}

// Liquid inside an opaque frosted bottle, faked in the material: below a (gently sloshing) level the surface is tinted and
// shaded darker toward the base, with a soft bright meniscus line on the level. `fill` is in the model's own units (y).
function liquidFill(mat, { fill = .29, tint = [.70, .90, .26], amount = .68 } = {}){
  const uTime = { value:0 }, uFill = { value:fill };   // uFill: the liquid level in the model's own units (the Liver Booster lowers it as it pours)
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uTime; sh.uniforms.uFill = uFill;
    sh.vertexShader = sh.vertexShader.replace('void main() {', `varying vec3 vLiqPos;
void main() {
  vLiqPos = position;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', `varying vec3 vLiqPos;
uniform float uTime;
uniform float uFill;
void main() {`)
      .replace('#include <map_fragment>', `#include <map_fragment>
      float liqLevel = uFill + .006*sin(uTime*1.7 + vLiqPos.x*10.) + .014*sin(uTime*.8)*vLiqPos.x + .005*sin(uTime*1.1 + vLiqPos.z*8.);
      float liqD = vLiqPos.y - liqLevel;
      float inLiq = 1. - smoothstep(-.003, .003, liqD);
      float depthShade = smoothstep(0., .9, -liqD);
      vec3 liqCol = vec3(${tint[0].toFixed(3)}, ${tint[1].toFixed(3)}, ${tint[2].toFixed(3)});
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*liqCol*1.22, inLiq*${amount.toFixed(3)});
      diffuseColor.rgb *= 1. - .22*depthShade*inLiq;
      diffuseColor.rgb = mix(diffuseColor.rgb*1.05 + vec3(.03, .04, .01), diffuseColor.rgb, inLiq);   // frosted air above
      diffuseColor.rgb += vec3(.20, .26, .08)*exp(-liqD*liqD/.00006)*.9;

      // Golden radiant illumination for the liver emblem at the bottom front
      if (vLiqPos.z > 0.12 && vLiqPos.y > -0.76 && vLiqPos.y < -0.42) {
        float goldMask = smoothstep(0.46, 0.76, diffuseColor.r) * smoothstep(0.40, 0.70, diffuseColor.g);
        diffuseColor.rgb += vec3(0.36, 0.30, 0.08) * goldMask;
      }`);
  };
  mat.customProgramCacheKey = () => 'liquid' + fill + ':' + amount;
  mat.userData.uTime = uTime; mat.userData.uFill = uFill;
  return mat;
}

/* ---------- gummies: raspberry-shaped, glossy ---------- */
function berryGeometry(rad, detail = 1){
  const g = new THREE.SphereGeometry(1, 30*detail, 22*detail), pos = g.attributes.position, n = 30, C = [];
  for (let i = 0; i < n; i++){ const y = 1 - 2*(i + .5)/n, r = Math.sqrt(1 - y*y), a = i*2.39996; C.push(new THREE.Vector3(Math.cos(a)*r, y, Math.sin(a)*r)); }
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++){
    v.fromBufferAttribute(pos, i).normalize(); let m = -1; for (const c of C){ const d = v.dot(c); if (d > m) m = d; }
    const t = Math.min(1, (1 - m)/.052), dome = Math.sqrt(Math.max(0, 1 - t*t)), k = 1 + .2*dome;
    pos.setXYZ(i, v.x*k*rad, v.y*k*rad*.86, v.z*k*rad);
  }
  g.computeVertexNormals(); return g;
}
const gummyMaterial = () => new THREE.MeshPhysicalMaterial({ roughness:.24, clearcoat:1, clearcoatRoughness:.18, envMapIntensity:.9 });

function gummiesJar(p, o){
  const G = new THREE.Group();
  const prof = [V2(0,0),V2(.8,0),V2(.94,.03),V2(.99,.14),V2(1,.4),V2(1.01,1.6),V2(1.02,2.55),V2(1.0,2.78),V2(.95,2.96),V2(.86,3.1),V2(.76,3.2),V2(.72,3.25),V2(.72,3.34)];
  const glass = new THREE.LatheGeometry(prof, 96);
  G.add(...glassShell(glass, '#f4f6f1', .1, .16));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.9, .94, .07, 64), new THREE.MeshPhysicalMaterial({ color:lin('#eef2ec'), roughness:.08, transparent:true, opacity:.35, clearcoat:1 })); base.position.y = .04; G.add(base);
  // red, orange and amber gummies fill the jar
  const R = seeded(13), N = o.lite ? 80 : 150, geo = berryGeometry(.17, o.lite ? 1 : 1.2), pts = [];
  for (let tries = 0; pts.length < N && tries < 9000; tries++){
    const a = R()*Math.PI*2, y = .2 + R()*2.55, rmax = radiusAt(prof, y) - .2, rr = Math.sqrt(R())*Math.max(0, rmax);
    const v = new THREE.Vector3(Math.cos(a)*rr, y, Math.sin(a)*rr); if (pts.every(q => q.distanceTo(v) > .27)) pts.push(v);
  }
  pts.sort((a, b) => a.y - b.y);
  const gm = new THREE.InstancedMesh(geo, gummyMaterial(), pts.length), d = new THREE.Object3D(), c = new THREE.Color();
  pts.forEach((v, k) => { d.position.copy(v); d.rotation.set(R()*.8 - .4, R()*6.28, R()*.8 - .4); d.scale.setScalar(.9 + R()*.28); d.updateMatrix(); gm.setMatrixAt(k, d.matrix);
    c.set(p.gummy[k % p.gummy.length]).convertSRGBToLinear(); c.offsetHSL((R() - .5)*.02, 0, (R() - .5)*.04); gm.setColorAt(k, c); });
  G.add(gm);
  // frosted cream top with the diagonal edge, then the printed logo on it
  const cutY = 1.52, cutK = .37;
  const frost = new THREE.Mesh(new THREE.LatheGeometry(band(prof, .9, 3.34, 1.008, 80), 96), slantCut(new THREE.MeshStandardMaterial({ color:lin('#ebe3d2'), roughness:.68, metalness:0, envMapIntensity:.55, side:THREE.DoubleSide }), cutY, cutK));
  frost.renderOrder = 2; G.add(frost);
  const print = labelBand(prof, 1.55, 2.98, 2*Math.asin(.86), 1.014, image(decalGummies)); slantCut(print.material, cutY + .02, cutK); G.add(print);
  // pressed plant-fibre eco cap with an embossed leaf
  const kt = kraft();
  const capProf = [V2(.0,3.27),V2(.74,3.27),V2(.755,3.3),V2(.76,3.86),V2(.75,3.93),V2(.72,3.975),V2(.6,3.99),V2(0,3.995)];
  const capMat = new THREE.MeshStandardMaterial({ color:0xffffff, map:kt, bumpMap:kt, bumpScale:.012, roughness:.92, metalness:0, envMapIntensity:.35 });
  G.add(new THREE.Mesh(new THREE.LatheGeometry(capProf, 96), capMat));
  const top = new THREE.Mesh(new THREE.CircleGeometry(.6, 64), new THREE.MeshStandardMaterial({ color:0xffffff, map:kt, bumpMap:capLeaf(), bumpScale:.05, roughness:.92, envMapIntensity:.35 }));
  top.rotation.x = -Math.PI/2; top.position.y = 3.997; G.add(top);
  return { G, h:4.0 };
}

function calmInhaler(){
  const G = new THREE.Group(), w = 1, d = .6, bev = .06;
  const rr = (W, D, r) => { const s = new THREE.Shape(), x = W/2, y = D/2; s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.quadraticCurveTo(x, -y, x, -y + r); s.lineTo(x, y - r); s.quadraticCurveTo(x, y, x - r, y); s.lineTo(-x + r, y); s.quadraticCurveTo(-x, y, -x, y - r); s.lineTo(-x, -y + r); s.quadraticCurveTo(-x, -y, -x + r, -y); return s; };
  const soft = (hex, rough) => new THREE.MeshPhysicalMaterial({ color:lin(hex), roughness:rough, metalness:0, clearcoat:.35, clearcoatRoughness:.5, envMapIntensity:.7 });
  // body: a soft-touch grey stick
  const bodyH = 3.06, body = new THREE.ExtrudeGeometry(rr(w - 2*bev, d - 2*bev, .12), { depth:bodyH - 2*bev, bevelEnabled:true, bevelThickness:bev, bevelSize:bev, bevelSegments:4, curveSegments:10 });
  body.rotateX(-Math.PI/2); body.translate(0, bev, 0);
  G.add(new THREE.Mesh(body, soft('#5a5d60', .5)));
  // cap with the twin rounded tips
  const s = new THREE.Shape(), k = .9;
  s.moveTo(-.5*k, 0); s.lineTo(-.5*k, .49*k); s.absarc(-.3*k, .49*k, .2*k, Math.PI, 0, true); s.absarc(0, .49*k, .1*k, Math.PI, 2*Math.PI, false); s.absarc(.3*k, .49*k, .2*k, Math.PI, 0, true); s.lineTo(.5*k, 0); s.lineTo(-.5*k, 0);
  const cap = new THREE.ExtrudeGeometry(s, { depth:d - .2, bevelEnabled:true, bevelThickness:.1, bevelSize:.05, bevelSegments:6, curveSegments:24 });
  cap.translate(0, 0, -(d - .2)/2); cap.translate(0, bodyH + .02, 0);
  G.add(new THREE.Mesh(cap, soft('#4a4d50', .42)));
  const seam = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(w - .1, d - .1, .1), { depth:.03, bevelEnabled:false }), new THREE.MeshStandardMaterial({ color:0x1c1d1e, roughness:.8 }));
  seam.geometry.rotateX(-Math.PI/2); seam.position.y = bodyH - .01; G.add(seam);
  // the teal CALM label and the small logo, printed on the flat front
  const front = d/2 + .003;
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(.7, 2.27), new THREE.MeshStandardMaterial({ map:image(decalInhaler), transparent:true, roughness:.6, envMapIntensity:.5, polygonOffset:true, polygonOffsetFactor:-2 }));
  lab.position.set(0, 1.59, front); G.add(lab);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(.66, .2), new THREE.MeshStandardMaterial({ map:image(decalInhalerLogo), transparent:true, roughness:.6, polygonOffset:true, polygonOffsetFactor:-2 }));
  logo.position.set(0, .26, front); G.add(logo);
  return { G, h:bodyH + .02 + .69*k + .05 };
}

function calmRollOn(){
  const G = new THREE.Group();
  const prof = [V2(0,0),V2(.44,0),V2(.49,.03),V2(.5,.1),V2(.5,3.12)];
  G.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 72), new THREE.MeshPhysicalMaterial({ color:lin('#1a1a1a'), roughness:.18, clearcoat:1, envMapIntensity:1 })));
  // cream label all the way round, the printed front from the design
  const labelProf = [V2(.5,.46),V2(.5,3.1)];
  G.add(new THREE.Mesh(new THREE.LatheGeometry(band(labelProf, .46, 3.1, 1.008, 2), 96), new THREE.MeshStandardMaterial({ color:lin('#ece5d4'), roughness:.6, envMapIntensity:.5 })));
  G.add(labelBand(labelProf, .48, 3.1, 2.3, 1.016, image(decalRollon)));
  const capProf = [V2(0,3.12),V2(.505,3.12),V2(.51,3.15),V2(.51,4.32),V2(.49,4.41),V2(.43,4.45),V2(0,4.46)];
  G.add(new THREE.Mesh(new THREE.LatheGeometry(capProf, 72), new THREE.MeshPhysicalMaterial({ color:lin('#141414'), roughness:.22, clearcoat:1, clearcoatRoughness:.1, envMapIntensity:1.1 })));
  return { G, h:4.46 };
}

function revivaRollOn(){
  const G = new THREE.Group();
  const prof = [V2(0,0),V2(.44,0),V2(.49,.03),V2(.5,.1),V2(.5,2.8),V2(.47,2.9),V2(.38,2.96),V2(.32,3.0),V2(.32,3.32)];
  const amber = new THREE.MeshPhysicalMaterial({ color:lin('#5c240b'), roughness:.07, clearcoat:1, clearcoatRoughness:.03, envMapIntensity:1.5 });
  G.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 72), amber));
  for (let k = 0; k < 4; k++){ const t = new THREE.Mesh(new THREE.TorusGeometry(.322, .016, 8, 64), amber); t.rotation.x = Math.PI/2; t.position.y = 3.05 + k*.075; G.add(t); }
  // white roller housing and the steel ball
  const hous = [V2(0,3.3),V2(.33,3.3),V2(.33,3.36),V2(.3,3.4),V2(.29,3.55),V2(.26,3.6),V2(.19,3.62),V2(0,3.62)];
  G.add(new THREE.Mesh(new THREE.LatheGeometry(hous, 64), new THREE.MeshPhysicalMaterial({ color:lin('#f4f4f2'), roughness:.35, clearcoat:.4 })));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.2, 40, 28), new THREE.MeshStandardMaterial({ color:lin('#d9dcdf'), metalness:1, roughness:.12, envMapIntensity:1.6 }));
  ball.name = 'Roller_Ball';
  ball.position.y = 3.62; G.add(ball);
  // dark green label all round, printed front from the design
  const labelProf = [V2(.5,.27),V2(.5,2.5)];
  G.add(new THREE.Mesh(new THREE.LatheGeometry(band(labelProf, .27, 2.5, 1.008, 2), 96), new THREE.MeshStandardMaterial({ color:lin('#1d4527'), roughness:.55, envMapIntensity:.5 })));
  G.add(labelBand(labelProf, .27, 2.5, 2.24, 1.016, image(decalReviva)));

  // Sleek black threaded cap on its own pivot for the unscrew animation
  const capPivot = new THREE.Group();
  capPivot.name = 'Jar_Cap_Pivot';
  const capProf = [V2(0,2.98),V2(.48,2.98),V2(.485,3.02),V2(.485,4.0),V2(.46,4.08),V2(.4,4.12),V2(0,4.13)];
  const capMesh = new THREE.Mesh(new THREE.LatheGeometry(capProf, 72), new THREE.MeshPhysicalMaterial({ color:lin('#141414'), roughness:.2, clearcoat:1, clearcoatRoughness:.1, envMapIntensity:1.2 }));
  capMesh.name = 'Jar_Cap';
  capPivot.add(capMesh);
  G.add(capPivot);

  G.userData.capPivot = capPivot;
  G.userData.capRest = capPivot.position.clone();
  G.userData.ball = ball;
  G.userData.modelRoot = G;
  return { G, h:4.13 };
}

function liverBottle(){
  const G = new THREE.Group();
  const prof = [
    V2(0,0), V2(.4,0), V2(.47,.03), V2(.5,.12), V2(.5,2.9), V2(.48,2.98), V2(.44,3.04),
    V2(.38,3.12), V2(.34,3.20),
    V2(.36,3.24), V2(.36,3.27), V2(.33,3.30),
    V2(.33,3.75), V2(.34,3.78), V2(.33,3.82), V2(.27,3.82),
    V2(.25,3.78), V2(.25,3.30), V2(0,3.30)
  ];
  // frosted green glass
  const glass = new THREE.MeshPhysicalMaterial({ color:lin('#c7d585'), roughness:.5, metalness:0, clearcoat:.4, clearcoatRoughness:.35, envMapIntensity:.8, emissive:lin('#2e3a08'), emissiveIntensity:.25 });
  G.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 80), glass));
  G.add(labelBand(prof, .61, 2.66, 2.24, 1.012, image(decalLiver), { roughness:.5 }));
  // screw threads around neck
  for (let k = 0; k < 3; k++){
    const t = new THREE.Mesh(new THREE.TorusGeometry(.310, .004, 8, 48), glass);
    t.rotation.x = Math.PI / 2 - 0.06;
    t.position.y = 3.32 + k * .065;
    G.add(t);
  }
  // light oak cap with the angled top
  const cap = new THREE.CylinderGeometry(.43, .43, 1, 72, 1), pos = cap.attributes.position;
  for (let i = 0; i < pos.count; i++){ const y = pos.getY(i); if (y > 0) pos.setY(i, y + .13*pos.getX(i)/.43); }
  cap.computeVertexNormals(); cap.translate(0, 3.02 + .5, 0);
  const ot = oak();
  const capMesh = new THREE.Mesh(cap, new THREE.MeshStandardMaterial({ color:0xffffff, map:ot, roughness:.62, metalness:0, envMapIntensity:.5 }));
  capMesh.name = 'cap';
  G.add(capMesh);
  return { G, h:4.16 };
}

// Some products are scanned models (.glb files). Each loads once for the page; until it arrives the drawn product
// stands in (and stays if the file cannot be loaded). Every scene gets its own copy.
const glbLoads = new Map();
function loadGlb(url){
  if (!glbLoads.has(url)) glbLoads.set(url, new Promise((res, rej) => new GLTFLoader().load(url, g => res(g.scene), undefined, rej)));
  return glbLoads.get(url);
}

const HD_LOADERS = {
  gummies: () => import('../../assets/products/lungbooster-hd.glb?url').then(m => m.default),
  rollon: () => import('../../assets/products/cyclerelief-hd.glb?url').then(m => m.default),
  liver: () => import('../../assets/products/liver-booster-hd.glb?url').then(m => m.default),
  energy: () => import('../../assets/products/energy-booster-hd.glb?url').then(m => m.default),
};

function disposeObject(obj) {
  if (!obj) return;
  disposeGlass(obj);
  obj.traverse(n => {
    if (n.isMesh) {
      if (n.geometry) n.geometry.dispose();
      if (n.material) {
        const mats = Array.isArray(n.material) ? n.material : [n.material];
        mats.forEach(mat => {
          ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'bumpMap', 'emissiveMap'].forEach(k => {
            if (mat[k] && mat[k].isTexture) mat[k].dispose();
          });
          mat.dispose();
        });
      }
    }
  });
}

function applyModelStyling(m, baseH, holder) {
  const flags = []; m.traverse(n => { if (/^Flag/i.test(n.name)) flags.push(n); }); flags.forEach(n => n.parent && n.parent.remove(n));   // studio reflector cards that came with the file
  const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  const k = baseH / size.y;                     // same height as the drawn product, standing on y = 0
  m.scale.setScalar(k); m.position.set(-mid.x * k, -box.min.y * k, -mid.z * k);
  const wrap = new THREE.Group(); wrap.add(m);

  // Glass rendering: apply realistic cheap glass to the Lung Booster jar (Jar_Glass & Jar_Neck)
  if (m.getObjectByName('Jar_Glass')) {
    applyJarGlass(m);

    // Clean diagonal slant cut on Jar_Label to match brand design (removing jagged scan tear)
    const label = m.getObjectByName('Jar_Label');
    if (label && label.material) {
      const lm = label.material = label.material.clone();
      lm.roughness = 0.85;
      lm.metalness = 0.0;
      lm.envMapIntensity = 0.45;
      lm.onBeforeCompile = sh => {
        sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec3 vObjPos;\nvoid main() {\n  vObjPos = position;');
        sh.fragmentShader = sh.fragmentShader
          .replace('void main() {', 'varying vec3 vObjPos;\nvoid main() {')
          .replace('#include <map_fragment>', `#include <map_fragment>
          float cutLine = -0.27 + 0.40 * vObjPos.x - 0.15 * vObjPos.x * vObjPos.x;
          float distToCut = vObjPos.y - cutLine;
          if (distToCut < 0.0) discard;
          diffuseColor.rgb += vec3(0.14, 0.13, 0.11) * exp(-distToCut * distToCut / 0.00012);`);
      };
      lm.customProgramCacheKey = () => 'jar_label_slant_v2';
      lm.needsUpdate = true;
    }

    // Kraft / eco pressed plant-fiber cap styling with top leaf engraving
    const cap = m.getObjectByName('Jar_Cap');
    if (cap && cap.material) {
      const cm = cap.material = cap.material.clone();
      const kt = kraft();
      const leafTex = capLeaf();
      cm.map = kt;
      cm.roughness = 0.85;
      cm.metalness = 0.0;
      cm.envMapIntensity = 0.45;
      cm.color.set(lin('#dfcbb4'));

      cm.onBeforeCompile = sh => {
        sh.uniforms.uLeafMap = { value: leafTex };
        sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec3 vObjPos;\nvoid main() {\n  vObjPos = position;');
        sh.fragmentShader = sh.fragmentShader
          .replace('void main() {', 'varying vec3 vObjPos;\nuniform sampler2D uLeafMap;\nvoid main() {')
          .replace('#include <map_fragment>', `#include <map_fragment>
          if (vObjPos.y > 0.94) {
            vec2 leafUV = vec2(vObjPos.x, -vObjPos.z) / 0.74 + 0.5;
            if (leafUV.x >= 0.0 && leafUV.x <= 1.0 && leafUV.y >= 0.0 && leafUV.y <= 1.0) {
              float leafVal = texture2D(uLeafMap, leafUV).r;
              float leafLine = smoothstep(0.40, 0.48, leafVal);
              diffuseColor.rgb = mix(diffuseColor.rgb * 0.68, diffuseColor.rgb, leafLine);
            }
          }`);
      };
      cm.customProgramCacheKey = () => 'jar_cap_leaf_engrave';
      cm.needsUpdate = true;
    }
  } else {
    // Other models with transmission materials (energy, cyclerelief) keep fallback styling
    m.traverse(n => {
      if (n.isMesh && n.material && n.material.transmission > 0) {
        const gm = n.material = n.material.clone();
        gm.transmission = 0;
        gm.transparent = true;
        gm.opacity = .5;
        gm.depthWrite = false;
        gm.envMapIntensity = 1.6;
        gm.roughness = Math.min(gm.roughness, .12);
        n.renderOrder = 2;
      }
    });
  }

  // the CycleRelief scan's texture atlas is a patchwork: its normal map and metal/roughness map carry the seams between the patches,
  // which read as cracks and scratches on the cap and label. Drop those maps (the colour map is clean) and set plain values.
  const isRoller = !!m.getObjectByName('Roller_Body');   // (the Lung Booster has a node called Jar_Cap too: leave that one alone)
  m.traverse(n => { if (isRoller && n.isMesh && (n.name === 'Jar_Cap' || n.name === 'Roller_Body') && n.material){
    const cm = n.material = n.material.clone(); cm.normalMap = null; cm.metalnessMap = null; cm.roughnessMap = null;
    cm.metalness = 0; cm.roughness = n.name === 'Jar_Cap' ? .28 : .42; cm.envMapIntensity = .8;
    if (n.name === 'Jar_Cap'){ cm.map = null; cm.color.set(0x070707); cm.roughness = .16; cm.envMapIntensity = 1.1; }   // the cap: one clean glossy black instead of the scan's patchy colour
    cm.needsUpdate = true; } });

  // the Liver Booster's bottle holds liquid (its cap shares the material, so the bottle gets its own copy)
  m.traverse(n => {
    if (n.isMesh && n.name === 'Bottle' && n.material && n.material.map) {
      const bm = n.material = n.material.clone();
      bm.metalness = 0.0;
      bm.metalnessMap = null;
      bm.roughness = 0.38; // Silky frosted glass
      const lm = liquidFill(bm);
      n.onBeforeRender = () => { lm.userData.uTime.value = performance.now() / 1000; };
    }
  });

  // Glass shell: apply realistic glass sheen to the Liver Booster bottle
  if (m.getObjectByName('Bottle') && m.getObjectByName('Cap')) {
    applyBottleGlass(m);
  }

  // Anisotropy = 8 and mipmaps kept on for all textures on the model
  wrap.traverse(n => {
    if (n.isMesh) {
      n.frustumCulled = false;
      if (n.material) {
        const mats = Array.isArray(n.material) ? n.material : [n.material];
        mats.forEach(mat => {
          ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'alphaMap', 'bumpMap', 'emissiveMap'].forEach(slot => {
            const tex = mat[slot];
            if (tex && tex.isTexture) {
              tex.anisotropy = 8;
              tex.generateMipmaps = true;
              tex.minFilter = THREE.LinearMipmapLinearFilter;
              tex.needsUpdate = true;
            }
          });
        });
      }
      n.userData.product = holder.parent ? holder.parent.userData.index : undefined;
    }
  });

  return { wrap, m };
}

function bindModelHooks(m, holder) {
  const pivot = m.getObjectByName('Jar_Cap_Pivot');
  if (pivot && holder.parent){
    const y0 = pivot.position.y;
    const turns = pivot.userData.turns || 2.5, lift = pivot.userData.lift || .36;   // per model (glTF extras on the pivot node)
    holder.parent.userData.unscrew = u => { const k = Math.min(1, Math.max(0, u)), e = k*k*(3 - 2*k); pivot.rotation.y = k*turns*Math.PI*2; pivot.position.y = y0 + e*lift; };
  }
  // the Lung Booster (Jar_Label + Jar_Cap_Pivot): gummies packed in the jar; the pour moment (gummy-pour.js) drives the cap and the gummies
  if (pivot && holder.parent && m.getObjectByName('Jar_Label')){
    const ud = holder.parent.userData; ud.capPivot = pivot; ud.capRest = pivot.position.clone(); ud.modelRoot = m;
    if (!ud.gummies) {
      ud.gummies = attachGummies(m);
    } else {
      if (ud.gummies.setRoot) ud.gummies.setRoot(m);
      const gm = ud.gummies.mesh;
      if (gm && gm.parent !== m) {
        if (gm.parent) gm.parent.remove(gm);
        m.add(gm);
      }
    }
  }
  // Roll-on products (cyclerelief / rollon): cap pivot and roller ball for rollon-director
  const isRoller = !!m.getObjectByName('Roller_Body');
  if (isRoller){
    const ballMesh = m.getObjectByName('Roller_Ball');
    if (ballMesh && ballMesh.geometry) {
      ballMesh.geometry.computeBoundingBox();
      const ballCenter = new THREE.Vector3();
      ballMesh.geometry.boundingBox.getCenter(ballCenter);
      ballMesh.geometry.center();
      ballMesh.position.copy(ballCenter);
      if (ballMesh.material) {
        ballMesh.material.metalness = 1.0;
        ballMesh.material.roughness = 0.10;
        ballMesh.material.envMapIntensity = 1.8;
        ballMesh.material.needsUpdate = true;
      }
    }
    const setUd = target => {
      if (!target) return;
      if (pivot) {
        target.userData.capPivot = pivot;
        target.userData.capRest = pivot.position.clone();
      }
      if (ballMesh) target.userData.ball = ballMesh;
      target.userData.modelRoot = m;
    };
    setUd(holder);
    setUd(holder.parent);
  }
  // the Liver Booster's cap is the separate node `Cap` (on the model's own axis); its neck thread is left-handed, so it turns clockwise
  const cap = m.getObjectByName('Cap');
  if (cap && !pivot && holder.parent){
    const y0 = cap.position.y;
    holder.parent.userData.unscrew = u => { const k = Math.min(1, Math.max(0, u)), e = k*k*(3 - 2*k); cap.rotation.y = -k*2.5*Math.PI*2; cap.position.y = y0 + e*.5; };
  }
  // the Liver Booster's ingredients moment (liver-pour.js) drives the cap and the liquid level in the bottle
  if (cap && !pivot && holder.parent && m.getObjectByName('Bottle')){
    const ud = holder.parent.userData, bm = m.getObjectByName('Bottle');
    ud.liverCap = cap; ud.capRest = cap.position.clone(); ud.modelRoot = m; ud.liverFill = bm.material && bm.material.userData && bm.material.userData.uFill;
  }
}

function withGlb(builder, url){
  return (p, o) => {
    const base = builder(p, o), holder = new THREE.Group();
    holder.add(base.G);
    holder._baseH = base.h;
    loadGlb(url).then(src => {
      const { wrap, m } = applyModelStyling(src.clone(true), base.h, holder);
      holder.remove(base.G); holder.add(wrap);
      holder._gridWrap = wrap;
      holder._currentWrap = wrap;
      bindModelHooks(m, holder);
      window.dispatchEvent(new Event('tl:model-ready'));   // sizes taken from the stand-in are out of date now
    }).catch(() => { /* keep the drawn product */ });
    return { G: holder, h: base.h };
  };
}

async function swapToHd(jar, p) {
  if (!jar || !p || !HD_LOADERS[p.id]) return;
  if (jar._isHd || jar._loadingHd) return;
  jar._loadingHd = true;
  try {
    const url = await HD_LOADERS[p.id]();
    if (!jar._loadingHd) return;
    new GLTFLoader().load(url, gltf => {
      if (!jar._loadingHd) {
        disposeObject(gltf.scene);
        return;
      }
      const holder = jar.b && jar.b.children && jar.b.children[0];
      if (!holder) {
        disposeObject(gltf.scene);
        return;
      }
      const baseH = holder._baseH || jar.h || 4.0;
      const { wrap: wrapHd, m: mHd } = applyModelStyling(gltf.scene, baseH, holder);
      const oldWrap = holder._currentWrap;

      if (oldWrap) {
        holder.remove(oldWrap);
      }
      holder.add(wrapHd);
      holder._currentWrap = wrapHd;
      holder._hdWrap = wrapHd;
      jar._isHd = true;
      jar._loadingHd = false;

      bindModelHooks(mHd, holder);
      window.dispatchEvent(new Event('tl:model-ready'));
    }, undefined, () => {
      jar._loadingHd = false;
    });
  } catch (e) {
    jar._loadingHd = false;
  }
}

function restoreFromHd(jar) {
  if (!jar) return;
  jar._loadingHd = false;
  if (!jar._isHd) return;
  const holder = jar.b && jar.b.children && jar.b.children[0];
  if (!holder || !holder._gridWrap) return;

  const hdWrap = holder._hdWrap;
  const gridWrap = holder._gridWrap;
  const gridModel = gridWrap.children[0];

  holder.remove(hdWrap);
  holder.add(gridWrap);
  holder._currentWrap = gridWrap;
  holder._hdWrap = null;
  jar._isHd = false;

  if (gridModel) {
    bindModelHooks(gridModel, holder);
  }

  if (hdWrap) {
    disposeObject(hdWrap);
  }
}

const BUILDERS = { jar:withGlb(() => ({ G: new THREE.Group(), h: 4.0 }), lungBoosterGlbUrl), inhaler:calmInhaler, rollon:withGlb(calmRollOn, cycleReliefGlbUrl), reviva:revivaRollOn, liver:withGlb(liverBottle, liverGlbUrl),
  energy:withGlb(() => ({ G: new THREE.Group(), h: 4.4 }), energyGlbUrl) };

// Builds a product, centred on its own middle. Returns a group with userData.h (its height).
function makeProduct(p, i, o = {}){
  const { G, h } = BUILDERS[p.model](p, o);
  G.position.y = -h/2;
  const g = new THREE.Group(); g.add(G);
  g.userData = { index:i, h };
  if (G.userData.capPivot) {
    g.userData.capPivot = G.userData.capPivot;
    g.userData.capRest = G.userData.capRest;
    g.userData.ball = G.userData.ball;
    g.userData.modelRoot = G.userData.modelRoot;
  }
  g.traverse(m => { m.userData.product = i; });
  return g;
}

// A curled leaf for scene dressing.
function studioLeaf(color){
  const sh = new THREE.Shape(); sh.moveTo(0,-.5); sh.bezierCurveTo(.3,-.28,.3,.22,0,.5); sh.bezierCurveTo(-.3,.22,-.3,-.28,0,-.5);
  const geo = new THREE.ShapeGeometry(sh, 12); const pos = geo.attributes.position;
  for (let i=0;i<pos.count;i++){ const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, x*x*1.1 + y*y*.25); } geo.computeVertexNormals();
  const t = canvasTex('leaf' + color, 128, 256, (g) => {
    const gr = g.createLinearGradient(0,0,0,256); gr.addColorStop(0, color); gr.addColorStop(1, '#2d5527'); g.fillStyle = gr; g.fillRect(0,0,128,256);
    g.strokeStyle = 'rgba(235,245,200,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(64,256); g.lineTo(64,6); g.stroke(); g.lineWidth = 1.5;
    for (let k=1;k<9;k++){ const y = 256 - k*26; g.beginPath(); g.moveTo(64,y); g.lineTo(18,y-26); g.moveTo(64,y); g.lineTo(110,y-26); g.stroke(); }
  });
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map:t, side:THREE.DoubleSide, roughness:.5, envMapIntensity:.5 }));
}

export { makeProduct, berryGeometry, gummyMaterial, studioLeaf, swapToHd, restoreFromHd };
