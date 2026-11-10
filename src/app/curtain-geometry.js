// Pure helpers for the leaf-scallop section curtains (phase B). No DOM access, so they are unit-tested.

const VB_W = 1200, VB_H = 100, VALLEY = 74;

// Tip height of leaf i: a fixed, irregular-looking pattern so the edge reads organic but never changes between loads.
function leafTip(i){ return 6 + ((i * 37 + 11) % 5) * 6; }

// SVG path (viewBox 0 0 1200 100) for a row of n pointed leaves; solid below the leaves.
function leafEdgePath(n){
  const count = Math.max(1, Math.round(n)), w = VB_W / count;
  let d = `M0,${VB_H} L0,${VALLEY}`;
  for (let i = 0; i < count; i++){
    const x = i * w, tip = leafTip(i), c = tip + 14;
    d += ` Q${(x + w*.08).toFixed(1)},${c} ${(x + w/2).toFixed(1)},${tip} Q${(x + w*.92).toFixed(1)},${c} ${(x + w).toFixed(1)},${VALLEY}`;
  }
  return d + ` L${VB_W},${VB_H} Z`;
}

// Centre-line "veins" for each leaf, drawn as a faint stroke.
function leafVeinPath(n){
  const count = Math.max(1, Math.round(n)), w = VB_W / count;
  let d = '';
  for (let i = 0; i < count; i++){ const cx = (i * w + w/2).toFixed(1); d += `M${cx},${VB_H} L${cx},${leafTip(i) + 9} `; }
  return d.trim();
}

// The curtain is one block: a leaf edge of height `edge`, a solid body of height `vh`, and a mirrored leaf edge.
// With the block's top at `y`, is a point at viewport height `cy` behind solid curtain (half of each edge counts)?
function curtainCovers(y, edge, vh, cy){
  return cy >= y + edge * .5 && cy <= y + edge + vh + edge * .5;
}

export { leafEdgePath, leafVeinPath, curtainCovers, leafTip, VB_W, VB_H };
