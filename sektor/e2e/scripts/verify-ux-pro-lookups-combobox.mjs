/**
 * SEKTOR-251 + SEKTOR-252 + SEKTOR-253 — combobox anatomy + client/fournisseur P0 + reste lookups (AC-1..AC-12).
 * Platform scenarios: grep/source + wiring checks (no browser).
 *
 * Scénarios CONTRAT couverts ici (platform) :
 *   lookup-ouverture-vide · lookup-recherche-code-exact · lookup-clavier
 *   lookup-oeil-fiche · lookup-oeil-liste-si-vide · lookup-enum-sans-oeil
 *   lookup-aucun-resultat · lookup-erreur-reseau
 *   lookup-client-devis · lookup-fournisseur-bc · lookup-filtre-listing (chantier)
 *   lookup-filtre-listing AC-12 (employé, dépôt, devis, facture, mouvements)
 *
 * AC-13+ : hors scope exec 253.
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

const UTIL =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/lookup-combobox.util.ts';
const UTIL_SPEC =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/lookup-combobox.util.spec.ts';
const SELECT_HTML =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/select.component.html';
const SELECT_TS =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/select.component.ts';
const SELECT_SPEC =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/select/select.component.spec.ts';
const DETAIL_HTML =
  'nafura-platform/sources/web/lib/anatomy/components/organisms/entity-detail/entity-detail.component.html';
const APP = 'sektor/sources/web/app/socle/app.config.ts';
const ERP = 'sektor/sources/web/app/socle/shared/services/erp-lookup.service.ts';
const SEARCHERS = 'sektor/sources/web/app/socle/shared/services/erp-lookup-searchers.ts';
const ROUTES = 'sektor/sources/web/app/socle/shared/config/erp-lookup-list-routes.ts';
const CTRL =
  'sektor/sources/backend/achats/src/main/java/ma/nafura/achats/api/controller/PartnerController.java';
const PARTNER_SVC =
  'sektor/sources/backend/achats/src/main/java/ma/nafura/achats/service/PartnerService.java';
const REPO =
  'sektor/sources/backend/achats/src/main/java/ma/nafura/achats/repository/PartnerRepository.java';
const TS_SPEC = 'sektor/sources/web/tsconfig.spec.json';

const util = read(UTIL);
const utilSpec = read(UTIL_SPEC);
const selectHtml = read(SELECT_HTML);
const selectTs = read(SELECT_TS);
read(SELECT_SPEC);
const detailHtml = read(DETAIL_HTML);
const app = read(APP);
const erp = read(ERP);
const searchers = read(SEARCHERS);
const routes = read(ROUTES);
const ctrl = read(CTRL);
const repo = read(REPO);
const partnerSvc = read(PARTNER_SVC);
const tsSpec = read(TS_SPEC);

// AC-1 — lookupKey → combobox (input + list), not native select dump
if (!selectHtml.includes('role="combobox"')) {
  fail('AC-1: nf-select has no combobox input');
}
if (!selectTs.includes('isCombobox()') || !selectTs.includes('lookupKey')) {
  fail('AC-1: nf-select does not branch on lookupKey');
}
if (!detailHtml.includes('field.lookupKey') || !detailHtml.includes('nf-select')) {
  fail('AC-1: nf-entity-detail does not render nf-select for lookupKey fields');
}
if (!detailHtml.includes('@else') || !detailHtml.includes('mat-select')) {
  fail('AC-1: enum fields must stay on native mat-select');
}

// AC-2 — no dump on open; min 2 chars; resolve-by-id via label fallback (not collection GET)
if (!util.includes('LOOKUP_COMBO_MIN_CHARS = 2')) {
  fail('AC-2: min query is not 2');
}
if (!util.includes('filterLookupHits') || !util.includes('return []')) {
  fail('AC-2: filterLookupHits missing empty-before-min');
}
if (!selectTs.includes('lookupSearch')) {
  fail('AC-2: nf-select missing lookupSearch server path');
}
if (!searchers.includes('term.length < 2')) {
  fail('AC-2: LOOKUP_SEARCHERS refuse dump before 2 chars');
}
if (!util.includes('lookupDisplayLabel') || !util.includes('LOOKUP_ORPHAN_LABEL')) {
  fail('AC-2/AC-14: resolve-by-id fallback label missing');
}
if (!selectTs.includes('selectedLabel') || !selectTs.includes('syncDisplayOptions')) {
  fail('AC-2: nf-select does not resolve pre-set value label without dump');
}

// AC-3 — debounced server search; partners code + raison sociale; exact code first
if (!selectTs.includes(', 300)')) {
  fail('AC-3: nf-select missing 300ms debounce');
}
if (!erp.includes('q.length < 2') || !erp.includes('Promise.resolve([])')) {
  fail('AC-3: partnersByRole does not refuse dump before 2 chars');
}
if (!erp.includes('exactCodeFirst')) {
  fail('AC-3: exact code-first ranking missing on partnersByRole');
}
if (!erp.includes("displayField: 'raisonSociale'")) {
  fail('AC-3: partner lookup displayField is not raisonSociale');
}
if (!ctrl.includes('"q"')) {
  fail('AC-3: PartnerController listByRole has no q param');
}
if (!partnerSvc.includes('rankExactCodeFirst')) {
  fail('AC-3: PartnerService missing exact code-first ranking for q search');
}
if (!repo.includes('raisonSociale') || !repo.includes('LOWER(p.code) LIKE LOWER(CONCAT')) {
  fail('AC-3: PartnerRepository query does not search code+raisonSociale');
}
if (!searchers.includes('partnerSelectOptions')) {
  fail('AC-3: partner hits must expose code — label via partnerSelectOptions');
}

// AC-4 — hit rows: code + label (not raw UUID)
if (!utilSpec.includes('FRN-0142')) {
  fail('AC-4: util spec missing code+label hit fixture');
}

// AC-5 — keyboard nav
for (const token of [
  'onComboKeydown',
  "event.key === 'ArrowDown'",
  "event.key === 'ArrowUp'",
  "event.key === 'Enter'",
  "event.key === 'Escape'",
]) {
  if (!selectTs.includes(token)) {
    fail(`AC-5: keyboard combobox behavior missing: ${token}`);
  }
}

// AC-6 — eye with value → fiche /{id}
if (!util.includes('resolveLookupEyeRoute') || !util.includes('${list}/${id}')) {
  fail('AC-6: eye fiche path `{list}/{id}` missing');
}
if (!selectTs.includes('effectiveEyeRoute') || !selectTs.includes('Voir la fiche')) {
  fail('AC-6: nf-select eye fiche route/label missing');
}

// AC-7 — eye empty → list
if (!selectTs.includes('Voir la liste')) {
  fail('AC-7: eye empty-field opens listing label missing');
}

// AC-8 — no eye on enum / missing route
if (!selectTs.includes('hasListShortcut') || !selectTs.includes('effectiveListRoute')) {
  fail('AC-8: eye gated on list route presence');
}
if (!utilSpec.includes('resolveLookupEyeRoute(undefined')) {
  fail('AC-8: util spec missing no-route eye case');
}

// AC-9 — empty hits message, no create CTA
if (!selectHtml.includes('Aucun résultat')) {
  fail('AC-9: nf-select has no empty-hits message');
}
if (/Créer le partenaire|Créer un partenaire|comboCreate/.test(selectHtml)) {
  fail('AC-9: combobox HTML still has a Create CTA');
}

// AC-10 — network error + retry, value preserved
if (!selectHtml.includes('Réessayer')) {
  fail('AC-10: nf-select has no retry control');
}
if (!selectHtml.includes('comboError')) {
  fail('AC-10: nf-select has no combo error slot');
}
if (!selectTs.includes('comboError.set') || !selectTs.includes('Impossible de charger')) {
  fail('AC-10: nf-select missing error handling on lookupSearch failure');
}

// Sektor wiring foundation
if (!app.includes('LOOKUP_LIST_ROUTES') || !app.includes('ERP_LOOKUP_LIST_ROUTES')) {
  fail('app.config does not provide LOOKUP_LIST_ROUTES from ERP_LOOKUP_LIST_ROUTES');
}
if (!app.includes('LOOKUP_SEARCHERS') || !app.includes('buildErpLookupSearchers')) {
  fail('app.config does not wire LOOKUP_SEARCHERS');
}
if (!detailHtml.includes('lookupSearchFn') || !detailHtml.includes('[lookupSearch]')) {
  fail('nf-entity-detail does not pass lookupSearch');
}

// Every searcher key (except items) must have a list route for the eye
const returnBlock = searchers.slice(searchers.lastIndexOf('return {'));
const searcherKeys = [...returnBlock.matchAll(/^\s{4}(\w+)\s*,?\s*$/gm)].map((m) => m[1]);
for (const key of searcherKeys) {
  if (key === 'items') continue;
  if (!routes.includes(`${key}:`)) {
    fail(`ERP_LOOKUP_LIST_ROUTES missing list route for searcher key ${key}`);
  }
}
if (!routes.includes('clients:') || !routes.includes('fournisseurs:')) {
  fail('ERP_LOOKUP_LIST_ROUTES missing clients/fournisseurs');
}

// AC-11 — client / fournisseur on P0 screens (no dump selects)
const DEVIS = 'sektor/sources/web/app/etudes/devis/services/devis.facade.ts';
const BC = 'sektor/sources/web/app/achats/commandes/services/bc.facade.ts';
const CONTRAT_FACADE = 'sektor/sources/web/app/achats/contrats/services/contrat.facade.ts';
const CH_CREATE = 'sektor/sources/web/app/chantiers/create/chantier-create.page.ts';
const CH_EDIT = 'sektor/sources/web/app/chantiers/edit/chantier-edit.page.ts';
const CONSULT_CREATE = 'sektor/sources/web/app/achats/consultations/consultation-create/consultation-create.page.ts';
const CONSULT_CREATE_HTML =
  'sektor/sources/web/app/achats/consultations/consultation-create/consultation-create.page.html';
const CLIENT_SELECT =
  'sektor/sources/web/app/socle/shared/components/client-partner-select/client-partner-select.component.ts';
const DEVIS_FIELDS = 'sektor/sources/web/app/etudes/devis/config/detail/fields.ts';
const BC_FIELDS = 'sektor/sources/web/app/achats/commandes/config/detail/fields.ts';
const CONTRAT_FIELDS = 'sektor/sources/web/app/achats/contrats/config/detail/fields.ts';
const SITUATION_FILTERS = 'sektor/sources/web/app/chantiers/situations/config/listing/filters.ts';
const SITUATION_LISTING_HTML =
  'sektor/sources/web/app/chantiers/situations/situation-listing/situation-listing.page.html';
const SITUATION_LISTING_TS =
  'sektor/sources/web/app/chantiers/situations/situation-listing/situation-listing.page.ts';
const AVANCEMENT_FILTERS =
  'sektor/sources/web/app/chantiers/avancements/config/listing/filters.ts';
const AVANCEMENT_FACADE =
  'sektor/sources/web/app/chantiers/avancements/services/avancement.facade.ts';

const devis = read(DEVIS);
const bcFacade = read(BC);
const contratFacade = read(CONTRAT_FACADE);
const chCreate = read(CH_CREATE);
const chEdit = read(CH_EDIT);
const consultCreate = read(CONSULT_CREATE);
const consultCreateHtml = read(CONSULT_CREATE_HTML);
const clientSelect = read(CLIENT_SELECT);
const devisFields = read(DEVIS_FIELDS);
const bcFields = read(BC_FIELDS);
const contratFields = read(CONTRAT_FIELDS);
const situationFilters = read(SITUATION_FILTERS);
const situationListingHtml = read(SITUATION_LISTING_HTML);
const situationListingTs = read(SITUATION_LISTING_TS);
const avancementFilters = read(AVANCEMENT_FILTERS);
const avancementFacade = read(AVANCEMENT_FACADE);

for (const [label, src] of [
  ['devis.facade', devis],
  ['bc.facade', bcFacade],
  ['contrat.facade', contratFacade],
]) {
  if (src.includes('pageSize: 500') || src.includes('pageSize: 200')) {
    fail(`${label} still dumps partners with pageSize 200/500`);
  }
}

if (/partnersByRole\(\s*'CLIENT'\s*\)/.test(devis + clientSelect)) {
  fail('devis/client-select still dumps partnersByRole(CLIENT) without q');
}
if (!devis.includes('clients: []')) {
  fail('devis.facade ensureLookups does not seed clients: []');
}

if (/partnersByRole\(\s*'FOURNISSEUR'\s*\)/.test(bcFacade + contratFacade + consultCreate)) {
  fail('BC/contrat/consultation still dumps partnersByRole(FOURNISSEUR) without q');
}
if (!bcFacade.includes('fournisseurs: []') || !contratFacade.includes('fournisseurs: []')) {
  fail('BC/contrat ensureLookups does not seed fournisseurs: []');
}

if (consultCreate.includes('getAll({ page: 0, pageSize: 200') || consultCreate.includes('pageSize: 200')) {
  fail('consultation-create still dumps fournisseurs getAll pageSize 200');
}
if (!consultCreate.includes('lookupKey="fournisseurs"') && !consultCreateHtml.includes('lookupKey="fournisseurs"')) {
  fail('consultation-create missing nf-select lookupKey fournisseurs');
}
if (!consultCreate.includes('searchFournisseurs') && !consultCreateHtml.includes('[lookupSearch]')) {
  fail('consultation-create missing lookupSearch on fournisseur combobox');
}
if (/<select[^>]*fournisseur/i.test(consultCreateHtml)) {
  fail('consultation-create still uses native select for fournisseur');
}

if (!clientSelect.includes('[lookupSearch]') || !clientSelect.includes('searchClients')) {
  fail('client-partner-select missing lookupSearch combobox wiring');
}

if (!devisFields.includes("lookupKey: 'clients'")) {
  fail('devis detail client field has no lookupKey clients (lookup-client-devis)');
}
if (!bcFields.includes("lookupKey: 'fournisseurs'")) {
  fail('BC detail fournisseur field has no lookupKey fournisseurs (lookup-fournisseur-bc)');
}
if (!contratFields.includes("lookupKey: 'fournisseurs'")) {
  fail('contrat detail fournisseur field has no lookupKey fournisseurs');
}

if (!chCreate.includes('searchClients') || !chEdit.includes('searchClients')) {
  fail('chantier create/edit missing searchClients typeahead');
}
if (!chCreate.includes('[lookupSearch]') || !chEdit.includes('[lookupSearch]')) {
  fail('chantier create/edit nf-select missing lookupSearch');
}
if (/partnersByRole\(\s*'CLIENT'\s*\)/.test(chCreate + chEdit)) {
  fail('chantier create/edit still dumps partnersByRole(CLIENT) without q');
}

if (!situationFilters.includes("lookupKey: 'chantiers'")) {
  fail('situation listing filters missing lookupKey chantiers');
}
if (!situationListingHtml.includes('lookupKey="chantiers"') || !situationListingHtml.includes('[lookupSearch]')) {
  fail('situation listing toolbar missing chantier combobox');
}
if (!situationListingTs.includes('searchChantiers')) {
  fail('situation listing missing searchChantiers lookup fn');
}

if (!avancementFilters.includes("lookupKey: 'chantiers'")) {
  fail('avancement listing filters missing lookupKey chantiers');
}
if (!avancementFacade.includes('chantiers: []')) {
  fail('avancement.facade ensureLookups does not seed chantiers: [] for combobox filter');
}

// AC-12 — reste lookupKeys + filtres listing (no dump 200/500)
const ERP_LOOKUP = 'sektor/sources/web/app/socle/shared/services/erp-lookup.service.ts';
const AVANCEMENT_CTX =
  'sektor/sources/web/app/chantiers/avancements/services/avancement-context.service.ts';
const AVANCEMENT_SAISIE_TS =
  'sektor/sources/web/app/chantiers/avancements/avancement-saisie/avancement-saisie.page.ts';
const AVANCEMENT_SAISIE_HTML =
  'sektor/sources/web/app/chantiers/avancements/avancement-saisie/avancement-saisie.page.html';
const INVENTORY_LOOKUPS = 'sektor/sources/web/app/catalogue/services/inventory-lookups.service.ts';
const SORTIE_FACADE = 'sektor/sources/web/app/catalogue/mouvements/sorties/services/sortie.facade.ts';
const INVENTAIRE_FACADE =
  'sektor/sources/web/app/catalogue/mouvements/inventaires/services/inventaire.facade.ts';
const INVENTORY_TX_PANEL =
  'sektor/sources/web/app/catalogue/mouvements/inventory-txes/services/inventory-tx-panel.facade.ts';
const ALERTES_FACADE =
  'sektor/sources/web/app/catalogue/suivi/alertes/services/alertes-reappro.facade.ts';
const PAIE_FACADE = 'sektor/sources/web/app/rh/paie/services/paie.facade.ts';
const CONGE_FACADE = 'sektor/sources/web/app/rh/conges/services/conge.facade.ts';
const AVOIR_FACADE = 'sektor/sources/web/app/ventes/avoirs/services/avoir.facade.ts';
const AOC_FACADE = 'sektor/sources/web/app/etudes/appels-offres-clients/services/aoc.facade.ts';
const INVENTORY_TX_FILTERS =
  'sektor/sources/web/app/catalogue/mouvements/inventory-txes/config/listing/filters.ts';

const erpLookup = read(ERP_LOOKUP);
const avancementCtx = read(AVANCEMENT_CTX);
const avancementSaisieTs = read(AVANCEMENT_SAISIE_TS);
const avancementSaisieHtml = read(AVANCEMENT_SAISIE_HTML);
read(INVENTORY_LOOKUPS);
const sortieFacade = read(SORTIE_FACADE);
const inventaireFacade = read(INVENTAIRE_FACADE);
const inventoryTxPanel = read(INVENTORY_TX_PANEL);
const alertesFacade = read(ALERTES_FACADE);
const paieFacade = read(PAIE_FACADE);
const congeFacade = read(CONGE_FACADE);
const avoirFacade = read(AVOIR_FACADE);
const aocFacade = read(AOC_FACADE);
const inventoryTxFilters = read(INVENTORY_TX_FILTERS);

if (
  !erpLookup.includes('chantiers(search?: string)') ||
  !/chantiers\(search\?\: string\)[\s\S]*?if \(q\.length < 2\)/.test(erpLookup) ||
  !/locations\(search\?\: string\)[\s\S]*?if \(q\.length < 2\)/.test(erpLookup) ||
  !/partnersByRole[\s\S]*?if \(q\.length < 2\)/.test(erpLookup)
) {
  fail('AC-12: erp-lookup.service still dumps chantiers/locations/partners without q');
}
if (avancementCtx.includes('pageSize: 500') || avancementCtx.includes('pageSize: 200')) {
  fail('AC-12: avancement-context still dumps chantiers/employes');
}
if (!avancementSaisieHtml.includes('lookupKey="chantiers"') || !avancementSaisieHtml.includes('[lookupSearch]')) {
  fail('AC-12: avancement-saisie missing chantier combobox');
}
if (/<select[^>]*chantier/i.test(avancementSaisieHtml)) {
  fail('AC-12: avancement-saisie still uses native select for chantier');
}
if (!avancementSaisieTs.includes('searchChantiers')) {
  fail('AC-12: avancement-saisie missing searchChantiers lookup fn');
}

for (const [label, src, key] of [
  ['sortie.facade', sortieFacade, 'sourceLocations: []'],
  ['inventaire.facade', inventaireFacade, 'allLocations: []'],
  ['inventory-tx-panel.facade', inventoryTxPanel, 'locations: []'],
  ['alertes-reappro.facade', alertesFacade, 'locations: []'],
  ['paie.facade', paieFacade, 'employes: []'],
  ['conge.facade', congeFacade, 'employes: []'],
  ['avoir.facade', avoirFacade, 'factures: []'],
  ['aoc.facade', aocFacade, 'devis: []'],
  ['facture.facade', read('sektor/sources/web/app/ventes/factures/services/facture.facade.ts'), 'chantiers: []'],
]) {
  if (!src.includes(key)) {
    fail(`AC-12: ${label} does not seed ${key} for combobox filter`);
  }
}
if (sortieFacade.includes('loadLocations()')) {
  fail('AC-12: sortie.facade still dumps locations via loadLocations()');
}
if (!inventoryTxFilters.includes("lookupKey: 'locations'")) {
  fail('AC-12: inventory-tx listing filters missing lookupKey locations');
}
if (!searchers.includes('employes') || !searchers.includes('devis') || !searchers.includes('factures')) {
  fail('AC-12: LOOKUP_SEARCHERS missing employes/devis/factures typeahead');
}

// Live API (Mode B) — partners q param when backend is up
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
let liveApiNote = 'skipped (Mode B down)';
try {
  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  if (sessionRes.ok) {
    const session = await sessionRes.json();
    const h = {
      Authorization: `Bearer ${session.accessToken}`,
      'X-Tenant-Id': session.tenantId,
      Accept: 'application/json',
    };
    const shortQ = await fetch(
      `${API_BASE}/api/v1/partners?role=CLIENT&page=0&size=50&q=a`,
      { headers: h },
    );
    if (!shortQ.ok) {
      fail(`live API partners q=a returned ${shortQ.status} (backend q search required)`);
    } else {
    const shortBody = await shortQ.json();
    const items = shortBody.items ?? shortBody.content ?? [];
    if (!Array.isArray(items)) {
      fail('live API partners q response is not an array');
    }
    const emptyQ = await fetch(
      `${API_BASE}/api/v1/partners?role=FOURNISSEUR&page=0&size=50`,
      { headers: h },
    );
    if (emptyQ.ok) {
      const emptyBody = await emptyQ.json();
      const allItems = emptyBody.items ?? emptyBody.content ?? [];
      if (Array.isArray(allItems) && allItems.length > 50) {
        fail('live API partners without q still returns dump > 50 (AC-2 backend)');
      }
    }
    liveApiNote = `partners q ok (${items.length} hit(s) for q=a)`;
    }
  }
} catch {
  // Mode B optional — source assertions above are the gate
}

// Platform unit tests wired into Sektor karma
if (
  !tsSpec.includes('lookup-combobox.util.spec.ts') &&
  !tsSpec.includes('select/**/*.spec.ts')
) {
  fail('tsconfig.spec.json does not include platform lookup combobox specs');
}

console.log(
  `PASS  SEKTOR-251/252/253 AC-1..AC-12: combobox anatomy, no dump, debounced search, clavier, oeil, P0 + reste lookups, routes + wiring (${liveApiNote})`
);
