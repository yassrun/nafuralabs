/**
 * Extend matériel QA data via ERP API (section 04 — affectations + GMAO stubs).
 * Run: node tests/e2e/scripts/seed-qa-materiel-ext.mjs
 *
 * Prerequisite: seed-qa-ref-data.mjs (parc ENG-PEL-01, ENG-CAM-04, ENG-GRU-02).
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

const QA = {
  affectation: {
    materielCode: 'ENG-PEL-01',
    chantierRef: 'CH-2026-004',
    dateDebut: '2026-07-01',
    dateFin: '2026-08-31',
    tauxMadj: 850,
    notes: 'QA — taux imputation 850 MAD/j',
  },
  location: {
    loueur: 'Loca-Engins Atlas',
    description: 'Compacteur tandem',
    tarifMadj: 1200,
    dateDebut: '2026-07-10',
    dateFin: '2026-07-20',
  },
  plein: {
    materielCode: 'ENG-CAM-04',
    date: '2026-06-18',
    litres: 180,
    coutMad: 2340,
    compteurKm: 84210,
  },
  planMaintenance: {
    materielCode: 'ENG-PEL-01',
    typeIntervention: 'Vidange + filtres',
    periodiciteHeures: 500,
    prochainSeuilHeures: 2000,
  },
};

const GMAO_PROBE_PATHS = [
  { key: 'contratsLocation', method: 'GET', path: '/api/v1/materiel-locations' },
  { key: 'contratsLocationAlt', method: 'GET', path: '/api/v1/contrats-location' },
  { key: 'pleinsCarburant', method: 'GET', path: '/api/v1/materiel-carburant/pleins' },
  { key: 'pleinsCarburantAlt', method: 'GET', path: '/api/v1/carburant/pleins' },
  { key: 'plansMaintenance', method: 'GET', path: '/api/v1/materiel-maintenance/plans' },
  { key: 'plansMaintenanceAlt', method: 'GET', path: '/api/v1/maintenance/plans' },
];

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
  return { browser, request: context.request, session };
}

async function ensureSession() {
  let { browser, request, session } = await openBrowserWithSession();
  if (session) return { browser, request, session };

  await browser.close();
  if (!refreshAuthViaPlaywright()) {
    throw new Error('No ERP session — playwright auth setup failed');
  }

  ({ browser, request, session } = await openBrowserWithSession());
  if (!session) {
    await browser.close();
    throw new Error('No ERP session after playwright auth setup');
  }
  return { browser, request, session };
}

async function findMaterielByCode(request, session, code, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/materiels?page=0&size=500');
  if (!list.ok) {
    log.push({ step: `materiel-list-${code}`, ok: false, status: list.status, body: list.body });
    return null;
  }
  const items = list.body?.content ?? (Array.isArray(list.body) ? list.body : list.body?.items ?? []);
  const row = items.find((m) => m.code === code);
  if (!row) {
    log.push({ step: `materiel-${code}`, ok: false, action: 'not-found', hint: 'Run seed-qa-ref-data.mjs first' });
    return null;
  }
  log.push({ step: `materiel-${code}`, ok: true, id: row.id, code: row.code, name: row.name });
  return row;
}

function matchesAffectation(row, spec, materielId) {
  return (
    row.materielId === materielId &&
    row.chantierRef === spec.chantierRef &&
    row.dateDebut === spec.dateDebut &&
    row.dateFin === spec.dateFin &&
    row.status === 'ACTIVE'
  );
}

async function ensureAffectationPel(request, session, materielId, log) {
  const spec = QA.affectation;
  const list = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/materiel-affectations?materielId=${encodeURIComponent(materielId)}&status=ACTIVE`,
  );
  if (!list.ok) {
    log.push({ step: 'affectation-list', ok: false, status: list.status, body: list.body });
    return null;
  }
  const rows = Array.isArray(list.body) ? list.body : [];
  const existing = rows.find((r) => matchesAffectation(r, spec, materielId));
  if (existing) {
    log.push({
      step: 'affectation-pel-ch004',
      ok: true,
      action: 'exists',
      id: existing.id,
      api: 'GET /api/v1/materiel-affectations',
    });
    return existing;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/materiel-affectations', {
    materielId,
    chantierRef: spec.chantierRef,
    dateDebut: spec.dateDebut,
    dateFin: spec.dateFin,
    notes: spec.notes,
  });
  if (created.ok) {
    log.push({
      step: 'affectation-pel-ch004',
      ok: true,
      action: 'created',
      id: created.body?.id,
      chantierRef: spec.chantierRef,
      tauxMadj: spec.tauxMadj,
      api: 'POST /api/v1/materiel-affectations',
    });
    return created.body;
  }

  log.push({ step: 'affectation-pel-ch004', ok: false, status: created.status, body: created.body });
  return null;
}

async function probeGmaoApis(request, session, log) {
  const available = {};
  for (const probe of GMAO_PROBE_PATHS) {
    const res = await apiJson(request, session, probe.method, probe.path);
    const exists = res.status !== 404;
    available[probe.key] = { path: probe.path, status: res.status, exists };
    log.push({
      step: `probe-${probe.key}`,
      ok: true,
      action: exists ? 'reachable' : 'not-found',
      status: res.status,
      path: probe.path,
    });
  }
  return available;
}

async function tryEnsureLocation(request, session, log, blockers) {
  const probes = GMAO_PROBE_PATHS.filter((p) => p.key.includes('contrat') || p.key.includes('Location'));
  for (const probe of probes) {
    const res = await apiJson(request, session, 'GET', probe.path);
    if (res.status === 404) continue;
    if (res.ok) {
      blockers.push(`Endpoint ${probe.path} existe mais création non implémentée dans ce script`);
      return false;
    }
  }
  blockers.push(
    'Pas d’endpoint API locations matériel (ContratLocation) — UI MaterielGmaoFacadeService in-memory uniquement',
  );
  log.push({ step: 'location-atlas-compacteur', ok: true, action: 'blocked-no-api', spec: QA.location });
  return false;
}

async function tryEnsurePlein(request, session, materielId, log, blockers) {
  const probes = GMAO_PROBE_PATHS.filter((p) => p.key.includes('plein') || p.key.includes('Carburant'));
  for (const probe of probes) {
    const res = await apiJson(request, session, 'GET', probe.path);
    if (res.status === 404) continue;
    if (res.ok) {
      blockers.push(`Endpoint ${probe.path} existe mais création non implémentée dans ce script`);
      return false;
    }
  }
  blockers.push(
    'Pas d’endpoint API pleins carburant (PleinCarburant) — UI MaterielGmaoFacadeService in-memory uniquement',
  );
  log.push({ step: 'plein-cam04', ok: true, action: 'blocked-no-api', spec: QA.plein, materielId });
  return false;
}

async function tryEnsurePlanMaintenance(request, session, materiel, log, blockers) {
  const probes = GMAO_PROBE_PATHS.filter((p) => p.key.includes('plan') || p.key.includes('Maintenance'));
  for (const probe of probes) {
    const res = await apiJson(request, session, 'GET', probe.path);
    if (res.status === 404) continue;
    if (res.ok) {
      blockers.push(`Endpoint ${probe.path} existe mais création non implémentée dans ce script`);
      return false;
    }
  }

  const spec = QA.planMaintenance;
  const notesTarget = `QA plan: ${spec.typeIntervention}; périodicité ${spec.periodiciteHeures}h moteur; prochaine à ${spec.prochainSeuilHeures}h`;
  if (materiel.notesMaintenance?.includes('QA plan:') && materiel.notesMaintenance.includes(String(spec.prochainSeuilHeures))) {
    log.push({
      step: 'plan-maintenance-pel',
      ok: true,
      action: 'exists-on-materiel',
      id: materiel.id,
      api: `PUT /api/v1/materiels/${materiel.id}`,
      note: 'Fallback notesMaintenance — pas de PlanMaintenance API',
    });
    return materiel;
  }

  const updated = await apiJson(request, session, 'PUT', `/api/v1/materiels/${materiel.id}`, {
    notesMaintenance: notesTarget,
  });
  if (updated.ok) {
    log.push({
      step: 'plan-maintenance-pel',
      ok: true,
      action: 'patched-materiel-notes',
      id: materiel.id,
      api: `PUT /api/v1/materiels/${materiel.id}`,
      note: 'Fallback notesMaintenance — pas de PlanMaintenance API',
    });
    return updated.body;
  }

  blockers.push('Pas d’endpoint API plans maintenance (PlanMaintenance) — fallback PUT materiel échoué');
  log.push({ step: 'plan-maintenance-pel', ok: false, status: updated.status, body: updated.body });
  return null;
}

async function main() {
  const log = [];
  const blockers = [];
  let browser;
  let request;
  let session;

  try {
    ({ browser, request, session } = await ensureSession());

    await probeGmaoApis(request, session, log);

    const pel = await findMaterielByCode(request, session, QA.affectation.materielCode, log);
    const cam = await findMaterielByCode(request, session, QA.plein.materielCode, log);

    let affectation = null;
    if (pel) {
      affectation = await ensureAffectationPel(request, session, pel.id, log);
      if (!affectation) {
        blockers.push(`Impossible de créer l’affectation ${QA.affectation.materielCode} → ${QA.affectation.chantierRef}`);
      }
    } else {
      blockers.push(`Matériel ${QA.affectation.materielCode} introuvable — exécuter seed-qa-ref-data.mjs`);
    }

    await tryEnsureLocation(request, session, log, blockers);
    if (cam) {
      await tryEnsurePlein(request, session, cam.id, log, blockers);
    } else {
      blockers.push(`Matériel ${QA.plein.materielCode} introuvable — exécuter seed-qa-ref-data.mjs`);
    }

    if (pel) {
      await tryEnsurePlanMaintenance(request, session, pel, log, blockers);
    }
  } finally {
    if (browser) await browser.close();
  }

  const failed = log.filter((e) => e.ok === false);
  const affectationOk = log.some((e) => e.step === 'affectation-pel-ch004' && e.ok);
  const planOk = log.some((e) => e.step === 'plan-maintenance-pel' && e.ok);
  const locationBlocked = log.some((e) => e.step === 'location-atlas-compacteur' && e.action === 'blocked-no-api');
  const pleinBlocked = log.some((e) => e.step === 'plein-cam04' && e.action === 'blocked-no-api');

  const result = {
    ok: failed.length === 0 && affectationOk,
    seeded: {
      affectation: affectationOk,
      location: false,
      plein: false,
      planMaintenance: planOk,
    },
    apiPaths: {
      affectations: {
        list: 'GET /api/v1/materiel-affectations?materielId=&status=',
        create: 'POST /api/v1/materiel-affectations',
        clore: 'POST /api/v1/materiel-affectations/{id}/clore',
      },
      materiels: {
        list: 'GET /api/v1/materiels?page=&size=',
        update: 'PUT /api/v1/materiels/{id}',
      },
      locations: 'NOT_IMPLEMENTED (frontend MaterielGmaoFacadeService in-memory)',
      carburant: 'NOT_IMPLEMENTED (frontend MaterielGmaoFacadeService in-memory)',
      plansMaintenance: 'NOT_IMPLEMENTED (frontend MaterielGmaoFacadeService in-memory)',
    },
    blockers: blockers.filter(
      (b) =>
        !b.startsWith('Pas d’endpoint API locations') &&
        !b.startsWith('Pas d’endpoint API pleins') &&
        !b.startsWith('Pas d’endpoint API plans maintenance'),
    ),
    knownLimitations: [
      locationBlocked ? blockers.find((b) => b.includes('locations matériel')) : null,
      pleinBlocked ? blockers.find((b) => b.includes('pleins carburant')) : null,
      'Taux imputation (850 MAD/j) stocké dans notes affectation — champ dédié absent du DTO backend',
      planOk ? 'Plan maintenance stocké en notesMaintenance sur materiel (fallback) — pas de liste GMAO API' : null,
    ].filter(Boolean),
    log,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(failed.length === 0 && affectationOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
