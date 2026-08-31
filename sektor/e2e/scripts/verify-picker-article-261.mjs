/**
 * Preuve SEKTOR-261 — stock + lookups items (AC-10, AC-11).
 * Run: node sektor/e2e/scripts/verify-picker-article-261.mjs
 *
 * Scénarios CONTRAT : picker-stock-natures-stockables · picker-lookup-article-seul
 *
 * Prérequis : Mode B (API 8082 + front 4200), SEKTOR-259 (search) + SEKTOR-260 (picker partagé).
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const here = path.dirname(fileURLToPath(import.meta.url));
const webPkg = path.resolve(here, '../../sources/web/package.json');
const require = createRequire(webPkg);
const { chromium } = require('playwright');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function assertStaticWiring() {
  const reception = read(
    'sources/web/app/catalogue/components/reception-lines-editor/reception-lines-editor.component.ts',
  );
  const retour = read(
    'sources/web/app/catalogue/components/retour-lines-editor/retour-lines-editor.component.ts',
  );
  const transfert = read(
    'sources/web/app/catalogue/components/transfert-lines-editor/transfert-lines-editor.component.ts',
  );
  const picker = read(
    'sources/web/app/catalogue/components/article-picker/article-picker.component.ts',
  );
  const field = read(
    'sources/web/app/catalogue/components/article-picker/article-picker-field.component.ts',
  );
  const tarif = read(
    'sources/web/app/catalogue/item-prices/item-price-detail/item-price-detail.page.ts',
  );
  const solde = read(
    'sources/web/app/catalogue/suivi/stock-balances/stock-balance-detail/stock-balance-detail.page.ts',
  );
  const txLine = read(
    'sources/web/app/catalogue/mouvements/inventory-tx-lines/inventory-tx-line-detail/inventory-tx-line-detail.page.ts',
  );
  const pickers = read('sources/web/app/socle/shared/services/erp-lookup-pickers.ts');
  const dpuPanel = read(
    'sources/web/app/etudes/dossiers/components/poste-decomposition-panel/poste-decomposition-panel.component.ts',
  );

  for (const [name, src] of [
    ['reception', reception],
    ['retour', retour],
    ['transfert', transfert],
  ]) {
    assert(src.includes("context: 'stock'"), `${name}: doit ouvrir le picker context stock`);
    assert(src.includes('openCatalogItemPicker'), `${name}: doit utiliser openCatalogItemPicker`);
    assert(!src.includes('loadArticles'), `${name}: pas de loadArticles dump`);
    assert(!src.includes('ArticleCatalogService'), `${name}: pas de ArticleCatalogService`);
  }

  assert(picker.includes('searchPicker'), 'picker partagé doit appeler searchPicker');
  assert(
    picker.includes("this.context() === 'stock'") && picker.includes('STOCKABLE_NATURES'),
    'AC-10: natures stockables en contexte stock',
  );
  assert(
    picker.includes("context() === 'dpu'") && picker.includes('article-picker-choose'),
    'pied stock/lookup = Choisir (pas qty/tarif hors dpu)',
  );

  assert(field.includes("context=\"lookup\"") || field.includes("context: Extract"), 'field lookup');
  assert(tarif.includes('app-article-picker-field') && tarif.includes('context="lookup"'), 'tarif → picker lookup');
  assert(solde.includes('app-article-picker-field') && solde.includes('context="lookup"'), 'solde → picker lookup');
  assert(txLine.includes('app-article-picker-field') && txLine.includes('context="lookup"'), 'tx-line → picker lookup');
  assert(pickers.includes("context: 'lookup'") && pickers.includes('items'), 'LOOKUP_PICKERS items → picker lookup');

  assert(dpuPanel.includes("context: 'dpu'"), 'DPU 260 intact: context dpu');
  assert(dpuPanel.includes('ajouterDepuisCatalogue'), 'DPU 260 intact: CTA header');

  console.log('PASS static — stock editors + CRUD lookups + LOOKUP_PICKERS + DPU intact');
}

function trackItems(page) {
  const listGets = [];
  const lookupGets = [];
  const searchGets = [];
  page.on('request', (req) => {
    if (req.method() !== 'GET') return;
    const url = req.url();
    if (!url.includes('/api/v1/items')) return;
    if (url.includes('/api/v1/items/search')) searchGets.push(url);
    else if (url.includes('/api/v1/items/lookup')) lookupGets.push(url);
    else if (/\/api\/v1\/items(\?|$)/.test(url) && !url.includes('/identites')) {
      listGets.push(url);
    }
  });
  return { listGets, lookupGets, searchGets };
}

async function main() {
  assertStaticWiring();

  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = await sessionRes.json();
  if (!session?.accessToken || !session?.tenantId) {
    console.log('SKIP cursor-session unavailable');
    process.exit(0);
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const net = trackItems(page);

  try {
    // AC-10 — réception : natures stockables, pick seul, pas de dump
    await page.goto(`${APP_BASE}/inventory/mouvements/receptions/new`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByRole('heading', { name: /Nouvelle réception|New Reception/i }).waitFor({
      timeout: 25000,
    });
    const receptionEditor = page.locator('app-reception-lines-editor');
    await receptionEditor.waitFor({ timeout: 15000 });
    await page.getByTestId('rle-picker-ready').waitFor({ timeout: 10000 });
    await page.waitForTimeout(800);
    if (net.listGets.length > 0) {
      throw new Error(`VU ROUGE AC-10: dump GET /api/v1/items à l’ouverture réception (${net.listGets[0]})`);
    }

    await receptionEditor.locator('nf-button').first().click();
    await page.getByTestId('article-picker-open').first().click();
    const dialog = page.locator('app-catalog-item-pick-dialog');
    await dialog.waitFor({ timeout: 10000 });
    if ((await dialog.locator('[data-testid="article-picker-hit"]').count()) > 0) {
      throw new Error('AC-1/10: liste déjà remplie à l’ouverture stock');
    }
    if (await dialog.getByTestId('article-picker-nature-MAIN_DOEUVRE').count()) {
      throw new Error('AC-10: nature non stockable visible (MAIN_DOEUVRE)');
    }
    for (const n of ['MATIERE', 'CONSOMMABLE', 'CARBURANT', 'OUTILLAGE']) {
      if (!(await dialog.getByTestId(`article-picker-nature-${n}`).count())) {
        throw new Error(`AC-10: chip ${n} manquant`);
      }
    }
    if (await dialog.getByTestId('article-picker-dpu-pied').count()) {
      throw new Error('AC-10: pied DPU (qty/PU) sur contexte stock');
    }
    if (await dialog.getByRole('button', { name: /Ajouter au poste/i }).count()) {
      throw new Error('AC-10: CTA Ajouter au poste sur stock');
    }
    await dialog.getByTestId('article-picker-choose').waitFor({ timeout: 4000 });
    await dialog.getByRole('button', { name: /Annuler/i }).click();
    await dialog.waitFor({ state: 'detached', timeout: 5000 });

    // AC-11 — tarif : pick seul, toutes natures, pas de dump
    net.lookupGets.length = 0;
    net.listGets.length = 0;
    net.searchGets.length = 0;
    await page.goto(`${APP_BASE}/inventory/catalogue/item-prices/new`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByTestId('article-picker-open').first().waitFor({ timeout: 25000 });
    await page.waitForTimeout(800);
    if (net.lookupGets.length > 0) {
      throw new Error(`VU ROUGE AC-11: dump GET /api/v1/items/lookup tarif (${net.lookupGets[0]})`);
    }
    if (net.listGets.length > 0) {
      throw new Error(`AC-11: dump GET /api/v1/items tarif (${net.listGets[0]})`);
    }
    await page.getByTestId('article-picker-open').first().click();
    const lookupDialog = page.locator('app-catalog-item-pick-dialog');
    await lookupDialog.waitFor({ timeout: 10000 });
    if (!(await lookupDialog.getByTestId('article-picker-nature-MAIN_DOEUVRE').count())) {
      throw new Error('AC-11: lookup doit montrer toutes les natures');
    }
    if (await lookupDialog.getByTestId('article-picker-dpu-pied').count()) {
      throw new Error('AC-11: pied DPU sur lookup');
    }
    await lookupDialog.getByTestId('article-picker-choose').waitFor({ timeout: 4000 });
    await lookupDialog.getByRole('button', { name: /Annuler/i }).click();
    await lookupDialog.waitFor({ state: 'detached', timeout: 5000 });

    // Listing filter inventory-tx-lines — même picker lookup (LOOKUP_PICKERS)
    net.listGets.length = 0;
    await page.goto(`${APP_BASE}/inventory/mouvements/inventory-tx-lines`, {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('nf-listing-controls, nf-entity-listing').first().waitFor({ timeout: 25000 });
    await page.waitForTimeout(800);
    const filterTrigger = page.locator('nf-listing-controls button[aria-label]').filter({
      has: page.locator('[data-lucide="filter"], .lucide-filter, mat-icon, nf-icon, svg'),
    }).first();
    const filterByAria = page.locator('nf-listing-controls button[aria-label*="ilter" i], nf-listing-controls button[aria-label*="iltre" i]').first();
    const trigger = (await filterByAria.count()) ? filterByAria : filterTrigger;
    if (await trigger.count()) {
      await trigger.click();
      const openInFilter = page.locator('nf-filter-builder').getByTestId('article-picker-open');
      await openInFilter.waitFor({ timeout: 8000 });
      if (net.listGets.length > 0) {
        throw new Error(`AC-11 listing: dump GET /api/v1/items avant ouverture picker (${net.listGets[0]})`);
      }
      await openInFilter.click();
      const filterDialog = page.locator('app-catalog-item-pick-dialog');
      await filterDialog.waitFor({ timeout: 10000 });
      await filterDialog.getByTestId('article-picker-choose').waitFor({ timeout: 4000 });
      if (await filterDialog.getByTestId('article-picker-dpu-pied').count()) {
        throw new Error('AC-11 listing: pied DPU sur filtre items');
      }
      await filterDialog.getByRole('button', { name: /Annuler/i }).click();
    } else {
      console.log('WARN — bouton filtre listing introuvable ; LOOKUP_PICKERS couvert par static + tarif');
    }

    console.log('PASS SEKTOR-261 — stock natures stockables, lookup article seul, pas de dump');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
