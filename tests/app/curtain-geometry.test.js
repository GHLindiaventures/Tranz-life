import { describe, it, expect } from 'vitest';
import { leafEdgePath, leafVeinPath, curtainCovers, leafTip, VB_W } from '../../src/app/curtain-geometry.js';

describe('leafEdgePath', () => {
  it('draws one pair of curves per leaf and closes the shape', () => {
    const d = leafEdgePath(6);
    expect(d.match(/Q/g)).toHaveLength(12);
    expect(d.startsWith('M0,100')).toBe(true);
    expect(d.endsWith(`L${VB_W},100 Z`)).toBe(true);
  });
  it('is the same on every call (no randomness)', () => {
    expect(leafEdgePath(12)).toBe(leafEdgePath(12));
  });
  it('clamps silly counts to at least one leaf', () => {
    expect(leafEdgePath(0).match(/Q/g)).toHaveLength(2);
  });
  it('keeps every leaf tip inside the edge box', () => {
    for (let i = 0; i < 40; i++){ expect(leafTip(i)).toBeGreaterThanOrEqual(6); expect(leafTip(i)).toBeLessThanOrEqual(30); }
  });
});

describe('leafVeinPath', () => {
  it('draws one vein per leaf', () => {
    expect(leafVeinPath(5).match(/M/g)).toHaveLength(5);
  });
});

describe('curtainCovers', () => {
  // edge 80, viewport 800: block is 960 tall
  it('covers the whole viewport at the midpoint (top = -edge)', () => {
    expect(curtainCovers(-80, 80, 800, 0)).toBe(true);
    expect(curtainCovers(-80, 80, 800, 400)).toBe(true);
    expect(curtainCovers(-80, 80, 800, 799)).toBe(true);
  });
  it('does not cover points the curtain has not reached yet', () => {
    expect(curtainCovers(500, 80, 800, 100)).toBe(false);
  });
  it('does not cover points the curtain has already passed', () => {
    expect(curtainCovers(-900, 80, 800, 100)).toBe(false);
  });
});
