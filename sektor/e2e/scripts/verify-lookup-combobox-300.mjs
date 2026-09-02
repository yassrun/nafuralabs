/**
 * SEKTOR-300 — valeur posée = lecture seule + croix ; clic X vide le champ (AC-15).
 *
 * Discrimination (rouge avant) :
 * - input combobox sans [readonly] / sans nf-combobox__clear
 * - onComboFocus copie le libellé dans comboQuery (frappe par-dessus la valeur)
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

const SELECT_TS =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/select.component.ts';
const SELECT_HTML =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/select.component.html';
const UTIL =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/lookup-combobox.util.ts';
const CANVAS =
  'sektor/raster-src/lots/raffinement-ux-pro/socle-lookups-combobox/ux/lookup-combobox-wireframe.canvas.tsx';
const CONTRAT =
  'sektor/raster-src/lots/raffinement-ux-pro/socle-lookups-combobox/CONTRAT.md';

const ts = read(SELECT_TS);
const html = read(SELECT_HTML);
const util = read(UTIL);
const canvas = read(CANVAS);
const contrat = read(CONTRAT);

if (!util.includes('export function comboTypingLocked')) {
  fail('util missing comboTypingLocked');
}
if (!ts.includes('comboShowsClear') || !ts.includes('clearCombo')) {
  fail('nf-select missing clearCombo / comboShowsClear');
}
if (ts.includes('lookupDisplayLabel(this.value(), this.displayOptions(), this.selectedLabel)\n      );')) {
  fail('onComboFocus still copies the selected label into the query (type-over)');
}
if (!html.includes('nf-combobox__clear') || !html.includes('[readonly]="comboLocked()"')) {
  fail('combobox template missing inner clear × or readonly lock');
}
if (!html.includes('#comboInput')) {
  fail('clear must refocus the input after emptying');
}
if (!canvas.includes('clear') || !canvas.includes('×')) {
  fail('wireframe VueChoisi must show the inner clear ×');
}
if (!contrat.includes('AC-15')) {
  fail('CONTRAT missing AC-15 Effacer');
}

console.log('OK    SEKTOR-300 lookup combobox clear × empties the field (AC-15)');
