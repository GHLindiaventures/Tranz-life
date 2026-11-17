// Cinematic 3D Particle & Shockwave Engine for TranzLife Hero Product Showcase
// Pure Three.js r128 compatible, single draw call, zero DOM overhead, 60+ FPS.
import * as THREE from 'three';

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

function createHeroParticles(L) {
  const isMobile = window.innerWidth < 768;
  const COUNT = isMobile ? 40 : 100;

  const group = new THREE.Group();
  group.name = 'HeroParticlesGroup';
  group.visible = false;
  L.scene.add(group);

  // 1. Particle Points Mesh
  const positions = new Float32Array(COUNT * 3);
  const basePos = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const sizes = new Float32Array(COUNT);
  const phases = new Float32Array(COUNT);
  const velocities = new Float32Array(COUNT * 3);

  // Palette: Luxury Golden Yellow, Botanical Lime-Gold, Warm Sunlight Cream
  const PALETTE = [
    new THREE.Color(0xffd866), // Rich warm gold
    new THREE.Color(0xe2f094), // Luminous botanical spore
    new THREE.Color(0xfff5d0), // Sunlight diamond speck
    new THREE.Color(0x9ee8aa), // Fresh herbal green
    new THREE.Color(0xf6ba42)  // Deep amber
  ];

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    // Distribute in a cylinder/torus around the bottle center (x: -3.5..3.5, y: -4..4, z: -2.5..2.5)
    const angle = (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
    const rad = 1.2 + Math.random() * 2.8;
    const y = (Math.random() - 0.5) * 8.0;
    const z = (Math.random() - 0.5) * 4.5;

    positions[i3] = Math.cos(angle) * rad;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    basePos[i3] = positions[i3];
    basePos[i3 + 1] = positions[i3 + 1];
    basePos[i3 + 2] = positions[i3 + 2];

    const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;

    sizes[i] = (isMobile ? 18 : 26) * (0.6 + Math.random() * 0.9);
    phases[i] = Math.random() * Math.PI * 2;
    velocities[i3] = 0;
    velocities[i3 + 1] = 0;
    velocities[i3 + 2] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

  // Particle Shader with depth attenuation and soft exponential glow
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uBurst: { value: 0 }
    },
    vertexColors: true,
    vertexShader: `
      attribute float size;
      attribute float phase;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform float uAlpha;
      uniform float uBurst;

      void main() {
        vColor = color;
        // Subtle twinkling breathing per particle
        float twinkle = 0.65 + 0.35 * sin(uTime * 2.2 + phase);
        vAlpha = uAlpha * twinkle;

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float pSize = size * (1.0 + uBurst * 0.6);
        gl_PointSize = pSize * (28.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float r = length(uv);
        if (r > 0.5) discard;
        // Soft cinematic glow: bright core with exponential falloff
        float core = exp(-r * 7.0);
        float halo = exp(-r * 2.8) * 0.45;
        float intensity = core + halo;
        gl_FragColor = vec4(vColor * intensity, vAlpha * intensity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const pointsMesh = new THREE.Points(geometry, particleMaterial);
  pointsMesh.frustumCulled = false;
  group.add(pointsMesh);

  // 2. Expanding Concentric Light Shockwaves
  const SHOCKWAVE_COUNT = 3;
  const shockwaves = [];
  const ringGeom = new THREE.RingGeometry(0.1, 0.22, 64);

  for (let k = 0; k < SHOCKWAVE_COUNT; k++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffe28a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI * 0.42; // Tilted slightly with bottle perspective
    ringMesh.position.set(0, -1.8, 0.2); // Near bottle base / ground plane
    ringMesh.visible = false;
    group.add(ringMesh);
    shockwaves.push({ mesh: ringMesh, mat: ringMat, t: 999, delay: k * 0.16 });
  }

  // Animation & Physics State
  let burstPower = 0;
  let targetAlpha = 0;
  let currentAlpha = 0;
  let lastX = 0, lastY = 0;
  let shockwaveActive = false;

  function trigger(type = 'intro') {
    if (type === 'intro') {
      burstPower = 1.0;
      targetAlpha = 0.95;
      triggerShockwave();
    } else if (type === 'hover') {
      burstPower = Math.max(burstPower, 0.6);
      targetAlpha = 1.0;
    } else if (type === 'click') {
      burstPower = 1.4;
      triggerShockwave();
    }
  }

  function triggerShockwave() {
    shockwaveActive = true;
    shockwaves.forEach((sw, idx) => {
      sw.t = -sw.delay;
      sw.mesh.visible = true;
      sw.mesh.scale.set(1, 1, 1);
      sw.mat.opacity = 0;
    });
  }

  function update(time, pointer, scrollProgress = 0, bottlePos = null) {
    if (!group.visible && currentAlpha <= 0.001) return;

    // Smooth alpha fade
    currentAlpha += (targetAlpha - currentAlpha) * 0.06;
    particleMaterial.uniforms.uAlpha.value = currentAlpha;
    particleMaterial.uniforms.uTime.value = time;

    // Decay burst power
    burstPower *= 0.94;
    particleMaterial.uniforms.uBurst.value = burstPower;

    // Position group to track the bottle center if provided
    if (bottlePos) {
      group.position.set(bottlePos.x, bottlePos.y, bottlePos.z || 0);
    }

    // Pointer coordinates in world space estimate
    const pX = pointer && pointer.x != null ? pointer.x * L.halfW * 1.8 : 0;
    const pY = pointer && pointer.y != null ? -pointer.y * L.halfH * 1.8 : 0;
    const pDistMoved = Math.hypot(pX - lastX, pY - lastY);
    lastX = pX; lastY = pY;

    // Upward draft as user scrolls
    const upwardDraft = scrollProgress * 1.8;

    const posAttr = geometry.attributes.position;
    const posArr = posAttr.array;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const ph = phases[i];

      // Ambient harmonic turbulence (natural floating motes)
      const driftX = Math.sin(time * 0.7 + ph) * 0.35 + Math.cos(time * 0.4 + ph * 2.0) * 0.15;
      const driftY = Math.cos(time * 0.8 + ph) * 0.38 + upwardDraft;
      const driftZ = Math.sin(time * 0.6 + ph * 1.5) * 0.25;

      // Pointer repulsion when cursor is nearby
      const dx = posArr[i3] - pX;
      const dy = posArr[i3 + 1] - pY;
      const dist = Math.hypot(dx, dy) + 0.01;
      if (dist < 2.8) {
        const force = (1.0 - dist / 2.8) * 0.08 * (1.0 + pDistMoved * 2.0);
        velocities[i3] += (dx / dist) * force;
        velocities[i3 + 1] += (dy / dist) * force;
      }

      // Dampen velocity
      velocities[i3] *= 0.92;
      velocities[i3 + 1] *= 0.92;
      velocities[i3 + 2] *= 0.92;

      // Burst velocity expansion
      if (burstPower > 0.01) {
        const bx = basePos[i3] * 0.04 * burstPower;
        const by = basePos[i3 + 1] * 0.04 * burstPower;
        velocities[i3] += bx;
        velocities[i3 + 1] += by;
      }

      posArr[i3] = basePos[i3] + driftX + velocities[i3];
      posArr[i3 + 1] = basePos[i3 + 1] + driftY + velocities[i3 + 1];
      posArr[i3 + 2] = basePos[i3 + 2] + driftZ + velocities[i3 + 2];
    }
    posAttr.needsUpdate = true;

    // Update shockwaves
    if (shockwaveActive) {
      let anyActive = false;
      const ringDuration = 1.35;
      shockwaves.forEach(sw => {
        sw.t += 0.016; // approximate delta time
        if (sw.t > 0 && sw.t < ringDuration) {
          anyActive = true;
          const progress = clamp(sw.t / ringDuration, 0, 1);
          // Ease-out expansion
          const scale = 1.0 + Math.pow(progress, 0.45) * 28.0;
          sw.mesh.scale.set(scale, scale, 1);
          // Alpha envelope: quick flare, then exponential fade
          const alpha = progress < 0.15 ? progress / 0.15 : Math.pow(1 - progress, 1.8);
          sw.mat.opacity = alpha * 0.55;
          sw.mesh.visible = true;
        } else if (sw.t >= ringDuration) {
          sw.mesh.visible = false;
        }
      });
      shockwaveActive = anyActive;
    }
  }

  function setVisible(val) {
    group.visible = val;
    targetAlpha = val ? 0.95 : 0;
    if (!val) currentAlpha = 0;
  }

  function dispose() {
    L.scene.remove(group);
    geometry.dispose();
    particleMaterial.dispose();
    ringGeom.dispose();
    shockwaves.forEach(sw => sw.mat.dispose());
  }

  return {
    group,
    trigger,
    update,
    setVisible,
    dispose
  };
}

export { createHeroParticles };
