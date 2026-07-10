/**
 * Seed QA reference data via ERP API (authenticated session).
 * Run: node tests/e2e/scripts/seed-qa-ref-data.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const ERP_BASE = process.env.ERP_BASE ?? 'http://erp.nafura.local';
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';

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

async function apiJson(request, session, method, path, data) {
  const opts = { headers: apiHeaders(session) };
  if (data !== undefined) opts.data = data;
  const res = await request[method.toLowerCase()](`${API_BASE}${path}`, opts);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text().catch(() => null);
  }
  return { ok: res.ok(), status: res.status(), body };
}

function findByName(items, nom, prenom) {
  return items.find(
    (e) => e.nom?.toLowerCase() === nom.toLowerCase() && e.prenom?.toLowerCase() === prenom.toLowerCase(),
  );
}

function findFournisseur(items, name) {
  return items.find((f) => f.raisonSociale?.toLowerCase().includes(name.toLowerCase()));
}

function findMateriel(items, code) {
  return items.find((m) => m.code === code);
}

async function ensureEmployes(request, session, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/rh/employes');
  if (!list.ok) {
    log.push({ step: 'employes-list', ok: false, status: list.status, body: list.body });
    return {};
  }
  let employes = Array.isArray(list.body) ? list.body : list.body?.items ?? [];

  const specs = [
    {
      id: 'emp-qa-karim',
      nom: 'Benali',
      prenom: 'Karim',
      cin: 'BE987654',
      cnss: '9876543',
      poste: 'Chef chantier',
      departement: 'Travaux',
      categorie: 'Agent_maitrise',
      typeContrat: 'CDI',
      statut: 'ACTIF',
      dateEmbauche: '2020-03-01',
      salaireBase: 9000,
      indemniteTransport: 500,
      ville: 'Casablanca',
      telephone: '+212 612-345678',
    },
    {
      id: 'emp-qa-said',
      nom: 'Amrani',
      prenom: 'Said',
      cin: 'AM123456',
      cnss: '8765432',
      poste: 'Conducteur travaux',
      departement: 'Travaux',
      categorie: 'Cadre',
      typeContrat: 'CDI',
      statut: 'ACTIF',
      dateEmbauche: '2019-06-15',
      salaireBase: 14000,
      indemniteRepresentation: 2000,
      indemniteTransport: 800,
      ville: 'Casablanca',
      telephone: '+212 623-456789',
      email: 's.amrani@btpmaroc.ma',
    },
  ];

  const ids = {};
  for (const spec of specs) {
    const existing = findByName(employes, spec.nom, spec.prenom);
    if (existing) {
      ids[`${spec.prenom}_${spec.nom}`] = existing.id;
      log.push({ step: `employe-${spec.prenom}`, ok: true, action: 'exists', id: existing.id, matricule: existing.matricule });
      continue;
    }
    const created = await apiJson(request, session, 'POST', '/api/v1/rh/employes', spec);
    if (created.ok) {
      ids[`${spec.prenom}_${spec.nom}`] = created.body.id;
      employes.push(created.body);
      log.push({ step: `employe-${spec.prenom}`, ok: true, action: 'created', id: created.body.id, matricule: created.body.matricule });
    } else {
      log.push({ step: `employe-${spec.prenom}`, ok: false, status: created.status, body: created.body });
    }
  }
  return ids;
}

async function ensureCongeSaid(request, session, employeId, log) {
  if (!employeId) return;
  const list = await apiJson(request, session, 'GET', `/api/v1/rh/conges?employeId=${employeId}`);
  const conges = Array.isArray(list.body) ? list.body : [];
  if (conges.length > 0) {
    log.push({ step: 'conge-said', ok: true, action: 'exists', count: conges.length });
    return;
  }
  const created = await apiJson(request, session, 'POST', '/api/v1/rh/conges', {
    employeId,
    type: 'ANNUEL',
    dateDebut: '2026-08-01',
    dateFin: '2026-08-15',
    nombreJours: 15,
    status: 'DEMANDE',
    motif: 'Congé annuel été',
  });
  log.push({
    step: 'conge-said',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    body: created.body,
  });
}

async function ensureSikaFournisseur(request, session, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/partners?role=FOURNISSEUR&page=0&size=500');
  const page = list.body;
  const items = page?.content ?? page?.items ?? (Array.isArray(page) ? page : []);
  const mapped = items.map((p) => ({ id: p.id, raisonSociale: p.raisonSociale ?? p.name, code: p.code }));

  if (findFournisseur(mapped, 'Sika Maroc')) {
    log.push({ step: 'fournisseur-sika', ok: true, action: 'exists' });
    return findFournisseur(mapped, 'Sika Maroc').id;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/partners', {
    code: 'FRN-SIKA-QA',
    raisonSociale: 'Sika Maroc SARL',
    ice: '002345678901234',
    identifiantFiscal: '12345678',
    registreCommerce: 'RC Casa 456789',
    patente: 'Pat. urbaine Sika',
    email: 'contact@sika-maroc.ma',
    phone: '+212 522-123456',
    roles: ['FOURNISSEUR'],
  });
  log.push({
    step: 'fournisseur-sika',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    body: created.ok ? undefined : created.body,
  });
  return created.body?.id;
}

async function findChantierId(request, session, code) {
  const list = await apiJson(request, session, 'GET', '/api/v1/chantiers');
  const items = Array.isArray(list.body) ? list.body : list.body?.items ?? [];
  return items.find((c) => c.code === code)?.id;
}

async function ensurePointageKarim(request, session, employeId, log) {
  if (!employeId) return;
  const chantierId = await findChantierId(request, session, 'CH-2026-004');
  if (!chantierId) {
    log.push({ step: 'pointage-karim', ok: false, action: 'chantier-not-found' });
    return;
  }

  const from = '2026-06-01';
  const to = '2026-06-30';
  const existing = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/rh/pointages/by-employe?employeId=${employeId}&from=${from}&to=${to}`,
  );
  const rows = Array.isArray(existing.body) ? existing.body : [];
  if (rows.length > 0) {
    log.push({ step: 'pointage-karim', ok: true, action: 'exists', count: rows.length });
    return;
  }

  const clientId = crypto.randomUUID();
  const created = await apiJson(request, session, 'POST', '/api/v1/rh/pointage-batches', {
    clientId,
    chefEmployeId: employeId,
    chantierId,
    datePointage: '2026-06-18',
    status: 'VALIDE',
    pointages: [
      {
        employeId,
        date: '2026-06-18',
        mode: 'PRESENT',
        heureArrivee: '07:45',
        heureDepart: '17:00',
        heuresNormales: 8,
        heuresSup: 2,
        status: 'VALIDE',
      },
    ],
  });
  log.push({
    step: 'pointage-karim',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    body: created.ok ? { batchId: created.body?.id } : created.body,
  });
}

async function ensureMateriels(request, session, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/materiels');
  const items = list.body?.content ?? (Array.isArray(list.body) ? list.body : list.body?.items ?? []);

  const specs = [
    {
      code: 'ENG-PEL-01',
      name: 'Pelle hydraulique Caterpillar 320',
      marque: 'Caterpillar',
      modele: '320',
      numeroSerie: 'CAT320-7781',
      status: 'DISPONIBLE',
      isActive: true,
      anneeMiseEnService: 2022,
    },
    {
      code: 'ENG-CAM-04',
      name: 'Camion benne MAN TGS 26.400',
      marque: 'MAN',
      modele: 'TGS 26.400',
      numeroSerie: 'MAN-26400-1123',
      status: 'AFFECTE',
      isActive: true,
      anneeMiseEnService: 2021,
    },
    {
      code: 'ENG-GRU-02',
      name: 'Grue à tour Potain MDT 219',
      marque: 'Potain',
      modele: 'MDT 219',
      numeroSerie: 'POT219-0456',
      status: 'MAINTENANCE',
      isActive: true,
      anneeMiseEnService: 2020,
    },
  ];

  for (const spec of specs) {
    if (findMateriel(items, spec.code)) {
      log.push({ step: `materiel-${spec.code}`, ok: true, action: 'exists' });
      continue;
    }
    const created = await apiJson(request, session, 'POST', '/api/v1/materiels', spec);
    const alreadyExists =
      created.status === 400 &&
      String(created.body?.message ?? '').toLowerCase().includes('already exists');
    log.push({
      step: `materiel-${spec.code}`,
      ok: created.ok || alreadyExists,
      status: created.status,
      action: created.ok ? 'created' : alreadyExists ? 'exists' : 'failed',
      body: created.ok ? { id: created.body?.id } : created.body,
    });
    if (created.ok) items.push(created.body);
  }
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

  const employeIds = await ensureEmployes(request, session, log);
  await ensurePointageKarim(request, session, employeIds.Karim_Benali, log);
  await ensureCongeSaid(request, session, employeIds.Said_Amrani, log);
  await ensureSikaFournisseur(request, session, log);
  await ensureMateriels(request, session, log);

  await browser.close();

  const failed = log.filter((e) => e.ok === false);
  console.log(JSON.stringify({ ok: failed.length === 0, log }, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
