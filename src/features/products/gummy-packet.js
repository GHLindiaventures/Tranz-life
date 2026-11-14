import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import packetUrl from '../../assets/products/packet.glb?url';
import gummyUrl from '../../assets/products/gummy.glb?url';

/**
 * Creates an interactive 3D Gummy Packet model with a realistic open animation.
 * Features:
 * - Sealed packet with TranzLife logo and crimped serrated seals.
 * - Progressive tear animation: flap unseals, peels and curls away.
 * - Pouch mouth expands and puffs open, revealing dark metallic foil lining.
 * - Botanical berry gummy (gummy.glb) emerges with translucent jelly and sugar crystals.
 * - updateOpen(t): scrub open progress from 0 (closed) to 1 (fully open).
 */
export function createPacketModel(options = {}) {
  const root = new THREE.Group();
  root.name = 'GummyPacketRoot';

  const state = {
    ready: false,
    open: 0,
    bodyMesh: null,
    flapMesh: null,
    innerMesh: null,
    gMesh: null,
    bodyBasePos: null,
    flapBasePos: null,
    bodyGeo: null,
    flapGeo: null,
  };

  const loader = new GLTFLoader();

  // 1. Load Gummy model
  const loadGummy = new Promise((resolve) => {
    loader.load(gummyUrl, (gltf) => {
      let m = null;
      gltf.scene.traverse((n) => { if (n.isMesh && !m) m = n; });
      if (m) {
        const geo = m.geometry.clone();
        geo.center();
        geo.computeVertexNormals();

        const s = options.gummyScale || 0.44;
        geo.scale(s, s, s);
        geo.rotateX(Math.PI * 0.4);

        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(options.gummyColor || '#9e1022'),
          emissive: new THREE.Color('#1c0205'),
          roughness: 0.26,
          metalness: 0.0,
          clearcoat: 0.9,
          clearcoatRoughness: 0.1,
          reflectivity: 0.65,
          envMapIntensity: 1.3
        });

        mat.onBeforeCompile = (sh) => {
          sh.vertexShader = sh.vertexShader.replace(
            'void main() {',
            'varying vec3 vObjPos;\nvoid main() {'
          ).replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\nvObjPos = position;'
          );
          sh.fragmentShader = sh.fragmentShader.replace(
            'void main() {',
            `varying vec3 vObjPos;
            float gHash(vec3 p) {
              p = fract(p * 0.3183099 + 0.1); p *= 17.0;
              return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }
            float sugarSparkle(vec3 p) {
              vec3 ip = floor(p * 90.0);
              float h = gHash(ip);
              return smoothstep(0.91, 0.96, h);
            }
            void main() {`
          ).replace(
            '#include <dithering_fragment>',
            `#include <dithering_fragment>
            float spk = sugarSparkle(vObjPos);
            if (spk > 0.05) {
              gl_FragColor.rgb += vec3(0.18, 0.16, 0.14) * spk;
            }`
          );
        };

        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 10;
        mesh.visible = false;
        resolve(mesh);
      } else {
        resolve(null);
      }
    }, undefined, () => resolve(null));
  });

  // 2. Load Packet model
  const loadPacket = new Promise((resolve) => {
    loader.load(packetUrl, (gltf) => {
      let m = null;
      gltf.scene.traverse((n) => { if (n.isMesh && !m) m = n; });
      resolve(m);
    }, undefined, () => resolve(null));
  });

  Promise.all([loadPacket, loadGummy]).then(([origMesh, gMesh]) => {
    if (!origMesh) return;

    const origGeo = origMesh.geometry;
    const mat = origMesh.material.clone();
    mat.side = THREE.DoubleSide;
    mat.roughness = 0.32;
    mat.metalness = 0.12;

    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x343a32,
      roughness: 0.22,
      metalness: 0.95,
      side: THREE.BackSide
    });

    const posAttr = origGeo.attributes.position;
    const idx = origGeo.index;
    const count = idx.count;

    // Cut line at x = 0.65 keeps TranzLife brand logo completely intact
    function isFlap(x, y) {
      const tearX = 0.65 + 0.035 * (y / 0.54) + 0.012 * Math.sin(y * 30.0);
      return x >= tearX;
    }

    const bodyIndices = [];
    const flapIndices = [];

    for (let i = 0; i < count; i += 3) {
      const i0 = idx.getX(i);
      const i1 = idx.getX(i + 1);
      const i2 = idx.getX(i + 2);

      const x0 = posAttr.getX(i0), y0 = posAttr.getY(i0);
      const x1 = posAttr.getX(i1), y1 = posAttr.getY(i1);
      const x2 = posAttr.getX(i2), y2 = posAttr.getY(i2);

      const f0 = isFlap(x0, y0);
      const f1 = isFlap(x1, y1);
      const f2 = isFlap(x2, y2);

      const flapScore = (f0 ? 1 : 0) + (f1 ? 1 : 0) + (f2 ? 1 : 0);
      if (flapScore >= 2) {
        flapIndices.push(i0, i1, i2);
      } else {
        bodyIndices.push(i0, i1, i2);
      }
    }

    const bodyGeo = origGeo.clone();
    bodyGeo.setIndex(bodyIndices);

    const flapGeo = origGeo.clone();
    flapGeo.setIndex(flapIndices);

    const bodyBasePos = new Float32Array(bodyGeo.attributes.position.array);
    const flapBasePos = new Float32Array(flapGeo.attributes.position.array);

    const bodyMesh = new THREE.Mesh(bodyGeo, mat);
    bodyMesh.renderOrder = 2;
    const flapMesh = new THREE.Mesh(flapGeo, mat);
    flapMesh.renderOrder = 1;

    // Inner cavity lining inside packet
    const innerGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.46, 24, 1, true);
    innerGeo.rotateZ(Math.PI / 2);
    innerGeo.scale(1.0, 0.44, 0.32);
    innerGeo.translate(0.44, 0, 0);
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.renderOrder = 0;
    innerMesh.visible = false;

    root.add(bodyMesh);
    root.add(flapMesh);
    root.add(innerMesh);

    if (gMesh) {
      gMesh.position.set(0.5, 0, 0);
      gMesh.visible = false;
      root.add(gMesh);
      state.gMesh = gMesh;
    }

    state.bodyMesh = bodyMesh;
    state.flapMesh = flapMesh;
    state.innerMesh = innerMesh;
    state.bodyGeo = bodyGeo;
    state.flapGeo = flapGeo;
    state.bodyBasePos = bodyBasePos;
    state.flapBasePos = flapBasePos;
    state.ready = true;

    if (typeof options.onReady === 'function') {
      options.onReady(root);
    }
  });

  function updateOpen(t) {
    if (!state.ready) return;
    t = Math.max(0, Math.min(1, t));
    state.open = t;

    const { bodyGeo, flapGeo, bodyMesh, flapMesh, innerMesh, gMesh, bodyBasePos, flapBasePos } = state;
    const bodyPos = bodyGeo.attributes.position.array;
    const flapPos = flapGeo.attributes.position.array;

    bodyPos.set(bodyBasePos);
    flapPos.set(flapBasePos);

    if (t <= 0.001) {
      bodyGeo.attributes.position.needsUpdate = true;
      flapGeo.attributes.position.needsUpdate = true;
      bodyGeo.computeVertexNormals();
      flapGeo.computeVertexNormals();
      flapMesh.position.set(0, 0, 0);
      flapMesh.rotation.set(0, 0, 0);
      innerMesh.visible = false;
      if (gMesh) gMesh.visible = false;
      return;
    }

    innerMesh.visible = true;

    // 1. Body Mouth Opening: Lips puff apart in Z
    const mouthEase = Math.min(1, t * 1.5);
    const puffZ = 0.16 * Math.sin(mouthEase * Math.PI * 0.5);

    for (let i = 0; i < bodyPos.length; i += 3) {
      const bx = bodyBasePos[i];
      const by = bodyBasePos[i + 1];
      const bz = bodyBasePos[i + 2];

      if (bx > 0.36) {
        const factor = Math.min(1, (bx - 0.36) / 0.29);
        const edgeK = factor * factor;

        const zSign = bz >= 0 ? 1 : -1;
        bodyPos[i + 2] = bz + zSign * puffZ * edgeK * (1.0 - Math.pow(by / 0.54, 2) * 0.6);

        if (bx > 0.56) {
          const lip = (bx - 0.56) / 0.09;
          bodyPos[i] = bx - 0.025 * lip * mouthEase;
        }
      }
    }
    bodyGeo.attributes.position.needsUpdate = true;
    bodyGeo.computeVertexNormals();

    // 2. Tear Flap: Peels away, curls to the right, down and back
    const peelT = Math.min(1, t * 1.3);
    const peelEase = peelT * peelT * (3 - 2 * peelT);

    const flapSlideX = 0.14 * peelEase + 0.28 * Math.max(0, t - 0.3);
    const flapSlideY = -0.16 * peelEase;
    const flapSlideZ = -0.32 * peelEase;

    const flapRotY = -1.55 * peelEase;
    const flapRotZ = -0.55 * peelEase;
    const flapRotX = 0.35 * peelEase;

    flapMesh.position.set(flapSlideX, flapSlideY, flapSlideZ);
    flapMesh.rotation.set(flapRotX, flapRotY, flapRotZ);

    for (let i = 0; i < flapPos.length; i += 3) {
      const fx = flapBasePos[i];
      const fy = flapBasePos[i + 1];
      const fz = flapBasePos[i + 2];

      if (fx < 0.77) {
        const curlK = (0.77 - fx) / 0.12;
        const zSign = fz >= 0 ? 1 : -1;
        flapPos[i + 2] = fz + zSign * 0.07 * curlK * peelEase;
        flapPos[i] = fx + 0.03 * curlK * peelEase;
      }
    }
    flapGeo.attributes.position.needsUpdate = true;
    flapGeo.computeVertexNormals();

    // 3. Gummy emerges from inside
    if (gMesh) {
      if (t > 0.38) {
        gMesh.visible = true;
        const gT = (t - 0.38) / 0.62;
        const gEase = gT * gT * (3 - 2 * gT);

        const gx = 0.56 + 0.38 * gEase;
        const gy = 0.02 * Math.sin(gEase * Math.PI);
        const gz = 0.06 + 0.08 * Math.sin(gEase * Math.PI * 0.75);

        gMesh.position.set(gx, gy, gz);
        gMesh.rotation.set(
          Math.PI * 0.38 + 0.25 * Math.sin(gEase * Math.PI),
          0.55 * gEase,
          -0.2 * gEase
        );
        const sc = Math.min(1, 0.75 + 0.25 * gEase);
        gMesh.scale.set(sc, sc, sc);
      } else {
        gMesh.visible = false;
      }
    }
  }

  root.userData.updateOpen = updateOpen;
  root.userData.getOpen = () => state.open;
  root.userData.isReady = () => state.ready;

  return { root, updateOpen, state };
}

