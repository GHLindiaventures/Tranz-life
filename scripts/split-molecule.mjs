import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const inputPngPath = path.join(rootDir, 'src', 'assets', 'molecules', 'water-molecule-chain.png');
const outDir = path.join(rootDir, 'src', 'assets', 'molecules', 'pieces');
const debugOutDir = path.join(rootDir, 'scripts', '_out');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(debugOutDir, { recursive: true });

const srcData = fs.readFileSync(inputPngPath);
const srcPng = PNG.sync.read(srcData);
const { width: W, height: H, data: srcPixels } = srcPng;

console.log(`Loaded ${inputPngPath}: ${W}x${H}`);

// 1. Binary mask: alpha > 24
const mask = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  mask[i] = srcPixels[i * 4 + 3] > 24 ? 1 : 0;
}

// 2. Exact Euclidean Distance Transform (Felzenszwalb-Huttenlocher 1D parabolic envelope)
function edt1D(f, n) {
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;

  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }

  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const dx = q - v[k];
    d[q] = dx * dx + f[v[k]];
  }
  return d;
}

function edt2D(binaryMask, w, h) {
  const INF = 1e9;
  const f = new Float64Array(Math.max(w, h));
  const d2 = new Float64Array(w * h);

  // Column pass
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      f[y] = binaryMask[y * w + x] ? INF : 0;
    }
    const dCol = edt1D(f, h);
    for (let y = 0; y < h; y++) {
      d2[y * w + x] = dCol[y];
    }
  }

  // Row pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      f[x] = d2[y * w + x];
    }
    const dRow = edt1D(f, w);
    for (let x = 0; x < w; x++) {
      d2[y * w + x] = dRow[x];
    }
  }

  const dist = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    dist[i] = Math.sqrt(d2[i]);
  }
  return dist;
}

const dist = edt2D(mask, W, H);

// 3. Local maxima of distance transform with radius >= 5.5px
const candidates = [];
const R_MIN = 5.5;

for (let y = 2; y < H - 2; y++) {
  for (let x = 2; x < W - 2; x++) {
    const idx = y * W + x;
    const r = dist[idx];
    if (r < R_MIN) continue;

    let isMax = true;
    for (let dy = -2; dy <= 2 && isMax; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nIdx = (y + dy) * W + (x + dx);
        if (dist[nIdx] > r) {
          isMax = false;
          break;
        }
      }
    }
    if (isMax) {
      candidates.push({ x, y, r });
    }
  }
}

candidates.sort((a, b) => b.r - a.r);

// Merge maxima closer than 0.8 * radius
const spheres = [];
for (const cand of candidates) {
  let tooClose = false;
  for (const s of spheres) {
    const d = Math.hypot(cand.x - s.x, cand.y - s.y);
    if (d < 0.8 * Math.max(cand.r, s.r) || d < Math.min(cand.r, s.r)) {
      tooClose = true;
      break;
    }
  }
  if (!tooClose) {
    spheres.push({ id: spheres.length, x: cand.x, y: cand.y, r: cand.r });
  }
}

console.log(`\nDetected ${spheres.length} spheres (target: 10-14):`);
console.table(spheres.map(s => ({
  id: s.id,
  x: s.x,
  y: s.y,
  radius: s.r.toFixed(1)
})));

// 4. Weighted Voronoi map for all mask pixels
// effective distance d_k(p) = hypot(p.x - C_k.x, p.y - C_k.y) - R_k
const voronoiPrimary = new Int16Array(W * H).fill(-1);
const voronoiSecondary = new Int16Array(W * H).fill(-1);
const voronoiDelta = new Float32Array(W * H).fill(0);

// Also track which spheres are neighbors (connected via Voronoi boundary on opaque pixels)
const neighborPairs = new Set();

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = y * W + x;
    if (!mask[idx]) continue;

    let bestDist = Infinity, secondDist = Infinity;
    let bestId = -1, secondId = -1;

    for (let k = 0; k < spheres.length; k++) {
      const s = spheres[k];
      const d = Math.hypot(x - s.x, y - s.y) - s.r;
      if (d < bestDist) {
        secondDist = bestDist;
        secondId = bestId;
        bestDist = d;
        bestId = k;
      } else if (d < secondDist) {
        secondDist = d;
        secondId = k;
      }
    }

    voronoiPrimary[idx] = bestId;
    voronoiSecondary[idx] = secondId;
    voronoiDelta[idx] = secondDist - bestDist;
  }
}

// Find connected neighbor pairs
for (let y = 0; y < H - 1; y++) {
  for (let x = 0; x < W - 1; x++) {
    const idx = y * W + x;
    const a = voronoiPrimary[idx];
    if (a < 0) continue;

    const r1 = voronoiPrimary[idx + 1];
    const b1 = voronoiPrimary[idx + W];
    if (r1 >= 0 && r1 !== a) {
      neighborPairs.add(a < r1 ? `${a}-${r1}` : `${r1}-${a}`);
    }
    if (b1 >= 0 && b1 !== a) {
      neighborPairs.add(a < b1 ? `${a}-${b1}` : `${b1}-${a}`);
    }
  }
}

