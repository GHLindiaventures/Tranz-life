import { execSync } from 'child_process';
import fs from 'fs';

fs.mkdirSync('raw', { recursive: true });

const files = [
  { commit: '60ad282', path: 'src/assets/products/lungbooster.glb', out: 'raw/lungbooster.glb' },
  { commit: '60ad282', path: 'src/assets/products/liver-booster.glb', out: 'raw/liver-booster.glb' },
  { commit: '60ad282', path: 'src/assets/products/cyclerelief.glb', out: 'raw/cyclerelief.glb' },
  { commit: 'd5f86e2', path: 'src/assets/products/energy-booster.glb', out: 'raw/energy-booster.glb' },
];

for (const f of files) {
  console.log(`Extracting ${f.out} from ${f.commit}:${f.path}`);
  const buf = execSync(`git show ${f.commit}:${f.path}`, { maxBuffer: 150 * 1024 * 1024 });
  fs.writeFileSync(f.out, buf);
  console.log(`Wrote ${f.out}: ${buf.length} bytes`);
}
