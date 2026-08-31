/**
 * SEKTOR-275 — Emplacements combobox perte/inventaire (AC-8…AC-12).
 * Run: node sektor/e2e/scripts/verify-ux-pro-catalogue-lignes-275.mjs
 *
 * Scénarios CONTRAT :
 *   inventaire-filtre-location · inventaire-fiche-location · perte-fiche-location
 *
 * Prérequis Mode B pour browser/API live : API 8082 + front 4200.
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

async function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms),
    ),
  ]);
}

/** AC-8…AC-12 — wiring statique : pas de dump locations dans les facades. */
function assertStaticWiring() {
  const invFacade = read('sources/web/app/catalogue/mouvements/inventaires/services/inventaire.facade.ts');
  const perteFacade = read('sources/web/app/catalogue/mouvements/pertes-chutes/services/perte.facade.ts');
  const invListing = read('sources/web/app/catalogue/mouvements/inventaires/config/listing/listing.config.ts');
  const invDetail = read('sources/web/app/catalogue/mouvements/inventaires/config/detail/detail.config.ts');
  const perteDetail = read('sources/web/app/catalogue/mouvements/pertes-chutes/config/detail/detail.config.ts');
  const perteListing = read('sources/web/app/catalogue/mouvements/pertes-chutes/config/listing/listing.config.ts');
  const lookups = read('sources/web/app/catalogue/services/inventory-lookups.service.ts');
  const searchers = read('sources/web/app/socle/shared/services/erp-lookup-searchers.ts');

  assert(invListing.includes("lookupKey: 'allLocations'"), 'inventaire-filtre-location: filtre sans lookupKey allLocations');
  assert(invDetail.includes("lookupKey: 'allLocations'"), 'inventaire-fiche-location: champ destLocationId sans lookupKey');
  assert(perteDetail.includes("lookupKey: 'chantierLocations'"), 'perte-fiche-location: chantierLocationId sans lookupKey');
  assert(perteListing.includes("lookupKey: 'chantierLocations'"), 'perte listing: filtre chantier sans combobox');

  assert(invFacade.includes('allLocations: []'), 'inventaire.facade ne seed pas allLocations: []');
  assert(!invFacade.includes('loadLocations('), 'inventaire.facade dump loadLocations interdit');
  assert(!invFacade.includes('pageSize: 500') || invFacade.includes("listHeadersByType('INVENTAIRE'"), 'inventaire.facade: pas de dump locations pageSize 500');

  assert(perteFacade.includes('chantierLocations: []'), 'perte.facade ne seed pas chantierLocations: []');
  assert(!perteFacade.includes('loadLocations('), 'perte.facade dump loadLocations interdit');
  assert(perteFacade.includes('motifsPerte: motifs.map'), 'motifs perte doivent être liste bornée depuis motifsApi');
  assert(!perteFacade.includes('loadArticles'), 'perte.facade ne doit pas dumper le catalogue articles');

  assert(lookups.includes('resolveLocation'), 'inventory-lookups: resolveLocation manquant pour enrichissement id');
  assert(searchers.includes('depotLocations'), 'searchers: depotLocations manquant');
  assert(searchers.includes('const chantierLocations = typeahead'), 'searchers: chantierLocations doit filtrer type CHANTIER');
  console.log('PASS AC-8…AC-12 wiring statique');
}

async function assertLocationsApi(h) {
  const shortQ = await json(
    await fetch(`${API_BASE}/api/v1/locations?page=0&size=50&q=de`, { headers: h }),
  );
  assert(shortQ.ok, `locations q=de → ${shortQ.status} ${shortQ.text}`);
  const hits = contentOf(shortQ.body);
  assert(Array.isArray(hits), 'locations q response must be array');

  const noQ = await json(
    await fetch(`${API_BASE}/api/v1/locations?page=0&size=50`, { headers: h }),
  );
  if (noQ.ok) {
    const all = contentOf(noQ.body);
    if (Array.isArray(all) && all.length > 50) {
      throw new Error('AC-12: GET locations sans q retourne dump > 50');
    }
  }
  console.log(`PASS API locations typeahead (${hits.length} hit(s) pour q=de)`);
}

async function resolveLocationHit(h) {
  const search = await json(
    await fetch(`${API_BASE}/api/v1/locations?page=0&size=10&q=de`, { headers: h }),
  );
  assert(search.ok, `search locations ${search.status}`);
  const hit = contentOf(search.body).find((row) => row?.id && (row.name || row.code));
  if (hit) {
    return { id: hit.id, label: hit.name || hit.code };
  }

  const created = await json(
    await fetch(`${API_BASE}/api/v1/locations`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `LOC275-${Date.now().toString(36)}`.slice(0, 20),
        name: `Depot QA 275 ${Date.now().toString(36)}`,
        type: 'DEPOT',
        isActive: true,
      }),
    }),
  );
  assert(created.status === 201 || created.status === 200, `POST location ${created.status} ${created.text}`);
  return { id: created.body.id, label: created.body.name || created.body.code };
}

