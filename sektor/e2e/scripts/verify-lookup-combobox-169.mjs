/**
 * SEKTOR-169 — combobox anatomy (AC-1, AC-2, AC-5–8, AC-14).
 * Discrimination: native-only select, dump before 2 chars, eye always listing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const UTIL = path.join(
  ROOT,
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/lookup-combobox.util.ts'
);
const SELECT_HTML = path.join(
  ROOT,
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/select.component.html'
);
const SELECT_TS = path.join(
  ROOT,
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/select.component.ts'
);
const DETAIL_HTML = path.join(
  ROOT,
  'nafura-platform/sources/web/lib/anatomy/components/organisms/entity-detail/entity-detail.component.html'
);

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

const util = fs.readFileSync(UTIL, 'utf8');
const selectHtml = fs.readFileSync(SELECT_HTML, 'utf8');
const selectTs = fs.readFileSync(SELECT_TS, 'utf8');
const detailHtml = fs.readFileSync(DETAIL_HTML, 'utf8');

if (!selectHtml.includes('role="combobox"')) {
  fail('nf-select has no combobox — still a native <select> only');
}
if (!selectTs.includes('isCombobox()') || !selectTs.includes('lookupKey')) {
  fail('nf-select does not branch on lookupKey');
}
if (!detailHtml.includes('field.lookupKey') || !detailHtml.includes('nf-select')) {
  fail('nf-entity-detail does not render nf-select for lookupKey fields');
}
if (!util.includes('LOOKUP_COMBO_MIN_CHARS = 2')) {
  fail('min query is not 2');
}
if (!util.includes('filterLookupHits') || !util.includes('return []')) {
  fail('filterLookupHits missing empty-before-min (dump on open)');
}
if (!util.includes('resolveLookupEyeRoute') || !util.includes('${list}/${id}')) {
  fail('eye fiche path `{list}/{id}` missing');
}
if (!selectTs.includes('Voir la fiche') || !selectTs.includes('Voir la liste')) {
  fail('eye labels fiche/liste missing');
}
if (!util.includes('Enregistrement introuvable')) {
  fail('orphan UUID label missing');
}

console.log(
  'PASS  combobox anatomy: lookupKey -> combobox, min 2 chars, eye fiche/liste, orphan, entity-detail wired'
);
