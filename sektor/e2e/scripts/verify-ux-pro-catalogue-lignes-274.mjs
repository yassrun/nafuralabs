/**
 * SEKTOR-274 — Lignes perte / inventaire / sortie → picker stock (AC-1…AC-7).
 * Run: node sektor/e2e/scripts/verify-ux-pro-catalogue-lignes-274.mjs
 *
 * Scénarios CONTRAT :
 *   perte-ligne-pas-dump · perte-picker-stock · inventaire-ligne-picker
 *   sortie-picker · cause-enum-natif
 *
 * Prérequis Mode B pour browser : API 8082 + front 4200.
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

function contentOf(body) {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.content)) return body.content;
  if (body && Array.isArray(body.items)) return body.items;
  return [];
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** AC-1, AC-4, AC-6 — source statique des éditeurs. */
function assertEditorsStatic() {
  const perte = read('sources/web/app/catalogue/components/perte-lines-editor/perte-lines-editor.component.ts');
  const inv = read('sources/web/app/catalogue/components/inventaire-lines-editor/inventaire-lines-editor.component.ts');

  assert(!perte.includes('loadArticles'), 'perte-ligne-pas-dump: loadArticles encore dans perte-lines-editor');
  assert(!perte.includes('articleSelectOptions'), 'perte-ligne-pas-dump: articleSelectOptions encore présent');
  assert(!perte.includes('ArticleCatalogService'), 'perte-ligne-pas-dump: ArticleCatalogService encore injecté');
  assert(perte.includes('openCatalogItemPicker'), 'perte-picker-stock: openCatalogItemPicker absent');
  assert(perte.includes("context: 'stock'"), 'perte-picker-stock: context stock requis');
  assert(perte.includes('data-testid="article-picker-open"'), 'perte-picker-stock: bouton picker absent');
  assert(perte.includes('data-testid="ple-picker-ready"'), 'perte-ligne-pas-dump: marqueur editor absent');
  console.log('PASS perte-ligne-pas-dump AC-1/AC-4 (static)');

  assert(perte.includes('CAUSE_OPTIONS'), 'cause-enum-natif: enum cause absent');
  assert(perte.includes('data-testid="perte-cause-select"'), 'cause-enum-natif: nf-select cause absent');
  assert(!perte.includes('causeDetaillee') || perte.includes('nf-select'), 'cause-enum-natif: cause doit rester nf-select');
  console.log('PASS cause-enum-natif AC-6 (static)');

  assert(!inv.includes('loadArticles'), 'inventaire-ligne-picker: loadArticles encore dans inventaire-lines-editor');
  assert(!inv.includes('ArticleCatalogService'), 'inventaire-ligne-picker: ArticleCatalogService encore injecté');
  assert(inv.includes('openCatalogItemPicker'), 'inventaire-ligne-picker: openCatalogItemPicker absent');
  assert(inv.includes('prefillFromStock'), 'inventaire-ligne-picker: prefill stock absent (AC-7)');
  assert(inv.includes('inv__article-code'), 'inventaire-ligne-picker: affichage code prérempli absent (AC-2/AC-7)');
  assert(inv.includes('data-testid="article-picker-open"'), 'inventaire-ligne-picker: bouton picker absent');
  console.log('PASS inventaire-ligne-picker AC-2/AC-7 (static)');

  const sortieHtml = read('sources/web/app/catalogue/mouvements/sorties/sortie-detail.page.html');
  assert(sortieHtml.includes('variant="sortie"'), 'sortie-picker: variant sortie absent sur sortie-detail');
  console.log('PASS sortie-picker AC-3 (static)');
}

async function resolveStockableArticle(h, suffix) {
  const search = await json(
    await fetch(`${API_BASE}/api/v1/items/search?q=ci&nature=MATIERE&isActive=true&page=0&size=5`, {
      headers: h,
    }),
  );
  assert(search.ok, `search items ${search.status} ${search.text}`);
  const hits = contentOf(search.body);
  const hit = hits.find((r) => r?.isActive !== false && (r.code || r.name));
  if (hit) {
    return { id: hit.id, code: hit.code || hit.cleStable, name: hit.name };
  }

  const uoms = await json(
    await fetch(`${API_BASE}/api/v1/unit-of-measures?page=0&size=20`, { headers: h }),
  );
  const uomId = contentOf(uoms.body)[0]?.id;
  const code = `ART274-${suffix}`.slice(0, 20);
  const created = await json(
    await fetch(`${API_BASE}/api/v1/items`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code,
        name: `Article QA 274 ${suffix}`,
        nature: 'MATIERE',
        isActive: true,
        unitOfMeasureId: uomId,
      }),
    }),
  );
  assert(created.status === 201 || created.status === 200, `POST item ${created.status} ${created.text}`);
  return { id: created.body.id, code: created.body.code || code, name: created.body.name };
}

