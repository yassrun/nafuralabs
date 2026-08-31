/**
 * SEKTOR-288 / preuves-homog — chrome Études (homogenisation-ux).
 * Source gates (no browser). Mode B optional smoke if 8082 up.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`PASS  ${msg}`);

const paths = [
  'sektor/sources/web/app/etudes/dossiers/dossier-create/dossier-create.page.html',
  'sektor/sources/web/app/etudes/dossiers/dossier-create/dossier-create.page.ts',
  'sektor/sources/web/app/etudes/dossiers/components/pieces-marche/pieces-marche.component.html',
  'sektor/sources/web/app/etudes/dossiers/components/bordereau-arbre/bordereau-arbre.component.html',
  'sektor/sources/web/app/etudes/dossiers/components/dossier-summary-header/dossier-summary-header.component.html',
  'sektor/sources/web/app/etudes/dossiers/components/poste-decomposition-panel/poste-decomposition-panel.component.html',
  'sektor/sources/web/app/etudes/devis/devis-from-dpgf/devis-from-dpgf.page.ts',
];

let blob = '';
for (const rel of paths) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`missing ${rel}`);
  blob += fs.readFileSync(abs, 'utf8') + '\n';
}

if (!blob.includes('nf-action-bar')) fail('dossier-create must use nf-action-bar');
if (/<button\b/.test(blob)) fail('raw <button> still present on etudes chrome paths');
if (/<mat-icon\b/.test(blob)) fail('mat-icon still present on etudes chrome paths');
if (/<select\b/.test(blob)) fail('native <select> still present on etudes chrome paths');
if (/creer__bouton/.test(blob) && /class="creer__bouton"/.test(blob)) {
  fail('creer__bouton class still used in templates');
}

ok('SEKTOR-288 etudes chrome: action-bar present, 0 button/select/mat-icon on listed paths');
