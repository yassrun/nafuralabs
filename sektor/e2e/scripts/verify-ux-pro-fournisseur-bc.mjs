/**
 * SEKTOR-270 / SEKTOR-271 / SEKTOR-272 — Fournisseur catalogue + comparateur + réception BC UX.
 * Run: node sektor/e2e/scripts/verify-ux-pro-fournisseur-bc.mjs
 *
 * Catalogue (SEKTOR-270) : cat-colonne-pas-uuid · cat-form-pas-input-uuid · cat-picker-ouverture-vide
 *   · cat-picker-save · cat-uom-combobox
 * Comparateur + BC (SEKTOR-271) : cmp-pas-uuid · cmp-offres · bc-depot-pas-select
 *   · bc-depot-ouverture-vide · bc-reception-directe
 *
 * Mode B owner for browser/API leg : make -C nafura-platform/ops mode-b
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

const ok = (msg) => console.log(`PASS ${msg}`);

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`missing ${rel}`);
  return fs.readFileSync(abs, 'utf8');
};

const DETAIL_TS = 'sektor/sources/web/app/achats/fournisseurs/fournisseur-detail/fournisseur-detail.page.ts';
const DETAIL_HTML = 'sektor/sources/web/app/achats/fournisseurs/fournisseur-detail/fournisseur-detail.page.html';
const PICKER = 'sektor/sources/web/app/catalogue/components/article-picker/article-picker.component.ts';
const DIALOG =
  'sektor/sources/web/app/etudes/dossiers/components/catalog-item-pick-dialog/catalog-item-pick-dialog.component.ts';
const CMP_TS = 'sektor/sources/web/app/achats/fournisseurs/comparateur/comparateur-fournisseurs.page.ts';
const CMP_HTML = 'sektor/sources/web/app/achats/fournisseurs/comparateur/comparateur-fournisseurs.page.html';
const BC_TS = 'sektor/sources/web/app/achats/commandes/bc-detail/bc-detail.page.ts';
const BC_HTML = 'sektor/sources/web/app/achats/commandes/bc-detail/bc-detail.page.html';

const detailTs = read(DETAIL_TS);
const detailHtml = read(DETAIL_HTML);
const picker = read(PICKER);
const dialog = read(DIALOG);
const cmpTs = read(CMP_TS);
const cmpHtml = read(CMP_HTML);
const bcTs = read(BC_TS);
const bcHtml = read(BC_HTML);

// --- cat-colonne-pas-uuid (AC-1) ---
if (detailHtml.includes('{{ row.articleId }}')) {
  fail('cat-colonne-pas-uuid: table still binds raw articleId');
}
if (!detailTs.includes('articleLabel(') || !detailHtml.includes('articleLabel(row)')) {
  fail('cat-colonne-pas-uuid: articleLabel helper missing');
}
if (!detailTs.includes('resolveArticleLabels')) {
  fail('cat-colonne-pas-uuid: no label resolution for catalogue rows');
}
ok('cat-colonne-pas-uuid AC-1');

// --- cat-form-pas-input-uuid (AC-2) ---
if (/UUID article/i.test(detailHtml) || /placeholder="UUID article"/i.test(detailHtml)) {
  fail('cat-form-pas-input-uuid: UUID article input still present');
}
if (/id="cat-article"[\s\S]{0,120}<input/i.test(detailHtml)) {
  fail('cat-form-pas-input-uuid: cat-article text input still present');
}
if (detailHtml.includes('Article ID')) {
  fail('cat-form-pas-input-uuid: Article ID label still present');
}
ok('cat-form-pas-input-uuid AC-2');

// --- cat-picker-ouverture-vide (AC-3, AC-8) ---
if (!detailTs.includes('openCatalogItemPicker')) {
  fail('cat-picker-ouverture-vide: openCatalogItemPicker not wired');
}
if (!detailTs.includes("context: 'lookup'")) {
  fail('cat-picker-ouverture-vide: picker must use lookup context');
}
if (!detailHtml.includes('cat-article-picker-open')) {
  fail('cat-picker-ouverture-vide: picker CTA testid missing');
}
if (!picker.includes('canSearch()') || !picker.includes('this.armed.set(false)')) {
  fail('cat-picker-ouverture-vide: picker does not start empty before query');
}
if (!detailHtml.includes('cat-empty') || !detailHtml.includes('cat-loading')) {
  fail('cat-picker-ouverture-vide: catalogue empty/loading states missing testids');
}
ok('cat-picker-ouverture-vide AC-3/AC-8');

// --- cat-picker-save (AC-3, AC-4, AC-7) ---
if (!detailHtml.includes('cat-article-label')) {
  fail('cat-picker-save: picked article label chip missing');
}
if (!detailTs.includes('catalogueApi.create') || !detailTs.includes('catalogueApi.update')) {
  fail('cat-picker-save: catalogue CRUD endpoints not preserved');
}
if (!detailTs.includes('draft.articleId')) {
  fail('cat-picker-save: payload must keep articleId');
}
if (!dialog.includes('ArticlePickerComponent')) {
  fail('cat-picker-save: catalog pick dialog missing ArticlePickerComponent');
}
ok('cat-picker-save AC-3/AC-4/AC-7');

// --- cat-uom-combobox (AC-5, AC-6) ---
const uomCount = (detailHtml.match(/lookupKey="unitOfMeasures"/g) ?? []).length;
if (uomCount < 2) {
  fail(`cat-uom-combobox: expected 2 unitOfMeasures comboboxes, got ${uomCount}`);
}
if (!detailTs.includes('searchUnitOfMeasures')) {
  fail('cat-uom-combobox: searchUnitOfMeasures missing');
}
if (/UUID unit_of_measure/i.test(detailHtml) || /Conditionnement UOM \(UUID\)/i.test(detailHtml)) {
  fail('cat-uom-combobox: UUID UOM inputs still present');
}
ok('cat-uom-combobox AC-5/AC-6');

// --- cmp-pas-uuid (AC-9, AC-10) ---
if (/UUID item tenant/i.test(cmpHtml) || /Article \(UUID\)/i.test(cmpHtml)) {
  fail('cmp-pas-uuid: UUID article input still present');
}
if (!cmpTs.includes('openArticlePicker') || !cmpTs.includes('openCatalogItemPicker')) {
  fail('cmp-pas-uuid: article picker not wired');
}
if (!cmpTs.includes("context: 'lookup'")) {
  fail('cmp-pas-uuid: picker must use lookup context');
}
if (!cmpHtml.includes('cmp-article-picker-open') || !cmpHtml.includes('cmp-article-label')) {
  fail('cmp-pas-uuid: picker CTA / label testids missing');
}
if (/placeholder="UUID/i.test(cmpHtml)) {
  fail('cmp-pas-uuid: UUID placeholder still present');
}
ok('cmp-pas-uuid AC-9/AC-10');

// --- cmp-offres (AC-11, AC-12) ---
if (!cmpTs.includes('async comparer') || !cmpTs.includes('this.api.comparer')) {
  fail('cmp-offres: comparer API call missing');
}
if (!cmpTs.includes('fournisseurLabel') || !cmpTs.includes('resolveFournisseurLabels')) {
  fail('cmp-offres: fournisseur label resolution missing');
}
if (cmpHtml.includes('{{ row.fournisseurId }}')) {
  fail('cmp-offres: raw fournisseurId still shown in table');
}
if (!cmpHtml.includes('fournisseurLabel(row)')) {
  fail('cmp-offres: table must bind fournisseurLabel(row)');
}
if (!cmpHtml.includes('Date de référence') || !cmpHtml.includes('type="date"')) {
  fail('cmp-offres: native date field missing');
}
ok('cmp-offres AC-11/AC-12');

// --- bc-depot-pas-select (AC-13) ---
if (/<select[\s\S]{0,200}destLocationId/i.test(bcHtml)) {
  fail('bc-depot-pas-select: native select still bound to destLocationId');
}
if (!bcHtml.includes('lookupKey="locationsDepot"') || !bcHtml.includes('data-testid="bc-rec-depot"')) {
  fail('bc-depot-pas-select: locationsDepot nf-select missing');
}
if (!bcTs.includes('searchLocationsDepot')) {
  fail('bc-depot-pas-select: searchLocationsDepot missing');
}
ok('bc-depot-pas-select AC-13');

// --- bc-depot-ouverture-vide (AC-14) ---
if (/erpLookup\.locations\s*\(\s*\)/.test(bcTs) || bcTs.includes('ensureLocations')) {
  fail('bc-depot-ouverture-vide: still dumps locations() on form open');
}
if (bcTs.includes('readonly locations = signal')) {
  fail('bc-depot-ouverture-vide: locations dump signal still present');
}
if (!bcTs.includes("lookupSearchers?.['locationsDepot']")) {
  fail('bc-depot-ouverture-vide: must use LOOKUP_SEARCHERS locationsDepot');
}
ok('bc-depot-ouverture-vide AC-14');

// --- bc-reception-directe (AC-15, AC-16) ---
if (!bcHtml.includes('Livraison directe chantier — sans magasin')) {
  fail('bc-reception-directe: empty depot placeholder missing');
}
if (!bcTs.includes('createReception') || !bcTs.includes('submitReception')) {
  fail('bc-reception-directe: reception submit flow missing');
}
if (!bcTs.includes('Réception directe chantier — sans magasin')) {
  fail('bc-reception-directe: direct delivery success toast missing');
}
if (!bcHtml.includes('Valider réception') || !bcHtml.includes('bc-rec-qty-input')) {
  fail('bc-reception-directe: reception line qty inputs missing');
}
ok('bc-reception-directe AC-15/AC-16');

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

/** Optional API leg — catalogue POST keeps articleId when Mode B up. */
async function assertCatalogueApiOptional() {
  let sessionRes;
  try {
    sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, { method: 'POST' });
  } catch {
    console.log('SKIP cat-picker-save API — Mode B not running');
    return null;
  }
  if (!sessionRes.ok) {
    console.log('SKIP cat-picker-save API — cursor-session unavailable');
    return null;
  }
  return sessionRes.json();
}

