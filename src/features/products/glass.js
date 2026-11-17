import * as THREE from 'three';

/**
 * Realistic, high-performance glass material helper for TranzLife product models.
 * Compatible with Three.js r128 (no KHR_materials_transmission).
 *
 * Features:
 * - Clear thick glass appearance using MeshPhysicalMaterial
 * - Front-side and back-side shell passes for physical depth
 * - Dynamic Fresnel-based rim opacity and softbox reflection highlights
 * - Object-space thickness tint (darker & greener toward base and rim)
 * - Adaptive performance manager (glassPerf): automatically hides back-face shell
 *   and scales back fresnel boost under low FPS (<50fps / >20ms frame time) or on mobile/reduced-motion.
 */

function safeReplace(source, target, replacement) {
  if (!source.includes(target)) {
    console.warn(`[glass] Failed to find shader chunk: "${target}"`);
    return source;
  }
  return source.replace(target, replacement);
}

const lin = hex => new THREE.Color(hex).convertSRGBToLinear();

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth < 700;

export const glassQualityState = {
  isHigh: true
};

const trackedInstances = new Set();

/**
 * Updates the global glass quality.
 * @param {boolean} high
 */
export function setGlassQuality(high) {
  const isForcedLow = prefersReducedMotion() || isMobileViewport();
  glassQualityState.isHigh = isForcedLow ? false : !!high;
  for (const inst of trackedInstances) {
    for (const bm of inst.backMeshes) {
      bm.visible = glassQualityState.isHigh;
    }
    for (const fm of inst.frontMats) {
      if (fm.userData.uFresnelBoost) {
        fm.userData.uFresnelBoost.value = glassQualityState.isHigh ? 1.0 : 0.45;
      }
    }
    for (const bm of inst.backMats) {
      if (bm.userData.uFresnelBoost) {
        bm.userData.uFresnelBoost.value = glassQualityState.isHigh ? 0.7 : 0.25;
      }
    }
  }
}

let slowTimeAccum = 0;
let fastTimeAccum = 0;

/**
 * Glass performance monitor. Hooked into the existing journey/jarLayer render loop.
 */
export const glassPerf = {
  get isHigh() {
    return glassQualityState.isHigh;
  },
  setQuality: setGlassQuality,
  update(frameTimeMs) {
    if (frameTimeMs == null || isNaN(frameTimeMs) || frameTimeMs <= 0) return;

    // Ignore frames > 100ms (browser sleep, tab switch, or waking from rAF sleep)
    if (frameTimeMs > 100) {
      slowTimeAccum = 0;
      return;
    }

    if (prefersReducedMotion() || isMobileViewport()) {
      if (glassQualityState.isHigh) setGlassQuality(false);
      slowTimeAccum = 0;
      fastTimeAccum = 0;
      return;
    }

    if (glassQualityState.isHigh) {
      if (frameTimeMs > 20) {
        slowTimeAccum += frameTimeMs;
        if (slowTimeAccum >= 3000) {
          // Sustained > 20ms for 3 seconds -> drop to low quality
          setGlassQuality(false);
          slowTimeAccum = 0;
          fastTimeAccum = 0;
        }
      } else {
        slowTimeAccum = Math.max(0, slowTimeAccum - frameTimeMs * 0.5);
      }
    } else {
      if (frameTimeMs < 14) {
        fastTimeAccum += frameTimeMs;
        if (fastTimeAccum >= 5000) {
          // Sustained < 14ms for 5 seconds -> restore high quality
          setGlassQuality(true);
          fastTimeAccum = 0;
          slowTimeAccum = 0;
        }
      } else {
        fastTimeAccum = 0;
      }
    }
  }
};

/**
 * Creates the outer front-facing glass material.
 */
