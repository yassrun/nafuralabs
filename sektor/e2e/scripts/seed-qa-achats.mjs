/**
 * Seed QA achats reference data via ERP API (authenticated session).
 * Run: node tests/e2e/scripts/seed-qa-achats.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const ERP_BASE = process.env.ERP_BASE ?? 'http://erp.nafura.local';
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';

const QA_MARKER = 'QA-ACHATS-SEED-CH-004';
const CHANTIER_ID = 'ch-004';
const ARTICLE_CODES = ['MAT-CIM', 'ART-CIM-325', 'ART-001', 'ART-CIM-CPJ45'];

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

function asList(body) {
  if (Array.isArray(body)) return body;
  return body?.content ?? body?.items ?? [];
}

async function findSikaFournisseur(request, session) {
  const list = await apiJson(request, session, 'GET', '/api/v1/partners?role=FOURNISSEUR&page=0&size=500');
  if (!list.ok) return null;
  const items = asList(list.body);
  return items.find(
    (p) =>
      p.code === 'FRN-SIKA-QA' ||
      p.raisonSociale?.toLowerCase().includes('sika maroc'),
  );
}

async function findChantier(request, session) {
  const byId = await apiJson(request, session, 'GET', `/api/v1/chantiers/${CHANTIER_ID}`);
  if (byId.ok && byId.body?.id) return byId.body;
  const list = await apiJson(request, session, 'GET', '/api/v1/chantiers');
  const items = asList(list.body);
  return items.find((c) => c.id === CHANTIER_ID || c.code?.includes('004')) ?? null;
}

async function findEmployeKarim(request, session) {
  const list = await apiJson(request, session, 'GET', '/api/v1/rh/employes');
  const items = asList(list.body);
  return (
    items.find((e) => e.id === 'emp-qa-karim') ??
    items.find(
      (e) => e.nom?.toLowerCase() === 'benali' && e.prenom?.toLowerCase() === 'karim',
    )
  );
}

async function findArticleCiment(request, session) {
  for (const code of ARTICLE_CODES) {
    const lookup = await apiJson(request, session, 'GET', `/api/v1/items/lookup?q=${encodeURIComponent(code)}&size=20`);
    const items = lookup.body?.items ?? [];
    const hit = items.find((i) => i.label?.includes(code) || i.value);
    if (hit?.value) {
      const detail = await apiJson(request, session, 'GET', `/api/v1/items/${hit.value}`);
      if (detail.ok) return detail.body;
    }
  }

  const search = await apiJson(request, session, 'GET', '/api/v1/items?page=0&size=100&q=ciment');
  const page = search.body;
  const items = asList(page);
  return (
    items.find((a) => ARTICLE_CODES.includes(a.code)) ??
    items.find((a) => a.name?.toLowerCase().includes('ciment') || a.code?.toLowerCase().includes('cim'))
  );
}

async function findLocation(request, session, code = 'MAG-CASA-01') {
  const list = await apiJson(request, session, 'GET', '/api/v1/locations?page=0&size=100');
  const items = asList(list.body);
  return items.find((l) => l.code === code) ?? items.find((l) => l.type === 'ENTREPOT') ?? items[0];
}

async function findExistingDa(request, session) {
  const list = await apiJson(request, session, 'GET', `/api/v1/demandes-achat?chantierId=${CHANTIER_ID}`);
  if (!list.ok) return null;
  return asList(list.body).find((d) => d.notes === QA_MARKER);
}

async function findExistingBc(request, session, fournisseurId) {
  const list = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/bons-commande-achat?fournisseurId=${fournisseurId}&chantierId=${CHANTIER_ID}`,
  );
  if (!list.ok) return null;
  return asList(list.body).find((b) => b.notes === QA_MARKER);
}

async function findExistingCatalogue(request, session, fournisseurId, articleId) {
  const list = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/catalogue-fournisseur?fournisseurId=${fournisseurId}&articleId=${articleId}`,
  );
  if (!list.ok) return null;
  return asList(list.body).find((c) => c.refFournisseur === 'SIKA-CIM-QA');
}

async function ensureDemandeAchat(request, session, ctx, log) {
  const existing = await findExistingDa(request, session);
  if (existing) {
    log.push({ step: 'da', ok: true, action: 'exists', id: existing.id, numero: existing.numero });
    return existing;
  }

  const payload = {
    chantierId: ctx.chantier.id,
    chantierCode: ctx.chantier.code,
    chantierName: ctx.chantier.label ?? ctx.chantier.name,
    dateBesoin: '2026-07-15',
    demandeurId: ctx.employe.id,
    demandeurName: `${ctx.employe.prenom} ${ctx.employe.nom}`,
    motif: 'Ciment CPJ-45 pour voirie interne — phase 03',
    notes: QA_MARKER,
    lignes: [
      {
        articleId: ctx.article.id,
        articleCode: ctx.article.code,
        articleName: ctx.article.name,
        quantite: 200,
        uomCode: ctx.article.uomCode ?? 'Sac 50kg',
        prixEstimeHt: 155,
        totalEstimeHt: 31000,
      },
    ],
  };

  const created = await apiJson(request, session, 'POST', '/api/v1/demandes-achat', payload);
  if (!created.ok) {
    log.push({ step: 'da', ok: false, status: created.status, body: created.body });
    return null;
  }

  let da = created.body;
  const submit = await apiJson(request, session, 'POST', `/api/v1/demandes-achat/${da.id}/submit`, {});
  if (submit.ok) da = submit.body;

  const approve = await apiJson(request, session, 'POST', `/api/v1/demandes-achat/${da.id}/approve`, {
    approbateurName: 'QA Seed',
  });
  if (approve.ok) da = approve.body;

  log.push({
    step: 'da',
    ok: true,
    action: 'created',
    id: da.id,
    numero: da.numero,
    status: da.status,
  });
  return da;
}

async function ensureCatalogueLigne(request, session, ctx, log) {
  const existing = await findExistingCatalogue(request, session, ctx.fournisseur.id, ctx.article.id);
  if (existing) {
    log.push({ step: 'catalogue-sika', ok: true, action: 'exists', id: existing.id });
    return existing;
  }

  const created = await apiJson(request, session, 'POST', '/api/v1/catalogue-fournisseur', {
    fournisseurId: ctx.fournisseur.id,
    articleId: ctx.article.id,
    refFournisseur: 'SIKA-CIM-QA',
    designation: `${ctx.article.name} — ref Sika QA`,
    prixUnitaireHt: 148,
    uom: ctx.article.uomCode ?? 'Sac 50kg',
    actif: true,
  });
  log.push({
    step: 'catalogue-sika',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    body: created.ok ? undefined : created.body,
  });
  return created.ok ? created.body : null;
}

async function ensureBonCommande(request, session, ctx, da, log) {
  const existing = await findExistingBc(request, session, ctx.fournisseur.id);
  if (existing) {
    log.push({ step: 'bc', ok: true, action: 'exists', id: existing.id, numero: existing.numero });
    return existing;
  }

  const prixUnitaire = 148;
  const quantite = 200;
  const payload = {
    fournisseurId: ctx.fournisseur.id,
    fournisseurName: ctx.fournisseur.raisonSociale ?? ctx.fournisseur.name,
    chantierId: ctx.chantier.id,
    chantierCode: ctx.chantier.code,
    chantierName: ctx.chantier.label ?? ctx.chantier.name,
    daId: da?.id,
    daNumero: da?.numero,
    rubrique: 'MATERIAUX',
    dateLivraisonPrevue: '2026-07-20',
    conditionsPaiement: '30j fin de mois',
    modeReglement: 'VIREMENT',
    tvaTaux: 20,
    notes: QA_MARKER,
    lignes: [
      {
        articleId: ctx.article.id,
        articleCode: ctx.article.code,
        articleName: ctx.article.name,
        quantite,
        quantiteLivree: 0,
        quantiteFacturee: 0,
        uomCode: ctx.article.uomCode ?? 'Sac 50kg',
        prixUnitaireHt: prixUnitaire,
        totalHt: prixUnitaire * quantite,
      },
    ],
  };

  const created = await apiJson(request, session, 'POST', '/api/v1/bons-commande-achat', payload);
  if (!created.ok) {
    log.push({ step: 'bc', ok: false, status: created.status, body: created.body });
    return null;
  }

  let bc = created.body;
  for (const action of ['submit', 'approve', 'send']) {
    const res = await apiJson(request, session, 'POST', `/api/v1/bons-commande-achat/${bc.id}/${action}`, {
      validateurName: action === 'approve' ? 'QA Seed' : undefined,
    });
    if (res.ok) bc = res.body;
  }

  log.push({
    step: 'bc',
    ok: true,
    action: 'created',
    id: bc.id,
    numero: bc.numero,
    status: bc.status,
  });
  return bc;
}

async function ensureReception(request, session, ctx, bc, log) {
  const receptions = await apiJson(request, session, 'GET', `/api/v1/bons-commande-achat/${bc.id}/receptions`);
  const existing = asList(receptions.body).find((r) => r.notes === QA_MARKER);
  if (existing) {
    log.push({ step: 'reception', ok: true, action: 'exists', id: existing.id, numero: existing.numero });
    return existing;
  }

  if (!['ENVOYE', 'ACCUSE_RECEPTION', 'PARTIELLEMENT_LIVRE'].includes(bc.status)) {
    log.push({ step: 'reception', ok: true, action: 'skipped', reason: `bc-status-${bc.status}` });
    return null;
  }

  const bcDetail = await apiJson(request, session, 'GET', `/api/v1/bons-commande-achat/${bc.id}`);
  const lignes = bcDetail.body?.lignes ?? [];
  const ligne = lignes[0];
  if (!ligne?.id) {
    log.push({ step: 'reception', ok: false, action: 'no-bc-lines' });
    return null;
  }

  const qty = Math.min(Number(ligne.quantite) || 50, 50);
  const created = await apiJson(request, session, 'POST', `/api/v1/bons-commande-achat/${bc.id}/receptions`, {
    destLocationId: ctx.location.id,
    dateReception: '2026-06-18',
    blNumero: 'BL-SIKA-QA-001',
    notes: QA_MARKER,
    lignes: [
      {
        bonCommandeLigneId: ligne.id,
        articleId: ctx.article.id,
        quantiteRecue: qty,
      },
    ],
  });

  log.push({
    step: 'reception',
    ok: created.ok,
    status: created.status,
    action: created.ok ? 'created' : 'failed',
    id: created.body?.id,
    numero: created.body?.numero,
    body: created.ok ? undefined : created.body,
  });
  return created.ok ? created.body : null;
}

async function validateLists(request, session, log) {
  const daList = await apiJson(request, session, 'GET', `/api/v1/demandes-achat?chantierId=${CHANTIER_ID}`);
  const bcList = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/bons-commande-achat?chantierId=${CHANTIER_ID}`,
  );
  const daCount = asList(daList.body).length;
  const bcCount = asList(bcList.body).length;
  const ok = daList.ok && bcList.ok && daCount > 0 && bcCount > 0;
  log.push({ step: 'validate-lists', ok, daCount, bcCount });
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

  const fournisseur = await findSikaFournisseur(request, session);
  const chantier = await findChantier(request, session);
  const employe = await findEmployeKarim(request, session);
  const article = await findArticleCiment(request, session);
  const location = await findLocation(request, session);

  if (!fournisseur) log.push({ step: 'fournisseur-sika', ok: false, action: 'not-found' });
  if (!chantier) log.push({ step: 'chantier', ok: false, action: 'not-found' });
  if (!employe) log.push({ step: 'employe-karim', ok: false, action: 'not-found' });
  if (!article) log.push({ step: 'article-ciment', ok: false, action: 'not-found' });
  if (!location) log.push({ step: 'location', ok: false, action: 'not-found' });

  const prereqOk = fournisseur && chantier && employe && article;
  let da = null;
  let bc = null;
  let reception = null;

  if (prereqOk) {
    const ctx = { fournisseur, chantier, employe, article, location };
    await ensureCatalogueLigne(request, session, ctx, log);
    da = await ensureDemandeAchat(request, session, ctx, log);
    if (da) {
      bc = await ensureBonCommande(request, session, ctx, da, log);
      if (bc && location) {
        reception = await ensureReception(request, session, ctx, bc, log);
      }
    }
    await validateLists(request, session, log);
  }

  await browser.close();

  const failed = log.filter((e) => e.ok === false);
  const summary = {
    da: da ? { id: da.id, numero: da.numero, status: da.status } : null,
    bc: bc ? { id: bc.id, numero: bc.numero, status: bc.status } : null,
    reception: reception ? { id: reception.id, numero: reception.numero } : null,
    fournisseur: fournisseur ? { id: fournisseur.id, code: fournisseur.code } : null,
    article: article ? { id: article.id, code: article.code } : null,
    chantier: chantier ? { id: chantier.id, code: chantier.code } : null,
  };

  console.log(JSON.stringify({ ok: failed.length === 0, summary, log }, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
