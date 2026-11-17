// Liver Booster: Botanical Water Molecule / Video Bubbles Ingredients Moment
// When the cap unscrews and lifts, glossy video bubbles emerge from the bottle mouth,
// floating up in a balanced 3D cloud. Inside the center of each video bubble, a specific
// ingredient is clearly displayed with botanical badge typography.
//
// Zero-lag architecture:
// A single hidden <video> element loops /bubble.webm. All 8 ingredient bubbles share
// the single THREE.VideoTexture, keying the black background cleanly in a GPU fragment shader,
// composite-nesting each ingredient's pre-rendered 2D canvas badge inside the glowing fluid sphere.
// Solid 60 FPS performance, pure procedural function of scroll/open, zero accumulated state.

import * as THREE from 'three';

const INGREDIENTS = [
  { name: 'Milk Thistle', latin: 'Carduus marianus', tag: 'SILYMARIN ACTIVE', rot: 0.0 },
  { name: 'Kalmegh', latin: 'Andrographis paniculata', tag: 'BILE & DETOX', rot: 0.8 },
  { name: 'Bhumyamalaki', latin: 'Phyllanthus niruri', tag: 'CELLULAR DEFENSE', rot: 1.6 },
  { name: 'Kutki', latin: 'Picrorhiza kurroa', tag: 'HEPATIC METABOLISM', rot: 2.4 },
  { name: 'Punarnava', latin: 'Boerhavia diffusa', tag: 'FLUID BALANCE', rot: 3.2 },
  { name: 'Amla', latin: 'Phyllanthus emblica', tag: 'VITAMIN C & TONIC', rot: 4.0 },
  { name: 'Guduchi', latin: 'Tinospora cordifolia', tag: 'IMMUNE & VITALITY', rot: 4.8 },
  { name: 'Bhringraj', latin: 'Eclipta alba', tag: 'CLASSICAL TONIC', rot: 5.6 },
];

const CLOUD_DESKTOP = [
  { u: 0.27, v: 0.23, z: 0.40, s: 2.05 }, // 0: Milk Thistle (Left Upper)
  { u: 0.73, v: 0.24, z: 0.35, s: 2.05 }, // 1: Kalmegh (Right Upper)
  { u: 0.20, v: 0.39, z: -0.15, s: 1.95 }, // 2: Bhumyamalaki (Left Mid-High)
  { u: 0.80, v: 0.40, z: -0.10, s: 1.95 }, // 3: Kutki (Right Mid-High)
  { u: 0.50, v: 0.19, z: 0.70, s: 2.15 }, // 4: Punarnava (Center High)
  { u: 0.30, v: 0.53, z: 0.25, s: 1.90 }, // 5: Amla (Left Lower)
  { u: 0.70, v: 0.54, z: 0.45, s: 1.90 }, // 6: Guduchi (Right Lower)
  { u: 0.50, v: 0.35, z: 0.10, s: 2.08 }, // 7: Bhringraj (Center Mid)
];