console.log('Connected neighbor pairs:', Array.from(neighborPairs));

// 5. Select 4 high-quality pair pieces with natural bond connections:
// Pairs:
// Pair A: (8, 9) top small beads
// Pair B: (6, 10) or (3, 10) / (3, 6) middle stem
// Pair C: (4, 2) lower right
// Pair D: (2, 7) far right
const candidatePairs = [
  [8, 9],
  [3, 10].filter(id => id < spheres.length).length === 2 ? [3, 10] : [3, 6],
  [4, 2],
  [2, 7]
];
console.log('Selected pairs for small molecule chains:', candidatePairs);

// Helper function to extract and crop a piece
function extractPiece(pixelFilter, featherDeltaFn) {
  let minX = W, minY = H, maxX = -1, maxY = -1;
  const pieceMask = new Uint8Array(W * H);
  const feather = new Float32Array(W * H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (!mask[idx]) continue;
      if (pixelFilter(x, y, idx)) {
        pieceMask[idx] = 1;
        const delta = featherDeltaFn(x, y, idx);
        // Feather cut edge over ~3px
        feather[idx] = Math.min(1.0, Math.max(0.0, delta / 3.0));
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  // Add 3px padding
  const pad = 3;
  const cropX0 = Math.max(0, minX - pad);
  const cropY0 = Math.max(0, minY - pad);
  const cropX1 = Math.min(W - 1, maxX + pad);
  const cropY1 = Math.min(H - 1, maxY + pad);
  const pieceW = cropX1 - cropX0 + 1;
  const pieceH = cropY1 - cropY0 + 1;

  const piecePng = new PNG({ width: pieceW, height: pieceH });

  for (let py = 0; py < pieceH; py++) {
    const srcY = cropY0 + py;
    for (let px = 0; px < pieceW; px++) {
      const srcX = cropX0 + px;
      const srcIdx = srcY * W + srcX;
      const dstIdx = (py * pieceW + px) * 4;

      if (pieceMask[srcIdx]) {
        piecePng.data[dstIdx] = srcPixels[srcIdx * 4];
        piecePng.data[dstIdx + 1] = srcPixels[srcIdx * 4 + 1];
        piecePng.data[dstIdx + 2] = srcPixels[srcIdx * 4 + 2];
        const origA = srcPixels[srcIdx * 4 + 3];
        piecePng.data[dstIdx + 3] = Math.round(origA * feather[srcIdx]);
      } else {
        piecePng.data[dstIdx] = 0;
        piecePng.data[dstIdx + 1] = 0;
        piecePng.data[dstIdx + 2] = 0;
        piecePng.data[dstIdx + 3] = 0;
      }
    }
  }

  return { png: piecePng, w: pieceW, h: pieceH, minX, minY, maxX, maxY };
}

const manifest = [];
const pieceRecords = [];

// 6. Generate Single Sphere Pieces
for (let i = 0; i < spheres.length; i++) {
  const s = spheres[i];
  const piece = extractPiece(
    (x, y, idx) => voronoiPrimary[idx] === i,
    (x, y, idx) => voronoiDelta[idx]
  );

  if (!piece) {
    console.warn(`Warning: Piece ${i} is empty!`);
    continue;
  }

  const fileName = `sphere-${String(i + 1).padStart(2, '0')}.png`;
  const filePath = path.join(outDir, fileName);
  fs.writeFileSync(filePath, PNG.sync.write(piece.png));

  // Weight spawn frequency: many small spheres, the biggest node rarely
  let weight = 1.0;
  if (s.r > 26) weight = 0.22;
  else if (s.r > 18) weight = 0.55;
  else weight = 1.0;

  const record = {
    file: fileName,
    w: piece.w,
    h: piece.h,
    kind: 'sphere',
    radiusPx: +s.r.toFixed(1),
    weight: +weight.toFixed(2)
  };
  manifest.push(record);
  pieceRecords.push({ ...record, png: piece.png });
  console.log(`Saved ${fileName}: ${piece.w}x${piece.h} (radius: ${s.r.toFixed(1)}px, weight: ${weight})`);
}

// 7. Generate Pair Pieces
for (let pIdx = 0; pIdx < candidatePairs.length; pIdx++) {
  const [sA, sB] = candidatePairs[pIdx];
  const piece = extractPiece(
    (x, y, idx) => voronoiPrimary[idx] === sA || voronoiPrimary[idx] === sB,
    (x, y, idx) => {
      // Delta to closest other sphere not in the pair
      const cur = voronoiPrimary[idx];
      const other = voronoiSecondary[idx];
      if (other !== sA && other !== sB) {
        return voronoiDelta[idx];
      }
      // If secondary is the other pair member, calculate distance to 3rd closest
      let minOther = Infinity;
      const curDist = Math.hypot(x - spheres[cur].x, y - spheres[cur].y) - spheres[cur].r;
      for (let k = 0; k < spheres.length; k++) {
        if (k === sA || k === sB) continue;
        const d = Math.hypot(x - spheres[k].x, y - spheres[k].y) - spheres[k].r;
        if (d < minOther) minOther = d;
      }
      return Math.max(0, minOther - curDist);
    }
  );

  if (!piece) {
    console.warn(`Warning: Pair piece ${sA}-${sB} is empty!`);
    continue;
  }

  const fileName = `pair-${String(pIdx + 1).padStart(2, '0')}.png`;
  const filePath = path.join(outDir, fileName);
  fs.writeFileSync(filePath, PNG.sync.write(piece.png));

  const avgRadius = (spheres[sA].r + spheres[sB].r) / 2;
  const record = {
    file: fileName,
    w: piece.w,
    h: piece.h,
    kind: 'pair',
    radiusPx: +avgRadius.toFixed(1),
    weight: 0.45
  };
  manifest.push(record);
  pieceRecords.push({ ...record, png: piece.png });
  console.log(`Saved ${fileName}: ${piece.w}x${piece.h} (spheres [${sA}, ${sB}], weight: 0.45)`);
}

// 8. Write manifest.json
const manifestPath = path.join(outDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\nManifest written to ${manifestPath} with ${manifest.length} pieces.`);

// 9. Generate contact sheet (scripts/_out/contact-sheet.png)
// Composites each piece over dark (#151c16) and light (#f0f4ec) backgrounds side-by-side
const sheetCols = 5;
const cellW = 180, cellH = 180;
const sheetRows = Math.ceil(pieceRecords.length / sheetCols);
const sheetW = sheetCols * cellW * 2 + 20; // 2x for dark & light columns
const sheetH = sheetRows * cellH + 20;

const sheetPng = new PNG({ width: sheetW, height: sheetH });
// Fill background
for (let i = 0; i < sheetW * sheetH; i++) {
  sheetPng.data[i * 4] = 40;
  sheetPng.data[i * 4 + 1] = 40;
  sheetPng.data[i * 4 + 2] = 40;
  sheetPng.data[i * 4 + 3] = 255;
}

function drawTile(piecePng, startX, startY, bgR, bgG, bgB) {
  // Fill cell bg
  for (let cy = 0; cy < cellH - 4; cy++) {
    for (let cx = 0; cx < cellW - 4; cx++) {
      const idx = ((startY + cy) * sheetW + (startX + cx)) * 4;
      sheetPng.data[idx] = bgR;
      sheetPng.data[idx + 1] = bgG;
      sheetPng.data[idx + 2] = bgB;
      sheetPng.data[idx + 3] = 255;
    }
  }
  // Center piece in cell
  const ox = Math.floor((cellW - 4 - piecePng.width) / 2);
  const oy = Math.floor((cellH - 4 - piecePng.height) / 2);

  for (let py = 0; py < piecePng.height; py++) {
    for (let px = 0; px < piecePng.width; px++) {
      const pIdx = (py * piecePng.width + px) * 4;
      const alpha = piecePng.data[pIdx + 3] / 255;
      if (alpha <= 0) continue;

      const sX = startX + ox + px;
      const sY = startY + oy + py;
      if (sX < 0 || sX >= sheetW || sY < 0 || sY >= sheetH) continue;
      const outIdx = (sY * sheetW + sX) * 4;

      sheetPng.data[outIdx] = Math.round(piecePng.data[pIdx] * alpha + bgR * (1 - alpha));
      sheetPng.data[outIdx + 1] = Math.round(piecePng.data[pIdx + 1] * alpha + bgG * (1 - alpha));
      sheetPng.data[outIdx + 2] = Math.round(piecePng.data[pIdx + 2] * alpha + bgB * (1 - alpha));
    }
  }
}

for (let i = 0; i < pieceRecords.length; i++) {
  const col = i % sheetCols;
  const row = Math.floor(i / sheetCols);
  const darkX = 10 + col * (cellW * 2);
  const lightX = darkX + cellW;
  const cellY = 10 + row * cellH;

  // Dark background #151c16
  drawTile(pieceRecords[i].png, darkX, cellY, 21, 28, 22);
  // Light background #f0f4ec
  drawTile(pieceRecords[i].png, lightX, cellY, 240, 244, 236);
}

const contactSheetPath = path.join(debugOutDir, 'contact-sheet.png');
fs.writeFileSync(contactSheetPath, PNG.sync.write(sheetPng));
console.log(`Contact sheet generated at ${contactSheetPath}`);
