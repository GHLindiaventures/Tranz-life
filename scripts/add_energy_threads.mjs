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
const used = new Set();
js.meshes.forEach(m => m.primitives.forEach(p => { Object.values(p.attributes).forEach(a => used.add(a)); used.add(p.indices); }));
const accMap = new Map(), bvs = [], accs = [], parts = []; let len = 0;
function put(buf, extra){ const pad = (4 - len % 4) % 4; if (pad){ parts.push(Buffer.alloc(pad)); len += pad; } bvs.push({ buffer:0, byteOffset:len, byteLength:buf.length, ...extra }); parts.push(buf); len += buf.length; return bvs.length - 1; }
js.accessors.forEach((a, i) => { if (!used.has(i)) return; const bv = js.bufferViews[a.bufferView];
  const nb = put(all.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength), { ...(bv.byteStride ? { byteStride:bv.byteStride } : {}), ...(bv.target ? { target:bv.target } : {}) });
  accMap.set(i, accs.length); accs.push({ ...a, bufferView:nb }); });
(js.images || []).forEach(im => { const bv = js.bufferViews[im.bufferView], src = all.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength);
  const img = im.mimeType === 'image/jpeg' ? shrink(src) : src; console.log(`texture ${(src.length/1e6).toFixed(1)} MB -> ${(img.length/1e6).toFixed(1)} MB`);
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
