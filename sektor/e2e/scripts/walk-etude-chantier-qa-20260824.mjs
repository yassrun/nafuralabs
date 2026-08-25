/**
 * Walk QA Mode B — étude (1 lot / 3 postes) → devis → GAGNE → chantier
 * + sondes achats / BL / ST / avancement.
 *
 * Run: node sektor/e2e/scripts/walk-etude-chantier-qa-20260824.mjs
 * Prérequis: API 8082 + cursor-session, front optionnel 4200.
 */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';

const anomalies = [];
const ok = [];

function note(kind, where, detail, expect, got) {
  anomalies.push({ kind, where, detail, expect, got });
  console.log(`ANOMALIE [${kind}] ${where}: ${detail}`);
  if (expect !== undefined) console.log(`  attendu: ${expect}`);
  if (got !== undefined) console.log(`  obtenu:  ${got}`);
}

function pass(step) {
  ok.push(step);
  console.log(`OK  ${step}`);
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

async function main() {
  console.log('=== Walk QA étude → chantier ===');
  console.log(`API ${API_BASE} · APP ${APP_BASE}`);

  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = await sessionRes.json();
  if (!session?.accessToken || !session?.tenantId) {
    throw new Error(`cursor-session KO: HTTP ${sessionRes.status}`);
  }
  pass(`session ${session.email ?? '?'} @ ${session.tenantSlug ?? '?'}`);
  const h = headers(session);
  const s = Date.now().toString(36);

  // ── 1. Étude + arbre ──────────────────────────────────────────────────────
  let ingenieurs = [];
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  if (ing.ok) ingenieurs = ing.body ?? [];
  const chargeEtudeUserId = ingenieurs[0]?.userId ?? session.userId;

  const dossier = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Walk QA chantier ${s}`,
    chargeEtudeUserId,
    clientNom: `MOA Walk ${s}`,
  });
  if (dossier.status !== 201) throw new Error(`dossier ${dossier.status} ${dossier.text}`);
  const dossierId = dossier.body.id;
  pass(`dossier créé ${dossier.body.numero ?? dossierId}`);

  const bordereau = await api(
    h,
    'POST',
    `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`,
  );
  if (!bordereau.ok) throw new Error(`bordereau ${bordereau.status} ${bordereau.text}`);
  const dpgfId = bordereau.body.dpgfId;
  pass(`bordereau manuel dpgfId=${dpgfId}`);

  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT',
    code: '1',
    libelle: 'Gros œuvre',
  });
  if (lot.status !== 201) throw new Error(`lot ${lot.status} ${lot.text}`);

  const posteDecompose = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE',
    parentId: lot.body.id,
    code: '1.1',
    libelle: 'Béton armé (décomposé)',
    quantite: 50,
    unite: 'm3',
    origineCout: 'DECOMPOSE',
    fraisGenerauxPercent: 10,
    margePercent: 17.5,
  });
  if (posteDecompose.status !== 201) {
    throw new Error(`poste DECOMPOSE ${posteDecompose.status} ${posteDecompose.text}`);
  }

  const posteForfaitSt = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE',
    parentId: lot.body.id,
    code: '1.2',
    libelle: 'Étanchéité toiture (forfait ST)',
    quantite: 1,
    unite: 'fft',
    origineCout: 'FORFAIT',
    coutUnitaire: 85000,
    fraisGenerauxPercent: 8,
    margePercent: 12,
  });
  if (posteForfaitSt.status !== 201) {
    throw new Error(`poste FORFAIT ${posteForfaitSt.status} ${posteForfaitSt.text}`);
  }

  const posteEstime = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE',
    parentId: lot.body.id,
    code: '1.3',
    libelle: 'Aléas chantier (estimé)',
    quantite: 1,
    unite: 'fft',
    origineCout: 'ESTIME',
    coutUnitaire: 15000,
    fraisGenerauxPercent: 10,
    margePercent: 15,
  });
  if (posteEstime.status !== 201) {
    throw new Error(`poste ESTIME ${posteEstime.status} ${posteEstime.text}`);
  }
  pass('1 lot + 3 postes (DECOMPOSE / FORFAIT ST / ESTIME)');

  // DPU + composants sur le poste décomposé
  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', {
    dpgfNoeudId: posteDecompose.body.id,
  });
  if (dpu.status !== 201 && !dpu.ok) {
    note('bug', 'études/dpu', 'création DPU échoue', '201', `${dpu.status} ${dpu.text}`);
  } else {
    const dpuId = dpu.body.id;
    const comps = [
      { type: 'MATIERE', libelle: 'Ciment CPJ', rendement: 350, unite: 'KG', prixUnitaire: 1.2 },
      { type: 'MAIN_DOEUVRE', libelle: 'Coffreur', rendement: 0.4, unite: 'H', prixUnitaire: 45 },
      { type: 'MATERIEL', libelle: 'Bétonnière', rendement: 0.05, unite: 'J', prixUnitaire: 280 },
      {
        type: 'SOUS_TRAITANCE',
        libelle: 'Ferraillage ST',
        rendement: 1,
        unite: 'T',
        prixUnitaire: 9200,
      },
    ];
    for (const c of comps) {
      const line = await api(h, 'POST', `/api/v1/etudes/dpu/${dpuId}/composants`, {
        ...c,
        referenceType: 'LIBRE',
        sourcePrix: 'MANUEL',
      });
      if (line.status !== 201) {
        note('bug', 'études/dpu/composants', `composant ${c.type}`, '201', `${line.status} ${line.text}`);
      }
    }
    const recompute = await api(h, 'POST', `/api/v1/etudes/dpu/${dpuId}/recompute`);
    if (!recompute.ok) {
      note(
        'bug',
        'études/dpu',
        'POST /recompute après composants',
        '200 + prix',
        `${recompute.status} ${recompute.text?.slice?.(0, 200)}`,
      );
    } else {
      pass(`DPU 4 composants + recompute (prix=${recompute.body?.prixVenteHt ?? recompute.body?.prixUnitaireHt ?? '?'})`);
    }
  }

  // ── 2. Cycle devis ────────────────────────────────────────────────────────
  const partner = await api(h, 'POST', '/api/v1/partners', {
    code: `WALK${s}`.slice(0, 20),
    raisonSociale: `Client Walk ${s}`,
    roles: ['CLIENT'],
  });
  if (partner.status !== 201) throw new Error(`partner ${partner.status} ${partner.text}`);
  const clientId = partner.body.id;

  const etape = await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  if (!etape.ok) note('bug', 'études/etape', 'passage étape 2', '2xx', `${etape.status} ${etape.text}`);

  const soumettre = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  if (!soumettre.ok) {
    note('bug', 'études/soumettre', 'soumission', '2xx', `${soumettre.status} ${soumettre.text}`);
  } else {
    pass(`soumis status=${soumettre.body?.status}`);
  }

  let valider = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (!valider.ok) {
    note('bug', 'études/valider', '1ère validation', '2xx', `${valider.status} ${valider.text}`);
  }
  if (valider.body?.status === 'EN_VALIDATION') {
    valider = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  }
  if (valider.body?.status !== 'VALIDEE') {
    note('bug', 'études/valider', 'statut final', 'VALIDEE', valider.body?.status);
  } else {
    pass('étude VALIDEE');
  }

  const devis = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, {
    clientId,
  });
  if (!devis.ok) {
    note('bug', 'études/generer-devis', 'génération', '2xx', `${devis.status} ${devis.text}`);
  } else {
    pass(`devis généré status=${devis.body?.status ?? '?'}`);
  }

  const gagne = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: '2026-08-24',
    referenceMarche: `MA-WALK-${s}`,
    montantAttribue: 500000,
  });
  if (!gagne.ok || gagne.body?.status !== 'GAGNE') {
    note('bug', 'études/gagne', 'marquer gagné', 'GAGNE', `${gagne.status} ${gagne.body?.status}`);
  } else {
    pass('étude GAGNE');
  }

  // ── 3. Conversion chantier ────────────────────────────────────────────────
  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {
    code: `CH-WALK-${s}`.slice(0, 30),
    dateDemarrage: '2026-09-01',
    dureeJours: 180,
  });
  if (!conv.ok) {
    note('bug', 'études/convertir', 'conversion', '2xx + chantier', `${conv.status} ${conv.text}`);
    console.log(JSON.stringify({ anomalies, ok }, null, 2));
    process.exit(1);
  }
  const chantierId = conv.body?.chantierId ?? conv.body?.id;
  if (!chantierId) {
    note('bug', 'études/convertir', 'pas de chantierId dans la réponse', 'uuid', JSON.stringify(conv.body));
  } else {
    pass(`chantier créé ${chantierId}`);
  }

  const fiche = await api(h, 'GET', `/api/v1/chantiers/${chantierId}`);
  if (!fiche.ok) {
    note('bug', 'chantiers/GET', 'fiche', '200', `${fiche.status}`);
  } else {
    if (fiche.body?.status !== 'EN_PREPARATION') {
      note('fonctionnel', 'chantiers/status', 'naissance', 'EN_PREPARATION', fiche.body?.status);
    } else {
      pass('chantier EN_PREPARATION');
    }
  }

  // arbre (= lots plats ou tree ; pas d’endpoint /arbre)
  let arbreRes = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/lots`);
  if (!arbreRes.ok) {
    note('bug', 'chantiers/arbre', 'lecture lots', '200', `${arbreRes.status} ${arbreRes.text}`);
  } else {
    const flat = JSON.stringify(arbreRes.body);
    const hasVendu = /VENDU/i.test(flat);
    const hasNature = /nature/i.test(flat);
    if (!hasNature) {
      note('fonctionnel', 'chantiers/arbre', 'nature absente de la réponse lots', 'nature VENDU/INTERNE', 'pas de champ nature');
    } else if (!hasVendu) {
      note('fonctionnel', 'chantiers/arbre', 'pas de nœud VENDU après conversion', 'VENDU', flat.slice(0, 200));
    } else {
      pass('lots chantier lus (nature présente)');
    }
    if (/Gros Å|Gros Ã/.test(flat)) {
      note('bug', 'chantiers/encodage', 'mojibake sur designation lot', 'Gros œuvre', flat.match(/Gros[^"]*/)?.[0]);
    }
  }

  // marché ne doit pas exister
  const marches = await api(h, 'GET', `/api/v1/marches?chantierId=${chantierId}`);
  if (marches.ok) {
    const list = Array.isArray(marches.body) ? marches.body : marches.body?.content ?? [];
    if (list.length > 0) {
      note('fonctionnel', 'marchés', 'marché créé à la conversion', '0 marché', `${list.length}`);
    } else {
      pass('aucun marché à la conversion');
    }
  }

  // budget
  const budget = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget-arbre`);
  if (!budget.ok) {
    const budgetAlt = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/budget`);
    if (!budgetAlt.ok) {
      note('bug', 'chantiers/budget', 'lecture budget', '200', `arbre=${budget.status} budget=${budgetAlt.status}`);
    } else {
      pass(`budget lu via /budget (${budgetAlt.status})`);
    }
  } else {
    pass('budget-arbre lu');
    const flatBudget = JSON.stringify(budget.body);
    if (!/DECOMPOSE/.test(flatBudget) || !/FORFAIT/.test(flatBudget) || !/ESTIME/.test(flatBudget)) {
      note(
        'fonctionnel',
        'chantiers/budget-arbre',
        'origines DECOMPOSE/FORFAIT/ESTIME absentes ou incomplètes',
        '3 origines',
        flatBudget.slice(0, 300),
      );
    }
    if (/Gros \u00c5\u201cuvre|Gros Ã¦uvre|Gros Ã…uvre/i.test(flatBudget) || /Gros Å/.test(flatBudget)) {
      note('bug', 'chantiers/encodage', 'mojibake sur libellé lot (œuvre)', 'Gros œuvre', 'libellé corrompu');
    }
  }

  // ── 4. Achats / BL / ST — sondes surface ───────────────────────────────────
  const consultations = await api(h, 'GET', '/api/v1/consultations-achat?page=0&size=5');
  if (!consultations.ok) {
    note('bug', 'achats/consultations', 'listing', '200', `${consultations.status}`);
  } else {
    pass('listing consultations OK');
  }

  const da = await api(h, 'GET', '/api/v1/demandes-achat?page=0&size=5');
  if (!da.ok) {
    note('ux', 'achats/DA', 'listing DA KO', '200', `${da.status}`);
  } else {
    pass('listing DA OK');
  }

  // Réceptions = sous-ressource d’un BC (pas de listing BL global)
  const bc = await api(h, 'GET', `/api/v1/bons-commande-achat?chantierId=${chantierId}`);
  if (!bc.ok) {
    note('bug', 'achats/BC', 'listing BC chantier', '200', `${bc.status}`);
  } else {
    pass('listing BC chantier OK (réceptions via /bons-commande-achat/{id}/receptions)');
  }

  const st = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/sous-traitances`);
  if (!st.ok) {
    note(
      'fonctionnel',
      'sous-traitance',
      'GET /chantiers/{id}/sous-traitances KO',
      '200 + liste',
      `${st.status}`,
    );
  } else {
    pass(`sous-traitances chantier lisibles (n=${Array.isArray(st.body) ? st.body.length : '?'})`);
  }

  // ── 5. Avancement / attachement / situation ───────────────────────────────
  const av = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/avancements`);
  if (!av.ok) {
    const av2 = await api(h, 'GET', `/api/v1/avancements-physiques?chantierId=${chantierId}`);
    if (!av2.ok) {
      note('bug', 'avancement', 'listing', '200', `${av.status}/${av2.status}`);
    } else {
      pass('avancements listés');
    }
  } else {
    pass('avancements listés');
  }

  const att = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/attachements`);
  if (!att.ok) {
    note('bug', 'attachement', 'listing', '200', `${att.status} ${att.text}`);
  } else {
    pass('attachements listés');
  }

  const sit = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/situations`);
  if (!sit.ok) {
    note('bug', 'situation', 'listing', '200', `${sit.status} ${sit.text}`);
  } else {
    pass('situations listées');
  }

  // ── 6. UI smoke (front) ───────────────────────────────────────────────────
  try {
    const front = await fetch(APP_BASE, { method: 'GET' });
    if (!front.ok) {
      note('ux', 'front', 'app down', '200', String(front.status));
    } else {
      pass(`front ${APP_BASE} répond`);
      const deep = await fetch(`${APP_BASE}/chantiers/${chantierId}`, { redirect: 'manual' });
      // SPA often 200 for any path
      if (deep.status >= 500) {
        note('ux', 'front/chantier', 'route chantier 5xx', '<500', String(deep.status));
      } else {
        pass(`route /chantiers/${chantierId} HTTP ${deep.status}`);
      }
    }
  } catch (e) {
    note('ux', 'front', 'front injoignable', APP_BASE, String(e.message));
  }

  // ── Rapport ───────────────────────────────────────────────────────────────
  console.log('\n=== RAPPORT ===');
  console.log(`dossierId=${dossierId}`);
  console.log(`chantierId=${chantierId}`);
  console.log(`OK: ${ok.length} · anomalies: ${anomalies.length}`);
  if (anomalies.length) {
    console.log(JSON.stringify(anomalies, null, 2));
  }
  console.log(
    '\nLimite: walk API + smoke front. Pas de clic Playwright (Browser MCP absent). ' +
      'Ouvre http://127.0.0.1:4200 (auto-login QA) → étude puis chantier pour UX fine.',
  );
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
