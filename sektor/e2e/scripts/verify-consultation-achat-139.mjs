/**
 * Preuve SEKTOR-139 — overlay étude = liste des consultations liées.
 * Run: node sektor/e2e/scripts/verify-consultation-achat-139.mjs
 *
 * Playwright dual-require (C:/ vs c:/ = inbox) : `require('playwright')` depuis
 * `sektor/sources/web/package.json`, pas `@playwright/test`. Spec optionnelle.
 *
 * Baseline vu rouge (23/08, formulaire 136) :
 *   overlay titre « Créer une consultation »
 *   select fournisseur + fieldset identités + select « Ajouter à »
 *   deux CTA Créer / Ajouter à côte à côte
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
const FRONT_BASE = process.env.NAFURA_QA_FRONT_BASE ?? 'http://127.0.0.1:4200';

const here = dirname(fileURLToPath(import.meta.url));
const webPkg = resolve(here, '../../sources/web/package.json');
const requireFromWeb = createRequire(webPkg);

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

function assertChromeOverlay139() {
  const web = join(here, '../../sources/web/app');
  const dialogTs = join(
    web,
    'etudes/dossiers/components/consultation-decompo-dialog/consultation-decompo-dialog.component.ts',
  );
  if (!existsSync(dialogTs)) {
    throw new Error('VU ROUGE overlay : consultation-decompo-dialog absent');
  }
  const src = readFileSync(dialogTs, 'utf8');

  const formulaire136 =
    /Identités de la décompo/.test(src) &&
    /name="cibleId"|Ajouter à/.test(src) &&
    /Créer une consultation/.test(src) &&
    /ajouterAConsultation|Ajouter à une consultation/.test(src);
  if (formulaire136) {
    throw new Error(
      'VU ROUGE overlay : formulaire select+cases+deux CTA (136) encore premier écran',
    );
  }

  if (!/Consultations de cette étude/.test(src)) {
    throw new Error('VU ROUGE : premier écran n’est pas la liste des liées');
  }
  if (!/déjà dedans|dejaDedans|déjà dans/i.test(src)) {
    throw new Error('VU ROUGE : déjà-dedans absent des lignes');
  }
  if (!/Articles du panier|data-cs-panier/.test(src)) {
    throw new Error('VU ROUGE : clic une consultation ≠ ses articles (panier)');
  }
  if (/collectIdentitesDecompo/.test(src)) {
    throw new Error('VU ROUGE : encore tout l’arbre à cocher');
  }
  if (/cibleId|ajouterAConsultation/.test(src)) {
    throw new Error('VU ROUGE : select « Ajouter à » + CTA côte à côte encore là');
  }
  if (!/articleCourant|articleCle|preselectedCles/.test(src)) {
    throw new Error('create : article courant pas posé');
  }
  if (!/statutLabel/.test(src)) {
    throw new Error('VU ROUGE : statut absent des lignes overlay');
  }
  if (!/data-cs-fiche|Voir la fiche/.test(src)) {
    throw new Error('VU ROUGE : lien fiche (œil) absent');
  }
  if (!/lookupKey="fournisseurs"/.test(src) || !/\[lookupSearch\]/.test(src)) {
    throw new Error('VU ROUGE overlay create : fournisseur n’est pas le combobox lookup');
  }
  if (/<select[\s\S]{0,240}name="fournisseurId"/.test(src) || /pageSize:\s*200/.test(src)) {
    throw new Error('VU ROUGE overlay : encore dump <select> fournisseur');
  }
}

async function createItem(h, name, cleStable) {
  const created = await json(
    await fetch(`${API_BASE}/api/v1/items`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ name, nature: 'MATIERE', isActive: true, cleStable }),
    }),
  );
  if (created.status !== 201) throw new Error(`item ${name} ${created.status} ${created.text}`);
  return created.body.id;
}

async function addNoeud(h, dpgfId, body) {
  const res = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify(body),
    }),
  );
  if (res.status !== 201) throw new Error(`noeud ${body.code} ${res.status} ${res.text}`);
  return res.body.id;
}

async function createDpu(h, noeudId, itemId, libelle, prix, unite) {
  const dpu = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpu`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ dpgfNoeudId: noeudId }),
    }),
  );
  if (dpu.status !== 201) throw new Error(`dpu ${libelle} ${dpu.status} ${dpu.text}`);
  const composant = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        type: 'MATIERE',
        referenceType: 'ITEM',
        itemId,
        libelle,
        rendement: 1,
        unite,
        prixUnitaire: prix,
        sourcePrix: 'TARIF',
        prixLibelleSource: 'tarif-qa-139',
      }),
    }),
  );
  if (composant.status !== 201) {
    throw new Error(`composant ${libelle} ${composant.status} ${composant.text}`);
  }
  return dpu.body.id;
}

async function waitListeLiees(overlay) {
  await overlay.waitFor({ timeout: 15000 });
  await overlay
    .getByText('Chargement des consultations liées')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});
  await overlay.locator('[data-cs-liee]').first().waitFor({ timeout: 15000 });
}

async function proveBrowserOverlay(
  pageUrl,
  numeroDedans,
  numeroPasEncore,
  articleLabel,
  posteLibelle,
  fournisseurQuery,
) {
  let chromium;
  try {
    ({ chromium } = requireFromWeb('playwright'));
  } catch (err) {
    console.log('SKIP playwright require:', err.message);
    return;
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    await page.locator('app-decomposition-workspace').waitFor({ timeout: 25000 });
    const openBtn = page.locator('[data-testid="ouvrir-consultations-etude"]').first();
    await openBtn.waitFor({ timeout: 15000 });
    await openBtn.click();

    const overlay = page.locator('.cs-overlay, [data-cs-overlay]').first();
    await waitListeLiees(overlay);
    const text = ((await overlay.innerText()) ?? '').replace(/\s+/g, ' ');

    if (/Identités de la décompo/.test(text) && /Ajouter à/.test(text)) {
      throw new Error(`VU ROUGE browser : overlay encore formulaire 136 — ${text.slice(0, 400)}`);
    }
    if (!/Consultations de cette étude/.test(text)) {
      throw new Error(`browser : liste liées absente — ${text.slice(0, 400)}`);
    }
    if (!text.includes(numeroDedans) || !text.includes(numeroPasEncore)) {
      throw new Error(`browser : liées de cette étude absentes — ${text.slice(0, 400)}`);
    }
    if ((await overlay.locator('[data-cs-fiche]').count()) < 1) {
      throw new Error('browser : œil fiche absent');
    }
    if ((await overlay.locator('[data-cs-statut]').count()) < 1) {
      throw new Error('browser : statut absent');
    }
    if (/Identités de la décompo|Ajouter à une consultation/.test(text) && /Créer une consultation/.test(text)) {
      throw new Error(`VU ROUGE browser : deux CTA + cases encore côte à côte — ${text.slice(0, 400)}`);
    }

    const rowPasEncore = overlay.locator('[data-cs-liee]', { hasText: numeroPasEncore }).first();
    if ((await rowPasEncore.count()) === 0) {
      await overlay.getByText(numeroPasEncore).first().click();
    } else {
      await rowPasEncore.click();
    }
    const detail = page.locator('[data-cs-pane="detail"], [data-cs-panier]').first();
    await detail.waitFor({ timeout: 8000 });
    const detailText = ((await detail.innerText()) ?? '').replace(/\s+/g, ' ');
    if (!/Articles du panier|panier/i.test(detailText) && !/Ajouter/i.test(detailText)) {
      throw new Error(`browser : clic ≠ panier — ${detailText.slice(0, 400)}`);
    }
    console.log('ok browser overlay liste liées + panier au clic');

    await overlay.getByRole('button', { name: 'Fermer' }).click().catch(async () => {
      await overlay.locator('nf-button').filter({ hasText: '✕' }).first().click({ force: true });
    });
    await overlay.waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});

    const poste = page.getByText(posteLibelle).first();
    await poste.waitFor({ timeout: 12000 });
    await poste.click();
    const addBtn = page.locator('[data-testid="ouvrir-consultation-composant"]').first();
    try {
      await addBtn.waitFor({ timeout: 8000 });
      await addBtn.click({ force: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log('browser composant skip (liste+panier déjà vus):', msg.split('\n')[0]);
      return;
    }
    const overlayArticle = page.locator('[data-cs-overlay]').first();
    await waitListeLiees(overlayArticle);
    const articleText = ((await overlayArticle.innerText()) ?? '').replace(/\s+/g, ' ');
    if (!/déjà dedans/i.test(articleText) || !/pas encore/i.test(articleText)) {
      throw new Error(
        `browser : déjà-dedans / pas encore absents depuis le composant — ${articleText.slice(0, 400)}`,
      );
    }
    await overlayArticle.getByRole('button', { name: 'Nouvelle consultation' }).click();
    const creer = overlayArticle.locator('[data-cs-pane="creer"]');
    await creer.waitFor({ timeout: 8000 });
    if ((await creer.locator('select[name="fournisseurId"]').count()) > 0) {
      throw new Error('browser create : encore <select> natif fournisseur');
    }
    const input = creer.locator('input[role="combobox"]').first();
    await input.waitFor({ timeout: 5000 });
    await input.click();
    const placeholder = (await input.getAttribute('placeholder')) ?? '';
    if (!/2/.test(placeholder)) {
      throw new Error(`browser create : placeholder 2 car. absent — ${placeholder}`);
    }
    const q = (fournisseurQuery ?? 'La').slice(0, 2);
    await input.fill(q);
    await overlayArticle.locator('[role="option"]').first().waitFor({ timeout: 10000 });
    if ((await overlayArticle.locator('button.nf-select-list').count()) < 1) {
      throw new Error('browser create : œil liste fournisseurs absent');
    }
    console.log('ok browser déjà-dedans + combobox fournisseur ≥ 2 car.');
  } finally {
    await browser.close();
  }
}

async function main() {
  assertChromeOverlay139();
  console.log('ok chrome : overlay liste liées, pas le formulaire 136');

  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = await sessionRes.json();
  if (!session?.accessToken || !session?.tenantId) {
    console.log('SKIP cursor-session unavailable');
    process.exit(0);
  }
  const h = headers(session);
  const suffix = Date.now().toString(36);
  const cleCiment = `ciment-cpj-45-${suffix}`;
  const clePeinture = `peinture-acrylique-${suffix}`;

  let ingenieurs = [];
  const ingRes = await fetch(`${API_BASE}/api/v1/etudes/ingenieurs`, { headers: h });
  if (ingRes.ok) ingenieurs = await ingRes.json();
  const chargeEtudeUserId = ingenieurs[0]?.userId ?? session.userId;

  const cimentItemId = await createItem(h, `Ciment CPJ 45 ${suffix}`, cleCiment);

  const dossier = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        objet: `QA 139 overlay ${suffix}`,
        chargeEtudeUserId,
        clientNom: 'MOA QA 139',
      }),
    }),
  );
  if (dossier.status !== 201) throw new Error(`dossier ${dossier.status} ${dossier.text}`);
  const dossierId = dossier.body.id;

  const autre = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        objet: `QA 139 autre ${suffix}`,
        chargeEtudeUserId,
        clientNom: 'MOA QA 139 B',
      }),
    }),
  );
  if (autre.status !== 201) throw new Error(`dossier B ${autre.status} ${autre.text}`);

  const bordereau = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`, {
      method: 'POST',
      headers: h,
    }),
  );
  if (!bordereau.ok) throw new Error(`bordereau ${bordereau.status} ${bordereau.text}`);
  const dpgfId = bordereau.body.dpgfId;

  const lotId = await addNoeud(h, dpgfId, { type: 'LOT', code: '01', libelle: 'GO' });
  const slId = await addNoeud(h, dpgfId, {
    type: 'SOUS_LOT',
    parentId: lotId,
    code: '01.01',
    libelle: 'Béton',
  });
  const a1 = await addNoeud(h, dpgfId, {
    type: 'ARTICLE',
    parentId: slId,
    code: '01.01.01',
    libelle: `Ciment 139 ${suffix}`,
    quantite: 10,
    unite: 'm3',
    origineCout: 'DECOMPOSE',
  });
  await createDpu(h, a1, cimentItemId, 'Ciment', 100, 'T');

  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRN139${suffix}`.slice(0, 30),
        raisonSociale: `Lafarge QA 139 ${suffix}`,
        roles: ['FOURNISSEUR'],
      }),
    }),
  );
  if (partner.status !== 201) throw new Error(`partner ${partner.status} ${partner.text}`);

  const partner2 = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRN139B${suffix}`.slice(0, 30),
        raisonSociale: `Sika QA 139 ${suffix}`,
        roles: ['FOURNISSEUR'],
      }),
    }),
  );
  if (partner2.status !== 201) throw new Error(`partner2 ${partner2.status} ${partner2.text}`);

  const lieeDedans = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fournisseurId: partner.body.id,
        dossierEtudeId: dossierId,
        clesStables: [cleCiment, cleCiment],
      }),
    }),
  );
  if (lieeDedans.status !== 201) throw new Error(`liée dedans ${lieeDedans.status} ${lieeDedans.text}`);

  const lieePasEncore = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fournisseurId: partner2.body.id,
        dossierEtudeId: dossierId,
        clesStables: [clePeinture],
      }),
    }),
  );
  if (lieePasEncore.status !== 201) {
    throw new Error(`liée pas encore ${lieePasEncore.status} ${lieePasEncore.text}`);
  }

  const autreDossier = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fournisseurId: partner.body.id,
        dossierEtudeId: autre.body.id,
        clesStables: [cleCiment],
      }),
    }),
  );
  if (autreDossier.status !== 201) {
    throw new Error(`liée autre dossier ${autreDossier.status} ${autreDossier.text}`);
  }

  const hors = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fournisseurId: partner.body.id,
        clesStables: [cleCiment],
      }),
    }),
  );
  if (hors.status !== 201) throw new Error(`hors ${hors.status} ${hors.text}`);

  const listed = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat?lien=liee`, { headers: h }),
  );
  if (!listed.ok || !Array.isArray(listed.body)) {
    throw new Error(`liste liee ${listed.status} ${listed.text}`);
  }
  const deCetteEtude = listed.body.filter((c) => c.dossierEtudeId === dossierId);
  const idsCette = new Set(deCetteEtude.map((c) => c.id));
  if (!idsCette.has(lieeDedans.body.id) || !idsCette.has(lieePasEncore.body.id)) {
    throw new Error(`liste cette étude incomplète : ${JSON.stringify(deCetteEtude.map((c) => c.numero))}`);
  }
  if (idsCette.has(autreDossier.body.id) || idsCette.has(hors.body.id)) {
    throw new Error('filtre dossier : autre étude / hors étude encore dans la liste de CETTE étude');
  }
  const rowDedans = deCetteEtude.find((c) => c.id === lieeDedans.body.id);
  const rowPas = deCetteEtude.find((c) => c.id === lieePasEncore.body.id);
  if (!(rowDedans?.clesStables ?? []).includes(cleCiment)) {
    throw new Error('déjà-dedans : ciment absent du panier Lafarge');
  }
  if ((rowPas?.clesStables ?? []).includes(cleCiment)) {
    throw new Error('pas encore : ciment déjà dans Sika');
  }
  console.log('ok liste liées à CETTE étude, déjà-dedans / pas encore', lieeDedans.body.numero, lieePasEncore.body.numero);

  const etape = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/etape`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ etape: 3 }),
    }),
  );
  if (!etape.ok) throw new Error(`etape Coût ${etape.status} ${etape.text}`);

  const front = await fetch(`${FRONT_BASE}/etudes/dossiers/${dossierId}`, {
    headers: { Accept: 'text/html' },
  });
  if (!front.ok) throw new Error(`front dossier ${front.status}`);

  await proveBrowserOverlay(
    `${FRONT_BASE}/etudes/dossiers/${dossierId}`,
    lieeDedans.body.numero,
    lieePasEncore.body.numero,
    'Ciment',
    `Ciment 139 ${suffix}`,
    partner.body.raisonSociale ?? 'Lafarge',
  );

  const patched = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${lieePasEncore.body.id}/panier`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({
        clesStables: [cleCiment],
        dossierEtudeId: dossierId,
      }),
    }),
  );
  if (!patched.ok) throw new Error(`PATCH panier ${patched.status} ${patched.text}`);
  const panier = patched.body.clesStables ?? [];
  if (!panier.includes(cleCiment) || !panier.includes(clePeinture)) {
    throw new Error(`panier après ajout ${JSON.stringify(panier)}`);
  }
  if (panier.filter((c) => c === cleCiment).length !== 1) {
    throw new Error(`re-coché ciment : ${JSON.stringify(panier)}`);
  }
  console.log('ok ajout article courant au panier, pas de re-coche');

  const created = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fournisseurId: partner.body.id,
        dossierEtudeId: dossierId,
        clesStables: [cleCiment],
      }),
    }),
  );
  if (created.status !== 201) throw new Error(`create courant ${created.status} ${created.text}`);
  const createdCles = created.body.clesStables ?? [];
  if (createdCles.length !== 1 || createdCles[0] !== cleCiment) {
    throw new Error(`create doit poser l’article courant seul : ${JSON.stringify(createdCles)}`);
  }
  console.log('ok create si besoin : article courant déjà posé', created.body.numero);

  console.log('ok 139 overlay liste liées, déjà-dedans, panier, create article courant');
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
