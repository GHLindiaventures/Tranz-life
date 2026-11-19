// "The Living Banyan" (banyan.html): the stand-in artwork, drawn as SVG from code in the light palette.
// Every layer here is a placeholder for one AI plate (docs: the prompt list in the hand-off). When a plate arrives,
// its layer's SVG is replaced by the image; the layer's place and depth (stage.js) stay the same.
// All drawing is in world coordinates: x across the screen, y down the whole tree (0 = the sky above the canopy).
import { seeded, clamp, lerp } from '../../utils/math.js';

export const PAL = {
  skyTop: '#fbf4e6', skyLow: '#f3ead6',
  hillFar: '#e4eadb', hillNear: '#d7e1c8', trees: '#c6d6b0', treesLow: '#d3dfc0',
  leafLight: ['#d6e7bb', '#c8dea8', '#bcd69a'], leafMid: ['#a9c78a', '#9dbf7d', '#93b874'], leafShade: ['#86ad69', '#7ba361', '#729a5a'],
  bark: '#bfa27f', barkLight: '#d6c09d', barkShade: '#a88b6c', barkLine: '#9a7e61',
  root: '#b9a083', rootShade: '#a68b6e',
  grass: '#c2d7a2', grassDeep: '#adc78c', blade: '#9fbe7c',
  soil: '#efe3ca', soilMid: '#e8d8bb', soilLow: '#f2e9d6', pebble: '#dccaa8', soilRoot: '#cdb48e',
  gold: '#d6a144', goldSoft: 'rgba(222, 170, 80, .28)'
};

// the shape of the whole scene for a screen size
export function geometry(W, H){
  const phone = W < 700;
  const cx = W / 2;
  const cw = phone ? W * 1.55 : Math.min(W * 1.04, H * 2.3);      // canopy width
  const canopyTop = H * (phone ? .5 : .46), canopyBase = H * 1.62;
  const tw = phone ? W * .46 : Math.min(W * .27, H * .62);         // trunk width
  const trunkTop = H * 1.42, ground = H * 4.55, world = H * 6.75;
  // the helix of the science chapter: beside the trunk on wide screens, over it on phones
  const hx = phone ? cx : Math.min(W * .86, cx + tw / 2 + Math.min(W * .17, 250));
  const h0 = H * (phone ? 3.2 : 3.02), h1 = H * (phone ? 3.72 : 3.86);
  return { phone, W, H, cx, cw, canopyTop, canopyBase, tw, trunkTop, ground, world, hx, h0, h1 };
}

// the six products stand where six aerial roots meet the ground
export function productSpots(G){
  const { W, H, cx, ground, phone } = G;
  if (phone){
    const r = Math.min(52, W * .13);
    return Array.from({ length: 6 }, (_, i) => ({ x: cx + (i % 2 ? 1 : -1) * W * .22, y: ground - H * .5 + Math.floor(i / 2) * H * .175, r }));
  }
  const r = clamp(W * .045, 46, 74);
  return Array.from({ length: 6 }, (_, i) => ({ x: W * (.1 + i * .16), y: ground - H * .1, r }));
}

