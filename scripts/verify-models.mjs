import { NodeIO } from '@gltf-transform/core';
import { KHRMaterialsTransmission } from '@gltf-transform/extensions';
import fs from 'fs';

const io = new NodeIO().registerExtensions([KHRMaterialsTransmission]);

async function verify() {
  const models = ['lungbooster', 'liver-booster', 'cyclerelief', 'energy-booster'];
  let allPassed = true;

  console.log('========================================');
  console.log('MODEL INTEGRITY VERIFICATION');
  console.log('========================================');

  for (const m of models) {
    const rawPath = `raw/${m}.glb`;
    const gridPath = `src/assets/products/${m}.glb`;
    const hdPath = `src/assets/products/${m}-hd.glb`;

    if (!fs.existsSync(rawPath) || !fs.existsSync(gridPath) || !fs.existsSync(hdPath)) {
      console.error(`❌ Missing files for ${m}!`);
      allPassed = false;
      continue;
    }

    const rawDoc = await io.read(rawPath);
    const gridDoc = await io.read(gridPath);
    const hdDoc = await io.read(hdPath);

    const rawNodes = rawDoc.getRoot().listNodes().map(n => n.getName());
    const gridNodes = gridDoc.getRoot().listNodes().map(n => n.getName());
    const hdNodes = hdDoc.getRoot().listNodes().map(n => n.getName());

    // 1. Check all nodes preserved
    const missingInGrid = rawNodes.filter(n => !gridNodes.includes(n));
    const missingInHd = rawNodes.filter(n => !hdNodes.includes(n));

    if (missingInGrid.length > 0) {
      console.error(`❌ ${m}.glb missing nodes in grid:`, missingInGrid);
      allPassed = false;
    }
    if (missingInHd.length > 0) {
      console.error(`❌ ${m}-hd.glb missing nodes in HD:`, missingInHd);
      allPassed = false;
    }

    // 2. Check pivot extras
    const rawPivot = rawDoc.getRoot().listNodes().find(n => n.getName() === 'Jar_Cap_Pivot');
    if (rawPivot) {
      const rawExtras = rawPivot.getExtras();
      const gridPivot = gridDoc.getRoot().listNodes().find(n => n.getName() === 'Jar_Cap_Pivot');
      const hdPivot = hdDoc.getRoot().listNodes().find(n => n.getName() === 'Jar_Cap_Pivot');
      const gridExtras = gridPivot ? gridPivot.getExtras() : null;
      const hdExtras = hdPivot ? hdPivot.getExtras() : null;

      if (rawExtras && Object.keys(rawExtras).length > 0) {
        for (const [k, v] of Object.entries(rawExtras)) {
          if (!gridExtras || gridExtras[k] !== v) {
            console.error(`❌ ${m}.glb pivot extras mismatch on key ${k}: expected ${v}, got ${gridExtras?.[k]}`);
            allPassed = false;
          }
          if (!hdExtras || hdExtras[k] !== v) {
            console.error(`❌ ${m}-hd.glb pivot extras mismatch on key ${k}: expected ${v}, got ${hdExtras?.[k]}`);
            allPassed = false;
          }
        }
      }
    }

    // 3. Check KHR transmission for lungbooster
    if (m === 'lungbooster') {
      const gridExts = gridDoc.getRoot().listExtensionsUsed().map(e => e.extensionName);
      const hdExts = hdDoc.getRoot().listExtensionsUsed().map(e => e.extensionName);
      if (!gridExts.includes('KHR_materials_transmission')) {
        console.error(`❌ lungbooster.glb missing KHR_materials_transmission extension!`);
        allPassed = false;
      }
      if (!hdExts.includes('KHR_materials_transmission')) {
        console.error(`❌ lungbooster-hd.glb missing KHR_materials_transmission extension!`);
        allPassed = false;
      }
    }

    // 4. Check texture sizes
    for (const t of gridDoc.getRoot().listTextures()) {
      const size = t.getSize();
      if (size && (size[0] > 2048 || size[1] > 2048)) {
        console.error(`❌ ${m}.glb has oversized texture ${t.getName()}: ${size}`);
        allPassed = false;
      }
    }

    const countTris = doc => {
      let c = 0;
      for (const mesh of doc.getRoot().listMeshes()) {
        for (const prim of mesh.listPrimitives()) {
          const idx = prim.getIndices();
          c += idx ? idx.getCount() / 3 : 0;
        }
      }
      return Math.round(c);
    };

    console.log(`✓ ${m}:`);
    console.log(`    Nodes verified (${rawNodes.length}): ${rawNodes.join(', ')}`);
    console.log(`    Triangles: Raw = ${countTris(rawDoc).toLocaleString()} | Grid = ${countTris(gridDoc).toLocaleString()} | HD = ${countTris(hdDoc).toLocaleString()}`);
    console.log(`    File Size: Raw = ${(fs.statSync(rawPath).size / 1024 / 1024).toFixed(2)} MB | Grid = ${(fs.statSync(gridPath).size / 1024 / 1024).toFixed(2)} MB | HD = ${(fs.statSync(hdPath).size / 1024 / 1024).toFixed(2)} MB`);
  }

  if (allPassed) {
    console.log('\n🎉 ALL MODEL VERIFICATIONS PASSED 100%!');
  } else {
    console.error('\n❌ SOME VERIFICATIONS FAILED!');
    process.exit(1);
  }
}

verify().catch(console.error);
