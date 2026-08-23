/**
 * Seed Études & Devis QA data via ERP API (web/docs/qa/05-etudes-devis.md).
 * Run: node web/tests/e2e/scripts/seed-qa-etudes.mjs
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
  projetNom: 'Construction groupe scolaire (12 classes)',
  devisObjet: 'Construction groupe scolaire (12 classes)',
  partnerCode: 'CLI-CUR-QA',
  partnerName: 'Commune urbaine de Rabat',
  ouvrages: [
    {
      code: 'BPU-BA-001',
      designation: 'Béton armé pour fondations',
      category: 'GO',
      unite: 'm³',
      debourse: 1180,
      puVente: 1500,
    },
    {
      code: 'BPU-MAC-002',
      designation: 'Maçonnerie agglos 20',
      category: 'GO',
      unite: 'm²',
      debourse: 95,
      puVente: 135,
    },
    {
      code: 'BPU-ENL-003',
      designation: 'Enduit extérieur',
      category: 'REVETEMENT',
      unite: 'm²',
      debourse: 48,
      puVente: 72,
    },
  ],
  postes: [
    {
      poste: '1.1',
      designation: 'Fondations BA',
      ouvrageCode: 'BPU-BA-001',
      quantite: 1000,
    },
    {
      poste: '2.1',
      designation: 'Murs agglos',
      ouvrageCode: 'BPU-MAC-002',
      quantite: 3200,
    },
    {
      poste: '3.1',
      designation: 'Enduits façade',
      ouvrageCode: 'BPU-ENL-003',
      quantite: 2800,
    },
  ],
  devisVersionNote: 'Révision quantités lot terrassement',
  targetTotalHt: 6_750_000,
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

function pageItems(body) {
  return body?.content ?? body?.items ?? (Array.isArray(body) ? body : []);
}

function ouvragePayload(spec) {
  const benefPercent = Math.round(((spec.puVente / spec.debourse) - 1) * 10000) / 100;
  return {
    code: spec.code,
    designation: spec.designation,
    category: spec.category,
    unite: spec.unite,
    uniteMain: { heures: 0, tauxHoraire: 0, total: 0 },
    composants: [
      {
        type: 'MATERIAU',
        designation: 'Déboursé sec unitaire',
        unite: spec.unite,
        rendement: 1,
        prixUnitaire: spec.debourse,
        total: spec.debourse,
      },
    ],
    fraisGenerauxPercent: 0,
    beneficePercent: benefPercent,
    isActive: true,
    notes: `QA seed — déboursé ${spec.debourse} MAD, PU vente ${spec.puVente} MAD`,
  };
}

async function listOuvrages(request, session) {
  const res = await apiJson(request, session, 'GET', '/api/v1/etudes/ouvrages?page=0&size=500');
  if (!res.ok) return { ok: false, items: [], res };
  return { ok: true, items: pageItems(res.body), res };
}

async function ensureOuvrages(request, session, log) {
  const { ok, items, res } = await listOuvrages(request, session);
  if (!ok) {
    log.push({ step: 'ouvrages-list', ok: false, status: res.status, body: res.body });
    return {};
  }

  const ids = {};
  for (const spec of QA.ouvrages) {
    const existing = items.find((o) => o.code === spec.code);
    if (existing) {
      ids[spec.code] = existing.id;
      log.push({
        step: `ouvrage-${spec.code}`,
        ok: true,
        action: 'exists',
        id: existing.id,
        prixUnitaireHt: existing.prixUnitaireHt,
      });
      continue;
    }

    const created = await apiJson(request, session, 'POST', '/api/v1/etudes/ouvrages', ouvragePayload(spec));
    if (created.ok) {
      ids[spec.code] = created.body.id;
      items.push(created.body);
      log.push({
        step: `ouvrage-${spec.code}`,
        ok: true,
        action: 'created',
        id: created.body.id,
        prixUnitaireHt: created.body.prixUnitaireHt,
      });
    } else {
      const dup =
        created.status === 400 && String(created.body?.message ?? '').toLowerCase().includes('already exists');
      if (dup) {
        const retry = await listOuvrages(request, session);
        const found = retry.items.find((o) => o.code === spec.code);
        if (found) ids[spec.code] = found.id;
      }
      log.push({
        step: `ouvrage-${spec.code}`,
        ok: created.ok || dup,
        status: created.status,
        action: created.ok ? 'created' : dup ? 'exists' : 'failed',
        body: created.ok ? undefined : created.body,
      });
    }
  }
  return ids;
}

async function ensureClient(request, session, log) {
  const list = await apiJson(request, session, 'GET', '/api/v1/partners?role=CLIENT&page=0&size=500');
  const items = pageItems(list.body);
  const existing = items.find(
    (p) =>
      p.code === QA.partnerCode ||
      (p.raisonSociale ?? p.name ?? '').toLowerCase().includes('commune urbaine de rabat'),
  );
  if (existing) {
    log.push({ step: 'client-cur', ok: true, action: 'exists', id: existing.id, code: existing.code });
    return existing.id;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/partners', {
    code: QA.partnerCode,
    raisonSociale: QA.partnerName,
    formeJuridique: 'Collectivité territoriale',
    ville: 'Rabat',
    email: 'marches@cur-rabat.ma',
    phone: '+212 537-701234',
    roles: ['CLIENT'],
  });
  log.push({
    step: 'client-cur',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    body: created.ok ? undefined : created.body,
  });
  return created.body?.id ?? null;
}

async function findDevis(request, session, clientId) {
  const list = await apiJson(request, session, 'GET', `/api/v1/etudes/devis?search=${encodeURIComponent(QA.devisObjet)}`);
  if (!list.ok) return null;
  const items = Array.isArray(list.body) ? list.body : [];
  return (
    items.find(
      (d) =>
        d.objet === QA.devisObjet &&
        (d.clientId === clientId ||
          d.clientId === QA.partnerCode ||
          d.clientName?.includes('Rabat')),
    ) ?? null
  );
}

function buildDevisLignes(ouvrageIds) {
  const goLines = QA.postes.map((spec, idx) => {
    const ouvrage = QA.ouvrages.find((o) => o.code === spec.ouvrageCode);
    const totalHt = spec.quantite * ouvrage.puVente;
    return {
      ordre: idx + 2,
      type: 'OUVRAGE',
      code: spec.poste,
      designation: spec.designation,
      ouvrageId: ouvrageIds[spec.ouvrageCode],
      unite: ouvrage.unite,
      quantite: spec.quantite,
      prixUnitaireHt: ouvrage.puVente,
      totalHt,
    };
  });

  const goSubtotal = goLines.reduce((s, l) => s + l.totalHt, 0);
  const complementHt = QA.targetTotalHt - goSubtotal;

  const lignes = [
    {
      ordre: 1,
      type: 'CHAPITRE',
      code: 'LOT-GO',
      designation: 'Lot gros œuvre',
    },
    ...goLines,
  ];

  if (complementHt > 0) {
    lignes.push(
      {
        ordre: goLines.length + 2,
        type: 'CHAPITRE',
        code: 'LOT-TECH',
        designation: 'Lots techniques et finitions',
      },
      {
        ordre: goLines.length + 3,
        type: 'OUVRAGE',
        code: '4.0',
        designation: 'Lots complémentaires (CVC, VRD, menuiseries, finitions)',
        unite: 'FF',
        quantite: 1,
        prixUnitaireHt: complementHt,
        totalHt: complementHt,
      },
    );
  }

  return lignes;
}

async function ensureDevis(request, session, clientId, ouvrageIds, log) {
  let devis = await findDevis(request, session, clientId);
  const payload = {
    clientId: clientId,
    clientName: QA.partnerName,
    contactClient: 'Direction des Marchés Publics',
    objet: QA.devisObjet,
    ville: 'Rabat',
    dateEmission: '2026-06-10',
    dateValidite: '2026-09-10',
    bibliothequeReference: 'BPU QA SEYRURA 2026',
    conditionsPaiement: '30 % acompte, 60 % situations mensuelles, 10 % retenue de garantie 12 mois',
    delaiExecutionJours: 540,
    tvaTaux: 20,
    status: 'NEGOCIATION',
    notes: 'Marge prévisionnelle 14 % — jeu de données QA études',
    lignes: buildDevisLignes(ouvrageIds),
  };

  const needsLines = (d) => !d || (d.nbLignes ?? 0) < 4 || Number(d.totalHt) !== QA.targetTotalHt;

  if (!devis) {
    const created = await apiJson(request, session, 'POST', '/api/v1/etudes/devis', payload);
    log.push({
      step: 'devis-create',
      ok: created.ok,
      status: created.status,
      action: created.ok ? 'created' : 'failed',
      id: created.body?.id,
      numero: created.body?.numero,
      totalHt: created.body?.totalHt,
      totalTtc: created.body?.totalTtc,
      body: created.ok ? undefined : created.body,
    });
    if (!created.ok) return null;
    devis = created.body;
  } else if (needsLines(devis)) {
    const updated = await apiJson(request, session, 'PUT', `/api/v1/etudes/devis/${devis.id}`, payload);
    log.push({
      step: 'devis-update',
      ok: updated.ok,
      status: updated.status,
      action: updated.ok ? 'updated' : 'failed',
      id: updated.body?.id,
      numero: updated.body?.numero,
      totalHt: updated.body?.totalHt,
      totalTtc: updated.body?.totalTtc,
      body: updated.ok ? undefined : updated.body,
    });
    if (updated.ok) devis = updated.body;
  } else {
    log.push({
      step: 'devis-create',
      ok: true,
      action: 'exists',
      id: devis.id,
      numero: devis.numero,
      totalHt: devis.totalHt,
      version: devis.version,
    });
  }

  if (devis.version < 2) {
    const versioned = await apiJson(request, session, 'POST', `/api/v1/etudes/devis/${devis.id}/versions`, {
      modifications: QA.devisVersionNote,
    });
    log.push({
      step: 'devis-v2',
      ok: versioned.ok,
      status: versioned.status,
      action: versioned.ok ? 'version-created' : 'failed',
      version: versioned.body?.version,
      body: versioned.ok ? undefined : versioned.body,
    });
    if (versioned.ok) devis = versioned.body;
  } else {
    log.push({ step: 'devis-v2', ok: true, action: 'exists', version: devis.version });
  }

  return devis;
}

async function main() {
  const log = [];
  const ids = {};
  const { browser, request, session } = await ensureSession();

  try {
    ids.ouvrages = await ensureOuvrages(request, session, log);
    ids.clientId = await ensureClient(request, session, log);

    const devis = ids.clientId
      ? await ensureDevis(request, session, ids.clientId, ids.ouvrages, log)
      : null;
    ids.devisId = devis?.id;
    ids.devisNumero = devis?.numero;
    ids.devisVersion = devis?.version;
    ids.devisTotalHt = devis?.totalHt;
    ids.devisTotalTtc = devis?.totalTtc;
  } finally {
    await browser.close();
  }

  const failed = log.filter((e) => e.ok === false);
  const result = {
    ok: failed.length === 0,
    ids,
    apiPaths: {
      ouvrages: '/api/v1/etudes/ouvrages',
      bibliothequePrix: '/api/v1/etudes/bibliotheque-prix',
      dpgf: '/api/v1/etudes/dpgf',
      dpgfNoeuds: '/api/v1/etudes/dpgf-noeuds',
      devis: '/api/v1/etudes/devis',
      partners: '/api/v1/partners',
    },
    log,
  };
  console.log(JSON.stringify(result, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