// ---------- helpers ----------
const f = n => n.toFixed(1);
export const svg = (W, y0, h, body, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${f(W)}" height="${f(h)}" viewBox="0 ${f(y0)} ${f(W)} ${f(h)}" preserveAspectRatio="none" aria-hidden="true" ${extra}>${body}</svg>`;
// a tapered stroke along a cubic bezier: a filled outline, thick at the start and thin at the end
export function taper(p0, p1, p2, p3, w0, w1, n = 18){
  const L = [], R = [];
  for (let i = 0; i <= n; i++){
    const t = i / n, u = 1 - t;
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const l = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, t) / 2;
    L.push([x - dy / l * w, y + dx / l * w]); R.push([x + dy / l * w, y - dx / l * w]);
  }
  return 'M' + L.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'L' + R.reverse().map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
}
// a banyan leaf: a broad oval with a blunt tip and pale veins (unit size, pointing up)
export const LEAF = 'M0 -1C.56 -.96 .64 -.22 .52 .3C.4 .78 .12 1 0 1C-.12 1 -.4 .78 -.52 .3C-.64 -.22 -.56 -.96 0 -1Z';
const VEINS = 'M0 .98L0 -.9M0 .5L.38 .2M0 .5L-.38 .2M0 .12L.44 -.2M0 .12L-.44 -.2M0 -.28L.36 -.56M0 -.28L-.36 -.56';
// vw: the vein width in drawn units (null vein: no veins, for tiny texture leaves)
export function leaf(x, y, s, rot, fill, vein = 'rgba(240, 246, 222, .55)', vw = 1.4){
  const veins = vein ? `<path d="${VEINS}" stroke="${vein}" stroke-width="${(vw / s).toFixed(3)}" fill="none" stroke-linecap="round"/>` : '';
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})"><path d="${LEAF}" fill="${fill}"/>${veins}<path d="M0 1L0 1.32" stroke="${fill}" stroke-width="${(vw * 1.7 / s).toFixed(3)}" stroke-linecap="round"/></g>`;
}

// ---------- the far layers ----------
export function hills(W, H, ridge, amp, fill, seed, h){
  const R = seeded(seed), n = 7, pts = [];
  for (let i = 0; i <= n; i++) pts.push([W * i / n, ridge + (R() - .5) * amp * 2]);
  let d = `M0 ${f(h)}L0 ${f(pts[0][1])}`;
  for (let i = 1; i <= n; i++){ const a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2; d += `Q${f(a[0])} ${f(a[1])} ${f(mx)} ${f((a[1] + b[1]) / 2)}`; }
  d += `L${f(W)} ${f(pts[n][1])}L${f(W)} ${f(h)}Z`;
  return svg(W, 0, h, `<path d="${d}" fill="${fill}"/>`);
}
export function treeline(W, H, ridge, seed, h){
  const R = seeded(seed); let b = '';
  for (let x = -40; x < W + 60; x += 26 + R() * 30){
    const r = 26 + R() * 34, y = ridge + (R() - .5) * 26;
    b += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${PAL.trees}"/><circle cx="${f(x - r * .3)}" cy="${f(y - r * .35)}" r="${f(r * .55)}" fill="#d0ddba"/>`;
  }
  b += `<rect x="0" y="${f(ridge)}" width="${f(W)}" height="${f(h - ridge)}" fill="url(#tlg)"/>`;
  const defs = `<defs><linearGradient id="tlg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.trees}"/><stop offset=".12" stop-color="${PAL.treesLow}"/><stop offset="1" stop-color="#e2e9d4"/></linearGradient></defs>`;
  return svg(W, 0, h, defs + b);
}

