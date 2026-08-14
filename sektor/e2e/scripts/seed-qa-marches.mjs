/**
 * Seed QA marchés & ventes data via ERP API (web/docs/qa/06-marches-facturation.md).
 * Run: node web/tests/e2e/scripts/seed-qa-marches.mjs
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

const QA_MARKER = 'QA-MARCHES-SEED-2026';

const QA = {
  clientCode: 'CLI-MANAR-QA',
  clientName: 'Société Al Manar Immobilier',
  marcheId: 'mar-qa-002',
  marcheNumero: 'MARCHE-2026-002',
  marcheIntitule: 'Travaux VRD Résidence Al Manar',
  chantierCode: 'CH-2026-004',
  chantierId: 'ch-004',
  montantHt: 5_000_000,
  avenantId: 'avt-qa-manar-001',
  avenantObjet: 'Travaux supplémentaires VRD',
  avenantMontantHt: 420_000,
  avenantProlongationJours: 30,
  bccNumeroClient: 'BC-MANAR-VRD-2026',
};

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

function pageItems(body) {
  return body?.content ?? body?.items ?? (Array.isArray(body) ? body : []);
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

async function findChantier(request, session) {
  const byId = await apiJson(request, session, 'GET', `/api/v1/chantiers/${QA.chantierId}`);
  if (byId.ok && byId.body?.id) return byId.body;

  const list = await apiJson(request, session, 'GET', '/api/v1/chantiers');
  const items = pageItems(list.body);
  return (
    items.find((c) => c.code === QA.chantierCode) ??
    items.find((c) => c.id === QA.chantierId) ??
    null
  );
}

async function ensureClient(request, session, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/partners?role=CLIENT&page=0&size=500');
  if (!list.ok) {
    log.push({ step: 'client-list', ok: false, status: list.status, body: list.body });
    return null;
  }

  const items = pageItems(list.body);
  const existing = items.find(
    (p) =>
      p.code === QA.clientCode ||
      (p.raisonSociale ?? p.name ?? '').toLowerCase().includes('al manar'),
  );
  if (existing) {
    log.push({
      step: 'client-manar',
      ok: true,
      action: 'exists',
      id: existing.id,
      code: existing.code,
      raisonSociale: existing.raisonSociale ?? existing.name,
    });
    return existing;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/partners', {
    code: QA.clientCode,
    raisonSociale: QA.clientName,
    formeJuridique: 'SARL',
    ice: '002456789012345',
    identifiantFiscal: '45678901',
    registreCommerce: 'RC Casa 789012',
    email: 'contact@almanar-immo.ma',
    phone: '+212 522-456789',
    roles: ['CLIENT'],
  });
  log.push({
    step: 'client-manar',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    code: created.body?.code,
    body: created.ok ? undefined : created.body,
  });
  return created.ok ? created.body : null;
}

async function findMarche(request, session) {
  const list = await apiJson(request, session, 'GET', '/api/v1/marches/contrats');
  if (!list.ok) return { ok: false, marche: null, res: list };
  const items = Array.isArray(list.body) ? list.body : [];
  const marche =
    items.find((m) => m.numero === QA.marcheNumero) ??
    items.find((m) => m.id === QA.marcheId) ??
    null;
  return { ok: true, marche, res: list };
}

async function ensureMarche(request, session, ctx, log) {
  const { ok, marche, res } = await findMarche(request, session);
  if (!ok) {
    log.push({ step: 'marche-list', ok: false, status: res.status, body: res.body });
    return null;
  }
  if (marche) {
    log.push({
      step: 'marche-002',
      ok: true,
      action: 'exists',
      id: marche.id,
      numero: marche.numero,
      chantierCode: marche.chantierCode,
      clientNom: marche.clientNom,
    });
    return marche;
  }

  if (!ctx.chantier?.id || !ctx.client?.id) {
    log.push({
      step: 'marche-002',
      ok: false,
      action: 'skipped',
      reason: 'chantier or client missing',
    });
    return null;
  }

  const payload = {
    id: QA.marcheId,
    numero: QA.marcheNumero,
    reference: `${QA_MARKER}-CH-004`,
    intitule: QA.marcheIntitule,
    chantierId: ctx.chantier.id,
    chantierCode: ctx.chantier.code ?? QA.chantierCode,
    chantierNom: ctx.chantier.label ?? ctx.chantier.name ?? 'Résidence Al Manar',
    clientId: String(ctx.client.id),
    clientNom: ctx.client.raisonSociale ?? ctx.client.name ?? QA.clientName,
    typeMarche: 'FORFAITAIRE',
    typeCcagT: 'TRAVAUX',
    natureMarche: 'PRIVE',
    dateNotification: '2026-07-01',
    dateDemarrage: '2026-07-01',
    dureeMois: 12,
    montantHt: QA.montantHt,
    tauxTva: 20,
    tauxRg: 7,
    status: 'EN_COURS',
  };

  const created = await apiJson(request, session, 'POST', '/api/v1/marches/contrats', payload);
  const alreadyExists =
    created.status === 400 &&
    String(created.body?.message ?? JSON.stringify(created.body ?? '')).toLowerCase().includes('already exists');

  if (alreadyExists) {
    const retry = await findMarche(request, session);
    if (retry.marche) {
      log.push({
        step: 'marche-002',
        ok: true,
        action: 'exists',
        id: retry.marche.id,
        numero: retry.marche.numero,
      });
      return retry.marche;
    }
  }

  log.push({
    step: 'marche-002',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    numero: created.body?.numero,
    body: created.ok ? undefined : created.body,
  });
  return created.ok ? created.body : null;
}

async function ensureAvenant(request, session, marche, log) {
  if (!marche?.id) {
    log.push({ step: 'avenant-vrd', ok: false, action: 'skipped', reason: 'marche missing' });
    return null;
  }

  const list = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/marches/avenants?contratMarcheId=${encodeURIComponent(marche.id)}`,
  );
  if (!list.ok) {
    log.push({ step: 'avenant-list', ok: false, status: list.status, body: list.body });
    return null;
  }

  const items = Array.isArray(list.body) ? list.body : [];
  const existing =
    items.find((a) => a.id === QA.avenantId) ??
    items.find((a) => a.objet === QA.avenantObjet) ??
    null;
  if (existing) {
    log.push({
      step: 'avenant-vrd',
      ok: true,
      action: 'exists',
      id: existing.id,
      numero: existing.numero,
      montantHt: existing.montantHt,
    });
    return existing;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/marches/avenants', {
    id: QA.avenantId,
    contratMarcheId: marche.id,
    type: 'TVX_SUPPLEMENTAIRES',
    objet: QA.avenantObjet,
    motif: QA_MARKER,
    montantHt: QA.avenantMontantHt,
    prolongationJours: QA.avenantProlongationJours,
    dateSignature: '2026-08-15',
    status: 'BROUILLON',
  });
  const alreadyExists =
    created.status === 400 &&
    String(created.body?.message ?? JSON.stringify(created.body ?? '')).toLowerCase().includes('already exists');

  log.push({
    step: 'avenant-vrd',
    ok: created.ok || alreadyExists,
    status: created.status,
    action: created.ok ? 'created' : alreadyExists ? 'exists' : 'failed',
    id: created.body?.id,
    numero: created.body?.numero,
    body: created.ok || alreadyExists ? undefined : created.body,
  });
  return created.ok ? created.body : null;
}

async function ensureBcc(request, session, ctx, log) {
  if (!ctx.client?.id) {
    log.push({ step: 'bcc-manar', ok: false, action: 'skipped', reason: 'client missing' });
    return null;
  }

  const list = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/bons-commande-client?clientId=${encodeURIComponent(ctx.client.id)}`,
  );
  if (!list.ok) {
    log.push({ step: 'bcc-list', ok: false, status: list.status, body: list.body });
    return null;
  }

  const items = Array.isArray(list.body) ? list.body : [];
  const existing = items.find((b) => b.notes === QA_MARKER || b.numeroClient === QA.bccNumeroClient);
  if (existing) {
    log.push({
      step: 'bcc-manar',
      ok: true,
      action: 'exists',
      id: existing.id,
      numero: existing.numero,
      numeroClient: existing.numeroClient,
    });
    return existing;
  }

  const ligneTotal = 250_000;
  const created = await apiJson(request, session, 'POST', '/api/v1/bons-commande-client', {
    numeroClient: QA.bccNumeroClient,
    clientId: String(ctx.client.id),
    clientName: ctx.client.raisonSociale ?? ctx.client.name ?? QA.clientName,
    chantierId: ctx.chantier?.id ?? null,
    chantierCode: ctx.chantier?.code ?? QA.chantierCode,
    dateReception: '2026-06-20',
    dateFinPrevue: '2026-12-31',
    tvaTaux: 20,
    status: 'RECU',
    notes: QA_MARKER,
    lignes: [
      {
        ordre: 0,
        designation: 'Travaux VRD — voirie et réseaux',
        unite: 'forfait',
        quantite: 1,
        prixUnitaireHt: ligneTotal,
        totalHt: ligneTotal,
      },
    ],
  });

  log.push({
    step: 'bcc-manar',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    numero: created.body?.numero,
    body: created.ok ? undefined : created.body,
  });
  return created.ok ? created.body : null;
}

async function ensureFactureMarche(request, session, marche, log) {
  if (!marche?.id) {
    log.push({ step: 'facture-marche', ok: false, action: 'skipped', reason: 'marche missing' });
    return null;
  }

  const list = await apiJson(request, session, 'GET', '/api/v1/marches/factures');
  const items = Array.isArray(list.body) ? list.body : [];
  const existing =
    items.find((f) => f.contratMarcheId === marche.id && f.id === 'fm-qa-manar-002') ??
    items.find((f) => f.numero === 'FAC-2026-0002') ??
    items.find((f) => f.numero === 'FM-QA-2026-002') ??
    null;
  if (existing) {
    log.push({
      step: 'facture-marche',
      ok: true,
      action: 'exists',
      id: existing.id,
      numero: existing.numero,
      status: existing.status,
    });
    return existing;
  }

  const ventes = await apiJson(request, session, 'GET', '/api/v1/factures-client');
  const ventesItems = Array.isArray(ventes.body) ? ventes.body : [];
  const fac2 = ventesItems.find((f) => f.numero === 'FAC-2026-0002');

  const brutHt = fac2?.montantHt ?? fac2?.totalHt ?? 528_000;
  const netHt = fac2?.netHt ?? brutHt * 0.93;
  const tva = fac2?.montantTva ?? fac2?.tvaMontant ?? netHt * 0.2;
  const netTtc = fac2?.montantTtc ?? fac2?.totalTtc ?? netHt + tva;

  const created = await apiJson(request, session, 'POST', '/api/v1/marches/factures', {
    id: 'fm-qa-manar-002',
    numero: fac2?.numero ?? 'FM-QA-2026-002',
    contratMarcheId: marche.id,
    montantBrutHt: brutHt,
    avanceDeduiteHt: 0,
    retenueGarantieHt: brutHt * 0.07,
    netHt,
    tvaTaux: 20,
    tvaMontant: tva,
    netTtc,
    retenueSourceTaux: 0,
    retenueSourceMontant: 0,
    timbreFiscal: 0,
    netAPayer: netTtc,
    dateEmission: fac2?.dateEmission ?? '2026-06-15',
    dateEcheance: fac2?.dateEcheance ?? '2026-07-15',
    status: fac2?.status === 'PAYEE' ? 'PAYEE' : 'EMISE',
  });

  log.push({
    step: 'facture-marche',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    numero: created.body?.numero,
    body: created.ok ? undefined : created.body,
  });
  return created.ok ? created.body : null;
}

async function main() {
  const { browser, request, session } = await ensureSession();
  const log = [];
  const ids = {};

  const chantier = await findChantier(request, session);
  if (chantier) {
    ids.chantierId = chantier.id;
    log.push({
      step: 'chantier-004',
      ok: true,
      action: 'exists',
      id: chantier.id,
      code: chantier.code,
    });
  } else {
    log.push({ step: 'chantier-004', ok: false, action: 'not-found', code: QA.chantierCode });
  }

  const client = await ensureClient(request, session, log);
  if (client?.id) ids.clientId = client.id;

  const ctx = { chantier, client };
  const marche = await ensureMarche(request, session, ctx, log);
  if (marche?.id) ids.marcheId = marche.id;

  const avenant = await ensureAvenant(request, session, marche, log);
  if (avenant?.id) ids.avenantId = avenant.id;

  const bcc = await ensureBcc(request, session, ctx, log);
  if (bcc?.id) ids.bccId = bcc.id;

  const factureMarche = await ensureFactureMarche(request, session, marche, log);
  if (factureMarche?.id) ids.factureMarcheId = factureMarche.id;

  await browser.close();

  const failed = log.filter((e) => e.ok === false);
  const apiPaths = [
    'GET /api/v1/partners?role=CLIENT',
    'POST /api/v1/partners',
    'GET /api/v1/chantiers',
    'GET /api/v1/marches/contrats',
    'POST /api/v1/marches/contrats',
    'GET /api/v1/marches/avenants',
    'POST /api/v1/marches/avenants',
    'GET /api/v1/bons-commande-client',
    'POST /api/v1/bons-commande-client',
    'GET /api/v1/marches/factures',
    'GET /api/v1/factures-client',
    'POST /api/v1/marches/factures',
  ];

  console.log(
    JSON.stringify(
      {
        script: 'seed-qa-marches.mjs',
        ok: failed.length === 0,
        ids,
        apiPaths,
        log,
      },
      null,
      2,
    ),
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
