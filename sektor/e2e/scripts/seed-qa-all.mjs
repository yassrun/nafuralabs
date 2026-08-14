/**
 * Run all QA seed scripts in sequence (each is idempotent).
 * Run: node tests/e2e/scripts/seed-qa-all.mjs
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCRIPTS = [
  'seed-qa-ref-data.mjs',
  'seed-qa-achats.mjs',
  'seed-qa-etudes.mjs',
  'seed-qa-materiel-ext.mjs',
  'seed-qa-finance.mjs',
  'seed-qa-marches.mjs',
  'seed-qa-rh-paie.mjs',
  'seed-qa-hse.mjs',
];

let failed = 0;
for (const script of SCRIPTS) {
  const full = path.join(__dirname, script);
  const fs = await import('node:fs');
  if (!fs.existsSync(full)) {
    console.log(`[skip] ${script} — not found yet`);
    continue;
  }
  console.log(`\n=== ${script} ===`);
  const r = spawnSync(process.execPath, [full], { stdio: 'inherit', cwd: path.resolve(__dirname, '../../..') });
  if (r.status !== 0) {
    failed++;
    console.error(`[fail] ${script} exit ${r.status}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
