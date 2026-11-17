// Energy Booster bottle (meshy scan, one mesh): split the wooden lid off as its own part and add a threaded neck,
// ready for the same unscrew animation as the Lung Booster jar.
//
// What it does (the original mesh is never edited, only re-indexed):
//   1. The single scan mesh is split by height (triangle centre above CUT_Y = lid) into `Energy_Body` and `Energy_Cap`.
//      Both keep the same vertices/material, so nothing changes visually while the lid is closed.
//   2. `Energy_Cap` is wrapped in `Jar_Cap_Pivot`, placed on the lid's own axis (product-model.js looks for that name and
//      drives the unscrew from it). Turns / lift for the animation are stored as glTF extras on the pivot.
//   3. `Energy_Neck` (a neck tube with a rounded lip and a seal) and `Energy_Thread` (a right-handed thread, crest just
//      inside the lid's inner wall) are added. They are hidden inside the lid while it is closed and show as it unscrews.
//      Both use the scan's own material with every UV pinned to a point on the scanned neck, so they match its colour.
//
// usage: node scripts/add_energy_threads.mjs <original.glb> <out.glb>   (always run on the ORIGINAL scan)
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Scan layout (lid axis): shoulder up to ~0.61, neck collar r 0.165 from 0.628 to 0.660, then the lid: a flat bottom ring
// (r 0.165 -> 0.194 at y 0.660), a single-surface wooden wall r 0.194 and the top at 0.951. The lid has no inner wall.
const CUT_Y = 0.6585;                      // the lid's bottom ring sits at 0.660, the neck collar ends just under it
const RING_Y = 0.664, RING_R = 0.188;      // lid triangles below RING_Y and inside RING_R = its flat bottom ring: removed (it would cut through the thread)
const NECK_R = 0.1648;                     // added neck: flush with the scanned collar (0.165), a hair inside it to avoid z-fighting
const NECK_Y0 = 0.645, NECK_TOP = 0.840;
const LID_IN = 0.184, LID_Y0 = 0.6605, LID_TOP = 0.935;   // added inner lid wall (gives the lid its thickness)
const THREAD_Y0 = 0.676, THREAD_Y1 = 0.812, TURNS = 2.5, BUMP = 0.0105, RIDGE_H = 0.020;
const SEG = 128, STEPS_PER_TURN = 128, ARC = 9;
const BACK_LABEL = true, LABEL_TOP = 0.52;   // repaint the back of the label with the front artwork (below the shoulder)

/* ---------- glb io ---------- */
function readGlb(path){
  const f = readFileSync(path); let off = 12, js, bin;
  while (off < f.length){ const len = f.readUInt32LE(off), ty = f.toString('latin1', off + 4, off + 8);
    if (ty === 'JSON') js = JSON.parse(f.toString('utf8', off + 8, off + 8 + len)); else bin = Buffer.from(f.subarray(off + 8, off + 8 + len));
    off += 8 + len; }
  return { js, bin };
}
function readAcc(js, bin, i){
  const a = js.accessors[i], bv = js.bufferViews[a.bufferView], n = { SCALAR:1, VEC2:2, VEC3:3 }[a.type];
  const C = { 5126:Float32Array, 5125:Uint32Array, 5123:Uint16Array }[a.componentType];
  const start = (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || n*C.BYTES_PER_ELEMENT;
  const out = new C(a.count*n);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++){
    const p = start + k*stride + c*C.BYTES_PER_ELEMENT;
    out[k*n + c] = C === Float32Array ? bin.readFloatLE(p) : C === Uint32Array ? bin.readUInt32LE(p) : bin.readUInt16LE(p); }
  return out;
}

