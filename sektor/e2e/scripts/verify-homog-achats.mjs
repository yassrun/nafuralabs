/**
 * SEKTOR-297 — chrome Achats résiduel (homogenisation-ux).
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

const consult = path.join(
  ROOT,
  'sektor/sources/web/app/achats/consultations/consultation-detail/consultation-detail.page.html',
);
const fourn = path.join(
  ROOT,
  'sektor/sources/web/app/achats/fournisseurs/fournisseur-detail/fournisseur-detail.page.html',
);
const bc = path.join(
  ROOT,
  'sektor/sources/web/app/achats/commandes/bc-detail/bc-detail.page.html',
);

for (const p of [consult, fourn, bc]) {
  if (!fs.existsSync(p)) fail(`missing ${p}`);
}

const c = fs.readFileSync(consult, 'utf8');
if (/<select\b/.test(c)) fail('consultation-detail: native select still present');

const f = fs.readFileSync(fourn, 'utf8');
if (/<select\b/.test(f)) fail('fournisseur-detail: native select still present');
if (/btn btn--primary/.test(f)) fail('fournisseur-detail: btn btn--primary still on controls');

const b = fs.readFileSync(bc, 'utf8');
if (!b.includes('nf-action-bar')) fail('bc-detail: nf-action-bar required');
if (/bc-rec-form__actions/.test(b)) fail('bc-detail: bc-rec-form__actions still present');

ok('SEKTOR-297 achats residual: 0 select on details + bc action-bar');
