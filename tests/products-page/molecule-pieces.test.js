import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import manifest from '../../src/assets/molecules/pieces/manifest.json';

describe('Molecule Pieces Manifest', () => {
  const piecesDir = path.resolve(__dirname, '../../src/assets/molecules/pieces');

  it('manifest.json has at least 8 pieces', () => {
    expect(manifest.length).toBeGreaterThanOrEqual(8);
  });

  it('every listed piece file exists in src/assets/molecules/pieces/', () => {
    manifest.forEach(item => {
      const filePath = path.join(piecesDir, item.file);
      expect(fs.existsSync(filePath), `Missing piece file: ${item.file}`).toBe(true);
    });
  });

  it('no piece is wider or taller than 256px', () => {
    manifest.forEach(item => {
      expect(item.w, `${item.file} width exceeds 256px`).toBeLessThanOrEqual(256);
      expect(item.h, `${item.file} height exceeds 256px`).toBeLessThanOrEqual(256);
    });
  });

  it('contains both sphere pieces and pair pieces', () => {
    const spheres = manifest.filter(p => p.kind === 'sphere');
    const pairs = manifest.filter(p => p.kind === 'pair');
    expect(spheres.length).toBeGreaterThanOrEqual(6);
    expect(pairs.length).toBeGreaterThanOrEqual(2);
  });
});
