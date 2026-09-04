/**
 * SEKTOR-264 / SEKTOR-265 / SEKTOR-279 — Consultation Achats UX pro (create + chrome).
 * Run: node sektor/e2e/scripts/verify-ux-pro-consultation.mjs
 *
 * Create (SEKTOR-279 casse AC-10 UX pro) :
 *   cs-create-no-textarea · cs-create-panier-picker · cs-create-no-fournisseur
 *   cs-create-submit
 *
 * Prérequis Mode B pour la partie browser : API 8082 + front 4200.
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

const here = dirname(fileURLToPath(import.meta.url));
const webPkg = join(here, '../../sources/web/package.json');
const require = createRequire(webPkg);
const { chromium } = require('playwright');

function read(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) throw new Error(`missing ${rel}`);
  return readFileSync(abs, 'utf8');
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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** AC-7…AC-9 chrome picker + AC-1 RFQ (plus de fournisseur sur create). */
function assertCreateStatic() {
  const ts = read('sources/web/app/achats/consultations/consultation-create/consultation-create.page.ts');
  const html = read('sources/web/app/achats/consultations/consultation-create/consultation-create.page.html');
  const dialog = read(
    'sources/web/app/etudes/dossiers/components/catalog-item-pick-dialog/catalog-item-pick-dialog.component.ts',
  );
  const picker = read('sources/web/app/catalogue/components/article-picker/article-picker.component.ts');

  assert(!ts.includes('clesText'), 'cs-create-no-textarea: clesText encore présent');
  assert(!/<textarea/i.test(html), 'cs-create-no-textarea: <textarea> sur create');
  assert(!/ciment-cpj-45/i.test(html), 'cs-create-no-textarea: placeholder cle_stable libre');
  assert(!/Panier \(cle_stable/i.test(html), 'cs-create-no-textarea: label panier textarea');
  console.log('PASS cs-create-no-textarea AC-7');

  assert(ts.includes('openCatalogItemPicker'), 'cs-create-panier-picker: openCatalogItemPicker absent');
  assert(ts.includes("context: 'lookup'"), 'cs-create-panier-picker: context lookup requis (pas DPU)');
  assert(html.includes('consultation-create-add-article'), 'cs-create-panier-picker: CTA ajouter absent');
  assert(html.includes('consultation-create-panier'), 'cs-create-panier-picker: zone panier absente');
  assert(ts.includes('removeArticle') || html.includes('Retirer'), 'cs-create-panier-picker: retirer absent');
  assert(picker.includes("selector: 'app-article-picker'"), 'cs-create-panier-picker: app-article-picker manquant');
  assert(dialog.includes('ArticlePickerComponent'), 'cs-create-panier-picker: dialog sans ArticlePicker');
  assert(dialog.includes('cleStable'), 'cs-create-panier-picker: dialog doit exposer cleStable');
  console.log('PASS cs-create-panier-picker AC-8/AC-9');

  assert(!html.includes('name="fournisseurId"'), 'cs-create-no-fournisseur: name=fournisseurId encore sur create');
  assert(
    !html.includes('lookupKey="fournisseurs"'),
    'cs-create-no-fournisseur: lookupKey fournisseurs encore sur create (AC-10 cassé)',
  );
  assert(!/un fournisseur \+ panier/i.test(ts) && !/un fournisseur \+ panier/i.test(html), 'copy « un fournisseur + panier »');
  assert(/panier d.articles/i.test(ts) || /panier d.articles/i.test(html), 'copy panier d’articles absente');
  console.log('PASS cs-create-no-fournisseur AC-1 (casse AC-10 UX pro)');

  assert(html.includes('nf-action-bar'), 'cs-create-submit: nf-action-bar absente');
  const detailHtml = read(
    'sources/web/app/achats/consultations/consultation-detail/consultation-detail.page.html',
  );
  const detailTs = read(
    'sources/web/app/achats/consultations/consultation-detail/consultation-detail.page.ts',
  );
  assert(
    !detailHtml.includes('<td>{{ cle }}</td>'),
    'fiche panier: désignation encore égale à la clé technique',
  );
  assert(detailTs.includes('panierLignes'), 'fiche panier: résolution catalogue absente');
  assert(detailTs.includes('getByCleStable'), 'fiche panier: GET identites absente');
  assert(detailHtml.includes('consultation-lien-etude'), 'fiche: lien dossier étude absent');
  console.log('PASS cs-fiche-panier-libelle (code ≠ slug désignation)');

  assert(ts.includes('clesStables'), 'cs-create-submit: payload clesStables absent');
  assert(ts.includes('Ajoutez au moins un article'), 'cs-create-submit: validation panier vide absente');
  assert(!ts.includes('Choisir un fournisseur'), 'cs-create-submit: validation fournisseur encore présente');
  assert(ts.includes('/achats/consultations/${created.id}'), 'cs-create-submit: nav fiche absente');
  console.log('PASS cs-create-submit (static) AC-11/AC-12');
}

async function resolveArticles(h, suffix) {
  const listing = await json(await fetch(`${API_BASE}/api/v1/items?page=0&size=50`, { headers: h }));
  assert(listing.ok, `GET items ${listing.status} ${listing.text}`);
  const rows = Array.isArray(listing.body)
    ? listing.body
    : listing.body?.content ?? listing.body?.items ?? [];
  const active = rows.filter((r) => r?.isActive !== false && (r.cleStable || r.code));
  if (active.length >= 2) {
    return active.slice(0, 2).map((r) => ({
      id: r.id,
      cleStable: r.cleStable || r.code,
      code: r.code || r.cleStable,
      name: r.name,
    }));
  }

  const uoms = await json(
    await fetch(`${API_BASE}/api/v1/unit-of-measures?page=0&size=20`, { headers: h }),
  );
  const uomList = Array.isArray(uoms.body)
    ? uoms.body
    : uoms.body?.content ?? uoms.body?.items ?? [];
  const uomId = uomList[0]?.id;

  const articles = [];
  for (const [slug, name] of [
    [`ciment-qa264-${suffix}`, `Ciment QA 264 ${suffix}`],
    [`sable-qa264-${suffix}`, `Sable QA 264 ${suffix}`],
  ]) {
    const payload = {
      code: slug,
      name,
      cleStable: slug,
      nature: 'MATIERE',
      isActive: true,
    };
    if (uomId) payload.unitOfMeasureId = uomId;
    const created = await json(
      await fetch(`${API_BASE}/api/v1/items`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(payload),
      }),
    );
    if (created.status !== 201 && created.status !== 200) {
      throw new Error(`item ${slug} ${created.status} ${created.text}`);
    }
    articles.push({
      id: created.body.id,
      cleStable: created.body.cleStable || slug,
      code: created.body.code || slug,
      name: created.body.name || name,
    });
  }
  return articles;
}

