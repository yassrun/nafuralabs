/**
 * SEKTOR-295 — chrome Catalogue (homogenisation-ux).
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

const etat = path.join(
  ROOT,
  'sektor/sources/web/app/catalogue/suivi/etat-stock/etat-stocks.page.ts',
);
if (!fs.existsSync(etat)) fail('missing etat-stocks.page.ts');
const src = fs.readFileSync(etat, 'utf8');
if (/<select\b/.test(src)) fail('etat-stocks: native select still present');
if (!src.includes('nf-select')) fail('etat-stocks: nf-select required');

const editors = [
  'sektor/sources/web/app/catalogue/components/perte-lines-editor/perte-lines-editor.component.ts',
  'sektor/sources/web/app/catalogue/components/transfert-lines-editor/transfert-lines-editor.component.ts',
  'sektor/sources/web/app/catalogue/components/retour-lines-editor/retour-lines-editor.component.ts',
  'sektor/sources/web/app/catalogue/components/inventaire-lines-editor/inventaire-lines-editor.component.ts',
];
for (const rel of editors) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`missing ${rel}`);
  const t = fs.readFileSync(abs, 'utf8');
  if (!t.includes('nf-button')) fail(`${rel}: nf-button expected for picker trigger`);
}

ok('SEKTOR-295 catalogue chrome: etat-stocks nf-select + line-editors nf-button');
