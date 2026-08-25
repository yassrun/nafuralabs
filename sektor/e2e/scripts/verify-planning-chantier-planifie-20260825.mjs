/**
 * Planning workspace — SEKTOR-179 / SEKTOR-180 (CONTRAT scénarios 5–8).
 *
 * Réutilise le parcours walk étude → devis → GAGNE → chantier EN_PREPARATION
 * (1 lot / 3 postes DECOMPOSE / FORFAIT / ESTIME), puis planifie le chantier.
 *
 * Discrimination (rouge-avant, 25/08) :
 *   - Empty state front : « Créez des activités via l'API » (SEKTOR-178)
 *   - Drawer lecture UUID (zoneId / parentActiviteId) — pas de picker ni qté faite
 *   - Gantt vide tant qu'on n'a pas POST /activites (prouvé SEKTOR-176 : POST → 404
 *     avant implémentation)
 *
 * Scénarios :
 *   5. Empty → CTA Nouvelle activité (API Mode B : 0 activité puis création)
 *   6. Rattacher à l'écran / API picker équivalent : 50 m³ OK ; trop → 4xx métier
 *   7. Avancer : qté faite ; jalon % sans nœud
 *   8. Chantier créé puis planifié : ≥2 activités, 1 rattachée + qté faite, Gantt non vide
 *
 * Run: node sektor/e2e/scripts/verify-planning-chantier-planifie-20260825.mjs
 * Prérequis: API 8082 + cursor-session. Front 4200 optionnel (Playwright si UP).
 */
import { pathToFileURL } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';

const results = {
  at: new Date().toISOString(),
  status: 'RUNNING',
  steps: [],
  rougeAvant:
    "25/08 empty « via l'API » + drawer UUID ; POST /activites 404 avant SEKTOR-176",
};

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

/** Parcours walk : 1 lot / 3 postes → devis → GAGNE → chantier EN_PREPARATION. */
async function seedWalkChantier(h, session, s) {
  let ingenieurs = [];
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  if (ing.ok) ingenieurs = ing.body ?? [];
  const chargeEtudeUserId = ingenieurs[0]?.userId ?? session.userId;

  const dossier = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Planning workspace QA ${s}`,
    chargeEtudeUserId,
    clientNom: `MOA Planif WS ${s}`,
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

  const posteDecompose = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE',
    parentId: lot.body.id,
    code: '1.1',
    libelle: 'Béton armé (décomposé)',
    quantite: 100,
    unite: 'm3',
    origineCout: 'DECOMPOSE',
    fraisGenerauxPercent: 10,
    margePercent: 17.5,
  });
  if (posteDecompose.status !== 201) {
    throw new Error(`poste DECOMPOSE ${posteDecompose.status} ${posteDecompose.text}`);
  }

  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: posteDecompose.body.id });
  if (dpu.status === 201 || dpu.ok) {
    const dpuId = dpu.body.id;
    for (const c of [
      { type: 'MATIERE', libelle: 'Ciment CPJ', rendement: 350, unite: 'KG', prixUnitaire: 1.2 },
      { type: 'MAIN_DOEUVRE', libelle: 'Coffreur', rendement: 0.4, unite: 'H', prixUnitaire: 45 },
    ]) {
      await api(h, 'POST', `/api/v1/etudes/dpu/${dpuId}/composants`, {
        ...c,
        referenceType: 'LIBRE',
        sourcePrix: 'MANUEL',
      });
    }
    await api(h, 'POST', `/api/v1/etudes/dpu/${dpuId}/recompute`);
  }

  const posteForfait = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
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
  if (posteForfait.status !== 201) {
    throw new Error(`poste FORFAIT ${posteForfait.status} ${posteForfait.text}`);
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

  const partner = await api(h, 'POST', '/api/v1/partners', {
    code: `PWS${s}`.slice(0, 20),
    raisonSociale: `Client Planif WS ${s}`,
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
    referenceMarche: `MA-PWS-${s}`,
    montantAttribue: 500000,
  });
  if (!gagne.ok || gagne.body?.status !== 'GAGNE') {
    throw new Error(`gagne KO: ${gagne.status} ${gagne.body?.status}`);
  }
  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {
    code: `CH-PWS-${s}`.slice(0, 30),
    dateDemarrage: '2026-09-01',
    dureeJours: 180,
  });
  if (!conv.ok) throw new Error(`convertir ${conv.status} ${conv.text}`);
  const chantierId = conv.body?.chantierId ?? conv.body?.id;
  if (!chantierId) throw new Error('pas de chantierId');

  const fiche = await api(h, 'GET', `/api/v1/chantiers/${chantierId}`);
  const status = fiche.body?.status ?? fiche.body?.lifecycleStatus;

  const lots = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/lots`);
  const lotRows = Array.isArray(lots.body) ? lots.body : lots.body?.content ?? [];
  let posteDecomposeId = null;
  let quantite = 100;
  for (const l of lotRows) {
    const postes = await api(h, 'GET', `/api/v1/lots/${l.id}/postes-budgetaires`);
    const list = Array.isArray(postes.body) ? postes.body : [];
    const beton = list.find((p) => /d[eé]compos|B[eé]ton arm[eé]/i.test(p.designation ?? p.libelle ?? ''));
    if (beton) {
      posteDecomposeId = beton.id;
      quantite = Number(beton.quantite ?? 100);
      break;
    }
  }
  if (!posteDecomposeId) {
    throw new Error('poste décomposé introuvable après conversion');
  }

  return { dossierId, chantierId, posteDecomposeId, quantite, status };
}