async function main() {
  assertCreateStatic();

  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  let session;
  try {
    session = await sessionRes.json();
  } catch {
    session = null;
  }
  if (!session?.accessToken || !session?.tenantId) {
    console.log('SKIP Mode B browser — cursor-session unavailable (static AC-7…12 OK)');
    process.exit(0);
  }
  const h = headers(session);
  const suffix = Date.now().toString(36);
  const articles = await resolveArticles(h, suffix);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const itemListDumps = [];
  page.on('request', (req) => {
    if (req.method() !== 'GET') return;
    const url = req.url();
    if (/\/api\/v1\/items(\?|$)/.test(url) && !url.includes('/search') && !url.includes('/lookup') && !url.includes('/identites')) {
      itemListDumps.push(url);
    }
  });

  try {
    await page.goto(`${APP_BASE}/achats/consultations/new`, { waitUntil: 'domcontentloaded' });
    const form = page.getByTestId('consultation-create-form');
    await form.waitFor({ timeout: 25000 });

    assert(
      (await form.locator('textarea').count()) === 0,
      'browser AC-7: textarea panier encore visible dans le form',
    );
    console.log('PASS cs-create-no-textarea (browser)');

    assert(
      (await form.locator('nf-select').count()) === 0,
      'browser AC-1: combobox fournisseur encore sur create',
    );
    assert(
      (await form.locator('[name="fournisseurId"]').count()) === 0,
      'browser AC-1: name=fournisseurId encore sur create',
    );
    console.log('PASS cs-create-no-fournisseur (browser)');

    /* validation panier vide */
    await form.getByTestId('consultation-create-submit').click();
    await form.getByTestId('consultation-create-error').waitFor({ timeout: 5000 });
    const errText = await form.getByTestId('consultation-create-error').innerText();
    assert(/panier|article/i.test(errText), `AC-12: message panier vide inattendu: ${errText}`);
    console.log('PASS cs-create-submit validation panier vide AC-12');

    /* picker */
    const dumpsBefore = itemListDumps.length;
    await form.getByTestId('consultation-create-add-article').click();
    const dialog = page.locator('app-catalog-item-pick-dialog');
    await dialog.waitFor({ timeout: 10000 });
    await dialog.locator('app-article-picker').waitFor({ timeout: 5000 });
    assert(
      itemListDumps.length === dumpsBefore,
      `AC-9: dump GET /items à l’ouverture picker (${itemListDumps[dumpsBefore]})`,
    );
    const q = dialog.getByTestId('article-picker-q');
    await q.fill('');
    const searchTerm = (articles[0].code || articles[0].cleStable || articles[0].name).trim();
    const needle = searchTerm.slice(0, Math.max(2, Math.min(12, searchTerm.length)));
    await q.pressSequentially(needle, { delay: 30 });
    const hitMatcher = new RegExp(
      (articles[0].code || articles[0].cleStable || articles[0].name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    );
    const hit = dialog.locator('[data-testid="article-picker-hit"]').filter({ hasText: hitMatcher }).first();
    await hit.waitFor({ timeout: 15000 });
    await hit.click();
    await dialog.getByTestId('article-picker-choose').click();
    await form.getByTestId('consultation-create-panier-line').first().waitFor({ timeout: 8000 });
    console.log('PASS cs-create-panier-picker (browser) AC-8/AC-9');

    /* submit → fiche */
    await form.getByTestId('consultation-create-submit').click();
    await page.waitForURL(/\/achats\/consultations\/[0-9a-f-]+/i, { timeout: 20000 });
    const createdId = page.url().split('/').pop();
    const fetched = await json(
      await fetch(`${API_BASE}/api/v1/consultations-achat/${createdId}`, { headers: h }),
    );
    assert(fetched.ok, `GET consultation créée ${fetched.status} ${fetched.text}`);
    assert(fetched.body.statut === 'PREPARATION', `statut ${fetched.body.statut}`);
    assert(!(fetched.body.destinataires ?? []).length, 'create a attaché un destinataire');
    const panier = Array.isArray(fetched.body.clesStables) ? fetched.body.clesStables : [];
    assert(
      panier.includes(articles[0].cleStable) || panier.includes(articles[0].code),
      `AC-11: panier ${JSON.stringify(panier)} vs ${articles[0].cleStable}/${articles[0].code}`,
    );
    console.log('PASS cs-create-submit (browser) AC-11');
  } finally {
    await browser.close();
  }

  console.log('OK verify-ux-pro-consultation (create picker, plus de fournisseur unique)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
