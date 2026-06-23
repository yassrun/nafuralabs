/**
 * Situation UI workflow — CH-2026-004 / SIT-2026-004-03
 * Run: node tests/e2e/scripts/verify-situation-workflow.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const BASE = 'http://erp.nafura.local';
const API_BASE = 'http://api.erp.nafura.local';

const SITUATION_ID = 'ch-004-sit-03';
const SITUATION_NUMERO = 'SIT-2026-004-03';

const results = {
  deployed: 'dev-20260619230406',
  at: new Date().toISOString(),
  situationId: SITUATION_ID,
  situationNumero: SITUATION_NUMERO,
  steps: [],
};

function step(id, pass, detail, extra = {}) {
  results.steps.push({ id, pass, detail, ...extra });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id}: ${detail}`);
}

function sessionFromAuth() {
  const auth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  const pf = JSON.parse(
    auth.origins
      .find((o) => o.origin.includes('erp'))
      .localStorage.find((e) => e.name === 'pf_session').value,
  );
  return { token: pf.tokens.accessToken, tenantId: pf.tenantId };
}

async function apiGet(path) {
  const { token, tenantId } = sessionFromAuth();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Id': tenantId },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function dismissTours(page) {
  await page.addInitScript(() => {
    for (const tour of ['shell', 'chantiers', 'situations', 'erp', 'dashboard']) {
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

async function readStatus(page) {
  const sm = page.locator('nf-status-machine nf-badge').first();
  if (await sm.isVisible().catch(() => false)) {
    return (await sm.textContent())?.trim() ?? '';
  }
  return '';
}

async function readToast(page, timeoutMs = 5000) {
  const toast = page.locator('.toast, [role="alert"], .notification, .mat-mdc-snack-bar-label, .snackbar').first();
  await toast.waitFor({ state: 'visible', timeout: timeoutMs }).catch(() => {});
  return (await toast.textContent().catch(() => ''))?.trim() ?? '';
}

async function clickTransition(page, buttonName) {
  const btn = page
    .locator('nf-status-machine nf-button button')
    .filter({ hasText: buttonName })
    .first();
  await btn.waitFor({ state: 'visible', timeout: 20000 });
  await btn.click();
  await page.waitForTimeout(400);
}

async function confirmDialog(page, confirmLabel) {
  const dialog = page.locator('[role="dialog"], .mat-mdc-dialog-container, .cdk-overlay-pane').last();
  await dialog.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  const confirm = page.getByRole('button', { name: new RegExp(`^${confirmLabel}$`, 'i') }).last();
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
  } else {
    const fallback = page.getByRole('button', { name: new RegExp(confirmLabel, 'i') }).last();
    await fallback.click();
  }
  await page.waitForTimeout(2500);
}

async function main() {
  if (!fs.existsSync(AUTH_FILE)) {
    console.error('Missing auth file:', AUTH_FILE);
    process.exit(1);
  }

  const apiBefore = await apiGet(`/api/v1/situations/${SITUATION_ID}`);
  step(
    'api-pre-check',
    apiBefore.status === 200 && apiBefore.body?.status === 'BROUILLON',
    apiBefore.status === 200
      ? `API status=${apiBefore.body?.status} numero=${apiBefore.body?.numero}`
      : `API ${apiBefore.status}`,
    { apiStatus: apiBefore.body?.status },
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_FILE, locale: 'fr-FR' });
  const page = await context.newPage();
  await dismissTours(page);

  try {
    await page.goto(`${BASE}/chantiers/situations/${SITUATION_ID}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await waitForApp(page);
    await page.locator('nf-status-machine').waitFor({ state: 'visible', timeout: 20000 });

    const title = await page.locator('h1, .entity-detail__title, [data-testid="page-title"]').first().textContent().catch(() => '');
    step(
      'open-detail',
      /SIT-2026-004-03|situation/i.test(title ?? '') || page.url().includes(SITUATION_ID),
      `url=${page.url()} title="${(title ?? '').trim()}"`,
    );

    const statusBefore = await readStatus(page);
    step(
      'status-brouillon',
      /brouillon/i.test(statusBefore),
      `UI status="${statusBefore}"`,
    );

    await clickTransition(page, 'Soumettre au MOA');
    await confirmDialog(page, 'Soumettre');
    const toastSubmit = await readToast(page);
    const statusAfterSubmit = await readStatus(page);
    const apiAfterSubmit = await apiGet(`/api/v1/situations/${SITUATION_ID}`);
    step(
      'soumettre',
      /soumise/i.test(statusAfterSubmit) &&
        /soumise/i.test(apiAfterSubmit.body?.status ?? '') &&
        /soumise/i.test(toastSubmit),
      `UI="${statusAfterSubmit}" API=${apiAfterSubmit.body?.status} toast="${toastSubmit}"`,
      { toast: toastSubmit, apiStatus: apiAfterSubmit.body?.status },
    );

    await clickTransition(page, 'Valider MOA');
    await confirmDialog(page, 'Valider');
    const toastValidate = await readToast(page);
    const statusAfterValidate = await readStatus(page);
    const apiAfterValidate = await apiGet(`/api/v1/situations/${SITUATION_ID}`);
    step(
      'valider-moa',
      /validée/i.test(statusAfterValidate) &&
        apiAfterValidate.body?.status === 'VALIDEE_MOA' &&
        /validée/i.test(toastValidate),
      `UI="${statusAfterValidate}" API=${apiAfterValidate.body?.status} toast="${toastValidate}"`,
      { toast: toastValidate, apiStatus: apiAfterValidate.body?.status },
    );

    await clickTransition(page, 'Émettre la facture');
    await confirmDialog(page, 'Émettre');
    const toastInvoice = await readToast(page);
    const statusAfterInvoice = await readStatus(page);
    const apiAfterInvoice = await apiGet(`/api/v1/situations/${SITUATION_ID}`);
    const facMatch = toastInvoice.match(/FAC[-\w]+/i);
    step(
      'emettre-facture',
      /facturée/i.test(statusAfterInvoice) &&
        apiAfterInvoice.body?.status === 'FACTUREE' &&
        (/facture client/i.test(toastInvoice) || !!facMatch),
      `UI="${statusAfterInvoice}" API=${apiAfterInvoice.body?.status} toast="${toastInvoice}" factureId=${apiAfterInvoice.body?.factureClientId ?? 'n/a'}`,
      {
        toast: toastInvoice,
        apiStatus: apiAfterInvoice.body?.status,
        factureClientId: apiAfterInvoice.body?.factureClientId,
        factureNumero: facMatch?.[0] ?? null,
      },
    );

    results.allPass = results.steps.every((s) => s.pass);
  } catch (err) {
    step('runtime-error', false, err.message);
    results.allPass = false;
  } finally {
    await browser.close();
  }

  const out = path.resolve(__dirname, '../../../../docs/qa/erp-audit-2026-06-19/situation-workflow-verify.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log('\nWrote', out);
  console.log('ALL PASS:', results.allPass);

  process.exit(results.allPass ? 0 : 1);
}

main();
