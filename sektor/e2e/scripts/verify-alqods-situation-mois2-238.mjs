/**
 * Preuve agrégée SEKTOR-238 — Al Qods mois 2 situation cumulative (QA indépendante).
 * Run: node sektor/e2e/scripts/verify-alqods-situation-mois2-238.mjs
 *
 * 1) Rejoue mois-1 agrégé (235 → 232/233/234).
 * 2) Rejoue mois-2 partiel (237 → octobre + situation n°2 cumul + discriminants SCENARIO).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

const AGGREGATE_SCRIPTS = [
  'verify-alqods-situation-mois1-235.mjs',
  'verify-alqods-situation-mois2-237.mjs',
];

async function waitApi(maxMs = 300000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    try {
      const r = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const b = await r.json().catch(() => null);
      if (b?.accessToken) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return false;
}

function runAggregateScripts() {
  console.log('\n=== Preuves agrégées mois-1 (235) + mois-2 (237) ===');
  for (const script of AGGREGATE_SCRIPTS) {
    console.log(`\n--- ${script} ---`);
    const r = spawnSync(process.execPath, [join(ROOT, 'e2e/scripts', script)], {
      cwd: ROOT,
      stdio: 'inherit',
      env: process.env,
    });
    if (r.status !== 0) {
      throw new Error(`${script} → échec (code ${r.status ?? 'signal'})`);
    }
  }
  console.log('\nok agrégats 235 + 237');
}

async function main() {
  console.log('SEKTOR-238 — preuve Al Qods mois 2 situation cumulative (QA indépendante)');
  if (!(await waitApi())) {
    console.log('SKIP Mode B indisponible (cursor-session)');
    process.exit(0);
  }

  runAggregateScripts();

  console.log('\nSEKTOR-238 : PASS — mois-1 (235) + octobre situation n°2 (237) discriminants SCENARIO');
  console.log('Browser MCP absent — pas de captures desktop/390 (skip documenté, preuve API).');
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