export function makeGlassMaterial(base, opts = {}) {
  const mat = base ? base.clone() : new THREE.MeshPhysicalMaterial();
  mat.transmission = 0; // Disable three r128 stub to prevent white opaque glitch
  mat.transparent = true;
  mat.depthWrite = false;
  mat.side = THREE.FrontSide;

  mat.clearcoat = 1.0;
  mat.clearcoatRoughness = 0.02;
  mat.roughness = 0.02;
  mat.metalness = 0.0;
  mat.reflectivity = 1.0;
  mat.envMapIntensity = 2.0;

  const baseColor = opts.color !== undefined ? opts.color : 0xffffff;
  mat.color.copy(lin(baseColor));

  const baseAlpha = opts.alpha !== undefined ? opts.alpha : 0.06;
  mat.opacity = baseAlpha;

  if (opts.polygonOffset) {
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = opts.polygonOffsetFactor !== undefined ? opts.polygonOffsetFactor : -1.0;
    mat.polygonOffsetUnits = opts.polygonOffsetUnits !== undefined ? opts.polygonOffsetUnits : -1.0;
  }

  const uGlassAlpha = { value: baseAlpha };
  const uFresnelBoost = { value: glassQualityState.isHigh ? 1.0 : 0.45 };
  mat.userData.uGlassAlpha = uGlassAlpha;
  mat.userData.uFresnelBoost = uFresnelBoost;

  mat.onBeforeCompile = shader => {
    shader.uniforms.uGlassAlpha = uGlassAlpha;
    shader.uniforms.uFresnelBoost = uFresnelBoost;

    shader.vertexShader = safeReplace(
      shader.vertexShader,
      'void main() {',
      'varying vec3 vGlassPos;\nvoid main() {\n  vGlassPos = position;'
    );

    shader.fragmentShader = safeReplace(
      shader.fragmentShader,
      'void main() {',
      'varying vec3 vGlassPos;\nuniform float uGlassAlpha;\nuniform float uFresnelBoost;\nvoid main() {'
    );

    const fragShaderBody = opts.isBottleShell
      ? `// Bottle glass shell: rim fresnel, soft studio streaks, flared foot refraction, faint inner glow
  vec3 viewDir = normalize(vViewPosition);
  vec3 norm = normalize(vNormal);
  float NdotV = clamp(dot(norm, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - NdotV, 3.0);
  float fBoost = clamp(uFresnelBoost, 0.0, 1.0);

  // Soft shoulder curve and heavy glass base pedestal
  float shoulderCurve = smoothstep(0.20, 0.45, vGlassPos.y) * (1.0 - smoothstep(0.45, 0.75, vGlassPos.y));
  float footBase = smoothstep(-0.78, -0.95, vGlassPos.y);
  float rim = clamp(fresnel * 0.72 + shoulderCurve * 0.14 + footBase * 0.28, 0.0, 1.0);

  // Very low center alpha so frosted green body, label, and liquid shader remain crisp underneath
  gl_FragColor.a = clamp(mix(uGlassAlpha, 0.54, rim), 0.0, 0.68);

  // Soft diffused studio softbox highlights from left and right
  vec3 refl = reflect(-viewDir, norm);
  float softboxL = smoothstep(0.36, 0.84, max(0.0, -refl.x * 0.85 + refl.z * 0.35));
  float softboxR = smoothstep(0.42, 0.88, max(0.0, refl.x * 0.80 + refl.z * 0.30));
  float streak = (softboxL * 0.38 + softboxR * 0.32);
  float rimLight = pow(fresnel, 2.2) * 0.55;
  float footRing = smoothstep(-0.88, -0.95, vGlassPos.y) * (0.4 + 0.6 * pow(fresnel, 0.8));
  vec3 innerGlow = vec3(0.92, 1.0, 0.88) * (pow(fresnel, 2.8) * 0.22 + shoulderCurve * 0.12 + footRing * 0.35);

  gl_FragColor.rgb += (vec3(1.0) * (streak + rimLight) + innerGlow) * fBoost;

  #include <dithering_fragment>`
      : `// Ultra-realistic clear flint glass reflections & caustics
  vec3 viewDir = normalize(vViewPosition);
  vec3 norm = normalize(vNormal);
  float NdotV = clamp(dot(norm, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - NdotV, 3.0);
  float fBoost = clamp(uFresnelBoost, 0.0, 1.0);

  // Thickness factors
  float baseFactor = smoothstep(-0.65, -0.95, vGlassPos.y); // Heavy glass base
  float rimFactor = smoothstep(0.18, 0.32, vGlassPos.y);   // Rounded glass shoulder
  float edgeThickness = clamp(fresnel * 0.70 * fBoost + baseFactor * 0.35 + rimFactor * 0.20, 0.0, 1.0);

  // Clear see-through glass: low alpha in center, rising only at glancing rim
  gl_FragColor.a = clamp(mix(uGlassAlpha, 0.70, edgeThickness), 0.0, 0.82);

  // Pure flint glass tone
  vec3 clearTone = vec3(0.97, 0.99, 0.98);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * clearTone, edgeThickness * 0.15);

  // Studio lighting reflections (softbox strips, shoulder highlight, base refraction)
  vec3 refl = reflect(-viewDir, norm);
  float softboxL = smoothstep(0.40, 0.82, max(0.0, -refl.x * 0.85 + refl.z * 0.35));
  float softboxR = smoothstep(0.45, 0.88, max(0.0, refl.x * 0.85 + refl.z * 0.30));
  float shoulderHl = smoothstep(0.18, 0.28, vGlassPos.y) * (1.0 - smoothstep(0.28, 0.33, vGlassPos.y)) * pow(fresnel, 1.2);
  float baseRing = smoothstep(-0.85, -0.95, vGlassPos.y) * (1.0 - smoothstep(-0.95, -0.96, vGlassPos.y));
  float baseCurveHl = baseRing * (0.5 + 0.5 * pow(fresnel, 0.8));

  vec3 studioHighlights = vec3(1.0, 1.0, 1.0) * (softboxL * 0.35 + softboxR * 0.40 + shoulderHl * 0.50 + baseCurveHl * 0.65 + pow(fresnel, 2.0) * 0.65) * fBoost;
  gl_FragColor.rgb += studioHighlights;

  #include <dithering_fragment>`;

    shader.fragmentShader = safeReplace(
      shader.fragmentShader,
      '#include <dithering_fragment>',
      fragShaderBody
    );
  };

  mat.customProgramCacheKey = () => 'jar_glass_front_' + (opts.variant || 'default');
  mat.needsUpdate = true;
  return mat;
}