/* ---------- geometry helpers ---------- */
// least-squares circle through (x, z) points: x^2 + z^2 = 2ax + 2bz + c
function circleFit(pts){
  const M = [[0,0,0],[0,0,0],[0,0,0]], v = [0,0,0];
  for (const [x, z] of pts){ const row = [2*x, 2*z, 1], rhs = x*x + z*z;
    for (let i = 0; i < 3; i++){ v[i] += row[i]*rhs; for (let j = 0; j < 3; j++) M[i][j] += row[i]*row[j]; } }
  const det = m => m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1]) - m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0]) + m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
  const D = det(M), sol = [0,1,2].map(k => det(M.map((r, i) => r.map((x, j) => j === k ? v[i] : x)))/D);
  return { x:sol[0], z:sol[1], r:Math.sqrt(sol[2] + sol[0]**2 + sol[1]**2) };
}
// outermost point of each angular sector in a height band
function outerPoints(P, y0, y1, cx = 0, cz = 0, sectors = 36){
  const best = new Array(sectors).fill(null);
  for (let i = 0; i < P.length; i += 3){ const y = P[i+1]; if (y < y0 || y >= y1) continue;
    const dx = P[i] - cx, dz = P[i+2] - cz, r = Math.hypot(dx, dz), s = Math.min(sectors - 1, Math.floor((Math.atan2(dz, dx) + Math.PI)/(2*Math.PI)*sectors));
    if (!best[s] || r > best[s][2]) best[s] = [P[i], P[i+2], r]; }
  return best.filter(Boolean).map(([x, z]) => [x, z]);
}
// a lathe around (cx, cz): prof = [[r, y], ...] walked so the outward side is on the right
function lathe(c, prof, seg = SEG){
  const V = [], N = [], I = [], m = prof.length;
  const nrm = prof.map((_, i) => { const a = prof[Math.max(0, i - 1)], b = prof[Math.min(m - 1, i + 1)], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1; return [dy/l, -dr/l]; });
  for (let s = 0; s <= seg; s++){ const ph = 2*Math.PI*s/seg, co = Math.cos(ph), si = Math.sin(ph);
    prof.forEach(([r, y], j) => { V.push(c.x + r*co, y, c.z + r*si); N.push(nrm[j][0]*co, nrm[j][1], nrm[j][0]*si); }); }
  for (let s = 0; s < seg; s++) for (let j = 0; j < m - 1; j++){ const a = s*m + j, b = (s + 1)*m + j; I.push(a, b, b + 1, a, b + 1, a + 1); }
  return { V, N, I };
}
// a half-round ridge swept along a right-handed helix (climbs counter-clockwise seen from above)
function thread(c){
  const total = Math.round(TURNS*STEPS_PER_TURN), V = [], N = [], I = [], taper = .07;
  for (let s = 0; s <= total; s++){
    const t = s/total, ph = -2*Math.PI*TURNS*t, yc = THREAD_Y0 + (THREAD_Y1 - THREAD_Y0)*t;
    const k = t < taper ? .5 - .5*Math.cos(Math.PI*t/taper) : t > 1 - taper ? .5 - .5*Math.cos(Math.PI*(1 - t)/taper) : 1;
    const b = BUMP*k, hh = RIDGE_H*(.35 + .65*k);
    for (let j = 0; j < ARC; j++){ const al = -Math.PI/2 + Math.PI*j/(ARC - 1), y = yc + hh/2*Math.sin(al), r = NECK_R - .0015 + b*Math.cos(al);
      V.push(c.x + r*Math.cos(ph), y, c.z + r*Math.sin(ph));
      const nr = hh/2*Math.cos(al), na = b*Math.sin(al), l = Math.hypot(nr, na) || 1;
      N.push(nr/l*Math.cos(ph), na/l, nr/l*Math.sin(ph)); }
  }
  for (let s = 0; s < total; s++) for (let j = 0; j < ARC - 1; j++){ const a = s*ARC + j, b = (s + 1)*ARC + j; I.push(a, b, b + 1, a, b + 1, a + 1); }
  return { V, N, I };
}
// make every triangle face the way its vertex normals point
function fixWinding({ V, N, I }){
  let good = 0;
  for (let t = 0; t < I.length; t += 3){ const [a, b, c] = [I[t], I[t+1], I[t+2]].map(k => k*3);
    const e1 = [V[b]-V[a], V[b+1]-V[a+1], V[b+2]-V[a+2]], e2 = [V[c]-V[a], V[c+1]-V[a+1], V[c+2]-V[a+2]];
    const g = [e1[1]*e2[2]-e1[2]*e2[1], e1[2]*e2[0]-e1[0]*e2[2], e1[0]*e2[1]-e1[1]*e2[0]];
    const n = [0,1,2].map(q => N[a+q] + N[b+q] + N[c+q]);
    if (g[0]*n[0] + g[1]*n[1] + g[2]*n[2] >= 0) good++; }
  if (good < I.length/6) for (let t = 0; t < I.length; t += 3){ const x = I[t+1]; I[t+1] = I[t+2]; I[t+2] = x; }
  return { V, N, I };
}

