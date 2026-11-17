// Reviva & CycleRelief Roll-On: interactive ingredients moment.
//
// Scroll Timeline & Staging:
// 1. Cap unscrews and lifts away; camera dollies in macro-close to roller tip (u: 0.00 .. 0.16).
// 2. Clear gap / hold on the glistening tip (u: 0.16 .. 0.22).
// 3. Liquid bubbles emerge couple-by-couple in 6 waves, floating up into an
//    organic, non-overlapping cloud matching the user's sketch (u: 0.22 .. 0.50).
// 4. Text cards reveal ONE BY ONE as you scroll (u: 0.50 .. 0.77), then hold (u: 0.77 .. 0.86).
// 5. Text cards GRADUALLY disappear / fade out (u: 0.86 .. 0.92).
// 6. "ONLY BUBBLES" MOMENT: Text is gone, all 18 bubbles float suspended in 3D (u: 0.92 .. 1.00).
// 7. BUBBLES RETRACT: WHILE STILL IN CLOSE-UP ZOOM, bubbles gradually float down and absorb
//    into the rollerball socket wave-by-wave over a full scroll stretch (vVal: 0.00 .. 0.55).
// 8. ONLY THEN: Camera dollies smoothly back out to wide, bottle straightens, and cap screws shut (vVal: 0.55 .. 0.88).

import * as THREE from 'three';

const TURNS = 2.5; // Cap unscrew turns

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = t => t * t * (3 - 2 * t);
const smooth = (a, b, x) => sm(clamp((x - a) / (b - a)));

let styled = false;
function addStyle() {
  if (styled) return;
  styled = true;
  const s = document.createElement('style');
  s.textContent = `
  .rollon-director-layer { position: fixed; inset: 0; z-index: 47; pointer-events: none !important; visibility: hidden; }
  .rollon-director-layer svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none !important; }
  .rollon-director-layer line { stroke-width: 1.6; stroke-linecap: round; pointer-events: none !important; }
  .rollon-director-layer circle { stroke-width: 2.2; pointer-events: none !important; }
  .rollon-label {
    position: absolute; box-sizing: border-box; padding: 11px 15px 12px; border-radius: 14px;
    -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
    will-change: opacity, transform; pointer-events: none !important;
  }
  .rollon-label b { display: block; font-size: 15px; line-height: 1.2; font-weight: 700; letter-spacing: .01em; }
  .rollon-label span { display: block; margin-top: 4px; font-size: 12.5px; line-height: 1.35; opacity: .88; }
  .rollon-label i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 7px; vertical-align: baseline; }

  /* Reviva Vitality Theme (amber / deep botanical green) */
  .rollon-theme-reviva .rollon-label {
    background: rgba(252, 250, 242, 0.94);
    color: #1d4527;
    box-shadow: 0 8px 26px rgba(40, 75, 30, 0.14);
  }
  .rollon-theme-reviva .rollon-label b { color: #163e20; }
  .rollon-theme-reviva .rollon-label span { color: #2c4c32; }
  .rollon-theme-reviva .rollon-label i { background: #c8861f; box-shadow: 0 0 0 2.5px rgba(200, 134, 31, 0.25); }

  /* CycleRelief Menstrual Comfort Theme (rose-gold nectar / berry rose) */
  .rollon-theme-cycle .rollon-label {
    background: rgba(255, 248, 250, 0.94);
    color: #541929;
    box-shadow: 0 8px 26px rgba(110, 27, 48, 0.14);
  }
  .rollon-theme-cycle .rollon-label b { color: #441421; }
  .rollon-theme-cycle .rollon-label span { color: #682538; }
  .rollon-theme-cycle .rollon-label i { background: #c4687d; box-shadow: 0 0 0 2.5px rgba(196, 104, 125, 0.25); }

  @media (max-width: 720px) {
    .rollon-label { padding: 9px 12px 10px; }
    .rollon-label b { font-size: 14px; }
    .rollon-label span { font-size: 12px; }
  }
  `;
  document.head.appendChild(s);
}

