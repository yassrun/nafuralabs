/**
 * Preuve partielle SEKTOR-237 — octobre attachement + situation n°2 cumul (AC-M2-1..M2-7).
 * Run: node sektor/e2e/scripts/verify-alqods-situation-mois2-237.mjs
 *
 * Enchaîne graphe mois-1 complet (helpers 232/233) puis octobre → situation n°2.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURES_M1 = join(ROOT, 'e2e/fixtures/al-qods/situation-mois1/expected');
const FIXTURES_M2 = join(ROOT, 'e2e/fixtures/al-qods/situation-mois2/expected');
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

const expectedAttachementSept = JSON.parse(
  readFileSync(join(FIXTURES_M1, 'attachement-sept.json'), 'utf8'),
);
const expectedSituation1 = JSON.parse(
  readFileSync(join(FIXTURES_M1, 'situation-1.json'), 'utf8'),
);
const expectedAttachementOct = JSON.parse(
  readFileSync(join(FIXTURES_M2, 'attachement-oct.json'), 'utf8'),
);
const expectedSituation2 = JSON.parse(
  readFileSync(join(FIXTURES_M2, 'situation-2.json'), 'utf8'),
);

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

async function creerAlQods(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client MOA');

  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods mois2 237 ${suffix}`,
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
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  const dd = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  const total = dd.body?.totalHt ?? dd.body?.totalHT;
  const gain = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: new Date().toISOString().slice(0, 10), devisId, montantAttribue: total,
  });
  if (!gain.ok) throw new Error(`gagne ${gain.status} ${gain.text?.slice(0, 200)}`);

  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {});
  if (!conv.ok) throw new Error(`convertir ${conv.status} ${conv.text?.slice(0, 200)}`);
  const chantierId = conv.body?.chantierId ?? conv.body?.id;
  if (conv.body?.marcheGenereId) throw new Error('conversion a créé un marché');

  const today = new Date().toISOString().slice(0, 10);
  for (const [employeId, roleCode] of [
    ['qa-emp-conducteur', 'BTP_CONDUCTEUR_TRAVAUX'],
    ['qa-emp-chef-chantier', 'BTP_CHEF_CHANTIER'],
  ]) {
    const aff = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/affectations`, {
      employeId, roleCode, dateDebut: today,
    });
    if (aff.status !== 201 && aff.status !== 200) {
      throw new Error(`affectation ${roleCode} ${aff.status} ${aff.text}`);
    }
  }
  await api(h, 'PUT', `/api/v1/chantiers/${chantierId}`, {
    dateDebut: '2026-09-01',
    dateFinPrevue: '2027-04-01',
    tauxRg: expectedSituation1.tauxRg,
    tauxAvance: expectedSituation1.tauxAvance,
  });
  const os = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/demarrer-os`, {
    osReference: `OS-237-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01',
  });
  if (!os.ok) throw new Error(`OS ${os.status} ${os.text}`);

  return { chantierId };
}

async function signerMoe(h, attachementId, tag) {
  await api(h, 'POST', `/api/v1/attachements/${attachementId}/soumettre-signature`, {});
  const lien = await api(h, 'POST', `/api/v1/attachements/${attachementId}/lien-signature`, {});
  if (!lien.ok || !lien.body?.token) throw new Error(`lien-signature ${lien.status} ${lien.text?.slice(0, 200)}`);
  const depot = await api(
    h,
    'POST',
    `/api/v1/sign/${lien.body.token}`,
    { signatureBase64: `c2lnbmF0dXJlLXFhLTIzNy0${tag}` },
    { anonymous: true },
  );
  if (!depot.ok) throw new Error(`signature MOE ${depot.status} ${depot.text?.slice(0, 200)}`);
  return depot.body;
}

async function monteMois1Complet(h, chantierId) {
  const arbre = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  if (!arbre.ok) throw new Error(`budget-arbre ${arbre.status}`);
  const n21 = findNoeud(arbre.body.lots, '2.1');
  const n23 = findNoeud(arbre.body.lots, '2.3');
  const n3 = findNoeud(arbre.body.lots, '3');
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

  const attSept = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/attachements`, {
    dateDebut: expectedAttachementSept.periode.debut,
    dateFin: expectedAttachementSept.periode.fin,
    effectifPresent: 8,
  });
  if (!attSept.ok) throw new Error(`attachement sept ${attSept.status} ${attSept.text?.slice(0, 300)}`);

  const signeSept = await signerMoe(h, attSept.body.id, 'sept');
  assertPass('alqods-m2-mois1/attachement-sept-signe', signeSept?.status === 'SIGNE_MOE', signeSept?.status);

  const sit1 = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/situations/generate?numero=1`);
  if (!sit1.ok) throw new Error(`situation n1 ${sit1.status} ${sit1.text?.slice(0, 400)}`);
  assertPass(
    'alqods-m2-mois1/situation-n1-cumul',
    num(sit1.body?.cumulCourantHt) === expectedSituation1.cumulCourantHt,
    `${sit1.body?.cumulCourantHt}`,
  );

  return { interneId: interne.body.id, n21, n23, n3, situation1: sit1.body };
}

function assertAttachementGold(attachement, expected, interneId, n3, labelPrefix) {
  assertPass(
    `${labelPrefix}/periode`,
    attachement.dateDebut === expected.periode.debut
      && attachement.dateFin === expected.periode.fin,
    `${attachement.dateDebut} → ${attachement.dateFin}`,
  );
  const byCode = Object.fromEntries((attachement.lignes ?? []).map((l) => [l.code, l]));
  for (const exp of expected.lignes) {
    const row = byCode[exp.noeud];
    assertPass(
      `${labelPrefix}/ligne-${exp.noeud}`,
      row && Number(row.quantitePeriode) === exp.qte && row.unite === exp.unite,
      row ? `qte=${row.quantitePeriode}` : 'absente',
    );
  }
  const ids = (attachement.lignes ?? []).map((l) => l.noeudId);
  assertPass(`${labelPrefix}/interne-absent`, !ids.includes(interneId), JSON.stringify(ids));
  if (n3?.id) {
    assertPass(`${labelPrefix}/etancheite-absente`, !ids.includes(n3.id), JSON.stringify(ids));
  }
}

function assertSituation2Gold(situation, interneId, n3, situation1) {
  assertPass(
    'alqods-m2-situation-n2/periode',
    situation.datePeriodeDebut === expectedSituation2.periode.debut
      && situation.datePeriodeFin === expectedSituation2.periode.fin,
    `${situation.datePeriodeDebut} → ${situation.datePeriodeFin}`,
  );
  assertPass(
    'alqods-m2-situation-n2/cumul-precedent',
    num(situation.cumulPrecedentHt) === expectedSituation2.cumulPrecedentHt
      && num(situation.cumulPrecedentHt) === num(situation1.cumulCourantHt),
    `cumulPrecedentHt=${situation.cumulPrecedentHt} (n1=${situation1.cumulCourantHt})`,
  );

  const byCode = Object.fromEntries((situation.lignes ?? []).map((l) => [l.code, l]));
  for (const exp of expectedSituation2.lignes) {
    const row = byCode[exp.noeud];
    assertPass(
      `alqods-m2-situation-n2/ligne-${exp.noeud}`,
      row
        && num(row.quantitePeriode) === exp.qte
        && row.unite === exp.unite
        && num(row.prixUnitaire) === exp.puVendu
        && num(row.montantHt) === exp.montantHt
        && num(row.quantitePrecedente) === exp.quantitePrecedente
        && num(row.quantiteCumulee) === exp.quantiteCumulee,
      row
        ? `qte=${row.quantitePeriode} prec=${row.quantitePrecedente} cum=${row.quantiteCumulee} ht=${row.montantHt}`
        : 'absente',
    );
  }

  const ids = (situation.lignes ?? []).map((l) => l.noeudId);
  assertPass('alqods-m2-situation-n2/interne-absent', !ids.includes(interneId), JSON.stringify(ids));
  if (n3?.id) {
    assertPass('alqods-m2-situation-n2/etancheite-absente', !ids.includes(n3.id), JSON.stringify(ids));
  }
  assertPass(
    'alqods-m2-situation-n2/2.3-absent',
    !byCode['2.3'],
    Object.keys(byCode).join(','),
  );

  assertPass(
    'alqods-m2-situation-n2/travaux-periode',
    num(situation.travauxPeriodeHt) === expectedSituation2.travauxPeriodeHt,
    `${situation.travauxPeriodeHt}`,
  );
  assertPass(
    'alqods-m2-situation-n2/cumul-courant',
    num(situation.cumulCourantHt) === expectedSituation2.cumulCourantHt
      && num(situation.cumulCourantHt) === num(situation.cumulPrecedentHt) + num(situation.travauxPeriodeHt),
    `${situation.cumulCourantHt}`,
  );
  assertPass(
    'alqods-m2-situation-n2/rg',
    num(situation.retenueGarantiePercent) === expectedSituation2.tauxRg
      && num(situation.retenueGarantieMontant) === expectedSituation2.retenueGarantieMontant,
    `RG ${situation.retenueGarantiePercent}% = ${situation.retenueGarantieMontant}`,
  );
  assertPass(
    'alqods-m2-situation-n2/avance',
    num(situation.retenueAvancePercent) === expectedSituation2.tauxAvance
      && num(situation.retenueAvanceMontant) === expectedSituation2.retenueAvanceMontant,
    `avance ${situation.retenueAvancePercent}% = ${situation.retenueAvanceMontant}`,
  );
  assertPass(
    'alqods-m2-situation-n2/net-ht',
    num(situation.netAPayerHt) === expectedSituation2.netAPayerHt,
    `${situation.netAPayerHt}`,
  );
  assertPass(
    'alqods-m2-situation-n2/net-ttc',
    num(situation.netAPayerTtc) === expectedSituation2.netAPayerTtc,
    `${situation.netAPayerTtc}`,
  );
}

async function main() {
  console.log('SEKTOR-237 — octobre attachement + situation n°2 cumul');
  const owner = await session();
  if (!owner) {
    console.log('SKIP Mode B indisponible (cursor-session)');
    process.exit(0);
  }

  const suffix = Date.now().toString(36);
  const { chantierId } = await creerAlQods(owner, suffix);
  const { interneId, n21, n23, n3, situation1 } = await monteMois1Complet(owner, chantierId);

  // AC-M2-7 — refus situation n°2 sans attachement octobre signé
  const refuseSansOct = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/situations/generate?numero=2`);
  assertPass(
    'alqods-m2-situation-sans-octobre-refusee',
    !refuseSansOct.ok && `${refuseSansOct.text}`.includes('aucun_attachement_signe'),
    `${refuseSansOct.status}`,
  );

  // AC-M2-1 — avancement octobre : 2.1 = 10 m³ ; interne 1 fft (hors attachement)
  await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-10-15',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n21.id, quantiteRealisee: 10 }],
  });
  await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-10-20',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ lotId: interneId, quantiteRealisee: 1 }],
  });

  const attOct = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/attachements`, {
    dateDebut: expectedAttachementOct.periode.debut,
    dateFin: expectedAttachementOct.periode.fin,
    effectifPresent: 6,
  });
  if (!attOct.ok) throw new Error(`attachement oct ${attOct.status} ${attOct.text?.slice(0, 300)}`);
  assertAttachementGold(attOct.body, expectedAttachementOct, interneId, n3, 'alqods-m2-attachement-oct');

  // AC-M2-1 — septembre non reproposé (2.3 absent, seulement 10 m³ octobre sur 2.1)
  assertPass(
    'alqods-m2-attachement-oct/sept-non-repropose',
    !(attOct.body?.lignes ?? []).some((l) => l.code === '2.3'),
    JSON.stringify(attOct.body?.lignes?.map((l) => ({ code: l.code, qte: l.quantitePeriode }))),
  );

  // AC-M2-2 — chevauchement septembre refusé
  const chevauch = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/attachements`, {
    dateDebut: '2026-10-15',
    dateFin: '2026-10-31',
    effectifPresent: 4,
  });
  assertPass(
    'alqods-m2-attachement-oct/chevauchement-refuse',
    !chevauch.ok && `${chevauch.text}`.includes('periode_chevauchante'),
    `${chevauch.status}`,
  );

  const signeOct = await signerMoe(owner, attOct.body.id, 'oct');
  assertPass('alqods-m2-attachement-oct/signe', signeOct?.status === 'SIGNE_MOE', signeOct?.status);

  // AC-M2-3, AC-M2-4, AC-M2-6 — situation n°2 cumul
  const sit2 = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/situations/generate?numero=2`);
  if (!sit2.ok) throw new Error(`generate situation n2 ${sit2.status} ${sit2.text?.slice(0, 400)}`);
  assertPass('alqods-m2-situation-n2/generee', sit2.ok, sit2.body?.numero);
  assertSituation2Gold(sit2.body, interneId, n3, situation1);

  // AC-M2-3 — attachement octobre consommé
  const refuse3 = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/situations/generate?numero=3`);
  assertPass(
    'alqods-m2-situation-n2/attachement-oct-consomme',
    !refuse3.ok && `${refuse3.text}`.includes('aucun_attachement_signe'),
    `${refuse3.status}`,
  );

  console.log(`\nSEKTOR-237 : PASS · chantier=${chantierId} · situation=${sit2.body.id}`);
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
