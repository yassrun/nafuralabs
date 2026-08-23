/**
 * Preuve SEKTOR-144 — picker stock + lookup (AC-10, AC-11).
 * Run: node sektor/e2e/scripts/verify-picker-article-144.mjs
 *
 * Baseline vu rouge : réception dump GET /api/v1/items ; tarif dump GET /api/v1/items/lookup.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';

const here = path.dirname(fileURLToPath(import.meta.url));
const webPkg = path.resolve(here, '../../sources/web/package.json');
const require = createRequire(webPkg);
const { chromium } = require('playwright');

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
    if (await dialog.getByRole('button', { name: /Ajouter au poste/i }).count()) {
      throw new Error('AC-10: pied DPU sur contexte stock');
    }
    await dialog.getByRole('button', { name: /^Choisir$/i }).waitFor({ timeout: 4000 });
    await dialog.getByRole('button', { name: /Annuler/i }).click();

    net.lookupGets.length = 0;
    net.listGets.length = 0;
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
    await dialog.waitFor({ timeout: 10000 });
    if (!(await dialog.getByTestId('article-picker-nature-MAIN_DOEUVRE').count())) {
      throw new Error('AC-11: lookup doit montrer toutes les natures');
    }
    if (await dialog.getByRole('button', { name: /Ajouter au poste/i }).count()) {
      throw new Error('AC-11: pied DPU sur lookup');
    }
    await dialog.getByRole('button', { name: /^Choisir$/i }).waitFor({ timeout: 4000 });

    console.log('PASS SEKTOR-144 — stock natures stockables, lookup article seul, pas de dump');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