// 18 non-overlapping bubble positions based directly on user's sketch:
// Grouped into 6 waves for couple-by-couple emergence and reverse wave retraction.
const BUBBLE_DEFS = [
  // Wave 0: First couple emerging close above the ball tip
  { dx: 0.12, dy: 0.30, dz: 0.10, r: 0.048, wave: 0 },
  { dx: 0.28, dy: 0.42, dz: 0.05, r: 0.072, wave: 0 },

  // Wave 1: Floating up to left & upper-left
  { dx: -0.05, dy: 0.68, dz: 0.18, r: 0.095, wave: 1, targetCard: 0 }, // Hero Bubble for Card 0
  { dx: 0.10, dy: 0.85, dz: -0.08, r: 0.052, wave: 1 },
  { dx: 0.22, dy: 0.62, dz: 0.12, r: 0.058, wave: 1 },

  // Wave 2: Mid-left & center
  { dx: 0.36, dy: 0.26, dz: 0.15, r: 0.085, wave: 2, targetCard: 1 }, // Hero Bubble for Card 1
  { dx: 0.48, dy: 0.52, dz: -0.04, r: 0.075, wave: 2 },
  { dx: 0.52, dy: 0.80, dz: 0.10, r: 0.050, wave: 2 },

  // Wave 3: Upper center
  { dx: 0.68, dy: 1.05, dz: 0.06, r: 0.082, wave: 3 },
  { dx: 0.82, dy: 0.68, dz: -0.10, r: 0.054, wave: 3 },
  { dx: 1.05, dy: 1.15, dz: 0.14, r: 0.105, wave: 3, targetCard: 2 }, // Hero Bubble for Card 2

  // Wave 4: Mid-right
  { dx: 0.98, dy: 0.45, dz: 0.08, r: 0.052, wave: 4 },
  { dx: 1.25, dy: 0.85, dz: -0.05, r: 0.078, wave: 4 },
  { dx: 1.38, dy: 1.25, dz: 0.12, r: 0.058, wave: 4 },

  // Wave 5: Far-right arc
  { dx: 1.45, dy: 0.55, dz: 0.16, r: 0.090, wave: 5, targetCard: 3 }, // Hero Bubble for Card 3
  { dx: 1.62, dy: 0.92, dz: -0.06, r: 0.072, wave: 5 },
  { dx: 1.75, dy: 0.68, dz: 0.08, r: 0.054, wave: 5 },
  { dx: 1.88, dy: 1.10, dz: 0.04, r: 0.060, wave: 5 }
];

const CONFIGS = {
  rollon: {
    layerId: 'rollonLayer_rollon',
    hostName: 'RollonBubbleHost_rollon',
    themeClass: 'rollon-theme-cycle',
    bubbleMat: {
      color: 0xeb8da3,           // soft luminous rose-gold nectar
      emissive: 0x6e1b30,        // deep rose inner glow
      emissiveIntensity: 0.38,
      roughness: 0.03,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      envMapIntensity: 2.2
    },
    lineColor: '#c4687d',
    dotStroke: '#541929',
    dotFill: '#f29bb0',
    calloutDefs: [
      { name: 'Rosemary Essential Oil', text: 'Rich in 1,8-cineole to support soothing micro-circulation and relieve muscular period tension.', side: 0, bubbleIdx: 2 },
      { name: '100% Botanical Carrier', text: 'Light, silky natural plant lipids for effortless smooth glide and rapid non-greasy absorption.', side: 0, bubbleIdx: 5 },
      { name: 'Damask Rose Extract', text: 'Pure steam-distilled essence providing calming aromatic comfort and menstrual cycle easing.', side: 1, bubbleIdx: 10 },
      { name: 'Peppermint Cooling Oil', text: 'Natural menthol triggers cooling sensory comfort to ease localized abdominal tightness.', side: 1, bubbleIdx: 14 }
    ]
  },
  reviva: {
    layerId: 'rollonLayer_reviva',
    hostName: 'RollonBubbleHost_reviva',
    themeClass: 'rollon-theme-reviva',
    bubbleMat: {
      color: 0xf2a622,            // warm rich amber gold
      emissive: 0x622f04,         // golden honey inner glow
      emissiveIntensity: 0.38,
      roughness: 0.03,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      envMapIntensity: 2.2
    },
    lineColor: '#c8861f',
    dotStroke: '#1d4527',
    dotFill: '#f5b232',
    calloutDefs: [
      { name: 'Dill Essential Oil (E.O)', text: 'Pure botanical extract traditionally valued for micro-circulation and vitality.', side: 0, bubbleIdx: 2 },
      { name: '100% Plant-Based Carrier', text: 'Lightweight, nourishing plant lipids ensuring fast skin absorption without greasy residue.', side: 0, bubbleIdx: 5 },
      { name: 'Eucalyptus Essential Oil', text: 'Provides a refreshing aromatic profile with a soothing, cooling sensory effect.', side: 1, bubbleIdx: 10 },
      { name: 'Targeted Reflex Ritual', text: 'Designed for gentle circular massage around the navel to stimulate wellness pathways.', side: 1, bubbleIdx: 14 }
    ]
  }
};