// ---------- the canopy, with its branches ----------
export function canopy(G){
  const { W, H, cx, cw, canopyTop, canopyBase, phone, tw } = G, R = seeded(11), Hc = canopyBase - canopyTop;
  const top = u => canopyTop + Hc * .55 * Math.pow(Math.abs(u), 2.2);
  const bot = u => canopyBase + Hc * .14 * Math.pow(Math.abs(u), 1.5);
  const y0 = canopyTop - H * .12, y1 = canopyBase + H * .28;
  const N = phone ? 420 : 520, clumps = [];
  for (let i = 0; i < N; i++){
    const u = Math.sign(R() - .5) * Math.pow(R(), phone ? 1.15 : .85), v = Math.pow(R(), .8);
    const y = lerp(top(u), bot(u), v), r = cw * (.022 + R() * .03) * (phone ? 1.35 : 1) * (1 - Math.abs(u) * .25);
    clumps.push({ x: cx + u * cw / 2 * .96, y, r, v });
  }
  clumps.sort((a, b) => a.y - b.y);
  const pick = a => a[Math.floor(R() * a.length)];
  // a clump of foliage: a shaded underside, a scalloped top and a small soft highlight (sun from the upper left)
  const draw = c => {
    const t = c.v < .4 ? 0 : c.v < .75 ? 1 : 2;
    const base = [PAL.leafLight, PAL.leafMid, PAL.leafShade][t][Math.floor(R() * 3)];
    const shade = [PAL.leafMid, PAL.leafShade, ['#6c9353', '#678e4f', '#62894b']][t][Math.floor(R() * 3)];
    const hi = ['#e4efcf', '#cfe2b0', '#a9c78a'][t];
    let g = `<circle cx="${f(c.x + c.r * .16)}" cy="${f(c.y + c.r * .24)}" r="${f(c.r * .94)}" fill="${shade}"/><circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(c.r)}" fill="${base}"/>`;
    for (let k = 0; k < 4; k++){
      const a = -2.8 + k * .75 + (R() - .5) * .3;
      g += `<circle cx="${f(c.x + Math.cos(a) * c.r * .74)}" cy="${f(c.y + Math.sin(a) * c.r * .74)}" r="${f(c.r * (.38 + R() * .14))}" fill="${base}"/>`;
    }
    return g + `<circle cx="${f(c.x - c.r * .34)}" cy="${f(c.y - c.r * .4)}" r="${f(c.r * .26)}" fill="${hi}" opacity=".55"/>`;
  };
  // branches: from the top of the trunk out under the canopy (between its upper clumps and its shaded underside)
  let br = '';
  const nb = phone ? 7 : 11;
  for (let i = 0; i < nb; i++){
    const u = (i / (nb - 1) * 2 - 1) * (.92 + R() * .08), ex = cx + u * cw * .44, ey = lerp(top(u), bot(u), .62);
    const sx = cx + (R() - .5) * tw * .5, sy = canopyBase + H * .16;
    br += `<path d="${taper([sx, sy], [sx + (ex - sx) * .2, sy - H * .12], [ex - (ex - sx) * .3, ey + H * .05], [ex, ey], tw * (.2 + R() * .08), 4)}" fill="${i % 2 ? PAL.bark : PAL.barkShade}"/>`;
  }
  const upper = clumps.filter(c => c.v < .72).map(draw).join(''), under = clumps.filter(c => c.v >= .72).map(draw).join('');
  // a sprinkle of single leaves for texture, sunlit on the upper left
  let tex = '';
  for (let i = 0; i < (phone ? 160 : 300); i++){
    const u = R() * 2 - 1, y = lerp(top(u), bot(u), Math.pow(R(), 1.6) * .8);
    tex += leaf(cx + u * cw / 2 * .94, y, 4 + R() * 5, R() * 360, u < .2 && y < (top(u) + bot(u)) / 2 ? '#e6f0d0' : pick(PAL.leafLight), null);
  }
  return svg(W, y0, y1 - y0, upper + br + under + tex);
}

