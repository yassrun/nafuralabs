/**
 * Preuve SEKTOR-234 — cockpit fin de mois : attachement + situation avec chantierId ;
 * post-situation n1 ≠ « saisir avancement » ; RBAC chef / conducteur / daf.
 *
 * Run: node sektor/e2e/scripts/verify-cockpit-mois1-234.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

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

function labels(cockpit) {
  return (cockpit?.nextActions ?? []).map((a) => a.libelle);
}

function routes(cockpit) {
  return (cockpit?.nextActions ?? []).map((a) => a.route ?? '');
}

function assertChrome234() {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = join(here, '../..');
  const decision = join(root, 'sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/ChantierActionDecision.java');
  const cockpitSvc = join(root, 'sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/CockpitChantierService.java');
  const routesTs = join(root, 'sources/web/app/chantiers/components/pilotage-tab/cockpit-routes.ts');
  const detail = join(root, 'sources/web/app/chantiers/chantier-detail/chantier-detail.page.ts');

  for (const f of [decision, cockpitSvc, routesTs, detail]) {
    if (!existsSync(f)) throw new Error(`VU ROUGE chrome : ${f} absent`);
  }

  const java = readFileSync(decision, 'utf8');
  if (!java.includes('chantiers.cockpit.action.soumettreSituation')) {
    throw new Error('VU ROUGE java : action soumettreSituation absente');
  }
  if (!java.includes('prioriserApresCycleMensuel')) {
    throw new Error('VU ROUGE java : priorisation post-cycle absente');
  }
  if (!java.includes('/chantiers/attachements/saisie?chantierId={id}')) {
    throw new Error('VU ROUGE java : route attachement sans chantierId');
  }
  if (!java.includes('/chantiers/situations?chantierId={id}')) {
    throw new Error('VU ROUGE java : route situation sans chantierId');
  }

  const svc = readFileSync(cockpitSvc, 'utf8');
  if (!svc.includes('etapeSoumettreSituation')) {
    throw new Error('VU ROUGE java : flux post-situation absent');
  }

  const routesSrc = readFileSync(routesTs, 'utf8');
  if (!routesSrc.includes('/chantiers/attachements/saisie?chantierId=')) {
    throw new Error('VU ROUGE front : module attachement sans chantierId');
  }
  if (!routesSrc.includes('/chantiers/situations?chantierId=')) {
    throw new Error('VU ROUGE front : module situation sans chantierId');
  }

  const detailSrc = readFileSync(detail, 'utf8');
  if (!detailSrc.includes('canGenerateSituationDraft()')) {
    throw new Error('VU ROUGE front : garde-fou situation sans marché (186) absent');
  }
  if (!detailSrc.includes('activeSituationReference')) {
    throw new Error('VU ROUGE front : référence vente active (186) absente');
  }
  if (detailSrc.includes('marchePourChantier()') && !detailSrc.includes('canGenerateSituationDraft()')) {
    throw new Error('VU ROUGE front : écran mort marché encore bloquant');
  }
}

async function creerEnCours(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client pour le chantier 234');
  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods cockpit 234 ${suffix}`, chargeEtudeUserId: charge, clientNom: `MOA 234 ${suffix}`,
  });
  if (d.status !== 201) throw new Error(`dossier ${d.status} ${d.text}`);
  const dossierId = d.body.id;
  const b = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const dpgfId = b.body?.dpgfId;
  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, { type: 'LOT', code: '1', libelle: 'Lot GO' });
  const poste = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot.body.id, code: '1.1', libelle: 'Poste GO', quantite: 1, unite: 'U',
    origineCout: 'ESTIME', coutUnitaire: 320000, fraisGenerauxPercent: 0, margePercent: 15,
  });
  if (poste.status !== 201) throw new Error(`poste ${poste.status} ${poste.text}`);
  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: poste.body.id });
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
    type: 'MATIERE', referenceType: 'LIBRE', libelle: 'Béton', rendement: 1, unite: 'U',
    prixUnitaire: 320000, sourcePrix: 'MANUEL',
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
    const aff = await api(h, 'POST', `/api/v1/chantiers/${id}/affectations`, {
      employeId, roleCode, dateDebut: today,
    });
    if (aff.status !== 201 && aff.status !== 200) {
      throw new Error(`affectation ${roleCode} ${aff.status} ${aff.text}`);
    }
  }
  await api(h, 'PUT', `/api/v1/chantiers/${id}`, { dateDebut: '2026-08-01', dateFinPrevue: '2027-03-01' });
  const os = await api(h, 'POST', `/api/v1/chantiers/${id}/demarrer-os`, {
    osReference: `OS-234-${suffix}`.slice(0, 40),
    osDateEffet: '2026-08-01',
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

  assertChrome234();
  console.log('ok chrome : routes attachement/situation + post-cycle + 186 aligné');

  const oh = await session();
  const suffix = Date.now().toString(36);
  const id = await creerEnCours(oh, suffix);

  const condRes = await api(await session('conducteur'), 'GET', `/api/v1/chantiers/${id}/cockpit`);
  if (!condRes.ok) throw new Error(`conducteur cockpit ${condRes.status} ${condRes.text}`);
  const condLabels = labels(condRes.body);
  const condRoutes = routes(condRes.body);
  if (!condLabels.includes('chantiers.cockpit.action.attachement')
      || !condLabels.includes('chantiers.cockpit.action.situation')) {
    throw new Error(`conducteur sans attachement/situation : ${condLabels.join(',')}`);
  }
  if (!condRoutes.some((r) => r.includes('attachements/saisie') && r.includes('chantierId='))) {
    throw new Error(`route attachement sans chantierId : ${condRoutes.join(' | ')}`);
  }
  if (!condRoutes.some((r) => r.includes('situations') && r.includes('chantierId='))) {
    throw new Error(`route situation sans chantierId : ${condRoutes.join(' | ')}`);
  }
  console.log('PASS conducteur : attachement + situation, chantierId porté');

  const chefRes = await api(await session('chef-chantier'), 'GET', `/api/v1/chantiers/${id}/cockpit`);
  if (!chefRes.ok) throw new Error(`chef cockpit ${chefRes.status} ${chefRes.text}`);
  const chefLabels = labels(chefRes.body);
  if (!chefLabels.includes('chantiers.cockpit.action.avancement')) {
    throw new Error(`chef sans avancement : ${chefLabels.join(',')}`);
  }
  if (chefLabels.includes('chantiers.cockpit.action.situation')
      || chefLabels.includes('chantiers.cockpit.action.attachement')) {
    throw new Error(`chef a fin de mois : ${chefLabels.join(',')}`);
  }
  console.log('PASS chef : avancement oui, attachement/situation non');

  const dafRes = await api(await session('daf'), 'GET', `/api/v1/chantiers/${id}/cockpit`);
  if (!dafRes.ok) throw new Error(`daf cockpit ${dafRes.status} ${dafRes.text}`);
  const dafLabels = labels(dafRes.body);
  if (dafLabels.includes('chantiers.cockpit.action.receptionBl')) {
    throw new Error(`daf a réception BL : ${dafLabels.join(',')}`);
  }
  if ((dafRes.body?.nextActions ?? []).some((a) => a.permission === 'chantiers.update')) {
    throw new Error(`daf écriture terrain : ${dafLabels.join(',')}`);
  }
  console.log('PASS daf : pas réception BL, pas écriture terrain');

  console.log(`\nSEKTOR-234 cockpit mois 1 : PASS · chantierId=${id}`);
  console.log('Post-situation n1 : preuve unitaire CockpitChantierServiceTest.flux_apresSituationN1_*');
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
