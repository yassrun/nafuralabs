/**
 * SEKTOR-249 — agrégat QA consultation Achats (gel 22/08 + overlay 23/08).
 * Run: node sektor/e2e/scripts/verify-consultation-achat-249.mjs
 *
 * SEKTOR-136 (formulaire overlay) remplacé par SEKTOR-139 (liste liées) — non rejoué.
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const scripts = ['134', '135', '137', '139'];

let fails = 0;
console.log('=== SEKTOR-249 — consultation Achats (agrégat) ===');
console.log('SKIP 136 — overlay formulaire remplacé par 139 (overlay liste liées)\n');

for (const id of scripts) {
  const path = join(here, `verify-consultation-achat-${id}.mjs`);
  console.log(`>>> verify-consultation-achat-${id}.mjs`);
  const r = spawnSync(process.execPath, [path], { stdio: 'inherit', cwd: join(here, '../../..') });
  if (r.status !== 0) {
    fails++;
    console.error(`FAIL script ${id} (exit ${r.status ?? 1})`);
  }
  console.log('');
}

console.log(`=== Bilan : ${scripts.length - fails}/${scripts.length} scripts OK · 136 skipped (superseded) ===`);
process.exit(fails > 0 ? 1 : 0);
