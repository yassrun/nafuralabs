/**
 * Preuve SEKTOR-260 — picker partagé + DPU (AC-1, 2/7 partiel, 8, 9, 12, 13, 14).
 * Run: node sektor/e2e/scripts/verify-picker-article-260.mjs
 *
 * Scénarios CONTRAT : picker-ouverture-vide · picker-aucun-resultat · picker-erreur-reseau
 *   picker-dpu-ajouter-au-poste · picker-clavier · (AC-12 header sans preset)
 *
 * Prérequis : Mode B (API 8082 + front 4200), SEKTOR-259 (GET /api/v1/items/search).
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const here = path.dirname(fileURLToPath(import.meta.url));
const webPkg = path.resolve(here, '../../sources/web/package.json');
const require = createRequire(webPkg);
const { chromium } = require('playwright');

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertStaticWiring() {
  const picker = fs.readFileSync(
    path.join(ROOT, 'sources/web/app/catalogue/components/article-picker/article-picker.component.ts'),
    'utf8',
  );
  const dialog = fs.readFileSync(
    path.join(
      ROOT,
      'sources/web/app/etudes/dossiers/components/catalog-item-pick-dialog/catalog-item-pick-dialog.component.ts',
    ),
    'utf8',
  );
  const panel = fs.readFileSync(
    path.join(
      ROOT,
      'sources/web/app/etudes/dossiers/components/poste-decomposition-panel/poste-decomposition-panel.component.ts',
    ),
    'utf8',
  );
  assert(picker.includes("selector: 'app-article-picker'"), 'picker partagé manquant sous catalogue/');
  assert(picker.includes('searchPicker'), 'picker doit appeler searchPicker (pas dump listing)');
  assert(!/getAll\(\s*\{\s*pageSize:\s*40/.test(picker), 'picker ne doit plus dumper pageSize 40');
  assert(dialog.includes('ArticlePickerComponent'), 'CatalogItemPickDialog doit consommer ArticlePicker');
  assert(dialog.includes('app-article-picker'), 'template dialog sans app-article-picker');
  assert(panel.includes('ajouterDepuisCatalogue'), 'CTA DPU header manquant');
  assert(panel.includes("context: 'dpu'"), 'ouverture DPU doit passer context dpu');
  assert(!/presetNature/.test(panel.match(/ajouterDepuisCatalogue[\s\S]{0,800}/)?.[0] ?? ''), 
    'AC-12: ajouterDepuisCatalogue ne doit pas passer presetNature');
  console.log('PASS static — picker catalogue + dialog consommateur + DPU sans preset');
}

async function seedDossierCout(h, suffix) {
  let chargeEtudeUserId = h['X-Tenant-Id'];
  const ing = await json(await fetch(`${API_BASE}/api/v1/etudes/ingenieurs`, { headers: h }));
  if (Array.isArray(ing.body) && ing.body[0]?.userId) chargeEtudeUserId = ing.body[0].userId;

  const created = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        objet: `QA picker 260 ${suffix}`,
        chargeEtudeUserId,
        clientNom: 'MOA QA 260',
      }),
    }),
  );
  if (created.status !== 201) throw new Error(`dossier ${created.status} ${created.text}`);
  const dossierId = created.body.id;

  const init = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`, {
      method: 'POST',
      headers: h,
    }),
  );
  if (!init.ok) throw new Error(`init-bordereau ${init.status} ${init.text}`);
  const dpgfId = init.body.dpgfId;

  const lot = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ type: 'LOT', code: '1', libelle: `Lot GO 260 ${suffix}` }),
    }),
  );
  if (lot.status !== 201) throw new Error(`lot ${lot.status} ${lot.text}`);

  const art = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        type: 'ARTICLE',
        code: '1.1',
        libelle: `Beton picker 260 ${suffix}`,
        parentId: lot.body.id,
        unite: 'm3',
        quantite: 12,
      }),
    }),
  );
  if (art.status !== 201) throw new Error(`article ${art.status} ${art.text}`);

  for (const etape of [2, 3]) {
    const step = await json(
      await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/etape`, {
        method: 'PUT',
        headers: h,
        body: JSON.stringify({ etape }),
      }),
    );
    if (!step.ok) throw new Error(`etape ${etape} ${step.status} ${step.text}`);
  }
  return { dossierId, articleLibelle: `Beton picker 260 ${suffix}` };
}

async function assertNoExtraireCreer(dialog, where) {
  const extraire = dialog.getByRole('button', { name: /Extraire|Créer dans le catalogue/i });
  assert((await extraire.count()) === 0, `AC-13 ${where}: CTA Extraire / Créer présent`);
}

async function openDossierPicker(page, dossierId, articleLibelle) {
  await page.goto(`${APP_BASE}/etudes/dossiers/${dossierId}`, { waitUntil: 'domcontentloaded' });
  const article = page.getByText(articleLibelle).first();
  await article.waitFor({ timeout: 25000 });
  await article.click();
  const drawer = page.locator('.poste-drawer');
  try {
    await drawer.waitFor({ timeout: 15000 });
  } catch {
    const body = (await page.locator('body').innerText()).slice(0, 800);
    throw new Error(`drawer introuvable url=${page.url()} body=${body}`);
  }
  await page.getByRole('heading', { name: articleLibelle }).waitFor({ timeout: 15000 });
  const decompo = page.getByRole('button', { name: /Je décompose/i });
  const catalogueBtn = page.getByRole('button', { name: /Ajouter depuis le catalogue/i });
  await Promise.race([
    decompo.waitFor({ state: 'visible', timeout: 15000 }),
    catalogueBtn.waitFor({ state: 'visible', timeout: 15000 }),
  ]);
  if (await decompo.isVisible().catch(() => false)) {
    await decompo.click();
    const continuer = page.getByRole('button', { name: /^Continuer$/i });
    try {
      await continuer.waitFor({ state: 'visible', timeout: 4000 });
      await continuer.click();
    } catch {
      /* déjà en décompo */
    }
  }
  await page.getByRole('button', { name: /Ajouter depuis le catalogue/i }).first().waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Ajouter depuis le catalogue/i }).first().click();
  const dialog = page.locator('app-catalog-item-pick-dialog');
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator('app-article-picker').waitFor({ timeout: 5000 });
  return dialog;
}

