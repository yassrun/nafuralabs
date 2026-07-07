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
  metreLignes: [
    {
      poste: '1.1',
      designation: 'Fondations BA',
      ouvrageCode: 'BPU-BA-001',
      quantite: 1000,
      lotCode: '1',
      sousLotCode: '1.1',
      lotLibelle: 'Lot 1 — Gros œuvre',
      sousLotLibelle: 'Fondations',
    },
    {
      poste: '2.1',
      designation: 'Murs agglos',
      ouvrageCode: 'BPU-MAC-002',
      quantite: 3200,
      lotCode: '2',
      sousLotCode: '2.1',
      lotLibelle: 'Lot 2 — Maçonnerie',
      sousLotLibelle: 'Murs porteurs',
    },
    {
      poste: '3.1',
      designation: 'Enduits façade',
      ouvrageCode: 'BPU-ENL-003',
      quantite: 2800,
      lotCode: '3',
      sousLotCode: '3.1',
      lotLibelle: 'Lot 3 — Façades',
      sousLotLibelle: 'Enduits',
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

async function findMetre(request, session) {
  const list = await apiJson(request, session, 'GET', `/api/v1/etudes/metres?search=${encodeURIComponent(QA.projetNom)}`);
  if (!list.ok) return null;
  const items = Array.isArray(list.body) ? list.body : [];
  return items.find((m) => m.projetNom === QA.projetNom) ?? null;
}

function metreLignePayload(spec, ouvrageIds) {
  const ouvrageId = ouvrageIds[spec.ouvrageCode];
  const ouvrage = QA.ouvrages.find((o) => o.code === spec.ouvrageCode);
  return {
    ouvrageId,
    ouvrageCode: spec.ouvrageCode,
    designationLibre: spec.designation,
    unite: ouvrage?.unite ?? 'U',
    lotCode: spec.lotCode,
    sousLotCode: spec.sousLotCode,
    lotLibelle: spec.lotLibelle,
    sousLotLibelle: spec.sousLotLibelle,
    quantiteCalculee: spec.quantite,
    formule: 'Q',
  };
}

async function ensureMetre(request, session, ouvrageIds, log) {
  const existing = await findMetre(request, session);
  if (existing) {
    log.push({
      step: 'metre-qa',
      ok: true,
      action: 'exists',
      id: existing.id,
      numero: existing.numero,
    });
    return existing;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/etudes/metres', {
    projetNom: QA.projetNom,
    ville: 'Rabat',
    dateMetre: '2026-06-01',
    metreurId: 'emp-qa-karim',
    metreurName: 'Karim Benali',
    notes: 'Métré QA — groupe scolaire 12 classes',
    status: 'TERMINE',
    lignes: QA.metreLignes.map((l) => metreLignePayload(l, ouvrageIds)),
  });
  log.push({
    step: 'metre-qa',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    numero: created.body?.numero,
    body: created.ok ? undefined : created.body,
  });
  return created.ok ? created.body : null;
}

function countNodes(hierarchie) {
  return (hierarchie ?? []).reduce((n, x) => n + 1 + countNodes(x.enfants), 0);
}

function findLotNode(hierarchie, lotCode) {
  return (hierarchie ?? []).find((n) => n.type === 'LOT' && n.code === lotCode);
}

async function ensureDpgfTree(request, session, dpgfId, ouvrageIds, log) {
  const arbre = await apiJson(request, session, 'GET', `/api/v1/etudes/dpgf/${dpgfId}/arbre`);
  if (!arbre.ok) {
    log.push({ step: 'dpgf-arbre', ok: false, status: arbre.status, body: arbre.body });
    return null;
  }

  let hierarchie = arbre.body.hierarchie ?? [];
  const articleCount = collectArticleNodes(hierarchie).length;

  if (articleCount < QA.metreLignes.length) {
    for (const spec of QA.metreLignes) {
      const arbreNow = await apiJson(request, session, 'GET', `/api/v1/etudes/dpgf/${dpgfId}/arbre`);
      if (arbreNow.ok) hierarchie = arbreNow.body.hierarchie ?? hierarchie;

      const ouvrage = QA.ouvrages.find((o) => o.code === spec.ouvrageCode);
      const existingArticle = collectArticleNodes(hierarchie).find(
        (n) => n.code === spec.poste || n.libelle === spec.designation,
      );
      if (existingArticle) {
        log.push({ step: `dpgf-poste-${spec.poste}`, ok: true, action: 'exists', nodeId: existingArticle.id });
        continue;
      }

      let lot = findLotNode(hierarchie, spec.lotCode);
      if (!lot) {
        const lotRes = await apiJson(request, session, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
          type: 'LOT',
          code: spec.lotCode,
          libelle: spec.lotLibelle,
          ordre: Number(spec.lotCode),
        });
        log.push({
          step: `dpgf-lot-${spec.lotCode}`,
          ok: lotRes.ok,
          status: lotRes.status,
          action: lotRes.ok ? 'created' : 'failed',
          body: lotRes.ok ? undefined : lotRes.body,
        });
        if (!lotRes.ok) continue;
        lot = lotRes.body;
        const arbreRefresh = await apiJson(request, session, 'GET', `/api/v1/etudes/dpgf/${dpgfId}/arbre`);
        if (arbreRefresh.ok) hierarchie = arbreRefresh.body.hierarchie ?? hierarchie;
        lot = findLotNode(hierarchie, spec.lotCode) ?? lot;
      }

      const sousRes = await apiJson(request, session, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
        parentId: lot.id,
        type: 'SOUS_LOT',
        code: spec.sousLotCode,
        libelle: spec.sousLotLibelle,
        ordre: 1,
      });
      if (!sousRes.ok) {
        log.push({
          step: `dpgf-sous-${spec.poste}`,
          ok: false,
          status: sousRes.status,
          body: sousRes.body,
        });
        continue;
      }

      const totalHt = spec.quantite * ouvrage.puVente;
      const artRes = await apiJson(request, session, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
        parentId: sousRes.body.id,
        type: 'ARTICLE',
        code: spec.poste,
        libelle: spec.designation,
        articleId: ouvrageIds[spec.ouvrageCode],
        quantite: spec.quantite,
        unite: ouvrage.unite,
        prixUnitaire: ouvrage.puVente,
        total: totalHt,
        ordre: 1,
      });
      log.push({
        step: `dpgf-poste-${spec.poste}`,
        ok: artRes.ok,
        status: artRes.status,
        action: artRes.ok ? 'created' : 'failed',
        nodeId: artRes.body?.id,
        body: artRes.ok ? undefined : artRes.body,
      });
      if (artRes.ok) {
        const arbreRefresh = await apiJson(request, session, 'GET', `/api/v1/etudes/dpgf/${dpgfId}/arbre`);
        if (arbreRefresh.ok) hierarchie = arbreRefresh.body.hierarchie ?? hierarchie;
      }
    }
  } else {
    for (const spec of QA.metreLignes) {
      const node = collectArticleNodes(hierarchie).find((n) => n.libelle === spec.designation);
      if (!node || node.code === spec.poste) continue;
      const updated = await apiJson(request, session, 'PUT', `/api/v1/etudes/dpgf-noeuds/${node.id}`, {
        code: spec.poste,
      });
      log.push({
        step: `dpgf-poste-${spec.poste}`,
        ok: updated.ok,
        status: updated.status,
        action: updated.ok ? 'code-updated' : 'failed',
        body: updated.ok ? undefined : updated.body,
      });
    }
  }

  const refreshed = await apiJson(request, session, 'GET', `/api/v1/etudes/dpgf/${dpgfId}/arbre`);
  const totaux = await apiJson(request, session, 'GET', `/api/v1/etudes/dpgf/${dpgfId}/totaux`);
  if (refreshed.ok) {
    log.push({
      step: 'dpgf-totaux',
      ok: true,
      nodeCount: countNodes(refreshed.body.hierarchie),
      totalHt: refreshed.body.totalHt ?? refreshed.body.totalHT,
      totalTtc: refreshed.body.totalTtc ?? refreshed.body.totalTTC,
      lots: totaux.ok ? totaux.body : undefined,
    });
    return refreshed.body;
  }
  return arbre.body;
}

