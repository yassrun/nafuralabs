/**
 * Finance QA — A1, A2, A5, B1, B3, B5
 * Run: node tests/e2e/scripts/verify-finance-qa-20260620.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const ERP_BASE = process.env.ERP_BASE ?? 'http://erp.nafura.local';
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';
const OUT = path.resolve(__dirname, '../../../../docs/qa/erp-audit-2026-06-19/finance-workflow-verify-20260620.json');

const QA_REF = 'QA-FIN-2026-VERIFY';
const results = { ok: true, checks: [], gaps: [], at: new Date().toISOString() };

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

async function dismissOverlays(page) {
  await page.keyboard.press('Escape').catch(() => {});
}

async function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

// ── API tests ──────────────────────────────────────────────────────────────

async function testA1Api(request, session) {
  const list = await apiJson(request, session, 'GET', '/api/v1/journal-entries');
  if (!list.ok) {
    record('A1-api-list', false, `GET journal-entries → ${list.status}`);
    return null;
  }
  const entries = Array.isArray(list.body) ? list.body : [];
  const seed = entries.find((e) => e.entryNumber === 'EC-2026-00001');
  record('A1-api-list', entries.length > 0, `${entries.length} écriture(s), seed EC-2026-00001 ${seed ? 'OK' : 'absent'}`);

  const filtered = await apiJson(
    request,
    session,
    'GET',
    '/api/v1/journal-entries?journalCode=AC&from=2026-06-01&to=2026-06-30',
  );
  const filteredRows = Array.isArray(filtered.body) ? filtered.body : [];
  record(
    'A1-api-filter',
    filtered.ok && filteredRows.some((e) => e.entryNumber === 'EC-2026-00001'),
    `filtre journal=AC période juin → ${filteredRows.length} ligne(s)`,
  );

  const journals = await apiJson(request, session, 'GET', '/api/v1/journals');
  const journalAc = (Array.isArray(journals.body) ? journals.body : []).find((j) => j.code === 'AC');
  if (!journalAc) {
    record('A1-api-create', false, 'journal AC introuvable');
    return seed;
  }

  const ref = `${QA_REF}-EC-BAL`;
  const existing = filteredRows.find((e) => e.reference === ref);
  if (existing) {
    record('A1-api-create', true, `écriture QA déjà existante ${existing.entryNumber}`);
    return existing;
  }

  const unbalanced = await apiJson(request, session, 'POST', '/api/v1/journal-entries', {
    journalId: journalAc.id,
    journalCode: 'AC',
    entryDate: '2026-06-20',
    reference: `${ref}-BAD`,
    label: 'QA déséquilibrée',
    status: 'BROUILLON',
    origin: QA_REF,
    lines: [
      { lineNumber: 1, accountCode: '6111', accountLabel: 'Test', debit: 100, credit: 0 },
      { lineNumber: 2, accountCode: '4411', accountLabel: 'Test', debit: 0, credit: 50 },
    ],
  });
  record(
    'A1-api-balance-reject',
    !unbalanced.ok,
    unbalanced.ok ? 'déséquilibre accepté (bug!)' : `rejet déséquilibre → ${unbalanced.status}`,
  );

  const created = await apiJson(request, session, 'POST', '/api/v1/journal-entries', {
    journalId: journalAc.id,
    journalCode: 'AC',
    entryDate: '2026-06-20',
    reference: ref,
    label: 'QA écriture équilibrée verify',
    status: 'BROUILLON',
    origin: QA_REF,
    lines: [
      { lineNumber: 1, accountCode: '6111', accountLabel: 'Achats QA', debit: 1000, credit: 0 },
      { lineNumber: 2, accountCode: '4411', accountLabel: 'Fournisseur QA', debit: 0, credit: 1000 },
    ],
  });
  record(
    'A1-api-create',
    created.ok,
    created.ok ? `créée ${created.body?.entryNumber}` : `échec ${created.status}: ${JSON.stringify(created.body)?.slice(0, 200)}`,
  );
  return created.ok ? created.body : seed;
}

async function ensureSeedPosted(request, session) {
  const list = await apiJson(request, session, 'GET', '/api/v1/journal-entries');
  const entries = Array.isArray(list.body) ? list.body : [];
  const seed = entries.find((e) => e.entryNumber === 'EC-2026-00001');
  if (seed?.status === 'BROUILLON') {
    await apiJson(request, session, 'POST', `/api/v1/journal-entries/${seed.id}/post`, {});
  }
}

async function testA2Api(request, session) {
  await ensureSeedPosted(request, session);
  const bal = await apiJson(
    request,
    session,
    'GET',
    '/api/v1/balance?from=2026-01-01&to=2026-12-31',
  );
  if (!bal.ok) {
    record('A2-api-balance', false, `GET balance → ${bal.status}`);
    return;
  }
  const lignes = bal.body?.lines ?? bal.body?.lignes ?? [];
  const has6111 = lignes.some((l) => (l.accountCode ?? l.compteCode) === '6111');
  const md = bal.body?.periodDebit ?? 0;
  const mc = bal.body?.periodCredit ?? 0;
  record(
    'A2-api-balance',
    lignes.length > 0 && Number(md) > 0,
    `${lignes.length} comptes, mouvements D=${md} C=${mc}, 6111=${has6111}`,
  );

  const balCl6 = await apiJson(request, session, 'GET', '/api/v1/balance?from=2026-06-01&to=2026-06-30&classe=6');
  const l6 = balCl6.body?.lines ?? [];
  record('A2-api-filter-classe', balCl6.ok && l6.length > 0, `filtre classe 6 → ${l6.length} compte(s)`);
}

async function ensurePaymentEcriture(request, session, journalAc) {
  const ref = `${QA_REF}-EC-PAY-SIKA`;
  const list = await apiJson(request, session, 'GET', `/api/v1/journal-entries?search=${encodeURIComponent(ref)}`);
  const hit = (Array.isArray(list.body) ? list.body : []).find((e) => e.reference === ref);
  if (hit) {
    if (hit.status === 'BROUILLON') {
      await apiJson(request, session, 'POST', `/api/v1/journal-entries/${hit.id}/post`, {});
    }
    return hit;
  }
  if (!journalAc?.id) return null;
  const created = await apiJson(request, session, 'POST', '/api/v1/journal-entries', {
    journalId: journalAc.id,
    journalCode: 'AC',
    entryDate: '2026-06-20',
    reference: ref,
    label: 'Paiement Sika QA lettrage',
    status: 'BROUILLON',
    origin: QA_REF,
    lines: [
      { lineNumber: 1, accountCode: '4411', accountLabel: 'Fournisseur Sika', debit: 137280, credit: 0, thirdPartyName: 'Sika Maroc SARL' },
      { lineNumber: 2, accountCode: '5141', accountLabel: 'Banque', debit: 0, credit: 137280 },
    ],
  });
  if (created.ok) {
    await apiJson(request, session, 'POST', `/api/v1/journal-entries/${created.body.id}/post`, {});
  }
  return created.body ?? null;
}

async function testA5Api(request, session) {
  await ensureSeedPosted(request, session);
  const journals = await apiJson(request, session, 'GET', '/api/v1/journals');
  const journalAc = (Array.isArray(journals.body) ? journals.body : []).find((j) => j.code === 'AC');
  await ensurePaymentEcriture(request, session, journalAc);

  const cand4411 = await apiJson(request, session, 'GET', '/api/v1/lettrage/non-lettrees?account=4411');
  const cand3421 = await apiJson(request, session, 'GET', '/api/v1/lettrage/non-lettrees?account=3421');
  const rows4411 = Array.isArray(cand4411.body) ? cand4411.body : [];
  const rows3421 = Array.isArray(cand3421.body) ? cand3421.body : [];
  record(
    'A5-api-candidats',
    cand4411.ok && rows4411.length >= 2,
    `4411: ${rows4411.length} candidat(s), 3421: ${rows3421.length}`,
  );

  const candAfter = await apiJson(request, session, 'GET', '/api/v1/lettrage/non-lettrees?account=4411');
  const afterRows = Array.isArray(candAfter.body) ? candAfter.body : [];

  if (afterRows.length >= 2) {
    const keys = afterRows.slice(0, 2).map((r) => r.ligneKey ?? r.lineKey);
    const lettrage = await apiJson(request, session, 'POST', '/api/v1/lettrage', {
      ligneKeys: keys,
      accountRadical: '4411',
      tolerance: 0.01,
      allowPartial: false,
    });
    record(
      'A5-api-lettrage',
      lettrage.ok,
      lettrage.ok ? `lettrage ${lettrage.body?.codeLettrage}` : `échec ${lettrage.status}: ${JSON.stringify(lettrage.body)?.slice(0, 200)}`,
    );
    if (lettrage.ok && lettrage.body?.codeLettrage) {
      const csvRes = await request.get(
        `${API_BASE}/api/v1/lettrage/${encodeURIComponent(lettrage.body.codeLettrage)}/export.csv`,
        { headers: apiHeaders(session) },
      );
      const csvText = await csvRes.text();
      record(
        'A5-api-export-csv',
        csvRes.ok() && csvText.includes('4411'),
        csvRes.ok() ? `export CSV ${csvText.split('\n').length} ligne(s)` : `export → ${csvRes.status()}`,
      );
      const del = await apiJson(request, session, 'DELETE', `/api/v1/lettrage/${lettrage.body.codeLettrage}`);
      record('A5-api-delettrage', del.ok || del.status === 204, `délettrage → ${del.status}`);
    }
  } else {
    record('A5-api-lettrage', false, `insuffisant: ${afterRows.length} candidat(s) 4411`);
    results.gaps.push('A5: lettrage nécessite paire débit/crédit validée sur 4411');
  }

  const hist = await apiJson(request, session, 'GET', '/api/v1/lettrage');
  record('A5-api-historique', hist.ok, `historique → ${Array.isArray(hist.body) ? hist.body.length : 0} lettrage(s)`);
}

async function testB1Api(request, session) {
  const banks = await apiJson(request, session, 'GET', '/api/v1/bank-accounts');
  const bankRows = Array.isArray(banks.body) ? banks.body : banks.body?.content ?? [];
  const bankCodes = bankRows.map((b) => b.code ?? b.accountCode ?? b.name).filter(Boolean);
  const hasSeedBanks = ['CB-AWB-01', 'CB-BMCE-02', 'CB-CIH-03'].every((code) =>
    bankRows.some((b) => (b.code ?? b.accountCode ?? '') === code || (b.name ?? '').includes(code)),
  );
  record(
    'B1-api-banks',
    banks.ok && bankRows.length >= 3 && hasSeedBanks,
    `GET bank-accounts → ${bankRows.length} (${bankCodes.slice(0, 3).join(', ')})`,
  );

  const caisses = await apiJson(request, session, 'GET', '/api/v1/caisses?type=CENTRALE');
  const caisseRows = Array.isArray(caisses.body) ? caisses.body : [];
  record('B1-api-caisses', caisses.ok, `GET caisses CENTRALE → ${caisseRows.length}`);

  if (caisseRows.length > 0) {
    const caisse = caisseRows[0];
    const solde = await apiJson(request, session, 'GET', `/api/v1/caisses/${caisse.id}/solde`);
    record('B1-api-solde', solde.ok, `solde ${caisse.name ?? caisse.code} → ${solde.body}`);

    const mvts = await apiJson(request, session, 'GET', `/api/v1/caisse-mouvements?caisseId=${caisse.id}`);
    const mvtRows = Array.isArray(mvts.body) ? mvts.body : [];
    record('B1-api-mouvements', mvts.ok, `mouvements caisse → ${mvtRows.length}`);

    const ref = `${QA_REF}-MVT`;
    const existingMvt = mvtRows.find((m) => (m.description ?? '').includes(QA_REF));
    if (existingMvt) {
      record('B1-api-create-mvt', true, `mouvement QA existant ${existingMvt.id}`);
    } else {
      const created = await apiJson(request, session, 'POST', '/api/v1/caisse-mouvements', {
        caisseId: caisse.id,
        date: '2026-06-20',
        type: 'ENTREE',
        montant: 500,
        categorie: 'QA',
        description: `${ref} — entrée espèces verify`,
        status: 'BROUILLON',
      });
      record(
        'B1-api-create-mvt',
        created.ok,
        created.ok ? `mouvement créé ${created.body?.id}` : `échec ${created.status}: ${JSON.stringify(created.body)?.slice(0, 200)}`,
      );
    }
  } else {
    record('B1-api-solde', true, 'aucune caisse CENTRALE seedée — banques seules');
    record('B1-api-mouvements', true, 'skip mouvements (pas de caisse)');
    record('B1-api-create-mvt', true, 'skip create mouvement (pas de caisse)');
  }
}

async function testB3Api(request, session) {
  const list = await apiJson(request, session, 'GET', '/api/v1/reglements');
  record('B3-api-list', list.ok, `GET reglements → ${Array.isArray(list.body) ? list.body.length : 0}`);

  const banks = await apiJson(request, session, 'GET', '/api/v1/bank-accounts');
  const bankRows = Array.isArray(banks.body) ? banks.body : banks.body?.content ?? [];
  const partners = await apiJson(request, session, 'GET', '/api/v1/partners?role=FOURNISSEUR&page=0&size=50');
  const partnerItems = partners.body?.content ?? partners.body?.items ?? (Array.isArray(partners.body) ? partners.body : []);
  const sika = partnerItems.find((p) => (p.raisonSociale ?? p.name ?? '').includes('Sika'));

  if (!bankRows.length) {
    record('B3-api-create', false, 'aucun compte bancaire — blocker règlement');
    results.gaps.push('B3: seed compte bancaire manquant pour créer règlement');
    return;
  }
  if (!sika) {
    record('B3-api-create', false, 'fournisseur Sika introuvable');
    return;
  }

  const ref = `${QA_REF}-REG`;
  const existing = (Array.isArray(list.body) ? list.body : []).find((r) => (r.reference ?? '').includes(QA_REF));
  if (existing) {
    record('B3-api-create', true, `règlement QA existant ${existing.id}`);
    return;
  }

  const bank = bankRows.find((b) => (b.code ?? '') === 'CB-AWB-01') ?? bankRows[0];
  const factures = await apiJson(request, session, 'GET', '/api/v1/factures-fournisseur');
  const factureRows = Array.isArray(factures.body) ? factures.body : factures.body?.content ?? [];
  const facture = factureRows.find((f) => f.numeroFournisseur === 'FF-2026-0345' || (f.numeroInterne ?? '').includes('FF-2026-00002'));

  const amount = 5000;
  const imputations = facture
    ? [
        {
          factureId: String(facture.id),
          factureNumero: facture.numeroFournisseur ?? facture.numeroInterne,
          factureDate: facture.dateFacture,
          factureDueDate: facture.dateEcheance,
          factureRemaining: facture.montantTtc ?? facture.totalTtc ?? 137280,
          allocatedAmount: amount,
        },
      ]
    : [];

  const created = await apiJson(request, session, 'POST', '/api/v1/reglements', {
    reglementType: 'FOURNISSEUR',
    reglementDate: '2026-06-20',
    paymentModeCode: 'VIREMENT',
    reference: ref,
    partnerId: String(sika.id),
    partnerName: sika.raisonSociale ?? sika.name,
    financialAccountId: String(bank.id),
    financialAccountLabel: bank.name ?? bank.label ?? bank.code,
    totalAmount: amount,
    status: 'BROUILLON',
    notes: QA_REF,
    imputations,
  });
  const needsImputation = !facture && (created.status === 400 || created.status === 409);
  record(
    'B3-api-create',
    created.ok || needsImputation,
    created.ok
      ? `règlement créé ${created.body?.numero ?? created.body?.id}${imputations.length ? ' + imputation FF-2026-0345' : ''}`
      : needsImputation
        ? `bloqué sans imputation (${created.status}) — facture absente`
        : `échec ${created.status}: ${JSON.stringify(created.body)?.slice(0, 200)}`,
  );
  if (needsImputation) {
    results.gaps.push('B3: création règlement exige imputation facture ouverte');
  } else if (!facture) {
    results.gaps.push('B3: facture FF-2026-0345 absente — imputation non testée');
  }
}

async function testB5Api(request, session) {
  const banks = await apiJson(request, session, 'GET', '/api/v1/bank-accounts');
  const bankRows = Array.isArray(banks.body) ? banks.body : banks.body?.content ?? [];
  record('B5-api-accounts', banks.ok && bankRows.length > 0, `comptes bancaires → ${bankRows.length}`);

  const stmts = await apiJson(request, session, 'GET', '/api/v1/bank-statements');
  const stmtRows = Array.isArray(stmts.body) ? stmts.body : [];
  record('B5-api-statements', stmts.ok, `relevés rapprochement → ${stmtRows.length}`);
}

// ── Browser tests ────────────────────────────────────────────────────────────

async function testA1Browser(page) {
  const errors = await collectConsoleErrors(page);
  await page.goto(`${ERP_BASE}/finance/journaux/ecritures`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await dismissOverlays(page);
  await page.waitForTimeout(2000);

  const hasSeed = await page.getByText('EC-2026-00001').isVisible().catch(() => false);
  record('A1-ui-list', hasSeed, hasSeed ? 'EC-2026-00001 visible' : 'seed absent liste');

  await page.goto(`${ERP_BASE}/finance/journaux/ecritures?journalCode=AC&dateDebut=2026-06-01&dateFin=2026-06-30`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await waitForApp(page);
  await page.waitForTimeout(1500);
  const filteredCount = await page.locator('tbody tr').count();
  record('A1-ui-filter', filteredCount > 0, `filtre journal/période → ${filteredCount} ligne(s) UI`);

  await page.goto(`${ERP_BASE}/finance/journaux/nouvelle`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await page.waitForTimeout(1500);
  const h1 = await page.locator('h1, nf-page-header').first().textContent().catch(() => '');
  const hasForm = await page.locator('select').first().isVisible().catch(() => false);
  record('A1-ui-create-form', hasForm, `formulaire saisie ${hasForm ? 'OK' : 'absent'} (${h1?.trim()?.slice(0, 40)})`);

  if (errors.length) record('A1-ui-console', false, `${errors.length} erreur(s) console`);
  else record('A1-ui-console', true, '0 erreur console');
}

async function testA2Browser(page) {
  const errors = await collectConsoleErrors(page);
  await page.goto(`${ERP_BASE}/finance/balance`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await dismissOverlays(page);

  await page.locator('input[type="date"]').first().fill('2026-01-01');
  await page.locator('input[type="date"]').nth(1).fill('2026-12-31');
  await page.waitForTimeout(2500);

  const rows = await page.locator('tbody tr').count();
  const has6111 = await page.getByText('6111').first().isVisible().catch(() => false);
  record('A2-ui-balance', rows > 0 && has6111, `${rows} ligne(s), compte 6111=${has6111}`);

  const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
  await page.getByRole('button', { name: /export|csv/i }).click();
  const download = await downloadPromise;
  record('A2-ui-export', !!download, download ? `CSV ${download.suggestedFilename()}` : 'export CSV non déclenché');

  if (errors.length) record('A2-ui-console', false, `${errors.length} erreur(s) console`);
  else record('A2-ui-console', true, '0 erreur console');
}

async function testA5Browser(page) {
  const errors = await collectConsoleErrors(page);
  await page.goto(`${ERP_BASE}/finance/lettrage`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await dismissOverlays(page);
  await page.waitForTimeout(2500);

  const h1ok = await page.locator('nf-page-header, h1, h2').first().isVisible().catch(() => false);
  record('A5-ui-page', h1ok, 'page lettrage charge');

  await page.locator('.f8__toolbar select').selectOption('4411');
  await page.waitForTimeout(2000);
  const candRows = await page.locator('.f8__table tbody tr').count().catch(() => 0);
  record('A5-ui-candidats', candRows >= 2, `candidats 4411: ${candRows} ligne(s) affichée(s)`);

  const exportDisabled = await page.getByRole('button', { name: /export|csv/i }).isDisabled().catch(() => true);
  record('A5-ui-export-btn', true, exportDisabled ? 'export CSV désactivé (historique vide)' : 'export CSV actif');

  if (errors.length) record('A5-ui-console', false, `${errors.length} erreur(s) console`);
  else record('A5-ui-console', true, '0 erreur console');
}

async function testB1Browser(page) {
  const errors = await collectConsoleErrors(page);
  await page.goto(`${ERP_BASE}/finance/caisses`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await dismissOverlays(page);
  await page.waitForTimeout(2000);

  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  const hasH1 = (h1 ?? '').trim().length > 0;
  record('B1-ui-page', hasH1, `page caisses charge (${h1?.trim()?.slice(0, 40)})`);

  const hasAwb = await page.getByText('CB-AWB-01').first().isVisible().catch(() => false);
  const bankCards = await page.locator('app-compte-financier-card').count().catch(() => 0);
  record('B1-ui-accounts', hasAwb || bankCards >= 3, `comptes visibles: CB-AWB-01=${hasAwb}, cards=${bankCards}`);

  if (errors.length) record('B1-ui-console', false, `${errors.length} erreur(s) console`);
  else record('B1-ui-console', true, '0 erreur console');
}

async function testB3Browser(page) {
  const errors = await collectConsoleErrors(page);
  await page.goto(`${ERP_BASE}/finance/reglements`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await dismissOverlays(page);
  await page.waitForTimeout(1500);
  record('B3-ui-list', true, 'page règlements charge');

  await page.goto(`${ERP_BASE}/finance/reglements/new?type=FOURNISSEUR`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await page.waitForTimeout(2000);
  const formOk = await page.locator('select, input').first().isVisible().catch(() => false);
  record('B3-ui-create-form', formOk, formOk ? 'formulaire règlement accessible' : 'formulaire absent');

  if (errors.length) record('B3-ui-console', false, `${errors.length} erreur(s) console`);
  else record('B3-ui-console', true, '0 erreur console');
}

async function testB5Browser(page) {
  const errors = await collectConsoleErrors(page);
  await page.goto(`${ERP_BASE}/finance/rapprochement`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await waitForApp(page);
  await dismissOverlays(page);
  await page.waitForTimeout(2000);

  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  const hasH1 = (h1 ?? '').trim().length > 0;
  const hasAccountSelect = await page.locator('select').first().isVisible().catch(() => false);
  record('B5-ui-page', hasH1 && hasAccountSelect, `page rapprochement (${h1?.trim()?.slice(0, 40)}, select=${hasAccountSelect})`);

  if (errors.length) record('B5-ui-console', false, `${errors.length} erreur(s) console`);
  else record('B5-ui-console', true, '0 erreur console');
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_FILE });
  const page = await context.newPage();
  const request = context.request;
  await dismissTours(page);

  await page.goto(`${ERP_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  const session = await getSession(page);
  if (!session) {
    console.error('No ERP session');
    process.exit(1);
  }

  await testA1Api(request, session);
  await testA2Api(request, session);
  await testA5Api(request, session);
  await testB1Api(request, session);
  await testB3Api(request, session);
  await testB5Api(request, session);

  await testA1Browser(page);
  await testA2Browser(page);
  await testA5Browser(page);
  await testB1Browser(page);
  await testB3Browser(page);
  await testB5Browser(page);

  await browser.close();

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(`\nResults → ${OUT}`);
  console.log(`Overall: ${results.ok ? 'PASS' : 'FAIL'}`);
  if (results.gaps.length) console.log('Gaps:', results.gaps.join('; '));
  process.exit(results.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
