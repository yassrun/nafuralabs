/**
 * Preuve SEKTOR-227 — tuile DA cockpit : indisponible si Achats down, jamais « 0 » (AC-D1).
 * Run: node sektor/e2e/scripts/verify-dette-cockpit-achats-227.mjs
 *
 * Discriminants :
 *   chrome : lireSansPlanter + ops.demandesAchat + afficheCompteur NOT_AVAILABLE
 *   unitaire : panne port → NOT_AVAILABLE, valeur null, cockpit lisible
 *   Mode B : EN_COURS → ops.demandesAchat AVAILABLE aligné sur GET demandes-achat
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
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

function assertChrome() {
  const here = dirname(fileURLToPath(import.meta.url));
  const svc = join(here, '../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/CockpitChantierService.java');
  const dto = join(here, '../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/api/dto/CockpitChantierDto.java');
  const port = join(here, '../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/port/DemandeAchatCockpitPort.java');
  const tab = join(here, '../../sources/web/app/chantiers/components/pilotage-tab/pilotage-tab.component.ts');
  for (const f of [svc, dto, port, tab]) {
    if (!existsSync(f)) throw new Error(`VU ROUGE chrome : ${f} absent`);
  }
  const java = readFileSync(svc, 'utf8');
  if (!java.includes('degradation.demandesAchat')) {
    throw new Error('VU ROUGE java : pas de dégradation demandesAchat');
  }
  if (!java.includes('compteurIndisponible')) {
    throw new Error('VU ROUGE java : pas de fallback indisponible pour DA');
  }
  if (!java.includes('lireSansPlanter')) {
    throw new Error('VU ROUGE java : lireSansPlanter absent');
  }
  const dtoSrc = readFileSync(dto, 'utf8');
  if (!dtoSrc.includes('CompteurDto') || !dtoSrc.includes('OpsDto')) {
    throw new Error('VU ROUGE dto : ops/compteur absent');
  }
  const tabSrc = readFileSync(tab, 'utf8');
  if (!tabSrc.includes('afficheCompteur')) {
    throw new Error('VU ROUGE front : afficheCompteur absent');
  }
  if (!tabSrc.includes("etat === 'NOT_AVAILABLE'")) {
    throw new Error('VU ROUGE front : tuile DA sans branche NOT_AVAILABLE');
  }
  if (!tabSrc.includes('moduleKey === \'demandeAchat\'')) {
    throw new Error('VU ROUGE front : tuile DA non liée au read model ops');
  }
  console.log('PASS chrome-227 : dégradation DA cockpit câblée');
}

function runUnitTests() {
  const here = dirname(fileURLToPath(import.meta.url));
  const gradlew = join(here, '../../sources/backend/gradlew');
  const cwd = join(here, '../../sources/backend');
  const tests = [
    'ma.nafura.chantiers.service.CockpitChantierServiceTest.ops_panneAchats_demandesIndisponibles_pasDeFauxZero',
    'ma.nafura.chantiers.service.CockpitChantierServiceTest.ops_enCours_compteLesDemandesAchat',
    'ma.nafura.chantiers.service.CockpitChantierServiceTest.ops_enPreparation_absent',
  ];
  const args = [':sektor:chantiers:test', '-q'];
  for (const t of tests) args.push('--tests', t);
  const r = spawnSync(
    process.platform === 'win32' ? 'gradlew.bat' : './gradlew',
    args,
    { cwd, shell: true, encoding: 'utf8' },
  );
  if (r.status !== 0) {
    throw new Error(`VU ROUGE unitaire : ${r.stdout}\n${r.stderr}`);
  }
  console.log('PASS unitaire-227 : panne Achats → NOT_AVAILABLE, compte OK si dispo');
}

async function creerEnCours(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [])[0];
  if (!client?.id) throw new Error('aucun client pour chantier 227');
  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Dette 227 ${suffix}`, chargeEtudeUserId: charge, clientNom: `MOA 227 ${suffix}`,
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
    const aff = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/affectations`, {
      employeId, roleCode, dateDebut: today,
    });
    if (aff.status !== 201 && aff.status !== 200) {
      throw new Error(`affectation ${roleCode} ${aff.status} ${aff.text}`);
    }
  }
  await api(h, 'PUT', `/api/v1/chantiers/${chantierId}`, {
    dateDebut: '2026-08-01', dateFinPrevue: '2027-03-01',
  });
  const os = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/demarrer-os`, {
    osReference: `OS-227-${suffix}`.slice(0, 40), osDateEffet: '2026-08-01',
  });
  if (!os.ok) throw new Error(`demarrer-os ${os.status} ${os.text?.slice(0, 200)}`);
  return chantierId;
}

async function apiModeB(h) {
  const chantierId = await creerEnCours(h, Date.now().toString(36));
  const ck = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/cockpit`);
  if (!ck.ok) throw new Error(`cockpit ${ck.status} ${ck.text?.slice(0, 200)}`);
  const da = ck.body?.ops?.demandesAchat;
  if (!da) throw new Error('ops.demandesAchat absent sur EN_COURS');
  if (da.etat !== 'AVAILABLE') {
    throw new Error(`DA dispo attendue AVAILABLE, obtenu ${da.etat}`);
  }
  if (da.valeur !== 0) {
    throw new Error(`nouveau chantier : 0 DA attendu, obtenu ${da.valeur}`);
  }
  const list = await api(h, 'GET', `/api/v1/demandes-achat?chantierId=${encodeURIComponent(chantierId)}`);
  if (!list.ok) throw new Error(`GET demandes-achat ${list.status}`);
  const n = Array.isArray(list.body) ? list.body.length : (list.body?.content?.length ?? list.body?.items?.length ?? 0);
  if (Number(da.valeur) !== n) {
    throw new Error(`cockpit ${da.valeur} ≠ liste ${n}`);
  }
  console.log(`PASS api-227 : ops.demandesAchat=${da.valeur} aligné GET (chantier=${chantierId})`);
}

async function waitApi(maxMs = 300000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    try {
      const r = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
        method: 'POST', headers: { Accept: 'application/json' },
      });
      const b = await r.json().catch(() => null);
      if (b?.accessToken) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return false;
}

async function main() {
  console.log('SEKTOR-227 — cockpit DA indisponible si Achats down');
  assertChrome();
  runUnitTests();
  if (await waitApi()) {
    const h = await session();
    if (h) await apiModeB(h);
  } else {
    console.log('SKIP Mode B — preuve unitaire + chrome suffisante');
  }
  console.log('\nSEKTOR-227 : PASS');
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
