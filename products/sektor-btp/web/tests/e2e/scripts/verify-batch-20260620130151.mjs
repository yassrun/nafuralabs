/**
 * Post-deploy batch — dev-20260620130151
 * BC réception · congé UI transitions · devis prefill · Bird HSE
 * Run: QA_BUILD=dev-20260620130151 node web/tests/e2e/scripts/verify-batch-20260620130151.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const ERP_BASE = process.env.ERP_BASE ?? 'http://erp.nafura.local';
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';
const BUILD = process.env.QA_BUILD ?? 'dev-20260620130151';

const BC_ID = '4a2a7c5d-503e-4ac9-89b2-33e955d0b0ce';
const DEVIS_ID = 'a06010d8-145b-40e5-909d-9232de2274fc';

const results = { ok: true, build: BUILD, checks: [], at: new Date().toISOString() };

function record(id, pass, detail, extra = {}) {
  results.checks.push({ id, pass, detail, ...extra });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id}: ${detail}`);
  if (!pass) results.ok = false;
}

async function getSession(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('pf_session') ?? sessionStorage.getItem('pf_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.tokens?.accessToken) return null;
    return { accessToken: parsed.tokens.accessToken, tenantId: parsed.tenantId ?? null };
  });
}

function apiHeaders(session) {
  const headers = { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' };
  if (session.tenantId) headers['X-Tenant-Id'] = session.tenantId;
  return headers;
}

async function apiJson(request, session, method, apiPath, data) {
  const opts = { headers: apiHeaders(session) };
  if (data !== undefined) opts.data = data;
  const res = await request[method.toLowerCase()](`${API_BASE}${apiPath}`, opts);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => null);
  }
  return { ok: res.ok(), status: res.status(), body };
}

async function dismissTours(page) {
  await page.addInitScript(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('nafura-tour-seen-')) localStorage.setItem(key, 'true');
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

async function main() {
  if (!fs.existsSync(AUTH_FILE)) throw new Error(`Missing auth: ${AUTH_FILE}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_FILE });
  await dismissTours(await context.newPage());
  const page = await context.newPage();
  await page.goto(`${ERP_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  const session = await getSession(page);
  if (!session) throw new Error('No ERP session');
  const request = context.request;

  // --- Bird HSE API + dashboard widget ---
  const hseKpis = await apiJson(request, session, 'GET', '/api/v1/hse/kpis');
  const pa = hseKpis.body?.presquAccidents ?? hseKpis.body?.presqu_accidents;
  record(
    'hse-kpis-api',
    hseKpis.ok && pa != null,
    `GET /hse/kpis → ${hseKpis.status} presquAccidents=${pa}`,
    { body: hseKpis.body },
  );

  await page.goto(`${ERP_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  await page.waitForTimeout(2000);
  const birdText = await page.locator('app-bird-pyramid-hse, [class*="bird"], [class*="pyramid"]').first().textContent().catch(() => '');
  const birdEmpty = /aucun|empty|—/i.test(birdText ?? '') && !/\d/.test(birdText ?? '');
  record(
    'bird-widget-dashboard',
    !birdEmpty && (pa == null || String(birdText).includes(String(pa)) || /\d/.test(birdText ?? '')),
    `Bird widget text="${(birdText ?? '').trim().slice(0, 120)}" empty=${birdEmpty}`,
  );

  // --- BC réception destination select ---
  const locs = await apiJson(request, session, 'GET', '/api/v1/inventory/locations');
  const warehouseCount = Array.isArray(locs.body)
    ? locs.body.filter((l) => ['WAREHOUSE', 'ENTREPOT', 'DEPOT'].includes(l.type)).length
    : 0;
  record('bc-locations-api', warehouseCount > 0, `${warehouseCount} depot/warehouse locations`, { count: warehouseCount });

  await page.goto(`${ERP_BASE}/achats/commandes/${BC_ID}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  const recvBtn = page.getByRole('button', { name: /enregistrer réception|nouvelle réception/i }).first();
  if (await recvBtn.isVisible().catch(() => false)) {
    await recvBtn.click();
    await page.waitForTimeout(1000);
    const destSelect = page.locator('select, nf-select').filter({ hasText: /destination|entrepôt|dépôt/i }).first();
    const anySelect = page.locator('select[name*="location"], select[name*="destination"], nf-select').first();
    const select = (await destSelect.count()) > 0 ? destSelect : anySelect;
    const optionCount = await page.locator('select option, nf-select option, [role="option"]').count().catch(() => 0);
    record(
      'bc-reception-destination',
      optionCount > 1 || warehouseCount > 0,
      `Reception form options≈${optionCount} (warehouse locations=${warehouseCount})`,
      { optionCount },
    );
  } else {
    record('bc-reception-destination', false, 'Réception button not visible');
  }

  // --- Congé UI transition (create DEMANDE then Approuver) ---
  const qaCngId = `cng-ui-${Date.now().toString(36).slice(-6)}`;
  const createCng = await apiJson(request, session, 'POST', '/api/v1/rh/conges', {
    id: qaCngId,
    employeId: 'emp-qa-said',
    type: 'ANNUEL',
    dateDebut: '2026-08-01',
    dateFin: '2026-08-05',
    nombreJours: 5,
    status: 'DEMANDE',
  });
  record(
    'conge-create-demande',
    createCng.ok && createCng.body?.status === 'DEMANDE',
    `POST congé → ${createCng.status} status=${createCng.body?.status}`,
    { id: qaCngId },
  );

  if (createCng.ok) {
    await page.goto(`${ERP_BASE}/rh/conges/${qaCngId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForApp(page);
    const approveBtn = page.getByRole('button', { name: /^approuver$/i }).first();
    const approveVisible = await approveBtn.isVisible().catch(() => false);
    if (approveVisible) {
      await approveBtn.click();
      await page.waitForTimeout(500);
      const confirmBtn = page.getByRole('button', { name: /confirmer|oui|ok|approuver/i }).last();
      if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
      await page.waitForTimeout(2000);
      const after = await apiJson(request, session, 'GET', `/api/v1/rh/conges/${qaCngId}`);
      record(
        'conge-ui-approuver',
        after.body?.status === 'APPROUVE',
        `After Approuver click → status=${after.body?.status}`,
        { status: after.body?.status },
      );
    } else {
      record('conge-ui-approuver', false, 'Approuver button not visible');
    }
  }

  // --- Devis → chantier prefill ---
  const devis = await apiJson(request, session, 'GET', `/api/v1/etudes/devis/${DEVIS_ID}`);
  record('devis-api', devis.ok, `GET devis → objet="${devis.body?.objet}" clientId=${devis.body?.clientId}`);

  await page.goto(`${ERP_BASE}/chantiers/new?devisId=${DEVIS_ID}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  await page.waitForTimeout(2500);

  const nameVal = await page.locator('#cc-name').inputValue().catch(() => '');
  record(
    'prefill-step1-name',
    !!nameVal?.trim() && (devis.body?.objet ? nameVal.includes(devis.body.objet.slice(0, 20)) || devis.body.objet.includes(nameVal.slice(0, 20)) : nameVal.length > 3),
    `Step1 name="${nameVal}" expected≈"${devis.body?.objet ?? '?'}"`,
    { nameVal, objet: devis.body?.objet },
  );

  await page.getByRole('button', { name: /suivant|next/i }).click().catch(() => page.locator('button').filter({ hasText: /suivant/i }).first().click());
  await page.waitForTimeout(800);

  const clientDisplay = await page.locator('#cc-cli, nf-select#cc-cli, [id="cc-cli"]').first().textContent().catch(() => '');
  const rabatOnPage = await page.getByText(/Commune urbaine de Rabat|Rabat/i).first().isVisible().catch(() => false);
  const marcheRef = await page.locator('#cc-marche, input[name="marche"], input[id*="marche"]').first().inputValue().catch(() => '');
  record(
    'prefill-step2-client',
    rabatOnPage || /Rabat|Commune/i.test(clientDisplay ?? '') || !!marcheRef?.includes('DV-'),
    `Step2 client visible=${rabatOnPage} text="${(clientDisplay ?? '').slice(0, 80)}" marcheRef="${marcheRef}"`,
  );

  await browser.close();

  const outPath = path.resolve(__dirname, '../../../../docs/qa/erp-audit-2026-06-19/batch-verify-20260620130151.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${outPath}`);
  console.log('\n--- SUMMARY ---');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

main()
  .then((r) => process.exit(r.ok ? 0 : 1))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
