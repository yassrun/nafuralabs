/**
 * Agrégat situation-et-retenues (AC-1..13) — Mode B.
 * Run: node sektor/e2e/scripts/verify-situation-et-retenues.mjs
 *
 * Contrat : sektor/raster-src/lots/chantiers/situation-et-retenues/CONTRAT.md
 *
 * AC-1..AC-7 : couverts par verify-alqods-situation-mois1-233.mjs et mois-2-237.
 * AC-8..AC-12 : verify-situation-retenues-al-qods-241.mjs (ci-dessous).
 * AC-11 facture : lecture code Ventes (pas de rasMontant dans createFromSituation).
 * AC-13 : grep i18n chantiers.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

function step(id, ac, pass, detail) {
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id} (${ac}): ${detail}`);
  if (!pass) process.exit(1);
}

function runScript(rel) {
  const r = spawnSync(process.execPath, [join(__dirname, rel)], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status ?? 1;
}

function grepAc11FacturePort() {
  const path = join(
    ROOT,
    'sources/backend/ventes/src/main/java/ma/nafura/ventes/service/FactureClientService.java',
  );
  const src = readFileSync(path, 'utf8');
  const block = src.slice(src.indexOf('createFromSituation'), src.indexOf('createFromSituation') + 2500);
  const readsRas = /rasMontant|rasTaux|getRas/.test(block);
  return { readsRas, path };
}

function grepAc13Vocab() {
  const i18nPath = join(ROOT, 'sources/web/public/assets/i18n/applications/erp/chantiers/fr.json');
  const decomptePath = join(
    ROOT,
    'sources/web/app/chantiers/situations/situation-detail/components/decompte-card/decompte-card.component.html',
  );
  const json = readFileSync(i18nPath, 'utf8').toLowerCase();
  const html = readFileSync(decomptePath, 'utf8');
  const checks = [
    ['situation', json.includes('situation')],
    ['attachement', json.includes('attachement')],
    ['retenue', json.includes('retenue')],
    ['avance', json.includes('avance')],
    ['pénalités', json.includes('pénalités') || html.includes('Pénalités')],
    ['RAS', html.includes('RAS')],
    ['net à payer', json.includes('net à payer')],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([term]) => term);
  return { missing, i18nPath, decomptePath };
}

async function main() {
  console.log('verify-situation-et-retenues — agrégat AC-8..13\n');

  const code = runScript('verify-situation-retenues-al-qods-241.mjs');
  step('situation-retenues-al-qods-241', 'AC-8..AC-12', code === 0, code === 0 ? 'spawn OK' : `exit ${code}`);

  const ac11 = grepAc11FacturePort();
  step(
    'situation-ras-n-affecte-pas-facture',
    'AC-11',
    !ac11.readsRas,
    ac11.readsRas
      ? 'FactureClientService lit rasMontant/rasTaux'
      : 'createFromSituation ne lit pas la RAS',
  );

  const ac13 = grepAc13Vocab();
  step(
    'situation-vocabulaire-marocain',
    'AC-13',
    ac13.missing.length === 0,
    ac13.missing.length ? `termes absents: ${ac13.missing.join(', ')}` : 'i18n chantiers/fr.json',
  );

  console.log('\nverify-situation-et-retenues : PASS');
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
