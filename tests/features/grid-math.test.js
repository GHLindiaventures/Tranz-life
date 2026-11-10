import { describe, expect, it } from 'vitest';
import { entranceOrder, cardEntrance, highlightIndex, wordProgress, pinProgress } from '../../src/features/showcase/grid-math.js';

describe('grid helpers', () => {
  it('puts the showcase product first in the entrance order', () => {
    expect([0, 1, 2, 3, 4].map(i => entranceOrder(i, 3, 5))).toEqual([2, 3, 4, 0, 1]);
  });
  it('staggers card entrances and finishes the last card at u = 1', () => {
    expect(cardEntrance(0, 0)).toBe(0);
    expect(cardEntrance(0.3, 0)).toBeGreaterThan(cardEntrance(0.3, 4));
    expect(cardEntrance(1, 4)).toBe(1);
    expect(cardEntrance(1, 0)).toBe(1);
  });
  it('walks the highlight through all five cards starting at the first', () => {
    expect(highlightIndex(0, 5, 2)).toBe(2);
    expect(highlightIndex(1, 5, 2)).toBe(1);
    const seen = new Set(); for (let p = 0; p <= 1; p += 0.01) seen.add(highlightIndex(p, 5, 2));
    expect(seen.size).toBe(5);
  });
  it('highlight index never leaves 0..n-1', () => {
    for (let p = -0.5; p <= 1.5; p += 0.05) { const k = highlightIndex(p, 5, 4); expect(k).toBeGreaterThanOrEqual(0); expect(k).toBeLessThan(5); }
  });
  it('words rise in order and all finish by the end of the range', () => {
    expect(wordProgress(0, 0, 7)).toBe(0);
    expect(wordProgress(0.2, 0, 7)).toBeGreaterThan(wordProgress(0.2, 5, 7));
    expect(wordProgress(0.7, 6, 7)).toBe(1);
  });
  it('pin progress is 0 before the pin and 1 at its end', () => {
    expect(pinProgress(100, 3000, 800)).toBe(0);
    expect(pinProgress(-2200, 3000, 800)).toBe(1);
    expect(pinProgress(-1100, 3000, 800)).toBeCloseTo(0.5, 5);
  });
});