// ---------- the trunk: many stems fused into one, wide where it meets the ground ----------
export function trunk(G){
  const { W, H, cx, tw, trunkTop, ground } = G, R = seeded(23);
  const half = y => { const t = clamp((y - trunkTop) / (ground - trunkTop), 0, 1); return tw / 2 * (1 + 1.1 * Math.pow(t, 7) + .25 * Math.pow(1 - t, 5)); };
  const steps = 40, L = [], Rr = [];
  for (let i = 0; i <= steps; i++){
    const y = lerp(trunkTop, ground + H * .04, i / steps), w = half(y);
    L.push([cx - w + Math.sin(i * .9 + 1) * tw * .025, y]); Rr.push([cx + w + Math.sin(i * .7 + 4) * tw * .025, y]);
  }
  const outline = 'M' + L.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'L' + Rr.reverse().map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
  const defs = `<defs><linearGradient id="bk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${PAL.barkLight}"/><stop offset=".45" stop-color="${PAL.bark}"/><stop offset="1" stop-color="${PAL.barkShade}"/></linearGradient></defs>`;
  // the fused stems: wavy fissures down the trunk, each with a sunlit edge
  let stems = '';
  const ns = 9;
  for (let s = 0; s < ns; s++){
    const k = s / (ns - 1) * 2 - 1, ph = R() * 6, wv = .5 + R();
    let d = '', dh = '';
    for (let i = 0; i <= steps; i++){
      const y = lerp(trunkTop, ground + H * .02, i / steps), x = cx + k * half(y) * .86 + Math.sin(i * .35 * wv + ph) * tw * .03;
      d += (i ? 'L' : 'M') + f(x) + ' ' + f(y); dh += (i ? 'L' : 'M') + f(x - 3) + ' ' + f(y);
    }
    stems += `<path d="${dh}" stroke="${PAL.barkLight}" stroke-width="1.4" fill="none" opacity=".7"/><path d="${d}" stroke="${PAL.barkLine}" stroke-width="${f(1.6 + R() * 2.4)}" fill="none" opacity=".6"/>`;
  }
  let knots = '';
  for (let i = 0; i < 14; i++){
    const y = lerp(trunkTop + H * .3, ground - H * .3, R()), x = cx + (R() - .5) * half(y) * 1.4;
    knots += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(5 + R() * 9)}" ry="${f(10 + R() * 16)}" fill="none" stroke="${PAL.barkLine}" stroke-width="1.6" opacity=".5"/>`;
  }
  let moss = '';
  for (let i = 0; i < 22; i++){
    const y = lerp(trunkTop + H * .2, ground - H * .1, R()), x = cx - half(y) * (.55 + R() * .4);
    moss += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(8 + R() * 18)}" ry="${f(4 + R() * 8)}" fill="#bcd29c" opacity=".55"/>`;
  }
  const y0 = trunkTop - 4;
  return svg(W, y0, ground + H * .1 - y0, defs + `<path d="${outline}" fill="url(#bk)"/>` + stems + knots + moss);
}

// ---------- aerial roots, hanging from the branches (and six that became pillars, one for each product) ----------
export function aerialRoots(G){
  const { W, H, cx, cw, tw, canopyBase, ground, phone } = G, R = seeded(37);
  const y0 = canopyBase - H * .2; let b = '';
  const strand = (x, ya, yb, w, col) => {
    const sw = (R() - .5) * 18;
    b += `<path d="${taper([x, ya], [x + sw, lerp(ya, yb, .35)], [x - sw, lerp(ya, yb, .7)], [x + sw * .3, yb], w, Math.max(.8, w * .45))}" fill="${col}"/>`;
    if (yb < ground - 20) for (let t = 0; t < 4; t++) b += `<path d="M${f(x + sw * .3)} ${f(yb - 4)}l${f((R() - .5) * 12)} ${f(8 + R() * 10)}" stroke="${col}" stroke-width=".9" fill="none"/>`;
  };
  const n = phone ? 10 : 18;
  for (let i = 0; i < n; i++){
    const u = R() * 2 - 1, x = cx + u * cw * .45;
    if (Math.abs(x - cx) < tw * .5) continue;
    const ya = canopyBase - H * .05 + Math.pow(Math.abs(u), 1.5) * H * .14;
    // most stop short; a few long ones reach the ground
    const reach = R() < .18 ? ground + 6 : lerp(ya + H * .25, ya + H * 1.4, Math.pow(R(), 1.4));
    const w = reach > ground ? 5 + R() * 6 : 1.4 + R() * 2.4, col = R() < .5 ? PAL.root : PAL.rootShade;
    strand(x, ya, reach, w, col);
    if (R() < .35) strand(x + 5 + R() * 6, ya + 10, Math.min(reach, ya + H * (.3 + R() * .6)), w * .6, col);
  }
  // the six pillars: each lands where a product stands
  productSpots(G).forEach((p, i) => {
    if (phone && i > 1) return;
    const x = phone ? (i ? W * .9 : W * .1) : p.x;
    strand(x, canopyBase - H * .02, ground + 8, 7 + R() * 5, PAL.rootShade);
  });
  return svg(W, y0, ground + H * .1 - y0, b);
}