/* ---------- patch ---------- */
const [src, dst] = process.argv.slice(2);
if (!src || !dst){ console.error('usage: node scripts/add_energy_threads.mjs <original.glb> <out.glb>'); process.exit(1); }
const { js, bin } = readGlb(src);
if (js.nodes.some(n => n.name === 'Jar_Cap_Pivot')){ console.error('already patched: run on the original scan'); process.exit(1); }
const chunks = [bin];
let binLen = bin.length;
function addBv(buf, target){
  const pad = (4 - binLen % 4) % 4; if (pad){ chunks.push(Buffer.alloc(pad)); binLen += pad; }
  js.bufferViews.push({ buffer:0, byteOffset:binLen, byteLength:buf.length, ...(target ? { target } : {}) });
  chunks.push(buf); binLen += buf.length; return js.bufferViews.length - 1;
}
function addAcc(arr, type, comp, target, minmax){
  const n = { SCALAR:1, VEC2:2, VEC3:3 }[type], a = { bufferView:addBv(Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength), target), componentType:comp, count:arr.length/n, type };
  if (minmax){ a.min = [0,1,2].map(c => { let m = Infinity; for (let i = c; i < arr.length; i += 3) m = Math.min(m, arr[i]); return m; });
               a.max = [0,1,2].map(c => { let m = -Infinity; for (let i = c; i < arr.length; i += 3) m = Math.max(m, arr[i]); return m; }); }
  js.accessors.push(a); return js.accessors.length - 1;
}

const meshIndex = js.nodes.find(n => n.mesh != null).mesh, nodeIndex = js.nodes.findIndex(n => n.mesh === meshIndex);
const prim = js.meshes[meshIndex].primitives[0];
const P = readAcc(js, bin, prim.attributes.POSITION), UV = readAcc(js, bin, prim.attributes.TEXCOORD_0), I = readAcc(js, bin, prim.indices);
const node = js.nodes[nodeIndex];
if (node.matrix && node.matrix.some((v, i) => v !== (i % 5 === 0 ? 1 : 0))){ console.error('the scan node has a transform: not handled'); process.exit(1); }
delete node.matrix;

// 1. split
const body = [], cap = [];
for (let t = 0; t < I.length; t += 3){ const cy = (P[I[t]*3+1] + P[I[t+1]*3+1] + P[I[t+2]*3+1])/3; if (cy < CUT_Y){ body.push(I[t], I[t+1], I[t+2]); continue; }
  const cr = Math.max(...[I[t], I[t+1], I[t+2]].map(k => Math.hypot(P[k*3], P[k*3+2])));
  if (cr < .168){ body.push(I[t], I[t+1], I[t+2]); continue; }   // the top row of the neck collar wall stays on the bottle
  if (cy < RING_Y && cr < RING_R) continue;                       // the lid's flat bottom ring
  cap.push(I[t], I[t+1], I[t+2]); }
console.log(`split at y=${CUT_Y}: body ${body.length/3} tris, cap ${cap.length/3} tris`);

prim.indices = addAcc(Uint32Array.from(body), 'SCALAR', 5125, 34963);
js.meshes[meshIndex].name = 'Mesh_Energy_Body'; node.name = 'Energy_Body';
js.meshes.push({ name:'Mesh_Energy_Cap', primitives:[{ attributes:{ ...prim.attributes }, indices:addAcc(Uint32Array.from(cap), 'SCALAR', 5125, 34963), material:prim.material }] });

// lid axis (from its outer wall) and neck axis (from the scanned neck)
let capC = circleFit(outerPoints(P, .70, .90));
capC = circleFit(outerPoints(P, .70, .90, capC.x, capC.z));
let neckC = circleFit(outerPoints(P, .628, .646, capC.x, capC.z));
console.log(`lid axis x ${capC.x.toFixed(4)} z ${capC.z.toFixed(4)} r ${capC.r.toFixed(4)} | neck axis x ${neckC.x.toFixed(4)} z ${neckC.z.toFixed(4)} r ${neckC.r.toFixed(4)}`);
// the lid's inner wall and the underside of its top (the neck must fit under both)
let innerR = Infinity, innerTop = Infinity;
for (let i = 0; i < P.length; i += 3){ const y = P[i+1], r = Math.hypot(P[i] - capC.x, P[i+2] - capC.z);
  if (y > .70 && y < .88 && r > .15) innerR = Math.min(innerR, r);
  if (y > .70 && r < .12) innerTop = Math.min(innerTop, y); }
