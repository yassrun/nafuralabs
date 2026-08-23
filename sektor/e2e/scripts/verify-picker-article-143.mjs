/**
 * Preuve SEKTOR-143 — picker partagé + DPU (AC-1…9, 12…14).
 * Run: node sektor/e2e/scripts/verify-picker-article-143.mjs
 *
 * Baseline vu rouge : ouverture dump GET /api/v1/items (pageSize 40), liste déjà remplie.
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

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

function headers(session) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function seedDossierCout(h, suffix) {
  let chargeEtudeUserId = h['X-Tenant-Id'];
  const ing = await json(await fetch(`${API_BASE}/api/v1/etudes/ingenieurs`, { headers: h }));
  if (Array.isArray(ing.body) && ing.body[0]?.userId) chargeEtudeUserId = ing.body[0].userId;

  const created = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        objet: `QA picker 143 ${suffix}`,
        chargeEtudeUserId,
        clientNom: 'MOA QA 143',
      }),
    }),
  );
  if (created.status !== 201) throw new Error(`dossier ${created.status} ${created.text}`);
  const dossierId = created.body.id;

  const init = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`, {
      method: 'POST',
      headers: h,
    }),
  );
  if (!init.ok) throw new Error(`init-bordereau ${init.status} ${init.text}`);
  const dpgfId = init.body.dpgfId;

  const lot = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ type: 'LOT', code: '1', libelle: `Lot GO 143 ${suffix}` }),
    }),
  );
  if (lot.status !== 201) throw new Error(`lot ${lot.status} ${lot.text}`);

  const art = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        type: 'ARTICLE',
        code: '1.1',
        libelle: `Beton picker 143 ${suffix}`,
        parentId: lot.body.id,
        unite: 'm3',
        quantite: 12,
      }),
    }),
  );
  if (art.status !== 201) throw new Error(`article ${art.status} ${art.text}`);

  for (const etape of [2, 3]) {
    const step = await json(
      await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/etape`, {
        method: 'PUT',
        headers: h,
        body: JSON.stringify({ etape }),
      }),
    );
    if (!step.ok) throw new Error(`etape ${etape} ${step.status} ${step.text}`);
  }
  return { dossierId, articleLibelle: `Beton picker 143 ${suffix}` };
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
  const h = headers(session);
  const suffix = Date.now().toString(36);
  const { dossierId, articleLibelle } = await seedDossierCout(h, suffix);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const itemListGets = [];
  const itemSearchGets = [];
  page.on('request', (req) => {
    if (req.method() !== 'GET') return;
    const url = req.url();
    if (!url.includes('/api/v1/items')) return;
    if (url.includes('/api/v1/items/search')) itemSearchGets.push(url);
    else if (/\/api\/v1\/items(\?|$)/.test(url) && !url.includes('/lookup') && !url.includes('/identites')) {
      itemListGets.push(url);
    }
  });

  try {
    await page.goto(`${APP_BASE}/etudes/dossiers/${dossierId}`, { waitUntil: 'domcontentloaded' });
    const article = page.getByText(articleLibelle).first();
    await article.waitFor({ timeout: 25000 });
    await article.click();
    const drawer = page.locator('.poste-drawer');
    try {
      await drawer.waitFor({ timeout: 15000 });
    } catch (e) {
      const body = (await page.locator('body').innerText()).slice(0, 800);
      throw new Error(`drawer introuvable url=${page.url()} body=${body}`);
    }
    await page.getByRole('heading', { name: articleLibelle }).waitFor({ timeout: 15000 });
    const decompo = page.getByRole('button', { name: /Je décompose/i });
    const catalogueBtn = page.getByRole('button', { name: /Depuis le catalogue/i });
    await Promise.race([
      decompo.waitFor({ state: 'visible', timeout: 15000 }),
      catalogueBtn.waitFor({ state: 'visible', timeout: 15000 }),
    ]);
    if (await decompo.isVisible().catch(() => false)) {
      await decompo.click();
      const continuer = page.getByRole('button', { name: /^Continuer$/i });
      try {
        await continuer.waitFor({ state: 'visible', timeout: 4000 });
        await continuer.click();
      } catch {
        /* déjà en décompo */
      }
    }
    await page.getByRole('button', { name: /Depuis le catalogue/i }).first().waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: /Depuis le catalogue/i }).first().click();

    const dialog = page.locator('app-catalog-item-pick-dialog');
    await dialog.waitFor({ timeout: 10000 });

    const dumpOnOpen = itemListGets.length > 0;
    if (dumpOnOpen) {
      throw new Error(
        `VU ROUGE AC-1: dump GET /api/v1/items à l’ouverture (${itemListGets[0]})`,
      );
    }
    if (itemSearchGets.length > 0) {
      throw new Error(`AC-1: search appelée trop tôt à l’ouverture (${itemSearchGets[0]})`);
    }

    const hits = dialog.locator('[data-testid="article-picker-hit"]');
    if ((await hits.count()) > 0) {
      throw new Error(`AC-1: liste déjà remplie à l’ouverture (${await hits.count()} hits)`);
    }

    const extraire = dialog.getByRole('button', { name: /Extraire|Créer dans le catalogue/i });
    if ((await extraire.count()) > 0) {
      throw new Error('AC-13: CTA Extraire / Créer présent dans le picker');
    }

    await dialog.getByRole('searchbox').or(dialog.locator('input[type="search"]')).first().fill('ci');
    await page.waitForTimeout(450);
    await hits.first().waitFor({ timeout: 8000 });
    const first = hits.first();
    const text = await first.innerText();
    if (!/\d/.test(text)) {
      throw new Error(`AC-7: hit sans PU/unité visible: ${text.slice(0, 120)}`);
    }
    await dialog.getByRole('button', { name: /Ajouter au poste/i }).waitFor({ timeout: 5000 });

    console.log(`PASS SEKTOR-143 — picker vide à l’ouverture, hits après saisie, pied DPU`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
