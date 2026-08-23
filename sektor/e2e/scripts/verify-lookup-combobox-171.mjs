/**
 * SEKTOR-171 — remaining lookupKeys + listing filters (AC-12, AC-13).
 * Scénario CONTRAT : lookup-filtre-listing.
 *
 * Discrimination (rouge sur le code d'avant 171) :
 * - LOOKUP_SEARCHERS without chantiers / employes / devis, or with items
 * - nf-filter-builder without nf-select / lookupSearch for lookupKey
 * - devis listing filters without lookupKey clients
 * - offre / aoc / facture dump pageSize 500 or chantiers() without q
 * - situation listing hidden native select
 * - article picker files missing (AC-13 must stay)
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

const SEARCHERS = 'sektor/sources/web/app/socle/shared/services/erp-lookup-searchers.ts';
const APP = 'sektor/sources/web/app/socle/app.config.ts';
const FILTER_BUILDER =
  'nafura-platform/sources/web/lib/anatomy/components/molecules/filter-builder/filter-builder.component.ts';
const DEVIS_FILTERS = 'sektor/sources/web/app/etudes/devis/config/listing/filters.ts';
const OFFRE = 'sektor/sources/web/app/ventes/offres/services/offre.facade.ts';
const AOC = 'sektor/sources/web/app/etudes/appels-offres-clients/services/aoc.facade.ts';
const FACTURE = 'sektor/sources/web/app/ventes/factures/services/facture.facade.ts';
const SITUATION_FACADE =
  'sektor/sources/web/app/chantiers/situations/services/situation.facade.ts';
const SITUATION_LISTING_HTML =
  'sektor/sources/web/app/chantiers/situations/situation-listing/situation-listing.page.html';
const SITUATION_LISTING_TS =
  'sektor/sources/web/app/chantiers/situations/situation-listing/situation-listing.page.ts';
const PICKER = 'sektor/sources/web/app/catalogue/components/article-picker/article-picker.component.ts';
const PICKER_FIELD =
  'sektor/sources/web/app/catalogue/components/article-picker/article-picker-field.component.ts';
const ROUTES = 'sektor/sources/web/app/socle/shared/config/erp-lookup-list-routes.ts';

const searchers = read(SEARCHERS);
const app = read(APP);
const filterBuilder = read(FILTER_BUILDER);
const devisFilters = read(DEVIS_FILTERS);
const offre = read(OFFRE);
const aoc = read(AOC);
const facture = read(FACTURE);
const situation = read(SITUATION_FACADE);
const listingHtml = read(SITUATION_LISTING_HTML);
const listingTs = read(SITUATION_LISTING_TS);
const picker = read(PICKER);
const pickerField = read(PICKER_FIELD);
const routes = read(ROUTES);

if (!app.includes('LOOKUP_SEARCHERS') || !app.includes('buildErpLookupSearchers')) {
  fail('app.config does not provide LOOKUP_SEARCHERS via buildErpLookupSearchers');
}

for (const key of ['chantiers', 'employes', 'devis', 'factures', 'locations']) {
  if (!searchers.includes(`${key},`) && !searchers.includes(`${key}:`)) {
    fail(`LOOKUP_SEARCHERS missing key ${key}`);
  }
}

if (/^\s*items[,:]/m.test(searchers) || searchers.includes('items: typeahead') || searchers.includes('items,')) {
  if (/\n\s*items[,\n]/.test(searchers.replace(/except `items`[\s\S]*?\*\//, ''))) {
    fail('LOOKUP_SEARCHERS still maps items (AC-13 picker must stay out)');
  }
}

const returnBlock = searchers.slice(searchers.lastIndexOf('return {'));
if (/\bitems\s*:/.test(returnBlock) || /^\s*items,/m.test(returnBlock)) {
  fail('LOOKUP_SEARCHERS return map includes items (AC-13)');
}

if (!searchers.includes('term.length < 2')) {
  fail('typeahead does not refuse dump before 2 chars');
}

if (!filterBuilder.includes('<nf-select') || !filterBuilder.includes('[lookupSearch]')) {
  fail('nf-filter-builder has no nf-select / lookupSearch for lookupKey');
}
if (!filterBuilder.includes('isLookupCombobox') || !filterBuilder.includes("key !== 'items'")) {
  fail('nf-filter-builder does not skip items picker (AC-13)');
}

if (!devisFilters.includes("lookupKey: 'clients'")) {
  fail('devis listing filters do not use lookupKey clients (lookup-filtre-listing)');
}

for (const [label, src] of [
  ['offre.facade', offre],
  ['aoc.facade', aoc],
  ['facture.facade', facture],
  ['situation.facade', situation],
]) {
  if (src.includes('pageSize: 500')) fail(`${label} still dumps pageSize: 500`);
}

if (/partnersByRole\(\s*'CLIENT'\s*\)/.test(offre + situation)) {
  fail('offre/situation still dumps partnersByRole(CLIENT) without q');
}
if (/chantiers\(\s*\)/.test(facture)) {
  fail('facture.facade still dumps chantiers() without q');
}
if (!offre.includes('clients: []') || !facture.includes('chantiers: []')) {
  fail('offre/facture ensureLookups does not seed empty lookup arrays');
}
if (!situation.includes('chantiers: []') || !situation.includes('loadChantierPrefill')) {
  fail('situation.facade still dumps chantiers or has no getById prefill');
}

if (listingHtml.includes('chantierOptions().length')) {
  fail('situation listing still hides the chantier filter when dump is empty');
}
if (!listingHtml.includes('<nf-select') || !listingHtml.includes('[lookupSearch]')) {
  fail('situation listing toolbar is not an nf-select combobox');
}
if (!listingHtml.includes('lookupKey="chantiers"')) {
  fail('situation listing combobox has no lookupKey chantiers');
}
if (!listingTs.includes('searchChantiers')) {
  fail('situation listing missing searchChantiers typeahead');
}

if (!picker.includes('selector: \'app-article-picker\'') && !picker.includes('selector: "app-article-picker"')) {
  fail('article picker component selector missing (AC-13)');
}
if (!pickerField.includes('app-article-picker-field')) {
  fail('article picker field missing (AC-13)');
}

if (!routes.includes('items:') || !routes.includes('chantiers:')) {
  fail('ERP_LOOKUP_LIST_ROUTES missing items/chantiers');
}

console.log(
  'PASS  lookup-filtre-listing: remaining lookupKeys + listing filters combobox, no dump, items picker unchanged'
);