console.log(`lid inner wall r ${innerR.toFixed(4)}, underside of lid top y ${innerTop.toFixed(4)}`);
if (LID_IN > innerR - .004) throw new Error('inner lid wall would show through the scanned wall');
if (NECK_R + BUMP > LID_IN - .004) throw new Error('thread crest would cut the inner lid wall');
if (NECK_TOP > LID_TOP - .02) throw new Error('neck is taller than the inside of the lid');

const capMesh = js.meshes.length - 1;
js.nodes.push({ name:'Energy_Cap', mesh:capMesh, translation:[-capC.x, 0, -capC.z] });
const capNode = js.nodes.length - 1;
js.nodes.push({ name:'Jar_Cap_Pivot', children:[capNode], translation:[capC.x, 0, capC.z], extras:{ turns:TURNS, lift:.46 } });
const pivotNode = js.nodes.length - 1;

// 2. neck + thread, coloured from the scanned neck: pin every UV to one neck vertex
let pick = -1, bestD = Infinity;
for (let i = 0; i < P.length/3; i++){ const y = P[i*3+1], r = Math.hypot(P[i*3] - neckC.x, P[i*3+2] - neckC.z);
  if (y > .630 && y < .646){ const d = Math.abs(r - neckC.r); if (d < bestD){ bestD = d; pick = i; } } }
const uv0 = [UV[pick*2], UV[pick*2+1]];
console.log(`neck colour from vertex ${pick} uv ${uv0.map(v => v.toFixed(4))}`);

const c = { x:neckC.x, z:neckC.z };
const neck = fixWinding(lathe(c, [[NECK_R, NECK_Y0], [NECK_R, NECK_TOP - .008], [NECK_R - .003, NECK_TOP - .001], [NECK_R - .009, NECK_TOP],
  [NECK_R - .015, NECK_TOP - .004], [NECK_R - .018, NECK_TOP - .012], [NECK_R - .018, NECK_TOP - .030], [0, NECK_TOP - .030]]));
const thr = fixWinding(thread(c));
function addPart(name, { V, N, I }){
  const uv = new Float32Array(V.length/3*2); for (let i = 0; i < uv.length; i += 2){ uv[i] = uv0[0]; uv[i+1] = uv0[1]; }
  const attributes = { POSITION:addAcc(Float32Array.from(V), 'VEC3', 5126, 34962, true), NORMAL:addAcc(Float32Array.from(N), 'VEC3', 5126, 34962), TEXCOORD_0:addAcc(uv, 'VEC2', 5126, 34962) };
  js.meshes.push({ name:'Mesh_' + name, primitives:[{ attributes, indices:addAcc(Uint32Array.from(I), 'SCALAR', 5125, 34963), material:prim.material }] });
  js.nodes.push({ name, mesh:js.meshes.length - 1 }); return js.nodes.length - 1;
}
const neckNode = addPart('Energy_Neck', neck), thrNode = addPart('Energy_Thread', thr);
// inner lid wall + bottom ring + underside of the top, wood coloured (UV pinned to a lid-wall vertex), on the lid's axis
let wpick = -1, wd = Infinity;
for (let i = 0; i < P.length/3; i++){ const y = P[i*3+1]; if (y > .74 && y < .76){ const d = Math.abs(Math.hypot(P[i*3] - capC.x, P[i*3+2] - capC.z) - capC.r); if (d < wd){ wd = d; wpick = i; } } }
uv0[0] = UV[wpick*2]; uv0[1] = UV[wpick*2+1];
const lidIn = fixWinding(lathe({ x:0, z:0 }, [[0, LID_TOP], [LID_IN, LID_TOP], [LID_IN, LID_Y0 + .004], [LID_IN + .002, LID_Y0], [innerR - .0005, LID_Y0]]));
const lidNode = addPart('Energy_Cap_Inner', lidIn);
js.nodes[pivotNode].children.push(lidNode);
console.log(`lid inner wall uv from vertex ${wpick}`);
console.log(`neck ${neck.V.length/3} verts, thread ${thr.V.length/3} verts`);

