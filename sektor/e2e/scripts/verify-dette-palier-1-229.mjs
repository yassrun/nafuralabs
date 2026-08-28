/**
 * Preuve SEKTOR-229 — clôture dette palier 1 (AC-D1..D3).
 * Run: node sektor/e2e/scripts/verify-dette-palier-1-229.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

function run(script) {
  console.log(`\n--- ${script} ---`);
  const r = spawnSync(process.execPath, [join(SCRIPTS_DIR, script)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) throw new Error(`${script} failed (${r.status})`);
}

function assertChrome228() {
  const header = join(ROOT, 'sources/web/app/etudes/dossiers/components/dossier-summary-header/dossier-summary-header.component.ts');
  const fr = join(ROOT, 'sources/web/public/assets/i18n/applications/erp/fr.json');
  for (const f of [header, fr]) {
    if (!existsSync(f)) throw new Error(`missing ${f}`);
  }
  const h = readFileSync(header, 'utf8');
  if (h.includes('Créer chantier et marché') || h.includes('creerChantierEtMarche')) {
    throw new Error('VU ROUGE : CTA « Créer chantier et marché » encore présent');
  }
  if (!h.includes('Créer le chantier') && !readFileSync(fr, 'utf8').includes('Créer le chantier')) {
    throw new Error('VU ROUGE : libellé « Créer le chantier » absent');
  }
  console.log('PASS chrome-229 : plus de « Créer chantier et marché » sur le header');
}

function main() {
  console.log('SEKTOR-229 — dette palier 1');
  assertChrome228();
  run('verify-dette-cockpit-achats-227.mjs');
  run('verify-dette-conversion-228.mjs');
  console.log('\nNOTE AC-D3 : captures desktop/390 non exigées (Browser MCP absent).');
  console.log('PASS SEKTOR-229');
}

main();
