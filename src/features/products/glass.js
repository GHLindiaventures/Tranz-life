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

  mat.clearcoat = 1;
  mat.clearcoatRoughness = 0.03;
  mat.roughness = 0.04;
  mat.metalness = 0.0;
  mat.reflectivity = 1.0;
  mat.envMapIntensity = 1.4;

  const baseColor = opts.color !== undefined ? opts.color : 0x24382d;
  mat.color.copy(lin(baseColor));

  const baseAlpha = opts.alpha !== undefined ? opts.alpha : 0.16;
  mat.opacity = baseAlpha;

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

    shader.fragmentShader = safeReplace(
      shader.fragmentShader,
      '#include <dithering_fragment>',
      `// Glass Fresnel, Thickness Tint & Softbox Specular Highlights
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 3.0);
  float fBoost = clamp(uFresnelBoost, 0.0, 1.0);
  float baseFactor = smoothstep(-0.60, -0.95, vGlassPos.y);
  float rimFactor = smoothstep(0.18, 0.32, vGlassPos.y);
  float thickness = clamp(fresnel * 0.75 * fBoost + baseFactor * 0.45 + rimFactor * 0.25, 0.0, 1.0);
  gl_FragColor.a = clamp(mix(uGlassAlpha, 0.88, thickness), 0.0, 0.92);

  // Subtle botanical green thickness tint
  vec3 greenTint = vec3(0.08, 0.18, 0.12);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.70, 0.90, 0.75) + greenTint * 0.35, thickness * 0.35);

  // Extra environment reflection weighted by fresnel (softbox edge highlights)
  vec3 rimGleam = vec3(0.85, 0.98, 0.90);
  gl_FragColor.rgb += rimGleam * (pow(fresnel, 2.5) * 0.40 * fBoost);

  #include <dithering_fragment>`
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
  mat.clearcoatRoughness = 0.05;
  mat.roughness = 0.08;
  mat.metalness = 0.0;
  mat.envMapIntensity = 0.9;

  const backColor = opts.backColor !== undefined ? opts.backColor : 0x16241b;
  mat.color.copy(lin(backColor));

  const backAlpha = opts.alpha !== undefined ? opts.alpha : 0.12;
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
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 3.0);
  float fBoost = clamp(uFresnelBoost, 0.0, 1.0);
  float baseFactor = smoothstep(-0.60, -0.95, vGlassPos.y);
  float thickness = clamp(fresnel * 0.5 + baseFactor * 0.35, 0.0, 1.0);
  gl_FragColor.a = clamp(mix(uGlassAlpha, 0.70, thickness), 0.0, 0.80);

  vec3 backTint = vec3(0.05, 0.12, 0.08);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.60, 0.80, 0.65) + backTint * 0.4, thickness * 0.4);

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
      alpha: isJarGlass ? 0.16 : 0.22,
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
        alpha: isJarGlass ? 0.12 : 0.16,
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
    backMats
  };
  trackedInstances.add(inst);
  m.userData._glassInstance = inst;
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
    inst.frontMats.forEach(fm => fm.dispose());
    root.userData._glassInstance = null;
  }

  // Remove any leftover back meshes without disposing geometry
  const backs = [];
  root.traverse(n => {
    if (n.isMesh && (n.userData.isGlassBack || (n.name && n.name.endsWith('_Back')))) {
      backs.push(n);
    }
  });
  backs.forEach(bm => {
    if (bm.parent) bm.parent.remove(bm);
    if (bm.material) {
      const mats = Array.isArray(bm.material) ? bm.material : [bm.material];
      mats.forEach(mat => mat.dispose());
    }
  });
}
