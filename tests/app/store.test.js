import { describe, expect, it } from 'vitest';
import { storeCta, storeLive } from '../../src/app/store.js';

// the test run has no VITE_STORE_URL: the site is in "online store coming soon" mode
describe('online store links', () => {
  it('is not live without VITE_STORE_URL', () => {
    expect(storeLive).toBe(false);
  });

  it('says "coming soon" instead of linking anywhere', () => {
    const html = storeCta('gummies');
    expect(html).toContain('Online store coming soon');
    expect(html).not.toContain('href');
  });

  it('can stay silent where a note would be noise', () => {
    expect(storeCta('gummies', { quiet: true })).toBe('');
  });
});
