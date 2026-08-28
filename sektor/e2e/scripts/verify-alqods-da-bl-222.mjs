/**
 * Preuve SEKTOR-222 — DA → BC → BL direct sur nœud (AC-4..7).
 * Run: node sektor/e2e/scripts/verify-alqods-da-bl-222.mjs
 *
 * Discriminants :
 *   DA sans chantierId → 400
 *   alqods-da-bl-direct-2-1 : 40 t CPJ 45 sur nœud 2.1, BL 44012, reste 0, réel imputé
 *   alqods-bl-partiel-acier : 12 t / 25 t, reste 13
 *   30 t > 25 t → 409 achats.reception.ecart_qte (pas d'écrêtage)
 *   réception sans destLocationId (pas de magasin)
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
  const daDto = join(here, '../../sources/backend/achats/src/main/java/ma/nafura/achats/api/request/DemandeAchatCreateDto.java');
  const recDto = join(here, '../../sources/backend/achats/src/main/java/ma/nafura/achats/api/request/ReceptionAchatCreateDto.java');
  const recSvc = join(here, '../../sources/backend/achats/src/main/java/ma/nafura/achats/service/ReceptionAchatService.java');
  const daPage = join(here, '../../sources/web/app/achats/demandes/demande-detail/demande-detail.page.ts');
  const bcPage = join(here, '../../sources/web/app/achats/commandes/bc-detail/bc-detail.page.ts');
  for (const f of [daDto, recDto, recSvc, daPage, bcPage]) {
    if (!existsSync(f)) throw new Error(`VU ROUGE chrome : ${f} absent`);
  }
  const daSrc = readFileSync(daDto, 'utf8');
  if (!daSrc.includes('noeudId')) throw new Error('VU ROUGE : DemandeAchatCreateDto sans noeudId');
  const recSrc = readFileSync(recDto, 'utf8');
  if (recSrc.includes('@NotNull') && recSrc.includes('destLocationId')) {
    throw new Error('VU ROUGE : destLocationId encore obligatoire (magasin forcé)');
  }
  const svc = readFileSync(recSvc, 'utf8');
  if (!svc.includes('ERR_QTE_EXCEDE_RESTE') || !svc.includes('getDestLocationId() != null')) {
    throw new Error('VU ROUGE : réception n’a pas d’écart explicite / skip magasin');
  }
  if (!readFileSync(daPage, 'utf8').includes("queryParamMap.get('noeudId')")) {
    throw new Error('VU ROUGE chrome : DA ignore noeudId query');
  }
  const bcSrc = readFileSync(bcPage, 'utf8');
  if (bcSrc.includes('Math.min(Math.max(0, qty), r.remaining)')) {
    throw new Error('VU ROUGE chrome : écrêtage silencieux de la qté reçue');
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

function reste(ligne) {
  return Number(ligne.quantite) - Number(ligne.quantiteLivree ?? 0);
}

async function resolveItem(h, cleStable, designation, uniteCode) {
  const got = await api(h, 'GET', `/api/v1/items/identites/${cleStable}`);
  if (got.ok && got.body?.id) return String(got.body.id);
  const created = await api(h, 'POST', '/api/v1/items/extraire-creer', {
    designation, nature: 'MATIERE', uniteCode, cleStable,
  });
  if (!created.ok || !created.body?.itemId) {
    throw new Error(`article ${cleStable} ${created.status} ${created.text?.slice(0, 200)}`);
  }
  return String(created.body.itemId);
}

async function resolveFournisseur(h) {
  const res = await api(h, 'GET', '/api/v1/partners?roles=FOURNISSEUR&size=5');
  const list = Array.isArray(res.body) ? res.body : res.body?.content ?? res.body?.items ?? [];
  const f = list[0];
  if (!f?.id) throw new Error('aucun fournisseur');
  return { id: String(f.id), name: f.raisonSociale ?? f.name ?? 'Fournisseur' };
}

async function creerChantier(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client pour 222');
  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods DA-BL 222 ${suffix}`, chargeEtudeUserId: charge, clientNom: `MOA 222 ${suffix}`,
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
  const p22 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot.body.id, code: '2.2', libelle: 'Acier HA',
    quantite: 25, unite: 't', origineCout: 'ESTIME', coutUnitaire: 9800, fraisGenerauxPercent: 0, margePercent: 15,
  });
  if (p21.status !== 201) throw new Error(`poste 2.1 ${p21.status} ${p21.text}`);
  if (p22.status !== 201) throw new Error(`poste 2.2 ${p22.status} ${p22.text}`);
  for (const poste of [p21.body, p22.body]) {
    const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: poste.id });
    await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
      type: 'MATIERE', referenceType: 'LIBRE', libelle: poste.libelle, rendement: 1, unite: poste.unite ?? 'U',
      prixUnitaire: poste.coutUnitaire ?? 1, sourcePrix: 'MANUEL',
    });
  }
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
    ['qa-emp-magasinier', 'BTP_MAGASINIER'],
  ]) {
    const aff = await api(h, 'POST', `/api/v1/chantiers/${id}/affectations`, { employeId, roleCode, dateDebut: today });
    if (aff.status !== 201 && aff.status !== 200) throw new Error(`affectation ${roleCode} ${aff.status} ${aff.text}`);
  }
  await api(h, 'PUT', `/api/v1/chantiers/${id}`, { dateDebut: '2026-08-01', dateFinPrevue: '2027-03-01' });
  const os = await api(h, 'POST', `/api/v1/chantiers/${id}/demarrer-os`, {
    osReference: `OS-222-${suffix}`.slice(0, 40), osDateEffet: '2026-08-01',
  });
  if (!os.ok) throw new Error(`demarrer-os ${os.status} ${os.text}`);
  return id;
}

async function envoyerBc(h, da, fournisseur, dateLivraison) {
  const bc = await api(h, 'POST', '/api/v1/bons-commande-achat', {
    fournisseurId: fournisseur.id,
    fournisseurName: fournisseur.name,
    daId: da.id,
    dateLivraisonPrevue: dateLivraison,
    conditionsPaiement: '30j',
    rubrique: 'MATERIAUX',
  });
  if (bc.status !== 201) throw new Error(`BC ${bc.status} ${bc.text?.slice(0, 250)}`);
  if (bc.body.chantierId !== da.chantierId) throw new Error('BC chantierId ≠ DA');
  if (bc.body.noeudId !== da.noeudId) throw new Error('BC noeudId ≠ DA');
  let cur = await api(h, 'POST', `/api/v1/bons-commande-achat/${bc.body.id}/submit`, {});
  if (!cur.ok) throw new Error(`BC submit ${cur.status} ${cur.text}`);
  cur = await api(h, 'POST', `/api/v1/bons-commande-achat/${bc.body.id}/approve`, {});
  if (!cur.ok) throw new Error(`BC approve ${cur.status} ${cur.text}`);
  cur = await api(h, 'POST', `/api/v1/bons-commande-achat/${bc.body.id}/send`, {});
  if (!cur.ok) throw new Error(`BC send ${cur.status} ${cur.text}`);
  return cur.body;
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
  console.log('ok chrome : noeudId DA/BC, destLocationId optionnel, écart BL refusé');

  const oh = await session();
  const suffix = Date.now().toString(36);
  const chantierId = await creerChantier(oh, suffix);

  const arbre = await api(oh, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  if (!arbre.ok) throw new Error(`budget-arbre ${arbre.status}`);
  const n21 = findNoeud(arbre.body.lots, '2.1');
  const n22 = findNoeud(arbre.body.lots, '2.2');
  if (!n21?.id || !n22?.id) throw new Error('nœuds 2.1 / 2.2 absents après conversion');

  const cimentId = await resolveItem(oh, 'ciment-cpj-45', 'Ciment CPJ 45', 'T');
  const acierId = await resolveItem(oh, 'acier-ha', 'Acier HA Fe E500', 'T');
  const fournisseur = await resolveFournisseur(oh);

  const sansChantier = await api(oh, 'POST', '/api/v1/demandes-achat', {
    dateBesoin: '2026-09-10',
    demandeurId: 'qa-emp-conducteur',
    lignes: [{ articleId: cimentId, articleCode: 'ciment-cpj-45', quantite: 40, uomCode: 't', prixEstimeHt: 1083.75 }],
  });
  if (sansChantier.status !== 400) {
    throw new Error(`DA sans chantier attendu 400, obtenu ${sansChantier.status} ${sansChantier.text?.slice(0, 120)}`);
  }
  console.log('PASS DA sans chantierId → 400');

  const da01 = await api(oh, 'POST', '/api/v1/demandes-achat', {
    chantierId,
    noeudId: n21.id,
    dateBesoin: '2026-09-10',
    demandeurId: 'qa-emp-conducteur',
    motif: 'DA-01 ciment nœud 2.1',
    lignes: [{
      articleId: cimentId, articleCode: 'ciment-cpj-45', articleName: 'Ciment CPJ 45',
      quantite: 40, uomCode: 't', prixEstimeHt: 1083.75,
    }],
  });
  if (da01.status !== 201) throw new Error(`DA-01 ${da01.status} ${da01.text?.slice(0, 250)}`);
  if (da01.body.noeudId !== n21.id) throw new Error('DA-01 sans nœud 2.1');
  let da = await api(oh, 'POST', `/api/v1/demandes-achat/${da01.body.id}/submit`, {});
  if (!da.ok) throw new Error(`DA submit ${da.status} ${da.text}`);
  da = await api(oh, 'POST', `/api/v1/demandes-achat/${da.body.id}/approve`, {});
  if (!da.ok) throw new Error(`DA approve ${da.status} ${da.text}`);

  const bcCiment = await envoyerBc(oh, da.body, fournisseur, '2026-09-12');
  const rec01 = await api(oh, 'POST', `/api/v1/bons-commande-achat/${bcCiment.id}/receptions`, {
    blNumero: '44012',
    dateReception: '2026-09-12',
    lignes: [{
      bonCommandeLigneId: bcCiment.lignes[0].id,
      articleId: cimentId,
      quantiteRecue: 40,
    }],
  });
  if (rec01.status !== 201) throw new Error(`BL-01 ${rec01.status} ${rec01.text?.slice(0, 300)}`);
  const bcCimentApres = await api(oh, 'GET', `/api/v1/bons-commande-achat/${bcCiment.id}`);
  const rCiment = reste(bcCimentApres.body.lignes[0]);
  if (rCiment !== 0) throw new Error(`alqods-da-bl-direct-2-1 reste ${rCiment}, attendu 0`);
  const reels = await api(oh, 'GET', `/api/v1/chantiers/${chantierId}/couts-reels`);
  const reel21 = (reels.body ?? []).find((c) => c.posteId === n21.id);
  if (!reel21) throw new Error('réel non imputé sur nœud 2.1');
  const arbreApres = await api(oh, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  const n21b = findNoeud(arbreApres.body.lots, '2.1');
  if (!(Number(n21b?.totaux?.engageHt) > 0)) throw new Error('engagé nœud 2.1 absent');
  if (!(Number(n21b?.totaux?.debourseReelHt) > 0)) throw new Error('réel nœud 2.1 absent');
  console.log('PASS alqods-da-bl-direct-2-1 : 40 t / reste 0 / réel+engagé sur 2.1');

  const da02 = await api(oh, 'POST', '/api/v1/demandes-achat', {
    chantierId,
    noeudId: n22.id,
    dateBesoin: '2026-10-01',
    demandeurId: 'qa-emp-conducteur',
    motif: 'DA-02 acier nœud 2.2',
    lignes: [{
      articleId: acierId, articleCode: 'acier-ha', articleName: 'Acier HA Fe E500',
      quantite: 25, uomCode: 't', prixEstimeHt: 9800,
    }],
  });
  if (da02.status !== 201) throw new Error(`DA-02 ${da02.status} ${da02.text?.slice(0, 250)}`);
  let daAcier = await api(oh, 'POST', `/api/v1/demandes-achat/${da02.body.id}/submit`, {});
  daAcier = await api(oh, 'POST', `/api/v1/demandes-achat/${daAcier.body.id}/approve`, {});
  const bcAcier = await envoyerBc(oh, daAcier.body, fournisseur, '2026-10-05');
  const rec02 = await api(oh, 'POST', `/api/v1/bons-commande-achat/${bcAcier.id}/receptions`, {
    blNumero: '55101',
    dateReception: '2026-10-05',
    lignes: [{
      bonCommandeLigneId: bcAcier.lignes[0].id,
      articleId: acierId,
      quantiteRecue: 12,
    }],
  });
  if (rec02.status !== 201) throw new Error(`BL-02 ${rec02.status} ${rec02.text?.slice(0, 300)}`);
  const bcAcierApres = await api(oh, 'GET', `/api/v1/bons-commande-achat/${bcAcier.id}`);
  const rAcier = reste(bcAcierApres.body.lignes[0]);
  if (rAcier !== 13) throw new Error(`alqods-bl-partiel-acier reste ${rAcier}, attendu 13`);
  if (Number(bcAcierApres.body.lignes[0].quantiteLivree) === 25) {
    throw new Error('BL partiel a avancé 25 t d’acier');
  }
  console.log('PASS alqods-bl-partiel-acier : 12 / 25, reste 13');

  const rec03 = await api(oh, 'POST', `/api/v1/bons-commande-achat/${bcAcier.id}/receptions`, {
    blNumero: '55102',
    dateReception: '2026-10-06',
    lignes: [{
      bonCommandeLigneId: bcAcier.lignes[0].id,
      articleId: acierId,
      quantiteRecue: 30,
    }],
  });
  if (rec03.status !== 409) {
    throw new Error(`écart 30 t attendu 409, obtenu ${rec03.status} ${rec03.text?.slice(0, 200)}`);
  }
  if (!`${rec03.text}`.includes('achats.reception.ecart_qte')) {
    throw new Error(`écart sans code stable : ${rec03.text?.slice(0, 200)}`);
  }
  const bcAcierFinal = await api(oh, 'GET', `/api/v1/bons-commande-achat/${bcAcier.id}`);
  if (reste(bcAcierFinal.body.lignes[0]) !== 13) {
    throw new Error('écrêtage silencieux : le reste a bougé après le refus 30 t');
  }
  console.log('PASS BL-03 écart 30 t → 409, reste inchangé 13');

  const front = await fetch(FRONT_BASE, { headers: { Accept: 'text/html' } }).catch(() => null);
  console.log(front?.ok
    ? `front ${FRONT_BASE} joignable (Browser MCP absent — pas de clic UI)`
    : `front ${FRONT_BASE} injoignable`);
  console.log(`SEKTOR-222 DA→BC→BL : PASS · chantierId=${chantierId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
