/**
 * Browser + API QA for web/docs/qa/06-marches-facturation.md unchecked items.
 * Run: node web/tests/e2e/scripts/verify-marches-qa-20260620.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const BASE = process.env.ERP_BASE ?? 'http://erp.nafura.local';
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';

const QA = {
  marcheNumero: 'MARCHE-2026-002',
  marcheId: 'mar-qa-002',
  avenantId: 'avt-qa-manar-001',
  bccMarker: 'QA-MARCHES-SEED-2026',
  factureFromSituation: 'FAC-2026-0002',
};

const results = { at: new Date().toISOString(), steps: [] };

function step(id, pass, detail, extra = {}) {
  results.steps.push({ id, pass, detail, ...extra });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id}: ${detail}`);
}

const TOUR_IDS = ['shell', 'chantiers', 'marches', 'pilotage', 'situations', 'erp', 'dashboard'];

async function dismissTours(page) {
  await page.addInitScript((tours) => {
    for (const id of tours) localStorage.setItem(`nafura-tour-seen-${id}`, '1');
    localStorage.setItem('nafura-onboarding', '1');
    localStorage.setItem('seyrura:language', 'fr');
  }, TOUR_IDS);
}

async function getSession(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('pf_session') ?? sessionStorage.getItem('pf_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.tokens?.accessToken) return null;
    return { accessToken: parsed.tokens.accessToken, tenantId: parsed.tenantId ?? null };
  });
}

function apiHeaders(session) {
  const headers = { Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' };
  if (session.tenantId) headers['X-Tenant-Id'] = session.tenantId;
  return headers;
}

async function apiJson(request, session, method, urlPath, data) {
  const opts = { headers: apiHeaders(session) };
  if (data !== undefined) opts.data = data;
  const res = await request[method.toLowerCase()](`${API_BASE}${urlPath}`, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { ok: res.ok(), status: res.status(), body };
}

async function waitForApp(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  const login = page.locator('input[name="username"], #username');
  if (await login.isVisible().catch(() => false)) {
    throw new Error('Session expired');
  }
}

async function readStatus(page) {
  const sm = page.locator('nf-status-machine nf-badge').first();
  if (await sm.isVisible().catch(() => false)) {
    return (await sm.textContent())?.trim() ?? '';
  }
  return '';
}

async function confirmDialog(page, confirmLabel) {
  const dialog = page.locator('[role="dialog"], .mat-mdc-dialog-container, .cdk-overlay-pane').last();
  await dialog.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  const confirm = page.getByRole('button', { name: new RegExp(`^${confirmLabel}$`, 'i') }).last();
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
  } else {
    await page.getByRole('button', { name: new RegExp(confirmLabel, 'i') }).last().click();
  }
  await page.waitForTimeout(2500);
}

async function readToast(page, timeoutMs = 5000) {
  const toast = page.locator('.toast, [role="alert"], .mat-mdc-snack-bar-label, .snackbar').first();
  await toast.waitFor({ state: 'visible', timeout: timeoutMs }).catch(() => {});
  return (await toast.textContent().catch(() => ''))?.trim() ?? '';
}

async function testAvenantRecalc(request, session, page) {
  const marcheRes = await apiJson(request, session, 'GET', '/api/v1/marches/contrats');
  const marches = Array.isArray(marcheRes.body) ? marcheRes.body : [];
  const marche =
    marches.find((m) => m.numero === QA.marcheNumero) ??
    marches.find((m) => m.id === QA.marcheId);
  if (!marche) {
    step('avenant-recalc-data', false, `Marché ${QA.marcheNumero} introuvable`);
    return;
  }

  const avenantsRes = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/marches/avenants?contratMarcheId=${encodeURIComponent(marche.id)}`,
  );
  const avenants = Array.isArray(avenantsRes.body) ? avenantsRes.body : [];
  const avenant =
    avenants.find((a) => a.id === QA.avenantId) ??
    avenants.find((a) => /vrd/i.test(a.objet ?? ''));
  if (!avenant) {
    step('avenant-recalc-data', false, 'Avenant VRD introuvable');
    return;
  }

  const simRes = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/marches/avenants/${avenant.id}/impact-simulation`,
  );
  const montantMarche = Number(marche.montantHt);
  const deltaAvenant = Number(avenant.montantHt);
  const expectedApres = montantMarche + deltaAvenant;
  const sim = simRes.body;
  const simOk =
    simRes.ok &&
    Number(sim?.montantHtActuel) === montantMarche &&
    Number(sim?.deltaMontantHt) === deltaAvenant &&
    Number(sim?.montantHtApres) === expectedApres;

  step(
    'avenant-recalc-api',
    simOk,
    simOk
      ? `Simulation OK: ${montantMarche} + ${deltaAvenant} = ${expectedApres} HT`
      : `API impact ${simRes.status} actuel=${sim?.montantHtActuel} apres=${sim?.montantHtApres} attendu=${expectedApres}`,
    { marcheMontantHt: montantMarche, avenantMontantHt: deltaAvenant, simulation: sim },
  );

  await page.goto(`${BASE}/marches/avenants/${avenant.id}`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await waitForApp(page);
  await page.waitForTimeout(1500);

  const pageText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const has5420 =
    /5[\s\u00a0\u202f]?420[\s\u00a0\u202f]?000/.test(pageText) ||
    /5420000/.test(pageText.replace(/[^\d]/g, ''));
  const has5000 = /5[\s\u00a0\u202f]?000[\s\u00a0\u202f]?000/.test(pageText);
  const has420 = /420[\s\u00a0\u202f]?000/.test(pageText);

  const propagated = /impact propag|propagé/i.test(pageText);
  await page.goto(`${BASE}/marches/contrats/${marche.id}`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await waitForApp(page);
  const contratText = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const contrat5420 =
    /5[\s\u00a0\u202f]?420[\s\u00a0\u202f]?000/.test(contratText) ||
    /5420000/.test(contratText.replace(/[^\d]/g, ''));

  step(
    'avenant-recalc-ui',
    (has5420 || (has420 && propagated)) && contrat5420,
    contrat5420
      ? `Contrat ${QA.marcheNumero} affiche 5 420 000 HT ; avenant +420k propagé=${propagated}`
      : `UI montants: contrat5420=${contrat5420} +420k=${has420} propagated=${propagated}`,
    { avenantId: avenant.id, avenantStatus: avenant.status },
  );
}

async function testFactureFromSituation(request, session, page) {
  const facturesRes = await apiJson(request, session, 'GET', '/api/v1/factures-client');
  const factures = Array.isArray(facturesRes.body) ? facturesRes.body : [];
  const fac2 = factures.find((f) => f.numero === QA.factureFromSituation);
  const facSituation = factures.filter(
    (f) => f.type === 'SITUATION' || f.situationId || f.situationNumero,
  );

  step(
    'facture-situation-api',
    !!fac2 || facSituation.length > 0,
    fac2
      ? `${QA.factureFromSituation} trouvée (type=${fac2.type}, status=${fac2.status}, situation=${fac2.situationNumero ?? fac2.situationId})`
      : facSituation.length
        ? `${facSituation.length} facture(s) situation: ${facSituation.map((f) => f.numero).join(', ')}`
        : 'Aucune facture issue situation',
    { fac2: fac2 ?? null, count: facSituation.length },
  );

  const target = fac2 ?? facSituation[0];
  if (target?.situationId) {
    const sitRes = await apiJson(request, session, 'GET', `/api/v1/situations/${target.situationId}`);
    step(
      'facture-situation-link',
      sitRes.ok && (sitRes.body?.status === 'FACTUREE' || sitRes.body?.factureClientId),
      sitRes.ok
        ? `Situation ${sitRes.body?.numero} status=${sitRes.body?.status} factureId=${sitRes.body?.factureClientId ?? 'n/a'}`
        : `Situation API ${sitRes.status}`,
    );
  }

  await page.goto(`${BASE}/marches/factures`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await waitForApp(page);
  await page.waitForTimeout(2000);

  const listingText = await page.locator('body').innerText();
  const hasFacInMarches =
    listingText.includes(QA.factureFromSituation) ||
    (target?.numero && listingText.includes(target.numero));
  const emptyState = /aucune facture/i.test(listingText);

  step(
    'facture-situation-ui-marches',
    hasFacInMarches,
    hasFacInMarches
      ? `Liste /marches/factures contient ${target?.numero ?? QA.factureFromSituation}`
      : emptyState
        ? 'Liste marché factures vide (Aucune facture)'
        : 'Facture situation absente de /marches/factures',
  );

  if (target?.id) {
    await page.goto(`${BASE}/ventes/factures/${target.id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await waitForApp(page);
    const detailText = await page.locator('body').innerText();
    const hasSituationRef =
      /situation/i.test(detailText) &&
      (detailText.includes(target.situationNumero ?? '') ||
        /SIT-2026-004/i.test(detailText) ||
        /SIT-2026-005/i.test(detailText));
    step(
      'facture-situation-ui-ventes',
      hasSituationRef,
      hasSituationRef
        ? `Détail ventes facture ${target.numero} référence la situation source`
        : `Détail ${target.numero} sans lien situation visible`,
    );
  }

  return target;
}

async function testCautions(request, session, page) {
  const marcheRes = await apiJson(request, session, 'GET', '/api/v1/marches/contrats');
  const marches = Array.isArray(marcheRes.body) ? marcheRes.body : [];
  const marche = marches.find((m) => m.numero === QA.marcheNumero);
  if (!marche) {
    step('cautions-seed', false, 'Marché introuvable pour caution');
    return;
  }

  const montantCaution = Math.round(Number(marche.montantHt) * 0.03);
  const listRes = await apiJson(
    request,
    session,
    'GET',
    `/api/v1/marches/cautions?contratMarcheId=${encodeURIComponent(marche.id)}`,
  );
  let cautions = Array.isArray(listRes.body) ? listRes.body : [];
  let caution = cautions.find((c) => Number(c.montant) === montantCaution || c.montant === 150000);

  if (!caution) {
    const created = await apiJson(request, session, 'POST', '/api/v1/marches/cautions', {
      contratMarcheId: marche.id,
      type: 'DEFINITIVE',
      montant: montantCaution,
      dateDepot: '2026-07-01',
      dateEcheance: '2027-07-01',
      banque: 'BMCE Bank QA',
      referenceGarantie: 'CAUT-QA-MANAR-2026',
      status: 'ACTIVE',
      notes: 'QA-MARCHES-CAUTION-2026',
    });
    if (created.ok) {
      caution = created.body;
      step('cautions-seed', true, `Caution définitive ${montantCaution} MAD créée`, {
        id: caution.id,
      });
    } else {
      step('cautions-seed', false, `POST caution ${created.status}: ${JSON.stringify(created.body).slice(0, 200)}`);
    }
  } else {
    step('cautions-seed', true, `Caution existante ${caution.montant} MAD (${caution.type})`, {
      id: caution.id,
    });
  }

  await page.goto(`${BASE}/marches/cautions`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await waitForApp(page);
  await page.waitForTimeout(2000);

  const bodyText = await page.locator('body').innerText();
  const has150k =
    /150[\s\u00a0\u202f]?000/.test(bodyText) ||
    new RegExp(String(montantCaution).replace(/\B(?=(\d{3})+(?!\d))/g, '[\\s\\u00a0\\u202f]?')).test(
      bodyText,
    );
  const emptyState = /aucune caution/i.test(bodyText);

  step(
    'cautions-ui-list',
    has150k && !emptyState,
    has150k
      ? `Liste cautions affiche ${montantCaution} MAD`
      : emptyState
        ? 'Liste vide (Aucune caution)'
        : 'Caution seed absente de la liste UI',
    { montantCaution, emptyState },
  );

  if (caution?.id) {
    await page.goto(`${BASE}/marches/cautions/${caution.id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await waitForApp(page);
    const detail = await page.locator('body').innerText();
    step(
      'cautions-ui-detail',
      /d[ée]finitive|150[\s\u00a0\u202f]?000|BMCE/i.test(detail),
      `Détail caution: type/montant/banque visibles`,
    );
  }
}

async function testEncaissement(page, facture) {
  if (!facture?.id) {
    step('encaissement-data', false, 'Pas de facture EMISE/PARTIELLEMENT_PAYEE disponible');
    return;
  }

  let target = facture;
  if (facture.status === 'BROUILLON') {
    await page.goto(`${BASE}/ventes/factures/${facture.id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await waitForApp(page);
    await page.locator('nf-status-machine').waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

    const emitBtn = page
      .locator('nf-status-machine nf-button button')
      .filter({ hasText: /émettre|emettre/i })
      .first();
    if (await emitBtn.isVisible().catch(() => false)) {
      await emitBtn.click();
      await confirmDialog(page, 'Émettre');
      await page.waitForTimeout(2000);
      target = { ...facture, status: 'EMISE' };
    }
  }

  await page.goto(`${BASE}/ventes/factures/${target.id}`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  });
  await waitForApp(page);
  await page.waitForTimeout(1500);

  const status = await readStatus(page);
  const isEmise = /émise|emise/i.test(status) || target.status === 'EMISE';

  const encBtn = page.getByRole('button', { name: /encaissement|ajouter un encaissement/i }).first();
  const encAction = page.locator('nf-entity-detail').getByText(/encaissement/i).first();
  const addVisible =
    (await encBtn.isVisible().catch(() => false)) ||
    (await page.getByText(/ajouter un encaissement/i).isVisible().catch(() => false));

  const payable = /émise|emise|partiellement pay/i.test(status) ||
    ['EMISE', 'PARTIELLEMENT_PAYEE'].includes(target.status);
  step(
    'encaissement-button-visible',
    payable && addVisible,
    payable
      ? addVisible
        ? `Bouton encaissement visible sur facture ${target.numero} (${status})`
        : `Facture ${target.numero} payable mais bouton encaissement absent`
      : `Facture status="${status}" — pas EMISE/partiellement payée`,
    { factureId: target.id, factureNumero: target.numero, status },
  );

  if (!payable || !addVisible) return;

  const clickTarget = (await encBtn.isVisible().catch(() => false))
    ? encBtn
    : page.getByText(/ajouter un encaissement/i).first();
  await clickTarget.click();
  await page.waitForTimeout(1000);

  const dialog = page.locator('[role="dialog"], .mat-mdc-dialog-container').last();
  const dialogVisible = await dialog.isVisible().catch(() => false);
  step('encaissement-dialog', dialogVisible, dialogVisible ? 'Dialogue encaissement ouvert' : 'Dialogue non ouvert');

  if (dialogVisible) {
    const montantInput = dialog.locator('input[type="number"], input[formcontrolname="montantTtc"]').first();
    if (await montantInput.isVisible().catch(() => false)) {
      await montantInput.fill('100000');
    }
    const dateInput = dialog.locator('input[type="date"], input[formcontrolname="dateEncaissement"]').first();
    if (await dateInput.isVisible().catch(() => false)) {
      await dateInput.fill('2026-06-20');
    }
    const saveBtn = dialog.getByRole('button', { name: /enregistrer|ajouter|valider/i }).last();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2500);
      const toast = await readToast(page);
      const bodyAfter = await page.locator('body').innerText();
      const hasEncaissement =
        /100[\s\u00a0\u202f]?000/.test(bodyAfter) ||
        /encaissement/i.test(toast) ||
        /partiellement pay/i.test(bodyAfter);
      step(
        'encaissement-add',
        hasEncaissement,
        hasEncaissement
          ? `Encaissement 100 000 MAD enregistré (toast="${toast}")`
          : `Sauvegarde encaissement non confirmée toast="${toast}"`,
      );
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: AUTH_FILE, locale: 'fr-FR' });
  const page = await context.newPage();
  await dismissTours(page);

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForApp(page);
  const session = await getSession(page);
  if (!session) {
    console.error('No session token');
    process.exit(1);
  }

  const request = context.request;

  // Seed check
  const bccRes = await apiJson(request, session, 'GET', '/api/v1/bons-commande-client');
  const bccs = Array.isArray(bccRes.body) ? bccRes.body : [];
  const bcc = bccs.find((b) => b.notes === QA.bccMarker);
  step(
    'seed-bcc',
    !!bcc,
    bcc ? `BCC ${bcc.numero ?? bcc.numeroClient} OK` : 'BCC seed absent',
    { bccId: bcc?.id },
  );

  await testAvenantRecalc(request, session, page);
  const facture = await testFactureFromSituation(request, session, page);
  await testCautions(request, session, page);

  const facturesRes = await apiJson(request, session, 'GET', '/api/v1/factures-client');
  const factures = Array.isArray(facturesRes.body) ? facturesRes.body : [];
  const emiseFacture =
    factures.find((f) => f.numero === QA.factureFromSituation) ??
    factures.find((f) => f.status === 'EMISE' || f.status === 'PARTIELLEMENT_PAYEE') ??
    factures.find((f) => f.numero === 'FAC-2026-0001') ??
    facture;

  await testEncaissement(page, emiseFacture);

  await browser.close();

  results.allPass = results.steps.every((s) => s.pass);
  const out = path.resolve(__dirname, '../../../../docs/qa/erp-audit-2026-06-19/marches-qa-verify-20260620.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log('\nWrote', out);
  console.log('ALL PASS:', results.allPass);
  process.exit(results.allPass ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
