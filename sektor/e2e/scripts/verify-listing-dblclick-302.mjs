/**
 * SEKTOR-302 — listing anatomy: single click selects, double-click opens detail.
 *
 * Discrimination (rouge avant) :
 * - onRowClick naviguait si selectionMode === 'none' (M-TRA-02)
 * - data-table skipait le garde 250 ms et émettait rowClick au premier clic
 * - listings Sektor forçaient selectionMode: 'none' (ex. Études)
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const require = createRequire(path.join(ROOT, 'sektor/sources/web/package.json'));
const { chromium } = require('playwright');

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`missing ${rel}`);
  return fs.readFileSync(abs, 'utf8');
};

const LISTING =
  'nafura-platform/sources/web/lib/anatomy/components/organisms/entity-listing/entity-listing.component.ts';
const TABLE =
  'nafura-platform/sources/web/lib/anatomy/components/organisms/data-table/data-table.component.ts';
const BUILDER =
  'nafura-platform/sources/web/lib/anatomy/config/listing-config.builder.ts';
const ETUDES =
  'sektor/sources/web/app/etudes/dossiers/config/listing.config.ts';

const listing = read(LISTING);
const table = read(TABLE);
const builder = read(BUILDER);
const etudes = read(ETUDES);

const onRowClick = listing.slice(
  listing.indexOf('onRowClick(item: TItem): void'),
  listing.indexOf('onRowDblClick(item: TItem): void'),
);
if (onRowClick.includes('router.navigate')) {
  fail('onRowClick must not navigate — detail is onRowDblClick only');
}
if (!onRowClick.includes('openOnRowClick()')) {
  fail('onRowClick must keep the Master–Slave openOnRowClick exception');
}
if (onRowClick.includes("selectionMode === 'none'") && onRowClick.includes('navigate')) {
  fail('M-TRA-02 single-click open is back');
}

const onRowDblClick = listing.slice(
  listing.indexOf('onRowDblClick(item: TItem): void'),
  listing.indexOf('onRowAction(event:'),
);
if (!onRowDblClick.includes('router.navigate') || !onRowDblClick.includes('routes.detail')) {
  fail('onRowDblClick must navigate to routes.detail');
}

if (table.includes('open detail on first click') || table.includes('skip dblclick guard')) {
  fail('data-table still opens on first click when not selectable');
}
if (!table.includes(', 250)')) {
  fail('data-table must debounce single click (250ms) so dblclick can cancel it');
}

if (!builder.includes("selectionMode: 'toggleable'")) {
  fail('DEFAULT_FEATURES must keep selectionMode toggleable');
}
if (etudes.includes("selectionMode: 'none'")) {
  fail('Études listing must not override selectionMode to none');
}

const appRoot = path.join(ROOT, 'sektor/sources/web/app');
const leftovers = [];
const walk = (dir) => {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, name.name);
    if (name.isDirectory()) walk(abs);
    else if (name.name.endsWith('.ts')) {
      const src = fs.readFileSync(abs, 'utf8');
      if (src.includes("selectionMode: 'none'")) leftovers.push(path.relative(ROOT, abs));
    }
  }
};
walk(appRoot);
if (leftovers.length) {
  fail(`selectionMode none still set:\n  ${leftovers.join('\n  ')}`);
}

console.log('OK    SEKTOR-302 source: dblclick opens, click selects, no none override');

async function assertListingDblclick(page, listPath, detailRe, label) {
  await page.goto(`${APP_BASE}${listPath}`, { waitUntil: 'domcontentloaded' });
  const row = page.locator('nf-entity-listing tr.mat-mdc-row').first();
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.click();
  const openedOnClick = await page
    .waitForURL(detailRe, { timeout: 500 })
    .then(() => true)
    .catch(() => false);
  if (openedOnClick) fail(`browser ${label}: single click opened the record`);
  const pathOnly = new URL(page.url()).pathname;
  const listRe = new RegExp(`^${listPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?$`);
  if (!listRe.test(pathOnly)) {
    fail(`browser ${label}: after single click URL drifted to ${page.url()}`);
  }
  await row.dblclick();
  await page.waitForURL(detailRe, { timeout: 15000 });
}

async function smokeBrowser() {
  const probe = await fetch(APP_BASE).catch(() => null);
  if (!probe?.ok) {
    console.log('SKIP browser — Mode B front not up on', APP_BASE);
    return;
  }
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await assertListingDblclick(
      page,
      '/etudes/dossiers',
      /\/etudes\/dossiers\/[^/]+$/,
      'études',
    );
    await assertListingDblclick(
      page,
      '/ventes/clients',
      /\/ventes\/clients\/[^/]+$/,
      'clients',
    );
    console.log('OK    SEKTOR-302 browser: études + clients click stays, dblclick opens');
  } finally {
    await browser.close();
  }
}

await smokeBrowser();
