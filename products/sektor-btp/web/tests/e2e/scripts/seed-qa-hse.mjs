/**
 * Seed HSE QA data via ERP API (NC qualité — enrobage acier, CH-2026-004).
 * Run: node web/tests/e2e/scripts/seed-qa-hse.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const ERP_BASE = process.env.ERP_BASE ?? 'http://erp.nafura.local';
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';

const NC_ID = 'nc-qa-enrobage-acier';
const NC_DESCRIPTION =
  'Enrobage acier insuffisant sur poutres RDC — recouvrement mesuré < 3 cm (exigence 4 cm, NF EN 1992-1-1).';

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

async function findChantier(request, session, code) {
  const list = await apiJson(request, session, 'GET', '/api/v1/chantiers');
  const items = Array.isArray(list.body) ? list.body : list.body?.items ?? [];
  return items.find((c) => c.code === code) ?? null;
}

async function ensureNcEnrobageAcier(request, session, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/hse/non-conformites');
  if (!list.ok) {
    log.push({ step: 'nc-list', ok: false, status: list.status, body: list.body });
    return null;
  }
  const rows = Array.isArray(list.body) ? list.body : [];
  const existing =
    rows.find((n) => n.id === NC_ID) ??
    rows.find((n) => (n.description ?? '').toLowerCase().includes('enrobage acier'));
  if (existing) {
    if (existing.status === 'CLOTUREE' || existing.status === 'CLOTURE') {
      const reset = await apiJson(request, session, 'PUT', `/api/v1/hse/non-conformites/${existing.id}`, {
        status: 'OUVERTE',
        actionCorrective: existing.actionCorrective ?? NC_DESCRIPTION,
      });
      log.push({
        step: 'nc-reset-ouverte',
        ok: reset.ok,
        status: reset.status,
        action: reset.ok ? 'reset-ouverte' : 'reset-failed',
        from: existing.status,
        body: reset.ok ? undefined : reset.body,
      });
      if (reset.ok) {
        log.push({
          step: 'nc-enrobage-acier',
          ok: true,
          action: 'reset',
          id: reset.body?.id ?? existing.id,
          numero: reset.body?.numero ?? existing.numero,
          status: reset.body?.status ?? 'OUVERTE',
        });
        return reset.body ?? { ...existing, status: 'OUVERTE' };
      }
    }
    log.push({
      step: 'nc-enrobage-acier',
      ok: true,
      action: 'exists',
      id: existing.id,
      numero: existing.numero,
      status: existing.status,
    });
    return existing;
  }

  const chantier = await findChantier(request, session, 'CH-2026-004');
  if (!chantier) {
    log.push({
      step: 'nc-enrobage-acier',
      ok: false,
      action: 'chantier-not-found',
      hint: 'Run seed-qa-ref-data or ensure CH-2026-004 exists',
    });
    return null;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/hse/non-conformites', {
    id: NC_ID,
    dateNc: '2026-06-15',
    chantierId: chantier.id,
    chantierCode: chantier.code,
    zoneChantier: 'RDC — gros œuvre',
    typeNc: 'QUALITE',
    description: NC_DESCRIPTION,
    causesRacines: 'Coffrage mal calé, cales retirées prématurément avant coulage.',
    actionCorrective: 'Reprise des zones non conformes, contrôle métreur avant coulage complémentaire.',
    responsableNom: 'Karim Benali',
    dateEcheance: '2026-06-25',
    status: 'OUVERTE',
    notes: 'QA seed — enrobage acier CH-2026-004',
  });
  log.push({
    step: 'nc-enrobage-acier',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    numero: created.body?.numero,
    body: created.ok ? undefined : created.body,
    api: 'POST /api/v1/hse/non-conformites',
  });
  return created.ok ? created.body : null;
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

  const nc = await ensureNcEnrobageAcier(request, session, log);
  await browser.close();

  const failed = log.filter((e) => e.ok === false);
  console.log(
    JSON.stringify(
      {
        ok: failed.length === 0 && !!nc,
        nc: nc ? { id: nc.id, numero: nc.numero, status: nc.status, description: nc.description } : null,
        apiPaths: {
          list: 'GET /api/v1/hse/non-conformites',
          create: 'POST /api/v1/hse/non-conformites',
          workflow: 'POST /api/v1/hse/non-conformites/{id}/assigner|traiter|verifier|cloturer',
        },
        log,
      },
      null,
      2,
    ),
  );
  process.exit(failed.length === 0 && nc ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