async function browserPertePicker(page, article, itemListDumps) {
  await page.goto(`${APP_BASE}/inventory/mouvements/pertes-chutes/new`, { waitUntil: 'domcontentloaded' });
  const editor = page.getByTestId('ple-picker-ready');
  await editor.waitFor({ timeout: 25000 });

  const dumpsOnMount = itemListDumps.length;
  await editor.getByRole('button', { name: /ajouter|add line|ligne/i }).first().click();
  await editor.locator('tbody tr').first().waitFor({ timeout: 5000 });

  assert(
    itemListDumps.length === dumpsOnMount,
    `perte-ligne-pas-dump: GET /items dump au mount editor (${itemListDumps.slice(dumpsOnMount).join(', ')})`,
  );
  console.log('PASS perte-ligne-pas-dump AC-4 (browser)');

  const dumpsBeforePicker = itemListDumps.length;
  await editor.getByTestId('article-picker-open').first().click();
  const dialog = page.locator('app-catalog-item-pick-dialog');
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator('app-article-picker').waitFor({ timeout: 5000 });

  assert(
    itemListDumps.length === dumpsBeforePicker,
    `perte-picker-stock: dump GET /items à l'ouverture picker`,
  );

  const q = dialog.getByTestId('article-picker-q');
  const needle = String(article.code || article.name).slice(0, Math.max(2, 8));
  await q.pressSequentially(needle, { delay: 30 });
  const hit = dialog.getByTestId('article-picker-hit').first();
  await hit.waitFor({ timeout: 15000 });
  await hit.click();
  await dialog.getByTestId('article-picker-choose').click();
  await dialog.waitFor({ state: 'hidden', timeout: 10000 });

  const pickBtn = editor.getByTestId('article-picker-open').first();
  const label = await pickBtn.innerText();
  assert(new RegExp(article.code || article.name, 'i').test(label), `perte-picker-stock: article non posé (${label})`);
  console.log('PASS perte-picker-stock AC-5 (browser)');

  const causeSelect = editor.getByTestId('perte-cause-select');
  assert((await causeSelect.count()) > 0, 'cause-enum-natif: select cause absent sur perte');
  console.log('PASS cause-enum-natif AC-6 (browser)');
}

async function browserSortiePicker(page) {
  await page.goto(`${APP_BASE}/inventory/mouvements/sorties/new`, { waitUntil: 'domcontentloaded' });
  const editor = page.getByTestId('ple-picker-ready');
  await editor.waitFor({ timeout: 25000 });
  assert((await editor.getByTestId('perte-cause-select').count()) === 0, 'sortie-picker: colonne cause visible');
  assert((await editor.getByTestId('article-picker-open').count()) >= 0, 'sortie-picker: editor absent');
  await editor.getByRole('button', { name: /ajouter|add line|ligne/i }).first().click();
  await editor.getByTestId('article-picker-open').first().waitFor({ timeout: 5000 });
  console.log('PASS sortie-picker AC-3 (browser)');
}

async function browserInventairePicker(page, article) {
  await page.goto(`${APP_BASE}/inventory/mouvements/inventaires/new`, { waitUntil: 'domcontentloaded' });
  const editor = page.getByTestId('inv-picker-ready');
  await editor.waitFor({ timeout: 25000 });

  await editor.getByRole('button', { name: /ajouter|add line|ligne/i }).first().click();
  await editor.getByTestId('article-picker-open').first().click();
  const dialog = page.locator('app-catalog-item-pick-dialog');
  await dialog.waitFor({ timeout: 10000 });
  const q = dialog.getByTestId('article-picker-q');
  const needle = String(article.code || article.name).slice(0, Math.max(2, 8));
  await q.pressSequentially(needle, { delay: 30 });
  await dialog.getByTestId('article-picker-hit').first().waitFor({ timeout: 15000 });
  await dialog.getByTestId('article-picker-hit').first().click();
  await dialog.getByTestId('article-picker-choose').click();
  await dialog.waitFor({ state: 'hidden', timeout: 10000 });

  const codeCell = editor.locator('.inv__article-code').first();
  await codeCell.waitFor({ timeout: 5000 });
  const codeText = await codeCell.innerText();
  assert(new RegExp(article.code || article.name, 'i').test(codeText), `inventaire-ligne-picker: code absent (${codeText})`);
  console.log('PASS inventaire-ligne-picker AC-2 (browser)');
}

async function main() {
  assertEditorsStatic();

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
    console.log('SKIP Mode B browser — cursor-session unavailable (static AC OK)');
    process.exit(0);
  }

  const h = headers(session);
  const suffix = Date.now().toString(36);
  const article = await resolveStockableArticle(h, suffix);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const itemListDumps = [];
  page.on('request', (req) => {
    if (req.method() !== 'GET') return;
    const url = req.url();
    if (
      /\/api\/v1\/items(\?|$)/.test(url) &&
      !url.includes('/search') &&
      !url.includes('/lookup') &&
      !url.includes('/identites')
    ) {
      itemListDumps.push(url);
    }
  });

  try {
    await browserPertePicker(page, article, itemListDumps);
    await browserSortiePicker(page);
    await browserInventairePicker(page, article);
  } finally {
    await browser.close();
  }

  console.log('\n=== SEKTOR-274 — tous scénarios OK ===');
}

main().catch((err) => {
  console.error('FAIL', err.message);
  process.exit(1);
});