/**
 * Creates the inner back-facing glass material.
 */
export function makeGlassBackMaterial(base, opts = {}) {
  const mat = base ? base.clone() : new THREE.MeshPhysicalMaterial();
  mat.transmission = 0;
  mat.transparent = true;
  mat.depthWrite = false;
  mat.side = THREE.BackSide;

  mat.clearcoat = 0.8;
  mat.clearcoatRoughness = 0.04;
  mat.roughness = 0.04;
  mat.metalness = 0.0;
  mat.envMapIntensity = 1.2;

  const backColor = opts.backColor !== undefined ? opts.backColor : 0xffffff;
  mat.color.copy(lin(backColor));

  const backAlpha = opts.alpha !== undefined ? opts.alpha : 0.05;
  mat.opacity = backAlpha;

  const uGlassAlpha = { value: backAlpha };
  const uFresnelBoost = { value: glassQualityState.isHigh ? 0.7 : 0.25 };
  mat.userData.uGlassAlpha = uGlassAlpha;
  mat.userData.uFresnelBoost = uFresnelBoost;

  mat.onBeforeCompile = shader => {
    shader.uniforms.uGlassAlpha = uGlassAlpha;
    shader.uniforms.uFresnelBoost = uFresnelBoost;

    shader.vertexShader = safeReplace(
      shader.vertexShader,
      'void main() {',
      'varying vec3 vGlassPos;\nvoid main() {\n  vGlassPos = position;'
    );

    shader.fragmentShader = safeReplace(
      shader.fragmentShader,
      'void main() {',
      'varying vec3 vGlassPos;\nuniform float uGlassAlpha;\nuniform float uFresnelBoost;\nvoid main() {'
    );

    shader.fragmentShader = safeReplace(
      shader.fragmentShader,
      '#include <dithering_fragment>',
      `// Back-face inner glass wall
  vec3 viewDir = normalize(vViewPosition);
  vec3 norm = normalize(vNormal);
  float NdotV = clamp(dot(norm, viewDir), 0.0, 1.0);
  float fresnel = pow(1.0 - NdotV, 3.0);
  float fBoost = clamp(uFresnelBoost, 0.0, 1.0);

  float baseFactor = smoothstep(-0.75, -0.95, vGlassPos.y);
  float thickness = clamp(fresnel * 0.45 + baseFactor * 0.30, 0.0, 1.0);
  gl_FragColor.a = clamp(mix(uGlassAlpha, 0.45, thickness), 0.0, 0.55);

  vec3 backTone = vec3(0.92, 0.95, 0.94);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * backTone, thickness * 0.25);

  #include <dithering_fragment>`
    );
  };

  mat.customProgramCacheKey = () => 'jar_glass_back_' + (opts.variant || 'default');
  mat.needsUpdate = true;
  return mat;
}

