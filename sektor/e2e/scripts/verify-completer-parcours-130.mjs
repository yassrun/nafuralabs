/**
 * Preuve SEKTOR-130 — arbre Coût reflète le PU après persist Extraire.
 * Run: node sektor/e2e/scripts/verify-completer-parcours-130.mjs
 * (depuis sektor/sources/web pour résoudre `playwright` — pas @playwright/test)
 *
 * Baseline vu rouge avant correctif : fermer ✕ (saved=false) laisse PU « — ».
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

async function persistPu(h, articleId) {
  const dpu = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpu`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        dpgfNoeudId: articleId,
        fraisGenerauxPercent: 10,
        margeBeneficiairePercent: 17.5,
      }),
    }),
  );
  if (!dpu.ok && dpu.status !== 201) throw new Error(`dpu create ${dpu.status} ${dpu.text}`);
  const dpuId = dpu.body.id;
  const upd = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpu/${dpuId}`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({
        fraisGenerauxPercent: 10,
        margeBeneficiairePercent: 17.5,
        composants: [
          {
            type: 'MATIERE',
            referenceType: 'LIBRE',
            libelle: 'Ciment CPJ',
            quantite: 1,
            unite: 't',
            prixUnitaire: 850,
            sourcePrix: 'MANUEL',
          },
        ],
      }),
    }),
  );
  if (!upd.ok) throw new Error(`dpu update ${upd.status} ${upd.text}`);
  const noeud = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf-noeuds/${articleId}`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({
        prixUnitaire: 1083.75,
        coutUnitaire: 850,
        fraisGenerauxPercent: 10,
        margePercent: 17.5,
        origineCout: 'DECOMPOSE',
      }),
    }),
  );
  if (!noeud.ok) throw new Error(`noeud ${noeud.status} ${noeud.text}`);
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

  let ingenieurs = [];
  const ingRes = await fetch(`${API_BASE}/api/v1/etudes/ingenieurs`, { headers: h });
  if (ingRes.ok) ingenieurs = await ingRes.json();
  const chargeEtudeUserId = ingenieurs[0]?.userId ?? session.userId;

  const created = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        objet: `QA 130 arbre PU ${suffix}`,
        chargeEtudeUserId,
        clientNom: 'MOA QA 130',
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
  if (!init.ok) throw new Error(`init ${init.status} ${init.text}`);
  const dpgfId = init.body.dpgfId;

  const lot = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ type: 'LOT', code: '1', libelle: 'Lot GO 130' }),
    }),
  );
  if (lot.status !== 201) throw new Error(`lot ${lot.status} ${lot.text}`);

  const libelle = `Beton Extraire 130 ${suffix}`;
  const art = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        type: 'ARTICLE',
        code: '1.1',
        libelle,
        parentId: lot.body.id,
        unite: 'm3',
        quantite: 12,
      }),
    }),
  );
  if (art.status !== 201) throw new Error(`article ${art.status} ${art.text}`);
  const articleId = art.body.id;

  const step = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/etape`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ etape: 3 }),
    }),
  );
  if (!step.ok) throw new Error(`etape 3 ${step.status} ${step.text}`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${APP_BASE}/etudes/dossiers/${dossierId}`, { waitUntil: 'domcontentloaded' });
    await page.locator('app-consultation-etude-panel').waitFor({ timeout: 20000 });
    const article = page.getByText(libelle).first();
    await article.waitFor({ timeout: 15000 });
    await article.click();
    await page.locator('.poste-drawer').waitFor({ timeout: 8000 });

    await persistPu(h, articleId);

    const arbreApi = await json(
      await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/arbre`, { headers: h }),
    );
    const artNode = JSON.stringify(arbreApi.body).includes('1083.75')
      ? '1083.75 in arbre API'
      : `arbre API sans 1083.75: ${String(arbreApi.text).slice(0, 400)}`;
    console.log(artNode);

    await page.locator('.poste-drawer').getByRole('button', { name: '✕' }).click();
    await page.locator('.poste-drawer').waitFor({ state: 'detached', timeout: 8000 });
    await page.waitForTimeout(1500);

    const tree = page.locator('app-bordereau-arbre');
    const treeText = (await tree.innerText()) ?? '';
    const puOk = /1[.\s\u00a0\u202f,]?083[,.]75/.test(treeText);
    if (!puOk) {
      throw new Error(
        `arbre PU pas à jour après close ✕ — texte=\n${treeText.slice(0, 800)}`,
      );
    }
    if (!/13[.\s\u00a0\u202f,]?005/.test(treeText)) {
      throw new Error(`arbre Total HT sans 13005 — texte=\n${treeText.slice(0, 800)}`);
    }
    const total = page.locator('app-dossier-summary-header .dsh__kpi-value').first();
    await total.waitFor({ timeout: 8000 });
    const started = Date.now();
    let totalText = '';
    while (Date.now() - started < 10000) {
      totalText = (await total.textContent()) ?? '';
      if (/13[.\s\u00a0\u202f,]?005/.test(totalText)) break;
      await page.waitForTimeout(300);
    }
    if (!/13[.\s\u00a0\u202f,]?005/.test(totalText)) {
      throw new Error(`header TOTAL HT="${totalText.trim()}" sans 13005 après close`);
    }
    console.log('ok arbre PU 1 083,75 + total 13 005 + header TOTAL HT sans F5');
    console.log('PASS SEKTOR-130');
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
