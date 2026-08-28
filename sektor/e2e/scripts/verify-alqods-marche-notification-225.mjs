/**
 * Preuve SEKTOR-225 — notification marché depuis le chantier (AC-12).
 * Run: node sektor/e2e/scripts/verify-alqods-marche-notification-225.mjs
 *
 * Discriminants :
 *   alqods-marche-notification : après conversion, pas de marché ; après notifier,
 *   mêmes montants, source DEVIS → MARCHE.
 *   Chantier jamais notifié : source reste DEVIS.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
const FRONT_BASE = process.env.NAFURA_QA_FRONT_BASE ?? 'http://127.0.0.1:4200';

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

async function session(role) {
  const url = `${API_BASE}/api/public/dev/cursor-session${role ? `?role=${role}` : ''}`;
  const s = await (await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } })).json();
  if (!s?.accessToken || !s?.tenantId) return null;
  return {
    Authorization: `Bearer ${s.accessToken}`,
    'X-Tenant-Id': s.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function api(h, method, path, body) {
  const opts = { method, headers: h };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return json(await fetch(`${API_BASE}${path}`, opts));
}

function assertChrome() {
  const here = dirname(fileURLToPath(import.meta.url));
  const adapter = join(here, '../../sources/backend/etudes/src/main/java/ma/nafura/etudes/adapters/bc/ChainageAvalAdapter.java');
  const decision = join(here, '../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/ChantierActionDecision.java');
  const port = join(here, '../../sources/backend/marches/src/main/java/ma/nafura/marches/service/port/ChantierVentePort.java');
  const create = join(here, '../../sources/web/app/marches/contrats/contrat-create/contrat-create.page.ts');
  const svc = join(here, '../../sources/backend/marches/src/main/java/ma/nafura/marches/service/ContratMarcheService.java');
  for (const f of [adapter, decision, port, create, svc]) {
    if (!existsSync(f)) throw new Error(`VU ROUGE chrome : ${f} absent`);
  }
  if (readFileSync(adapter, 'utf8').includes('import ma.nafura.marches')) {
    throw new Error('VU ROUGE : conversion importe encore le BC Marchés');
  }
  const decisionSrc = readFileSync(decision, 'utf8');
  if (!decisionSrc.includes('notifierMarche')) {
    throw new Error('VU ROUGE : CTA notifier-marché absent du cockpit');
  }
  if (!readFileSync(svc, 'utf8').includes('basculerVersMarche')) {
    throw new Error('VU ROUGE : notifier() ne bascule pas la vente chantier');
  }
  const createSrc = readFileSync(create, 'utf8');
  if (createSrc.includes('res.items[0]')) {
    throw new Error('VU ROUGE chrome : create marché défaut = premier chantier');
  }
  if (!createSrc.includes('submitNotify') && !createSrc.includes('submit(true)')) {
    throw new Error('VU ROUGE chrome : pas de geste Créer et notifier');
  }
}

function labels(cockpit) {
  return (cockpit?.nextActions ?? []).map((a) => a.libelle);
}

async function creerChantier(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client pour 225');
  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods marché 225 ${suffix}`, chargeEtudeUserId: charge, clientNom: `MOA 225 ${suffix}`,
  });
  if (d.status !== 201) throw new Error(`dossier ${d.status} ${d.text}`);
  const dossierId = d.body.id;
  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const dpgfId = b.body?.dpgfId;
  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, { type: 'LOT', code: '2', libelle: 'Gros œuvre' });
  const p21 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot.body.id, code: '2.1', libelle: 'Fondations',
    quantite: 40, unite: 't', origineCout: 'ESTIME', coutUnitaire: 850, fraisGenerauxPercent: 0, margePercent: 15,
  });
  if (p21.status !== 201) throw new Error(`poste 2.1 ${p21.status} ${p21.text}`);
  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  const soumis = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  if (!soumis.ok) throw new Error(`soumettre ${soumis.status} ${soumis.text?.slice(0, 150)}`);
  let v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (v.ok && v.body?.status === 'EN_VALIDATION') v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (!v.ok || v.body?.status !== 'VALIDEE') throw new Error(`valider ${v.status} ${v.text?.slice(0, 150)}`);
  const g = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId: client.id });
  if (!g.ok) throw new Error(`generer-devis ${g.status} ${g.text}`);
  const devisId = g.body?.devisGenereId ?? g.body?.id;
  const dd = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  const total = dd.body?.totalHt ?? dd.body?.totalHT;
  const gain = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: new Date().toISOString().slice(0, 10), devisId, montantAttribue: total,
  });
  if (!gain.ok) throw new Error(`gagne ${gain.status} ${gain.text?.slice(0, 200)}`);
  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {});
  if (!conv.ok) throw new Error(`convertir ${conv.status} ${conv.text?.slice(0, 200)}`);
  if (conv.body?.marcheId || conv.body?.marcheGenereId) {
    throw new Error(`conversion a créé un marché : ${JSON.stringify(conv.body)}`);
  }
  const id = conv.body?.chantierId ?? conv.body?.id;
  const today = new Date().toISOString().slice(0, 10);
  for (const [employeId, roleCode] of [
    ['qa-emp-conducteur', 'BTP_CONDUCTEUR_TRAVAUX'],
    ['qa-emp-chef-chantier', 'BTP_CHEF_CHANTIER'],
  ]) {
    const aff = await api(h, 'POST', `/api/v1/chantiers/${id}/affectations`, { employeId, roleCode, dateDebut: today });
    if (aff.status !== 201 && aff.status !== 200) throw new Error(`affectation ${roleCode} ${aff.status} ${aff.text}`);
  }
  await api(h, 'PUT', `/api/v1/chantiers/${id}`, { dateDebut: '2026-08-01', dateFinPrevue: '2027-03-01' });
  const os = await api(h, 'POST', `/api/v1/chantiers/${id}/demarrer-os`, {
    osReference: `OS-225-${suffix}`.slice(0, 40), osDateEffet: '2026-08-01',
  });
  if (!os.ok) throw new Error(`demarrer-os ${os.status} ${os.text}`);
  return { id, dossierId, client, total };
}

function sameMontant(a, b) {
  return Number(a).toFixed(2) === Number(b).toFixed(2);
}

async function main() {
  const probe = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST', headers: { Accept: 'application/json' },
  });
  const probeBody = await probe.json().catch(() => null);
  if (!probeBody?.accessToken) {
    console.log('SKIP cursor-session unavailable');
    process.exit(0);
  }

  assertChrome();
  console.log('ok chrome : conversion sans ContratMarche, CTA notifier, pas de défaut premier chantier');

  const oh = await session();
  const suffix = Date.now().toString(36);
  const a = await creerChantier(oh, suffix);
  const b = await creerChantier(oh, `${suffix}b`);

  const synA = await api(oh, 'GET', `/api/v1/etudes/dossiers/${a.dossierId}/synthese`);
  if (synA.body?.marcheGenereId) {
    throw new Error(`marcheGenereId après conversion : ${synA.body.marcheGenereId}`);
  }
  console.log('PASS conversion : marcheGenereId nul');

  const chA0 = await api(oh, 'GET', `/api/v1/chantiers/${a.id}`);
  if (!chA0.ok) throw new Error(`GET chantier A ${chA0.status}`);
  if (chA0.body.sourceVente !== 'DEVIS') {
    throw new Error(`A avant notify attendu DEVIS, obtenu ${chA0.body.sourceVente}`);
  }
  const venteAvant = chA0.body.montantVenteActifHt ?? chA0.body.montantVenteInitialHt;
  if (venteAvant == null) throw new Error('vente active absente avant notification');

  const ckA0 = await api(oh, 'GET', `/api/v1/chantiers/${a.id}/cockpit`);
  if (ckA0.body?.finance?.montantVenteActifHt?.source !== 'DEVIS') {
    throw new Error(`cockpit A source avant : ${ckA0.body?.finance?.montantVenteActifHt?.source}`);
  }
  if (!labels(ckA0.body).includes('chantiers.cockpit.action.notifierMarche')) {
    throw new Error(`owner sans notifierMarche : ${labels(ckA0.body).join(',')}`);
  }
  const chefCk = await api(await session('chef-chantier'), 'GET', `/api/v1/chantiers/${a.id}/cockpit`);
  if (labels(chefCk.body).includes('chantiers.cockpit.action.notifierMarche')) {
    throw new Error('chef a notifier-marché');
  }
  const condCk = await api(await session('conducteur'), 'GET', `/api/v1/chantiers/${a.id}/cockpit`);
  if (!labels(condCk.body).includes('chantiers.cockpit.action.notifierMarche')) {
    throw new Error(`conducteur sans notifierMarche : ${labels(condCk.body).join(',')}`);
  }
  console.log('PASS cockpit : notifierMarche owner/conducteur, pas chef');

  const listAvant = await api(oh, 'GET', `/api/v1/marches/contrats?chantierId=${encodeURIComponent(a.id)}`);
  const rowsAvant = Array.isArray(listAvant.body) ? listAvant.body : [];
  if (rowsAvant.some((r) => r.status === 'NOTIFIE' || r.status === 'EN_COURS')) {
    throw new Error('marché déjà notifié avant le geste');
  }

  const created = await api(oh, 'POST', '/api/v1/marches/contrats', {
    intitule: 'Marché Al Qods fondations',
    reference: 'CPS-ALQODS-225',
    chantierId: a.id,
    chantierCode: chA0.body.code,
    chantierNom: chA0.body.label ?? chA0.body.name,
    clientId: String(chA0.body.clientId ?? a.client.id),
    clientNom: chA0.body.clientName ?? a.client.raisonSociale ?? 'MOA',
    typeMarche: 'FORFAITAIRE',
    typeCcagT: 'TRAVAUX',
    natureMarche: 'PRIVE_PME',
    montantHt: venteAvant,
    tauxTva: 20,
    tauxRg: 7,
    tauxAvance: 10,
    dureeMois: 8,
    dateDemarrage: '2026-08-01',
    status: 'BROUILLON',
  });
  if (created.status !== 201) throw new Error(`create marché ${created.status} ${created.text?.slice(0, 250)}`);

  const chDraft = await api(oh, 'GET', `/api/v1/chantiers/${a.id}`);
  if (chDraft.body.sourceVente !== 'DEVIS') {
    throw new Error(`brouillon a déjà basculé la vente : ${chDraft.body.sourceVente}`);
  }

  const notified = await api(oh, 'POST', `/api/v1/marches/contrats/${created.body.id}/notifier`, {});
  if (!notified.ok) throw new Error(`notifier ${notified.status} ${notified.text?.slice(0, 250)}`);
  if (notified.body.status !== 'NOTIFIE') {
    throw new Error(`status après notifier : ${notified.body.status}`);
  }

  const chA1 = await api(oh, 'GET', `/api/v1/chantiers/${a.id}`);
  if (chA1.body.sourceVente !== 'MARCHE') {
    throw new Error(`A après notify attendu MARCHE, obtenu ${chA1.body.sourceVente}`);
  }
  const venteApres = chA1.body.montantVenteActifHt ?? chA1.body.montantVenteInitialHt;
  if (!sameMontant(venteAvant, venteApres)) {
    throw new Error(`montants changés : ${venteAvant} → ${venteApres}`);
  }
  const ckA1 = await api(oh, 'GET', `/api/v1/chantiers/${a.id}/cockpit`);
  if (ckA1.body?.finance?.montantVenteActifHt?.source !== 'MARCHE') {
    throw new Error(`cockpit A source après : ${ckA1.body?.finance?.montantVenteActifHt?.source}`);
  }
  if (labels(ckA1.body).includes('chantiers.cockpit.action.notifierMarche')) {
    throw new Error('CTA notifier encore proposé après notification');
  }
  console.log('PASS alqods-marche-notification : mêmes montants, source DEVIS → MARCHE');

  const chB = await api(oh, 'GET', `/api/v1/chantiers/${b.id}`);
  if (chB.body.sourceVente !== 'DEVIS') {
    throw new Error(`B jamais notifié attendu DEVIS, obtenu ${chB.body.sourceVente}`);
  }
  const ckB = await api(oh, 'GET', `/api/v1/chantiers/${b.id}/cockpit`);
  if (ckB.body?.finance?.montantVenteActifHt?.source !== 'DEVIS') {
    throw new Error(`cockpit B source : ${ckB.body?.finance?.montantVenteActifHt?.source}`);
  }
  if (!labels(ckB.body).includes('chantiers.cockpit.action.notifierMarche')) {
    throw new Error('B sans CTA notifier');
  }
  console.log('PASS chantier jamais notifié : source devis');

  const front = await fetch(FRONT_BASE, { headers: { Accept: 'text/html' } }).catch(() => null);
  console.log(front?.ok
    ? `front ${FRONT_BASE} joignable (Browser MCP absent — pas de clic UI)`
    : `front ${FRONT_BASE} injoignable`);
  console.log(`SEKTOR-225 marché notification : PASS · chantierId=${a.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
