/**
 * Seed RH paie QA data via ERP API (section A5 — fiche paie Karim, juin 2026).
 * Run: node web/tests/e2e/scripts/seed-qa-rh-paie.mjs
 */
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '../../..');
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const ERP_BASE = process.env.ERP_BASE ?? 'http://erp.nafura.local';
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';

const MOIS = '2026-06';
const KARIM = { id: 'emp-qa-karim', nom: 'Benali', prenom: 'Karim', matricule: 'MAT-001', salaireBase: 9000 };

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

async function apiJson(request, session, method, urlPath, data) {
  const opts = { headers: apiHeaders(session) };
  if (data !== undefined) opts.data = data;
  const res = await request[method.toLowerCase()](`${API_BASE}${urlPath}`, opts);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => null);
  }
  return { ok: res.ok(), status: res.status(), body };
}

function refreshAuthViaPlaywright() {
  const r = spawnSync(
    'npx',
    ['playwright', 'test', '--config=playwright.audit.config.ts', 'erp-audit-auth.setup.ts'],
    { cwd: WEB_ROOT, stdio: 'inherit', shell: true },
  );
  return r.status === 0;
}

async function openBrowserWithSession() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_FILE });
  const page = await context.newPage();
  await page.goto(`${ERP_BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  const session = await getSession(page);
  return { browser, context, page, request: context.request, session };
}

async function ensureSession() {
  let { browser, context, page, request, session } = await openBrowserWithSession();
  if (session) return { browser, request, session };

  await browser.close();
  if (!refreshAuthViaPlaywright()) {
    throw new Error('No ERP session — playwright auth setup failed');
  }

  ({ browser, context, page, request, session } = await openBrowserWithSession());
  if (!session) {
    await browser.close();
    throw new Error('No ERP session after playwright auth setup');
  }
  return { browser, request, session };
}

function findByName(items, nom, prenom) {
  return items.find(
    (e) => e.nom?.toLowerCase() === nom.toLowerCase() && e.prenom?.toLowerCase() === prenom.toLowerCase(),
  );
}

function asFicheList(body) {
  return Array.isArray(body) ? body : body?.items ?? [];
}

async function findKarimEmploye(request, session, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/rh/employes');
  if (!list.ok) {
    log.push({ step: 'employes-list', ok: false, status: list.status, body: list.body });
    return null;
  }
  const employes = Array.isArray(list.body) ? list.body : list.body?.items ?? [];
  const karim =
    employes.find((e) => e.id === KARIM.id) ?? findByName(employes, KARIM.nom, KARIM.prenom);
  if (!karim) {
    log.push({ step: 'employe-karim', ok: false, action: 'not-found', hint: 'Run seed-qa-ref-data.mjs first' });
    return null;
  }
  log.push({
    step: 'employe-karim',
    ok: true,
    id: karim.id,
    matricule: karim.matricule,
    salaireBase: karim.salaireBase,
  });
  return karim;
}

async function findFicheKarim(request, session, employeId) {
  const res = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/rh/fiches-paie?employeId=${encodeURIComponent(employeId)}&mois=${MOIS}`,
  );
  if (!res.ok) return { error: res, fiche: null };
  const fiches = asFicheList(res.body);
  return { error: null, fiche: fiches[0] ?? null };
}

