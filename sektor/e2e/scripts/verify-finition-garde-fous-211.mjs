/**
 * SEKTOR-211 — garde-fous avant gain et conversion (AC-1 à AC-4).
 *
 * Scénarios :
 *   - 3 postes, 0 déboursé → GET /completude ETU-130 + POST /gagne 422
 *   - coûts partiellement estimés → gain avec acceptWarnings + motif
 *   - replay identique du gain accepté → idempotent
 *
 * Run: node sektor/e2e/scripts/verify-finition-garde-fous-211.mjs
 * Prérequis: API 8082 (make -C nafura-platform/ops mode-b), cursor-session owner.
 */
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
  console.error(`  attendu: ${expect}`);
  console.error(`  obtenu:  ${got}`);
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

async function creerDossierDevis(h, s, postes) {
  const ingenieurs = (await api(h, 'GET', '/api/v1/etudes/ingenieurs')).body ?? [];
  const chargeEtudeUserId = ingenieurs[0]?.userId;
  const dossier = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Garde-fous 211 ${s}`,
    chargeEtudeUserId,
    clientNom: `MOA GF211 ${s}`,
  });
  if (dossier.status !== 201) throw new Error(`dossier ${dossier.status} ${dossier.text}`);
  const dossierId = dossier.body.id;

  const bordereau = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  if (!bordereau.ok) throw new Error(`bordereau ${bordereau.status} ${bordereau.text}`);
  const dpgfId = bordereau.body.dpgfId;

  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT', code: '1', libelle: 'Lot test',
  });
  if (lot.status !== 201) throw new Error(`lot ${lot.status} ${lot.text}`);

  for (const p of postes) {
    const r = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      type: 'ARTICLE',
      parentId: lot.body.id,
      fraisGenerauxPercent: 5,
      margePercent: 10,
      ...p,
    });
    if (r.status !== 201) throw new Error(`poste ${p.code} ${r.status} ${r.text}`);
  }

  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 5 });
  const soumettre = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  if (!soumettre.ok) throw new Error(`soumettre ${soumettre.status} ${soumettre.text}`);
  let valider = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (valider.body?.status === 'EN_VALIDATION') {
    valider = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  }
  if (valider.body?.status !== 'VALIDEE') throw new Error(`valider ${valider.body?.status}`);

  const partner = await api(h, 'POST', '/api/v1/partners', {
    code: `GF211${s}`.slice(0, 20),
    raisonSociale: `Client GF211 ${s}`,
    roles: ['CLIENT'],
  });
  if (partner.status !== 201) throw new Error(`partner ${partner.status}`);
  const devisGen = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, {
    clientId: partner.body.id,
  });
  if (!devisGen.ok) throw new Error(`generer-devis ${devisGen.status} ${devisGen.text}`);
  const devisId = devisGen.body?.devisGenereId ?? devisGen.body?.id;
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  const devisDetail = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  return { dossierId, devisId, totalDevis: devisDetail.body?.totalHt };
}

async function main() {
  console.log('=== SEKTOR-211 — garde-fous gain/conversion (Mode B) ===');
  const owner = await session();
  const h = headers(owner);
  const s = Date.now().toString(36);

  // ── AC-3 : 3 postes, 0 déboursé ───────────────────────────────────────────
  const zeroDeb = await creerDossierDevis(h, `${s}-0`, [
    { code: '1.1', libelle: 'Poste A', quantite: 1, unite: 'U', origineCout: 'ESTIME', coutUnitaire: 100, prixUnitaire: 10000 },
    { code: '1.2', libelle: 'Poste B', quantite: 1, unite: 'U', origineCout: 'ESTIME', coutUnitaire: 200, prixUnitaire: 15000 },
    { code: '1.3', libelle: 'Poste C', quantite: 1, unite: 'U', origineCout: 'ESTIME', coutUnitaire: 80, prixUnitaire: 8000 },
  ]);

  const completude0 = await api(h, 'GET', `/api/v1/etudes/dossiers/${zeroDeb.dossierId}/completude`);
  const etu130 = completude0.body?.controles?.find((c) => c.code === 'ETU-130');
  if (completude0.ok && etu130?.severite === 'BLOCKING') {
    pass('AC-3', 'GET /completude expose ETU-130 BLOCKING (100 % coûts non établis)');
  } else {
    fail('AC-3', 'completude ETU-130', 'BLOCKING', JSON.stringify(completude0.body?.controles));
  }
  if (completude0.body?.qualiteChiffrage?.ratioComposantsAffichage === 'aucun composant') {
    pass('AC-4', 'ratio composants = « aucun composant »');
  } else {
    fail('AC-4', 'ratio composants', 'aucun composant', completude0.body?.qualiteChiffrage?.ratioComposantsAffichage);
  }

  const synthese0 = await api(h, 'GET', `/api/v1/etudes/dossiers/${zeroDeb.dossierId}/synthese`);
  if (synthese0.body?.anomaliesBloquantes >= 1) {
    pass('AC-1', `synthèse compteur=${synthese0.body.anomaliesBloquantes} (warning/bloquant visible)`);
  } else {
    fail('AC-1', 'compteur synthèse', '>= 1', synthese0.body?.anomaliesBloquantes);
  }

  const gagneRefuse = await api(h, 'POST', `/api/v1/etudes/dossiers/${zeroDeb.dossierId}/gagne`, {
    dateAttribution: '2026-08-28',
    devisId: zeroDeb.devisId,
    montantAttribue: zeroDeb.totalDevis,
  });
  if (gagneRefuse.status === 422 && gagneRefuse.body?.code === 'ETU-GATE') {
    pass('AC-2/AC-3', 'POST /gagne refusé 422 ETU-GATE');
  } else {
    fail('AC-2/AC-3', 'gagne refusé', '422 ETU-GATE', `${gagneRefuse.status} ${gagneRefuse.text}`);
  }

  // ── AC-2 : coûts partiellement estimés → gain avec motif ───────────────────
  const partiel = await creerDossierDevis(h, `${s}-p`, [
    { code: '1.1', libelle: 'Établi', quantite: 1, unite: 'U', origineCout: 'FORFAIT', coutUnitaire: 5000, prixUnitaire: 6000 },
    { code: '1.2', libelle: 'Estimé', quantite: 1, unite: 'U', origineCout: 'ESTIME', coutUnitaire: 400, prixUnitaire: 4000 },
  ]);

  const completudeP = await api(h, 'GET', `/api/v1/etudes/dossiers/${partiel.dossierId}/completude`);
  const etu120 = completudeP.body?.controles?.find((c) => c.code === 'ETU-120');
  if (etu120?.severite === 'WARNING') {
    pass('AC-2', 'GET /completude expose ETU-120 WARNING (coûts partiellement non établis)');
  } else {
    fail('AC-2', 'ETU-120', 'WARNING', JSON.stringify(completudeP.body?.controles));
  }

  const gagneSansMotif = await api(h, 'POST', `/api/v1/etudes/dossiers/${partiel.dossierId}/gagne`, {
    dateAttribution: '2026-08-28',
    devisId: partiel.devisId,
    montantAttribue: partiel.totalDevis,
  });
  if (gagneSansMotif.status === 422 && gagneSansMotif.body?.code?.includes('warnings_non_acceptes')) {
    pass('AC-2', 'gain sans acceptation refusé');
  } else {
    fail('AC-2', 'gain sans motif', '422 warnings_non_acceptes', `${gagneSansMotif.status} ${gagneSansMotif.text}`);
  }

  const gainPayload = {
    dateAttribution: '2026-08-28',
    devisId: partiel.devisId,
    montantAttribue: partiel.totalDevis,
    acceptWarnings: true,
    motifDerogation: 'Hypothèse commerciale validée en lab Mode B',
  };
  const gagneOk = await api(h, 'POST', `/api/v1/etudes/dossiers/${partiel.dossierId}/gagne`, gainPayload);
  if (gagneOk.ok && gagneOk.body?.status === 'GAGNE') {
    pass('AC-2', 'gain accepté avec motif → GAGNE');
  } else {
    fail('AC-2', 'gain accepté', 'GAGNE', `${gagneOk.status} ${gagneOk.text}`);
  }

  const replay = await api(h, 'POST', `/api/v1/etudes/dossiers/${partiel.dossierId}/gagne`, gainPayload);
  if (replay.ok && replay.body?.status === 'GAGNE') {
    pass('AC-2', 'replay identique idempotent');
  } else {
    fail('AC-2', 'replay gain', 'GAGNE', `${replay.status} ${replay.text}`);
  }

  console.log(`\n=== Bilan : ${PASSES} pass, ${FAILS} fail ===`);
  process.exit(FAILS > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
