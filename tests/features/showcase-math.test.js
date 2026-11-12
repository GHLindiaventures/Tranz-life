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


import { calcHeroFadeStages, journeyProgress, ARRIVE, EXIT_AT } from '../../src/features/showcase/showcase-scene.js';

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
  it('faces front when the display starts and when it ends (whole turns in between)', () => {
    const v = { ...view, rotY: -0.38 }, f = p => calcHoldTransform(p, start, v, { x: 0, y: 0 }, 0, false).rotY;
    expect(f(0.12)).toBeCloseTo(-0.38, 5);
    const end = f(1) - -0.38;
    expect(Math.abs(end - Math.round(end / (2 * Math.PI)) * 2 * Math.PI)).toBeLessThan(1e-6);
  });
});

describe('showcase details timing math', () => {
  it('normalizes progress counter from ARRIVE to 1.0', () => {
    const progOf = p => Math.min(1, Math.max(0, (p - ARRIVE) / (1 - ARRIVE)));
    expect(progOf(0)).toBe(0);
    expect(progOf(0.06)).toBe(0);
    expect(progOf(ARRIVE)).toBe(0);
    expect(progOf(1.0)).toBe(1);
    expect(progOf(0.56)).toBeCloseTo(0.5, 2);
  });
});

describe('calcHeroFadeStages (Oryzo-style hero sinking exit)', () => {
  it('f = 0: home page fully visible, no dim, not flat, not done', () => {
    const res = calcHeroFadeStages(0);
    expect(res.textO).toBe(1);
    expect(res.dimO).toBe(0);
    expect(res.isFlat).toBe(false);
    expect(res.isDone).toBe(false);
  });

  it('f = 0.20: small texts fading out, no dim yet', () => {
    const res = calcHeroFadeStages(0.20);
    expect(res.textO).toBeCloseTo(1 - 0.20 / 0.30, 3);
    expect(res.dimO).toBe(0);
    expect(res.isFlat).toBe(false);
    expect(res.isDone).toBe(false);
  });

  it('f = 0.30: small texts fully faded, dim overlay just beginning', () => {
    const res = calcHeroFadeStages(0.30);
    expect(res.textO).toBe(0);
    expect(res.dimO).toBe(0);
    expect(res.isFlat).toBe(false);
    expect(res.isDone).toBe(false);
  });

  it('f = 0.55: home page half sunk into flat mint (dim = 0.5)', () => {
    const res = calcHeroFadeStages(0.55);
    expect(res.textO).toBe(0);
    expect(res.dimO).toBeCloseTo(0.50, 3);
    expect(res.isFlat).toBe(false);
    expect(res.isDone).toBe(false);
  });

  it('f = 0.80: dim overlay fully opaque (flat mint reached)', () => {
    const res = calcHeroFadeStages(0.80);
    expect(res.textO).toBe(0);
    expect(res.dimO).toBe(1.0);
    expect(res.isFlat).toBe(true);
    expect(res.isDone).toBe(false);
  });

  it('f = 0.90: flat mint overlay holds opaque, zoom continuing', () => {
    const res = calcHeroFadeStages(0.90);
    expect(res.textO).toBe(0);
    expect(res.dimO).toBe(1.0);
    expect(res.isFlat).toBe(true);
    expect(res.isDone).toBe(false);
  });

  it('f = 1.0: zoom complete, hero exit done (ready for details on further scroll)', () => {
    const res = calcHeroFadeStages(1.0);
    expect(res.textO).toBe(0);
    expect(res.dimO).toBe(1.0);
    expect(res.isFlat).toBe(true);
    expect(res.isDone).toBe(true);
  });

  it('clamps values below 0 and above 1', () => {
    const below = calcHeroFadeStages(-0.5);
    expect(below.textO).toBe(1);
    expect(below.dimO).toBe(0);
    expect(below.isDone).toBe(false);

    const above = calcHeroFadeStages(1.5);
    expect(above.textO).toBe(0);
    expect(above.dimO).toBe(1.0);
    expect(above.isFlat).toBe(true);
    expect(above.isDone).toBe(true);
  });
});

import { calcIntroText } from '../../src/features/showcase/showcase-scene.js';

