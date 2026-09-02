/**
 * Preuve SEKTOR-129 — CTA Continuer / Voir la synthèse avancent l’étape.
 * Run: node sektor/e2e/scripts/verify-completer-parcours-129.mjs
 * (depuis sektor/sources/web pour résoudre `playwright` — pas @playwright/test)
 *
 * Baseline vu rouge avant correctif : header « Voir la synthèse » reste sur Coût
 * (allerAEtapeUi(3) no-op tant que currentStep < 5).
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

async function currentStep(h, id) {
  const d = await json(await fetch(`${API_BASE}/api/v1/etudes/dossiers/${id}`, { headers: h }));
  if (!d.ok) throw new Error(`GET dossier ${d.status} ${d.text}`);
  return d.body.currentStep;
}

async function seedLotArticle(h, dossierId, suffix) {
  const d = await json(await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}`, { headers: h }));
  const dpgfId = d.body.dpgfId;
  if (!dpgfId) throw new Error('dpgfId manquant après Bordereau manuel');
  const lot = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ type: 'LOT', code: '1', libelle: `Lot GO 129 ${suffix}` }),
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
        libelle: `Beton 129 ${suffix}`,
        parentId: lot.body.id,
        unite: 'm3',
        quantite: 12,
        origineCout: 'FORFAIT',
        coutUnitaire: 100,
        prixUnitaire: 129.25,
        fraisGenerauxPercent: 10,
        margePercent: 17.5,
      }),
    }),
  );
  if (art.status !== 201) throw new Error(`article ${art.status} ${art.text}`);
}

async function clickWizard(page, nameRe) {
  const btn = page.locator('nf-wizard-shell .nf-wizard-shell__actions').getByRole('button', {
    name: nameRe,
  });
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.waitFor({ state: 'attached', timeout: 15000 });
  const started = Date.now();
  while (await btn.isDisabled()) {
    if (Date.now() - started > 15000) throw new Error(`wizard CTA disabled: ${nameRe}`);
    await page.waitForTimeout(250);
  }
  await btn.click();
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
        objet: `QA 129 CTA ${suffix}`,
        chargeEtudeUserId,
        clientNom: 'MOA QA 129',
      }),
    }),
  );
  if (created.status !== 201) throw new Error(`dossier ${created.status} ${created.text}`);
  const id = created.body.id;

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${APP_BASE}/etudes/dossiers/${id}`, { waitUntil: 'domcontentloaded' });
    await page.getByText(/Identité de l’étude|CPS/i).first().waitFor({ timeout: 20000 });
    await clickWizard(page, /Continuer vers le bordereau/i);
    await page.getByRole('button', { name: /^Manuel$/i }).click();
    await page.getByRole('button', { name: /Créer l’arbre vide|Creer l'arbre vide/i }).click();
    await page.getByRole('heading', { name: /Arbre du bordereau/i }).waitFor({ timeout: 20000 });
    const afterDocs = await currentStep(h, id);
    if (afterDocs !== 2) throw new Error(`après footer Continuer docs: currentStep=${afterDocs} (attendu 2)`);
    console.log('ok footer Continuer → bordereau (currentStep=2)');

    await seedLotArticle(h, id, suffix);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Arbre du bordereau/i }).waitFor({ timeout: 20000 });

    await clickWizard(page, /Continuer vers le coût/i);
    await page.locator('app-consultation-etude-panel').waitFor({ timeout: 20000 });
    const afterBordereau = await currentStep(h, id);
    if (afterBordereau !== 3) {
      throw new Error(`après footer Continuer bordereau: currentStep=${afterBordereau} (attendu 3)`);
    }
    console.log('ok footer Continuer → coût (currentStep=3)');

    const header = page
      .locator('app-dossier-summary-header')
      .getByRole('button', { name: /^Voir la synthèse$/i });
    await header.waitFor({ timeout: 10000 });
    await header.click();
    try {
      await page.locator('app-synthese-validation-panel').waitFor({ timeout: 12000 });
    } catch {
      const stuck = await currentStep(h, id);
      throw new Error(
        `header Voir la synthèse n’avance pas (currentStep=${stuck}, attendu 5) — vue rouge`,
      );
    }
    const afterHeader = await currentStep(h, id);
    if (afterHeader !== 5) {
      throw new Error(`header Voir la synthèse: currentStep=${afterHeader} (attendu 5)`);
    }
    console.log('ok header Voir la synthèse → currentStep=5');

    await clickWizard(page, /Précédent/i);
    await page.locator('app-consultation-etude-panel').waitFor({ timeout: 15000 });
    await clickWizard(page, /Voir la synthèse/i);
    await page.locator('app-synthese-validation-panel').waitFor({ timeout: 20000 });
    const afterFooter = await currentStep(h, id);
    if (afterFooter !== 5) {
      throw new Error(`footer Voir la synthèse: currentStep=${afterFooter} (attendu 5)`);
    }
    console.log('ok footer Voir la synthèse → currentStep=5');
    console.log('PASS SEKTOR-129');
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