async function assertComparateurApiOptional(session) {
  if (!session) {
    console.log('SKIP cmp-offres API — Mode B not running');
    return;
  }
  const h = {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    Accept: 'application/json',
  };

  const items = await json(await fetch(`${API_BASE}/api/v1/items?page=0&size=5`, { headers: h }));
  const itemRows = Array.isArray(items.body)
    ? items.body
    : items.body?.content ?? items.body?.items ?? [];
  const article = itemRows.find((r) => r?.isActive !== false && r?.id);
  if (!article?.id) {
    console.log('SKIP cmp-offres API — no active article');
    return;
  }

  const cmp = await json(
    await fetch(
      `${API_BASE}/api/v1/catalogue-fournisseur/comparateur?articleId=${encodeURIComponent(article.id)}`,
      { headers: h },
    ),
  );
  if (!cmp.ok) {
    fail(`cmp-offres API: comparateur ${cmp.status} ${cmp.text}`);
  }
  if (!Array.isArray(cmp.body)) {
    fail('cmp-offres API: comparateur must return an array');
  }
  ok('cmp-offres API AC-11');
}

async function assertBcReceptionApiOptional(session) {
  if (!session) {
    console.log('SKIP bc-reception-directe API — Mode B not running');
    return;
  }
  const h = {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const locationsNoQ = await json(await fetch(`${API_BASE}/api/v1/locations`, { headers: h }));
  if (locationsNoQ.ok && Array.isArray(locationsNoQ.body) && locationsNoQ.body.length > 0) {
    console.log('NOTE bc-depot-ouverture-vide API: GET /locations without q returns data — UI must not call it');
  }

  const bcs = await json(
    await fetch(`${API_BASE}/api/v1/bons-commande?page=0&size=20`, { headers: h }),
  );
  const bcRows = Array.isArray(bcs.body)
    ? bcs.body
    : bcs.body?.content ?? bcs.body?.items ?? [];
  const bc = bcRows.find((row) => {
    const lignes = row?.lignes ?? [];
    return lignes.some((l) => (l?.quantite ?? 0) - (l?.quantiteLivree ?? 0) > 0);
  });
  if (!bc?.id) {
    console.log('SKIP bc-reception-directe API — no BC with remaining qty');
    return;
  }

  const lignes = (bc.lignes ?? [])
    .map((l) => ({
      bonCommandeLigneId: l.id,
      articleId: l.articleId,
      quantiteRecue: Math.max(0, (l.quantite ?? 0) - (l.quantiteLivree ?? 0)),
    }))
    .filter((l) => l.quantiteRecue > 0);
  if (!lignes.length) {
    console.log('SKIP bc-reception-directe API — no receivable lines');
    return;
  }

  const created = await json(
    await fetch(`${API_BASE}/api/v1/bons-commande/${bc.id}/receptions`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        dateReception: new Date().toISOString().slice(0, 10),
        blNumero: `QA-271-${Date.now()}`,
        lignes,
      }),
    }),
  );
  if (!created.ok || !created.body?.id) {
    fail(`bc-reception-directe API: POST reception ${created.status} ${created.text}`);
  }
  ok('bc-reception-directe API AC-16');
}