export function createRollonDirector(L, productId = 'reviva') {
  addStyle();

  const cfg = CONFIGS[productId] || CONFIGS.reviva;

  // 1. DOM Overlay for SVG Leader Lines & Callout Cards
  const layer = document.createElement('div');
  layer.id = cfg.layerId;
  layer.className = `rollon-director-layer ${cfg.themeClass}`;
  layer.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  layer.appendChild(svg);

  const items = cfg.calloutDefs.map(({ name, text, side, bubbleIdx }) => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', cfg.lineColor);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '4.5');
    dot.setAttribute('stroke', cfg.dotStroke);
    dot.setAttribute('fill', cfg.dotFill);
    svg.appendChild(line);
    svg.appendChild(dot);
    const el = document.createElement('div');
    el.className = 'rollon-label';
    el.innerHTML = '<b><i></i>' + name + '</b><span>' + text + '</span>';
    layer.appendChild(el);
    return { line, dot, el, side, bubbleIdx, a: 0 };
  });
  document.body.appendChild(layer);

  // 2. Camera Tracking Vectors
  const camPos0 = new THREE.Vector3(0, 0, 24);
  const camLook0 = new THREE.Vector3(0, 0, 0);
  const curCamPos = new THREE.Vector3();
  const curCamLook = new THREE.Vector3();
  const lookZoom = new THREE.Vector3();
  const posZoom = new THREE.Vector3();

  const resetCamera = () => {
    L.cam.position.set(0, 0, 24);
    L.cam.up.set(0, 1, 0);
    L.cam.lookAt(0, 0, 0);
    if (Math.abs(L.cam.fov - 30) > 0.001) {
      L.cam.fov = 30;
      L.cam.updateProjectionMatrix();
    }
    L.cam.updateMatrixWorld(true);
  };

  // 3. 3D Spherical Liquid Bubbles (Product-Themed Material)
  const bubbleHost = new THREE.Group();
  bubbleHost.name = cfg.hostName;
  bubbleHost.visible = false;
  L.scene.add(bubbleHost);

  const sphereGeo = new THREE.SphereGeometry(1, 24, 18);
  const bubbleMat = new THREE.MeshPhysicalMaterial(cfg.bubbleMat);

  const bubbleMeshes = BUBBLE_DEFS.map((def, i) => {
    const mesh = new THREE.Mesh(sphereGeo, bubbleMat);
    mesh.name = `${cfg.hostName}_Bubble_${i}`;
    mesh.renderOrder = 15;
    mesh.visible = false;
    bubbleHost.add(mesh);
    return {
      mesh,
      def,
      currWorldPos: new THREE.Vector3(),
      phase: i * 0.95 + Math.random() * 0.3,
      speed: 1.0 + (i % 3) * 0.35
    };
  });

  // Temp vectors & helpers
  const v = new THREE.Vector3();
  const ballW = new THREE.Vector3();
  const capW = new THREE.Vector3();
  const capT = new THREE.Vector3();
  const l0 = new THREE.Vector3();
  const l1 = new THREE.Vector3();
  const rinv = new THREE.Matrix4();
  const sp = { x: 0, y: 0 };
  const sp2 = { x: 0, y: 0 };
  const camR = new THREE.Vector3();
  const D = { shown: false };

  const toWorld = (px, py, z, out) => out.set((px / L.W - 0.5) * 2 * L.halfW, -(py / L.H - 0.5) * 2 * L.halfH, z);
  const toScreen = (w, out) => {
    v.copy(w).project(L.cam);
    out.x = (v.x * 0.5 + 0.5) * L.W;
    out.y = (-v.y * 0.5 + 0.5) * L.H;
  };

  return {
    // 1. Pose: Natural 45-degree angle without scaling distortion
    pose(hold, open, o) {
      if (open <= 0) return hold;
      const k = sm(clamp((open - 0.05) / 0.32));
      const d = ((hold.rotY - o.front + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

      hold.y = hold.y + (o.vh * (o.mobile ? 0.74 : 0.70) - hold.y) * k;
      hold.rotY = hold.rotY - k * d;
      hold.rotX = hold.rotX + (0.18 - hold.rotX) * k;
      hold.rotZ = hold.rotZ + (-0.35 - hold.rotZ) * k;
      return hold;
    },

    // 2. Update: Sequence driver
    update(jar, o) {
      const ud = jar.b.userData;
      const pivot = ud.capPivot || jar.b.getObjectByName('Jar_Cap_Pivot');
      const ball = ud.ball || jar.b.getObjectByName('Roller_Ball');
      const root = ud.modelRoot || jar.b;

      if (!pivot || !root) return;

      jar.G.updateMatrixWorld(true);
      L.cam.updateMatrixWorld();

      const open = o.open;
      const u = o.u != null ? o.u : 0;
      const vVal = o.v != null ? o.v : 0;
      const time = o.time || 0;

      if (open <= 0.0005 || vVal >= 0.95) {
        resetCamera();
        bubbleHost.visible = false;
        bubbleMeshes.forEach(b => { b.mesh.visible = false; });
        if (ball) ball.rotation.set(0, 0, 0);
        if (pivot && ud.capRest) {
          pivot.rotation.set(0, 0, 0);
          pivot.position.copy(ud.capRest);
        }
        this.hide();
        return;
      }

      // --- CAP UNSCREW & LIFT AWAY ---
      const turnK = sm(clamp(open / 0.20));
      const liftK = sm(clamp((open - 0.06) / 0.22));
      pivot.rotation.y = turnK * TURNS * Math.PI * 2;

      const capRest = ud.capRest || new THREE.Vector3(0, 0, 0);
      pivot.position.copy(capRest);

      if (liftK > 0) {
        capW.set(capRest.x, capRest.y + 0.5, capRest.z).applyMatrix4(root.matrixWorld);
        toWorld(o.vw * (o.mobile ? 0.65 : 0.68), o.vh * (o.mobile ? 0.12 : 0.14), capW.z, capT);
        rinv.copy(root.matrixWorld).invert();
        l0.set(capRest.x, capRest.y, capRest.z);
        l1.copy(capT).applyMatrix4(rinv);
        pivot.position.x += (l1.x - l0.x) * liftK;
        pivot.position.y += (l1.y - l0.y) * liftK;
        pivot.position.z += (l1.z - l0.z) * liftK;
      }
      pivot.updateMatrixWorld(true);

      // --- BALL POSITION & ROTATION ---
      if (ball) {
        ball.getWorldPosition(ballW);
        ball.rotation.x = time * 0.35 + u * 12.0;
        if (ball.material) {
          ball.material.roughness = THREE.MathUtils.lerp(0.18, 0.03, sm(open));
          ball.material.metalness = THREE.MathUtils.lerp(0.85, 1.0, sm(open));
        }
      } else {
        root.getWorldPosition(ballW);
        ballW.y += 1.55;
      }

      // --- CAMERA ZOOM TO TIP & BUBBLE CLOUD AREA ---
      // Zooms in during u (0 -> 0.16).
      // STAYS FULLY ZOOMED IN throughout u AND throughout the bubble retraction (vVal: 0 -> 0.52)!
      // Only dollies out to wide AFTER all bubbles have completely been absorbed inside the tip.
      let zoomK = 0;
      if (vVal <= 0) {
        zoomK = sm(clamp(u / 0.16, 0, 1));
      } else {
        // Stays 1.0 until vVal = 0.52, then eases out to 0 between vVal 0.52 and 0.80
        zoomK = 1 - sm(clamp((vVal - 0.52) / 0.28, 0, 1));
      }

      if (zoomK > 0.002) {
        const kEase = sm(zoomK);
        if (o.mobile) {
          lookZoom.set(ballW.x + 0.35, ballW.y + 0.25, ballW.z);
          posZoom.set(lookZoom.x, lookZoom.y, ballW.z + 5.6);
        } else {
          lookZoom.set(ballW.x + 0.65, ballW.y + 0.45, ballW.z);
          posZoom.set(lookZoom.x - 0.15, lookZoom.y + 0.1, ballW.z + 5.0);
        }

        const fov0 = 30;
        const fovZoom = o.mobile ? 26 : 24;
        const curFov = lerp(fov0, fovZoom, kEase);

        curCamLook.lerpVectors(camLook0, lookZoom, kEase);
        curCamPos.lerpVectors(camPos0, posZoom, kEase);

        L.cam.position.copy(curCamPos);
        L.cam.up.set(0, 1, 0);
        L.cam.lookAt(curCamLook);
        L.cam.fov = curFov;
        L.cam.updateProjectionMatrix();
        L.cam.updateMatrixWorld(true);
      } else {
        resetCamera();
      }

      // --- BUBBLES: EMERGE, HOLD SUSPENDED, AND RETRACT OVER FULL SCROLL ---
      // Emerge schedule across u: 0.22 to 0.50 (6 waves of 2-4 bubbles)
      const waveStarts = [0.22, 0.28, 0.34, 0.40, 0.45, 0.50];

      // Retract schedule across vVal (0.00 to 0.54) - generous scroll stretch:
      // Outer Wave 5 retracts first (vVal: 0.02 -> 0.18)
      // Wave 4 retracts (vVal: 0.08 -> 0.24)
      // Wave 3 retracts (vVal: 0.15 -> 0.31)
      // Wave 2 retracts (vVal: 0.22 -> 0.38)
      // Wave 1 retracts (vVal: 0.30 -> 0.46)
      // Inner Wave 0 retracts last (vVal: 0.38 -> 0.54)
      const waveRetractV = [0.38, 0.30, 0.22, 0.15, 0.08, 0.02];

      const isAllGone = vVal >= 0.56;

      if (u >= 0.20 && !isAllGone) {
        bubbleHost.visible = true;

        bubbleMeshes.forEach(({ mesh, def, currWorldPos, phase, speed }) => {
          const wStart = waveStarts[def.wave] || 0.28;
          // Forward emerge progress: 0..1 over a gentle 0.08 scroll span
          const emerge = smooth(wStart, wStart + 0.08, u);

          // Reverse retract progress: sucked smoothly back into ball tip over 0.16 span of vVal
          const rStart = waveRetractV[def.wave] || 0.10;
          const retractProgress = vVal > 0 ? smooth(rStart, rStart + 0.16, vVal) : 0;
          const activeEmerge = emerge * (1 - retractProgress);

          if (activeEmerge <= 0.001) {
            mesh.visible = false;
            return;
          }

          mesh.visible = true;

          // Target destination in world space
          const targetX = ballW.x + def.dx;
          const targetY = ballW.y + def.dy;
          const targetZ = ballW.z + def.dz;

          // Position lerps smoothly between ball tip (0) and target cloud position (1)
          const posX = lerp(ballW.x, targetX, activeEmerge);
          const posY = lerp(ballW.y, targetY, activeEmerge);
          const posZ = lerp(ballW.z, targetZ, activeEmerge);

          // Natural floating hover once settled (damped during retract)
          const hoverDamp = 1 - (vVal > 0 ? clamp(vVal / 0.4, 0, 1) : 0);
          const hoverY = (activeEmerge > 0.8 && hoverDamp > 0.01) ? Math.sin(time * speed + phase) * 0.022 * hoverDamp : 0;
          const hoverX = (activeEmerge > 0.8 && hoverDamp > 0.01) ? Math.cos(time * speed * 0.8 + phase) * 0.016 * hoverDamp : 0;

          mesh.position.set(posX + hoverX, posY + hoverY, posZ);
          currWorldPos.set(posX + hoverX, posY + hoverY, posZ);

          // Scale smoothly expands on emerge, gently contracts to 0 on retract
          const s = def.r * activeEmerge * (1 + 0.06 * Math.sin(time * 2.0 + phase));
          mesh.scale.set(s, s, s);
        });
      } else {
        bubbleHost.visible = false;
        bubbleMeshes.forEach(b => { b.mesh.visible = false; });
      }

      // --- INGREDIENT CARDS: REVEAL STRICTLY ONE BY ONE, THEN GRADUALLY DISAPPEAR ---
      // Entry: u = 0.50 to 0.77 (each card reveals sequentially)
      // Full hold: u = 0.77 to 0.86
      // Gradual fade out: u = 0.86 to 0.92
      // Only-bubbles moment: u = 0.92 to 1.00 (cards completely gone, only bubbles remain)
      const Acall = o.calloutA;
      if (Acall <= 0.001 || u < 0.48 || u >= 0.93 || vVal > 0) {
        this.hide();
        return;
      }

      layer.style.visibility = 'visible';
      D.shown = true;

      const W = o.vw;
      const H = o.vh;

      // Gradual fade out factor across u: 0.86 to 0.92
      const textFadeOut = smooth(0.86, 0.92, u);

      items.forEach((it, k) => {
        // One-by-one sequential entry schedules:
        // Card 0: reveals u = 0.50 -> 0.56
        // Card 1: reveals u = 0.57 -> 0.63
        // Card 2: reveals u = 0.64 -> 0.70
        // Card 3: reveals u = 0.71 -> 0.77
        const kStart = 0.50 + k * 0.07;
        const kEnd = kStart + 0.06;

        let a = 0;
        if (o.mobile) {
          // On mobile: show strictly the active card
          const activeK = Math.min(3, Math.floor(clamp((u - 0.50) / 0.28, 0, 0.99) * 4));
          if (k === activeK) {
            a = smooth(kStart, kStart + 0.03, u) * (1 - textFadeOut) * Acall;
          }
        } else {
          // On desktop: cards reveal one after another sequentially, then all fade out smoothly together
          const cardIn = smooth(kStart, kEnd, u);
          a = cardIn * (1 - textFadeOut) * Acall;
        }

        it.a = a;

        if (a <= 0.003) {
          it.el.style.opacity = '0';
          it.line.setAttribute('opacity', '0');
          it.dot.setAttribute('opacity', '0');
          return;
        }

        const targetBubble = bubbleMeshes[it.bubbleIdx];
        if (!targetBubble || !targetBubble.mesh.visible) {
          it.el.style.opacity = '0';
          it.line.setAttribute('opacity', '0');
          it.dot.setAttribute('opacity', '0');
          return;
        }

        toScreen(targetBubble.currWorldPos, sp);
        camR.setFromMatrixColumn(L.cam.matrixWorld, 0).multiplyScalar(targetBubble.def.r).add(targetBubble.currWorldPos);
        toScreen(camR, sp2);

        const gx = sp.x;
        const gy = sp.y;
        const rPx = Math.max(14, Math.hypot(sp2.x - gx, sp2.y - gy));

        if (!Number.isFinite(gx) || !Number.isFinite(gy)) return;

        let lx, ly, ax, ay, w, dx, dy;

        if (o.mobile) {
          w = Math.min(W * 0.88, 360);
          lx = (W - w) / 2;
          ly = H * 0.68;
          ax = W / 2;
          ay = ly;
          dx = gx;
          dy = gy + rPx;
        } else {
          const isLeft = it.side === 0;
          const isTop = (k === 0 || k === 2);

          w = Math.min(275, W * 0.23);
          lx = isLeft ? Math.max(22, W * 0.055) : W - Math.max(22, W * 0.055) - w;
          ly = isTop ? H * 0.28 : H * 0.58;
          ax = isLeft ? lx + w : lx;
          ay = ly + 26;

          const angle = isLeft ? (isTop ? Math.PI - 0.35 : Math.PI + 0.35) : (isTop ? -0.35 : 0.35);
          dx = gx + Math.cos(angle) * rPx * 1.04;
          dy = gy + Math.sin(angle) * rPx * 1.04;
        }

        it.el.style.width = w + 'px';
        it.el.style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + (ly + (1 - a) * 8).toFixed(1) + 'px,0)';
        it.el.style.opacity = a.toFixed(3);

        const tProg = clamp(a * 1.3);
        const ex = dx + (ax - dx) * tProg;
        const ey = dy + (ay - dy) * tProg;

        it.line.setAttribute('x1', dx.toFixed(1));
        it.line.setAttribute('y1', dy.toFixed(1));
        it.line.setAttribute('x2', ex.toFixed(1));
        it.line.setAttribute('y2', ey.toFixed(1));
        it.line.setAttribute('opacity', a.toFixed(3));
        it.line.setAttribute('stroke', cfg.lineColor);

        it.dot.setAttribute('cx', dx.toFixed(1));
        it.dot.setAttribute('cy', dy.toFixed(1));
        it.dot.setAttribute('opacity', a.toFixed(3));
        it.dot.setAttribute('stroke', cfg.dotStroke);
        it.dot.setAttribute('fill', cfg.dotFill);
      });
    },

    hide() {
      if (!D.shown) return;
      layer.style.visibility = 'hidden';
      D.shown = false;
      items.forEach(it => { it.el.style.opacity = '0'; });
    },

    // Put everything back (closing / switching product)
    reset(jar) {
      this.hide();
      resetCamera();
      bubbleHost.visible = false;
      bubbleMeshes.forEach(b => { b.mesh.visible = false; });
      const ud = jar && jar.b && jar.b.userData;
      if (!ud) return;
      if (ud.capPivot && ud.capRest) {
        ud.capPivot.rotation.set(0, 0, 0);
        ud.capPivot.position.copy(ud.capRest);
      }
      if (ud.ball) {
        ud.ball.rotation.set(0, 0, 0);
      }
    }
  };
}