describe('calcIntroText (the two intro texts beside the product)', () => {
  const F = 900, vh = 900;
  it('is hidden until the hero has sunk into flat mint (85% of the hero fade)', () => {
    expect(calcIntroText(0, F, vh).o).toBe(0);
    expect(calcIntroText(F - 0.15 * vh, F, vh).o).toBe(0);
    expect(calcIntroText(F, F, vh).o).toBeGreaterThan(0.8);
  });
  it('is fully shown and still during the hold', () => {
    const a = calcIntroText(F + 0.15 * vh, F, vh), b = calcIntroText(F + 1.05 * vh, F, vh);
    expect(a.o).toBeCloseTo(1, 5); expect(a.lift).toBe(0);
    expect(b.o).toBeCloseTo(1, 5); expect(b.lift).toBe(0);
  });
  it('then scrolls up 1:1 with the page, without fading', () => {
    const t = calcIntroText(F + 1.55 * vh, F, vh);
    expect(t.lift).toBeCloseTo(0.5 * vh, 5);
    expect(t.o).toBeCloseTo(1, 5);
    expect(calcIntroText(F + 3 * vh, F, vh).o).toBe(0);   // gone once well above the screen
  });
  it('lights the letters only while fading in', () => {
    expect(calcIntroText(F, F, vh).tin).toBeCloseTo(0.5, 5);
    expect(calcIntroText(F + 0.6 * vh, F, vh).tin).toBe(1);
  });
});

import { calcHlCallout, FLOW_END } from '../../src/features/showcase/showcase-scene.js';

describe('calcHlCallout (the highlights moment at the end of the details)', () => {
  const vh = 900, H = 8.1 * vh, fb = H - 2.9 * vh;      // the last block ends 2.9 screens before the end
  it('fades in, in place, as soon as the last block is near the top of the screen', () => {
    expect(calcHlCallout(fb - 0.3 * vh, H, vh, fb).o).toBe(0);
    const mid = calcHlCallout(fb - 0.25 * vh + 0.17 * vh, H, vh, fb);
    expect(mid.o).toBe(1); expect(mid.y).toBe(0); expect(mid.draw).toBeGreaterThan(0.3); expect(mid.draw).toBeLessThan(0.7);
    const hold = calcHlCallout(fb + 0.3 * vh, H, vh, fb);
    expect(hold.draw).toBe(1); expect(hold.lines).toBe(1); expect(hold.ex).toBe(0);
  });
  it('leaves (word by word, in CSS) just before the curtain, and is gone soon after it starts', () => {
    expect(calcHlCallout(H - 2.15 * vh, H, vh, fb).ex).toBe(0);
    const out = calcHlCallout(H - 1.97 * vh, H, vh, fb); expect(out.ex).toBeGreaterThan(0); expect(out.ex).toBeLessThan(1);
    expect(calcHlCallout(H - 1.8 * vh, H, vh, fb).o).toBe(0);
  });
  it('still comes in before the curtain when the details run long', () => {
    expect(calcHlCallout(H - 2.25 * vh, H, vh, H - 1.9 * vh).draw).toBe(1);
  });
});

import { calcProductFrame, calcFrameDraw, frameHalfPaths, leafOpen, EXIT_AT as EXIT_AT2 } from '../../src/features/showcase/showcase-scene.js';

describe('product outline frame', () => {
  it('is centred on the product and larger than it on every side', () => {
    const f = calcProductFrame(720, 468, 500, 0.5);
    expect(f.x + f.w / 2).toBeCloseTo(720, 5); expect(f.y + f.h / 2).toBeCloseTo(468, 5);
    expect(f.w).toBeGreaterThan(250); expect(f.h).toBeGreaterThan(500);
    expect(f.r).toBeLessThanOrEqual(f.w / 2);
  });
  it('follows the product shape: narrow products get a narrow frame', () => {
    expect(calcProductFrame(0, 0, 500, 0.25).w).toBeLessThan(calcProductFrame(0, 0, 500, 0.55).w);
  });
  it('grows from 005 to 013, stays to 017, and is gone at 020', () => {
    const P = c => ARRIVE + c * (1 - ARRIVE);              // P for a counter value 0..1
    expect(calcFrameDraw(P(0.04))).toBe(0);
    expect(calcFrameDraw(P(0.05))).toBeCloseTo(0, 6);
    expect(calcFrameDraw(P(0.09))).toBeCloseTo(0.5, 5);
    expect(calcFrameDraw(P(0.13))).toBeCloseTo(1, 6);
    expect(calcFrameDraw(P(0.17))).toBeCloseTo(1, 6);
    expect(calcFrameDraw(P(0.185))).toBeCloseTo(0.5, 5);
    expect(calcFrameDraw(P(0.2))).toBeCloseTo(0, 6);
    expect(calcFrameDraw(P(0.21))).toBe(0);
    expect(calcFrameDraw(P(0.4))).toBe(0);
    expect(calcFrameDraw(EXIT_AT2 + 0.12)).toBe(0);
  });
  it('splits into two tendrils that start at the bottom centre and meet at the top centre', () => {
    const [l, r] = frameHalfPaths({ x: 100, y: 50, w: 200, h: 400, r: 60 });
    expect(l.startsWith('M 200.0 450.0')).toBe(true); expect(r.startsWith('M 200.0 450.0')).toBe(true);
    expect(l.endsWith('H 200.0')).toBe(true); expect(r.endsWith('H 200.0')).toBe(true);
  });
  it('opens each leaf after the growth has passed it, with a small overshoot', () => {
    expect(leafOpen(0.3, 0.4)).toBe(0);
    expect(leafOpen(0.5, 0.4)).toBeCloseTo(1, 5);
    let peak = 0; for (let u = 0.4; u <= 0.5; u += 0.002) peak = Math.max(peak, leafOpen(u, 0.4));
    expect(peak).toBeGreaterThan(1);
  });
});