/**
 * Applies realistic glass to the Lung Booster jar model (Jar_Glass & Jar_Neck).
 * Creates one back-face sibling per node sharing the geometry.
 * Sets renderOrder: Back = 1, Interior = 2, Front = 3.
 *
 * @param {THREE.Object3D} m - The product model hierarchy
 */
export function applyJarGlass(m) {
  if (!m) return;

  const targetNames = ['Jar_Glass', 'Jar_Neck'];
  const targets = [];
  m.traverse(n => {
    if (n.isMesh && targetNames.includes(n.name)) {
      targets.push(n);
    }
  });

  if (targets.length === 0) return;

  // Set interior nodes renderOrder = 2
  m.traverse(n => {
    if (n.isMesh && !targetNames.includes(n.name) && !n.name.endsWith('_Back')) {
      n.renderOrder = 2;
    }
  });

  const frontMats = [];
  const backMeshes = [];
  const backMats = [];

  targets.forEach(node => {
    const isJarGlass = node.name === 'Jar_Glass';
    const frontMat = makeGlassMaterial(node.material, {
      alpha: isJarGlass ? 0.06 : 0.08,
      color: 0xffffff,
      variant: node.name
    });
    frontMats.push(frontMat);
    node.material = frontMat;
    node.renderOrder = 3;

    // Check if back sibling already exists
    const backName = `${node.name}_Back`;
    let backMesh = node.parent ? node.parent.getObjectByName(backName) : null;
    if (!backMesh) {
      const backMat = makeGlassBackMaterial(node.material, {
        alpha: isJarGlass ? 0.05 : 0.06,
        backColor: 0xffffff,
        variant: node.name
      });
      backMats.push(backMat);

      backMesh = new THREE.Mesh(node.geometry, backMat);
      backMesh.name = backName;
      backMesh.position.copy(node.position);
      backMesh.rotation.copy(node.rotation);
      backMesh.quaternion.copy(node.quaternion);
      backMesh.scale.copy(node.scale);
      backMesh.renderOrder = 1;
      backMesh.visible = glassQualityState.isHigh;
      backMesh.frustumCulled = false;
      backMesh.userData.isGlassBack = true;

      node.parent.add(backMesh);
      backMeshes.push(backMesh);
    }
  });

  const glassNode = targets.find(n => n.name === 'Jar_Glass');
  if (glassNode) {
    const prevBeforeRender = glassNode.onBeforeRender;
    glassNode.onBeforeRender = function(...args) {
      if (prevBeforeRender) prevBeforeRender.apply(this, args);
      const g = m.getObjectByName('Gummies');
      if (g && g.renderOrder !== 2) g.renderOrder = 2;
    };
  }

  const inst = {
    root: m,
    frontMats,
    backMeshes,
    backMats,
    shells: []
  };
  trackedInstances.add(inst);
  m.userData._glassInstance = inst;
}

/**
 * Applies a realistic glass shell over the LiverDetox bottle model.
 * Samples the Bottle's silhouette at 48 heights and generates a thin LatheGeometry shell (+0.8%).
 * Added as a sibling of Bottle under the same parent with identical transform.
 *
 * @param {THREE.Object3D} m - The product model hierarchy
 */
