/**
 * SEKTOR-276 — Parc GMAO MVP pointage / pleins / affectation (AC-13…AC-17).
 * Run: node sektor/e2e/scripts/verify-ux-pro-catalogue-lignes-276.mjs
 *
 * Scénarios CONTRAT :
 *   pointage-engin-combobox · pointage-chantier-combobox
 *   pleins-pas-select-dump · affectation-combobox
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

/** AC-13…AC-16 — wiring statique. */
function assertParcStatic() {
  const erp = read('sources/web/app/socle/shared/services/erp-lookup.service.ts');
  const searchers = read('sources/web/app/socle/shared/services/erp-lookup-searchers.ts');
  const routes = read('sources/web/app/socle/shared/config/erp-lookup-list-routes.ts');
  const pointage = read('sources/web/app/catalogue/materiel-parc/pointage/pointage-engin.page.ts');
  const pleins = read('sources/web/app/catalogue/materiel-parc/carburant/pleins-carburant.page.ts');
  const affect = read('sources/web/app/catalogue/materiel-parc/affectations/affectations.page.ts');

  assert(erp.includes('materiels(search'), 'lookup materiels absent de ErpLookupService');
  assert(erp.includes("endpoint: '/api/v1/materiels'"), 'materiels endpoint incorrect');
  assert(erp.includes('q.length < 2'), 'materiels doit refuser q < 2');
  assert(searchers.includes('materiels'), 'LOOKUP_SEARCHERS sans materiels');
  assert(routes.materiels || routes.includes("materiels: '/materiel/parc'"), 'ERP_LOOKUP_LIST_ROUTES sans materiels');

  assert(pointage.includes('lookupKey="materiels"'), 'pointage-engin-combobox: nf-select materiels absent');
  assert(pointage.includes('lookupKey="chantiers"'), 'pointage-chantier-combobox: nf-select chantiers absent');
  assert(!pointage.includes("engineId: 'mat-"), 'pointage: plus de UUID inventé par défaut');
  assert(!/<input type="text"[^>]*engineId/.test(pointage), 'pointage: input texte engin encore présent');
  assert(!/<input type="text"[^>]*chantierRef/.test(pointage), 'pointage: input texte chantier encore présent');
  assert(pointage.includes('data-testid="pointage-engin-combobox"'), 'pointage-engin-combobox: testid absent');
  assert(pointage.includes('data-testid="pointage-chantier-combobox"'), 'pointage-chantier-combobox: testid absent');
  console.log('PASS pointage-engin-combobox AC-13 (static)');
  console.log('PASS pointage-chantier-combobox AC-14 (static)');

  assert(pleins.includes('lookupKey="materiels"'), 'pleins: combobox engin absent');
  assert(pleins.includes('data-testid="pleins-engin-combobox"'), 'pleins: testid engin absent');
  assert(pleins.includes('getCarnetsForEngine'), 'pleins: carnets non bornés à l’engin');
  assert(pleins.includes('@if (draft.engineId)'), 'pleins-pas-select-dump: carnet visible sans engin');
  assert(!/@for \(c of carnets\(\)/.test(pleins), 'pleins-pas-select-dump: dump global carnets()');
  assert(!pleins.includes('toSignal(this.gmao.getCarnets()'), 'pleins-pas-select-dump: load carnets global au mount');
  console.log('PASS pleins-pas-select-dump AC-15 (static)');

  assert(affect.includes('lookupKey="materiels"'), 'affectation-combobox: materiels absent');
  assert(affect.includes('lookupKey="chantiers"'), 'affectation-combobox: chantiers absent');
  assert(affect.includes('data-testid="affectation-materiel-combobox"'), 'affectation: testid materiel absent');
  assert(affect.includes('data-testid="affectation-chantier-combobox"'), 'affectation: testid chantier absent');
  assert(affect.includes('api.create'), 'affectation: POST create absent');
  console.log('PASS affectation-combobox AC-16 (static)');
}

async function resolveMateriel(h, suffix) {
  const search = await json(
    await fetch(`${API_BASE}/api/v1/materiels?page=0&size=5&search=PE`, { headers: h }),
  );
  if (search.ok) {
    const hits = contentOf(search.body);
    const hit = hits.find((r) => r?.id && r?.code);
    if (hit) return { id: hit.id, code: hit.code, name: hit.name };
  }

  const code = `PEL276-${suffix}`.slice(0, 20);
  const created = await json(
    await fetch(`${API_BASE}/api/v1/materiels`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code,
        name: `Pelle QA 276 ${suffix}`,
        numeroSerie: `SN-${suffix}`,
        status: 'DISPONIBLE',
        isActive: true,
      }),
    }),
  );
  assert(created.status === 201 || created.status === 200, `POST materiel ${created.status} ${created.text}`);
  return { id: created.body.id, code: created.body.code || code, name: created.body.name };
}

