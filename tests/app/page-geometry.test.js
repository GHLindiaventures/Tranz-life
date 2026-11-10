import { describe, it, expect } from 'vitest';
import { cumulativeTops } from '../../src/app/page-geometry.js';

describe('cumulativeTops', () => {
  it('stacks pages one after another from the start of <main>', () => {
    expect(cumulativeTops(0, [{ h:900 }, { h:1200 }, { h:800 }])).toEqual([0, 900, 2100]);
  });
  it('adds the offset of <main>', () => {
    expect(cumulativeTops(64, [{ h:100 }, { h:200 }])).toEqual([64, 164]);
  });
  it('counts margins above and below each page', () => {
    expect(cumulativeTops(0, [{ h:100, mb:20 }, { h:100, mt:10 }, { h:50 }])).toEqual([0, 130, 230]);
  });
  it('handles no pages and missing values', () => {
    expect(cumulativeTops(0, [])).toEqual([]);
    expect(cumulativeTops(10, [{}, { h:5 }])).toEqual([10, 10]);
  });
});
