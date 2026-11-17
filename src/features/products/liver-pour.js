import * as THREE from 'three';
import { createMoleculeMist } from './molecule-mist.js';

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const sm = t => t * t * (3 - 2 * t);

// Cache model-space mouth coordinates by root UUID
const mouthCache = new Map();

function computeModelMouth(root) {
  if (!root) return new THREE.Vector3(0, 0.75, 0);
  if (mouthCache.has(root.uuid)) return mouthCache.get(root.uuid);

  const bottle = root.getObjectByName('Bottle');
  if (!bottle || !bottle.geometry) {
    const fallback = new THREE.Vector3(0, 0.75, 0);
    mouthCache.set(root.uuid, fallback);
    return fallback;
  }

  bottle.geometry.computeBoundingBox();
  const bb = bottle.geometry.boundingBox;
  const pos = bottle.geometry.attributes.position;
  const thresh = bb.max.y - (bb.max.y - bb.min.y) * 0.03;

  let sumX = 0, sumZ = 0, count = 0;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y >= thresh) {
      sumX += pos.getX(i);
      sumZ += pos.getZ(i);
      count++;
    }
  }

  const mouthModel = new THREE.Vector3(
    count ? sumX / count : 0,
    bb.max.y,
    count ? sumZ / count : 0
  );

  // Transform mouth point from Bottle geometry space to modelRoot space
  bottle.updateWorldMatrix(true, false);
  root.updateWorldMatrix(true, false);
  const rinv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  mouthModel.applyMatrix4(bottle.matrixWorld).applyMatrix4(rinv);

  mouthCache.set(root.uuid, mouthModel);
  return mouthModel;
}

export function createLiverDirector(L) {
  const capWorld = new THREE.Vector3();
  const capTargetWorld = new THREE.Vector3();
  const l0 = new THREE.Vector3();
  const l1 = new THREE.Vector3();
  const rinv = new THREE.Matrix4();
  const worldMouth = new THREE.Vector3();

  const toWorld = (px, py, z, out) => {
    out.set(
      (px / L.W - 0.5) * 2 * L.halfW,
      -(py / L.H - 0.5) * 2 * L.halfH,
      z
    );
  };

  let activeModelRoot = null;

  // Create the generic molecule mist helper
  const mist = createMoleculeMist(L, {
    count: (typeof window !== 'undefined' && window.innerWidth < 768) ? 36 : 56,
    getMouth(out) {
      if (activeModelRoot) {
        const mModel = computeModelMouth(activeModelRoot);
        out.copy(mModel).applyMatrix4(activeModelRoot.matrixWorld);
      } else {
        out.set(0, 0, 0);
      }
    },
    region(ctx) {
      const vh = ctx.vh || L.H;
      const mobile = ctx.mobile || false;
      const mouthY = ctx.mouthY != null ? ctx.mouthY : vh * 0.62;

      // Keep molecules safely below the lifted cap and above the bottle mouth
      const top = vh * (mobile ? 0.23 : 0.25);
      const bottom = Math.max(top + vh * 0.18, Math.min(vh * 0.56, mouthY - vh * 0.10));
      return { top, bottom };
    },
    seed: 31415
  });

  return {
    /**
     * How the bottle is placed before the jar transform is set.
     * Sinks toward the bottom of the frame and shrinks, turns to face front,
     * but stays strictly UPRIGHT (no tilt, rotX and rotZ ease to 0).
     */
    pose(hold, open, o) {
      if (open <= 0) return hold;
      const k = sm(clamp((open - 0.14) / 0.60));
      const d = ((hold.rotY - o.front + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

      hold.y = hold.y + (o.vh * (o.mobile ? 0.82 : 0.78) - hold.y) * k;
      hold.h = hold.h * (1 - 0.26 * k);
      hold.rotY = hold.rotY - k * d;
      // Stays UPRIGHT (no tilt)
      hold.rotX = hold.rotX + (0 - hold.rotX) * k;
      hold.rotZ = hold.rotZ + (0 - hold.rotZ) * k;
      return hold;
    },

    /**
     * Updates cap animation, mouth tracking, and molecule mist.
     * Called AFTER jar transform is updated each frame.
     */
    update(jar, o) {
      const ud = jar && jar.b && jar.b.userData;
      if (!ud) return;

      const cap = ud.liverCap;
      const capRest = ud.capRest;
      const root = ud.modelRoot;
      if (!cap || !capRest || !root) return;

      activeModelRoot = root;

      // Bring scene matrices and camera up to date
      jar.G.updateMatrixWorld(true);
      L.cam.updateMatrixWorld();

      const open = o.open != null ? o.open : 0;

      // Cap unscrews CLOCKWISE and lifts to top of frame
      const turnK = sm(clamp(open / 0.58));
      const liftK = sm(clamp((open - 0.15) / 0.70));

      cap.rotation.y = -turnK * 3 * Math.PI * 2; // clockwise
      cap.position.copy(capRest);

      if (liftK > 0) {
        capWorld.copy(capRest).applyMatrix4(root.matrixWorld);
        toWorld(o.vw * 0.5, o.vh * (o.mobile ? 0.13 : 0.15), capWorld.z, capTargetWorld);
        rinv.copy(root.matrixWorld).invert();
        l0.copy(capRest);
        l1.copy(capTargetWorld).applyMatrix4(rinv);
        cap.position.x = l0.x + (l1.x - l0.x) * liftK;
        cap.position.y = l0.y + (l1.y - l0.y) * liftK;
        cap.position.z = l0.z + (l1.z - l0.z) * liftK;
      }

      // Update molecule mist
      mist.update({
        jar,
        open,
        u: o.u,
        v: o.v,
        time: o.time,
        vw: o.vw,
        vh: o.vh,
        mobile: o.mobile
      });
    },

    hide() {
      mist.hide();
    },

    reset(jar) {
      mist.reset();
      if (jar && jar.b && jar.b.userData) {
        const ud = jar.b.userData;
        if (ud.liverCap) {
          ud.liverCap.rotation.y = 0;
          if (ud.capRest) ud.liverCap.position.copy(ud.capRest);
        }
      }
    },

    dispose() {
      if (mist.dispose) mist.dispose();
    }
  };
}