// ---------- the ground: a band of meadow, and the trunk's roots spreading over it ----------
export function groundPlate(G){
  const { W, H, cx, tw, ground } = G, R = seeded(41), y0 = ground - H * .14, h = H * .3;
  let top = `M0 ${f(ground + H * .12)}L0 ${f(ground)}`;
  for (let x = 0; x <= W + 40; x += 40) top += `L${f(x)} ${f(ground + Math.sin(x * .011) * H * .012)}`;
  top += `L${f(W)} ${f(ground + H * .12)}Z`;
  const defs = `<defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.grass}"/><stop offset=".7" stop-color="${PAL.grassDeep}"/><stop offset="1" stop-color="${PAL.soil}"/></linearGradient></defs>`;
  let blades = '';
  for (let x = 0; x < W; x += 5 + R() * 6){
    const y = ground + Math.sin(x * .011) * H * .012 + 2;
    blades += `<path d="M${f(x)} ${f(y)}q${f((R() - .5) * 6)} ${f(-6 - R() * 10)} ${f((R() - .5) * 10)} ${f(-10 - R() * 12)}" stroke="${PAL.blade}" stroke-width="1.3" fill="none"/>`;
    if (R() < .04) blades += `<circle cx="${f(x)}" cy="${f(y - 12)}" r="2.6" fill="#e8c46a"/>`;
  }
  // buttress roots: the trunk's foot spreading out over the ground
  let flare = '';
  for (let i = 0; i < 9; i++){
    const s = i < 4 ? -1 : 1, k = (i % 4) / 3, sx = cx + s * tw * (.3 + k * .5), ex = cx + s * tw * (.8 + k * 1.1 + R() * .4);
    flare += `<path d="${taper([sx, ground - H * .06], [sx + s * tw * .2, ground - H * .01], [ex - s * tw * .2, ground + H * .02], [ex, ground + H * .045], tw * .14, 3)}" fill="${i % 2 ? PAL.bark : PAL.barkShade}"/>`;
  }
  return svg(W, y0, h, defs + `<path d="${top}" fill="url(#gr)"/>` + flare + blades);
}

// ---------- underground: pale warm soil, with the tree's roots spreading through it ----------
export function underground(G){
  const { W, H, cx, tw, ground, world } = G, R = seeded(53), y0 = ground + H * .04, h = world - y0;
  const defs = `<defs><linearGradient id="sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PAL.soilMid}"/><stop offset=".25" stop-color="${PAL.soil}"/><stop offset="1" stop-color="${PAL.soilLow}"/></linearGradient></defs>`;
  let peb = '';
  for (let i = 0; i < 260; i++){
    const y = y0 + Math.pow(R(), 1.3) * h * .8, x = R() * W;
    peb += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.5 + R() * 4)}" ry="${f(1 + R() * 2.5)}" fill="${PAL.pebble}" opacity="${f(.4 + R() * .5)}"/>`;
  }
  let roots = '';
  const grow = (x, y, ang, len, w, depth) => {
    if (depth > 4 || w < .7) return;
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    roots += `<path d="${taper([x, y], [x + Math.cos(ang + .3) * len * .4, y + Math.sin(ang + .3) * len * .4], [ex - Math.cos(ang - .3) * len * .3, ey - Math.sin(ang - .3) * len * .3], [ex, ey], w, w * .5, 10)}" fill="${PAL.soilRoot}" opacity=".85"/>`;
    const kids = 2 + Math.floor(R() * 2);
    for (let k = 0; k < kids; k++) grow(ex, ey, ang + (R() - .5) * 1.3, len * (.55 + R() * .2), w * .55, depth + 1);
  };
  for (let i = 0; i < 9; i++){
    const s = i / 8 * 2 - 1;
    grow(cx + s * tw * .5, y0 + 4, Math.PI / 2 + s * 1.15 + (R() - .5) * .2, H * (.28 + R() * .14), tw * .09, 0);
  }
  return svg(W, y0, h, defs + `<rect x="0" y="${f(y0)}" width="${f(W)}" height="${f(h)}" fill="url(#sl)"/>` + peb + roots);
}

