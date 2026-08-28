/**
 * Preuve SEKTOR-240 / SEKTOR-241 — cascade pénalités + RAS sur Al Qods (AC-8..12).
 * Run: node sektor/e2e/scripts/verify-situation-retenues-al-qods-241.mjs
 *
 * Contrat : sektor/raster-src/lots/chantiers/situation-et-retenues/CONTRAT.md
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURES = join(ROOT, 'e2e/fixtures/al-qods/situation-mois1/expected');
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

const expectedAttachement = JSON.parse(
  readFileSync(join(FIXTURES, 'attachement-sept.json'), 'utf8'),
);
const gold = JSON.parse(readFileSync(join(FIXTURES, 'situation-1.json'), 'utf8'));

const PENALITES = 1000;
const TAUX_RAS = 5;
const EXPECT_PENALITES = {
  retenueGarantieMontant: 5231.49,
  retenueAvanceMontant: 7473.56,
  netAPayerHt: 62030.55,
  netAPayerTtc: 74436.66,
  rasMontant: 3721.83,
};

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

async function session() {
  const url = `${API_BASE}/api/public/dev/cursor-session`;
  const s = await (await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } })).json();
  if (!s?.accessToken || !s?.tenantId) return null;
  return {
    Authorization: `Bearer ${s.accessToken}`,
    'X-Tenant-Id': s.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function api(h, method, path, body, { anonymous = false } = {}) {
  const opts = { method, headers: anonymous ? { 'Content-Type': 'application/json', Accept: 'application/json' } : h };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return json(await fetch(`${API_BASE}${path}`, opts));
}

function findNoeud(nodes, code, type = 'POSTE') {
  for (const n of nodes ?? []) {
    if (n.code === code && n.type === type) return n;
    const nested = findNoeud(n.enfants, code, type);
    if (nested) return nested;
  }
  return null;
}

function assertPass(label, cond, detail) {
  if (!cond) throw new Error(`FAIL ${label}: ${detail}`);
  console.log(`PASS ${label}${detail ? ` — ${detail}` : ''}`);
}

function num(v) {
  return v == null ? null : Number(v);
}

function approx(a, b, eps = 0.02) {
  return Math.abs(num(a) - num(b)) <= eps;
}

async function creerAlQods(h, suffix, { tauxRas = null } = {}) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client MOA');

  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Retenues Al Qods 241 ${suffix}`,
    chargeEtudeUserId: charge,
    clientNom: `Commune Al Qods ${suffix}`,
  });
  if (d.status !== 201) throw new Error(`dossier ${d.status} ${d.text}`);
  const dossierId = d.body.id;

  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const dpgfId = b.body?.dpgfId;

  const lot2 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT', code: '2', libelle: 'Gros œuvre',
  });
  for (const [code, libelle, qte, unite, pu] of [
    ['2.1', 'Béton B25 fondations', 180, 'm³', 1200],
    ['2.2', 'Acier HA', 25, 't', 9800],
    ['2.3', 'Coffrage', 850, 'm²', 95],
  ]) {
    const p = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      type: 'ARTICLE', parentId: lot2.body.id, code, libelle, quantite: qte, unite,
      origineCout: 'ESTIME', coutUnitaire: pu, fraisGenerauxPercent: 0, margePercent: 15,
    });
    if (p.status !== 201) throw new Error(`poste ${code} ${p.status} ${p.text}`);
    const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: p.body.id });
    await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
      type: code === '2.3' ? 'SOUS_TRAITANCE' : 'MATIERE',
      referenceType: 'LIBRE', libelle, rendement: 1, unite, prixUnitaire: pu, sourcePrix: 'MANUEL',
    });
  }

  const lot3 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT', code: '3', libelle: 'Étanchéité',
  });
  const p3 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot3.body.id, code: '3', libelle: 'Étanchéité toiture',
    quantite: 420, unite: 'm²', origineCout: 'ESTIME', coutUnitaire: 180, fraisGenerauxPercent: 0, margePercent: 15,
  });
  if (p3.status !== 201) throw new Error(`poste 3 ${p3.status} ${p3.text}`);

  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  let v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (v.ok && v.body?.status === 'EN_VALIDATION') {
    v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  }
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
  const chantierId = conv.body?.chantierId ?? conv.body?.id;

  const today = new Date().toISOString().slice(0, 10);
  for (const [employeId, roleCode] of [
    ['qa-emp-conducteur', 'BTP_CONDUCTEUR_TRAVAUX'],
    ['qa-emp-chef-chantier', 'BTP_CHEF_CHANTIER'],
  ]) {
    await api(h, 'POST', `/api/v1/chantiers/${chantierId}/affectations`, {
      employeId, roleCode, dateDebut: today,
    });
  }

  const patch = {
    dateDebut: '2026-09-01',
    dateFinPrevue: '2027-04-01',
    tauxRg: gold.tauxRg,
    tauxAvance: gold.tauxAvance,
  };
  if (tauxRas != null) patch.tauxRas = tauxRas;
  await api(h, 'PUT', `/api/v1/chantiers/${chantierId}`, patch);

  const os = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/demarrer-os`, {
    osReference: `OS-241-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01',
  });
  if (!os.ok) throw new Error(`OS ${os.status} ${os.text}`);

  return { chantierId };
}

async function signerMoe(h, attachementId) {
  await api(h, 'POST', `/api/v1/attachements/${attachementId}/soumettre-signature`, {});
  const lien = await api(h, 'POST', `/api/v1/attachements/${attachementId}/lien-signature`, {});
  if (!lien.ok || !lien.body?.token) throw new Error(`lien-signature ${lien.status}`);
  const depot = await api(
    h,
    'POST',
    `/api/v1/sign/${lien.body.token}`,
    { signatureBase64: 'c2lnbmF0dXJlLXFhLTI0MQ==' },
    { anonymous: true },
  );
  if (!depot.ok) throw new Error(`signature MOE ${depot.status}`);
  return depot.body;
}

async function monteAttachementSigne(h, chantierId) {
  const arbre = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  const n21 = findNoeud(arbre.body.lots, '2.1');
  const n23 = findNoeud(arbre.body.lots, '2.3');
  if (!n21 || !n23) throw new Error('postes 2.1 / 2.3 absents');

  const interne = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/lots`, {
    code: 'INT',
    designation: 'Installation de chantier',
    nature: 'INTERNE',
    ordre: 99,
    quantite: 1,
    unite: 'fft',
  });
  if (interne.status !== 201) throw new Error(`lot interne ${interne.status}`);

  await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-05',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ lotId: interne.body.id, quantiteRealisee: 1 }],
  });
  await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-12',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n21.id, quantiteRealisee: 40 }],
  });
  await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-18',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n23.id, quantiteRealisee: 120 }],
  });

  const att = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/attachements`, {
    dateDebut: expectedAttachement.periode.debut,
    dateFin: expectedAttachement.periode.fin,
    effectifPresent: 8,
  });
  if (!att.ok) throw new Error(`attachement ${att.status}`);

  await signerMoe(h, att.body.id);
  return { interneId: interne.body.id };
}

async function generate(h, chantierId, { penalitesRetardHt = 0 } = {}) {
  const q = penalitesRetardHt > 0
    ? `?numero=1&penalitesRetardHt=${penalitesRetardHt}`
    : '?numero=1';
  const gen = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/situations/generate${q}`);
  if (!gen.ok) throw new Error(`generate ${gen.status} ${gen.text?.slice(0, 400)}`);
  return gen.body;
}

function assertGoldBaseline(s, label) {
  assertPass(`${label}/travaux`, approx(s.travauxPeriodeHt, gold.travauxPeriodeHt), `${s.travauxPeriodeHt}`);
  assertPass(`${label}/rg`, approx(s.retenueGarantieMontant, gold.retenueGarantieMontant), `${s.retenueGarantieMontant}`);
  assertPass(`${label}/avance`, approx(s.retenueAvanceMontant, gold.retenueAvanceMontant), `${s.retenueAvanceMontant}`);
  assertPass(`${label}/net-ht`, approx(s.netAPayerHt, gold.netAPayerHt), `${s.netAPayerHt}`);
  assertPass(`${label}/net-ttc`, approx(s.netAPayerTtc, gold.netAPayerTtc), `${s.netAPayerTtc}`);
  assertPass(`${label}/penalites-zero`, num(s.penalitesRetardHt) === 0, `${s.penalitesRetardHt}`);
  assertPass(`${label}/ras-zero`, num(s.rasMontant) === 0, `${s.rasMontant}`);
}

function assertPenalitesCascade(s, label) {
  assertPass(`${label}/penalites-saisies`, num(s.penalitesRetardHt) === PENALITES, `${s.penalitesRetardHt}`);
  assertPass(`${label}/rg-assiette-reduite`, approx(s.retenueGarantieMontant, EXPECT_PENALITES.retenueGarantieMontant), `${s.retenueGarantieMontant}`);
  assertPass(`${label}/avance-assiette-reduite`, approx(s.retenueAvanceMontant, EXPECT_PENALITES.retenueAvanceMontant), `${s.retenueAvanceMontant}`);
  assertPass(`${label}/net-ht`, approx(s.netAPayerHt, EXPECT_PENALITES.netAPayerHt), `${s.netAPayerHt}`);
  assertPass(`${label}/net-ttc`, approx(s.netAPayerTtc, EXPECT_PENALITES.netAPayerTtc), `${s.netAPayerTtc}`);
}

async function main() {
  console.log('SEKTOR-240/241 — cascade pénalités et RAS (Al Qods)');
  const owner = await session();
  if (!owner) {
    console.log('SKIP Mode B indisponible (cursor-session)');
    process.exit(0);
  }

  const suffix = Date.now().toString(36);

  // AC-12 — baseline sans tauxRas ni pénalités
  const base = await creerAlQods(owner, `${suffix}-ac12`);
  await monteAttachementSigne(owner, base.chantierId);
  const sBase = await generate(owner, base.chantierId);
  assertGoldBaseline(sBase, 'retenues-ac12-baseline');

  // AC-8..10 + AC-9 — pénalités + tauxRas chantier
  const penal = await creerAlQods(owner, `${suffix}-penal`, { tauxRas: TAUX_RAS });
  await monteAttachementSigne(owner, penal.chantierId);
  const sPenal = await generate(owner, penal.chantierId, { penalitesRetardHt: PENALITES });
  assertPenalitesCascade(sPenal, 'retenues-penalites-cascade');
  assertPass(
    'retenues-ras-derivee-chantier',
    num(sPenal.rasTaux) === TAUX_RAS && approx(sPenal.rasMontant, EXPECT_PENALITES.rasMontant),
    `taux=${sPenal.rasTaux} montant=${sPenal.rasMontant}`,
  );

  // AC-11 — net TTC identique avec/sans tauxRas (même pénalités)
  const sansRas = await creerAlQods(owner, `${suffix}-sans-ras`);
  await monteAttachementSigne(owner, sansRas.chantierId);
  const sSansRas = await generate(owner, sansRas.chantierId, { penalitesRetardHt: PENALITES });
  assertPass(
    'retenues-ras-n-affecte-pas-net-ttc',
    approx(sSansRas.netAPayerTtc, sPenal.netAPayerTtc) && num(sSansRas.rasMontant) === 0,
    `sans RAS ttc=${sSansRas.netAPayerTtc} avec RAS ttc=${sPenal.netAPayerTtc}`,
  );
  assertPenalitesCascade(sSansRas, 'retenues-penalites-sans-ras');

  console.log(`\nSEKTOR-241 : PASS · baseline=${base.chantierId} · penal=${penal.chantierId}`);
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
