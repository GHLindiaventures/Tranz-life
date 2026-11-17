import { NodeIO } from '@gltf-transform/core';
import {
  KHRMaterialsTransmission,
  KHRMaterialsSpecular,
  KHRMaterialsVolume,
  KHRMaterialsIOR,
  KHRTextureBasisu
} from '@gltf-transform/extensions';
import { simplify, prune, resample, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

await MeshoptSimplifier.ready;

const io = new NodeIO().registerExtensions([
  KHRMaterialsTransmission,
  KHRMaterialsSpecular,
  KHRMaterialsVolume,
  KHRMaterialsIOR,
  KHRTextureBasisu
]);

const MODEL_CONFIGS = {
  'lungbooster': {
    gridRatio: 0.40,
    gridTargetTris: 110000,
    textures: {
      'Image_0': { maxDim: 2048, format: 'jpeg', quality: 85 }, // baseColor
      'Image_2': { maxDim: 2048, format: 'jpeg', quality: 85 }, // normal
      'Image_1': { maxDim: 2048, format: 'png' },               // metalRough (keep PNG)
    }
  },
  'liver-booster': {
    gridRatio: 0.95,
    gridTargetTris: 70000,
    textures: {
      default: { maxDim: 2048, format: 'jpeg', quality: 85 }
    }
  },
  'cyclerelief': {
    gridRatio: 0.40,
    gridTargetTris: 120000,
    textures: {
      default: { maxDim: 2048, format: 'jpeg', quality: 85 }
    }
  },
  'energy-booster': {
    gridRatio: 0.165,
    gridTargetTris: 90000,
    textures: {
      default: { maxDim: 2048, format: 'jpeg', quality: 85 }
    }
  }
};

/**
 * Optimizes textures in a glTF document using sharp.
 */
async function optimizeTextures(doc, config) {
  const textures = doc.getRoot().listTextures();
  for (const tex of textures) {
    const origBuffer = tex.getImage();
    if (!origBuffer) continue;
    const name = tex.getName();
    const origSize = tex.getSize();
    const origMime = tex.getMimeType();
    const rule = (config.textures && config.textures[name]) || (config.textures && config.textures.default) || {
      maxDim: 2048,
      format: origMime === 'image/png' ? 'png' : 'jpeg',
      quality: 85
    };

    const targetDim = rule.maxDim || 2048;
    const targetFormat = rule.format || (origMime === 'image/png' ? 'png' : 'jpeg');
    const quality = rule.quality || 85;

    let s = sharp(origBuffer);
    const meta = await s.metadata();
    const curW = meta.width || (origSize ? origSize[0] : targetDim);
    const curH = meta.height || (origSize ? origSize[1] : targetDim);

    const outW = Math.min(curW, targetDim);
    const outH = Math.min(curH, targetDim);

    s = s.resize(outW, outH, { fit: 'fill' });
    let newBuffer;
    let newMime;

    if (targetFormat === 'png') {
      newBuffer = await s.png({ compressionLevel: 9 }).toBuffer();
      newMime = 'image/png';
    } else {
      newBuffer = await s.jpeg({ quality, mozjpeg: true }).toBuffer();
      newMime = 'image/jpeg';
    }

    tex.setImage(new Uint8Array(newBuffer));
    tex.setMimeType(newMime);
  }
}

/**
 * Count total triangles in document.
 */
function countTriangles(doc) {
  let count = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      if (idx) count += idx.getCount() / 3;
      else {
        const pos = prim.getAttribute('POSITION');
        if (pos) count += pos.getCount() / 3;
      }
    }
  }
  return Math.round(count);
}

/**
 * Collect all node names in document.
 */
function getNodeNames(doc) {
  return doc.getRoot().listNodes().map(n => n.getName());
}

/**
 * Process a single model from raw to grid and HD GLBs.
 */
