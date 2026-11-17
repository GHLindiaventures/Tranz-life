// Particles and shockwaves removed per user request
import * as THREE from 'three';

export function createHeroParticles() {
  const group = new THREE.Group();
  group.name = 'HeroParticlesGroup';
  group.visible = false;
  return {
    group,
    trigger() {},
    update() {},
    dispose() {}
  };
}