const session = await assertCatalogueApiOptional();
if (session) {
  const h = {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const partners = await json(
    await fetch(`${API_BASE}/api/v1/partners?role=FOURNISSEUR&page=0&size=5`, { headers: h }),
  );
  if (partners.ok) {
    const partnerRows = Array.isArray(partners.body)
      ? partners.body
      : partners.body?.content ?? partners.body?.items ?? [];
    const fournisseur = partnerRows.find((p) => p?.isActive !== false);
    const items = await json(await fetch(`${API_BASE}/api/v1/items?page=0&size=5`, { headers: h }));
    const itemRows = Array.isArray(items.body)
      ? items.body
      : items.body?.content ?? items.body?.items ?? [];
    const article = itemRows.find((r) => r?.isActive !== false && r?.id);

    if (fournisseur?.id && article?.id) {
      const suffix = Date.now();
      const payload = {
        fournisseurId: fournisseur.id,
        articleId: article.id,
        designation: article.name || `QA cat ${suffix}`,
        prixUnitaireHt: 12.5,
        actif: true,
      };
      const created = await json(
        await fetch(`${API_BASE}/api/v1/catalogue-fournisseur`, {
          method: 'POST',
          headers: h,
          body: JSON.stringify(payload),
        }),
      );
      if (created.ok && created.body?.id) {
        if (created.body.articleId !== article.id) {
          fail('cat-picker-save API: articleId not persisted');
        }
        await fetch(`${API_BASE}/api/v1/catalogue-fournisseur/${created.body.id}`, {
          method: 'DELETE',
          headers: h,
        });
        ok('cat-picker-save API AC-7');
      }
    }
  }
}

await assertComparateurApiOptional(session);
await assertBcReceptionApiOptional(session);
console.log('verify-ux-pro-fournisseur-bc: all checks done');
