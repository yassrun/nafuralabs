/**
 * Post-deploy stock QA — dev-20260620104816
 * Run: node tests/e2e/scripts/verify-stock-qa-20260620.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const BASE = 'http://erp.nafura.local';
const DEPLOYED = 'dev-20260620005515';

const results = [];

function record(route, pass, detail) {
  results.push({ route, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${route}: ${detail}`);
}

async function dismissTours(page) {
  await page.addInitScript(() => {
    if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
      crypto.randomUUID = () =>
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
    }
    for (const tour of ['shell', 'chantiers', 'situations', 'erp', 'dashboard', 'inventory']) {
      localStorage.setItem(`nafura-tour-seen-${tour}`, 'true');
    }
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('nafura-tour-seen-')) {
        localStorage.setItem(key, 'true');
      }
    }
    localStorage.setItem('seyrura:language', 'fr');
  });
}

async function waitForApp(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  const login = page.locator('input[name="username"], #username');
  if (await login.isVisible().catch(() => false)) {
    throw new Error('Session expired — re-run erp-audit-auth.setup.ts');
  }
}

async function dismissOverlays(page) {
  await page.keyboard.press('Escape').catch(() => {});
  const skip = page.getByRole('button', { name: /passer|skip|fermer|close|got it|compris/i }).first();
  if (await skip.isVisible().catch(() => false)) {
    await skip.click().catch(() => {});
  }
}

async function selectByMatLabel(page, labelText) {
  const field = page.locator('mat-form-field').filter({ has: page.getByText(labelText, { exact: true }) }).first();
  const select = field.locator('mat-select').first();
  if (!(await select.isVisible().catch(() => false))) return { ok: false, options: [] };

  await select.click({ force: true });
  await page.waitForTimeout(800);

  const options = page.locator('mat-option:not(.nf-entity-detail__select-search-option):not([aria-disabled="true"])');
  const optionCount = await options.count();
  const optionTexts = [];
  for (let i = 0; i < Math.min(optionCount, 15); i++) {
    const t = (await options.nth(i).textContent())?.trim();
    if (t) optionTexts.push(t);
  }
  if (optionCount === 0) {
    await page.keyboard.press('Escape').catch(() => {});
    return { ok: false, options: optionTexts };
  }
  await options.first().click({ force: true });
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape').catch(() => {});
  return { ok: true, options: optionTexts };
}

async function addSortieLine(page) {
  const addBtn = page.getByRole('button', { name: /ligne/i }).first();
  if (!(await addBtn.isVisible().catch(() => false))) {
    return { ok: false, detail: 'Add line button not visible' };
  }
  await addBtn.scrollIntoViewIfNeeded();
  await addBtn.click();
  await page.waitForTimeout(800);

  const articleSelect = page.locator('app-perte-lines-editor select.nf-select-field').first();
  if (!(await articleSelect.isVisible().catch(() => false))) {
    return { ok: false, detail: 'Article select not visible after add line' };
  }
  const optCount = await articleSelect.locator('option').count();
  if (optCount < 2) {
    return { ok: false, detail: `Article options=${optCount}` };
  }
  await articleSelect.selectOption({ index: 1 });
  await page.locator('app-perte-lines-editor input[type="number"]').first().fill('1');
  await page.waitForTimeout(300);
  return { ok: true, detail: 'Line added qty=1' };
}

async function fillDateField(page) {
  const field = page.locator('mat-form-field').filter({ has: page.getByText('Date', { exact: true }) }).first();
  const toggle = field.locator('mat-datepicker-toggle button').first();
  if (!(await toggle.isVisible().catch(() => false))) return false;
  await toggle.click();
  await page.waitForTimeout(700);
  const today = page.locator('.mat-calendar-body-today').first();
  if (!(await today.isVisible().catch(() => false))) {
    await page.keyboard.press('Escape').catch(() => {});
    return false;
  }
  await today.click();
  await page.waitForTimeout(400);
  return ((await field.locator('input').inputValue().catch(() => '')) ?? '').length > 0;
}

async function smokeRoute(page, routePath, expectRe) {
  await page.goto(`${BASE}${routePath}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await dismissOverlays(page);
  await page.waitForTimeout(2000);

  const url = page.url();
  const onLogin = /login|auth/i.test(url);
  if (onLogin) {
    record(routePath, false, 'Redirected to login');
    return;
  }

  const bodyText = (await page.locator('body').textContent().catch(() => '')) ?? '';
  const hasError =
    /erreur|error|404|not found|page introuvable/i.test(bodyText) &&
    !/aucun|empty|vide/i.test(bodyText);
  const matches = expectRe ? expectRe.test(bodyText) || expectRe.test(url) : true;
  const pass = !hasError && matches;

  record(
    routePath,
    pass,
    pass
      ? `Page loaded — url=${url}`
      : `Smoke failed — url=${url} expect=${expectRe?.source ?? 'none'}`,
  );
}

async function checkSortieNew(page) {
  const route = '/inventory/mouvements/sorties/new';

  // --- Chantier budget dropdown (read-only probe) ---
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await dismissOverlays(page);
  await page.waitForTimeout(5000);

  const saveBtn = page.getByRole('button', { name: /enregistrer/i }).first();
  await saveBtn.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  const formLoaded = await saveBtn.isVisible().catch(() => false);
  if (!formLoaded) {
    record(route, false, 'Create form did not load (no Enregistrer)');
    return;
  }

  const chantierField = page
    .locator('mat-form-field')
    .filter({ has: page.getByText('Chantier (pilotage budget)', { exact: true }) })
    .first();
  const chantierSelect = chantierField.locator('mat-select').first();
  await chantierSelect.click({ force: true });
  await page.waitForTimeout(800);
  const chantierOptions = page.locator(
    'mat-option:not(.nf-entity-detail__select-search-option):not([aria-disabled="true"])',
  );
  const chantierCount = await chantierOptions.count();
  const chantierTexts = [];
  for (let i = 0; i < Math.min(chantierCount, 8); i++) {
    const t = (await chantierOptions.nth(i).textContent())?.trim();
    if (t) chantierTexts.push(t);
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);

  const chantierPopulated = chantierCount > 0;
  record(
    route,
    chantierPopulated,
    chantierPopulated
      ? `Chantier budget dropdown: ${chantierCount} option(s) — ${chantierTexts.slice(0, 4).join(' | ')}`
      : 'Chantier budget dropdown empty',
  );

  if (!chantierPopulated) {
    record(`${route} (save brouillon)`, false, 'Skipped — chantier budget empty');
    return;
  }

  // --- Fresh form for save ---
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await dismissOverlays(page);
  await page.waitForTimeout(5000);

  const src = await selectByMatLabel(page, 'Magasin source');
  const chantier = await selectByMatLabel(page, 'Chantier (pilotage budget)');
  const motif = await selectByMatLabel(page, 'Motif de sortie');
  const dateOk = await fillDateField(page);
  const line = await addSortieLine(page);
  const srcOk = src.ok;
  const chantierOk = chantier.ok;
  const motifOk = motif.ok;

  if (!line.ok) {
    record(`${route} (save brouillon)`, false, line.detail ?? 'Could not add minimal line');
    return;
  }

  const saveBtn2 = page.getByRole('button', { name: /^enregistrer$/i }).first();
  if (!(await saveBtn2.isVisible().catch(() => false))) {
    record(`${route} (save brouillon)`, false, 'Enregistrer button not visible');
    return;
  }

  try {
    await saveBtn2.click({ timeout: 10000 });
  } catch {
    await page.keyboard.press('Escape').catch(() => {});
    await saveBtn2.click({ force: true, timeout: 10000 });
  }
  await page.waitForTimeout(3500);

  const url = page.url();
  const toast = page.locator('.mat-mdc-snack-bar-label, .toast, [role="alert"]').first();
  const toastText = (await toast.textContent().catch(() => ''))?.trim() ?? '';
  const hasValidationError = /corriger les erreurs|champ obligatoire|required/i.test(toastText);
  const saved =
    !hasValidationError &&
    !url.includes('/new') &&
    (/enregistr|succès|success|créé|created/i.test(toastText) || /\/sorties\/[0-9a-f-]{36}/i.test(url));

  record(
    `${route} (save brouillon)`,
    saved,
    saved
      ? `Save OK — url=${url}${toastText ? ` toast="${toastText.slice(0, 120)}"` : ''}`
      : `Save failed — url=${url} fields=${JSON.stringify({ dateOk, srcOk, chantierOk, motifOk, lineOk: line.ok })}${toastText ? ` toast="${toastText.slice(0, 200)}"` : ''}${line.detail ? ` line="${line.detail}"` : ''}`,
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
  await dismissTours(page);

  try {
    await checkSortieNew(page);
    await smokeRoute(page, '/inventory/mouvements/retours', /retour|nouveau|aucun|liste/i);
    await smokeRoute(page, '/inventory/mouvements/pertes-chutes', /perte|chute|nouveau|aucun|liste/i);
    await smokeRoute(page, '/inventory/suivi/valorisation', /valorisation|stock|mad|article|dépôt/i);
  } catch (err) {
    console.error('Verification error:', err.message);
    record('runtime-error', false, err.message);
  } finally {
    await browser.close();
  }

  const out = path.resolve(
    __dirname,
    '../../../../docs/qa/erp-audit-2026-06-19/stock-qa-verify-20260620.json',
  );
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify({ deployed: DEPLOYED, at: new Date().toISOString(), results }, null, 2),
  );
  console.log('\nWrote', out);

  const failed = results.filter((r) => !r.pass);
  process.exit(failed.length ? 1 : 0);
}

main();
