/**
 * Preuve SEKTOR-233 — situation n°1 depuis attachement SIGNE_MOE (AC-M7..M10).
 * Run: node sektor/e2e/scripts/verify-alqods-situation-mois1-233.mjs
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
const expectedSituation = JSON.parse(
  readFileSync(join(FIXTURES, 'situation-1.json'), 'utf8'),
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
    objet: `Al Qods mois1 233 ${suffix}`,
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
    tauxRg: expectedSituation.tauxRg,
    tauxAvance: expectedSituation.tauxAvance,
  });
  const os = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/demarrer-os`, {
    osReference: `OS-233-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01',
  });
  if (!os.ok) throw new Error(`OS ${os.status} ${os.text}`);

  return { chantierId, devisId };
}

async function signerMoe(h, attachementId) {
  await api(h, 'POST', `/api/v1/attachements/${attachementId}/soumettre-signature`, {});
  const lien = await api(h, 'POST', `/api/v1/attachements/${attachementId}/lien-signature`, {});
  if (!lien.ok || !lien.body?.token) throw new Error(`lien-signature ${lien.status} ${lien.text?.slice(0, 200)}`);
  const depot = await api(
    h,
    'POST',
    `/api/v1/sign/${lien.body.token}`,
    { signatureBase64: 'c2lnbmF0dXJlLXFhLTIzMw==' },
    { anonymous: true },
  );
  if (!depot.ok) throw new Error(`signature MOE ${depot.status} ${depot.text?.slice(0, 200)}`);
  return depot.body;
}

async function monteAttachementSigne(h, chantierId) {
  const arbre = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  if (!arbre.ok) throw new Error(`budget-arbre ${arbre.status}`);
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
  if (!att.ok) throw new Error(`attachement ${att.status} ${att.text?.slice(0, 300)}`);

  const signe = await signerMoe(h, att.body.id);
  assertPass('alqods-m1-attachement-signe', signe?.status === 'SIGNE_MOE', signe?.status);
  return { attachementId: att.body.id, attachement: signe, interneId: interne.body.id, n3: findNoeud(arbre.body.lots, '3') };
}

function assertSituationGold(situation, interneId, n3) {
  assertPass(
    'alqods-m1-situation-depuis-attachement/periode',
    situation.datePeriodeDebut === expectedSituation.periode.debut
      && situation.datePeriodeFin === expectedSituation.periode.fin,
    `${situation.datePeriodeDebut} → ${situation.datePeriodeFin}`,
  );
  assertPass(
    'alqods-m1-situation-depuis-attachement/cumul-precedent-zero',
    num(situation.cumulPrecedentHt) === expectedSituation.cumulPrecedentHt,
    `cumulPrecedentHt=${situation.cumulPrecedentHt}`,
  );

  const byCode = Object.fromEntries((situation.lignes ?? []).map((l) => [l.code, l]));
  for (const exp of expectedSituation.lignes) {
    const row = byCode[exp.noeud];
    assertPass(
      `alqods-m1-situation-depuis-attachement/ligne-${exp.noeud}`,
      row
        && num(row.quantitePeriode) === exp.qte
        && row.unite === exp.unite
        && num(row.prixUnitaire) === exp.puVendu
        && num(row.montantHt) === exp.montantHt
        && num(row.quantitePrecedente) === 0
        && num(row.quantiteCumulee) === exp.qte,
      row ? `qte=${row.quantitePeriode} pu=${row.prixUnitaire} ht=${row.montantHt}` : 'absente',
    );
  }

  const ids = (situation.lignes ?? []).map((l) => l.noeudId);
  assertPass('alqods-m1-interne-absent-situation', !ids.includes(interneId), JSON.stringify(ids));
  if (n3?.id) {
    assertPass('alqods-m1-etancheite-absente-situation', !ids.includes(n3.id), JSON.stringify(ids));
  }

  assertPass(
    'alqods-m1-situation-depuis-attachement/travaux-periode',
    num(situation.travauxPeriodeHt) === expectedSituation.travauxPeriodeHt,
    `${situation.travauxPeriodeHt}`,
  );
  assertPass(
    'alqods-m1-situation-depuis-attachement/rg',
    num(situation.retenueGarantiePercent) === expectedSituation.tauxRg
      && num(situation.retenueGarantieMontant) === expectedSituation.retenueGarantieMontant,
    `RG ${situation.retenueGarantiePercent}% = ${situation.retenueGarantieMontant}`,
  );
  assertPass(
    'alqods-m1-situation-depuis-attachement/avance',
    num(situation.retenueAvancePercent) === expectedSituation.tauxAvance
      && num(situation.retenueAvanceMontant) === expectedSituation.retenueAvanceMontant,
    `avance ${situation.retenueAvancePercent}% = ${situation.retenueAvanceMontant}`,
  );
  assertPass(
    'alqods-m1-situation-depuis-attachement/net-ht',
    num(situation.netAPayerHt) === expectedSituation.netAPayerHt,
    `${situation.netAPayerHt}`,
  );
  assertPass(
    'alqods-m1-situation-depuis-attachement/net-ttc',
    num(situation.netAPayerTtc) === expectedSituation.netAPayerTtc,
    `${situation.netAPayerTtc}`,
  );
  assertPass(
    'alqods-m1-situation-depuis-attachement/cumul-courant',
    num(situation.cumulCourantHt) === expectedSituation.cumulCourantHt,
    `${situation.cumulCourantHt}`,
  );
}

async function main() {
  console.log('SEKTOR-233 — situation n°1 depuis attachement signé');
  const owner = await session();
  if (!owner) {
    console.log('SKIP Mode B indisponible (cursor-session)');
    process.exit(0);
  }

  const suffix = Date.now().toString(36);
  const { chantierId, devisId } = await creerAlQods(owner, suffix);

  // AC-M8 — sans marché notifié, référence devis active
  const chantier = await api(owner, 'GET', `/api/v1/chantiers/${chantierId}`);
  const marches = await api(owner, 'GET', `/api/v1/marches/contrats?chantierId=${chantierId}`);
  const contrats = Array.isArray(marches.body) ? marches.body : marches.body?.content ?? [];
  assertPass(
    'alqods-m1-situation-depuis-attachement/sans-marche',
    contrats.length === 0 && chantier.body?.devisId != null,
    `devisId=${chantier.body?.devisId} contrats=${contrats.length}`,
  );
  assertPass(
    'alqods-m1-situation-depuis-attachement/devis-ref',
    chantier.body?.devisId === devisId || chantier.body?.marcheReference != null,
    `devis=${devisId}`,
  );

  // AC-M9 — refus sans attachement signé
  const chantierSansAtt = await creerAlQods(owner, `${suffix}-refus`);
  const refuse = await api(owner, 'POST', `/api/v1/chantiers/${chantierSansAtt.chantierId}/situations/generate?numero=1`);
  assertPass(
    'alqods-m1-situation-sans-signature-refusee',
    !refuse.ok && `${refuse.text}`.includes('aucun_attachement_signe'),
    `${refuse.status}`,
  );

  const { interneId, n3 } = await monteAttachementSigne(owner, chantierId);

  const gen = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/situations/generate?numero=1`);
  if (!gen.ok) throw new Error(`generate situation ${gen.status} ${gen.text?.slice(0, 400)}`);
  assertPass('alqods-m1-situation-depuis-attachement/generee', gen.ok, gen.body?.numero);
  assertSituationGold(gen.body, interneId, n3);

  // AC-4 — attachement consommé : plus d'attachement signé disponible pour une 2e situation
  const refuse2 = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/situations/generate?numero=2`);
  assertPass(
    'alqods-m1-situation-depuis-attachement/attachement-consomme',
    !refuse2.ok && `${refuse2.text}`.includes('aucun_attachement_signe'),
    `${refuse2.status}`,
  );

  console.log(`\nSEKTOR-233 : PASS · chantier=${chantierId} · situation=${gen.body.id}`);
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
