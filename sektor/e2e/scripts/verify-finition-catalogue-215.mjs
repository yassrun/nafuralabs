/**
 * SEKTOR-215 — décision Catalogue persistée sur composants LIBRE (AC-10).
 *
 * Run: node sektor/e2e/scripts/verify-finition-catalogue-215.mjs
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

async function itemCount(h) {
  const r = await api(h, 'GET', '/api/v1/items/count');
  return Number(r.body ?? 0);
}

async function creerDossierDevisLibre(h, suffix, libelles) {
  const ingenieurs = (await api(h, 'GET', '/api/v1/etudes/ingenieurs')).body ?? [];
  const chargeEtudeUserId = ingenieurs[0]?.userId;
  const dossier = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Catalogue 215 ${suffix}`,
    chargeEtudeUserId,
    clientNom: `MOA CAT215 ${suffix}`,
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

  const article = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE',
    parentId: lot.body.id,
    code: '1.1',
    libelle: 'Poste décomposé',
    quantite: 1,
    unite: 'U',
    origineCout: 'DECOMPOSE',
    fraisGenerauxPercent: 5,
    margePercent: 10,
  });
  if (article.status !== 201) throw new Error(`article ${article.status} ${article.text}`);

  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', {
    dpgfNoeudId: article.body.id,
  });
  if (dpu.status !== 201) throw new Error(`dpu ${dpu.status} ${dpu.text}`);
  const dpuId = dpu.body.id;

  for (const libelle of libelles) {
    const line = await api(h, 'POST', `/api/v1/etudes/dpu/${dpuId}/composants`, {
      type: 'MATIERE',
      referenceType: 'LIBRE',
      libelle,
      rendement: 1,
      unite: 'KG',
      prixUnitaire: 10,
      sourcePrix: 'MANUEL',
    });
    if (line.status !== 201) throw new Error(`composant ${libelle} ${line.status} ${line.text}`);
  }

  await api(h, 'POST', `/api/v1/etudes/dpu/${dpuId}/recompute`);
  const listed = await api(h, 'GET', `/api/v1/etudes/dpu/${dpuId}/composants`);
  if (!listed.ok || !Array.isArray(listed.body)) {
    throw new Error(`liste composants ${listed.status} ${listed.text}`);
  }
  const byLibelle = new Map(listed.body.map((c) => [c.libelle, c.id]));
  const composantIds = libelles.map((lib) => {
    const id = byLibelle.get(lib);
    if (!id) throw new Error(`composant introuvable après création: ${lib}`);
    return id;
  });
  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 5 });

  return { dossierId, dpuId, composantIds, libelles };
}

async function finaliserDevis(h, dossierId) {
  const soumettre = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  if (!soumettre.ok) throw new Error(`soumettre ${soumettre.status} ${soumettre.text}`);
  let valider = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (valider.body?.status === 'EN_VALIDATION') {
    valider = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  }
  if (valider.body?.status !== 'VALIDEE') throw new Error(`valider ${valider.body?.status}`);

  const partner = await api(h, 'POST', '/api/v1/partners', {
    code: `C215${Date.now().toString(36)}`.slice(0, 20),
    raisonSociale: `Client CAT215 ${Date.now().toString(36)}`,
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
  return { devisId, totalDevis: devisDetail.body?.totalHt };
}

async function main() {
  console.log('=== SEKTOR-215 — décision Catalogue LIBRE (Mode B) ===');
  const owner = await session();
  const h = headers(owner);
  const s = Date.now().toString(36);

  const libelleCree = `Ciment CPJ 215 ${s}`;
  const libelleIgnore = `Sable 0/5 215 ${s}`;
  const ctx = await creerDossierDevisLibre(h, s, [libelleCree, libelleIgnore]);
  const { dossierId, composantIds } = ctx;
  const [compCree, compIgnore] = composantIds;

  // ── LIBRE sans décision → ETU-131 WARNING ─────────────────────────────────
  const completudeAvant = await api(h, 'GET', `/api/v1/etudes/dossiers/${dossierId}/completude`);
  const etu131 = completudeAvant.body?.controles?.find((c) => c.code === 'ETU-131');
  if (etu131?.severite === 'WARNING') {
    pass('AC-10', 'ETU-131 WARNING tant que LIBRE sans décision');
  } else {
    fail('AC-10', 'ETU-131', 'WARNING', JSON.stringify(completudeAvant.body?.controles));
  }

  // ── Créer et lier un LIBRE (dossier encore modifiable) ────────────────────
  const countBefore = await itemCount(h);
  const creer1 = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/rattrapage/creer`, {
    composantIds: [compCree],
    libelle: libelleCree,
    nature: 'MATIERE',
    uomCode: 'KG',
  });
  if (creer1.status !== 201 || !creer1.body?.itemId) {
    fail('AC-10', 'rattrapage/creer', '201 + itemId', `${creer1.status} ${creer1.text}`);
  } else {
    pass('AC-10', `LIBRE créé et lié → item ${creer1.body.itemId}`);
  }
  const itemId = creer1.body?.itemId;
  const countAfterFirst = await itemCount(h);

  const creer2 = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/rattrapage/creer`, {
    composantIds: [compCree],
    libelle: libelleCree,
    nature: 'MATIERE',
    uomCode: 'KG',
  });
  const countAfterSecond = await itemCount(h);
  if (creer2.ok && creer2.body?.itemId === itemId && countAfterSecond === countAfterFirst) {
    pass('AC-10', 'double creer idempotent — pas de second item');
  } else {
    fail('AC-10', 'idempotence creer', `itemId=${itemId}, count stable`, `${creer2.body?.itemId}, ${countAfterFirst}→${countAfterSecond}`);
  }

  const itemDetail = await api(h, 'GET', `/api/v1/items/${itemId}`);
  if (itemDetail.ok && itemDetail.body?.id) {
    pass('AC-10', `navigation Catalogue GET /items/${itemId}`);
  } else {
    fail('AC-10', 'item catalogue', itemId, `${itemDetail.status}`);
  }

  // ── Ignorer un LIBRE avec motif ───────────────────────────────────────────
  const ignorerSansMotif = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/rattrapage/ignorer`, {
    composantIds: [compIgnore],
  });
  if (ignorerSansMotif.status === 400) {
    pass('AC-10', 'ignorer sans motif refusé 400');
  } else {
    fail('AC-10', 'ignorer sans motif', '400', `${ignorerSansMotif.status}`);
  }

  const motifIgnore = 'Équivalent local';
  const ignorer = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/rattrapage/ignorer`, {
    composantIds: [compIgnore],
    motif: motifIgnore,
  });
  if (ignorer.ok) {
    pass('AC-10', `LIBRE ignoré avec motif « ${motifIgnore} »`);
  } else {
    fail('AC-10', 'ignorer avec motif', '200', `${ignorer.status} ${ignorer.text}`);
  }

  // ── Devis puis gain + conversion ───────────────────────────────────────────
  const devis = await finaliserDevis(h, dossierId);

  const gagne = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: '2026-08-28',
    devisId: devis.devisId,
    montantAttribue: devis.totalDevis,
  });
  if (!gagne.ok || gagne.body?.status !== 'GAGNE') {
    throw new Error(`gagne ${gagne.status} ${gagne.text}`);
  }

  const convertir = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {
    libelleChantier: `Chantier CAT215 ${s}`,
  });
  if (!convertir.ok) throw new Error(`convertir ${convertir.status} ${convertir.text}`);

  const synthese = await api(h, 'GET', `/api/v1/etudes/dossiers/${dossierId}/synthese`);
  const decisions = synthese.body?.decisionsCatalogue ?? [];
  const traceCree = decisions.find((d) => d.decision === 'CREE_ET_LIE' && d.libelle?.includes('Ciment'));
  const traceIgnore = decisions.find((d) => d.decision === 'IGNORE_MOTIF' && d.motif === motifIgnore);

  if (synthese.body?.status === 'CONVERTIE' && traceCree?.itemId) {
    pass('AC-10', 'synthèse CONVERTIE : trace CREE_ET_LIE + itemId');
  } else {
    fail('AC-10', 'trace créé après conversion', 'CREE_ET_LIE + itemId', JSON.stringify(traceCree));
  }

  if (traceIgnore?.motif === motifIgnore) {
    pass('AC-10', 'synthèse CONVERTIE : motif ignore visible');
  } else {
    fail('AC-10', 'trace ignore', motifIgnore, JSON.stringify(traceIgnore));
  }

  if (decisions.length >= 2 && traceCree?.acteur && traceCree?.date) {
    pass('AC-10', 'trace acteur + date persistés');
  } else {
    fail('AC-10', 'acteur/date', 'présents', JSON.stringify(decisions));
  }

  console.log(`\n=== ${PASSES} pass · ${FAILS} fail ===`);
  process.exit(FAILS > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
