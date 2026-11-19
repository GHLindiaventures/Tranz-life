// The film's effects layer: one 2D canvas over the scenes, with small systems each stage switches on and off.
//   petals   marigold and rose petals drifting down through the light, turning as they fall (stage 1 garden)
//   motes    specks of light rising (dark stages)
//   shards   the screen breaking: dark glass shards flying out from the centre (stage 1 -> 2)
//   burn     palm-leaf manuscripts burning away with a glowing edge, scrubbed by the scroll (stage 2)
//   stroke   the golden light that follows a finger drawing the sun (the loader)
import { clamp } from '../utils/math.js';
import { reduce } from '../utils/media.js';

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);

function initFx(canvas){
  const g = canvas.getContext('2d');
  let W = 1, H = 1, dpr = 1;
  function resize(){ dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; }
  resize(); addEventListener('resize', resize);
  const phone = () => W < 760;

  // ---------------------------------------------------------------- petals
  const PETAL_COLS = ['#f4a7b9', '#f6b5c4', '#ef8fa8', '#f3b04a', '#f6c35f', '#fbd9a6'];
  const petals = { on: 0, want: 0, list: [] };
  function makePetal(top){
    return { x: Math.random() * W, y: top ? rnd(-H * .2, -20) : Math.random() * H, z: rnd(.4, 1.6), r: rnd(0, TAU), vr: rnd(-1.5, 1.5), ph: rnd(0, TAU),
      vy: rnd(18, 46), sway: rnd(14, 40), c: PETAL_COLS[Math.floor(Math.random() * PETAL_COLS.length)] };
  }
  for (let i = 0; i < 46; i++) petals.list.push(makePetal(false));
  function drawPetals(dt, t){
    petals.on += (petals.want - petals.on) * (1 - Math.exp(-dt * 2));
    if (petals.on < .01) return;
    const n = phone() ? 24 : petals.list.length;
    for (let i = 0; i < n; i++){
      const p = petals.list[i];
      p.y += p.vy * p.z * dt; p.x += Math.sin(t * .8 + p.ph) * p.sway * dt; p.r += p.vr * dt;
      if (p.y > H + 40) Object.assign(p, makePetal(true));
      const s = 9 * p.z, flip = Math.cos(t * 1.7 + p.ph);
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(flip, 1);
      g.globalAlpha = petals.on * (p.z > 1.2 ? .55 : .9);
      g.fillStyle = p.c; g.beginPath(); g.moveTo(0, -s); g.bezierCurveTo(s * .9, -s * .6, s * .8, s * .7, 0, s); g.bezierCurveTo(-s * .8, s * .7, -s * .9, -s * .6, 0, -s); g.fill();
      g.globalAlpha *= .35; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-s * .2, -s * .2, s * .18, s * .5, .3, 0, TAU); g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- leafs: green leaves drifting across, turning
  const LEAF_COLS = ['#5f9a3c', '#7fb04f', '#4f8a3a', '#93c160', '#6fa84a'];
  const leafs = { on: 0, want: 0, list: Array.from({ length: 26 }, () => ({ x: Math.random(), y: Math.random(), z: rnd(.5, 1.5), r: rnd(0, TAU), vr: rnd(-.8, .8), ph: rnd(0, TAU), v: rnd(.02, .05), c: LEAF_COLS[Math.floor(Math.random() * LEAF_COLS.length)] })) };
  function drawLeafs(dt, t){
    leafs.on += (leafs.want - leafs.on) * (1 - Math.exp(-dt * 2.5));
    if (leafs.on < .01) return;
    const n = phone() ? 14 : leafs.list.length;
    for (let i = 0; i < n; i++){
      const p = leafs.list[i];
      p.x += p.v * p.z * dt; p.y += Math.sin(t * .6 + p.ph) * .012 * dt; p.r += p.vr * dt;
      if (p.x > 1.08){ p.x = -.08; p.y = Math.random(); }
      const s = 16 * p.z, flip = Math.cos(t * 1.1 + p.ph);
      g.save(); g.translate(p.x * W, p.y * H); g.rotate(p.r); g.scale(flip, 1);
      g.globalAlpha = leafs.on * (p.z > 1.2 ? .5 : .85);
      g.fillStyle = p.c; g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(-s * .2, -s * .55, s, 0); g.quadraticCurveTo(-s * .2, s * .55, -s, 0); g.fill();
      g.strokeStyle = 'rgba(230,245,200,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s * .9, 0); g.stroke();
      g.restore();
    }
    g.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- motes
  const motes = { on: 0, want: 0, color: '231,198,128', list: Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(.6, 2.2), v: rnd(.01, .035), ph: rnd(0, TAU) })) };
  function drawMotes(dt, t){
    motes.on += (motes.want - motes.on) * (1 - Math.exp(-dt * 2));
    if (motes.on < .01) return;
    g.globalCompositeOperation = 'lighter';
    for (const m of motes.list){
      m.y -= m.v * dt; if (m.y < -.02){ m.y = 1.02; m.x = Math.random(); }
      g.globalAlpha = motes.on * (.25 + .4 * (.5 + .5 * Math.sin(t * 1.4 + m.ph)));
      g.fillStyle = `rgb(${motes.color})`; g.beginPath(); g.arc((m.x + Math.sin(t * .3 + m.ph) * .01) * W, m.y * H, m.r, 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- shards (time based)
  let shards = null;
  function shatter(color = '#050505'){
    if (reduce) return;
    const cx = W / 2, cy = H / 2, list = [];
    for (let i = 0; i < (phone() ? 30 : 48); i++){
      const a = rnd(0, TAU), d = rnd(0, Math.min(W, H) * .25), s = rnd(14, 70);
      const pts = Array.from({ length: 3 + Math.floor(Math.random() * 2) }, (_, k) => { const q = k / 4 * TAU + rnd(-.5, .5); return [Math.cos(q) * s * rnd(.5, 1.2), Math.sin(q) * s * rnd(.5, 1.2)]; });
      list.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, vx: Math.cos(a) * rnd(260, 900), vy: Math.sin(a) * rnd(260, 900) - 80, r: rnd(0, TAU), vr: rnd(-6, 6), pts, z: rnd(.6, 1.6) });
    }
    shards = { list, t: 0, color };
  }
  function drawShards(dt){
    if (!shards) return;
    shards.t += dt; if (shards.t > 2.2){ shards = null; return; }
    const a = clamp(1.6 - shards.t * .8, 0, 1);
    g.fillStyle = shards.color;
    for (const s of shards.list){
      s.x += s.vx * dt * s.z; s.y += s.vy * dt * s.z; s.vy += 140 * dt; s.r += s.vr * dt;
      g.save(); g.translate(s.x, s.y); g.rotate(s.r); g.scale(s.z, s.z); g.globalAlpha = a;
      g.beginPath(); s.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- burning palm-leaf manuscripts (scrubbed: burn 0..1)
  // Three ola leaves (long, tapered, fibre-grained, two string holes, rows of Devanagari script), each painted once
  // into its own canvas. The burn eats them by a noise field: burnt cells are cut out, a glowing ember band runs
  // along the edge, with a charred rim behind it. Repainted only when the burn amount changes.
  const leaves = { on: 0, b: 0, key: '', made: null, out: null };
  const LEAF_N = [[.3, .2, -.08], [.7, .8, .07], [.26, .8, -.05]];   // x, y (of screen), tilt: round the words, not over them
  const SCRIPT = 'तुलसी वासा कालमेघ आमलकी शुण्ठी पिप्पली कटुकी ';   // tulsi, vasaka, kalmegh, amla, dry ginger, long pepper, kutki
  function makeLeaves(){
    const lw = Math.round(Math.min(W * .58, 720)), lh = Math.round(lw * .15), cell = 4;
    return LEAF_N.map((_, k) => {
      const c = document.createElement('canvas'); c.width = lw; c.height = lh; const x = c.getContext('2d');
      // the leaf: tapered at both ends
      x.beginPath(); x.moveTo(0, lh / 2);
      x.bezierCurveTo(lw * .04, lh * .02, lw * .2, 0, lw * .5, lh * .04); x.bezierCurveTo(lw * .8, 0, lw * .96, lh * .02, lw, lh / 2);
      x.bezierCurveTo(lw * .96, lh * .98, lw * .8, lh, lw * .5, lh * .96); x.bezierCurveTo(lw * .2, lh, lw * .04, lh * .98, 0, lh / 2); x.closePath();
      const gr = x.createLinearGradient(0, 0, 0, lh); gr.addColorStop(0, '#d9bf86'); gr.addColorStop(.5, '#e8d4a0'); gr.addColorStop(1, '#c9a96a');
      x.fillStyle = gr; x.fill(); x.save(); x.clip();
      for (let i = 0; i < 60; i++){ x.strokeStyle = `rgba(${120 + Math.random() * 40 | 0},${90 + Math.random() * 30 | 0},40,${.06 + Math.random() * .1})`; x.lineWidth = Math.random() * 1.4 + .3; const y = Math.random() * lh; x.beginPath(); x.moveTo(0, y); x.lineTo(lw, y + rnd(-2, 2)); x.stroke(); }
      x.fillStyle = 'rgba(58,34,12,.78)'; x.font = `${Math.round(lh * .17)}px "Tiro Devanagari Sanskrit", "Nirmala UI", serif`; x.textBaseline = 'middle';
      for (let r = 0; r < 3; r++){ let line = ''; while (x.measureText(line).width < lw) line += SCRIPT; x.fillText(line, -k * 30 - r * 17, lh * (.3 + r * .2)); }
      const hole = (hx) => { x.fillStyle = 'rgba(40,24,8,.85)'; x.beginPath(); x.arc(hx, lh / 2, lh * .05, 0, TAU); x.fill(); };
      hole(lw * .2); hole(lw * .8);
      x.restore();
      x.strokeStyle = 'rgba(90,60,20,.5)'; x.lineWidth = 1.2; x.stroke();
      // the noise field that decides where it burns first (from the lower-left, ragged)
      const cols = Math.ceil(lw / cell), rows = Math.ceil(lh / cell), f = new Float32Array(cols * rows);
      const seeds = Array.from({ length: 7 }, () => [Math.random() * cols, Math.random() * rows, rnd(.5, 1)]);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++){
        let n = 0; seeds.forEach(([sx, sy, w]) => { n += w * Math.sin(i * .09 * w + sx) * Math.cos(j * .3 * w + sy); });
        f[j * cols + i] = clamp(.5 + n * .09 + (i / cols) * .55 - .15 + Math.random() * .05, 0, 1);
      }
      return { c, f, cols, rows, cell, lw, lh };
    });
  }
  function renderLeaves(){
    if (!leaves.made || leaves.made[0].lw !== Math.round(Math.min(W * .58, 720))) leaves.made = makeLeaves();
    const out = leaves.out || (leaves.out = document.createElement('canvas'));
    out.width = W; out.height = H; const o = out.getContext('2d');
    leaves.made.forEach((L, k) => {
      const b = clamp(leaves.b * 1.3 - k * .14, 0, 1.2);
      const t = document.createElement('canvas'); t.width = L.lw; t.height = L.lh; const x = t.getContext('2d');
      x.drawImage(L.c, 0, 0);
      x.globalCompositeOperation = 'destination-out';
      for (let j = 0; j < L.rows; j++) for (let i = 0; i < L.cols; i++){ if (L.f[j * L.cols + i] < b) x.fillRect(i * L.cell, j * L.cell, L.cell + .5, L.cell + .5); }
      x.globalCompositeOperation = 'source-atop';
      for (let j = 0; j < L.rows; j++) for (let i = 0; i < L.cols; i++){
        const n = L.f[j * L.cols + i] - b;
        if (n >= 0 && n < .1){ x.fillStyle = n < .035 ? `rgba(255,${170 + n * 2000 | 0},70,.95)` : `rgba(40,22,8,${(1 - (n - .035) / .065) * .85})`; x.fillRect(i * L.cell, j * L.cell, L.cell + .5, L.cell + .5); }
      }
      o.save(); o.translate(W * LEAF_N[k][0], H * LEAF_N[k][1]); o.rotate(LEAF_N[k][2]);
      o.shadowColor = b > .02 && b < 1 ? 'rgba(255,140,40,.65)' : 'rgba(0,0,0,.4)'; o.shadowBlur = b > .02 && b < 1 ? 26 : 30; o.shadowOffsetY = b > .02 ? 0 : 14;
      o.drawImage(t, -L.lw / 2, -L.lh / 2);
      o.restore();
    });
  }
  function drawLeaves(dt){
    if (leaves.on < .01) return;
    const key = leaves.b.toFixed(3) + '|' + W + 'x' + H;
    if (key !== leaves.key){ leaves.key = key; renderLeaves(); }
    g.globalAlpha = leaves.on; g.drawImage(leaves.out, 0, 0, W, H); g.globalAlpha = 1;
    if (leaves.b > .02 && leaves.b < 1 && !reduce){            // embers rising
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 30; i++){ g.fillStyle = `rgba(255,${150 + Math.random() * 90 | 0},60,${Math.random() * .8 * leaves.on})`; const s = Math.random() * 2.5 + .8; g.fillRect(W * (.15 + Math.random() * .7), H * (.2 + Math.random() * .55) - Math.random() * 80, s, s); }
      g.globalCompositeOperation = 'source-over';
    }
  }

  // ---------------------------------------------------------------- the ink (the drawn infinity), in screen px
  const stroke = { pts: [], fade: 1, shown: 1 };
  function addInk(x, y){
    const now = performance.now(), q = stroke.pts[stroke.pts.length - 1];
    let w = 9;
    if (q){
      const d = Math.hypot(x - q.x, y - q.y), sp = d / Math.max(8, now - q.t);      // px per ms
      if (d < 1.5) return;
      w = clamp(11 - sp * 5, 3.2, 11);
      w = q.w + (w - q.w) * .35;                                                   // the brush does not jump
    }
    stroke.pts.push({ x, y, t: now, w });
  }
  function drawStroke(dt){
    stroke.shown += (stroke.fade - stroke.shown) * (1 - Math.exp(-dt * 5));
    if (!stroke.pts.length || stroke.shown < .01) return;
    const P = stroke.pts;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.globalAlpha = stroke.shown;
    g.shadowColor = 'rgba(240,192,96,.85)'; g.shadowBlur = 22;
    g.strokeStyle = 'rgba(240,192,96,.35)';
    for (let i = 1; i < P.length; i++){ g.lineWidth = P[i].w * 3.2; g.beginPath(); g.moveTo(P[i - 1].x, P[i - 1].y); g.lineTo(P[i].x, P[i].y); g.stroke(); }
    g.shadowBlur = 0;
    for (let i = 1; i < P.length; i++){
      const a = P[i - 1], b = P[i], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      g.lineWidth = b.w; g.strokeStyle = '#fff3cf';
      g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo(a.x, a.y, mx, my); g.lineTo(b.x, b.y); g.stroke();
    }
    g.strokeStyle = 'rgba(200,140,40,.55)';                                            // the ink's darker heart
    for (let i = 1; i < P.length; i++){ g.lineWidth = Math.max(1, P[i].w * .35); g.beginPath(); g.moveTo(P[i - 1].x, P[i - 1].y); g.lineTo(P[i].x, P[i].y); g.stroke(); }
    g.globalAlpha = 1;
  }

  let last = 0;
  function frame(t){
    const dt = Math.min(.05, (t - (last || t))); last = t;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    drawLeaves(dt); drawMotes(dt, t); drawLeafs(dt, t); drawPetals(dt, t); drawShards(dt); drawStroke(dt);
  }
  return {
    frame, resize, shatter,
    wipe(){ stroke.pts = []; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height); },
    petals(on){ petals.want = reduce ? 0 : on; },
    leafs(on){ leafs.want = reduce ? 0 : on; },
    motes(on, color){ motes.want = reduce ? 0 : on; if (color) motes.color = color; },
    leaves(on, b){ leaves.on = on; if (b !== undefined) leaves.b = b; },
    stroke: { add(x, y){ stroke.fade = 1; addInk(x, y); }, clear(){ stroke.pts = []; stroke.shown = 1; }, fade(v){ stroke.fade = v; } }
  };
}

export { initFx };
