/**
 * Post-deploy verification — dev-20260619230406
 * Run: node tests/e2e/scripts/verify-post-deploy-20260620.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const BASE = 'http://erp.nafura.local';

const METRE_ID = '1d11c135-2a4f-43ed-99e0-6936b0c98bde';
const DEVIS_ID = 'a06010d8-145b-40e5-909d-9232de2274fc';

const results = [];

function record(id, pass, detail) {
  results.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id}: ${detail}`);
}

async function waitForApp(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  const login = page.locator('input[name="username"], #username');
  if (await login.isVisible().catch(() => false)) {
    throw new Error('Session expired — re-run erp-audit-auth.setup.ts');
  }
}

async function checkMetreButtons(page) {
  await page.goto(`${BASE}/etudes/metres/${METRE_ID}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);

  const dpgf = page.getByRole('button', { name: /^DPGF$/i });
  const generate = page.getByRole('button', { name: /générer devis/i });

  const dpgfVisible = await dpgf.isVisible().catch(() => false);
  const generateVisible = await generate.isVisible().catch(() => false);

  record(
    'metre-dpgf-generate-buttons',
    dpgfVisible && generateVisible,
    `DPGF visible=${dpgfVisible}, Générer devis visible=${generateVisible}`,
  );
}

async function checkDevisClient(page) {
  await page.goto(`${BASE}/etudes/devis/${DEVIS_ID}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);

  // Wait for form / lookups
  await page.waitForTimeout(2000);

  const clientSelect = page.locator('[data-field="clientId"], [formcontrolname="clientId"]').first();
  const hasSelect = await clientSelect.count() > 0;

  let clientText = '';
  if (hasSelect) {
    // Try combobox / select display
    const combobox = page.getByRole('combobox', { name: /client/i }).first();
    if (await combobox.isVisible().catch(() => false)) {
      clientText = (await combobox.textContent())?.trim() ?? '';
    } else {
      clientText = (await clientSelect.textContent())?.trim() ?? '';
    }
  }

  // Fallback: visible text on page
  const rabatVisible = await page.getByText(/Commune urbaine de Rabat/i).first().isVisible().catch(() => false);
  const pass = rabatVisible || /Commune urbaine de Rabat/i.test(clientText);

  record(
    'devis-client-select',
    pass,
    pass
      ? `Client shows "Commune urbaine de Rabat" (text=${clientText || 'page match'})`
      : `Client not found — select text="${clientText}"`,
  );
}

async function selectByLabel(page, labelRe) {
  const label = page.getByText(labelRe).first();
  const container = label.locator('xpath=ancestor::*[contains(@class,"nf-field") or contains(@class,"field") or contains(@class,"mat-mdc-form-field")][1]');
  const trigger = container.locator('mat-select, button[aria-haspopup], [role="combobox"]').first();
  if (!(await trigger.isVisible().catch(() => false))) return false;
  const expanded = await trigger.getAttribute('aria-expanded');
  if (expanded !== 'true') await trigger.click({ force: true });
  await page.waitForTimeout(600);
  const opt = page.locator('mat-option, [role="option"]').first();
  if (!(await opt.isVisible().catch(() => false))) {
    await page.keyboard.press('Escape');
    return false;
  }
  await opt.click({ force: true });
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape').catch(() => {});
  return true;
}

async function checkSortieDepots(page) {
  await page.goto(`${BASE}/inventory/mouvements/sorties/new`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  await page.waitForTimeout(2000);

  const magasinLabel = page.getByText(/Magasin source/i).first();
  await magasinLabel.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  const trigger = page
    .locator('[data-field="sourceLocationId"] button, [formcontrolname="sourceLocationId"]')
    .first();
  const combobox = page.getByRole('combobox', { name: /magasin source|origine/i }).first();

  let opened = false;
  if (await combobox.isVisible().catch(() => false)) {
    await combobox.click();
    opened = true;
  } else if (await trigger.isVisible().catch(() => false)) {
    await trigger.click();
    opened = true;
  } else {
    // Click near label
    const field = page.locator('label:has-text("Magasin source")').locator('..').locator('button, [role="combobox"]').first();
    if (await field.isVisible().catch(() => false)) {
      await field.click();
      opened = true;
    }
  }

  await page.waitForTimeout(800);

  const options = page.locator('[role="option"], .ng-option, mat-option, li[role="menuitem"]');
  const optionCount = await options.count();
  const optionTexts = [];
  for (let i = 0; i < Math.min(optionCount, 10); i++) {
    const t = (await options.nth(i).textContent())?.trim();
    if (t) optionTexts.push(t);
  }

  const hasDepots = optionCount > 0;
  record(
    'sortie-magasin-depots',
    hasDepots,
    hasDepots
      ? `${optionCount} option(s): ${optionTexts.slice(0, 5).join(' | ')}`
      : `Dropdown empty or not opened (opened=${opened})`,
  );

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  if (!hasDepots) return;

  // Minimal brouillon on fresh form state — preload chantier budgets lookup
  await page.goto(`${BASE}/chantiers/budget`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  await page.waitForTimeout(2000);
  await page.goto(`${BASE}/inventory/mouvements/sorties/new`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  await page.waitForTimeout(1500);
  const dateInput = page.locator('[data-field="txDate"] input, [formcontrolname="txDate"]').first();
  if (await dateInput.isVisible().catch(() => false)) {
    await dateInput.fill('2026-06-20');
    await dateInput.press('Tab');
  }
  const srcOk = await selectByLabel(page, /^Magasin source/i);
  const chantierOk = await selectByLabel(page, /^Chantier \(pilotage budget\)/i);
  const motifOk = await selectByLabel(page, /^Motif de sortie/i);

  const saveBtn = page.getByRole('button', { name: /^enregistrer$/i }).first();
  const saveVisible = await saveBtn.isVisible().catch(() => false);
  if (!saveVisible) {
    record('sortie-save-brouillon', false, 'Enregistrer button not visible');
    return;
  }

  try {
    await saveBtn.click({ timeout: 10000 });
  } catch (err) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await saveBtn.click({ force: true, timeout: 10000 });
  }
  await page.waitForTimeout(3000);

  const url = page.url();
  const toast = page.locator('.mat-mdc-snack-bar-label, .toast, [role="alert"]').first();
  const toastText = (await toast.textContent().catch(() => ''))?.trim() ?? '';
  const hasValidationError = /corriger les erreurs|champ obligatoire/i.test(toastText);
  const saved =
    !hasValidationError &&
    (!url.includes('/new') || /enregistr|succès|success|créé|created/i.test(toastText));

  record(
    'sortie-save-brouillon',
    saved,
    saved
      ? `Save OK — url=${url}${toastText ? ` toast="${toastText.slice(0, 120)}"` : ''}`
      : `Save failed — url=${url} fields=${JSON.stringify({ srcOk, chantierOk, motifOk })}${toastText ? ` toast="${toastText.slice(0, 200)}"` : ''}`,
  );
}

async function main() {
  if (!fs.existsSync(AUTH_FILE)) {
    console.error('Missing auth file:', AUTH_FILE);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_FILE, locale: 'fr-FR' });
  const page = await context.newPage();

  try {
    await checkMetreButtons(page);
    await checkDevisClient(page);
  try {
    await checkSortieDepots(page);
  } catch (err) {
    record('sortie-save-brouillon', false, err.message);
  }
  } catch (err) {
    console.error('Verification error:', err.message);
    record('runtime-error', false, err.message);
  } finally {
    await browser.close();
  }

  const out = path.resolve(__dirname, '../../../../docs/qa/erp-audit-2026-06-19/post-deploy-verify-20260620.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ deployed: 'dev-20260619230406', at: new Date().toISOString(), results }, null, 2));
  console.log('\nWrote', out);

  const failed = results.filter((r) => !r.pass);
  process.exit(failed.length ? 1 : 0);
}

main();
