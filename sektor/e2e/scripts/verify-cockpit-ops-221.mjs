/**
 * Preuve SEKTOR-221 — cockpit EN_COURS ouvre DA, BL, docs, ST (AC-1..3).
 * Run: node sektor/e2e/scripts/verify-cockpit-ops-221.mjs
 *
 * Discriminants (pas un listing 200) :
 *   owner/conducteur : DA + avancement, routes portent chantierId
 *   chef : avancement + docs + BL, pas notifier-marché, pas DA
 *   magasinier : réception, pas situation
 *   daf : budget, pas écriture terrain
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

function labels(cockpit) {
  return (cockpit?.nextActions ?? []).map((a) => a.libelle);
}

function routes(cockpit) {
  return (cockpit?.nextActions ?? []).map((a) => a.route ?? '');
}

function assertChrome() {
  const here = dirname(fileURLToPath(import.meta.url));
  const decision = join(here, '../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/ChantierActionDecision.java');
  const routesTs = join(here, '../../sources/web/app/chantiers/components/pilotage-tab/cockpit-routes.ts');
  const tab = join(here, '../../sources/web/app/chantiers/components/pilotage-tab/pilotage-tab.component.ts');
  const da = join(here, '../../sources/web/app/achats/demandes/demande-detail/demande-detail.page.ts');
  const st = join(here, '../../sources/web/app/chantiers/sous-traitance/sous-traitance-create/sous-traitance-create.page.ts');
  for (const f of [decision, routesTs, tab, da, st]) {
    if (!existsSync(f)) throw new Error(`VU ROUGE chrome : ${f} absent`);
  }
  const java = readFileSync(decision, 'utf8');
  if (!java.includes('chantiers.cockpit.action.demandeAchat')) {
    throw new Error('VU ROUGE java : nextActions EN_COURS sans DA');
  }
  if (java.includes('.limit(4)') && java.includes('STATUS_EN_COURS')) {
    throw new Error('VU ROUGE java : plafond 4 encore sur EN_COURS');
  }
  const routesSrc = readFileSync(routesTs, 'utf8');
  if (!routesSrc.includes('/achats/demandes/new?chantierId=')) {
    throw new Error('VU ROUGE chrome : module DA sans chantierId');
  }
  if (!routesSrc.includes('recommande: true')) {
    throw new Error('VU ROUGE chrome : planning n’est pas marqué recommandé');
  }
  const tabSrc = readFileSync(tab, 'utf8');
  if (!tabSrc.includes('actionsSecondaires')) {
    throw new Error('VU ROUGE chrome : cockpit n’affiche que l’action primaire');
  }
  const daSrc = readFileSync(da, 'utf8');
  if (!daSrc.includes("queryParamMap.get('chantierId')")) {
    throw new Error('VU ROUGE chrome : DA create ignore chantierId query');
  }
  const stSrc = readFileSync(st, 'utf8');
  if (!stSrc.includes("queryParamMap.get('chantierId')")) {
    throw new Error('VU ROUGE chrome : ST create ignore chantierId query');
  }
}

async function creerEnCours(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client pour le chantier 221');
  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Al Qods ops 221 ${suffix}`, chargeEtudeUserId: charge, clientNom: `MOA 221 ${suffix}`,
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
  const affs = [
    ['qa-emp-conducteur', 'BTP_CONDUCTEUR_TRAVAUX'],
    ['qa-emp-chef-chantier', 'BTP_CHEF_CHANTIER'],
    ['qa-emp-magasinier', 'BTP_MAGASINIER'],
  ];
  for (const [employeId, roleCode] of affs) {
    const aff = await api(h, 'POST', `/api/v1/chantiers/${id}/affectations`, {
      employeId, roleCode, dateDebut: today,
    });
    if (aff.status !== 201 && aff.status !== 200) {
      throw new Error(`affectation ${roleCode} ${aff.status} ${aff.text}`);
    }
  }
  await api(h, 'PUT', `/api/v1/chantiers/${id}`, { dateDebut: '2026-08-01', dateFinPrevue: '2027-03-01' });
  const os = await api(h, 'POST', `/api/v1/chantiers/${id}/demarrer-os`, {
    osReference: `OS-221-${suffix}`.slice(0, 40),
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

  assertChrome();
  console.log('ok chrome : DA/BL/docs/ST dans nextActions + modules, chantierId porté, planning recommandé');

  const oh = await session();
  const suffix = Date.now().toString(36);
  const id = await creerEnCours(oh, suffix);

  const ownerRes = await api(oh, 'GET', `/api/v1/chantiers/${id}/cockpit`);
  if (!ownerRes.ok) throw new Error(`owner cockpit ${ownerRes.status} ${ownerRes.text}`);
  if (ownerRes.body?.identity?.status !== 'EN_COURS') {
    throw new Error(`attendu EN_COURS, obtenu ${ownerRes.body?.identity?.status}`);
  }
  const ownerLabels = labels(ownerRes.body);
  const ownerRoutes = routes(ownerRes.body);
  if (!ownerLabels.includes('chantiers.cockpit.action.avancement')) {
    throw new Error(`owner sans avancement : ${ownerLabels.join(',')}`);
  }
  if (!ownerLabels.includes('chantiers.cockpit.action.demandeAchat')) {
    throw new Error(`owner sans DA : ${ownerLabels.join(',')}`);
  }
  if (ownerLabels.includes('chantiers.cockpit.action.planning') && ownerLabels.length === 1) {
    throw new Error('planning est la seule porte');
  }
  if (!ownerRoutes.every((r) => r.includes(id))) {
    throw new Error(`owner route sans chantierId : ${ownerRoutes.join(' | ')}`);
  }
  console.log('PASS owner : DA + avancement, routes portent chantierId');

  const condRes = await api(await session('conducteur'), 'GET', `/api/v1/chantiers/${id}/cockpit`);
  if (!condRes.ok) throw new Error(`conducteur cockpit ${condRes.status} ${condRes.text}`);
  const condLabels = labels(condRes.body);
  if (!condLabels.includes('chantiers.cockpit.action.demandeAchat')
      || !condLabels.includes('chantiers.cockpit.action.avancement')
      || !condLabels.includes('chantiers.cockpit.action.sousTraitance')) {
    throw new Error(`conducteur ops manquantes : ${condLabels.join(',')}`);
  }
  if (!routes(condRes.body).every((r) => r.includes(id))) {
    throw new Error(`conducteur route sans chantierId : ${routes(condRes.body).join(' | ')}`);
  }
  console.log('PASS conducteur : DA, avancement, ST');

  const chefRes = await api(await session('chef-chantier'), 'GET', `/api/v1/chantiers/${id}/cockpit`);
  if (!chefRes.ok) throw new Error(`chef cockpit ${chefRes.status} ${chefRes.text}`);
  const chefLabels = labels(chefRes.body);
  if (!chefLabels.includes('chantiers.cockpit.action.avancement')
      || !chefLabels.includes('chantiers.cockpit.action.documents')
      || !chefLabels.includes('chantiers.cockpit.action.receptionBl')) {
    throw new Error(`chef ops manquantes : ${chefLabels.join(',')}`);
  }
  if (chefLabels.includes('chantiers.cockpit.action.notifierMarche')
      || chefLabels.some((l) => /marche|marché/i.test(l))) {
    throw new Error(`chef a notifier-marché : ${chefLabels.join(',')}`);
  }
  if (chefLabels.includes('chantiers.cockpit.action.demandeAchat')
      || chefLabels.includes('chantiers.cockpit.action.situation')) {
    throw new Error(`chef a DA ou situation : ${chefLabels.join(',')}`);
  }
  console.log('PASS chef : avancement/docs/BL, pas notifier-marché, pas DA');

  const magRes = await api(await session('magasinier'), 'GET', `/api/v1/chantiers/${id}/cockpit`);
  if (!magRes.ok) throw new Error(`magasinier cockpit ${magRes.status} ${magRes.text}`);
  const magLabels = labels(magRes.body);
  if (!magLabels.includes('chantiers.cockpit.action.receptionBl')) {
    throw new Error(`magasinier sans réception : ${magLabels.join(',')}`);
  }
  if (magLabels.includes('chantiers.cockpit.action.situation')
      || magLabels.includes('chantiers.cockpit.action.attachement')) {
    throw new Error(`magasinier a situation : ${magLabels.join(',')}`);
  }
  console.log('PASS magasinier : réception, pas situation');

  const dafRes = await api(await session('daf'), 'GET', `/api/v1/chantiers/${id}/cockpit`);
  if (!dafRes.ok) throw new Error(`daf cockpit ${dafRes.status} ${dafRes.text}`);
  const dafLabels = labels(dafRes.body);
  const dafPerms = (dafRes.body?.nextActions ?? []).map((a) => a.permission);
  if (dafPerms.includes('chantiers.update')) {
    throw new Error(`daf écriture terrain : ${dafLabels.join(',')}`);
  }
  if (!dafLabels.includes('chantiers.cockpit.action.budget') && dafRes.body?.finance?.montantVenteActifHt?.etat === 'FORBIDDEN') {
    throw new Error('daf sans finance ni budget');
  }
  console.log('PASS daf : pas d’écriture terrain');

  let frontOk = false;
  try {
    const front = await fetch(FRONT_BASE, { method: 'GET' });
    frontOk = front.ok || front.status === 200;
  } catch {
    frontOk = false;
  }

  console.log(`\nSEKTOR-221 cockpit ops : PASS · chantierId=${id}`);
  console.log(`Front ${FRONT_BASE} ${frontOk ? 'joignable' : 'injoignable'} — Browser MCP absent : pas de capture desktop/390, preuve API + chrome source.`);
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