js.scenes[js.scene || 0].nodes.push(pivotNode, neckNode, thrNode);

// the scan's front label ("TranzLife ENERGY BOOSTERS") faces -Z; the site shows products from +Z, so turn the whole
// bottle half a turn about its height axis (one root node; the parts keep their own transforms inside it)
const scene = js.scenes[js.scene || 0];
js.nodes.push({ name:'Energy_Booster', rotation:[0, 1, 0, 0], children:scene.nodes.slice() });
scene.nodes = [js.nodes.length - 1];

// 3. make it lighter for the web: drop data nothing uses any more (the scan's original index list) and shrink textures
//    over MAX_TEX (the scan ships 4096px colour and normal maps) with Windows' System.Drawing, as JPEG
const MAX_TEX = 2048;
const all = Buffer.concat(chunks);
function shrink(buf){
  const dir = mkdtempSync(join(tmpdir(), 'tex-')), a = join(dir, 'in.jpg'), b = join(dir, 'out.jpg');
  writeFileSync(a, buf);
  const ps = `Add-Type -AssemblyName System.Drawing; $s=[System.Drawing.Image]::FromFile('${a}'); if ($s.Width -le ${MAX_TEX}) { exit 3 };` +
    `$d=New-Object System.Drawing.Bitmap ${MAX_TEX},${MAX_TEX}; $g=[System.Drawing.Graphics]::FromImage($d); $g.InterpolationMode='HighQualityBicubic'; $g.DrawImage($s,0,0,${MAX_TEX},${MAX_TEX});` +
    `$c=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|?{$_.MimeType -eq 'image/jpeg'}; $p=New-Object System.Drawing.Imaging.EncoderParameters 1;` +
    `$p.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality),([long]90); $d.Save('${b}',$c,$p); $s.Dispose(); $d.Dispose()`;
  try { execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio:'pipe' }); const r = readFileSync(b); if (r.length < 1e4) throw new Error('empty output'); return r; }
  catch (e){ if (e.status !== 3) console.warn('texture not resized (needs Windows PowerShell):', e.message.split('\n')[0]); return buf; }
  finally { rmSync(dir, { recursive:true, force:true }); }
}
// 3b. same label on both sides: the scan's back (+Z) carries garbled text, its front (-Z) the real label. The back part of
//     the colour and metal/roughness textures is repainted: each back texel takes the colour of the front point half a
//     turn round the bottle (same height). Only texels of back-label triangles are written. The cut runs down both sides.
function psRun(cmd){ execFileSync('powershell', ['-NoProfile', '-Command', 'Add-Type -AssemblyName System.Drawing; ' + cmd], { stdio:'pipe' }); }
function decodeTo(jpg, size){                        // jpeg -> { w, h, d: RGB top-down } at size x size
  const dir = mkdtempSync(join(tmpdir(), 'tex-')), a = join(dir, 'in.jpg'), b = join(dir, 'out.bmp');
  try { writeFileSync(a, jpg);
    psRun(`$s=[System.Drawing.Image]::FromFile('${a}'); $d=New-Object System.Drawing.Bitmap ${size},${size},([System.Drawing.Imaging.PixelFormat]::Format24bppRgb); $g=[System.Drawing.Graphics]::FromImage($d); $g.InterpolationMode='HighQualityBicubic'; $g.DrawImage($s,0,0,${size},${size}); $d.Save('${b}',[System.Drawing.Imaging.ImageFormat]::Bmp); $s.Dispose(); $d.Dispose()`);
    const f = readFileSync(b), off = f.readUInt32LE(10), w = f.readInt32LE(18), hh = f.readInt32LE(22), h = Math.abs(hh), bpp = f.readUInt16LE(28) / 8, row = Math.ceil(w*bpp/4)*4, d = new Uint8Array(w*h*3);
    for (let y = 0; y < h; y++){ const sy = hh > 0 ? h - 1 - y : y; for (let x = 0; x < w; x++){ const s = off + sy*row + x*bpp, t = (y*w + x)*3; d[t] = f[s+2]; d[t+1] = f[s+1]; d[t+2] = f[s]; } }
    return { w, h, d };
  } finally { rmSync(dir, { recursive:true, force:true }); }
}
function encodeJpg({ w, h, d }){
  const row = Math.ceil(w*3/4)*4, f = Buffer.alloc(54 + row*h);
  f.write('BM', 0); f.writeUInt32LE(f.length, 2); f.writeUInt32LE(54, 10); f.writeUInt32LE(40, 14); f.writeInt32LE(w, 18); f.writeInt32LE(h, 22); f.writeUInt16LE(1, 26); f.writeUInt16LE(24, 28); f.writeUInt32LE(row*h, 34);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const s = (y*w + x)*3, t = 54 + (h - 1 - y)*row + x*3; f[t] = d[s+2]; f[t+1] = d[s+1]; f[t+2] = d[s]; }
  const dir = mkdtempSync(join(tmpdir(), 'tex-')), a = join(dir, 'in.bmp'), b = join(dir, 'out.jpg');
  try { writeFileSync(a, f);
    psRun(`$s=[System.Drawing.Image]::FromFile('${a}'); $c=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|?{$_.MimeType -eq 'image/jpeg'}; $p=New-Object System.Drawing.Imaging.EncoderParameters 1; $p.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality),([long]90); $s.Save('${b}',$c,$p); $s.Dispose()`);
    return readFileSync(b);
  } finally { rmSync(dir, { recursive:true, force:true }); }
}
const backBake = BACK_LABEL ? (() => {
  const ax = circleFit(outerPoints(P, -.2, .2)), nv = P.length/3, TH = new Float32Array(nv);
  let Y0 = Infinity; for (let i = 0; i < nv; i++){ TH[i] = Math.atan2(P[i*3+2] - ax.z, P[i*3] - ax.x); Y0 = Math.min(Y0, P[i*3+1]); }
  const Y1 = LABEL_TOP + .03, GW = 1536, GH = 1536, gu = new Float32Array(GW*GH).fill(NaN), gv = new Float32Array(GW*GH);
  const isBack = [], tris = [];
  for (let t = 0; t < body.length; t += 3){ const k = [body[t], body[t+1], body[t+2]], cz = (P[k[0]*3+2] + P[k[1]*3+2] + P[k[2]*3+2])/3 - ax.z, cy = (P[k[0]*3+1] + P[k[1]*3+1] + P[k[2]*3+1])/3;
    tris.push(k); isBack.push(cz > 0 && cy < LABEL_TOP); }
  const unwrap = k => { const a = TH[k[0]]; return k.map(i => { let t = TH[i]; while (t - a > Math.PI) t -= 2*Math.PI; while (a - t > Math.PI) t += 2*Math.PI; return t; }); };
  // generic triangle rasteriser: calls fn(x, y, w0, w1, w2) for pixel centres within `grow` px of the triangle
  function raster(x0, y0, x1, y1, x2, y2, W, H, grow, fn){
    const A = (x1 - x0)*(y2 - y0) - (x2 - x0)*(y1 - y0); if (Math.abs(A) < 1e-9) return;
    const L = [Math.hypot(x2 - x1, y2 - y1), Math.hypot(x2 - x0, y2 - y0), Math.hypot(x1 - x0, y1 - y0)], hgt = L.map(l => Math.abs(A)/(l || 1));
    const minx = Math.max(0, Math.floor(Math.min(x0, x1, x2) - grow)), maxx = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2) + grow));
    const miny = Math.max(0, Math.floor(Math.min(y0, y1, y2) - grow)), maxy = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2) + grow));
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++){ const px = x + .5, py = y + .5;
      const w0 = ((x1 - px)*(y2 - py) - (x2 - px)*(y1 - py))/A, w1 = ((x2 - px)*(y0 - py) - (x0 - px)*(y2 - py))/A, w2 = 1 - w0 - w1;
      if (w0*hgt[0] >= -grow && w1*hgt[1] >= -grow && w2*hgt[2] >= -grow) fn(x, y, w0, w1, w2); }
  }
  // front: (angle, height) -> uv lookup grid
  const gx = t => (t + Math.PI)/Math.PI*GW, gy = y => (y - Y0)/(Y1 - Y0)*GH;
  tris.forEach((k, n) => { if (isBack[n]) return; const th = unwrap(k), cy = (P[k[0]*3+1] + P[k[1]*3+1] + P[k[2]*3+1])/3;
    if ((th[0] + th[1] + th[2])/3 > 0 || cy > Y1) return;
    raster(gx(th[0]), gy(P[k[0]*3+1]), gx(th[1]), gy(P[k[1]*3+1]), gx(th[2]), gy(P[k[2]*3+1]), GW, GH, .5, (x, y, a, b, c) => {
      gu[y*GW + x] = a*UV[k[0]*2] + b*UV[k[1]*2] + c*UV[k[2]*2]; gv[y*GW + x] = a*UV[k[0]*2+1] + b*UV[k[1]*2+1] + c*UV[k[2]*2+1]; }); });
  for (let pass = 0; pass < 6; pass++) for (let i = 0; i < GW*GH; i++) if (isNaN(gu[i])){ const x = i % GW, y = (i/GW) | 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; const j = yy*GW + xx; if (!isNaN(gu[j])){ gu[i] = gu[j]; gv[i] = gv[j]; break; } } }
  const look = (t, y) => { const i = Math.min(GH - 1, Math.max(0, gy(y) | 0))*GW + Math.min(GW - 1, Math.max(0, gx(t) | 0)); return isNaN(gu[i]) ? null : [gu[i], gv[i]]; };
  return (img, flat = false) => {                       // img: { w, h, d } -> repainted copy (flat: a normal map, made flat there)
    const { w, h, d } = img, out = new Uint8Array(d), keep = new Uint8Array(w*h);
    // texels that belong to any other triangle (front, cap, shoulder) are never written
    tris.forEach((k, n) => { if (!isBack[n]) raster(UV[k[0]*2]*w, UV[k[0]*2+1]*h, UV[k[1]*2]*w, UV[k[1]*2+1]*h, UV[k[2]*2]*w, UV[k[2]*2+1]*h, w, h, 0, (x, y) => { keep[y*w + x] = 1; }); });
    for (let t = 0; t < cap.length; t += 3){ const k = [cap[t], cap[t+1], cap[t+2]]; raster(UV[k[0]*2]*w, UV[k[0]*2+1]*h, UV[k[1]*2]*w, UV[k[1]*2+1]*h, UV[k[2]*2]*w, UV[k[2]*2+1]*h, w, h, 0, (x, y) => { keep[y*w + x] = 1; }); }
    // bilinear, but only from texels that belong to a real (non back-label) triangle, so chart padding never bleeds in
    const sample = (u, v, o) => { const fx = Math.min(w - 1.001, Math.max(0, u*w - .5)), fy = Math.min(h - 1.001, Math.max(0, v*h - .5)), x = fx | 0, y = fy | 0, ax_ = fx - x, ay = fy - y;
      const taps = [[y, x, (1 - ax_)*(1 - ay)], [y, x + 1, ax_*(1 - ay)], [y + 1, x, (1 - ax_)*ay], [y + 1, x + 1, ax_*ay]].filter(([yy, xx]) => keep[yy*w + xx]);
      if (!taps.length) return false; const sw = taps.reduce((a, t) => a + t[2], 0) || 1;
      for (let c = 0; c < 3; c++) out[o + c] = taps.reduce((a, [yy, xx, wt]) => a + d[(yy*w + xx)*3 + c]*wt, 0)/sw; return true; };
    let n = 0; const own = new Uint8Array(w*h);         // 1 = front/other texel, 2 = repainted back texel
    for (let i = 0; i < w*h; i++) if (keep[i]) own[i] = 1;
    tris.forEach((k, ti) => { if (!isBack[ti]) return; const th = unwrap(k);
      raster(UV[k[0]*2]*w, UV[k[0]*2+1]*h, UV[k[1]*2]*w, UV[k[1]*2+1]*h, UV[k[2]*2]*w, UV[k[2]*2+1]*h, w, h, 1.5, (x, y, a, b, c) => {
        const i = y*w + x; if (keep[i]) return;
        const t = a*th[0] + b*th[1] + c*th[2] - Math.PI, yy = a*P[k[0]*3+1] + b*P[k[1]*3+1] + c*P[k[2]*3+1];
        const uv = look(((t + 3*Math.PI) % (2*Math.PI)) - Math.PI, yy); if (flat){ out[i*3] = 128; out[i*3+1] = 128; out[i*3+2] = 255; own[i] = 2; n++; return; }
        if (uv && sample(uv[0], uv[1], i*3)){ own[i] = 2; n++; } }); });
    // edge fill: the padding round each texture patch takes the colour of the nearest patch (front patches keep their own
    // padding untouched, back patches spread their new colour), so smaller mip levels never mix in the old back text
    for (let pass = 0; pass < 8; pass++){ const prev = own.slice();
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++){ const i = y*w + x; if (prev[i]) continue;
        let front = 0, bk = 0, r = 0, g = 0, b = 0;
        for (const j of [i - 1, i + 1, i - w, i + w]){ if (prev[j] === 1) front++; else if (prev[j] === 2){ bk++; r += out[j*3]; g += out[j*3+1]; b += out[j*3+2]; } }
        if (front >= bk && front) own[i] = 1; else if (bk){ own[i] = 2; out[i*3] = r/bk; out[i*3+1] = g/bk; out[i*3+2] = b/bk; } } }
    console.log(`back label repainted: ${n} texels of ${w}x${h}`);
    return { w, h, d:out };
  };
})() : null;
const baseMat = js.materials[prim.material].pbrMetallicRoughness;
const normalImage = js.materials[prim.material].normalTexture ? js.textures[js.materials[prim.material].normalTexture.index].source : -1;   // its back is flattened (old text relief)
const repaintImages = new Set([baseMat.baseColorTexture, baseMat.metallicRoughnessTexture].filter(Boolean).map(t => js.textures[t.index].source));

