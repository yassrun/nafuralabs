/**
 * Preuve — étape unique Planning et ressources + bouton Ajouter un événement.
 * Run: node sektor/e2e/scripts/verify-planning-ressources-etude.mjs
 * (depuis sektor/sources/web pour résoudre playwright)
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const DOSSIER_ID = process.env.NAFURA_QA_DOSSIER_ID ?? '0d79463b-e3e1-4b6f-a2b3-e39c52382d56';

const here = path.dirname(fileURLToPath(import.meta.url));
const webPkg = path.resolve(here, '../../sources/web/package.json');
const require = createRequire(webPkg);
const { chromium } = require('playwright');

async function clickWizard(page, nameRe) {
  const btn = page.locator('nf-wizard-shell .nf-wizard-shell__actions').getByRole('button', {
    name: nameRe,
  });
  await btn.waitFor({ state: 'visible', timeout: 20000 });
  const started = Date.now();
  while (await btn.isDisabled()) {
    if (Date.now() - started > 15000) throw new Error(`wizard CTA disabled: ${nameRe}`);
    await page.waitForTimeout(250);
  }
  await btn.click();
}

async function fillNf(page, name, value) {
  const input = page.locator(`nf-input[name="${name}"] input`);
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill(value);
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
  const h = {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const etape = await fetch(`${API_BASE}/api/v1/etudes/dossiers/${DOSSIER_ID}/etape`, {
    method: 'PUT',
    headers: h,
    body: JSON.stringify({ etape: 5 }),
  });
  if (!etape.ok) {
    throw new Error(`PUT etape 5: ${etape.status} ${await etape.text()}`);
  }

  const suffix = Date.now().toString(36);
  const eventLabel = `Fondations QA ${suffix}`;
  const resLabel = `Chef de chantier ${suffix}`;

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${APP_BASE}/etudes/dossiers/${DOSSIER_ID}`, { waitUntil: 'domcontentloaded' });
    await clickWizard(page, /Continuer vers le planning/i);

    await page.getByRole('heading', { name: /Planning prévisionnel/i }).waitFor({ timeout: 20000 });
    const stepLabelsEarly = await page.locator('.nf-wizard-shell__step-label').allTextContents();
    console.log('stepper', stepLabelsEarly.join(' | '));
    await page.locator('.nf-wizard-shell__content').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.getByRole('heading', { name: /Ressources prévues/i }).waitFor({ timeout: 20000 });
    const stepLabels = await page.locator('.nf-wizard-shell__step-label').allTextContents();
    if (!stepLabels.some((l) => /Planning et ressources/i.test(l))) {
      throw new Error(`stepper sans étape fusionnée: ${stepLabels.join(' | ')}`);
    }
    if (stepLabels.some((l) => /^Ressources prévues$/i.test(l))) {
      throw new Error(`étape ressources encore séparée: ${stepLabels.join(' | ')}`);
    }
    console.log('ok stepper 5 étapes, planning+ressources sur le même écran');

    await page.getByRole('button', { name: /Ajouter un événement/i }).click();
    await page.getByRole('alert').filter({ hasText: /requis/i }).waitFor({ timeout: 8000 });
    console.log('ok validation vide événement');

    await fillNf(page, 'planifLibelle', eventLabel);
    await fillNf(page, 'planifDebut', '2026-12-01');
    await fillNf(page, 'planifFin', '2026-12-15');
    await page.getByRole('button', { name: /Ajouter un événement/i }).click();
    await page.locator('app-dossier-planning-panel table').getByText(eventLabel).waitFor({
      timeout: 15000,
    });
    console.log('ok événement ajouté');

    await fillNf(page, 'resLibelle', resLabel);
    await fillNf(page, 'resQte', '2');
    await page.getByRole('button', { name: /Ajouter une ressource/i }).click();
    await page.locator('app-dossier-ressources-panel table').getByText(resLabel).waitFor({
      timeout: 15000,
    });
    console.log('ok ressource ajoutée');

    const eventRow = page.locator('app-dossier-planning-panel table tr').filter({ hasText: eventLabel });
    await eventRow.getByRole('button', { name: /Retirer/i }).click();
    await page.locator('app-dossier-planning-panel table').getByText(eventLabel).waitFor({
      state: 'hidden',
      timeout: 15000,
    });
    console.log('ok événement retiré');

    await clickWizard(page, /Voir la synthèse/i);
    await page.locator('app-synthese-validation-panel').waitFor({ timeout: 20000 });
    console.log('ok footer Voir la synthèse');
    console.log('PASS planning-ressources-etude');
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
