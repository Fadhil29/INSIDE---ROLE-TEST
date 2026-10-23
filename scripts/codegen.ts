import { spawnSync } from 'child_process';
import fs from 'fs';
import { ROLES, authFile, DASHBOARD_URL } from './roles';

// npm run codegen -- <slug> <nama-file>
// contoh: npm run codegen -- auditor safety-report
const [slug, name] = process.argv.slice(2);
if (!ROLES.some((r) => r.slug === slug) || !name) {
  console.log(`pakai: npm run codegen -- <slug> <nama-file>\nslug: ${ROLES.map((r) => r.slug).join(', ')}`);
  process.exit(1);
}
if (!fs.existsSync(authFile(slug))) {
  console.log(`${authFile(slug)} belum ada. jalankan: npm run auth`);
  process.exit(1);
}

const out = `tests/${slug}/${name.replace(/\.spec\.ts$/, '')}.spec.ts`;
spawnSync(
  'npx',
  ['playwright', 'codegen', `--load-storage=${authFile(slug)}`, '-o', out, DASHBOARD_URL],
  { stdio: 'inherit', shell: true },
);
console.log(`hasil: ${out}`);
