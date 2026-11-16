import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import packetUrl from '../../assets/products/packet.glb?url';
import gummyImgUrl from '../../assets/products/gummy.png';

/**
 * Creates an interactive 3D Gummy Packet model with a realistic open animation.
 * Features:
 * - Sealed packet with TranzLife logo and crimped serrated seals.
 * - Progressive tear animation: flap unseals, peels and curls away.
 * - Pouch mouth expands and puffs open, revealing dark metallic foil lining.
 * - Photorealistic botanical gummy emerges with glossy translucent jelly and natural highlights.
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
    gMesh: null,
    bodyBasePos: null,
    flapBasePos: null,
    bodyGeo: null,
    flapGeo: null,
  };

  const loader = new GLTFLoader();

  // 1. Load photorealistic Gummy image texture
  const loadGummy = new Promise((resolve) => {
    if (typeof document === 'undefined') {
      // Headless / Node testing fallback
      const geo = new THREE.PlaneGeometry(0.86, 0.86);
      const mat = new THREE.MeshBasicMaterial({ transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 10;
      mesh.visible = false;
      resolve(mesh);
      return;
    }

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      gummyImgUrl,
      (texture) => {
        if (THREE.sRGBEncoding) {
          texture.encoding = THREE.sRGBEncoding;
        }
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // Quad scaled so 500x500 texture gives exact 0.56 x 0.45 visible gummy
        const geo = new THREE.PlaneGeometry(0.86, 0.86);
        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.01,
          depthTest: true,
          depthWrite: false,
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 10;
        mesh.visible = false;
        resolve(mesh);
      },
      undefined,
      (err) => {
        console.error('Error loading gummy texture:', err);
        resolve(null);
      }
    );
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
    mat.envMapIntensity = 0.6;
    mat.depthWrite = true;

    const posAttr = origGeo.attributes.position;
    const idx = origGeo.index;
    const count = idx.count;

    // Cut line at cutX = 0.58 leaves TranzLife brand logo completely intact
    const cutX = 0.58;
    function isFlap(x, y) {
      const tearX = cutX + 0.025 * (y / 0.54) + 0.012 * Math.sin(y * 24.0);
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
    flapMesh.renderOrder = 2;

    root.add(bodyMesh);
    root.add(flapMesh);

    if (gMesh) {
      gMesh.position.set(0.28, 0, 0);
      gMesh.visible = false;
      root.add(gMesh);
      state.gMesh = gMesh;
    }

    state.bodyMesh = bodyMesh;
    state.flapMesh = flapMesh;
    state.bodyGeo = bodyGeo;
    state.flapGeo = flapGeo;
    state.bodyBasePos = bodyBasePos;
    state.flapBasePos = flapBasePos;
    state.ready = true;

    if (typeof options.onReady === 'function') {
      options.onReady(root);
    }
  });

  function updateOpen(t, gProgress) {
    if (!state.ready) return;
    t = Math.max(0, Math.min(1, t));
    state.open = t;

    const { bodyGeo, flapGeo, bodyMesh, flapMesh, gMesh, bodyBasePos, flapBasePos } = state;
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
      if (gMesh) {
        gMesh.visible = false;
        if (gMesh.material) gMesh.material.opacity = 1;
        gMesh.position.set(0.28, 0, 0);
      }
      return;
    }

    // 1. Body Mouth Opening: Lips puff apart in Z near the cut edge
    const mouthEase = Math.min(1, t * 1.6);
    const mEase = mouthEase * mouthEase * (3 - 2 * mouthEase);
    const puffZ = 0.22 * mEase;

    const cutX = 0.58;

    for (let i = 0; i < bodyPos.length; i += 3) {
      const bx = bodyBasePos[i];
      const by = bodyBasePos[i + 1];
      const bz = bodyBasePos[i + 2];

      if (bx > 0.28) {
        const factor = Math.min(1, Math.max(0, (bx - 0.28) / (cutX - 0.28)));
        const edgeK = factor * factor;
        const vEnv = Math.max(0, 1.0 - Math.pow(by / 0.52, 2));

        const isFront = bz >= 0;
        if (isFront) {
          bodyPos[i + 2] = bz + puffZ * edgeK * vEnv;
        } else {
          bodyPos[i + 2] = bz - puffZ * 0.92 * edgeK * vEnv;
        }

        if (bx > cutX - 0.08) {
          const rimK = (bx - (cutX - 0.08)) / 0.08;
          bodyPos[i] = bx - 0.04 * rimK * mEase * vEnv;
        }
      }
    }
    bodyGeo.attributes.position.needsUpdate = true;
    bodyGeo.computeVertexNormals();

    // 2. Tear Flap: SEPARATES completely from the packet and drifts away to the right and down
    const peelT = Math.min(1, t * 1.5);
    const peelEase = peelT * peelT * (3 - 2 * peelT);

    const flapSlideX = 0.70 * peelEase + 0.85 * Math.max(0, t - 0.20);
    const flapSlideY = -0.16 * peelEase - 0.32 * Math.max(0, t - 0.30);
    const flapSlideZ = -0.28 * peelEase;

    const flapRotY = -1.15 * peelEase;
    const flapRotZ = -0.32 * peelEase;
    const flapRotX = 0.18 * peelEase;

    flapMesh.position.set(flapSlideX, flapSlideY, flapSlideZ);
    flapMesh.rotation.set(flapRotX, flapRotY, flapRotZ);

    for (let i = 0; i < flapPos.length; i += 3) {
      const fx = flapBasePos[i];
      const fy = flapBasePos[i + 1];
      const fz = flapBasePos[i + 2];

      if (fx < cutX + 0.16) {
        const curlK = (cutX + 0.16 - fx) / 0.16;
        flapPos[i + 2] = fz - 0.10 * curlK * peelEase;
        flapPos[i] = fx + 0.04 * curlK * peelEase;
      }
    }
    flapGeo.attributes.position.needsUpdate = true;
    flapGeo.computeVertexNormals();

    // 3. Gummy emerges from inside the pocket into full, unobstructed visibility
    // When gProgress is supplied (0..1), it controls the gummy slide independently of packet tear
    if (gMesh) {
      const gK = gProgress !== undefined ? Math.max(0, Math.min(1, gProgress)) : Math.min(1, Math.max(0, (t - 0.06) / 0.94));
      if (t > 0.06) {
        gMesh.visible = true;
        if (gMesh.material) {
          gMesh.material.opacity = 1;
        }
        const gEase = gK * gK * (3 - 2 * gK);

        // Slides from inside the open pocket mouth (x = 0.36) to center stage outside (x = 1.16)
        // Resting position at x = 0.36 is securely inside the open pocket, with the pocket lips remaining puffed open
        const startX = 0.36;
        const endX = 1.16;
        const gx = startX + (endX - startX) * gEase;
        const gy = 0.01 + 0.03 * Math.sin(gEase * Math.PI);
        const gz = 0.03 + 0.06 * gEase;

        const gScale = options.gummyScale || 1.0;
        gMesh.scale.set(gScale, gScale, gScale);

        gMesh.position.set(gx, gy, gz);
        gMesh.rotation.set(
          -0.04 * (1 - gEase),
          0.18 * gEase,
          -0.04 * Math.sin(gEase * Math.PI)
        );
      } else {
        gMesh.visible = false;
        gMesh.position.set(0.28, 0, 0);
      }
    }
  }

  root.userData.updateOpen = updateOpen;
  root.userData.getOpen = () => state.open;
  root.userData.isReady = () => state.ready;
  root.userData.getGummy = () => state.gMesh;
  root.userData.getGummyWorldPos = (out = new THREE.Vector3()) => {
    if (state.gMesh && state.gMesh.visible) {
      return state.gMesh.getWorldPosition(out);
    }
    root.getWorldPosition(out);
    out.x += 1.16 * root.scale.x;
    return out;
  };

  return {
    root,
    updateOpen,
    state,
    userData: root.userData,
    getGummyWorldPos: root.userData.getGummyWorldPos,
    getGummy: root.userData.getGummy,
    isReady: root.userData.isReady,
    getOpen: root.userData.getOpen
  };
}

