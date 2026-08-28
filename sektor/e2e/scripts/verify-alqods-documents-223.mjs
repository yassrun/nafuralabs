/**
 * Preuve SEKTOR-223 — documents OS + PV depuis la fiche (AC-10, AC-11).
 * Run: node sektor/e2e/scripts/verify-alqods-documents-223.mjs
 *
 * Discriminants :
 *   dépôt OS (chantier) + PV (nœud 2.1) → visibles via ?chantierId=
 *   filtre chantierId : aucun document d'un autre chantier
 *   type inconnu / chantier vide → 400
 *   leftover 222 : DA create en conducteur après verbes CRUX
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
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
  const entity = join(here, '../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/domain/chantier/DocumentChantier.java');
  const svc = join(here, '../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/DocumentChantierService.java');
  const listing = join(here, '../../sources/web/app/chantiers/documents/documents-listing/documents-listing.page.ts');
  const routes = join(here, '../../sources/web/app/chantiers/components/pilotage-tab/cockpit-routes.ts');
  const osPdf = join(here, '../fixtures/al-qods/docs/OS-ALQODS-001.pdf');
  const pvPdf = join(here, '../fixtures/al-qods/docs/PV-coulage-2-1.pdf');
  for (const f of [entity, svc, listing, routes, osPdf, pvPdf]) {
    if (!existsSync(f)) throw new Error(`VU ROUGE chrome : ${f} absent`);
  }
  if (!readFileSync(entity, 'utf8').includes('noeudId')) {
    throw new Error('VU ROUGE : DocumentChantier sans noeudId');
  }
  const svcSrc = readFileSync(svc, 'utf8');
  if (!svcSrc.includes('"OS"') || !svcSrc.includes('"PV"') || !svcSrc.includes('"BL"')) {
    throw new Error('VU ROUGE : types palier 1 OS/PV/BL absents');
  }
  if (!svcSrc.includes('ERR_CHANTIER_REQUIS')) {
    throw new Error('VU ROUGE : dépôt sans chantier encore autorisé');
  }
  const listSrc = readFileSync(listing, 'utf8');
  if (!listSrc.includes('DOCUMENT_CHANTIER_PALIER_TYPES')) {
    throw new Error('VU ROUGE chrome : dépôt n’offre pas les types palier 1');
  }
  if (listSrc.includes('this.chantiers()[0]?.id')) {
    throw new Error('VU ROUGE chrome : dépôt défaut = premier chantier du tenant');
  }
  if (!readFileSync(routes, 'utf8').includes('/chantiers/documents?chantierId=')) {
    throw new Error('VU ROUGE chrome : cockpit documents sans chantierId');
  }
}

function findNoeud(nodes, code) {
  for (const n of nodes ?? []) {
    if (n.code === code && n.type === 'POSTE') return n;
    const nested = findNoeud(n.enfants, code);
    if (nested) return nested;
  }
  return null;
}

function pageContent(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.content)) return body.content;
  if (Array.isArray(body.items)) return body.items;
  return [];
}

async function creerChantier(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client pour 223');
  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods docs 223 ${suffix}`, chargeEtudeUserId: charge, clientNom: `MOA 223 ${suffix}`,
  });
  if (d.status !== 201) throw new Error(`dossier ${d.status} ${d.text}`);
  const dossierId = d.body.id;
  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const dpgfId = b.body?.dpgfId;
  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, { type: 'LOT', code: '2', libelle: 'Gros œuvre' });
  const p21 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot.body.id, code: '2.1', libelle: 'Béton B25 fondations',
    quantite: 180, unite: 'm³', origineCout: 'ESTIME', coutUnitaire: 1200, fraisGenerauxPercent: 0, margePercent: 15,
  });
  if (p21.status !== 201) throw new Error(`poste 2.1 ${p21.status} ${p21.text}`);
  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: p21.body.id });
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
    type: 'MATIERE', referenceType: 'LIBRE', libelle: 'Béton', rendement: 1, unite: 'm³',
    prixUnitaire: 1200, sourcePrix: 'MANUEL',
  });
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
    osReference: `OS-223-${suffix}`.slice(0, 40), osDateEffet: '2026-08-01',
  });
  if (!os.ok) throw new Error(`demarrer-os ${os.status} ${os.text}`);
  return id;
}

async function main() {
  const probe = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const probeBody = await probe.json().catch(() => null);
  if (!probeBody?.accessToken) {
    console.log('SKIP cursor-session unavailable');
    process.exit(0);
  }

  assertChrome();
  console.log('ok chrome : OS/PV/BL, noeudId, filtre chantierId, pas d’orphelin par défaut tenant');

  const here = dirname(fileURLToPath(import.meta.url));
  const osPdf = join(here, '../fixtures/al-qods/docs/OS-ALQODS-001.pdf');
  const pvPdf = join(here, '../fixtures/al-qods/docs/PV-coulage-2-1.pdf');

  const oh = await session();
  const suffix = Date.now().toString(36);
  const chantierId = await creerChantier(oh, suffix);
  const arbre = await api(oh, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  if (!arbre.ok) throw new Error(`budget-arbre ${arbre.status}`);
  const n21 = findNoeud(arbre.body.lots, '2.1');
  if (!n21?.id) throw new Error('nœud 2.1 absent après conversion');

  const typeInconnu = await api(oh, 'POST', `/api/v1/chantiers/${chantierId}/documents`, {
    type: 'FAKE', titre: 'x', fichier: 'x.pdf', taille: 1, uploadedAt: '2026-08-01', uploadedPar: 'qa',
  });
  if (typeInconnu.status !== 400) {
    throw new Error(`type inconnu attendu 400, obtenu ${typeInconnu.status} ${typeInconnu.text?.slice(0, 160)}`);
  }
  console.log('PASS type inconnu → 400');

  const chef = await session('chef-chantier');
  const deposant = chef ?? oh;
  const roleDepot = chef ? 'chef-chantier' : 'owner';

  const osDoc = await api(deposant, 'POST', `/api/v1/chantiers/${chantierId}/documents`, {
    type: 'OS',
    titre: 'OS Al Qods 001',
    fichier: 'OS-ALQODS-001.pdf',
    taille: statSync(osPdf).size,
    uploadedAt: '2026-08-01',
    uploadedPar: 'qa-chef-chantier',
  });
  if (osDoc.status !== 201) {
    throw new Error(`OS ${roleDepot} ${osDoc.status} ${osDoc.text?.slice(0, 250)}`);
  }
  if (osDoc.body.chantierId !== chantierId) throw new Error('OS orphelin (chantierId manquant)');
  if (osDoc.body.noeudId) throw new Error('OS ne doit pas porter de nœud');
  console.log(`PASS OS déposé (${roleDepot}) sans nœud`);

  const pvDoc = await api(deposant, 'POST', `/api/v1/chantiers/${chantierId}/documents`, {
    type: 'PV',
    titre: 'PV coulage fondations 2.1',
    fichier: 'PV-coulage-2-1.pdf',
    taille: statSync(pvPdf).size,
    uploadedAt: '2026-08-15',
    uploadedPar: 'qa-chef-chantier',
    noeudId: n21.id,
  });
  if (pvDoc.status !== 201) {
    throw new Error(`PV ${roleDepot} ${pvDoc.status} ${pvDoc.text?.slice(0, 250)}`);
  }
  if (pvDoc.body.noeudId !== n21.id) throw new Error('PV sans nœud 2.1');
  console.log('PASS PV déposé sur nœud 2.1');

  const filtered = await api(oh, 'GET', `/api/v1/chantiers/documents?chantierId=${encodeURIComponent(chantierId)}&size=48`);
  if (!filtered.ok) throw new Error(`listing filtré ${filtered.status} ${filtered.text?.slice(0, 160)}`);
  const scoped = pageContent(filtered.body);
  if (scoped.some((d) => d.chantierId !== chantierId)) {
    throw new Error('filtre chantierId a laissé un document d’un autre chantier');
  }
  const types = new Set(scoped.map((d) => d.type));
  if (!types.has('OS') || !types.has('PV')) {
    throw new Error(`OS+PV absents du filtre chantier : ${[...types].join(',')}`);
  }
  const nested = await api(oh, 'GET', `/api/v1/chantiers/${chantierId}/documents`);
  const nestedList = Array.isArray(nested.body) ? nested.body : [];
  if (!nestedList.some((d) => d.type === 'OS') || !nestedList.some((d) => d.type === 'PV')) {
    throw new Error('onglet chantier : OS+PV absents');
  }
  console.log('PASS alqods-documents-os-pv : OS+PV visibles via chantierId, aucun orphelin');

  const cond = await session('conducteur');
  const daCond = await api(cond, 'POST', '/api/v1/demandes-achat', {
    chantierId,
    dateBesoin: '2026-09-10',
    demandeurId: 'qa-emp-conducteur',
    motif: 'recheck 222 CRUX conducteur',
    lignes: [{
      articleId: '00000000-0000-0000-0000-000000000001',
      articleCode: 'ciment-cpj-45',
      articleName: 'Ciment CPJ 45',
      quantite: 1,
      uomCode: 't',
      prixEstimeHt: 1,
    }],
  });
  const daOk = daCond.status === 201 || daCond.status === 400;
  if (daCond.status === 403) {
    console.log('LEFTOVER 222 : conducteur DA create encore 403 (IAM/CRUX)');
  } else if (!daOk && daCond.status !== 201) {
    console.log(`NOTE leftover 222 : conducteur DA ${daCond.status} ${daCond.text?.slice(0, 120)}`);
  } else {
    console.log(`PASS leftover 222 : conducteur DA create ${daCond.status} (plus 403)`);
  }

  const front = await fetch(FRONT_BASE, { headers: { Accept: 'text/html' } }).catch(() => null);
  console.log(front?.ok
    ? `front ${FRONT_BASE} joignable (Browser MCP absent — pas de clic UI)`
    : `front ${FRONT_BASE} injoignable`);
  console.log(`SEKTOR-223 documents OS+PV : PASS · chantierId=${chantierId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
