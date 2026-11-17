import * as THREE from 'three';
import manifest from '../../assets/molecules/pieces/manifest.json';

const pieceUrls = import.meta.glob('../../assets/molecules/pieces/*.png', { eager: true, query: '?url', import: 'default' });

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

function rng(seed = 42) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Creates a floating mist of glossy water molecules emerging from the bottle mouth.
 * @param {object} L - The jarLayer instance (scene, cam, W, H, halfW, halfH)
 * @param {object} opts - { count, getMouth(out), region(ctx), seed }
 */
export function createMoleculeMist(L, opts = {}) {
  const seed = opts.seed || 101;
  const R = rng(seed);

  // Load textures and prepare materials for all pieces in manifest
  const textureLoader = new THREE.TextureLoader();
  const pieceDefs = manifest.map((item, pIdx) => {
    const relKey = `../../assets/molecules/pieces/${item.file}`;
    const url = pieceUrls[relKey];
    if (!url) console.warn(`Missing piece texture URL for ${item.file}`);

    const tex = textureLoader.load(url);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    tex.generateMipmaps = true;

    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.FrontSide
    });

    mat.onBeforeCompile = shader => {
      shader.vertexShader = 'attribute float instanceAlpha;\nvarying float vInstanceAlpha;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvInstanceAlpha = instanceAlpha;'
        );
      shader.fragmentShader = 'varying float vInstanceAlpha;\n' +
        shader.fragmentShader.replace(
          '#include <color_fragment>',
          '#include <color_fragment>\ndiffuseColor.a *= vInstanceAlpha;'
        );
    };
    mat.customProgramCacheKey = () => `mol_piece_${pIdx}`;

    // Aspect ratio plane geometry
    const aspect = item.w / item.h;
    const geo = new THREE.PlaneGeometry(aspect, 1.0);

    return { item, url, tex, mat, geo, instances: [] };
  });

  // Calculate cumulative weights for weighted random piece selection
  const totalWeight = manifest.reduce((sum, item) => sum + (item.weight || 1), 0);
  const getWeightedPieceIndex = () => {
    const r = R() * totalWeight;
    let acc = 0;
    for (let i = 0; i < manifest.length; i++) {
      acc += (manifest[i].weight || 1);
      if (r <= acc) return i;
    }
    return manifest.length - 1;
  };

  // Determine total molecule count
  const defaultCount = (typeof window !== 'undefined' && window.innerWidth < 768) ? 36 : 56;
  const N = opts.count || defaultCount;

  // Initialize molecule attributes
  const molecules = [];
  for (let i = 0; i < N; i++) {
    const pieceIdx = getWeightedPieceIndex();
    const piece = pieceDefs[pieceIdx];
    const isPair = piece.item.kind === 'pair';

    // Size: world width 0.18..0.55 for spheres, slightly larger for pairs
    let baseWidth;
    if (isPair) {
      baseWidth = 0.36 + R() * 0.26;
    } else {
      const rNorm = clamp((piece.item.radiusPx - 5) / 30);
      baseWidth = 0.18 + rNorm * 0.28 + R() * 0.10;
    }

    // Normalized screen targets within cloud region:
    // u in [-1, 1] with center bias, v in [0, 1] (0 = top, 1 = bottom)
    const angle = R() * Math.PI * 2;
    const distR = Math.sqrt(R());
    const u = Math.cos(angle) * distR; // -1 .. 1
    const v = (Math.sin(angle) * distR) * 0.5 + 0.5; // 0 .. 1

    const orderNorm = i / (N - 1);
    // Spawn window: open 0.20..0.70 staggered by order; each trip lasts ~0.28..0.30
    const startOpen = 0.20 + orderNorm * 0.22;
    const tripDur = 0.28;

    const mol = {
      id: i,
      pieceIdx,
      localIdx: piece.instances.length,
      u,
      v,
      zJitter: (R() - 0.5) * 1.0,
      size: baseWidth,
      startOpen,
      tripDur,
      phase: R() * Math.PI * 2,
      roll0: (R() - 0.5) * (70 * Math.PI / 180), // +-35 deg base roll
      rollSpeed: 0.3 + R() * 0.5,
      arcK: 0.7 + R() * 0.6
    };

    piece.instances.push(mol);
    molecules.push(mol);
  }

  // Create InstancedMesh for each piece
  const meshes = [];
  pieceDefs.forEach(def => {
    const count = def.instances.length;
    if (count === 0) {
      def.mesh = null;
      return;
    }
    def.alphaArray = new Float32Array(count).fill(0);
    def.alphaAttr = new THREE.InstancedBufferAttribute(def.alphaArray, 1);
    def.geo.setAttribute('instanceAlpha', def.alphaAttr);

    const mesh = new THREE.InstancedMesh(def.geo, def.mat, count);
    mesh.frustumCulled = false;
    mesh.name = `MoleculeMist_${def.item.file}`;
    mesh.renderOrder = 10; // above bottle/glass, below DOM callouts
    mesh.visible = false;
    L.scene.add(mesh);
    def.mesh = mesh;
    meshes.push(mesh);
  });

  // Reusable math objects (zero per-frame allocations)
  const m4 = new THREE.Matrix4();
  const vMouth = new THREE.Vector3();
  const vTarget = new THREE.Vector3();
  const vCtrl = new THREE.Vector3();
  const vPos = new THREE.Vector3();
  const vScale = new THREE.Vector3();
  const vProj = new THREE.Vector3();
  const qRoll = new THREE.Quaternion();
  const qInst = new THREE.Quaternion();
  const UNIT_Z = new THREE.Vector3(0, 0, 1);

  const toWorld = (px, py, z, out) => {
    out.set(
      (px / L.W - 0.5) * 2 * L.halfW,
      -(py / L.H - 0.5) * 2 * L.halfH,
      z
    );
  };

  const toScreen = (w, out) => {
    vProj.copy(w).project(L.cam);
    out.x = (vProj.x * 0.5 + 0.5) * L.W;
    out.y = (-vProj.y * 0.5 + 0.5) * L.H;
  };

  const spMouth = { x: 0, y: 0 };
  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    /**
     * Updates mist positions and billboard instance matrices.
     * Pure function of ctx.open and ctx.time.
     */
    update(ctx) {
      const open = ctx.open != null ? ctx.open : 0;
      const time = ctx.time != null ? ctx.time : 0;
      const vw = ctx.vw || L.W;
      const vh = ctx.vh || L.H;
      const mobile = ctx.mobile || false;

      if (open <= 0.001) {
        this.reset();
        return;
      }

      // Obtain bottle mouth in world space
      if (opts.getMouth) {
        opts.getMouth(vMouth);
      } else {
        vMouth.set(0, 0, 0);
      }

      toScreen(vMouth, spMouth);

      // Cloud bounding region in screen px
      let topPx, bottomPx;
      if (opts.region) {
        const r = opts.region({ ...ctx, mouthY: spMouth.y });
        topPx = r.top;
        bottomPx = r.bottom;
      } else {
        topPx = vh * (mobile ? 0.23 : 0.25);
        bottomPx = Math.max(topPx + vh * 0.18, Math.min(vh * 0.55, spMouth.y - vh * 0.08));
      }

      // Cloud horizontal bounds (widened ~20% horizontally)
      const cx = vw * 0.5;
      const rx = mobile ? vw * 0.42 : Math.min(vw * 0.32, vh * 0.58);

      const qCam = L.cam.quaternion;

      // Update each piece's instanced mesh
      pieceDefs.forEach(def => {
        const mesh = def.mesh;
        if (!mesh) return;

        mesh.visible = true;
        let anyVisible = false;

        def.instances.forEach(mol => {
          let tau;
          if (prefersReduced) {
            tau = open > 0.05 ? 1.0 : 0.0;
          } else {
            tau = clamp((open - mol.startOpen) / mol.tripDur, 0, 1);
          }

          const localIdx = mol.localIdx;

          if (tau <= 0) {
            // Molecule hasn't emerged yet: hidden inside mouth
            m4.makeScale(0, 0, 0);
            mesh.setMatrixAt(localIdx, m4);
            def.alphaArray[localIdx] = 0;
            return;
          }

          anyVisible = true;

          // Compute target world position for this molecule
          const targetPxX = cx + rx * mol.u;
          const targetPxY = topPx + (bottomPx - topPx) * mol.v;
          toWorld(targetPxX, targetPxY, vMouth.z + mol.zJitter, vTarget);

          // Quadratic Bezier trip: starts at mouth, rises first (control point straight above mouth), then fans out
          const riseH = Math.max(0.65, (vTarget.y - vMouth.y) * 0.70 + 0.35) * mol.arcK;
          vCtrl.set(vMouth.x, vMouth.y + riseH, vMouth.z);

          const e = easeOutCubic(tau);
          const tInv = 1 - e;
          // Bezier interpolation
          vPos.set(
            tInv * tInv * vMouth.x + 2 * tInv * e * vCtrl.x + e * e * vTarget.x,
            tInv * tInv * vMouth.y + 2 * tInv * e * vCtrl.y + e * e * vTarget.y,
            tInv * tInv * vMouth.z + 2 * tInv * e * vCtrl.z + e * e * vTarget.z
          );

          // After arriving: gentle organic bob/drift (~0.04 world units) and slow roll
          let curRoll = mol.roll0;
          if (tau >= 0.999) {
            vPos.y += Math.sin(time * 1.5 + mol.phase) * 0.035;
            vPos.x += Math.cos(time * 1.1 + mol.phase * 1.3) * 0.018;
            curRoll += Math.sin(time * mol.rollSpeed + mol.phase) * 0.12;
          } else {
            curRoll += e * Math.sin(time * 0.8 + mol.phase) * 0.08;
          }

          // Scale: 0.15 -> 1.0 over the trip
          const curScale = mol.size * (0.15 + 0.85 * e);
          vScale.set(curScale, curScale, curScale);

          // Alpha: 0 -> 1 over the first 25% of the trip
          const alpha = clamp(tau / 0.25, 0, 1);
          def.alphaArray[localIdx] = alpha;

          // Billboard orientation: camera quaternion * per-instance roll
          qRoll.setFromAxisAngle(UNIT_Z, curRoll);
          qInst.copy(qCam).multiply(qRoll);

          // Compose instance matrix
          m4.compose(vPos, qInst, vScale);
          mesh.setMatrixAt(localIdx, m4);
        });

        mesh.instanceMatrix.needsUpdate = true;
        def.alphaAttr.needsUpdate = true;
        if (!anyVisible) mesh.visible = false;
      });
    },

    hide() {
      pieceDefs.forEach(def => {
        if (!def.mesh) return;
        def.mesh.visible = false;
        m4.makeScale(0, 0, 0);
        for (let k = 0; k < def.instances.length; k++) {
          def.mesh.setMatrixAt(k, m4);
          def.alphaArray[k] = 0;
        }
        def.mesh.instanceMatrix.needsUpdate = true;
        def.alphaAttr.needsUpdate = true;
      });
    },

    reset() {
      this.hide();
    },

    dispose() {
      this.hide();
      pieceDefs.forEach(def => {
        if (def.mesh) {
          L.scene.remove(def.mesh);
          def.mesh = null;
        }
        if (def.geo) def.geo.dispose();
        if (def.mat) def.mat.dispose();
        if (def.tex) def.tex.dispose();
      });
    }
  };
}