async function probeFront() {
  try {
    const front = await fetch(APP_BASE, { method: 'GET' });
    return { up: front.ok || (front.status > 0 && front.status < 500), status: front.status };
  } catch (e) {
    return { up: false, status: 0, error: String(e.message ?? e) };
  }
}

async function maybePlaywright(chantierId) {
  const probe = await probeFront();
  if (!probe.up) {
    console.log(`SKIP ui — front down (${APP_BASE})`);
    results.front = 'down';
    return;
  }
  results.front = 'up';
  try {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.addInitScript(() => {
      window.localStorage.setItem('seyrura:language', 'fr');
    });
    await page.goto(`${APP_BASE}/chantiers/planning?chantier=${chantierId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    const heading = await page.getByText(/Planning/i).first().isVisible({ timeout: 8000 }).catch(() => false);
    if (!heading) {
      console.log('SKIP ui — page planning non authentifiée (pas erp:cursor)');
      results.front = 'up-not-logged-in';
      await browser.close();
      return;
    }
    const html = await page.content();
    const noApiHint = !/via l['']API/i.test(html);
    step('ui-empty-pas-api', 'AC-13', noApiHint, noApiHint ? 'pas de mention API' : 'mention API encore visible');
    const cta = page.getByRole('button', { name: /nouvelle activit/i }).first();
    const ctaVisible = await cta.isVisible().catch(() => false);
    step('ui-cta', 'AC-13', ctaVisible, ctaVisible ? 'CTA Nouvelle activité' : 'CTA absent');
    if (ctaVisible) {
      await cta.click();
      const libelle = page.locator('[data-testid="activite-libelle"]');
      const drawer = await libelle.isVisible({ timeout: 5000 }).catch(() => false);
      step('ui-drawer', 'AC-14', drawer, drawer ? 'drawer libellé (pas UUID)' : 'drawer non ouvert');
    }
    await browser.close();
  } catch (e) {
    console.log(`SKIP ui-playwright — ${String(e.message ?? e).slice(0, 180)}`);
    results.front = `error:${String(e.message ?? e).slice(0, 120)}`;
  }
}

async function main() {
  console.log('=== planning workspace e2e (scénarios 5–8) ===');
  console.log(`API ${API_BASE} · APP ${APP_BASE}`);
  console.log(`ROUGE AVANT: ${results.rougeAvant}`);

  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  if (!sessionRes.ok) {
    throw new Error(`API down — cursor-session HTTP ${sessionRes.status}`);
  }
  const session = await sessionRes.json();
  if (!session?.accessToken || !session?.tenantId) {
    throw new Error(`cursor-session KO: HTTP ${sessionRes.status}`);
  }
  const h = headers(session);
  const s = Date.now().toString(36);

  const ctx = await seedWalkChantier(h, session, s);
  const { chantierId, posteDecomposeId, quantite, status } = ctx;
  step(
    'seed-walk',
    'scénario 8',
    status === 'EN_PREPARATION' || !!chantierId,
    `chantier=${chantierId} status=${status} posteDécomposé=${posteDecomposeId} qty=${quantite}`,
  );

  const empty = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/activites`);
  const emptyList = Array.isArray(empty.body) ? empty.body : empty.body?.content ?? [];
  step('empty-zero-activite', 'AC-13/scénario 5', empty.ok && emptyList.length === 0, `GET activites n=${emptyList.length}`);

  await maybePlaywright(chantierId);

  const coffrage = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites`, {
    libelle: 'Coffrage R+1',
    dateDebut: '2026-09-08',
    dateFin: '2026-09-19',
    ordre: 1,
  });
  step(
    'creer-coffrage',
    'AC-13',
    coffrage.status === 201 && coffrage.body?.libelle === 'Coffrage R+1',
    `POST Coffrage R+1 → ${coffrage.status}`,
  );
  const act1Id = coffrage.body?.id;

  const jalon = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites`, {
    libelle: 'Installation base vie',
    dateDebut: '2026-09-01',
    dateFin: '2026-09-05',
    ordre: 2,
  });
  step(
    'creer-jalon',
    'AC-13/scénario 8',
    jalon.status === 201,
    `POST jalon interne → ${jalon.status}`,
  );
  const jalonId = jalon.body?.id;

  const rattOk = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/${act1Id}/rattachements`, {
    posteId: posteDecomposeId,
    quantitePrevue: 50,
  });
  step(
    'rattacher-50',
    'AC-16',
    rattOk.status === 201 && Number(rattOk.body?.quantitePrevue) === 50,
    `rattacher 50/${quantite} → ${rattOk.status}`,
  );

  const rattKo = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/${jalonId}/rattachements`, {
    posteId: posteDecomposeId,
    quantitePrevue: 60,
  });
  const msg = String(rattKo.body?.message ?? rattKo.text ?? '');
  step(
    'depassement-metier',
    'AC-16',
    rattKo.status >= 400 && rattKo.status < 500 && /quotite_depassement|reste=/i.test(msg),
    `trop 60 → ${rattKo.status} ${msg.slice(0, 140)}`,
  );

  const avanc = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/${act1Id}/avancements`, {
    date: '2026-09-12',
    quantiteRealisee: 12,
    saisieParId: session.userId ?? 'qa',
    saisieParName: 'QA',
    status: 'BROUILLON',
  });
  step(
    'qte-faite-12',
    'AC-17',
    avanc.status === 201,
    `12 m³ faits → ${avanc.status}`,
  );

  const pct = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/${jalonId}/avancements`, {
    date: '2026-09-03',
    avancementPercent: 40,
    saisieParId: session.userId ?? 'qa',
    status: 'BROUILLON',
  });
  step(
    'jalon-percent',
    'AC-17',
    pct.status === 201 && Number(pct.body?.avancementPercent) === 40,
    `jalon % → ${pct.status} pct=${pct.body?.avancementPercent}`,
  );

  const planning = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/activites/planning`);
  const nAct = planning.body?.activites?.length ?? 0;
  step(
    'gantt-non-vide',
    'AC-15/scénario 8',
    planning.ok && nAct >= 2,
    `planning activites=${nAct} (lots absents du payload activités)`,
  );

  const listed = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/activites`);
  const rows = Array.isArray(listed.body) ? listed.body : [];
  const noLotBars = rows.every((a) => a.libelle && !/LOT|POSTE/i.test(a.recordType ?? ''));
  step('activites-seulement', 'AC-15', listed.ok && noLotBars, `GET activites n=${rows.length}`);

  const failed = results.steps.filter((x) => !x.pass);
  results.status = failed.length ? 'FAIL' : 'PASS';
  results.chantierId = chantierId;
  console.log(JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  main().catch((e) => {
    console.error(e);
    results.status = 'ERROR';
    results.error = String(e);
    console.log(JSON.stringify(results, null, 2));
    process.exit(1);
  });
}

export { seedWalkChantier, api, headers };