const CLOUD_MOBILE = [
  { u: 0.27, v: 0.21, z: 0.35, s: 1.42 },
  { u: 0.73, v: 0.24, z: 0.30, s: 1.42 },
  { u: 0.25, v: 0.33, z: -0.10, s: 1.38 },
  { u: 0.75, v: 0.36, z: -0.05, s: 1.38 },
  { u: 0.27, v: 0.45, z: 0.45, s: 1.36 },
  { u: 0.73, v: 0.48, z: 0.25, s: 1.36 },
  { u: 0.29, v: 0.56, z: 0.30, s: 1.34 },
  { u: 0.71, v: 0.59, z: 0.10, s: 1.34 },
];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// Generate high-resolution circular badge texture for an ingredient
function makeBadgeTexture(ing) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Subtle translucent green backing disc
  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 200);
  grad.addColorStop(0, 'rgba(8, 32, 12, 0.72)');
  grad.addColorStop(0.65, 'rgba(6, 26, 10, 0.46)');
  grad.addColorStop(0.88, 'rgba(6, 26, 10, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(256, 256, 200, 0, Math.PI * 2);
  ctx.fill();

  // Delicate gold/sage accent ring
  ctx.strokeStyle = 'rgba(225, 250, 185, 0.42)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(256, 256, 178, 0, Math.PI * 2);
  ctx.stroke();

  // Fine inner accent ring
  ctx.strokeStyle = 'rgba(180, 220, 140, 0.20)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(256, 256, 168, 0, Math.PI * 2);
  ctx.stroke();

  // Botanical leaf icon
  ctx.save();
  ctx.translate(256, 178);
  ctx.fillStyle = '#c5f77e';
  ctx.shadowColor = 'rgba(160, 245, 100, 0.85)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.bezierCurveTo(16, -16, 20, 6, 0, 20);
  ctx.bezierCurveTo(-20, 6, -16, -16, 0, -22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 36, 12, 0.75)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 15);
  ctx.stroke();
  ctx.restore();

  // Ingredient Name (Crisp, bold, prominent)
  ctx.save();
  ctx.shadowColor = 'rgba(0, 18, 4, 0.98)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Georgia", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ing.name, 256, 242);

  // Latin botanical name
  ctx.font = 'italic 20px "Georgia", serif';
  ctx.fillStyle = '#ccfaa0';
  ctx.shadowBlur = 8;
  ctx.fillText(ing.latin, 256, 282);

  // Benefit / Action pill
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.letterSpacing = '1.8px';
  ctx.fillStyle = '#fff0c2';
  ctx.shadowBlur = 5;
  ctx.fillText(ing.tag, 256, 320);
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 4;
  return tex;
}

const VERT_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG_SHADER = `
  uniform sampler2D uVideo;
  uniform sampler2D uBadge;
  uniform float uAngle;
  uniform float uAlpha;
  uniform float uFocus;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - vec2(0.5);
    float dist = length(p);

    // Circular spherical boundary
    float mask = 1.0 - smoothstep(0.46, 0.495, dist);
    if (mask <= 0.0) discard;

    // Rotate video UV for instance-specific highlight reflections
    float s = sin(uAngle), c = cos(uAngle);
    mat2 rot = mat2(c, -s, s, c);
    vec2 rotP = rot * p;

    // Video UV mapping: sample 720x720 square center of 1280x720 video
    vec2 vidUv = vec2(0.5 + rotP.x * (720.0 / 1280.0), 0.5 + rotP.y);
    vec4 vid = texture2D(uVideo, vidUv);

    // Key out black background
    float luma = max(vid.r, max(vid.g, vid.b));
    float vidAlpha = smoothstep(0.025, 0.13, luma);

    // Sample ingredient badge texture
    vec4 badge = texture2D(uBadge, vUv);

    // Composite:
    // Video bubble provides glowing liquid rim, highlights, caustics, and reflections
    // Badge is nestled inside the fluid core
    vec3 finalRgb = mix(vid.rgb * 1.12, badge.rgb + vid.rgb * 0.42, badge.a * (1.0 - dist * 0.70));

    // Outer edge fresnel shimmer
    float rim = smoothstep(0.36, 0.485, dist) * 0.42;
    finalRgb += vec3(0.65, 0.98, 0.50) * rim;

    // Callout / hover focus glow
    if (uFocus > 0.001) {
      finalRgb += (vec3(0.22, 0.38, 0.16) + badge.rgb * 0.35) * uFocus;
    }

    float finalAlpha = max(vidAlpha, badge.a * 0.90) * mask * uAlpha;

    gl_FragColor = vec4(finalRgb, finalAlpha);
  }
`;

