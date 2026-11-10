import { describe, expect, it } from 'vitest';
import { calcStageProgress, calcShowcaseJarTransform } from '../../src/features/showcase/showcase-scene.js';

describe('showcase stage progress math', () => {
  it('correctly categorizes stage ranges', () => {
    expect(calcStageProgress(0).stage).toBe(1);
    expect(calcStageProgress(0.06).stage).toBe(1);
    expect(calcStageProgress(0.12).stage).toBe(2);
    expect(calcStageProgress(0.25).stage).toBe(2);
    expect(calcStageProgress(0.40).stage).toBe(3);
    expect(calcStageProgress(0.55).stage).toBe(3);
    expect(calcStageProgress(0.70).stage).toBe(4);
    expect(calcStageProgress(0.85).stage).toBe(4);
    expect(calcStageProgress(0.90).stage).toBe(5);
    expect(calcStageProgress(1.0).stage).toBe(5);
  });

  it('clamps progress strictly between 0 and 1', () => {
    expect(calcStageProgress(-0.5).p).toBe(0);
    expect(calcStageProgress(1.5).p).toBe(1);
  });

  it('normalizes local stage progress monotonically from 0 to 1', () => {
    const s1 = calcStageProgress(0.06);
    expect(s1.tArrival).toBeCloseTo(0.5, 2);

    const s2 = calcStageProgress(0.26);
    expect(s2.tSpin).toBeCloseTo(0.5, 2);

    const s3 = calcStageProgress(0.55);
    expect(s3.tDetail).toBeCloseTo(0.5, 2);

    const s4 = calcStageProgress(0.80);
    expect(s4.tExit).toBeCloseTo(0.5, 2);

    const s5 = calcStageProgress(0.95);
    expect(s5.tLanding).toBeCloseTo(0.5, 2);
  });
});

describe('showcase jar transform continuity', () => {
  const plinth = { x: 500, y: 400, h: 200, rotX: 0.04, rotY: -0.35, rotZ: -0.02 };
  const center = { x: 600, y: 450, h: 480 };
  const slot = { x: 800, y: 700, h: 220, restRotY: -0.38 };
  const mouse = { x: 0, y: 0 };

  it('starts exactly at plinth at p = 0', () => {
    const t = calcShowcaseJarTransform(0, plinth, center, slot, mouse, 0, false);
    expect(t.x).toBeCloseTo(plinth.x, 1);
    expect(t.y).toBeCloseTo(plinth.y, 1);
    expect(t.h).toBeCloseTo(plinth.h, 1);
    expect(t.rotY).toBeCloseTo(plinth.rotY, 2);
  });

  it('is at center during detail state p = 0.55', () => {
    const t = calcShowcaseJarTransform(0.55, plinth, center, slot, mouse, 0, false);
    expect(t.x).toBeCloseTo(center.x, 1);
    expect(t.y).toBeCloseTo(center.y, 1);
    expect(t.h).toBeGreaterThanOrEqual(center.h * 0.95);
  });

  it('lands at slot coordinates at p = 1', () => {
    const t = calcShowcaseJarTransform(1, plinth, center, slot, mouse, 0, false);
    expect(t.x).toBeCloseTo(slot.x, 1);
    expect(t.y).toBeCloseTo(slot.y, 1);
    expect(t.h).toBeCloseTo(slot.h, 1);
    expect(t.rotY).toBeCloseTo(slot.restRotY, 2);
  });
});


import { journeyProgress, ARRIVE, EXIT_AT } from '../../src/features/showcase/showcase-scene.js';

describe('journeyProgress (scroll -> scene progress)', () => {
  const g = { showcaseTop: 1000, pinEnd: 6000, vh: 1000 };
  it('is 0 before the pre-roll and ARRIVE when the pin starts', () => {
    expect(journeyProgress(0, g)).toBe(0);
    expect(journeyProgress(150, g)).toBe(0);
    expect(journeyProgress(1000, g)).toBeCloseTo(ARRIVE, 6);
  });
  it('reaches EXIT_AT when the curtain starts and 1 when it has covered the pin', () => {
    expect(journeyProgress(5000, g)).toBeCloseTo(EXIT_AT, 6);
    expect(journeyProgress(6000, g)).toBeCloseTo(1, 6);
    expect(journeyProgress(9000, g)).toBe(1);
  });
  it('is monotonic', () => {
    let last = -1;
    for (let y = 0; y <= 6500; y += 50) { const p = journeyProgress(y, g); expect(p).toBeGreaterThanOrEqual(last); last = p; }
  });
});

import { calcHoldTransform } from '../../src/features/showcase/showcase-scene.js';

describe('calcHoldTransform (the product holds still, the page falls past it)', () => {
  const start = { x: 700, y: 600, h: 200, rotX: 0.04, rotY: -0.35, rotZ: -0.012 };
  const view = { x: 720, y: 468, h: 500 };
  const at = p => calcHoldTransform(p, start, view, { x: 0, y: 0 }, 0, false);
  it('starts exactly on the plinth', () => {
    const t = at(0);
    expect(t.x).toBeCloseTo(start.x, 3); expect(t.y).toBeCloseTo(start.y, 3); expect(t.h).toBeCloseTo(start.h, 3); expect(t.rotY).toBeCloseTo(start.rotY, 3);
  });
  it('stays in exactly one place on screen for the rest of the scene', () => {
    for (let p = 0.12; p <= 1; p += 0.04) { const t = at(p); expect(t.x).toBeCloseTo(view.x, 3); expect(t.y).toBeCloseTo(view.y, 3); expect(t.h).toBeCloseTo(view.h, 3); }
  });
  it('keeps turning while it holds still', () => {
    expect(at(1).rotY - at(0.12).rotY).toBeGreaterThan(Math.PI * 4);
  });
});
