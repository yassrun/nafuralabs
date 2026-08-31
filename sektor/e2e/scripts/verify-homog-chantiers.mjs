/**
 * SEKTOR-292 — chrome Chantiers (homogenisation-ux).
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

const docs = path.join(
  ROOT,
  'sektor/sources/web/app/chantiers/documents/documents-listing/documents-listing.page.ts',
);
const edit = path.join(ROOT, 'sektor/sources/web/app/chantiers/edit/chantier-edit.page.ts');
const saisieHtml = path.join(
  ROOT,
  'sektor/sources/web/app/chantiers/avancements/avancement-saisie/avancement-saisie.page.html',
);
const listing = path.join(
  ROOT,
  'sektor/sources/web/app/chantiers/chantiers-listing/chantiers-listing.page.ts',
);

for (const p of [docs, edit, saisieHtml, listing]) {
  if (!fs.existsSync(p)) fail(`missing ${p}`);
}

const docsSrc = fs.readFileSync(docs, 'utf8');
if (!docsSrc.includes('nf-page-header')) fail('documents-listing: nf-page-header required');
if (!docsSrc.includes('nf-select')) fail('documents-listing: nf-select required');
if (!docsSrc.includes('nf-pagination')) fail('documents-listing: nf-pagination required');
if (/class="link-button"/.test(docsSrc)) fail('documents-listing: link-button still present');

const editSrc = fs.readFileSync(edit, 'utf8');
if (!/nf-action-bar[\s\S]*sticky/.test(editSrc) && !editSrc.includes('[sticky]')) {
  fail('chantier-edit: nf-action-bar sticky required');
}
if (/<select\b/.test(editSrc)) fail('chantier-edit: native select still present');

const saisie = fs.readFileSync(saisieHtml, 'utf8');
if (!saisie.includes('nf-action-bar')) fail('avancement-saisie: nf-action-bar required');
if (/<select\b/.test(saisie)) fail('avancement-saisie: native select still present');

const listSrc = fs.readFileSync(listing, 'utf8');
if (/<select\b/.test(listSrc)) fail('chantiers-listing: native select still present');

ok('SEKTOR-292 chantiers chrome: documents + edit + saisie + listing gates');