export function applyBottleGlass(m) {
  if (!m) return;
  const bottle = m.getObjectByName('Bottle');
  const cap = m.getObjectByName('Cap');
  if (!bottle || !cap || !bottle.geometry) return;

  // Prevent duplicate shell
  if (bottle.parent && bottle.parent.getObjectByName('Bottle_Glass_Shell')) {
    return;
  }

  // Warm natural golden oak cap with organic wood finish
  if (cap.material) {
    cap.material = cap.material.clone();
    cap.material.color.set(0xffe6c8); // warm natural honey oak
    cap.material.metalness = 0.0;
    cap.material.metalnessMap = null;
    cap.material.roughness = 0.82;
    cap.material.envMapIntensity = 0.40;
    cap.material.needsUpdate = true;
  }

  // Compute silhouette profile from Bottle's local vertices
  bottle.geometry.computeBoundingBox();
  const bb = bottle.geometry.boundingBox;
  const pos = bottle.geometry.attributes.position;
  if (!bb || !pos) return;

  const N = 48;
  const radii = new Float32Array(N);
  const minY = bb.min.y;
  const maxY = bb.max.y;
  const spanY = Math.max(1e-4, maxY - minY);

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const bin = Math.min(N - 1, Math.max(0, Math.round(((y - minY) / spanY) * (N - 1))));
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    if (r > radii[bin]) radii[bin] = r;
  }

  // Smooth interpolation for any missing bins
  for (let i = 0; i < N; i++) {
    if (radii[i] === 0) {
      let prev = i - 1; while (prev >= 0 && radii[prev] === 0) prev--;
      let next = i + 1; while (next < N && radii[next] === 0) next++;
      const v0 = prev >= 0 ? radii[prev] : 0.3;
      const v1 = next < N ? radii[next] : v0;
      radii[i] = (v0 + v1) * 0.5;
    }
  }

  // Build lathe profile points with flared pedestal foot (matching design board artwork)
  const points = [];
  points.push(new THREE.Vector2(0, minY));
  for (let i = 0; i < N; i++) {
    const normH = i / (N - 1); // 0 at bottom, 1 at top
    const y = minY + (spanY * i) / (N - 1);
    let r = radii[i];

    // Flared pedestal foot styling near base (normH < 0.12):
    // Incurve waist around normH = 0.08, flare out to rounded pedestal foot at base
    if (normH < 0.03) {
      r *= 1.055;
    } else if (normH < 0.06) {
      r *= 1.042;
    } else if (normH < 0.10) {
      r *= 1.002;
    } else {
      r *= 1.008;
    }
    points.push(new THREE.Vector2(r, y));
  }

  const latheGeo = new THREE.LatheGeometry(points, 48);
  latheGeo.computeVertexNormals();

  const shellMat = makeGlassMaterial(null, {
    alpha: 0.02,
    color: 0xffffff,
    variant: 'liver_bottle_shell',
    isBottleShell: true,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -1.0
  });

  const shell = new THREE.Mesh(latheGeo, shellMat);
  shell.name = 'Bottle_Glass_Shell';
  shell.position.copy(bottle.position);
  shell.rotation.copy(bottle.rotation);
  shell.quaternion.copy(bottle.quaternion);
  shell.scale.copy(bottle.scale);
  shell.renderOrder = 3;
  shell.depthWrite = false;
  shell.frustumCulled = false;
  shell.raycast = () => {};
  shell.userData.isGlassShell = true;

  if (bottle.parent) {
    bottle.parent.add(shell);
  }

  // Track in instance for disposal and quality toggles
  let inst = m.userData && m.userData._glassInstance;
  if (!inst) {
    inst = {
      root: m,
      frontMats: [],
      backMeshes: [],
      backMats: [],
      shells: []
    };
    trackedInstances.add(inst);
    m.userData._glassInstance = inst;
  }
  if (!inst.shells) inst.shells = [];
  inst.shells.push(shell);
  inst.frontMats.push(shellMat);
}

/**
 * Disposes only what glass.js created. Never disposes shared geometry twice.
 * @param {THREE.Object3D} root
 */
export function disposeGlass(root) {
  if (!root) return;

  const inst = root.userData && root.userData._glassInstance;
  if (inst) {
    trackedInstances.delete(inst);
    inst.backMeshes.forEach(bm => {
      if (bm.parent) bm.parent.remove(bm);
      if (bm.material) {
        const mats = Array.isArray(bm.material) ? bm.material : [bm.material];
        mats.forEach(mat => mat.dispose());
      }
    });
    if (inst.shells) {
      inst.shells.forEach(shell => {
        if (shell.parent) shell.parent.remove(shell);
        if (shell.geometry) shell.geometry.dispose();
        if (shell.material) {
          const mats = Array.isArray(shell.material) ? shell.material : [shell.material];
          mats.forEach(mat => mat.dispose());
        }
      });
    }
    inst.frontMats.forEach(fm => fm.dispose());
    root.userData._glassInstance = null;
  }

  // Remove and dispose any leftover shells or back meshes
  const toRemove = [];
  root.traverse(n => {
    if (n.isMesh && (n.userData.isGlassBack || n.userData.isGlassShell || n.name === 'Bottle_Glass_Shell' || (n.name && n.name.endsWith('_Back')))) {
      toRemove.push(n);
    }
  });
  toRemove.forEach(n => {
    if (n.parent) n.parent.remove(n);
    if (n.userData.isGlassShell || n.name === 'Bottle_Glass_Shell') {
      if (n.geometry) n.geometry.dispose();
    }
    if (n.material) {
      const mats = Array.isArray(n.material) ? n.material : [n.material];
      mats.forEach(mat => mat.dispose());
    }
  });
}
