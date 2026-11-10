import { describe, it, expect } from 'vitest';
import { badgeState, pad3, badgeSpot, smoothstep } from '../../src/app/scroll-math.js';

describe('badgeState', () => {
  it('is hidden below its spot before the product arrives', () => {
    const s = badgeState(0, 0);
    expect(s.o).toBe(0);
    expect(s.y).toBeGreaterThan(60);
  });
  it('rests near its spot, fully visible, mid-glide', () => {
    const s = badgeState(.5, 1);
    expect(s.o).toBe(1);
    expect(Math.abs(s.y)).toBeLessThan(2);
    expect(s.s).toBeCloseTo(1);
  });
  it('has lifted away and faded when the product leaves', () => {
    const s = badgeState(1, 2);
    expect(s.o).toBe(0);
    expect(s.y).toBeLessThan(-40);
  });
  it('later badges arrive later', () => {
    expect(badgeState(.15, 2).o).toBeLessThan(badgeState(.15, 0).o);
  });
});

describe('pad3', () => {
  it('pads to three digits and clamps to 0..100', () => {
    expect(pad3(7)).toBe('007');
    expect(pad3(42.6)).toBe('043');
    expect(pad3(100)).toBe('100');
    expect(pad3(140)).toBe('100');
    expect(pad3(-3)).toBe('000');
  });
});

describe('badgeSpot', () => {
  it('keeps even products and mirrors odd ones', () => {
    expect(badgeSpot([80, 20], 0)).toEqual({ x: 80, y: 20 });
    expect(badgeSpot([80, 20], 1)).toEqual({ x: 20, y: 20 });
  });
});

describe('smoothstep', () => {
  it('clamps outside the range', () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 2)).toBe(1);
    expect(smoothstep(0, 1, .5)).toBeCloseTo(.5);
  });
});