async function ensureDpgf(request, session, metreId, ouvrageIds, log) {
  const list = await apiJson(request, session, 'GET', `/api/v1/etudes/dpgf?metreId=${metreId}`);
  const items = Array.isArray(list.body) ? list.body : [];
  let dpgf = items[0] ?? null;

  if (!dpgf) {
    const created = await apiJson(
      request,
      session,
      'POST',
      `/api/v1/etudes/dpgf?fromMetreId=${metreId}&tvaTaux=20`,
    );
    log.push({
      step: 'dpgf-create',
      ok: created.ok,
      status: created.status,
      action: created.ok ? 'created' : 'failed',
      id: created.body?.id,
      numero: created.body?.numero,
      body: created.ok ? undefined : created.body,
    });
    if (!created.ok) return null;
    dpgf = created.body;
  } else {
    log.push({ step: 'dpgf-create', ok: true, action: 'exists', id: dpgf.id, numero: dpgf.numero });
  }

  return ensureDpgfTree(request, session, dpgf.id, ouvrageIds, log);
}

function collectArticleNodes(hierarchie, acc = []) {
  for (const node of hierarchie ?? []) {
    if (node.type === 'ARTICLE') acc.push(node);
    if (node.enfants?.length) collectArticleNodes(node.enfants, acc);
  }
  return acc;
}

async function findDevis(request, session) {
  const list = await apiJson(request, session, 'GET', `/api/v1/etudes/devis?search=${encodeURIComponent(QA.devisObjet)}`);
  if (!list.ok) return null;
  const items = Array.isArray(list.body) ? list.body : [];
  return (
    items.find(
      (d) =>
        d.objet === QA.devisObjet &&
        (d.clientId === QA.partnerCode || d.clientName?.includes('Rabat')),
    ) ?? null
  );
}

function buildDevisLignes(ouvrageIds) {
  const goLines = QA.metreLignes.map((spec, idx) => {
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
      designation: 'Lot gros œuvre — métré QA',
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

async function ensureDevis(request, session, clientId, metre, dpgf, ouvrageIds, log) {
  let devis = await findDevis(request, session);
  const payload = {
    clientId: QA.partnerCode,
    clientName: QA.partnerName,
    contactClient: 'Direction des Marchés Publics',
    objet: QA.devisObjet,
    ville: 'Rabat',
    dateEmission: '2026-06-10',
    dateValidite: '2026-09-10',
    metreId: metre?.id,
    dpgfId: dpgf?.id,
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

    const metre = await ensureMetre(request, session, ids.ouvrages, log);
    ids.metreId = metre?.id;
    ids.metreNumero = metre?.numero;

    const dpgf = metre ? await ensureDpgf(request, session, metre.id, ids.ouvrages, log) : null;
    ids.dpgfId = dpgf?.id;
    ids.dpgfNumero = dpgf?.numero;

    const devis =
      metre && ids.clientId ? await ensureDevis(request, session, ids.clientId, metre, dpgf, ids.ouvrages, log) : null;
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
      metres: '/api/v1/etudes/metres',
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
