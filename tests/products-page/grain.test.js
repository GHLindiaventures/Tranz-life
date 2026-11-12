import { describe, expect, it } from 'vitest';
import { grainPixels } from '../../src/products-page/grain.js';

describe('grainPixels (the matte-finish tile)', () => {
  const size = 128, px = grainPixels(size, 24);
  const alphas = []; for (let i = 3; i < px.length; i += 4) alphas.push(px[i]);
  const mean = alphas.reduce((a, b) => a + b, 0) / alphas.length;
  const sd = Math.sqrt(alphas.reduce((a, b) => a + (b - mean) ** 2, 0) / alphas.length);

  it('is white specks: every pixel is pure white', () => {
    for (let i = 0; i < px.length; i += 4) { expect(px[i]).toBe(255); expect(px[i + 1]).toBe(255); expect(px[i + 2]).toBe(255); }
  });
  it('has about 40% average transparency with a clear spread', () => {
    expect(mean).toBeGreaterThan(95); expect(mean).toBeLessThan(109);
    expect(sd).toBeGreaterThan(36); expect(sd).toBeLessThan(48);
  });
  it('is one-pixel grain: neighbouring pixels are unrelated', () => {
    let num = 0, den = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size - 1; x++) {
      const a = alphas[y * size + x] - mean, b = alphas[y * size + x + 1] - mean; num += a * b; den += a * a;
    }
    expect(Math.abs(num / den)).toBeLessThan(0.05);
  });
  it('is the same tile every time (seeded)', () => {
    expect(grainPixels(16, 24)).toEqual(grainPixels(16, 24));
  });
});
