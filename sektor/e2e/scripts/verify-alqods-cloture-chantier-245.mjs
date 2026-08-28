/**
 * Preuve SEKTOR-246 / SEKTOR-247 — chaîne réception provisoire → définitive → clôture.
 * Run: node sektor/e2e/scripts/verify-alqods-cloture-chantier-245.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

async function session() {
  const s = await (await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST', headers: { Accept: 'application/json' },
  })).json();
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
  const mapper = join(ROOT, 'sources/web/app/chantiers/services/chantier.mapper.ts');
  const page = readFileSync(detail, 'utf8');
  const map = readFileSync(mapper, 'utf8');
  for (const sym of ['receptionProvisoire', 'receptionDefinitive', 'cloreChantier', 'lifecycleStatus']) {
    if (!page.includes(sym) && !map.includes(sym)) {
      throw new Error(`VU ROUGE : ${sym} absent fiche/mapper`);
    }
  }
}

async function creerChantierEnCours(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client MOA');

  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods clôture 245 ${suffix}`,
    chargeEtudeUserId: charge,
    clientNom: `Commune Al Qods ${suffix}`,
  });
  if (d.status !== 201) throw new Error(`dossier ${d.status}`);
  const dossierId = d.body.id;
  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${b.body?.dpgfId}/noeuds`, {
    type: 'LOT', code: '2', libelle: 'Gros œuvre',
  });
  const p = await api(h, 'POST', `/api/v1/etudes/dpgf/${b.body?.dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot.body.id, code: '2.1', libelle: 'Béton',
    quantite: 180, unite: 'm³', origineCout: 'ESTIME', coutUnitaire: 1200, fraisGenerauxPercent: 0, margePercent: 15,
  });
  if (p.status !== 201) throw new Error(`poste ${p.status}`);
  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: p.body.id });
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
    type: 'MATIERE', referenceType: 'LIBRE', libelle: 'Béton', rendement: 1, unite: 'm³',
    prixUnitaire: 1200, sourcePrix: 'MANUEL',
  });

  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  let v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (v.ok && v.body?.status === 'EN_VALIDATION') v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (!v.ok || v.body?.status !== 'VALIDEE') throw new Error(`valider ${v.status}`);

  const g = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId: client.id });
  const devisId = g.body?.devisGenereId ?? g.body?.id;
  const dd = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: new Date().toISOString().slice(0, 10), devisId, montantAttribue: dd.body?.totalHt ?? dd.body?.totalHT,
  });

  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {});
  const chantierId = conv.body?.chantierId ?? conv.body?.id;
  const today = new Date().toISOString().slice(0, 10);
  for (const [employeId, roleCode] of [
    ['qa-emp-conducteur', 'BTP_CONDUCTEUR_TRAVAUX'],
    ['qa-emp-chef-chantier', 'BTP_CHEF_CHANTIER'],
  ]) {
    await api(h, 'POST', `/api/v1/chantiers/${chantierId}/affectations`, { employeId, roleCode, dateDebut: today });
  }
  await api(h, 'PUT', `/api/v1/chantiers/${chantierId}`, { dateDebut: '2026-09-01', dateFinPrevue: '2027-04-01' });
  const os = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/demarrer-os`, {
    osReference: `OS-245-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01',
  });
  if (!os.ok) throw new Error(`OS ${os.status}`);
  return chantierId;
}

async function main() {
  console.log('SEKTOR-246/247 — clôture chantier Al Qods (RP → RD → CLOS)');
  const owner = await session();
  if (!owner) {
    console.log('SKIP Mode B indisponible');
    process.exit(0);
  }

  assertChrome();
  const chantierId = await creerChantierEnCours(owner, Date.now().toString(36));

  const rdSansRp = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/reception-definitive`);
  assertPass('cloture-rd-refusee-sans-rp', rdSansRp.status === 409, `${rdSansRp.status}`);

  const rp = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/reception-provisoire`);
  if (!rp.ok) throw new Error(`RP ${rp.status} ${rp.text?.slice(0, 200)}`);
  assertPass('cloture-rp', rp.body?.status === 'RECEPTIONNE_PROVISOIRE', rp.body?.status);

  const cloreSansRd = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/clore`);
  assertPass('cloture-clore-refuse-sans-rd', cloreSansRd.status === 409, `${cloreSansRd.status}`);

  const rd = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/reception-definitive`);
  if (!rd.ok) throw new Error(`RD ${rd.status} ${rd.text?.slice(0, 200)}`);
  assertPass('cloture-rd', rd.body?.status === 'RECEPTIONNE_DEFINITIF', rd.body?.status);

  const rd2 = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/reception-definitive`);
  assertPass('cloture-rd-double-refusee', rd2.status === 409, `${rd2.status}`);

  const cl = await api(owner, 'POST', `/api/v1/chantiers/${chantierId}/clore`);
  if (!cl.ok) throw new Error(`clore ${cl.status} ${cl.text?.slice(0, 200)}`);
  assertPass('cloture-clos', cl.body?.status === 'CLOS' && cl.body?.isActive === false, `${cl.body?.status} isActive=${cl.body?.isActive}`);

  const ck = await api(owner, 'GET', `/api/v1/chantiers/${chantierId}/cockpit`);
  assertPass('cloture-cockpit-statut', ck.body?.identity?.status === 'CLOS', ck.body?.identity?.status);
  assertPass(
    'cloture-cockpit-flux-lecture-seule',
    ck.body?.progress?.fluxMois?.actionnable === false,
    `actionnable=${ck.body?.progress?.fluxMois?.actionnable}`,
  );
  const labels = (ck.body?.nextActions ?? []).map((a) => a.libelle ?? '').join('|');
  assertPass(
    'cloture-cockpit-sans-ecriture',
    !labels.includes('avancement') && !labels.includes('demandeAchat'),
    labels,
  );

  console.log(`\nSEKTOR-247 : PASS · chantier=${chantierId}`);
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
