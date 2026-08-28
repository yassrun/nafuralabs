/**
 * Preuve SEKTOR-224 — contrat ST sur nœud 2.3 sans planning (AC-8, AC-9).
 * Run: node sektor/e2e/scripts/verify-alqods-st-coffrage-224.mjs
 *
 * Discriminants :
 *   alqods-st-coffrage-sans-planning : contrat 2.3, 0 activité, BPU
 *   nœud INTERNE → 400 achats.st.noeud_interne
 *   nœud d'un autre chantier → 400 achats.st.noeud_hors_chantier
 *   120 m² sur 2.3 entre dans l'attachement client (pas un % sur le contrat)
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
  const svc = join(here, '../../sources/backend/achats/src/main/java/ma/nafura/achats/service/ChantierSousTraitanceService.java');
  const adapter = join(here, '../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/NoeudChantierAdapter.java');
  const create = join(here, '../../sources/web/app/chantiers/sous-traitance/sous-traitance-create/sous-traitance-create.page.ts');
  const listing = join(here, '../../sources/web/app/chantiers/sous-traitance/sous-traitance-listing/sous-traitance-listing.page.ts');
  const bpu = join(here, '../fixtures/al-qods/st/BPU-coffrage-2-3.pdf');
  for (const f of [svc, adapter, create, listing, bpu]) {
    if (!existsSync(f)) throw new Error(`VU ROUGE chrome : ${f} absent`);
  }
  if (!readFileSync(svc, 'utf8').includes('ERR_NOEUD_REQUIS')) {
    throw new Error('VU ROUGE : ST sans nœud encore autorisé');
  }
  if (!readFileSync(adapter, 'utf8').includes('ERR_NOEUD_INTERNE')) {
    throw new Error('VU ROUGE : INTERNE non refusé');
  }
  const createSrc = readFileSync(create, 'utf8');
  if (!createSrc.includes("queryParamMap.get('noeudId')")) {
    throw new Error('VU ROUGE chrome : ST create ignore noeudId query');
  }
  if (createSrc.includes('res.items[0]')) {
    throw new Error('VU ROUGE chrome : ST défaut = premier chantier');
  }
  if (readFileSync(listing, 'utf8').includes('c.avancementPercent')) {
    throw new Error('VU ROUGE chrome : faux % encore affiché sur le contrat ST');
  }
}

function findNoeud(nodes, code, type = 'POSTE') {
  for (const n of nodes ?? []) {
    if (n.code === code && n.type === type) return n;
    const nested = findNoeud(n.enfants, code, type);
    if (nested) return nested;
  }
  return null;
}

async function creerChantier(h, suffix, withCoffrage) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client pour 224');
  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods ST 224 ${suffix}`, chargeEtudeUserId: charge, clientNom: `MOA 224 ${suffix}`,
  });
  if (d.status !== 201) throw new Error(`dossier ${d.status} ${d.text}`);
  const dossierId = d.body.id;
  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const dpgfId = b.body?.dpgfId;
  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, { type: 'LOT', code: '2', libelle: 'Gros œuvre' });
  const p23 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot.body.id, code: '2.3', libelle: 'Coffrage',
    quantite: 850, unite: 'm²', origineCout: 'ESTIME', coutUnitaire: 95, fraisGenerauxPercent: 0, margePercent: 15,
  });
  if (p23.status !== 201) throw new Error(`poste 2.3 ${p23.status} ${p23.text}`);
  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: p23.body.id });
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
    type: 'SOUS_TRAITANCE', referenceType: 'LIBRE', libelle: 'Coffrage ST', rendement: 1, unite: 'm²',
    prixUnitaire: 95, sourcePrix: 'MANUEL',
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
    osReference: `OS-224-${suffix}`.slice(0, 40), osDateEffet: '2026-08-01',
  });
  if (!os.ok) throw new Error(`demarrer-os ${os.status} ${os.text}`);
  return { id, withCoffrage };
}

async function resolveFournisseur(h) {
  const res = await api(h, 'GET', '/api/v1/partners?roles=FOURNISSEUR&size=5');
  const list = Array.isArray(res.body) ? res.body : res.body?.content ?? res.body?.items ?? [];
  const f = list[0];
  if (!f?.id) throw new Error('aucun fournisseur');
  return { id: String(f.id), name: f.raisonSociale ?? f.name ?? 'Coffreurs Atlas' };
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
  console.log('ok chrome : ST sur nœud, INTERNE refusé, pas de faux %');

  const oh = await session();
  const suffix = Date.now().toString(36);
  const { id: chantierId } = await creerChantier(oh, suffix, true);
  const other = await creerChantier(oh, `${suffix}b`, true);
  const arbre = await api(oh, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  if (!arbre.ok) throw new Error(`budget-arbre ${arbre.status}`);
  const n23 = findNoeud(arbre.body.lots, '2.3');
  const lot2 = findNoeud(arbre.body.lots, '2', 'LOT');
  if (!n23?.id || !lot2?.id) throw new Error('nœud 2.3 / lot 2 absents');

  const acts = await api(oh, 'GET', `/api/v1/chantiers/${chantierId}/activites`);
  const actList = Array.isArray(acts.body) ? acts.body : acts.body?.content ?? [];
  if (actList.length > 0) throw new Error(`attendu 0 activité, obtenu ${actList.length}`);

  const sansNoeud = await api(oh, 'POST', `/api/v1/chantiers/${chantierId}/sous-traitances`, {
    sousTraitantId: 'st-x', sousTraitantNom: 'X', objet: 'sans nœud',
    dateDebut: '2026-09-08', dateFin: '2026-09-30', montantHt: 1,
  });
  if (sansNoeud.status !== 400) {
    throw new Error(`ST sans nœud attendu 400, obtenu ${sansNoeud.status} ${sansNoeud.text?.slice(0, 160)}`);
  }
  console.log('PASS ST sans noeudId → 400');

  const interne = await api(oh, 'POST', `/api/v1/lots/${lot2.id}/postes-budgetaires`, {
    code: '2.9', designation: 'Base vie interne', unite: 'ens', quantite: 1,
  });
  if (interne.status !== 201) throw new Error(`poste INTERNE ${interne.status} ${interne.text?.slice(0, 200)}`);
  const stInterne = await api(oh, 'POST', `/api/v1/chantiers/${chantierId}/sous-traitances`, {
    sousTraitantId: 'st-x', sousTraitantNom: 'X', objet: 'interne',
    dateDebut: '2026-09-08', dateFin: '2026-09-30', montantHt: 1, noeudId: interne.body.id,
  });
  if (stInterne.status !== 400 || !`${stInterne.text}`.includes('achats.st.noeud_interne')) {
    throw new Error(`INTERNE attendu 400 achats.st.noeud_interne, obtenu ${stInterne.status} ${stInterne.text?.slice(0, 200)}`);
  }
  console.log('PASS nœud INTERNE → 400');

  const stHors = await api(oh, 'POST', `/api/v1/chantiers/${other.id}/sous-traitances`, {
    sousTraitantId: 'st-x', sousTraitantNom: 'X', objet: 'hors chantier',
    dateDebut: '2026-09-08', dateFin: '2026-09-30', montantHt: 1, noeudId: n23.id,
  });
  if (stHors.status !== 400 || !`${stHors.text}`.includes('achats.st.noeud_hors_chantier')) {
    throw new Error(`hors chantier attendu 400, obtenu ${stHors.status} ${stHors.text?.slice(0, 200)}`);
  }
  console.log('PASS nœud autre chantier → 400');

  const fournisseur = await resolveFournisseur(oh);
  const st = await api(oh, 'POST', `/api/v1/chantiers/${chantierId}/sous-traitances`, {
    sousTraitantId: fournisseur.id,
    sousTraitantNom: fournisseur.name,
    objet: 'Coffrage poste 2.3 Al Qods',
    dateDebut: '2026-09-08',
    dateFin: '2026-09-30',
    montantHt: 80750,
    retenueGarantieTaux: 7,
    noeudId: n23.id,
    bpuFichier: 'BPU-coffrage-2-3.pdf',
  });
  if (st.status !== 201) throw new Error(`ST 2.3 ${st.status} ${st.text?.slice(0, 250)}`);
  if (st.body.noeudId !== n23.id) throw new Error('contrat ST sans nœud 2.3');
  if (st.body.avancementPercent) throw new Error(`faux % sur contrat ST : ${st.body.avancementPercent}`);
  if (st.body.bpuFichier !== 'BPU-coffrage-2-3.pdf') throw new Error('BPU non porté');
  console.log('PASS alqods-st-coffrage-sans-planning : contrat 2.3, 0 activité, BPU');

  const avanc = await api(oh, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-18',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n23.id, quantiteRealisee: 120 }],
  });
  if (!avanc.ok) throw new Error(`avancement 120 m² ${avanc.status} ${avanc.text?.slice(0, 200)}`);
  const att = await api(oh, 'POST', `/api/v1/chantiers/${chantierId}/attachements`, {
    dateDebut: '2026-09-01', dateFin: '2026-09-30', effectifPresent: 8,
  });
  if (!att.ok) throw new Error(`attachement ${att.status} ${att.text?.slice(0, 200)}`);
  const ligne = (att.body?.lignes ?? []).find((l) => l.noeudId === n23.id);
  if (!ligne || Number(ligne.quantitePeriode) !== 120) {
    throw new Error(`attachement client sans 120 m² : ${JSON.stringify(ligne)}`);
  }
  console.log('PASS 120 m² sur 2.3 dans l’attachement client');

  const front = await fetch(FRONT_BASE, { headers: { Accept: 'text/html' } }).catch(() => null);
  console.log(front?.ok
    ? `front ${FRONT_BASE} joignable (Browser MCP absent — pas de clic UI)`
    : `front ${FRONT_BASE} injoignable`);
  console.log(`SEKTOR-224 ST coffrage : PASS · chantierId=${chantierId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
