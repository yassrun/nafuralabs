/**
 * SEKTOR-217 — checklist prérequis vs recommandé (AC-15).
 *
 * Run: node sektor/e2e/scripts/verify-finition-checklist-217.mjs
 * Prérequis: API 8082 (make -C nafura-platform/ops mode-b), cursor-session owner.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

let FAILS = 0;
let PASSES = 0;

function pass(ac, detail) {
  PASSES++;
  console.log(`PASS ${ac} — ${detail}`);
}

function fail(ac, detail, expect, got) {
  FAILS++;
  console.error(`FAIL ${ac} — ${detail}`);
  if (expect !== undefined) console.error(`  attendu: ${expect}`);
  if (got !== undefined) console.error(`  obtenu:  ${got}`);
}

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

function headers(session) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function api(h, method, path, body) {
  const opts = { method, headers: h };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return json(await fetch(`${API_BASE}${path}`, opts));
}

async function session() {
  const res = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const s = await res.json();
  if (!s?.accessToken || !s?.tenantId) throw new Error(`cursor-session KO: HTTP ${res.status}`);
  return s;
}

function repoRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '../..');
}

function read(path) {
  if (!existsSync(path)) throw new Error(`fichier absent : ${path}`);
  return readFileSync(path, 'utf8');
}

function chantierItems(body) {
  if (Array.isArray(body)) return body;
  return body?.items ?? body?.content ?? [];
}

function prepByCode(cockpit, code) {
  return (cockpit?.preparation ?? []).find((p) => p.code === code);
}

/** AC-15 — le front consomme preparationResume, pas un ratio client. */
function assertSourceWiring() {
  const root = repoRoot();
  const pilotage = join(root, 'sources/web/app/chantiers/components/pilotage-tab/pilotage-tab.component.ts');
  const model = join(root, 'sources/web/app/chantiers/services/cockpit.model.ts');
  const pilotageSrc = read(pilotage);
  const modelSrc = read(model);

  if (!pilotageSrc.includes('preparationResume')) {
    fail('AC-15', 'pilotage-tab ne consomme pas preparationResume', 'preparationResume', 'absent');
  } else if (pilotageSrc.includes('prepCount()')) {
    fail('AC-15', 'ratio client prepCount() encore présent', 'preparationResume', 'prepCount');
  } else {
    pass('AC-15', 'pilotage-tab : ratio depuis preparationResume serveur');
  }

  if (!modelSrc.includes('CockpitPreparationResume')) {
    fail('AC-15', 'modèle cockpit sans PreparationResume', 'CockpitPreparationResume', 'absent');
  } else if (!modelSrc.includes("categorie?: 'PREREQUIS' | 'RECOMMANDE'")) {
    fail('AC-15', 'Preparation sans categorie PREREQUIS|RECOMMANDE', 'categorie', 'absent');
  } else {
    pass('AC-15', 'cockpit.model : categorie + PreparationResume typés');
  }
}

/** Trouve CH-2026-101 ou un chantier EN_COURS sans activité. */
async function findEnCoursSansPlanning(h) {
  const targetCode = 'CH-2026-101';
  const search = await api(h, 'GET', `/api/v1/chantiers?search=${encodeURIComponent(targetCode)}&size=20`);
  if (search.ok) {
    const hit = chantierItems(search.body).find((c) => c.code === targetCode);
    if (hit?.id) return hit;
  }
  const list = await api(h, 'GET', '/api/v1/chantiers?size=50&sort=code,desc');
  if (!list.ok) throw new Error(`liste chantiers ${list.status} ${list.text}`);
  const enCours = chantierItems(list.body).filter((c) => c.status === 'EN_COURS');
  for (const c of enCours) {
    const acts = await api(h, 'GET', `/api/v1/chantiers/${c.id}/activites`);
    const nb = Array.isArray(acts.body) ? acts.body.length : acts.body?.content?.length ?? 0;
    if (nb === 0) return c;
  }
  return enCours[0] ?? null;
}

/** Crée un chantier EN_PREPARATION sans dates (POST direct, comme verify-cockpit-201). */
async function creerChantierSansDates(h, suffix) {
  const res = await api(h, 'POST', '/api/v1/chantiers', {
    label: `CHK217 ${suffix}`,
    clientId: `cli-217-${suffix}`,
    clientName: `MOA CHK ${suffix}`,
    ville: 'Rabat',
    montantHt: 100000,
    status: 'EN_PREPARATION',
  });
  if (res.status !== 201 || !res.body?.id) {
    throw new Error(`POST chantier ${res.status} ${res.text}`);
  }
  return res.body.id;
}