import { calcPinBadge, calcHlCallout as hlc2, FLOW_END as FE } from '../../src/features/showcase/showcase-scene.js';

describe('details extras', () => {
  it('each ingredient badge rises in, rests, then floats away, one after another', () => {
    expect(calcPinBadge(0, 0).o).toBe(0);
    expect(calcPinBadge(0.2, 0).o).toBe(1);
    expect(calcPinBadge(0.2, 1).o).toBeLessThan(0.5);        // the second one is still on its way
    expect(calcPinBadge(1, 0).o).toBe(0); expect(calcPinBadge(1, 2).o).toBe(0);   // all gone by the end of the details
  });
  it('the highlights are gone soon after the curtain starts', () => {
    const vh = 900, H = 8.1 * vh;
    expect(hlc2(H - 2.2 * vh, H, vh, H - 2.9 * vh).o).toBe(1);
    expect(hlc2(H - 1.75 * vh, H, vh, H - 2.9 * vh).o).toBe(0);
  });
});

import { chapterAt, chapterCardAlpha } from '../../src/features/showcase/showcase-scene.js';

describe('details shown set by set in place', () => {
  it('walks through the sets in order between the start and the end', () => {
    expect(chapterAt(50, 100, 500, 4).idx).toBe(-1);
    expect(chapterAt(100, 100, 500, 4)).toEqual({ idx: 0, u: 0 });
    expect(chapterAt(350, 100, 500, 4).idx).toBe(2); expect(chapterAt(350, 100, 500, 4).u).toBeCloseTo(0.5, 5);
    expect(chapterAt(500, 100, 500, 4).idx).toBe(-1);
  });
  it('fades the cards in one after another, holds, and fades them all out before the next set', () => {
    expect(chapterCardAlpha(0.02, 0, 3)).toBe(0);
    expect(chapterCardAlpha(0.25, 0, 3)).toBe(1); expect(chapterCardAlpha(0.25, 2, 3)).toBe(0);   // the last is still to come
    expect(chapterCardAlpha(0.7, 2, 3)).toBe(1);
    expect(chapterCardAlpha(0.97, 0, 3)).toBe(0); expect(chapterCardAlpha(0.97, 2, 3)).toBe(0);
  });
});

import { planBeats, walkAt } from '../../src/features/showcase/showcase-scene.js';

describe('fall and stop (planBeats / walkAt)', () => {
  const V = 900, r0 = 1845, A = 4455, b = planBeats([1300, 1100, 1100, 900], V, r0, A);   // 4 stretches, 3 stops between them
  it('fits the stretches and the stops exactly into the available scroll', () => {
    expect(b.hlFrom).toBeCloseTo(r0 + A, 3);
    expect(b.stretches.length).toBe(4); expect(b.holds.length).toBe(3);
    expect(b.Lh).toBeGreaterThanOrEqual(0.4 * V); expect(b.Lh).toBeLessThanOrEqual(0.9 * V);   // short stops, so scrolling never feels stuck
    expect(b.a).toBeGreaterThanOrEqual(0.45);
  });
  it('falls while scrolling in a stretch, and stands still during a stop', () => {
    expect(walkAt(r0 - 50, b).e).toBe(0);
    const s0 = b.stretches[0], h0 = b.holds[0];
    const mid = walkAt((s0.start + s0.end) / 2, b); expect(mid.hold).toBe(-1); expect(mid.e).toBeCloseTo(650, 3);
    const a1 = walkAt(h0.start + 10, b), a2 = walkAt(h0.end - 10, b);
    expect(a1.hold).toBe(0); expect(a1.e).toBeCloseTo(a2.e, 6); expect(a1.e).toBeCloseTo(s0.Lf, 6);   // frozen
    expect(a1.u).toBeLessThan(0.1); expect(a2.u).toBeGreaterThan(0.9);
  });
  it('resumes falling from where it stopped, and ends after the last stretch (no stop after it)', () => {
    const s1 = b.stretches[1]; expect(walkAt(s1.start + 1, b).e - s1.E).toBeCloseTo(1 / b.a, 6);
    const last = b.stretches[3]; expect(walkAt(last.end - 1, b).hold).toBe(-1);
    expect(walkAt(b.hlFrom + 100, b)).toEqual({ e: b.Etot, hold: -1, u: 0 });
  });
  it('a short section makes the falling faster, never negative', () => {
    const t = planBeats([2000, 2000, 800], V, r0, 3000); expect(t.a).toBeGreaterThanOrEqual(0.45); expect(t.a).toBeLessThan(1);
  });
});
