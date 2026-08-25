/**
 * Planning activités — SEKTOR-176 / SEKTOR-177 (CONTRAT planning-activites).
 *
 * Discrimination (25/08 00:23) : POST /activites → 404 avant implémentation
 *   {"code":"NOT_FOUND","message":"No static resource api/v1/chantiers/dummy/activites."}
 *
 * Scénarios CONTRAT :
 *   1. Palier 1 intact — chantier sans activité : POST avancement nœud → 2xx (AC-11)
 *   2. Créer + rattacher quotité OK ; 2ᵉ activité dépasse → 4xx (AC-7)
 *   3. Couverture : avancement direct refusé ; quantité sur activité → cumul nœud (AC-8..AC-10)
 *   4. WBS + zone optionnelle (AC-2, AC-3)
 *
 * Run: node sektor/e2e/scripts/verify-planning-activites-20260825.mjs
 * Prérequis: API 8082 + cursor-session.
 */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

const results = { at: new Date().toISOString(), status: 'RUNNING', steps: [], rougeAvant: true };

function step(id, ac, pass, detail) {
  results.steps.push({ id, ac, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id} (${ac}): ${detail}`);
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

async function seedChantier(h, s) {
  let ingenieurs = [];
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  if (ing.ok) ingenieurs = ing.body ?? [];
  const chargeEtudeUserId = ingenieurs[0]?.userId ?? sessionUserId(h);

  const dossier = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Planning activités QA ${s}`,
    chargeEtudeUserId,
    clientNom: `MOA Planif ${s}`,
  });
  if (dossier.status !== 201) throw new Error(`dossier ${dossier.status} ${dossier.text}`);
  const dossierId = dossier.body.id;

  const bordereau = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  if (!bordereau.ok) throw new Error(`bordereau ${bordereau.status} ${bordereau.text}`);
  const dpgfId = bordereau.body.dpgfId;

  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'LOT',
    code: '1',
    libelle: 'Gros oeuvre',
  });
  if (lot.status !== 201) throw new Error(`lot ${lot.status} ${lot.text}`);

  const poste = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE',
    parentId: lot.body.id,
    code: '1.1',
    libelle: 'Beton B25',
    quantite: 100,
    unite: 'm3',
    origineCout: 'FORFAIT',
    coutUnitaire: 900,
    fraisGenerauxPercent: 8,
    margePercent: 10,
  });
  if (poste.status !== 201) throw new Error(`poste ${poste.status} ${poste.text}`);

  const partner = await api(h, 'POST', '/api/v1/partners', {
    code: `PA${s}`.slice(0, 20),
    raisonSociale: `Client Planif ${s}`,
    roles: ['CLIENT'],
  });
  if (partner.status !== 201) throw new Error(`partner ${partner.status}`);
  const clientId = partner.body.id;

  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  let valider = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (valider.body?.status === 'EN_VALIDATION') {
    valider = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  }
  if (valider.body?.status !== 'VALIDEE') {
    throw new Error(`étude non VALIDEE: ${valider.body?.status}`);
  }
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId });
  const gagne = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: '2026-08-25',
    referenceMarche: `MA-PL-${s}`,
    montantAttribue: 100000,
  });
  if (!gagne.ok || gagne.body?.status !== 'GAGNE') {
    throw new Error(`gagne KO: ${gagne.status} ${gagne.body?.status}`);
  }
  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {
    code: `CH-PL-${s}`.slice(0, 30),
    dateDemarrage: '2026-09-01',
    dureeJours: 90,
  });
  if (!conv.ok) throw new Error(`convertir ${conv.status} ${conv.text}`);
  const chantierId = conv.body?.chantierId ?? conv.body?.id;
  if (!chantierId) throw new Error('pas de chantierId');

  const lots = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/lots`);
  if (!lots.ok) throw new Error(`lots ${lots.status}`);
  const lotRows = Array.isArray(lots.body) ? lots.body : lots.body?.content ?? [];
  let posteId = null;
  let lotId = null;
  let quantite = null;
  for (const l of lotRows) {
    const postes = await api(h, 'GET', `/api/v1/lots/${l.id}/postes-budgetaires`);
    const list = Array.isArray(postes.body) ? postes.body : [];
    const beton = list.find((p) => /Beton|Béton|B25/i.test(p.designation ?? p.libelle ?? ''));
    if (beton) {
      posteId = beton.id;
      lotId = l.id;
      quantite = Number(beton.quantite);
      break;
    }
    if (!posteId && list[0]) {
      posteId = list[0].id;
      lotId = l.id;
      quantite = Number(list[0].quantite);
    }
  }
  if (!posteId) throw new Error('poste budgetaire introuvable après conversion');

  return { chantierId, posteId, lotId, quantite: quantite || 100 };
}

function sessionUserId(h) {
  // fallback — cursor session usually has userId on body, stored later
  return h._userId ?? 'qa-user';
}

async function main() {
  console.log('=== planning-activites e2e ===');
  console.log(`API ${API_BASE}`);
  console.log('ROUGE AVANT (25/08): POST /activites → 404 No static resource');

  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = await sessionRes.json();
  if (!session?.accessToken || !session?.tenantId) {
    throw new Error(`cursor-session KO: HTTP ${sessionRes.status}`);
  }
  const h = headers(session);
  h._userId = session.userId;
  const s = Date.now().toString(36);

  const ctx = await seedChantier(h, s);
  const { chantierId, posteId, quantite } = ctx;
  step('seed', '-', true, `chantier=${chantierId} poste=${posteId} qty=${quantite}`);

  // ── Scénario 1 — Palier 1 (AC-11) ─────────────────────────────────────────
  {
    const av = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
      date: '2026-09-05',
      status: 'BROUILLON',
      saisieParId: session.userId ?? 'qa',
      saisieParName: 'QA',
      entries: [{ posteId, quantiteRealisee: 5 }],
    });
    step(
      'palier1-avancement-direct',
      'AC-11',
      av.ok,
      `POST avancement sans activité → ${av.status} ${av.ok ? 'OK' : av.text?.slice?.(0, 180)}`,
    );
  }

  // ── Scénario 2 + 4 — activité, WBS, zone, quotité (AC-1..AC-7) ───────────
  let act1Id;
  let zoneId;
  {
    const zone = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/zones`, {
      designation: 'R+1',
      ordre: 1,
    });
    step('zone-create', 'AC-3', zone.ok, `POST zone → ${zone.status}`);
    zoneId = zone.body?.id;

    const parent = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites`, {
      libelle: 'Phase structure',
      dateDebut: '2026-09-01',
      dateFin: '2026-09-30',
      ordre: 1,
    });
    step('activite-parent', 'AC-1/AC-2', parent.status === 201, `POST parent → ${parent.status}`);
    const parentId = parent.body?.id;

    const act = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites`, {
      libelle: 'Coffrage R+1',
      dateDebut: '2026-09-01',
      dateFin: '2026-09-15',
      parentActiviteId: parentId,
      zoneId,
      ordre: 2,
    });
    step(
      'activite-enfant-zone',
      'AC-2/AC-3/AC-4',
      act.status === 201 && act.body?.parentActiviteId === parentId && act.body?.zoneId === zoneId,
      `POST enfant+zone → ${act.status} parent=${act.body?.parentActiviteId} zone=${act.body?.zoneId}`,
    );
    act1Id = act.body?.id;

    const rattOk = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/${act1Id}/rattachements`, {
      posteId,
      quantitePrevue: 50,
    });
    step(
      'rattachement-50',
      'AC-6',
      rattOk.status === 201 && Number(rattOk.body?.quantitePrevue) === 50,
      `rattacher 50/${quantite} → ${rattOk.status}`,
    );

    const act2 = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites`, {
      libelle: 'Coulage R+1',
      dateDebut: '2026-09-16',
      dateFin: '2026-09-20',
      parentActiviteId: parentId,
      ordre: 3,
    });
    const act2Id = act2.body?.id;
    const rattKo = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/${act2Id}/rattachements`, {
      posteId,
      quantitePrevue: 60,
    });
    step(
      'quotite-depassement',
      'AC-7',
      rattKo.status >= 400 && rattKo.status < 500,
      `rattacher 60 (reste 50) → ${rattKo.status} ${JSON.stringify(rattKo.body?.message ?? rattKo.body)?.slice(0, 120)}`,
    );

    const jalon = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites`, {
      libelle: 'Séchage dalle',
      dateDebut: '2026-09-21',
      dateFin: '2026-09-23',
      ordre: 4,
    });
    const jalonId = jalon.body?.id;
    const pct = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/${jalonId}/avancements`, {
      date: '2026-09-21',
      avancementPercent: 40,
      saisieParId: session.userId ?? 'qa',
      status: 'BROUILLON',
    });
    step(
      'avancement-percent-sans-noeud',
      'AC-9',
      pct.status === 201 && Number(pct.body?.avancementPercent) === 40,
      `jalon % sans nœud → ${pct.status} pct=${pct.body?.avancementPercent}`,
    );

    const prec = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/precedences`, {
      predActiviteId: act1Id,
      succActiviteId: act2Id,
      typeLien: 'FD',
    });
    step('precedence-fd', 'AC-4', prec.status === 201 && prec.body?.typeLien === 'FD', `FD → ${prec.status}`);

    const cycle = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/precedences`, {
      predActiviteId: act2Id,
      succActiviteId: act1Id,
      typeLien: 'FD',
    });
    step('precedence-cycle', 'AC-4', cycle.status >= 400, `cycle refusé → ${cycle.status}`);
  }

  // ── Scénario 3 — couverture + remontée (AC-8..AC-10) ─────────────────────
  {
    const direct = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
      date: '2026-09-06',
      status: 'BROUILLON',
      saisieParId: session.userId ?? 'qa',
      entries: [{ posteId, quantiteRealisee: 3 }],
    });
    const refused =
      direct.status >= 400 &&
      String(direct.body?.message ?? direct.text ?? '').includes('noeud_couvert_par_activite');
    step(
      'couverture-refus-direct',
      'AC-8',
      refused,
      `POST avancement direct sur nœud couvert → ${direct.status} ${String(direct.body?.message ?? '').slice(0, 100)}`,
    );

    const viaAct = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/${act1Id}/avancements`, {
      date: '2026-09-06',
      quantiteRealisee: 10,
      saisieParId: session.userId ?? 'qa',
      saisieParName: 'QA',
      status: 'BROUILLON',
    });
    step(
      'avancement-via-activite',
      'AC-9/AC-10',
      viaAct.status === 201,
      `POST quantité sur activité → ${viaAct.status} cumul=${viaAct.body?.cumulQuantite ?? '?'}`,
    );

    const dernier = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/avancements/dernier`);
    const row = (Array.isArray(dernier.body) ? dernier.body : []).find((r) => r.posteId === posteId);
    // palier1 avait 5 ; +10 via activité → cumul 15
    const cumulOk = row && Number(row.cumulQuantite) >= 15;
    step(
      'cumul-noeud',
      'AC-10',
      !!cumulOk,
      `cumul nœud=${row?.cumulQuantite ?? 'absent'} (attendu ≥15)`,
    );
  }

  const failed = results.steps.filter((x) => !x.pass);
  results.status = failed.length ? 'FAIL' : 'PASS';
  console.log(JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  results.status = 'ERROR';
  results.error = String(e);
  console.log(JSON.stringify(results, null, 2));
  process.exit(1);
});
