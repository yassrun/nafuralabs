/**
 * SEKTOR-299 — nf-select typeahead must not re-fire on options identity churn.
 *
 * Discrimination (rouge avant le fix) :
 * - ngOnChanges appelle refreshComboHits() dès que `options` change, même avec lookupSearch
 * - entity-detail toNfSelectOptions() renvoie un nouveau [] à chaque CD
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`missing ${rel}`);
  return fs.readFileSync(abs, 'utf8');
};

const SELECT =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/select.component.ts';
const UTIL =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/lookup-combobox.util.ts';
const DETAIL =
  'nafura-platform/sources/web/lib/anatomy/components/organisms/entity-detail/entity-detail.component.ts';

const select = read(SELECT);
const util = read(UTIL);
const detail = read(DETAIL);

if (!util.includes('export function comboHitsComeFromServer')) {
  fail('lookup-combobox.util missing comboHitsComeFromServer');
}

const ngOnChanges = select.slice(select.indexOf('ngOnChanges'), select.indexOf('ngOnInit'));
if (!ngOnChanges.includes('comboHitsComeFromServer')) {
  fail('ngOnChanges must gate refreshComboHits with comboHitsComeFromServer');
}

const unguardedRefresh =
  /if\s*\(\s*changes\['options'\][\s\S]*?\{\s*this\.syncDisplayOptions\(\);\s*this\.refreshComboHits\(\);/m;
if (unguardedRefresh.test(ngOnChanges)) {
  fail('ngOnChanges still re-fires refreshComboHits on every options identity change');
}

if (!ngOnChanges.includes('refreshComboHits')) {
  fail('local-filter combobox still needs refreshComboHits when there is no server searcher');
}

if (!detail.includes('lookupOptionsEqual') || !detail.includes('nfSelectOptionsByField')) {
  fail('entity-detail must keep a stable options[] identity across CD');
}

if (!detail.includes('lookupSearchFnByKey')) {
  fail('entity-detail must cache lookupSearchFn wrappers');
}

console.log('OK    SEKTOR-299 lookup combobox does not re-fire typeahead on options CD churn');
