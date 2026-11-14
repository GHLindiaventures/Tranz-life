import { describe, expect, it } from 'vitest';
import { BOTANICALS, MOMENTS, NEEDS } from '../../src/data/day.js';
import { EXTRA_PRODUCTS, PRODUCTS } from '../../src/data/products.js';

const ids = new Set([...PRODUCTS, ...EXTRA_PRODUCTS].map(p => p.id));

describe('home page day story data', () => {
  it('has one moment per product, each product exactly once', () => {
    const used = MOMENTS.map(m => m.productId);
    expect(new Set(used).size).toBe(used.length);
    expect(new Set(used)).toEqual(ids);
  });

  it('every moment names real botanicals and has complete copy', () => {
    MOMENTS.forEach(m => {
      expect(m.botanicals.length).toBeGreaterThan(0);
      m.botanicals.forEach(b => expect(BOTANICALS[b], `${m.id}: ${b}`).toBeTruthy());
      expect(m.name, m.id).toBeTruthy();
      expect(m.title).toHaveLength(2);
      expect(m.copy.length).toBeGreaterThan(20);
      expect(m.sky).toHaveLength(2);
      expect(m.sun).toBeGreaterThanOrEqual(0);
      expect(m.sun).toBeLessThanOrEqual(1);
    });
  });

  it('moments run forward through the day', () => {
    MOMENTS.slice(1).forEach((m, i) => expect(m.sun).toBeGreaterThan(MOMENTS[i].sun));
  });

  it('every botanical has the science lens details', () => {
    Object.entries(BOTANICALS).forEach(([id, b]) => {
      ['name', 'latin', 'cmp', 'formula', 'color', 'shape'].forEach(k => expect(b[k], `${id}.${k}`).toBeTruthy());
      expect(b.color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('ritual needs only point at real products', () => {
    NEEDS.filter(n => n.products).forEach(n => n.products.forEach(p => expect(ids.has(p), `${n.id}: ${p}`).toBe(true)));
  });

  it('every product the 3D story shows has a model', () => {
    [...PRODUCTS, ...EXTRA_PRODUCTS].forEach(p => expect(p.model, p.id).toBeTruthy());
  });
});