async function main() {
  assertStaticWiring();

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
  const { dossierId, articleLibelle } = await seedDossierCout(h, suffix);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const itemListGets = [];
  const itemSearchGets = [];
  page.on('request', (req) => {
    if (req.method() !== 'GET') return;
    const url = req.url();
    if (!url.includes('/api/v1/items')) return;
    if (url.includes('/api/v1/items/search')) itemSearchGets.push(url);
    else if (/\/api\/v1\/items(\?|$)/.test(url) && !url.includes('/lookup') && !url.includes('/identites')) {
      itemListGets.push(url);
    }
  });

  try {
    const dialog = await openDossierPicker(page, dossierId, articleLibelle);
    const hits = dialog.locator('[data-testid="article-picker-hit"]');
    const q = dialog.getByTestId('article-picker-q');

    /* —— picker-ouverture-vide (AC-1) —— */
    if (itemListGets.length > 0) {
      throw new Error(`VU ROUGE AC-1: dump GET /api/v1/items à l’ouverture (${itemListGets[0]})`);
    }
    assert(itemSearchGets.length === 0, `AC-1: search appelée trop tôt à l’ouverture (${itemSearchGets[0]})`);
    assert((await hits.count()) === 0, `AC-1: liste déjà remplie à l’ouverture (${await hits.count()} hits)`);
    await assertNoExtraireCreer(dialog, 'ouverture');
    console.log('PASS picker-ouverture-vide AC-1');

    /* —— picker-aucun-resultat (AC-13) —— */
    await q.click();
    await q.fill('');
    await q.pressSequentially('zzqxnevermatch260xyz', { delay: 20 });
    await dialog.getByText(/Aucun article ne correspond/i).waitFor({ timeout: 15000 });
    assert((await hits.count()) === 0, `AC-13: hits présents alors que 0 attendu (${await hits.count()})`);
    await assertNoExtraireCreer(dialog, '0 hit');
    console.log('PASS picker-aucun-resultat AC-13');

    /* —— picker-erreur-reseau (AC-14) —— */
    await page.route('**/api/v1/items/search**', (route) => route.abort());
    await q.fill('ci');
    await page.waitForTimeout(450);
    await dialog.getByRole('button', { name: /Relancer/i }).waitFor({ timeout: 8000 });
    assert(
      await dialog.getByText(/catalogue n.a pas répondu/i).count(),
      'AC-14: message d’échec réseau absent',
    );
    await dialog.waitFor({ state: 'visible', timeout: 2000 });
    await page.unroute('**/api/v1/items/search**');
    await dialog.getByRole('button', { name: /Relancer/i }).click();
    await hits.first().waitFor({ timeout: 8000 });
    await dialog.waitFor({ state: 'visible', timeout: 2000 });
    console.log('PASS picker-erreur-reseau AC-14');

    /* —— hits + pied DPU (AC-7, AC-9) —— */
    const firstText = await hits.first().innerText();
    assert(/\d/.test(firstText), `AC-7: hit sans PU/unité visible: ${firstText.slice(0, 120)}`);
    const qty = dialog.getByTestId('article-picker-qty');
    await qty.waitFor({ timeout: 5000 });
    assert((await qty.inputValue()) !== '', 'AC-9: qty vide au pied DPU');
    const pu = dialog.getByTestId('article-picker-pu');
    await pu.waitFor({ timeout: 5000 });
    assert((await pu.inputValue()) !== '', 'AC-9: PU tarif vide au pied DPU');
    await dialog.getByTestId('article-picker-add-dpu').waitFor({ timeout: 5000 });
    console.log('PASS picker-dpu-ajouter-au-poste AC-9 (qty + PU tarif + CTA)');

    /* —— picker-clavier (AC-8) —— */
    async function waitHitFocused(index, msg) {
      const start = Date.now();
      while (Date.now() - start < 2000) {
        const sel = await hits.nth(index).getAttribute('aria-selected');
        if (sel === 'true') return;
        await page.waitForTimeout(50);
      }
      const states = [];
      const n = Math.min(await hits.count(), 4);
      for (let i = 0; i < n; i += 1) {
        states.push(`${i}=${await hits.nth(i).getAttribute('aria-selected')}`);
      }
      throw new Error(`${msg} [${states.join(' ')}]`);
    }
    assert((await hits.count()) >= 2, `AC-8: besoin de ≥2 hits, got ${await hits.count()}`);
    await waitHitFocused(0, 'AC-8: premier hit non focusé après search');
    const ap = dialog.locator('.ap');
    await ap.focus();
    await page.keyboard.press('ArrowDown');
    await waitHitFocused(1, 'AC-8: ↓ n’a pas déplacé le focus sur le 2ᵉ hit');
    await page.keyboard.press('ArrowUp');
    await waitHitFocused(0, 'AC-8: ↑ n’a pas ramené le focus sur le 1ᵉʳ hit');
    await page.keyboard.press('Enter');
    await dialog.waitFor({ state: 'hidden', timeout: 8000 });
    console.log('PASS picker-clavier AC-8');

    /* —— AC-12 : ouverture header, aucun preset nature —— */
    const searchBeforeReopen = itemSearchGets.length;
    await page.getByTestId('depuis-catalogue').click();
    await dialog.waitFor({ timeout: 10000 });
    await page.waitForTimeout(400);
    assert(
      itemSearchGets.length === searchBeforeReopen,
      `AC-12: ouverture header a déclenché search (${itemSearchGets[itemSearchGets.length - 1]})`,
    );
    assert(
      (await dialog.locator('.ap__chip--on').count()) === 0,
      'AC-12: un chip nature est pré-rempli à l’ouverture header',
    );
    const searchBeforeHuman = itemSearchGets.length;
    await dialog.getByTestId('article-picker-nature-MATIERE').click();
    await page.waitForTimeout(400);
    assert(
      itemSearchGets.length > searchBeforeHuman,
      'AC-12: chip posé par l’humain n’a pas déclenché GET /items/search',
    );
    const lastSearch = itemSearchGets[itemSearchGets.length - 1] || '';
    assert(
      lastSearch.includes('nature=MATIERE'),
      `AC-12: search humain sans nature=MATIERE (${lastSearch})`,
    );
    console.log('PASS picker-dpu-ajouter-au-poste AC-12 (header, pas de preset, chip humain)');

    console.log(
      'PASS SEKTOR-260 — picker partagé catalogue, DPU sans dump, AC-1/8/9/12/13/14',
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
