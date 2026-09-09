/**
 * Planning unifié L1 — SEKTOR-328 (étape de la Task, pas un ticket QA).
 *
 * API : palier 1, formes, jalon 0, 403, capacites, calendrier.
 * UI  : /chantiers/planning?chantier= — colonnes durée/prédécesseurs,
 *        empty distinct, création, calendrier contexte, vue sauvegardée.
 *
 * Run: node sektor/e2e/scripts/verify-planning-unifie-l1.mjs
 * Prérequis: Mode B (8082 + 127.0.0.1:4200) + cursor-session.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const OUT = path.join(ROOT, 'sektor/e2e/.auth/planning-unifie-l1');
const require = createRequire(path.join(ROOT, 'sektor/sources/web/package.json'));

const results = { at: new Date().toISOString(), status: 'RUNNING', steps: [] };

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
  const chargeEtudeUserId = ingenieurs[0]?.userId ?? h._userId ?? 'qa-user';

  const dossier = await api(h, 'POST', '/api/v1/etudes/dossiers', {
    objet: `Planning unifié L1 ${s}`,
    chargeEtudeUserId,
    clientNom: `MOA L1 ${s}`,
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
    code: `PL1${s}`.slice(0, 20),
    raisonSociale: `Client L1 ${s}`,
    roles: ['CLIENT'],
  });
  if (partner.status !== 201) throw new Error(`partner ${partner.status}`);
  const clientId = partner.body.id;

  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  const soumis = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  if (!soumis.ok) throw new Error(`soumettre ${soumis.status} ${soumis.text?.slice(0, 200)}`);
  let valider = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (valider.body?.status === 'EN_VALIDATION') {
    valider = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  }
  if (valider.body?.status !== 'VALIDEE') {
    throw new Error(`étude non VALIDEE: ${valider.body?.status} ${valider.text?.slice(0, 200)}`);
  }
  const devisGen = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId });
  if (!devisGen.ok) throw new Error(`generer-devis ${devisGen.status} ${devisGen.text}`);
  const devisId = devisGen.body?.devisGenereId ?? devisGen.body?.id;
  const devisDetail = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  const total = devisDetail.body?.totalHt ?? devisDetail.body?.totalHT;
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  const gagne = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: '2026-09-08',
    referenceMarche: `MA-L1-${s}`,
    devisId,
    montantAttribue: total,
  });
  if (!gagne.ok || gagne.body?.status !== 'GAGNE') {
    throw new Error(`gagne KO: ${gagne.status} ${gagne.body?.status}`);
  }
  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {
    code: `CH-L1-${s}`.slice(0, 30),
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
  for (const l of lotRows) {
    const postes = await api(h, 'GET', `/api/v1/lots/${l.id}/postes-budgetaires`);
    const list = Array.isArray(postes.body) ? postes.body : [];
    const beton = list.find((p) => /Beton|Béton|B25/i.test(p.designation ?? p.libelle ?? ''));
    if (beton) {
      posteId = beton.id;
      break;
    }
    if (!posteId && list[0]) posteId = list[0].id;
  }
  if (!posteId) throw new Error('poste budgetaire introuvable après conversion');
  return { chantierId, posteId };
}

async function main() {
  console.log('=== planning-unifie L1 e2e (SEKTOR-328) ===');
  console.log(`API ${API_BASE}  UI ${APP_BASE}`);
  fs.mkdirSync(OUT, { recursive: true });

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

  const { chantierId, posteId } = await seedChantier(h, s);
  step('seed', '-', true, `chantier=${chantierId} poste=${posteId}`);

  {
    const av = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/avancements`, {
      date: '2026-09-05',
      status: 'BROUILLON',
      saisieParId: session.userId ?? 'qa',
      saisieParName: 'QA',
      entries: [{ posteId, quantiteRealisee: 5 }],
    });
    step(
      'palier1-avancement-noeud',
      'AC11',
      av.status >= 200 && av.status < 300,
      `POST avancement nœud sans activité → ${av.status}`,
    );
  }

  {
    const planning = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/activites/planning`);
    const c = planning.body?.capacites ?? {};
    const keys = ['lire', 'editerStructure', 'proposerStructure', 'administrerCalendrier', 'proposerCalendrier', 'gererVues'];
    const ok = planning.ok && keys.every((k) => typeof c[k] === 'boolean');
    step('capacites', 'SEKTOR-327', ok, `GET planning capacites=${JSON.stringify(c)} status=${planning.status}`);
  }

  {
    const fake = '00000000-0000-0000-0000-000000000099';
    const denied = await api(h, 'GET', `/api/v1/chantiers/${fake}/activites/planning`);
    const leak = /libelle|dateDebut|dureeMinutes/.test(JSON.stringify(denied.body ?? ''));
    step(
      'ac13-403',
      'AC13',
      (denied.status === 403 || denied.status === 404 || denied.status === 400) && !leak,
      `chantier inconnu → ${denied.status} leak=${leak}`,
    );
  }

  const jalonBad = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites`, {
    libelle: `Jalon jour fictif ${s}`,
    forme: 'JALON',
    natureCode: 'JALON_TECHNIQUE',
    dateDebut: '2026-09-15',
    dateFin: '2026-09-16',
    dureeMinutesOuvrees: 480,
  });
  step(
    'jalon-jour-fictif',
    'L1',
    jalonBad.status >= 400 && jalonBad.status < 500,
    `POST jalon 1 j → ${jalonBad.status} ${jalonBad.text?.slice?.(0, 120) ?? ''}`,
  );

  const jalon = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites`, {
    libelle: `Jalon BET ${s}`,
    forme: 'JALON',
    natureCode: 'JALON_TECHNIQUE',
    dateDebut: '2026-09-15',
    dateFin: '2026-09-15',
    dureeMinutesOuvrees: 0,
  });
  step(
    'jalon-zero',
    'L1',
    jalon.ok && jalon.body?.dureeMinutesOuvrees === 0 && jalon.body?.dateDebut === jalon.body?.dateFin,
    `POST jalon → ${jalon.status} duree=${jalon.body?.dureeMinutesOuvrees} ${jalon.body?.dateDebut}/${jalon.body?.dateFin}`,
  );

  const phase = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites`, {
    libelle: `Phase installation ${s}`,
    forme: 'PHASE',
    natureCode: 'PREPA_INSTALL',
    dateDebut: '2026-09-08',
  });
  step('phase', 'L1', phase.ok && phase.body?.forme === 'PHASE', `POST phase → ${phase.status} forme=${phase.body?.forme}`);

  const act = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites`, {
    libelle: `Coffrage R+1 ${s}`,
    forme: 'ACTIVITE',
    natureCode: 'TRAVAUX',
    dateDebut: '2026-09-08',
    dureeMinutesOuvrees: 1440,
    parentActiviteId: phase.body?.id ?? null,
  });
  step(
    'activite-duree',
    'L1',
    act.ok && act.body?.dureeMinutesOuvrees === 1440,
    `POST activité 1440 min → ${act.status} duree=${act.body?.dureeMinutesOuvrees} fin=${act.body?.dateFin}`,
  );

  if (jalon.ok && act.ok) {
    const prec = await api(h, 'POST', `/api/v1/chantiers/${chantierId}/activites/precedences`, {
      predActiviteId: act.body.id,
      succActiviteId: jalon.body.id,
      typeLien: 'FD',
    });
    step('precedence', 'AC27', prec.ok, `POST precedence FD → ${prec.status}`);
  }

  const cal = await api(h, 'GET', `/api/v1/chantiers/${chantierId}/calendrier`);
  step(
    'calendrier',
    'SEKTOR-326',
    cal.status === 200 || cal.status === 404,
    `GET calendrier → ${cal.status} fuseau=${cal.body?.versions?.at?.(-1)?.fuseauIana ?? 'absent'}`,
  );

  let uiOk = false;
  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    try {
      page.on('dialog', (dialog) => dialog.accept('Travaux R+1'));
      await page.goto(`${APP_BASE}/chantiers/planning?chantier=${chantierId}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForSelector(
        '[data-testid="planning-state-ready"], [data-testid="planning-state-empty"], .gantt_grid',
        { timeout: 30000 },
      );
      await page.waitForTimeout(1500);

      const ready = await page.locator('[data-testid="planning-state-ready"], [data-testid="planning-gantt"], .gantt_grid').count();
      const empty = await page.locator('[data-testid="planning-state-empty"]').count();
      const err = await page.locator('[data-testid="planning-state-error"]').count();
      const convention = await page.locator('[data-testid="planning-convention-chip"]').innerText().catch(() => '');
      const gridText = await page.locator('.gantt_grid').innerText().catch(() => '');
      const hasDuree = /Durée|Duration|المدة/i.test(gridText);
      const hasPred = /Prédécesseur|Predecessor|السابق/i.test(gridText);
      step('ui-grid-colonnes', 'AC27', hasDuree && hasPred, `ready=${ready} duree=${hasDuree} pred=${hasPred}`);
      step('ui-convention', 'L1', /8/.test(convention) && !/\{8\}/.test(convention), `convention="${convention.replace(/\s+/g, ' ').trim()}"`);
      step('ui-pas-erreur-vide', 'AC21', err === 0, `error=${err} empty=${empty} ready=${ready}`);

      await page.locator('[data-testid="planning-new-jalon"]').click();
      await page.waitForTimeout(800);
      const jalonHint = await page.locator('[data-testid="activite-jalon-hint"]').count();
      step('ui-drawer-jalon', 'L1', jalonHint > 0, `hint jalon visible=${jalonHint}`);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      await page.locator('[data-testid="planning-calendar"]').click({ force: true });
      await page.waitForTimeout(600);
      const calOpen = await page.locator('[data-testid="planning-calendrier"]').count();
      step('ui-calendrier-contexte', 'L1', calOpen > 0, `drawer calendrier=${calOpen}`);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.locator('[data-testid="planning-save-view"]').click({ force: true });
      await page.waitForTimeout(400);
      const saved = await page.evaluate(() =>
        Object.keys(localStorage).some((k) => k.startsWith('nafura.planning.vues.')),
      );
      step('ui-vue-sauvegardee', 'L1', saved, `localStorage vues=${saved}`);

      const shot = path.join(OUT, 'planning-l1.png');
      await page.screenshot({ path: shot, fullPage: true });
      console.log(`SHOT  ${shot}`);
      uiOk = hasDuree && hasPred && jalonHint > 0 && calOpen > 0;
    } finally {
      await browser.close();
    }
  } catch (error) {
    step('ui-playwright', 'L1', false, `UI skip/fail: ${error instanceof Error ? error.message : error}`);
  }

  const failed = results.steps.filter((x) => !x.pass);
  results.status = failed.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(OUT, 'verification.json'), JSON.stringify(results, null, 2));
  console.log(`=== ${results.status}  ${results.steps.length - failed.length}/${results.steps.length}  ui=${uiOk} ===`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