async function ensureFichePaieKarim(request, session, employeId, log) {
  const existing = await findFicheKarim(request, session, employeId);
  if (existing.error) {
    log.push({ step: 'fiche-list', ok: false, status: existing.error.status, body: existing.error.body });
    return null;
  }

  let fiche = existing.fiche;
  if (fiche) {
    log.push({
      step: 'fiche-karim',
      ok: true,
      action: 'exists',
      id: fiche.id,
      numero: fiche.numero,
      status: fiche.status,
      salaireBase: fiche.salaireBase,
      mois: fiche.mois,
    });
  } else {
    const generated = await apiJson(
      request,
      session,
      'POST',
      `/api/v1/rh/fiches-paie/generate?mois=${MOIS}`,
    );
    if (!generated.ok) {
      log.push({ step: 'fiche-generate', ok: false, status: generated.status, body: generated.body });
      return null;
    }
    const created = asFicheList(generated.body);
    fiche = created.find((f) => f.employeId === employeId);
    if (!fiche) {
      const after = await findFicheKarim(request, session, employeId);
      fiche = after.fiche;
    }
    if (!fiche) {
      log.push({ step: 'fiche-karim', ok: false, action: 'not-created-after-generate', generatedCount: created.length });
      return null;
    }
    log.push({
      step: 'fiche-karim',
      ok: true,
      action: 'created',
      id: fiche.id,
      numero: fiche.numero,
      status: fiche.status,
      salaireBase: fiche.salaireBase,
      mois: fiche.mois,
      api: `POST /api/v1/rh/fiches-paie/generate?mois=${MOIS}`,
    });
  }

  if (fiche.status === 'BROUILLON') {
    const validated = await apiJson(request, session, 'POST', `/api/v1/rh/fiches-paie/${fiche.id}/valider`);
    if (validated.ok) {
      fiche = validated.body;
      log.push({
        step: 'fiche-valider',
        ok: true,
        action: 'validated',
        id: fiche.id,
        numero: fiche.numero,
        status: fiche.status,
        api: `POST /api/v1/rh/fiches-paie/${fiche.id}/valider`,
      });
    } else {
      log.push({ step: 'fiche-valider', ok: false, status: validated.status, body: validated.body });
    }
  } else {
    log.push({ step: 'fiche-valider', ok: true, action: 'skipped', reason: `status=${fiche.status}` });
  }

  return fiche;
}

async function main() {
  const log = [];
  const blockers = [];

  let browser;
  let request;
  let session;
  try {
    ({ browser, request, session } = await ensureSession());

    const karim = await findKarimEmploye(request, session, log);
    if (!karim) {
      blockers.push('Employé Karim Benali (emp-qa-karim) introuvable — exécuter seed-qa-ref-data.mjs');
    } else {
      const fiche = await ensureFichePaieKarim(request, session, karim.id, log);
      if (!fiche) {
        blockers.push('Impossible de créer ou retrouver la fiche paie Karim juin 2026');
      } else if (Number(fiche.salaireBase) !== KARIM.salaireBase) {
        log.push({
          step: 'salaire-base-check',
          ok: true,
          action: 'note',
          expected: KARIM.salaireBase,
          actual: fiche.salaireBase,
        });
      }
    }
  } finally {
    if (browser) await browser.close();
  }

  const failed = log.filter((e) => e.ok === false);
  const ficheEntry = log.find((e) => e.step === 'fiche-karim' && e.ok);
  const validatedEntry = log.find((e) => e.step === 'fiche-valider' && e.ok && e.action === 'validated');
  const ficheSummary = ficheEntry
    ? {
        id: validatedEntry?.id ?? ficheEntry.id,
        numero: validatedEntry?.numero ?? ficheEntry.numero,
        status: validatedEntry?.status ?? ficheEntry.status,
        salaireBase: ficheEntry.salaireBase,
      }
    : null;
  const payBlocker = 'Pas d’endpoint API pour transition PAYEE (STATUS_PAYEE défini côté modèle uniquement)';
  const result = {
    ok: failed.length === 0 && !!ficheEntry,
    mois: MOIS,
    employe: KARIM,
    fiche: ficheSummary,
    apiPaths: {
      list: 'GET /api/v1/rh/fiches-paie?employeId=&mois=&status=',
      generate: `POST /api/v1/rh/fiches-paie/generate?mois=${MOIS}`,
      valider: 'POST /api/v1/rh/fiches-paie/{id}/valider',
      pdf: 'GET /api/v1/rh/fiches-paie/{id}/pdf (501 NOT_IMPLEMENTED)',
    },
    blockers: [...blockers, payBlocker],
    log,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(failed.length === 0 && ficheEntry ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