function createLiverDirector(L) {
  // 1. Single shared hidden video element (zero-lag video decode)
  let vid = document.getElementById('tl-liver-bubble-video');
  if (!vid) {
    vid = document.createElement('video');
    vid.id = 'tl-liver-bubble-video';
    vid.src = '/bubble.webm';
    vid.crossOrigin = 'anonymous';
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.style.position = 'fixed';
    vid.style.top = '-9999px';
    vid.style.left = '-9999px';
    vid.style.width = '1px';
    vid.style.height = '1px';
    vid.style.opacity = '0';
    vid.style.pointerEvents = 'none';
    document.body.appendChild(vid);
  }

  // 2. Single shared VideoTexture
  const vidTex = new THREE.VideoTexture(vid);
  vidTex.minFilter = THREE.LinearFilter;
  vidTex.magFilter = THREE.LinearFilter;
  vidTex.format = THREE.RGBAFormat;
  vidTex.generateMipmaps = false;

  // 3. Pre-render 8 badge textures
  const badgeTextures = INGREDIENTS.map(ing => makeBadgeTexture(ing));

  // 4. Create 8 billboard bubble meshes in Three.js
  const bubbleGroup = new THREE.Group();
  bubbleGroup.name = 'liver-bubble-group';
  bubbleGroup.visible = false;
  L.scene.add(bubbleGroup);

  const quadGeo = new THREE.PlaneGeometry(1, 1);
  const bubbles = INGREDIENTS.map((ing, i) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT_SHADER,
      fragmentShader: FRAG_SHADER,
      uniforms: {
        uVideo: { value: vidTex },
        uBadge: { value: badgeTextures[i] },
        uAngle: { value: ing.rot },
        uAlpha: { value: 0.0 },
        uFocus: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(quadGeo, mat);
    mesh.renderOrder = 25;
    mesh.frustumCulled = false;
    mesh.visible = false;
    bubbleGroup.add(mesh);
    return { mesh, mat, ing, index: i };
  });

  // Reusable vector math objects
  const mouthW = new THREE.Vector3();
  const ctrlW = new THREE.Vector3();
  const destW = new THREE.Vector3();
  const curPos = new THREE.Vector3();
  const capRestW = new THREE.Vector3();
  const capTargetW = new THREE.Vector3();
  const capTargetL = new THREE.Vector3();
  const rinv = new THREE.Matrix4();
  const sp = { x: 0, y: 0 };
  const vProj = new THREE.Vector3();

  const toWorld = (px, py, z, out) => out.set((px / L.W - 0.5) * 2 * L.halfW, -(py / L.H - 0.5) * 2 * L.halfH, z);
  const toScreen = (w, out) => {
    vProj.copy(w).project(L.cam);
    out.x = (vProj.x * 0.5 + 0.5) * L.W;
    out.y = (-vProj.y * 0.5 + 0.5) * L.H;
  };

  // Quadratic Bezier interpolation
  const bez2 = (p0, p1, p2, t, out) => {
    const s = 1 - t;
    out.x = s * s * p0.x + 2 * s * t * p1.x + t * t * p2.x;
    out.y = s * s * p0.y + 2 * s * t * p1.y + t * t * p2.y;
    out.z = s * s * p0.z + 2 * s * t * p1.z + t * t * p2.z;
    return out;
  };

  let isPlaying = false;
  function ensureVideoPlaying() {
    if (!isPlaying && vid.paused) {
      vid.play().then(() => { isPlaying = true; }).catch(() => {});
    }
  }

  return {
    // 1. Pose: Bottle stays upright (rotX=0, rotZ=0), smoothly sinks to bottom
    pose(hold, open, o) {
      if (open <= 0) return hold;
      const k = sm(clamp(open / 0.70));
      const targetY = o.vh * (o.mobile ? 0.82 : 0.78);
      hold.y = hold.y + (targetY - hold.y) * k;
      hold.h = hold.h * (1 - 0.22 * k);

      // Smoothly orient to front
      const d = ((hold.rotY - o.front + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      hold.rotY = hold.rotY - k * d;

      // Bottle stays strictly upright (no tilt)
      hold.rotX = hold.rotX * (1 - k);
      hold.rotZ = hold.rotZ * (1 - k);

      return hold;
    },

    // 2. Update: Cap unscrews and lifts, video bubbles emerge from mouth and float
    update(jar, o) {
      const ud = jar && jar.b && jar.b.userData;
      if (!ud) return;

      const cap = ud.liverCap;
      const root = ud.modelRoot;
      const open = o.open != null ? o.open : 0;
      const time = o.time != null ? o.time : performance.now() / 1000;

      jar.G.updateMatrixWorld(true);
      L.cam.updateMatrixWorld();

      if (open <= 0.001) {
        this.hide();
        if (cap && ud.capRest) {
          cap.position.copy(ud.capRest);
          cap.rotation.y = 0;
        }
        return;
      }

      ensureVideoPlaying();
      bubbleGroup.visible = true;

      // --- CAP UNSCREW & LIFT ---
      if (cap && root) {
        const turnK = sm(clamp(open / 0.55));
        const liftK = sm(clamp((open - 0.15) / 0.70));

        cap.rotation.y = turnK * 2.5 * Math.PI * 2;
        cap.position.copy(ud.capRest || new THREE.Vector3());

        if (liftK > 0) {
          // Find cap world rest position
          capRestW.copy(ud.capRest || new THREE.Vector3()).applyMatrix4(root.matrixWorld);
          // Target screen position at top of frame (0.15 * vh)
          toWorld(o.vw * 0.5, o.vh * (o.mobile ? 0.13 : 0.15), capRestW.z, capTargetW);
          rinv.copy(root.matrixWorld).invert();
          capTargetL.copy(capTargetW).applyMatrix4(rinv);
          cap.position.x += (capTargetL.x - (ud.capRest ? ud.capRest.x : 0)) * liftK;
          cap.position.y += (capTargetL.y - (ud.capRest ? ud.capRest.y : 0)) * liftK;
          cap.position.z += (capTargetL.z - (ud.capRest ? ud.capRest.z : 0)) * liftK;
        }
      }

      // --- BOTTLE MOUTH IN WORLD SPACE ---
      // Bottle neck top in model local coords is y = 0.748
      const bottleMesh = root ? root.getObjectByName('Bottle') : null;
      if (bottleMesh) {
        mouthW.set(0, 0.748, 0).applyMatrix4(bottleMesh.matrixWorld);
      } else if (root) {
        mouthW.set(0, 3.72, 0).applyMatrix4(root.matrixWorld);
      } else {
        mouthW.set(0, 0, 0);
      }

      // Slightly lower liquid fill in bottle as molecules emerge
      if (ud.liverFill) {
        ud.liverFill.value = Math.max(0.70, 1.0 - open * 0.22);
      }

      // --- 8 VIDEO BUBBLES EMERGENCE & 3D CLOUD FLIGHT ---
      const cloudLayout = o.mobile ? CLOUD_MOBILE : CLOUD_DESKTOP;
      const count = bubbles.length;

      // Callout highlight index: sweeps across ingredients during callouts (u = 0.68..0.82)
      const calloutA = o.calloutA != null ? o.calloutA : 0;
      const activeCalloutIdx = (o.c != null && calloutA > 0.05) ? Math.floor(clamp(o.c, 0, 0.999) * count) : -1;

      bubbles.forEach((b, i) => {
        const cfg = cloudLayout[i];
        // Emergence stagger schedule across open [0.18 .. 0.85]
        const tStart = 0.18 + i * 0.055;
        const tEnd = tStart + 0.28;
        const progress = clamp((open - tStart) / (tEnd - tStart), 0, 1);
        const kEase = sm(progress);

        if (kEase <= 0.001) {
          b.mesh.visible = false;
          b.mat.uniforms.uAlpha.value = 0.0;
          return;
        }

        b.mesh.visible = true;

        // Destination in world coordinates
        toWorld(cfg.u * o.vw, cfg.v * o.vh, cfg.z, destW);

        // Control point for graceful bezier arc rising upward from bottle mouth
        ctrlW.set(
          (mouthW.x + destW.x) * 0.5,
          mouthW.y + (o.mobile ? 1.4 : 1.8) + (i % 2 === 0 ? 0.3 : -0.2),
          (mouthW.z + destW.z) * 0.5
        );

        // Interpolate along bezier path
        bez2(mouthW, ctrlW, destW, kEase, curPos);

        // Harmonic organic liquid bobbing when emerged
        if (kEase > 0.85) {
          const harmonic = (kEase - 0.85) / 0.15;
          const phase = i * 0.95;
          curPos.x += Math.sin(time * 1.35 + phase) * 0.045 * harmonic;
          curPos.y += Math.sin(time * 1.70 + phase * 1.3) * 0.055 * harmonic;
          curPos.z += Math.cos(time * 1.15 + phase * 0.7) * 0.035 * harmonic;
        }

        // Pointer proximity interaction (soft interactive push)
        let hoverBoost = 0;
        if (o.pointer && o.pointer.on && kEase > 0.85) {
          toScreen(curPos, sp);
          const dx = o.pointer.x - sp.x;
          const dy = o.pointer.y - sp.y;
          const distPx = Math.hypot(dx, dy);
          if (distPx < 130) {
            const pushK = (1 - distPx / 130);
            curPos.x -= (dx / Math.max(1, distPx)) * pushK * 0.15;
            curPos.y += (dy / Math.max(1, distPx)) * pushK * 0.15;
            hoverBoost = pushK * 0.75;
          }
        }

        // Callout focus: pop forward in depth during featured moment
        const isCurrentFocus = (i === activeCalloutIdx);
        if (isCurrentFocus) {
          curPos.z += 0.40 * calloutA;
        }

        b.mesh.position.copy(curPos);

        // Billboard orientation: strictly perpendicular to camera
        b.mesh.quaternion.copy(L.cam.quaternion);

        // Scale: expands from bottle mouth to full size
        const baseScale = cfg.s * (o.mobile ? 1.0 : 1.12);
        const focusMult = isCurrentFocus ? (1 + 0.22 * calloutA) : (1 + hoverBoost * 0.15);
        const curScale = baseScale * kEase * focusMult;
        b.mesh.scale.setScalar(curScale);

        // Opacity: non-focused bubbles gently soften during callout inspection
        let targetAlpha = Math.min(1.0, kEase * 1.35);
        if (calloutA > 0.05 && activeCalloutIdx >= 0) {
          targetAlpha = isCurrentFocus ? 1.0 : lerp(targetAlpha, 0.45, calloutA);
        }
        b.mat.uniforms.uAlpha.value = targetAlpha;

        const calloutFocus = isCurrentFocus ? (calloutA * 0.95) : 0.0;
        b.mat.uniforms.uFocus.value = Math.max(hoverBoost, calloutFocus);
      });
    },

    // 3. Hide: immediately hide all bubbles and pause video
    hide() {
      bubbleGroup.visible = false;
      bubbles.forEach(b => {
        b.mesh.visible = false;
        b.mat.uniforms.uAlpha.value = 0.0;
      });
      if (vid && !vid.paused) {
        vid.pause();
        isPlaying = false;
      }
    },

    // 4. Reset: restore bottle and cap to closed rest state
    reset(jar) {
      this.hide();
      const ud = jar && jar.b && jar.b.userData;
      if (ud) {
        if (ud.liverCap && ud.capRest) {
          ud.liverCap.position.copy(ud.capRest);
          ud.liverCap.rotation.y = 0;
        }
        if (ud.liverFill) {
          ud.liverFill.value = 1.0;
        }
      }
    },

    // 5. Dispose: clean up textures, materials, and remove DOM video
    dispose() {
      this.hide();
      L.scene.remove(bubbleGroup);
      quadGeo.dispose();
      badgeTextures.forEach(t => t.dispose());
      vidTex.dispose();
      bubbles.forEach(b => b.mat.dispose());
      if (vid && vid.parentNode) {
        vid.parentNode.removeChild(vid);
      }
    },
  };
}

export { createLiverDirector, INGREDIENTS };