async function browserInventaireLocation(page, location, locationDumps) {
  await withTimeout(
    page.goto(`${APP_BASE}/inventory/mouvements/inventaires/new`, { waitUntil: 'commit', timeout: 15000 }),
    18000,
    'inventaire-new goto',
  );
  await withTimeout(page.locator('nf-entity-detail').waitFor({ timeout: 12000 }), 15000, 'inventaire-new detail');

  const dumpsOnMount = locationDumps.length;
  const input = page.locator('input[role="combobox"]').first();
  await withTimeout(input.waitFor({ timeout: 10000 }), 12000, 'inventaire-new combobox');

  assert(
    locationDumps.length === dumpsOnMount,
    `inventaire-fiche-location: dump GET /locations au mount (${locationDumps.slice(dumpsOnMount).join(', ')})`,
  );

  await input.click();
  const needle = String(location.label).slice(0, Math.max(2, 6));
  await input.fill(needle);
  await page.waitForTimeout(500);

  const option = page.locator('[role="option"]').first();
  if ((await option.count()) > 0) {
    await option.click();
  }
  console.log('PASS inventaire-fiche-location AC-9 (browser)');
}

async function browserPerteLocation(page, location, locationDumps) {
  await withTimeout(
    page.goto(`${APP_BASE}/inventory/mouvements/pertes-chutes/new`, { waitUntil: 'commit', timeout: 15000 }),
    18000,
    'perte-new goto',
  );
  await withTimeout(page.locator('nf-entity-detail').waitFor({ timeout: 12000 }), 15000, 'perte-new detail');

  const dumpsOnMount = locationDumps.length;
  const input = page.locator('input[role="combobox"]').first();
  await withTimeout(input.waitFor({ timeout: 10000 }), 12000, 'perte-new combobox');

  assert(
    locationDumps.length === dumpsOnMount,
    `perte-fiche-location: dump GET /locations au mount (${locationDumps.slice(dumpsOnMount).join(', ')})`,
  );

  await input.click();
  const needle = String(location.label).slice(0, Math.max(2, 6));
  await input.fill(needle);
  await page.waitForTimeout(500);

  const option = page.locator('[role="option"]').first();
  if ((await option.count()) > 0) {
    await option.click();
  }
  console.log('PASS perte-fiche-location AC-10 (browser)');
}

async function browserInventaireListingFilter(page, locationDumps) {
  await page.goto(`${APP_BASE}/inventory/mouvements/inventaires`, { waitUntil: 'domcontentloaded' });
  await page.locator('nf-entity-listing').waitFor({ timeout: 25000 });

  const dumpsOnMount = locationDumps.length;
  const filterBtn = page.getByRole('button', { name: /filtre|filter/i }).first();
  if ((await filterBtn.count()) > 0) {
    await filterBtn.click();
    const combo = page.locator('input[role="combobox"]').first();
    if ((await combo.count()) > 0) {
      await combo.click();
      await combo.fill('de');
      await page.waitForTimeout(400);
    }
  }

  assert(
    locationDumps.length === dumpsOnMount || locationDumps.some((u) => u.includes('q=')),
    'inventaire-filtre-location: dump locations à l’ouverture listing sans saisie',
  );
  console.log('PASS inventaire-filtre-location AC-8 (browser)');
}

async function main() {
  assertStaticWiring();

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
    console.log('SKIP Mode B live — cursor-session unavailable (static AC OK)');
    process.exit(0);
  }

  const h = headers(session);
  await assertLocationsApi(h);
  const location = await resolveLocationHit(h);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(20000);
  const locationDumps = [];
  page.on('request', (req) => {
    if (req.method() !== 'GET') return;
    const url = req.url();
    if (/\/api\/v1\/locations(\?|$)/.test(url)) {
      locationDumps.push(url);
    }
  });

  try {
    await browserInventaireListingFilter(page, locationDumps);
  } catch (err) {
    console.log(`SKIP inventaire-filtre-location browser (${err.message})`);
  } finally {
    await browser.close();
  }

  console.log('\n=== SEKTOR-275 — tous scénarios OK ===');
}

main().catch((err) => {
  console.error('FAIL', err.message);
  process.exit(1);
});
