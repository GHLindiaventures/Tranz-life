import { describe, expect, it } from 'vitest';
import * as THREE from 'three';

// Mock XMLHttpRequest in Node test environment for Three.js FileLoader
if (typeof globalThis.XMLHttpRequest === 'undefined') {
  globalThis.XMLHttpRequest = class {
    open() {}
    send() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

import { createPacketModel } from '../../src/features/products/gummy-packet.js';

describe('Gummy Packet Model & Tear Animation', () => {
  it('instantiates createPacketModel with correct structure and methods', () => {
    const model = createPacketModel();
    expect(model.root).toBeInstanceOf(THREE.Group);
    expect(typeof model.updateOpen).toBe('function');
    expect(typeof model.root.userData.updateOpen).toBe('function');
    expect(typeof model.root.userData.getGummyWorldPos).toBe('function');
    expect(typeof model.root.userData.getGummy).toBe('function');
    expect(typeof model.root.userData.getOpen).toBe('function');
    expect(typeof model.root.userData.isReady).toBe('function');
  });

  it('safely handles updateOpen before and after loading', () => {
    const model = createPacketModel();
    // Before async GLTF loads, state.ready is false: updateOpen should not throw
    expect(() => model.updateOpen(0.5)).not.toThrow();
    expect(() => model.updateOpen(1.0)).not.toThrow();
    expect(() => model.updateOpen(0.0)).not.toThrow();
  });

  it('correctly returns world position fallback when gummy is not yet ready', () => {
    const model = createPacketModel();
    model.root.position.set(10, 20, 5);
    model.root.scale.set(2, 2, 2);
    model.root.updateMatrixWorld(true);

    const out = new THREE.Vector3();
    model.root.userData.getGummyWorldPos(out);
    expect(out.x).toBeCloseTo(10 + 1.16 * 2);
    expect(out.y).toBeCloseTo(20);
    expect(out.z).toBeCloseTo(5);
  });
});

describe('Animation Timeline & Choreography Math', () => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sm = t => t * t * (3 - 2 * t);

  function calcTimeline(u, v = 0) {
    // 1. Bottle cap unscrew & pour (starts at u = 0.14 after intro side letters exit)
    const open = v > 0 ? 1 - clamp(v / 0.88, 0, 1) : clamp((u - 0.14) / 0.24, 0, 1);

    // 2. Hero packet zoom (starts at u = 0.38 after pour is complete)
    let zoomK = 0;
    if (v <= 0) {
      const zIn = sm(clamp((u - 0.38) / 0.14, 0, 1));
      const zOut = sm(clamp((u - 0.94) / 0.04, 0, 1));
      zoomK = zIn * (1 - zOut);
    }

    // 3. Hero packet tear & gummy emergence (starts at u = 0.52 after zoom is locked)
    let tearK = 0;
    if (v <= 0) {
      const tIn = sm(clamp((u - 0.52) / 0.14, 0, 1));
      const tOut = sm(clamp((u - 0.88) / 0.06, 0, 1));
      tearK = tIn * (1 - tOut);
    }

    // 4. Ingredients callout (pointing to the emerged gummy)
    const calloutA = v > 0 ? 0 : clamp((u - 0.64) / 0.03, 0, 1) * (1 - clamp((u - 0.88) / 0.03, 0, 1));
    const calloutC = clamp((u - 0.66) / 0.22, 0, 1);

    return { open, zoomK, tearK, calloutA, calloutC };
  }

  it('Phase 1 (u = 0.00..0.38): Letters exit (0.00-0.14), cap unscrews slowly and packets pour out (0.14-0.38)', () => {
    const tStart = calcTimeline(0.0);
    expect(tStart.open).toBe(0);
    expect(tStart.zoomK).toBe(0);
    expect(tStart.tearK).toBe(0);
    expect(tStart.calloutA).toBe(0);

    const tLettersExit = calcTimeline(0.14);
    expect(tLettersExit.open).toBe(0); // Cap still closed while letters leave
    expect(tLettersExit.zoomK).toBe(0);

    const tPoured = calcTimeline(0.38);
    expect(tPoured.open).toBe(1);
    expect(tPoured.zoomK).toBe(0);
    expect(tPoured.tearK).toBe(0);
  });

  it('Phase 2 (u = 0.38..0.52): Hero packet zooms forward to center stage', () => {
    const tMidZoom = calcTimeline(0.45);
    expect(tMidZoom.open).toBe(1);
    expect(tMidZoom.zoomK).toBeGreaterThan(0.4);
    expect(tMidZoom.zoomK).toBeLessThan(0.6);
    expect(tMidZoom.tearK).toBe(0); // Flap is still sealed while zooming

    const tZoomed = calcTimeline(0.52);
    expect(tZoomed.zoomK).toBe(1);
    expect(tZoomed.tearK).toBe(0);
  });

  it('Phase 3 (u = 0.52..0.66): Packet tears open, flap curls, gummy emerges completely', () => {
    const tMidTear = calcTimeline(0.59);
    expect(tMidTear.zoomK).toBe(1);
    expect(tMidTear.tearK).toBeGreaterThan(0.4);
    expect(tMidTear.tearK).toBeLessThan(0.6);

    const tTorn = calcTimeline(0.66);
    expect(tTorn.zoomK).toBe(1);
    expect(tTorn.tearK).toBe(1); // Gummy is fully emerged
  });

  it('Phase 4 (u = 0.66..0.88): Ingredients are called out pointing to the emerged gummy', () => {
    const tStartCallouts = calcTimeline(0.68);
    expect(tStartCallouts.zoomK).toBe(1);
    expect(tStartCallouts.tearK).toBe(1);
    expect(tStartCallouts.calloutA).toBe(1);
    expect(tStartCallouts.calloutC).toBeCloseTo(0.09, 1);

    const tMidCallouts = calcTimeline(0.77);
    expect(tMidCallouts.calloutA).toBe(1);
    expect(tMidCallouts.calloutC).toBeCloseTo(0.5, 1);

    const tEndCallouts = calcTimeline(0.88);
    expect(tEndCallouts.calloutA).toBe(1);
    expect(tEndCallouts.calloutC).toBeCloseTo(1, 4);
  });

  it('Phase 5 (u = 0.88..0.98): Gummy retracts, packet re-seals, packet zooms back into cloud', () => {
    const tCalloutsFading = calcTimeline(0.91);
    expect(tCalloutsFading.calloutA).toBeLessThan(0.1);
    expect(tCalloutsFading.tearK).toBeLessThan(0.5); // Gummy retracting
    expect(tCalloutsFading.zoomK).toBe(1); // Packet still at front while closing

    const tPacketReturning = calcTimeline(0.96);
    expect(tPacketReturning.tearK).toBe(0); // Packet sealed
    expect(tPacketReturning.zoomK).toBeLessThan(0.5); // Zooming back to cloud

    const tBackInCloud = calcTimeline(1.0);
    expect(tBackInCloud.zoomK).toBe(0); // Back in cloud with other packets
    expect(tBackInCloud.open).toBe(1); // Packets still in cloud before v closing
  });

  it('Phase 6 (v = 0.00..1.00): All packets go back inside bottle, cap screws back on', () => {
    const tCloseStart = calcTimeline(1.0, 0.0);
    expect(tCloseStart.open).toBe(1);
    expect(tCloseStart.zoomK).toBe(0);

    const tMidClose = calcTimeline(1.0, 0.44);
    expect(tMidClose.open).toBeCloseTo(0.5, 1); // Packets funnelling into mouth

    const tFullyClosed = calcTimeline(1.0, 0.90);
    expect(tFullyClosed.open).toBe(0); // Closed, cap on, details continue
  });

  it('3D Camera Zoom & Dolly trajectory', () => {
    // Test the camera interpolation math
    const camPos0 = new THREE.Vector3(0, 0, 24);
    const camLook0 = new THREE.Vector3(0, 0, 0);
    const heroPos = new THREE.Vector3(-0.45, 1.05, 0.35);
    const lookZoom = new THREE.Vector3(heroPos.x + 0.58, heroPos.y, heroPos.z);
    const posZoom = new THREE.Vector3(lookZoom.x, lookZoom.y, heroPos.z + 5.2);

    const lerp = (a, b, t) => a + (b - a) * t;

    function getCamState(u) {
      const { zoomK } = calcTimeline(u);
      const kEase = sm(zoomK);
      const pos = new THREE.Vector3().lerpVectors(camPos0, posZoom, kEase);
      const look = new THREE.Vector3().lerpVectors(camLook0, lookZoom, kEase);
      const fov = lerp(30, 23, kEase);
      return { zoomK, kEase, pos, look, fov };
    }

    // At u = 0.35: wide shot before hero zoom
    const cWide = getCamState(0.35);
    expect(cWide.zoomK).toBe(0);
    expect(cWide.pos.z).toBeCloseTo(24, 1);
    expect(cWide.fov).toBeCloseTo(30, 1);

    // At u = 0.45: camera dollies halfway in
    const cMid = getCamState(0.45);
    expect(cMid.pos.z).toBeLessThan(20);
    expect(cMid.pos.z).toBeGreaterThan(10);
    expect(cMid.fov).toBeLessThan(30);

    // At u = 0.52: camera fully dollied in to close-up
    const cZoomed = getCamState(0.52);
    expect(cZoomed.zoomK).toBe(1);
    expect(cZoomed.pos.z).toBeCloseTo(heroPos.z + 5.2, 1);
    expect(cZoomed.fov).toBeCloseTo(23, 1);

    // At u = 0.70: camera remains locked in close-up during ingredients callouts
    const cIngredients = getCamState(0.70);
    expect(cIngredients.zoomK).toBe(1);
    expect(cIngredients.pos.z).toBeCloseTo(heroPos.z + 5.2, 1);

    // At u = 1.0: camera has returned to wide overview
    const cReturn = getCamState(1.0);
    expect(cReturn.zoomK).toBe(0);
    expect(cReturn.pos.z).toBeCloseTo(24, 1);
    expect(cReturn.fov).toBeCloseTo(30, 1);
  });
});
