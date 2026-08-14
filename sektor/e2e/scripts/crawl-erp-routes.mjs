/**
 * Fast route crawl — writes docs/qa/erp-audit-2026-06-13/route-audit-results.json
 * Run: node tests/e2e/scripts/crawl-erp-routes.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const OUT_FILE = path.resolve(__dirname, '../../../../docs/qa/erp-audit-2026-06-13/route-audit-results.json');
const ROUTE_BUDGET_MS = 12_000;

const ROUTES = [
  { path: '/dashboard', module: 'dashboard' },
  { path: '/chantiers', module: 'chantiers' },
  { path: '/chantiers/new', module: 'chantiers' },
  { path: '/chantiers/planning', module: 'chantiers' },
  { path: '/achats/fournisseurs', module: 'achats' },
  { path: '/achats/fournisseurs/new', module: 'achats' },
  { path: '/achats/demandes', module: 'achats' },
  { path: '/achats/commandes', module: 'achats' },
  { path: '/inventory/mouvements/receptions', module: 'stock' },
  { path: '/inventory/mouvements/sorties', module: 'stock' },
  { path: '/inventory/catalogue/articles', module: 'stock' },
  { path: '/inventory/catalogue/articles/new', module: 'stock' },
  { path: '/inventory/configuration/depots', module: 'stock' },
  { path: '/inventory/configuration/depots/new', module: 'stock' },
  { path: '/materiel/parc', module: 'materiel' },
  { path: '/etudes/metres', module: 'etudes' },
  { path: '/etudes/devis', module: 'etudes' },
  { path: '/marches/contrats', module: 'marches' },
  { path: '/ventes/clients', module: 'ventes' },
  { path: '/ventes/clients/new', module: 'ventes' },
  { path: '/ventes/factures', module: 'ventes' },
  { path: '/finance/journaux', module: 'finance' },
  { path: '/finance/balance', module: 'finance' },
  { path: '/finance/plans-comptables', module: 'finance' },
  { path: '/rh/employes', module: 'rh' },
  { path: '/rh/employes/new', module: 'rh' },
  { path: '/rh/pointage', module: 'rh' },
  { path: '/hse/incidents', module: 'hse' },
  { path: '/hse/incidents/new', module: 'hse' },
  { path: '/pilotage/marges-chantier', module: 'pilotage' },
  { path: '/pilotage-analyses/rentabilite', module: 'pilotage' },
  { path: '/analytics/chantiers', module: 'analytics' },
  { path: '/approbations', module: 'approbations' },
  { path: '/admin', module: 'admin' },
  { path: '/administration/members', module: 'admin' },
  { path: '/administration/societe', module: 'admin' },
  { path: '/administration/demo', module: 'admin' },
  { path: '/onboarding', module: 'onboarding' },
];

function isSessionLost(url, pathname) {
  return url.includes('iam.nafura.local') || pathname.includes('/login') || pathname.includes('openid-connect');
}

async function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function crawlRoute(pageRef, route) {
  let page = pageRef.current;
  const routeErrors = [];
  const handler = (msg) => {
    if (msg.type() === 'error') routeErrors.push(msg.text());
  };
  page.on('console', handler);

  const started = Date.now();
  let navigated = false;
  try {
    await page.goto(`http://erp.nafura.local${route.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: ROUTE_BUDGET_MS,
    });
    navigated = true;
    await page.waitForTimeout(200);
  } catch {
    try {
      await page.close();
    } catch {
      /* ignore */
    }
    page = await page.context().newPage();
    navigated = false;
  }

  const h1 = navigated
    ? await withTimeout(
        page.locator('h1').first().textContent().then((t) => (t ?? '').trim()).catch(() => ''),
        2_000,
        '',
      )
    : '';
  const title = navigated
    ? await withTimeout(
        page.evaluate(() => document.title).catch(() => ''),
        1_000,
        '',
      )
    : '';
  const finalUrl = navigated ? new URL(page.url()).pathname : route.path;
  const sessionLost =
    navigated && isSessionLost(page.url(), finalUrl);
  const hasCreateButton = navigated
    ? await withTimeout(
        page
          .getByRole('button', { name: /nouveau|nouvelle|créer|create/i })
          .first()
          .isVisible()
          .catch(() => false),
        2_000,
        false,
      )
    : false;

  page.off('console', handler);

  pageRef.current = page;
  return {
    path: route.path,
    module: route.module,
    finalUrl,
    title,
    h1,
    sessionLost,
    loginRedirect: finalUrl.includes('/login'),
    consoleErrors: routeErrors.slice(0, 5),
    hasCreateButton,
    loadMs: Date.now() - started,
  };
}

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
  viewport: { width: 1440, height: 900 },
});
context.setDefaultNavigationTimeout(ROUTE_BUDGET_MS);
context.setDefaultTimeout(5_000);

const pageRef = { current: await context.newPage() };
const results = [];

for (const route of ROUTES) {
  const result = await crawlRoute(pageRef, route);
  results.push(result);
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  process.stdout.write(result.loadMs > 3_000 ? `\nSLOW ${route.path} ${result.loadMs}ms\n` : '.');
}

await browser.close();

const lost = results.filter((r) => r.sessionLost);
console.log(`\n${results.length}/${ROUTES.length} routes — session lost: ${lost.length}`);
if (lost.length) {
  console.log(lost.map((r) => r.path).join(', '));
  process.exit(1);
}
