/**
 * RH QA — congés workflow, employé create, paie PAYEE
 * Run: node web/tests/e2e/scripts/verify-rh-qa-20260620.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const ERP_BASE = process.env.ERP_BASE ?? 'http://erp.nafura.local';
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';
const BUILD = process.env.QA_BUILD ?? 'dev-20260620112100';

const results = { ok: true, build: BUILD, checks: [], gaps: [], at: new Date().toISOString() };

function record(id, pass, detail, extra = {}) {
  results.checks.push({ id, pass, detail, ...extra });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id}: ${detail}`);
  if (!pass) results.ok = false;
}

function gap(text) {
  results.gaps.push(text);
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
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_FILE });
  await dismissTours(await context.newPage());
  const page = await context.newPage();
  await page.goto(`${ERP_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  const session = await getSession(page);
  if (!session) throw new Error('No ERP session');
  const request = context.request;

  // --- Task 3: paie-002 status + payer ---
  const paieRes = await apiJson(request, session, 'GET', '/api/v1/rh/fiches-paie/paie-002');
  if (!paieRes.ok) {
    record('paie-002-get', false, `GET paie-002 → ${paieRes.status}`);
  } else {
    const status = paieRes.body?.status;
    record('paie-002-status', true, `paie-002 status=${status}`, { status });
    if (status === 'VALIDEE') {
      const payer = await apiJson(request, session, 'POST', '/api/v1/rh/fiches-paie/paie-002/payer');
      record(
        'paie-002-payer',
        payer.ok && payer.body?.status === 'PAYEE',
        `POST payer → ${payer.status} status=${payer.body?.status ?? payer.body}`,
        { httpStatus: payer.status, newStatus: payer.body?.status },
      );
    } else if (status === 'PAYEE') {
      record('paie-002-payer', true, 'Already PAYEE — payer skipped', { skipped: true });
      const retry = await apiJson(request, session, 'POST', '/api/v1/rh/fiches-paie/paie-002/payer');
      record(
        'paie-002-payer-retry',
        retry.status === 400 || retry.status === 409 || retry.status === 422,
        `Retry payer on PAYEE → ${retry.status} (expected error)`,
        { httpStatus: retry.status, body: retry.body },
      );
    } else {
      record('paie-002-payer', false, `Unexpected status ${status}`);
    }
  }

  // --- Task 1: congé cng-001 ---
  const cngRes = await apiJson(request, session, 'GET', '/api/v1/rh/conges/cng-001');
  if (!cngRes.ok) {
    record('cng-001-get', false, `GET cng-001 → ${cngRes.status}`);
  } else {
    const cng = cngRes.body;
    record('cng-001-state', true, `${cng.numero} status=${cng.status}`, { status: cng.status, numero: cng.numero });

    // Refuser only from DEMANDE
    if (cng.status === 'DEMANDE') {
      const reject = await apiJson(request, session, 'POST', '/api/v1/rh/conges/cng-001/reject', {
        motifRefus: 'QA test refus',
      });
      record(
        'cng-001-refuser-api',
        reject.ok && reject.body?.status === 'REFUSE',
        `POST reject → ${reject.status} status=${reject.body?.status}`,
      );
    } else {
      record('cng-001-refuser-api', true, `Refuser N/A — status=${cng.status} (needs DEMANDE)`, { skipped: true });
    }

    // Ensure APPROUVE for demarrer test
    let working = cngRes.body;
    if (working.status === 'DEMANDE') {
      const approve = await apiJson(request, session, 'POST', '/api/v1/rh/conges/cng-001/approve');
      if (approve.ok) working = approve.body;
    }

    if (working.status === 'APPROUVE') {
      const demarrer = await apiJson(request, session, 'PUT', '/api/v1/rh/conges/cng-001', { status: 'EN_COURS' });
      record(
        'cng-001-demarrer-api',
        demarrer.ok && demarrer.body?.status === 'EN_COURS',
        `PUT status EN_COURS → ${demarrer.status} status=${demarrer.body?.status}`,
      );
      working = demarrer.body ?? working;
    } else if (working.status === 'EN_COURS') {
      record('cng-001-demarrer-api', true, 'Already EN_COURS', { skipped: true });
    } else if (working.status === 'SOLDE') {
      record('cng-001-demarrer-api', true, 'Already SOLDE — demarrer N/A', { skipped: true });
    } else {
      record('cng-001-demarrer-api', false, `Cannot demarrer from status=${working.status}`);
    }

    const afterDem = await apiJson(request, session, 'GET', '/api/v1/rh/conges/cng-001');
    const cur = afterDem.body;
    if (cur?.status === 'EN_COURS') {
      const solder = await apiJson(request, session, 'PUT', '/api/v1/rh/conges/cng-001', { status: 'SOLDE' });
      record(
        'cng-001-solder-api',
        solder.ok && solder.body?.status === 'SOLDE',
        `PUT status SOLDE → ${solder.status} status=${solder.body?.status}`,
      );
    } else if (cur?.status === 'SOLDE') {
      record('cng-001-solder-api', true, 'Already SOLDE', { skipped: true });
    } else {
      record('cng-001-solder-api', false, `Cannot solder from status=${cur?.status}`);
    }
  }

  // Browser: congé detail buttons
  await page.goto(`${ERP_BASE}/rh/conges/cng-001`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  const finalCng = (await apiJson(request, session, 'GET', '/api/v1/rh/conges/cng-001')).body;
  const status = finalCng?.status;
  const btnLabels = ['Approuver', 'Refuser', 'Démarrer', 'Solder'];
  for (const label of btnLabels) {
    const btn = page.getByRole('button', { name: new RegExp(label, 'i') });
    const visible = await btn.isVisible().catch(() => false);
    const expected =
      (label === 'Approuver' && status === 'DEMANDE') ||
      (label === 'Refuser' && status === 'DEMANDE') ||
      (label === 'Démarrer' && status === 'APPROUVE') ||
      (label === 'Solder' && status === 'EN_COURS');
    record(
      `cng-001-ui-${label.toLowerCase()}`,
      visible === expected,
      `Button "${label}" visible=${visible} status=${status} expected=${expected}`,
      { visible, status },
    );
  }

  // --- Task 2: employé create form ---
  await page.goto(`${ERP_BASE}/rh/employes/new`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  const requiredFields = ['Nom', 'Prénom', 'CIN', 'Poste', 'Catégorie', 'Type de contrat', 'Date d\'embauche', 'Salaire de base'];
  for (const label of requiredFields) {
    const field = page.getByLabel(new RegExp(label, 'i')).first();
    const visible = await field.isVisible().catch(() => false);
    record(`employe-form-${label}`, visible, `Field "${label}" visible=${visible}`);
  }

  const saveBtn = page.getByRole('button', { name: /enregistrer|créer|save/i });
  const saveVisible = await saveBtn.first().isVisible().catch(() => false);
  record('employe-form-save', saveVisible, `Save button visible=${saveVisible}`);

  // Try minimal create via API
  const qaId = `emp-qa-verify-${Date.now().toString(36).slice(-6)}`;
  const createEmp = await apiJson(request, session, 'POST', '/api/v1/rh/employes', {
    id: qaId,
    nom: 'Test',
    prenom: 'QA',
    cin: 'AB123456',
    poste: 'Ouvrier QA',
    categorie: 'Ouvrier',
    typeContrat: 'CDI',
    dateEmbauche: '2026-06-01',
    salaireBase: 5000,
  });
  record(
    'employe-create-api',
    createEmp.ok && createEmp.body?.matricule,
    `POST employé → ${createEmp.status} matricule=${createEmp.body?.matricule ?? createEmp.body}`,
    { id: qaId, matricule: createEmp.body?.matricule },
  );

  if (createEmp.ok) {
    await page.goto(`${ERP_BASE}/rh/employes/${qaId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForApp(page);
    const header = await page.locator('h1, [class*="header"], [class*="title"]').first().textContent().catch(() => '');
    record(
      'employe-create-ui',
      /Test|QA|MAT-/i.test(header ?? ''),
      `Detail page header: ${(header ?? '').trim().slice(0, 80)}`,
    );
  }

  // Browser paie detail if VALIDEE or PAYEE
  await page.goto(`${ERP_BASE}/rh/paie/paie-002`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  const paieStatus = (await apiJson(request, session, 'GET', '/api/v1/rh/fiches-paie/paie-002')).body?.status;
  const payerBtn = page.getByRole('button', { name: /marquer payée|payer/i });
  const payerVisible = await payerBtn.isVisible().catch(() => false);
  record(
    'paie-002-ui-payer',
    payerVisible === (paieStatus === 'VALIDEE'),
    `Marquer payée visible=${payerVisible} status=${paieStatus}`,
    { visible: payerVisible, status: paieStatus },
  );

  const pdfRes = await request.get(`${API_BASE}/api/v1/rh/fiches-paie/paie-002/pdf`, {
    headers: apiHeaders(session),
  });
  const pdfCt = pdfRes.headers()['content-type'] ?? '';
  const pdfBytes = pdfRes.ok() ? (await pdfRes.body()).length : 0;
  record(
    'paie-pdf',
    pdfRes.status() === 200 && pdfCt.includes('pdf') && pdfBytes > 100,
    `GET pdf → ${pdfRes.status()} ${pdfCt} (${pdfBytes} bytes)`,
    { status: pdfRes.status(), contentType: pdfCt, bytes: pdfBytes },
  );

  await browser.close();
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
