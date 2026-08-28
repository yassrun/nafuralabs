/**
 * Preuve partielle SEKTOR-232 — attachement septembre lu depuis avancement (AC-M1..M6).
 * Run: node sektor/e2e/scripts/verify-alqods-situation-mois1-232.mjs
 *
 * Suite mois 1 Al Qods : avancement terrain → attachement auto → signature MOE.
 * Ne couvre pas la situation (SEKTOR-233) ni le cockpit (SEKTOR-234).
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
const expectedAbsents = JSON.parse(readFileSync(join(FIXTURES, 'absents.json'), 'utf8'));

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

function findLot(nodes, code) {
  for (const n of nodes ?? []) {
    if (n.code === code && (n.type === 'LOT' || n.type === 'SOUS_LOT')) return n;
    const nested = findLot(n.enfants, code);
    if (nested) return nested;
  }
  return null;
}

function assertPass(label, cond, detail) {
  if (!cond) throw new Error(`FAIL ${label}: ${detail}`);
  console.log(`PASS ${label}${detail ? ` — ${detail}` : ''}`);
}

async function creerAlQods(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client MOA');

  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods mois1 232 ${suffix}`,
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
  const postes = {};
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
    postes[code] = p.body;
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
  postes['3'] = p3.body;

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
    dateDebut: '2026-09-01', dateFinPrevue: '2027-04-01',
  });
  const os = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/demarrer-os`, {
    osReference: `OS-232-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01',
  });
  if (!os.ok) throw new Error(`OS ${os.status} ${os.text}`);

  return { chantierId, postes };
}

async function signerMoe(h, attachementId) {
  await api(h, 'POST', `/api/v1/attachements/${attachementId}/soumettre-signature`, {});
  const lien = await api(h, 'POST', `/api/v1/attachements/${attachementId}/lien-signature`, {});
  if (!lien.ok || !lien.body?.token) throw new Error(`lien-signature ${lien.status} ${lien.text?.slice(0, 200)}`);
  const depot = await api(
    h,
    'POST',
    `/api/v1/sign/${lien.body.token}`,
    { signatureBase64: 'c2lnbmF0dXJlLXFhLTIzMg==' },
    { anonymous: true },
  );
  if (!depot.ok) throw new Error(`signature MOE ${depot.status} ${depot.text?.slice(0, 200)}`);
  return depot.body;
}

async function main() {
  console.log('SEKTOR-232 — attachement septembre lu depuis avancement');
  const owner = await session();
  if (!owner) {
    console.log('SKIP Mode B indisponible (cursor-session)');
    process.exit(0);
  }

  const suffix = Date.now().toString(36);
  const { chantierId } = await creerAlQods(owner, suffix);

  const arbre = await api(owner, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  if (!arbre.ok) throw new Error(`budget-arbre ${arbre.status}`);
  const n21 = findNoeud(arbre.body.lots, '2.1');
  const n23 = findNoeud(arbre.body.lots, '2.3');
  const n3 = findNoeud(arbre.body.lots, '3');
  if (!n21 || !n23 || !n3) throw new Error('postes 2.1 / 2.3 / 3 absents');

  const interne = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/lots`, {
    code: 'INT',
    designation: 'Installation de chantier',
    nature: 'INTERNE',
    ordre: 99,
    quantite: 1,
    unite: 'fft',
  });
  if (interne.status !== 201) throw new Error(`lot interne ${interne.status} ${interne.text}`);

  // AC-M1 — quantité seule, refus 181 m³
  const interneAv = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-05',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ lotId: interne.body.id, quantiteRealisee: 1 }],
  });
  assertPass('alqods-m1-avancement-sept/interne-budget', interneAv.ok, `${interneAv.status}`);

  const ok40 = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-12',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n21.id, quantiteRealisee: 40 }],
  });
  assertPass('alqods-m1-avancement-sept/40m3', ok40.ok, `${ok40.status}`);

  const depasse = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-13',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n21.id, quantiteRealisee: 141 }],
  });
  assertPass(
    'alqods-m1-avancement-sept/181m3-refuse',
    !depasse.ok && `${depasse.text}`.includes('depassement'),
    `${depasse.status}`,
  );

  const ok120 = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-18',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n23.id, quantiteRealisee: 120 }],
  });
  assertPass('alqods-m1-avancement-sept/120m2', ok120.ok, `${ok120.status}`);

  // AC-M2 — pas de pourcentage en entrée
  const avecPct = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-09-19',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n23.id, quantiteRealisee: 1, pourcentage: 50 }],
  });
  assertPass(
    'alqods-m1-avancement-sept/pourcentage-refuse',
    !avecPct.ok && `${avecPct.text}`.includes('pourcentage_interdit'),
    `${avecPct.status}`,
  );

  // AC-M3, AC-M4 — attachement monté, interne et 0 m² exclus
  const att = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/attachements`, {
    dateDebut: expectedAttachement.periode.debut,
    dateFin: expectedAttachement.periode.fin,
    effectifPresent: 8,
  });
  if (!att.ok) throw new Error(`attachement ${att.status} ${att.text?.slice(0, 300)}`);

  const lignes = att.body?.lignes ?? [];
  const byCode = Object.fromEntries(lignes.map((l) => [l.code, l]));
  for (const exp of expectedAttachement.lignes) {
    const row = byCode[exp.noeud];
    assertPass(
      `alqods-m1-attachement-lu/ligne-${exp.noeud}`,
      row && Number(row.quantitePeriode) === exp.qte && row.unite === exp.unite,
      row ? `qte=${row.quantitePeriode} pu=${row.prixUnitaireVendu}` : 'absente',
    );
  }

  const ids = lignes.map((l) => l.noeudId);
  assertPass('alqods-m1-interne-absent', !ids.includes(interne.body.id), `ids=${JSON.stringify(ids)}`);
  assertPass('alqods-m1-etancheite-absente', !ids.includes(n3.id), `ids=${JSON.stringify(ids)}`);

  // AC-M5 — signature MOE
  const signe = await signerMoe(owner, att.body.id);
  assertPass('alqods-m1-attachement-signe', signe?.status === 'SIGNE_MOE', signe?.status);
  assertPass(
    'alqods-m1-attachement-signe/lignes-figees',
    signe.lignes?.length === 2
      && Number(signe.lignes.find((l) => l.code === '2.1')?.quantitePeriode) === 40,
    JSON.stringify(signe.lignes?.map((l) => ({ code: l.code, qte: l.quantitePeriode }))),
  );

  // AC-M6 — période chevauchante refusée ; octobre sans re-proposer septembre
  const chevauch = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/attachements`, {
    dateDebut: '2026-09-15',
    dateFin: '2026-09-30',
    effectifPresent: 6,
  });
  assertPass(
    'alqods-m1-attachement-ac-m6/chevauchement-refuse',
    !chevauch.ok && `${chevauch.text}`.includes('periode_chevauchante'),
    `${chevauch.status}`,
  );

  await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
    date: '2026-10-05',
    status: 'BROUILLON',
    saisieParId: 'qa-emp-chef-chantier',
    entries: [{ posteId: n21.id, quantiteRealisee: 10 }],
  });
  const attOct = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/attachements`, {
    dateDebut: '2026-10-01',
    dateFin: '2026-10-31',
    effectifPresent: 6,
  });
  assertPass('alqods-m1-attachement-ac-m6/octobre-cree', attOct.ok, `${attOct.status}`);
  const oct21 = attOct.body?.lignes?.find((l) => l.code === '2.1');
  assertPass(
    'alqods-m1-attachement-ac-m6/sept-non-repropose',
    oct21 && Number(oct21.quantitePeriode) === 10,
    oct21 ? `oct qte=${oct21.quantitePeriode}` : '2.1 absent',
  );
  assertPass(
    'alqods-m1-attachement-ac-m6/2.3-absent-octobre',
    !(attOct.body?.lignes ?? []).some((l) => l.code === '2.3'),
    JSON.stringify(attOct.body?.lignes?.map((l) => l.code)),
  );

  console.log(`\nSEKTOR-232 : PASS · chantier=${chantierId} · attachement=${att.body.id}`);
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
