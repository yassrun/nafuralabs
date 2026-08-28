/**
 * Preuve SEKTOR-243 / SEKTOR-244 — acte 4 réception provisoire Al Qods (AC-15).
 * Run: node sektor/e2e/scripts/verify-alqods-reception-provisoire-242.mjs
 *
 * Contrat : sektor/raster-src/lots/chantiers/vie-de-chantier/CONTRAT.md
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

const OPS_LABELS = [
  'chantiers.cockpit.action.avancement',
  'chantiers.cockpit.action.demandeAchat',
  'chantiers.cockpit.action.receptionBl',
  'chantiers.cockpit.action.attachement',
  'chantiers.cockpit.action.situation',
  'chantiers.cockpit.action.sousTraitance',
];

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

function assertPass(label, cond, detail) {
  if (!cond) throw new Error(`FAIL ${label}: ${detail}`);
  console.log(`PASS ${label}${detail ? ` — ${detail}` : ''}`);
}

function assertChrome() {
  const detail = join(ROOT, 'sources/web/app/chantiers/chantier-detail/chantier-detail.page.ts');
  const src = readFileSync(detail, 'utf8');
  if (!src.includes('receptionProvisoire')) {
    throw new Error('VU ROUGE : fiche chantier sans receptionProvisoire()');
  }
  if (!src.includes('canReceptionProvisoire')) {
    throw new Error('VU ROUGE : fiche chantier sans canReceptionProvisoire');
  }
}

async function creerChantierEnCours(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client MOA');

  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods réception 242 ${suffix}`,
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
  const p21 = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot2.body.id, code: '2.1', libelle: 'Béton B25 fondations',
    quantite: 180, unite: 'm³', origineCout: 'ESTIME', coutUnitaire: 1200, fraisGenerauxPercent: 0, margePercent: 15,
  });
  if (p21.status !== 201) throw new Error(`poste 2.1 ${p21.status}`);
  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: p21.body.id });
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
    type: 'MATIERE', referenceType: 'LIBRE', libelle: 'Béton', rendement: 1, unite: 'm³',
    prixUnitaire: 1200, sourcePrix: 'MANUEL',
  });

  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  let v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (v.ok && v.body?.status === 'EN_VALIDATION') {
    v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  }
  if (!v.ok || v.body?.status !== 'VALIDEE') throw new Error(`valider ${v.status}`);

  const g = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId: client.id });
  if (!g.ok) throw new Error(`generer-devis ${g.status}`);
  const devisId = g.body?.devisGenereId ?? g.body?.id;
  const dd = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  const total = dd.body?.totalHt ?? dd.body?.totalHT;
  const gain = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: new Date().toISOString().slice(0, 10), devisId, montantAttribue: total,
  });
  if (!gain.ok) throw new Error(`gagne ${gain.status}`);

  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {});
  if (!conv.ok) throw new Error(`convertir ${conv.status}`);
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
  await api(h, 'PUT', `/api/v1/chantiers/${chantierId}`, {
    dateDebut: '2026-09-01', dateFinPrevue: '2027-04-01',
  });
  const os = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/demarrer-os`, {
    osReference: `OS-242-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01',
  });
  if (!os.ok) throw new Error(`OS ${os.status} ${os.text}`);

  const ch = await api(h, 'GET', `/api/v1/chantiers/${chantierId}`);
  if (ch.body?.status !== 'EN_COURS') {
    throw new Error(`statut attendu EN_COURS, obtenu ${ch.body?.status}`);
  }
  return chantierId;
}

function pageContent(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.content)) return body.content;
  if (Array.isArray(body.items)) return body.items;
  return [];
}

async function main() {
  console.log('SEKTOR-243/244 — réception provisoire Al Qods (acte 4)');
  const owner = await session();
  if (!owner) {
    console.log('SKIP Mode B indisponible (cursor-session)');
    process.exit(0);
  }

  assertChrome();
  console.log('ok chrome : fiche chantier câblée receptionProvisoire');

  const here = dirname(fileURLToPath(import.meta.url));
  const pvPdf = join(here, '../fixtures/al-qods/docs/PV-coulage-2-1.pdf');
  if (!existsSync(pvPdf)) throw new Error(`fixture PV absent : ${pvPdf}`);

  const suffix = Date.now().toString(36);
  const chantierId = await creerChantierEnCours(owner, suffix);

  const cloreAvant = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/clore`);
  if (cloreAvant.status !== 409 && cloreAvant.status !== 422) {
    throw new Error(`/clore depuis EN_COURS attendu 409, obtenu ${cloreAvant.status}`);
  }
  assertPass('alqods-reception-provisoire/clore-refuse-en-cours', true, `${cloreAvant.status}`);

  const pvDoc = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/documents`, {
    type: 'PV',
    titre: 'PV réception provisoire Al Qods',
    fichier: 'PV-reception-provisoire.pdf',
    taille: statSync(pvPdf).size,
    uploadedAt: '2026-11-28',
    uploadedPar: 'qa-conducteur',
  });
  if (pvDoc.status !== 201) throw new Error(`PV ${pvDoc.status} ${pvDoc.text?.slice(0, 200)}`);
  assertPass('alqods-reception-provisoire/pv-document', pvDoc.body?.type === 'PV', pvDoc.body?.titre);

  const docs = await api(owner, 'GET', `/api/v1/chantiers/documents?chantierId=${chantierId}&size=20`);
  const pvListed = pageContent(docs.body).some((d) => d.titre?.includes('réception provisoire'));
  assertPass('alqods-reception-provisoire/pv-liste', pvListed, `docs=${pageContent(docs.body).length}`);

  const conducteur = await session('conducteur');
  if (conducteur) {
    const rpCond = await api(conducteur, 'POST', `/api/v1/chantiers/${chantierId}/reception-provisoire`);
    assertPass(
      'alqods-reception-provisoire/roles-conducteur-refuse',
      rpCond.status === 403,
      `conducteur ${rpCond.status}`,
    );
  }

  const rp = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/reception-provisoire`);
  if (!rp.ok) throw new Error(`reception-provisoire ${rp.status} ${rp.text?.slice(0, 300)}`);
  assertPass(
    'alqods-reception-provisoire/statut',
    rp.body?.status === 'RECEPTIONNE_PROVISOIRE',
    rp.body?.status,
  );

  const rp2 = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/reception-provisoire`);
  if (rp2.status !== 409 && rp2.status !== 422) {
    throw new Error(`double réception attendue 409, obtenu ${rp2.status}`);
  }
  assertPass('alqods-reception-provisoire/double-refusee', true, `${rp2.status}`);

  const cloreApres = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/clore`);
  if (cloreApres.status !== 409 && cloreApres.status !== 422) {
    throw new Error(`/clore depuis RECEPTIONNE_PROVISOIRE attendu 409, obtenu ${cloreApres.status}`);
  }
  assertPass('alqods-reception-provisoire/clore-refuse-apres-rp', true, `${cloreApres.status}`);

  const ck = await api(owner, 'GET', `/api/v1/chantiers/${chantierId}/cockpit`);
  if (!ck.ok) throw new Error(`cockpit ${ck.status}`);
  const labels = (ck.body?.nextActions ?? []).map((a) => a.libelle ?? '');
  const perms = (ck.body?.nextActions ?? []).map((a) => a.permission ?? '');
  const opsHit = OPS_LABELS.filter((l) => labels.includes(l));
  const flux = ck.body?.progress?.fluxMois;

  assertPass(
    'alqods-reception-provisoire/cockpit-statut',
    ck.body?.identity?.status === 'RECEPTIONNE_PROVISOIRE',
    ck.body?.identity?.status,
  );
  assertPass(
    'alqods-reception-provisoire/cockpit-flux-lecture-seule',
    flux?.actionnable === false
      && `${flux?.etape ?? ''}`.includes('etapeLectureSeule'),
    `actionnable=${flux?.actionnable} etape=${flux?.etape}`,
  );
  assertPass(
    'alqods-reception-provisoire/cockpit-sans-ops-terrain',
    opsHit.length === 0 && !perms.includes('chantiers.update'),
    opsHit.length ? `ops=${opsHit.join(',')}` : `actions=${labels.join('|')}`,
  );
  assertPass(
    'alqods-reception-provisoire/cockpit-ops-null',
    ck.body?.ops == null,
    ck.body?.ops ? 'ops présent' : 'ops absent',
  );

  console.log(`\nSEKTOR-244 : PASS · chantier=${chantierId}`);
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
