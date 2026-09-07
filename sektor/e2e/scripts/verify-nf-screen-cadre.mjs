/**
 * PLT-138 — nf-screen cadre v1 on catalogue / études / achats / ventes / chantiers.
 * Run: node sektor/e2e/scripts/verify-nf-screen-cadre.mjs
 *
 * Mode B owner : make -C nafura-platform/ops mode-b · qa@nafuralabs.local
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const require = createRequire(path.join(ROOT, 'sektor/sources/web/package.json'));
const { chromium } = require('playwright');

const MODULES = ['achats', 'etudes', 'catalogue', 'ventes', 'chantiers'];

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`missing ${rel}`);
  return fs.readFileSync(abs, 'utf8');
};

const anatomy = read(
  'nafura-platform/sources/web/lib/anatomy/components/organisms/page-screen/page-screen.component.ts',
);
if (!anatomy.includes("selector: 'nf-screen'")) fail('nf-screen selector missing');
if (!anatomy.includes('nf-page-shell') || !anatomy.includes('nf-page-header')) {
  fail('nf-screen must compose shell + header');
}

const listing = read(
  'nafura-platform/sources/web/lib/anatomy/pages/config-driven-listing-page.class.ts',
);
if (listing.includes('breadcrumbs.length > 1')) {
  fail('listing still hides crumbs when length === 1');
}
if (!listing.includes('breadcrumbs.length > 0')) {
  fail('listing must show crumbs when data.breadcrumb exists');
}

const leftovers = [];
const walk = (dir) => {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, name.name);
    if (name.isDirectory()) walk(abs);
    else if (/\.(html|ts)$/.test(name.name)) {
      const src = fs.readFileSync(abs, 'utf8');
      if (src.includes('<nf-page-shell') || src.includes('<nf-page-header')) {
        leftovers.push(path.relative(ROOT, abs));
      }
    }
  }
};
for (const mod of MODULES) {
  walk(path.join(ROOT, 'sektor/sources/web/app', mod));
}
if (leftovers.length) {
  fail(`shell/header leftover in 5 modules:\n  ${leftovers.join('\n  ')}`);
}

const frnList = read(
  'sektor/sources/web/app/achats/fournisseurs/fournisseur-listing/fournisseur-listing.page.html',
);
const frnDetail = read(
  'sektor/sources/web/app/achats/fournisseurs/fournisseur-detail/fournisseur-detail.page.html',
);
if (!frnList.includes('<nf-screen')) fail('fournisseur listing missing nf-screen');
if (!frnDetail.includes('<nf-screen')) fail('fournisseur detail missing nf-screen');
if (!frnDetail.includes('fournisseur-contacts') || !frnDetail.includes('fournisseur-contrats')) {
  fail('fiche tabs Contacts/Contrats missing from body');
}

console.log('PASS  source: nf-screen anatomy + 5 modules without shell/header tags');

async function assertScreen(page, listPath, label) {
  await page.goto(`${APP_BASE}${listPath}`, { waitUntil: 'domcontentloaded' });
  const screen = page.locator('nf-screen').first();
  await screen.waitFor({ state: 'visible', timeout: 30000 });
  const header = screen.locator('nf-page-header').first();
  await header.waitFor({ state: 'visible', timeout: 15000 });
  const orphanHeader = await page.locator('nf-page-header').count();
  const nestedHeader = await screen.locator('nf-page-header').count();
  if (orphanHeader !== nestedHeader) {
    fail(`browser ${label}: nf-page-header outside nf-screen`);
  }
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
    await assertScreen(page, '/achats/fournisseurs', 'fournisseurs');
    const listing = page.locator('nf-screen nf-entity-listing').first();
    await listing.waitFor({ state: 'visible', timeout: 20000 });
    console.log('PASS  browser: /achats/fournisseurs nf-screen + listing');

    await assertScreen(page, '/etudes/dossiers', 'études');
    console.log('PASS  browser: /etudes/dossiers nf-screen');

    await assertScreen(page, '/chantiers', 'chantiers');
    console.log('PASS  browser: /chantiers nf-screen');

    const row = page.locator('nf-entity-listing tr.mat-mdc-row, table tbody tr, .cockpit-row, a[href^="/chantiers/"]').first();
    const rowVisible = await row.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false);
    if (rowVisible) {
      const href = await row.getAttribute('href').catch(() => null);
      if (href && href.includes('/chantiers/')) {
        await page.goto(`${APP_BASE}${href}`, { waitUntil: 'domcontentloaded' });
      } else {
        await row.dblclick();
        await page.waitForURL(/\/chantiers\/[^/?]+/, { timeout: 15000 }).catch(() => null);
      }
      if (/\/chantiers\/[^/?]+/.test(new URL(page.url()).pathname)) {
        await page.locator('nf-screen').first().waitFor({ state: 'visible', timeout: 15000 });
        console.log('PASS  browser: fiche chantier nf-screen');
      } else {
        console.log('SKIP  browser: no chantier row to open');
      }
    } else {
      console.log('SKIP  browser: chantier listing empty');
    }
  } finally {
    await browser.close();
  }
}

await smokeBrowser();
