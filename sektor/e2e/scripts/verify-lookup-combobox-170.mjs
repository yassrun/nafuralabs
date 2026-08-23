/**
 * SEKTOR-170 — client / fournisseur typeahead (AC-3, AC-4, AC-9, AC-10, AC-11).
 * Scénarios CONTRAT : lookup-client-devis · lookup-fournisseur-bc.
 *
 * Discrimination (rouge sur le code d'avant 170) :
 * - facades devis/BC/contrat dump pageSize 500 / partnersByRole(role) à l'ouverture
 * - GET partners by-role sans q
 * - nf-select sans lookupSearch / sans Réessayer
 * - CTA Créer dans le combobox
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

const DEVIS = 'sektor/sources/web/app/etudes/devis/services/devis.facade.ts';
const BC = 'sektor/sources/web/app/achats/commandes/services/bc.facade.ts';
const CONTRAT_FACADE = 'sektor/sources/web/app/achats/contrats/services/contrat.facade.ts';
const FACTURE = 'sektor/sources/web/app/ventes/factures/services/facture.facade.ts';
const CH_CREATE = 'sektor/sources/web/app/chantiers/create/chantier-create.page.ts';
const CH_EDIT = 'sektor/sources/web/app/chantiers/edit/chantier-edit.page.ts';
const APP = 'sektor/sources/web/app/socle/app.config.ts';
const ERP = 'sektor/sources/web/app/socle/shared/services/erp-lookup.service.ts';
const CTRL =
  'sektor/sources/backend/achats/src/main/java/ma/nafura/achats/api/controller/PartnerController.java';
const REPO =
  'sektor/sources/backend/achats/src/main/java/ma/nafura/achats/repository/PartnerRepository.java';
const SELECT_HTML =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/select.component.html';
const SELECT_TS =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/select.component.ts';
const DETAIL_HTML =
  'nafura-platform/sources/web/lib/anatomy/components/organisms/entity-detail/entity-detail.component.html';
const DEVIS_FIELDS = 'sektor/sources/web/app/etudes/devis/config/detail/fields.ts';
const BC_FIELDS = 'sektor/sources/web/app/achats/commandes/config/detail/fields.ts';

const devis = read(DEVIS);
const bc = read(BC);
const contrat = read(CONTRAT_FACADE);
const facture = read(FACTURE);
const chCreate = read(CH_CREATE);
const chEdit = read(CH_EDIT);
const app = read(APP);
const erp = read(ERP);
const ctrl = read(CTRL);
const repo = read(REPO);
const selectHtml = read(SELECT_HTML);
const selectTs = read(SELECT_TS);
const detailHtml = read(DETAIL_HTML);

for (const [label, src] of [
  ['devis.facade', devis],
  ['bc.facade', bc],
  ['contrat.facade', contrat],
]) {
  if (src.includes('pageSize: 500')) fail(`${label} still dumps pageSize: 500`);
}

if (/partnersByRole\(\s*'CLIENT'\s*\)/.test(devis)) {
  fail('devis.facade still dumps partnersByRole(CLIENT) without q');
}
if (!devis.includes('clients: []')) {
  fail('devis.facade ensureLookups does not seed clients: []');
}

if (/partnersByRole\(\s*'FOURNISSEUR'\s*\)/.test(bc + contrat)) {
  fail('BC/contrat facade still dumps partnersByRole(FOURNISSEUR) without q');
}
if (!bc.includes('fournisseurs: []') || !contrat.includes('fournisseurs: []')) {
  fail('BC/contrat ensureLookups does not seed fournisseurs: []');
}

if (/partnersByRole\(\s*'CLIENT'\s*\)/.test(facture)) {
  fail('facture.facade still dumps CLIENT partners');
}

if (/partnersByRole\(\s*'CLIENT'\s*\)/.test(chCreate + chEdit)) {
  fail('chantier create/edit still dumps partnersByRole(CLIENT) without q');
}
if (!chCreate.includes('searchClients') || !chEdit.includes('searchClients')) {
  fail('chantier create/edit missing searchClients typeahead');
}
if (!chCreate.includes('[lookupSearch]') || !chEdit.includes('[lookupSearch]')) {
  fail('chantier create/edit nf-select missing lookupSearch');
}

if (!app.includes('LOOKUP_SEARCHERS')) {
  fail('app.config does not provide LOOKUP_SEARCHERS');
}
if (!app.includes("clients:") || !app.includes('fournisseurs:')) {
  fail('LOOKUP_SEARCHERS missing clients/fournisseurs factories');
}

if (!erp.includes('q.length < 2') || !erp.includes('Promise.resolve([])')) {
  fail('partnersByRole does not refuse dump before 2 chars');
}
if (!erp.includes('exactCodeFirst')) {
  fail('exact code-first ranking missing on partnersByRole');
}
if (!erp.includes("displayField: 'raisonSociale'")) {
  fail('partner lookup displayField is not raisonSociale');
}

if (!ctrl.includes('"q"')) {
  fail('PartnerController listByRole has no q param');
}

if (!repo.includes('raisonSociale') || !repo.includes('LOWER(p.code) = LOWER(:q)')) {
  fail('PartnerRepository query does not search code+raisonSociale with exact code first');
}

if (!selectTs.includes('lookupSearch') || !selectTs.includes(', 300)')) {
  fail('nf-select missing lookupSearch or 300ms debounce');
}
if (!selectHtml.includes('Réessayer')) {
  fail('nf-select has no retry control (AC-10)');
}
if (!selectHtml.includes('comboError')) {
  fail('nf-select has no combo error slot');
}
if (!selectHtml.includes('Aucun résultat')) {
  fail('nf-select has no empty-hits message (AC-9)');
}
if (/Créer le partenaire|Créer un partenaire|comboCreate/.test(selectHtml)) {
  fail('combobox HTML still has a Create CTA (AC-9 forbids it)');
}

if (!detailHtml.includes('lookupSearchFn') || !detailHtml.includes('[lookupSearch]')) {
  fail('nf-entity-detail does not pass lookupSearch');
}

const devisFields = read(DEVIS_FIELDS);
const bcFields = read(BC_FIELDS);
if (!devisFields.includes("lookupKey: 'clients'")) {
  fail('devis detail client field has no lookupKey clients (lookup-client-devis)');
}
if (!bcFields.includes("lookupKey: 'fournisseurs'")) {
  fail('BC detail fournisseur field has no lookupKey fournisseurs (lookup-fournisseur-bc)');
}

console.log(
  'PASS  lookup-client-devis / lookup-fournisseur-bc: no dump, q + debounce, LOOKUP_SEARCHERS, retry, no create CTA'
);