const used = new Set();
js.meshes.forEach(m => m.primitives.forEach(p => { Object.values(p.attributes).forEach(a => used.add(a)); used.add(p.indices); }));
const accMap = new Map(), bvs = [], accs = [], parts = []; let len = 0;
function put(buf, extra){ const pad = (4 - len % 4) % 4; if (pad){ parts.push(Buffer.alloc(pad)); len += pad; } bvs.push({ buffer:0, byteOffset:len, byteLength:buf.length, ...extra }); parts.push(buf); len += buf.length; return bvs.length - 1; }
js.accessors.forEach((a, i) => { if (!used.has(i)) return; const bv = js.bufferViews[a.bufferView];
  const nb = put(all.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength), { ...(bv.byteStride ? { byteStride:bv.byteStride } : {}), ...(bv.target ? { target:bv.target } : {}) });
  accMap.set(i, accs.length); accs.push({ ...a, bufferView:nb }); });
(js.images || []).forEach((im, ii) => { const bv = js.bufferViews[im.bufferView], src = all.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
  const img = backBake && (repaintImages.has(ii) || ii === normalImage) && im.mimeType === 'image/jpeg' ? encodeJpg(backBake(decodeTo(src, MAX_TEX), ii === normalImage))
    : im.mimeType === 'image/jpeg' ? shrink(src) : src; console.log(`texture ${(src.length/1e6).toFixed(1)} MB -> ${(img.length/1e6).toFixed(1)} MB`);
  im.bufferView = put(img, {}); });
js.meshes.forEach(m => m.primitives.forEach(p => { for (const k in p.attributes) p.attributes[k] = accMap.get(p.attributes[k]); p.indices = accMap.get(p.indices); }));
js.accessors = accs; js.bufferViews = bvs;
let out = Buffer.concat(parts); if (out.length % 4) out = Buffer.concat([out, Buffer.alloc(4 - out.length % 4)]);
js.buffers[0].byteLength = out.length;
let jb = Buffer.from(JSON.stringify(js)); if (jb.length % 4) jb = Buffer.concat([jb, Buffer.alloc(4 - jb.length % 4, 0x20)]);
const head = Buffer.alloc(12); head.write('glTF', 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + jb.length + 8 + out.length, 8);
const ch = (len, ty) => { const b = Buffer.alloc(8); b.writeUInt32LE(len, 0); b.write(ty, 4, 'latin1'); return b; };
writeFileSync(dst, Buffer.concat([head, ch(jb.length, 'JSON'), jb, ch(out.length, 'BIN\0'), out]));
console.log('wrote', dst, (12 + 16 + jb.length + out.length)/1e6, 'MB');
