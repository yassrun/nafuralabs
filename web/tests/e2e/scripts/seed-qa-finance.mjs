/**
 * Seed QA finance configuration data via ERP API (authenticated session).
 * Run: node tests/e2e/scripts/seed-qa-finance.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const ERP_BASE = process.env.ERP_BASE ?? 'http://erp.nafura.local';
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';

const QA_REF = 'QA-FIN-2026';

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

function pageItems(body) {
  if (Array.isArray(body)) return body;
  return body?.content ?? body?.items ?? [];
}

function findFournisseur(items, name) {
  return items.find((f) => (f.raisonSociale ?? f.name ?? '').toLowerCase().includes(name.toLowerCase()));
}

async function ensureConditionPaiement60Fdm(request, session, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/payment-terms?page=0&size=500');
  if (!list.ok) {
    log.push({ step: 'condition-60FDM-list', ok: false, status: list.status, body: list.body });
    return null;
  }
  const existing = pageItems(list.body).find((t) => t.code === '60FDM');
  if (existing) {
    log.push({ step: 'condition-60FDM', ok: true, action: 'exists', id: existing.id, code: existing.code });
    return existing.id;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/payment-terms', {
    code: '60FDM',
    name: '60 jours fin de mois',
    days: 60,
    termType: 'FIN_DE_MOIS',
    isActive: true,
    isDefault: false,
    notes: `${QA_REF} — condition paiement QA`,
  });
  log.push({
    step: 'condition-60FDM',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    body: created.ok ? undefined : created.body,
  });
  return created.body?.id ?? null;
}

async function loadCurrencies(request, session, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/currencies?page=0&size=50');
  if (!list.ok) {
    log.push({ step: 'currencies-list', ok: false, status: list.status, body: list.body });
    return {};
  }
  const items = pageItems(list.body);
  const byCode = Object.fromEntries(items.map((c) => [c.code, c]));
  for (const code of ['MAD', 'EUR', 'USD']) {
    if (!byCode[code]) {
      log.push({ step: `currency-${code}`, ok: false, action: 'missing' });
    }
  }
  return byCode;
}

async function ensureExchangeRate(request, session, log, currencies, code, rate, effectiveDate) {
  const foreign = currencies[code];
  const mad = currencies.MAD;
  if (!foreign?.id || !mad?.id) {
    log.push({ step: `taux-${code}`, ok: false, action: 'currency-not-found', code });
    return null;
  }

  const list = await apiJson(request, session, 'GET', '/api/v1/exchange-rates?page=0&size=500');
  if (!list.ok) {
    log.push({ step: `taux-${code}-list`, ok: false, status: list.status, body: list.body });
    return null;
  }
  const existing = pageItems(list.body).find(
    (r) => r.fromCurrencyId === foreign.id && r.effectiveDate === effectiveDate,
  );
  if (existing) {
    log.push({
      step: `taux-${code}`,
      ok: true,
      action: 'exists',
      id: existing.id,
      rate: existing.rate,
      effectiveDate,
    });
    return existing.id;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/exchange-rates', {
    fromCurrencyId: foreign.id,
    toCurrencyId: mad.id,
    rate,
    effectiveDate,
    source: QA_REF,
  });
  log.push({
    step: `taux-${code}`,
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    body: created.ok ? undefined : created.body,
  });
  return created.body?.id ?? null;
}

async function ensureComptabiliteSeed(request, session, log) {
  const accounts = await apiJson(request, session, 'GET', '/api/v1/chart-of-accounts');
  if (!accounts.ok) {
    log.push({ step: 'comptabilite-seed', ok: false, status: accounts.status, body: accounts.body });
    return null;
  }
  const count = Array.isArray(accounts.body) ? accounts.body.length : 0;
  if (count > 0) {
    log.push({ step: 'comptabilite-seed', ok: true, action: 'exists', accounts: count });
    return accounts.body;
  }

  const reset = await apiJson(request, session, 'POST', '/api/v1/chart-of-accounts/reset', {});
  const seeded = Array.isArray(reset.body) ? reset.body.length : 0;
  log.push({
    step: 'comptabilite-seed',
    ok: reset.ok && seeded > 0,
    status: reset.status,
    action: reset.ok && seeded > 0 ? 'reset-seeded' : 'reset-failed',
    accounts: seeded,
    body: reset.ok && seeded > 0 ? undefined : reset.body,
  });
  return reset.ok ? reset.body : null;
}

async function ensureJournalAchats(request, session, log, { skipCreateIfMissing = false } = {}) {
  const list = await apiJson(request, session, 'GET', '/api/v1/journals');
  if (!list.ok) {
    log.push({ step: 'journal-AC-list', ok: false, status: list.status, body: list.body });
    return null;
  }
  const journals = Array.isArray(list.body) ? list.body : [];
  const existing = journals.find((j) => j.code === 'AC');
  if (existing) {
    log.push({ step: 'journal-AC', ok: true, action: 'exists', id: existing.id });
    return existing;
  }
  if (skipCreateIfMissing) {
    log.push({
      step: 'journal-AC',
      ok: false,
      action: 'missing-after-cgnc-reset',
      hint: 'POST /api/v1/chart-of-accounts/reset should seed journal AC',
    });
    return null;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/journals', {
    code: 'AC',
    name: 'Achats',
    journalType: 'ACHAT',
    isActive: true,
  });
  log.push({
    step: 'journal-AC',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    body: created.ok ? undefined : created.body,
  });
  return created.ok ? created.body : null;
}

async function ensureEcritureAchatsSika(request, session, log, journal) {
  if (!journal?.id) return null;

  const ref = `${QA_REF}-EC-ACH-SIKA`;
  const existingList = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/journal-entries?journalCode=AC&search=${encodeURIComponent(ref)}`,
  );
  if (existingList.ok) {
    const hit = (Array.isArray(existingList.body) ? existingList.body : []).find(
      (e) => e.reference === ref,
    );
    if (hit) {
      log.push({ step: 'ecriture-achats-sika', ok: true, action: 'exists', id: hit.id, entryNumber: hit.entryNumber });
      return hit.id;
    }
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/journal-entries', {
    journalId: journal.id,
    journalCode: 'AC',
    entryDate: '2026-06-19',
    reference: ref,
    label: 'Achats ciment (BC Sika) — QA',
    status: 'BROUILLON',
    origin: QA_REF,
    lines: [
      {
        lineNumber: 1,
        accountCode: '6111',
        accountLabel: 'Achats ciment (BC Sika)',
        debit: 114400,
        credit: 0,
      },
      {
        lineNumber: 2,
        accountCode: '34552',
        accountLabel: 'TVA déductible 20 %',
        debit: 22880,
        credit: 0,
      },
      {
        lineNumber: 3,
        accountCode: '4411',
        accountLabel: 'Fournisseur Sika Maroc',
        debit: 0,
        credit: 137280,
        thirdPartyName: 'Sika Maroc SARL',
        dueDate: '2026-07-18',
      },
    ],
  });
  log.push({
    step: 'ecriture-achats-sika',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    entryNumber: created.body?.entryNumber,
    body: created.ok ? undefined : created.body,
  });
  return created.body?.id ?? null;
}

async function findSikaFournisseurId(request, session, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/partners?role=FOURNISSEUR&page=0&size=500');
  if (!list.ok) {
    log.push({ step: 'fournisseur-sika-list', ok: false, status: list.status, body: list.body });
    return null;
  }
  const page = list.body;
  const items = page?.content ?? page?.items ?? (Array.isArray(page) ? page : []);
  const sika = findFournisseur(items, 'Sika Maroc');
  if (!sika) {
    log.push({ step: 'fournisseur-sika', ok: false, action: 'not-found', hint: 'run seed-qa-ref-data.mjs first' });
    return null;
  }
  return sika.id;
}

async function findBonCommande(request, session, numero = 'BC-2026-00001') {
  const list = await apiJson(request, session, 'GET', '/api/v1/bons-commande-achat');
  const items = Array.isArray(list.body) ? list.body : list.body?.content ?? [];
  return items.find((b) => b.numero === numero) ?? null;
}

async function ensureFactureFournisseurSika(request, session, log, fournisseurId) {
  if (!fournisseurId) return null;

  const numero = 'FF-2026-0345';
  const list = await apiJson(request, session, 'GET', '/api/v1/factures-fournisseur');
  if (list.ok) {
    const hit = (Array.isArray(list.body) ? list.body : []).find((f) => f.numeroFournisseur === numero);
    if (hit) {
      log.push({
        step: 'facture-sika',
        ok: true,
        action: 'exists',
        id: hit.id,
        numeroInterne: hit.numeroInterne,
        numeroFournisseur: hit.numeroFournisseur,
      });
      return hit.id;
    }
  }

  const bc = await findBonCommande(request, session);
  const payload = {
    numeroFournisseur: numero,
    fournisseurId: String(fournisseurId),
    fournisseurName: 'Sika Maroc SARL',
    dateFacture: '2026-06-18',
    dateEcheance: '2026-07-18',
    status: 'BROUILLON',
    notes: `${QA_REF} — facture fournisseur QA (rapprochement BC Sika)`,
    lignes: [
      {
        ordre: 1,
        designation: 'Ciment Sika — livraison chantier',
        compteCode: '6111',
        quantite: 1,
        prixUnitaireHt: 114400,
        totalHt: 114400,
        tvaTaux: 20,
      },
    ],
  };
  if (bc) {
    payload.bcId = bc.id;
    payload.bcNumero = bc.numero;
    payload.chantierId = bc.chantierId;
    payload.chantierName = bc.chantierName;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/factures-fournisseur', payload);
  const blockedWithoutBc =
    !created.ok &&
    created.status === 409 &&
    String(created.body?.message ?? '').includes('purchase order');
  log.push({
    step: 'facture-sika',
    ok: created.ok || blockedWithoutBc,
    blocked: blockedWithoutBc || undefined,
    status: created.status,
    action: created.ok ? 'created' : blockedWithoutBc ? 'blocked-no-bc' : 'failed',
    id: created.body?.id,
    numeroInterne: created.body?.numeroInterne,
    body: created.ok || blockedWithoutBc ? undefined : created.body,
  });
  return created.body?.id ?? null;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_FILE });
  const page = await context.newPage();
  const request = context.request;
  const log = [];

  await page.goto(`${ERP_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);

  const session = await getSession(page);
  if (!session) {
    console.error('No ERP session — run: npx playwright test --config=playwright.audit.config.ts erp-audit-auth.setup.ts');
    await browser.close();
    process.exit(1);
  }

  await ensureConditionPaiement60Fdm(request, session, log);

  const currencies = await loadCurrencies(request, session, log);
  await ensureExchangeRate(request, session, log, currencies, 'EUR', 10.85, '2026-06-19');
  await ensureExchangeRate(request, session, log, currencies, 'USD', 9.95, '2026-06-19');

  await ensureComptabiliteSeed(request, session, log);
  const journalAc = await ensureJournalAchats(request, session, log, { skipCreateIfMissing: true });
  await ensureEcritureAchatsSika(request, session, log, journalAc);

  const sikaId = await findSikaFournisseurId(request, session, log);
  await ensureFactureFournisseurSika(request, session, log, sikaId);

  await browser.close();

  const failed = log.filter((e) => e.ok === false);
  console.log(JSON.stringify({ ok: failed.length === 0, log }, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