// ---------- the golden thread: one line from a leaf in the canopy, down the trunk, through the helix, to the six
// products and on through the earth. Polylines in world coordinates; stage.js draws each one as far as the visitor has come.
export function threads(G){
  const { H, cx, cw, tw, canopyTop, canopyBase, trunkTop, ground, hx, h0, h1, phone } = G;
  const bez = (p0, p1, p2, p3, n = 40) => Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  });
  const lines = [];
  const A = phone ? 34 : 54, P = H * .27;
  const strand = ph => Array.from({ length: 81 }, (_, i) => { const y = lerp(h0, h1, i / 80); return [hx + A * Math.sin((y - h0) / P * Math.PI * 2 + ph), y]; });
  const s1 = strand(0), s2 = strand(Math.PI);
  // leaf -> down the trunk's right side -> the helix
  const leafAt = [cx + cw * .16, canopyTop + (canopyBase - canopyTop) * .5];
  const side = cx + tw * .32;
  const main = [
    ...bez(leafAt, [leafAt[0], leafAt[1] + H * .3], [side + 40, trunkTop + H * .05], [side, trunkTop + H * .35]),
    ...Array.from({ length: 50 }, (_, i) => { const y = lerp(trunkTop + H * .35, h0 - H * .2, i / 49); return [side + Math.sin(i * .4) * 6, y]; }),
    ...bez([side, h0 - H * .2], [side, h0 - H * .08], [s1[0][0], h0 - H * .1], s1[0], 24),
    ...s1
  ];
  lines.push({ pts: main, w: 2.2 }, { pts: s2, w: 2.2 });
  for (let k = 1; k < 24; k++){
    const y = lerp(h0, h1, k / 24), x1 = hx + A * Math.sin((y - h0) / P * Math.PI * 2), x2 = hx + A * Math.sin((y - h0) / P * Math.PI * 2 + Math.PI);
    lines.push({ pts: [[x1, y], [x2, y]], w: 1, soft: true });
  }
  // the helix's end -> a junction -> the six products
  const jy = ground - H * (phone ? .62 : .26), junction = [cx, jy];
  const tail = s1[s1.length - 1];
  lines.push({ pts: bez(tail, [tail[0], tail[1] + H * .08], [cx, jy - H * .1], junction, 30), w: 2.2 });
  const spots = productSpots(G);
  spots.forEach(p => lines.push({ pts: bez(junction, [junction[0], jy + H * .06], [p.x, p.y - p.r - H * .1], [p.x, p.y - p.r - 6], 30), w: 1.6 }));
  // and on through the earth: every product's root runs down and gathers again under the call to action
  const hub = [cx, ground + H * .62];
  spots.forEach(p => lines.push({ pts: bez([p.x, p.y + p.r + 30], [p.x, ground + H * .2], [lerp(p.x, cx, .6), ground + H * .4], hub, 36), w: 1.4 }));
  return lines;
}

// ---------- near layers (they move faster than the tree): hanging roots at the screen's edges ----------
// place(Y) turns a world height into this layer's own coordinate, so a root is level with the tree when centred on screen
export function curtain(G, place, h){
  const { W, H, phone } = G, R = seeded(61); let b = '';
  const n = phone ? 3 : 5;
  for (let i = 0; i < n; i++){
    const left = i % 2 === 0, x = left ? W * (.015 + R() * .09) : W * (.9 + R() * .09);
    const ya = place(H * (1.5 + R() * .2)), yb = place(H * (2.6 + R() * 1.4)), w = (phone ? 5 : 8) + R() * 8, sw = (R() - .5) * 30;
    b += `<path d="${taper([x, ya], [x + sw, lerp(ya, yb, .3)], [x - sw, lerp(ya, yb, .7)], [x, yb], w, w * .4, 24)}" fill="${R() < .5 ? PAL.root : PAL.rootShade}"/>`;
    for (let t = 0; t < 5; t++) b += `<path d="M${f(x)} ${f(yb - 6)}l${f((R() - .5) * 20)} ${f(10 + R() * 16)}" stroke="${PAL.rootShade}" stroke-width="1.2" fill="none"/>`;
  }
  return svg(W, 0, h, b);
}
