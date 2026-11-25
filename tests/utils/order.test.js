import { describe, expect, it } from 'vitest';
import { SHIPPING } from '../../src/data/shipping.js';
import { orderRef, priceOrder, REF_PATTERN, toPaise } from '../../src/utils/order.js';

describe('priceOrder', () => {
  it('prices from the catalogue and charges delivery below the free threshold', () => {
    const o = priceOrder([{ id:'inhaler', qty:2, price:1 }]);
    expect(o.items).toEqual([{ id:'inhaler', name:'TranzLife Aromatherapy Inhaler', price:249, qty:2, total:498 }]);
    expect(o.subtotal).toBe(498);
    expect(o.shipping).toBe(SHIPPING.fee);
    expect(o.total).toBe(498 + SHIPPING.fee);
  });
  it('delivers free from the threshold up', () => {
    const o = priceOrder([{ id:'gummies', qty:1 }, { id:'reviva', qty:1 }, { id:'inhaler', qty:1 }]);
    expect(o.subtotal).toBeGreaterThanOrEqual(SHIPPING.freeFrom);
    expect(o.shipping).toBe(0);
  });
  it('refuses empty bags, unknown products, bad quantities and repeats', () => {
    expect(() => priceOrder([])).toThrow(/empty/);
    expect(() => priceOrder([{ id:'nope', qty:1 }])).toThrow(/no longer available/);
    expect(() => priceOrder([{ id:'liver', qty:0 }])).toThrow(/1 to/);
    expect(() => priceOrder([{ id:'liver', qty:1.5 }])).toThrow(/1 to/);
    expect(() => priceOrder([{ id:'liver', qty:SHIPPING.maxQty + 1 }])).toThrow(/1 to/);
    expect(() => priceOrder([{ id:'liver', qty:1 }, { id:'liver', qty:1 }])).toThrow(/twice/);
  });
  it('converts rupees to paise', () => {
    expect(toPaise(598)).toBe(59800);
  });
});

describe('orderRef', () => {
  it('makes order numbers with the date and 8 unambiguous characters', () => {
    const ref = orderRef(new Date('2026-11-23T10:00:00Z'), new Uint8Array([0, 1, 2, 3, 30, 31, 32, 255]));
    expect(ref).toBe('TL-261123-2345YZ2Z');
    expect(REF_PATTERN.test(ref)).toBe(true);
    expect(ref.length).toBeLessThanOrEqual(35); // short enough for a UPI payment note
  });
});