async function main() {
  console.log('=== SEKTOR-217 — checklist prérequis vs recommandé (Mode B) ===');
  assertSourceWiring();

  const owner = await session();
  const h = headers(owner);

  // ── EN_COURS sans planning : ratio prérequis complet, planning recommandé ──
  const enCours = await findEnCoursSansPlanning(h);
  if (!enCours?.id) {
    fail('AC-15', 'aucun chantier EN_COURS trouvé en Mode B', 'EN_COURS', 'absent');
  } else {
    const ck = await api(h, 'GET', `/api/v1/chantiers/${enCours.id}/cockpit`);
    if (!ck.ok) {
      fail('AC-15', `cockpit ${enCours.code}`, '200', ck.status);
    } else {
      const resume = ck.body?.preparationResume;
      const planning = prepByCode(ck.body, 'planning');
      const acts = await api(h, 'GET', `/api/v1/chantiers/${enCours.id}/activites`);
      const nbActs = Array.isArray(acts.body) ? acts.body.length : acts.body?.content?.length ?? 0;

      if (ck.body?.identity?.status !== 'EN_COURS') {
        fail('AC-15', `${enCours.code} statut`, 'EN_COURS', ck.body?.identity?.status);
      } else if (!resume || resume.prerequisOk !== resume.prerequisTotal) {
        fail(
          'AC-15',
          `${enCours.code} ratio prérequis complet`,
          `${resume?.prerequisTotal}/${resume?.prerequisTotal}`,
          `${resume?.prerequisOk}/${resume?.prerequisTotal}`,
        );
      } else if (!planning || planning.categorie !== 'RECOMMANDE') {
        fail('AC-15', 'planning categorie RECOMMANDE', 'RECOMMANDE', planning?.categorie);
      } else if (!resume.recommandationsEnAttente?.includes('planning')) {
        fail('AC-15', 'planning dans recommandationsEnAttente', 'planning', resume.recommandationsEnAttente);
      } else if (nbActs > 0) {
        fail('AC-15', `${enCours.code} sans activité`, '0 activité', `${nbActs} activités`);
      } else {
        pass(
          'AC-15',
          `${enCours.code} EN_COURS : ${resume.prerequisOk}/${resume.prerequisTotal} prérequis · planning recommandé`,
        );
      }

      const primaire = ck.body?.nextActions?.[0]?.libelle;
      if (primaire === 'chantiers.cockpit.action.demarrer') {
        fail('AC-15', `${enCours.code} pas de CTA Démarrer`, '≠ demarrer', primaire);
      } else {
        pass('AC-15', `${enCours.code} : prochaine action ≠ Démarrer (${primaire})`);
      }
    }
  }

  // ── EN_PREPARATION sans dates : dates bloquantes, pas de Démarrer ──
  const suffix = Date.now().toString(36);
  let prepId;
  try {
    prepId = await creerChantierSansDates(h, suffix);
  } catch (e) {
    fail('AC-15', 'création chantier EN_PREPARATION', 'conversion OK', e.message);
  }

  if (prepId) {
    const ckPrep = await api(h, 'GET', `/api/v1/chantiers/${prepId}/cockpit`);
    const dates = prepByCode(ckPrep.body, 'dates_prevues');
    const resumePrep = ckPrep.body?.preparationResume;
    const action1 = ckPrep.body?.nextActions?.[0]?.libelle;

    if (ckPrep.body?.identity?.status !== 'EN_PREPARATION') {
      fail('AC-15', 'chantier préparé statut', 'EN_PREPARATION', ckPrep.body?.identity?.status);
    } else if (dates?.etat !== 'BLOQUANT') {
      fail('AC-15', 'dates_prevues bloquantes', 'BLOQUANT', dates?.etat);
    } else if (resumePrep?.prerequisOk >= resumePrep?.prerequisTotal) {
      fail(
        'AC-15',
        'ratio prérequis incomplet sans dates',
        `< ${resumePrep?.prerequisTotal}`,
        `${resumePrep?.prerequisOk}/${resumePrep?.prerequisTotal}`,
      );
    } else if (action1 === 'chantiers.cockpit.action.demarrer') {
      fail('AC-15', 'pas de CTA Démarrer sans dates', 'preparer', action1);
    } else if (action1 !== 'chantiers.cockpit.action.preparer') {
      fail('AC-15', 'action primaire préparer', 'preparer', action1);
    } else {
      pass('AC-15', `EN_PREPARATION sans dates : dates BLOQUANT, action=${action1}`);
    }

    const demarrer = await api(h, 'POST', `/api/v1/chantiers/${prepId}/demarrer-os`, {
      osReference: `OS-217-${suffix}`.slice(0, 40),
      osDateEffet: '2026-09-01',
    });
    if (demarrer.status === 200) {
      fail('AC-15', 'démarrage refusé sans dates', '422/400', demarrer.status);
    } else {
      pass('AC-15', `démarrage OS refusé sans dates (${demarrer.status})`);
    }
  }

  console.log(`\nRésultat : ${PASSES} PASS, ${FAILS} FAIL`);
  if (FAILS > 0) process.exit(1);
  console.log('SEKTOR-217 : OK');
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