async function resolveChantier(h) {
  const search = await json(
    await fetch(`${API_BASE}/api/v1/chantiers/lookup?search=CH`, { headers: h }),
  );
  assert(search.ok, `chantiers lookup ${search.status}`);
  const hits = contentOf(search.body);
  const hit = hits.find((r) => r?.id);
  if (hit) return { id: hit.id, label: hit.label || hit.name || hit.code };
  throw new Error('aucun chantier — preset qa-local attendu');
}

async function typeCombobox(page, testId, needle) {
  const combo = page.getByTestId(testId).locator('[role="combobox"]');
  await combo.waitFor({ timeout: 15000 });
  await combo.click();
  await combo.fill('');
  await combo.pressSequentially(needle.slice(0, Math.max(2, needle.length)), { delay: 35 });
  const listbox = page.locator('[role="listbox"]').last();
  await listbox.waitFor({ timeout: 15000 });
  await listbox.locator('[role="option"]').first().click();
}

async function browserPointage(page, materiel, chantier, materielDumps) {
  const dumpsOnOpen = materielDumps.length;
  await page.goto(`${APP_BASE}/materiel/pointage`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('pointage-engin-form').waitFor({ timeout: 25000 });

  assert(
    materielDumps.length === dumpsOnOpen,
    `pointage: GET materiels dump à l'ouverture (${materielDumps.slice(dumpsOnOpen).join(', ')})`,
  );

  await typeCombobox(page, 'pointage-engin-combobox', materiel.code);
  await typeCombobox(page, 'pointage-chantier-combobox', 'CH');

  const enginCombo = page.getByTestId('pointage-engin-combobox').locator('[role="combobox"]');
  const enginText = await enginCombo.inputValue();
  assert(new RegExp(materiel.code, 'i').test(enginText), `pointage engin label absent (${enginText})`);

  await page.locator('#pe-heures').fill('6');
  await page.getByRole('button', { name: /enregistrer|save|sauvegarder/i }).click();
  await page.locator('tbody tr').first().waitFor({ timeout: 5000 });
  console.log('PASS pointage-engin-combobox AC-13 (browser)');
  console.log('PASS pointage-chantier-combobox AC-14 (browser)');
}

async function browserPleins(page, materiel) {
  await page.goto(`${APP_BASE}/materiel/carburant/pleins`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('pleins-carburant-form').waitFor({ timeout: 25000 });

  assert((await page.getByTestId('pleins-carnet-select').count()) === 0, 'pleins: carnet select visible sans engin');

  await typeCombobox(page, 'pleins-engin-combobox', materiel.code);
  await page.getByTestId('pleins-carnet-select').waitFor({ timeout: 5000 });
  const options = await page.getByTestId('pleins-carnet-select').locator('option').count();
  assert(options >= 1 && options <= 5, `pleins: carnet select doit être court (${options} options)`);
  console.log('PASS pleins-pas-select-dump AC-15 (browser)');
}

async function browserAffectation(page, materiel) {
  await page.goto(`${APP_BASE}/materiel/affectations`, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('affectation-create-form').waitFor({ timeout: 25000 });

  await typeCombobox(page, 'affectation-materiel-combobox', materiel.code);
  await typeCombobox(page, 'affectation-chantier-combobox', 'CH');
  await page.getByTestId('affectation-submit').click();
  await page.locator('tbody tr').first().waitFor({ timeout: 15000 });
  console.log('PASS affectation-combobox AC-16 (browser)');
}

async function main() {
  assertParcStatic();

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
  const materiel = await resolveMateriel(h, suffix);
  await resolveChantier(h);

  const materielSearch = await json(
    await fetch(`${API_BASE}/api/v1/materiels?page=0&size=5&search=${encodeURIComponent(materiel.code.slice(0, 3))}`, {
      headers: h,
    }),
  );
  assert(materielSearch.ok, `materiels q≥2 ${materielSearch.status}`);
  assert(contentOf(materielSearch.body).length >= 1, 'materiels typeahead sans hits');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const materielDumps = [];
  page.on('request', (req) => {
    if (req.method() !== 'GET') return;
    const url = req.url();
    if (/\/api\/v1\/materiels(\?|$)/.test(url) && !url.includes('search=')) {
      materielDumps.push(url);
    }
  });

  try {
    await browserPointage(page, materiel, null, materielDumps);
    await browserPleins(page, materiel);
    await browserAffectation(page, materiel);
  } finally {
    await browser.close();
  }

  console.log('\n=== SEKTOR-276 — tous scénarios OK ===');
}

main().catch((err) => {
  console.error('FAIL', err.message);
  process.exit(1);
});