export async function optimizeModel(name, inputPath, gridOutputPath, hdOutputPath) {
  console.log(`\n========================================`);
  console.log(`Processing: ${name}`);
  console.log(`Input: ${inputPath}`);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const config = MODEL_CONFIGS[name] || {
    gridRatio: 0.5,
    textures: { default: { maxDim: 2048, format: 'jpeg', quality: 85 } }
  };

  // 1. Read raw model
  const rawDoc = await io.read(inputPath);
  const rawTris = countTriangles(rawDoc);
  const rawNodes = getNodeNames(rawDoc);
  const rawSize = fs.statSync(inputPath).size;
  console.log(`Original: ${(rawSize / 1024 / 1024).toFixed(2)} MB, ${rawTris.toLocaleString()} tris`);
  console.log(`Nodes (${rawNodes.length}):`, rawNodes);

  // Capture pivot extras if present
  const rawPivot = rawDoc.getRoot().listNodes().find(n => n.getName() === 'Jar_Cap_Pivot');
  const rawPivotExtras = rawPivot ? rawPivot.getExtras() : null;

  // 2. Build HD Model (Full geometry, 2048 crisp textures)
  const hdDoc = await io.read(inputPath);
  await optimizeTextures(hdDoc, config);
  await hdDoc.transform(prune({ keepAttributes: true }), resample(), dedup());

  if (rawPivotExtras && Object.keys(rawPivotExtras).length > 0) {
    const hdPivot = hdDoc.getRoot().listNodes().find(n => n.getName() === 'Jar_Cap_Pivot');
    if (hdPivot) hdPivot.setExtras({ ...rawPivotExtras });
  }

  const hdTris = countTriangles(hdDoc);
  const hdNodes = getNodeNames(hdDoc);

  // Verify HD node names match raw
  for (const n of rawNodes) {
    if (!hdNodes.includes(n)) {
      throw new Error(`HD model missing original node: "${n}"!`);
    }
  }

  const hdGlb = await io.writeBinary(hdDoc);
  fs.mkdirSync(path.dirname(hdOutputPath), { recursive: true });
  fs.writeFileSync(hdOutputPath, hdGlb);
  const hdSize = hdGlb.byteLength;
  console.log(`HD GLB generated: ${hdOutputPath} (${(hdSize / 1024 / 1024).toFixed(2)} MB, ${hdTris.toLocaleString()} tris)`);

  // 3. Build Grid Model (Simplified geometry, 2048 textures)
  const gridDoc = await io.read(inputPath);
  await optimizeTextures(gridDoc, config);

  if (config.gridRatio < 1.0) {
    console.log(`Simplifying mesh with ratio ${config.gridRatio} (lockBorder: true)...`);
    await gridDoc.transform(
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: config.gridRatio,
        error: 0.001,
        lockBorder: true
      })
    );
  }

  await gridDoc.transform(prune({ keepAttributes: true }), resample(), dedup());

  if (rawPivotExtras && Object.keys(rawPivotExtras).length > 0) {
    const gridPivot = gridDoc.getRoot().listNodes().find(n => n.getName() === 'Jar_Cap_Pivot');
    if (gridPivot) gridPivot.setExtras({ ...rawPivotExtras });
  }

  const gridTris = countTriangles(gridDoc);
  const gridNodes = getNodeNames(gridDoc);

  // Verify Grid node names match raw
  for (const n of rawNodes) {
    if (!gridNodes.includes(n)) {
      throw new Error(`Grid model missing original node: "${n}"!`);
    }
  }

  const gridGlb = await io.writeBinary(gridDoc);
  fs.mkdirSync(path.dirname(gridOutputPath), { recursive: true });
  fs.writeFileSync(gridOutputPath, gridGlb);
  const gridSize = gridGlb.byteLength;
  console.log(`Grid GLB generated: ${gridOutputPath} (${(gridSize / 1024 / 1024).toFixed(2)} MB, ${gridTris.toLocaleString()} tris)`);

  return {
    name,
    raw: { sizeMB: (rawSize / 1024 / 1024).toFixed(2), tris: rawTris },
    grid: { sizeMB: (gridSize / 1024 / 1024).toFixed(2), tris: gridTris },
    hd: { sizeMB: (hdSize / 1024 / 1024).toFixed(2), tris: hdTris },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const models = ['lungbooster', 'liver-booster', 'cyclerelief', 'energy-booster'];

  if (args.length >= 3) {
    const [name, inputPath, gridOutputPath, hdOutputPath] = args;
    await optimizeModel(name, inputPath, gridOutputPath, hdOutputPath || gridOutputPath.replace(/\.glb$/, '-hd.glb'));
    return;
  }

  const targetModels = args.length > 0 ? args : models;
  const results = [];

  for (const m of targetModels) {
    const inputPath = `raw/${m}.glb`;
    const gridOutputPath = `src/assets/products/${m}.glb`;
    const hdOutputPath = `src/assets/products/${m}-hd.glb`;
    const res = await optimizeModel(m, inputPath, gridOutputPath, hdOutputPath);
    results.push(res);
  }

  console.log('\n========================================');
  console.log('SUMMARY TABLE:');
  console.table(results.map(r => ({
    Model: r.name,
    'Raw (MB)': r.raw.sizeMB,
    'Raw Tris': r.raw.tris.toLocaleString(),
    'Grid (MB)': r.grid.sizeMB,
    'Grid Tris': r.grid.tris.toLocaleString(),
    'HD (MB)': r.hd.sizeMB,
    'HD Tris': r.hd.tris.toLocaleString(),
  })));
}

main().catch(err => {
  console.error('Optimization error:', err);
  process.exit(1);
});
