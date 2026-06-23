/**
 * Full QA route crawl — all paths from web/docs/qa/*.md
 * Run: node tests/e2e/scripts/crawl-qa-routes.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const OUT_FILE = path.resolve(__dirname, '../../../../docs/qa/erp-audit-2026-06-19/route-crawl.json');
const ROUTE_BUDGET_MS = 15_000;

const ROUTES = [
  { path: '/dashboard', module: '00-dashboard' },
  { path: '/chantiers', module: '01-chantiers' },
  { path: '/chantiers/new', module: '01-chantiers' },
  { path: '/chantiers/planning', module: '01-chantiers' },
  { path: '/chantiers/avancements', module: '01-chantiers' },
  { path: '/chantiers/situations', module: '01-chantiers' },
  { path: '/chantiers/situations/new', module: '01-chantiers' },
  { path: '/chantiers/budget', module: '01-chantiers' },
  { path: '/chantiers/sous-traitance', module: '01-chantiers' },
  { path: '/chantiers/documents', module: '01-chantiers' },
  { path: '/chantiers/attachements', module: '01-chantiers' },
  { path: '/chantiers/journal', module: '01-chantiers' },
  { path: '/achats/demandes', module: '02-achats' },
  { path: '/achats/appels-offres', module: '02-achats' },
  { path: '/achats/commandes', module: '02-achats' },
  { path: '/achats/contrats', module: '02-achats' },
  { path: '/achats/fournisseurs', module: '02-achats' },
  { path: '/inventory/mouvements/receptions', module: '03-stock' },
  { path: '/inventory/mouvements/sorties', module: '03-stock' },
  { path: '/inventory/mouvements/transferts', module: '03-stock' },
  { path: '/inventory/mouvements/retours', module: '03-stock' },
  { path: '/inventory/mouvements/inventaires', module: '03-stock' },
  { path: '/inventory/mouvements/pertes-chutes', module: '03-stock' },
  { path: '/inventory/suivi/etat-stock', module: '03-stock' },
  { path: '/inventory/suivi/valorisation', module: '03-stock' },
  { path: '/inventory/suivi/alertes', module: '03-stock' },
  { path: '/inventory/catalogue/articles', module: '03-stock' },
  { path: '/inventory/configuration/familles', module: '03-stock' },
  { path: '/inventory/configuration/types-articles', module: '03-stock' },
  { path: '/inventory/configuration/uom', module: '03-stock' },
  { path: '/inventory/configuration/depots', module: '03-stock' },
  { path: '/inventory/configuration/motifs', module: '03-stock' },
  { path: '/inventory/configuration/costing-methods', module: '03-stock' },
  { path: '/materiel/parc', module: '04-materiel' },
  { path: '/materiel/affectations', module: '04-materiel' },
  { path: '/materiel/locations', module: '04-materiel' },
  { path: '/materiel/planning', module: '04-materiel' },
  { path: '/materiel/pointage', module: '04-materiel' },
  { path: '/materiel/controles', module: '04-materiel' },
  { path: '/materiel/maintenance/plans', module: '04-materiel' },
  { path: '/materiel/carburant/carnets', module: '04-materiel' },
  { path: '/etudes/bibliotheque-prix', module: '05-etudes' },
  { path: '/etudes/metres', module: '05-etudes' },
  { path: '/etudes/devis', module: '05-etudes' },
  { path: '/etudes/appels-offres-clients', module: '05-etudes' },
  { path: '/marches/contrats', module: '06-marches' },
  { path: '/marches/avenants', module: '06-marches' },
  { path: '/marches/factures', module: '06-marches' },
  { path: '/marches/cautions', module: '06-marches' },
  { path: '/marches/revisions-prix', module: '06-marches' },
  { path: '/marches/penalites', module: '06-marches' },
  { path: '/marches/dgd', module: '06-marches' },
  { path: '/marches/os', module: '06-marches' },
  { path: '/ventes/offres', module: '06-marches' },
  { path: '/ventes/commandes', module: '06-marches' },
  { path: '/ventes/situations', module: '06-marches' },
  { path: '/ventes/factures', module: '06-marches' },
  { path: '/ventes/avoirs', module: '06-marches' },
  { path: '/ventes/retenues-garantie', module: '06-marches' },
  { path: '/ventes/clients', module: '06-marches' },
  { path: '/finance/journaux', module: '07-finance' },
  { path: '/finance/balance', module: '07-finance' },
  { path: '/finance/analytique', module: '07-finance' },
  { path: '/finance/factures-fournisseurs', module: '07-finance' },
  { path: '/finance/lettrage', module: '07-finance' },
  { path: '/finance/caisses', module: '07-finance' },
  { path: '/finance/virements', module: '07-finance' },
  { path: '/finance/virements/remise', module: '07-finance' },
  { path: '/finance/reglements', module: '07-finance' },
  { path: '/finance/recouvrement', module: '07-finance' },
  { path: '/finance/rapprochement', module: '07-finance' },
  { path: '/finance/effets', module: '07-finance' },
  { path: '/finance/caisses-chantier', module: '07-finance' },
  { path: '/finance/declarations/retenue-source', module: '07-finance' },
  { path: '/finance/declarations/simpl-is', module: '07-finance' },
  { path: '/finance/declarations/etat-9421', module: '07-finance' },
  { path: '/finance/declarations/etat-1208', module: '07-finance' },
  { path: '/finance/devises', module: '07-finance' },
  { path: '/finance/taux-change', module: '07-finance' },
  { path: '/finance/conditions-paiement', module: '07-finance' },
  { path: '/finance/plans-comptables', module: '07-finance' },
  { path: '/rh/employes', module: '08-rh' },
  { path: '/rh/pointage', module: '08-rh' },
  { path: '/rh/planning-equipes', module: '08-rh' },
  { path: '/rh/conges', module: '08-rh' },
  { path: '/rh/paie', module: '08-rh' },
  { path: '/rh/paie/journal', module: '08-rh' },
  { path: '/rh/paie/declarations/damancom', module: '08-rh' },
  { path: '/rh/paie/declarations/igr', module: '08-rh' },
  { path: '/rh/paie/declarations/etat-1208', module: '08-rh' },
  { path: '/hse/tableau-bord', module: '09-hse' },
  { path: '/hse/incidents', module: '09-hse' },
  { path: '/hse/non-conformites', module: '09-hse' },
  { path: '/hse/inspections', module: '09-hse' },
  { path: '/hse/formations', module: '09-hse' },
  { path: '/hse/epi', module: '09-hse' },
  { path: '/hse/duer', module: '09-hse' },
  { path: '/hse/phs', module: '09-hse' },
  { path: '/hse/ppsps', module: '09-hse' },
  { path: '/hse/visites-medicales', module: '09-hse' },
  { path: '/hse/registres-legaux', module: '09-hse' },
  { path: '/pilotage/marges-chantier', module: '10-pilotage' },
  { path: '/pilotage/marge-consolidee', module: '10-pilotage' },
  { path: '/pilotage/cash-flow', module: '10-pilotage' },
  { path: '/pilotage-analyses/rentabilite', module: '10-pilotage' },
  { path: '/pilotage-analyses/financier', module: '10-pilotage' },
  { path: '/pilotage-analyses/stock', module: '10-pilotage' },
  { path: '/pilotage-analyses/achats', module: '10-pilotage' },
  { path: '/pilotage-analyses/rh', module: '10-pilotage' },
  { path: '/pilotage-analyses/what-if', module: '10-pilotage' },
  { path: '/pilotage-analyses/opex-capex', module: '10-pilotage' },
  { path: '/pilotage-analyses/groupe', module: '10-pilotage' },
  { path: '/analytics/chantiers', module: '10-pilotage' },
  { path: '/analytics/financier', module: '10-pilotage' },
  { path: '/analytics/stock', module: '10-pilotage' },
  { path: '/analytics/achats', module: '10-pilotage' },
  { path: '/analytics/rh', module: '10-pilotage' },
  { path: '/approbations', module: 'admin' },
  { path: '/admin', module: 'admin' },
];

const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';

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

async function ensureFrenchLocale(page, request) {
  await page.evaluate(() => {
    localStorage.setItem('seyrura:language', 'fr');
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
  });
  const session = await getSession(page);
  if (!session) return;
  const res = await request.get(`${API_BASE}/api/v1/user-settings/preferences`, {
    headers: apiHeaders(session),
  });
  if (!res.ok()) return;
  const current = await res.json();
  if (current.locale?.toLowerCase() === 'fr') return;
  await request.put(`${API_BASE}/api/v1/user-settings/preferences`, {
    headers: apiHeaders(session),
    data: {
      locale: 'fr',
      timezone: current.timezone ?? 'UTC',
      theme: current.theme ?? 'system',
      dateFormat: current.dateFormat ?? 'YYYY-MM-DD',
    },
  });
}

function isSessionLost(url, pathname) {
  return url.includes('iam.nafura.local') || pathname.includes('/login') || pathname.includes('openid-connect');
}

function iconErrors(errors) {
  return errors.filter((e) => /icon has not been provided/i.test(e));
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
    await page.waitForTimeout(400);
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
    ? await page.locator('h1').first().textContent().then((t) => (t ?? '').trim()).catch(() => '')
    : '';
  const finalUrl = navigated ? new URL(page.url()).pathname : route.path;
  const sessionLost = navigated && isSessionLost(page.url(), finalUrl);
  const loadFailed = navigated
    ? await page
        .getByText(/Failed to load|Impossible de charger|Page introuvable/i)
        .first()
        .isVisible()
        .catch(() => false)
    : false;

  page.off('console', handler);
  pageRef.current = page;

  return {
    path: route.path,
    module: route.module,
    finalUrl,
    h1,
    sessionLost,
    loadFailed,
    consoleErrors: routeErrors.slice(0, 8),
    iconErrors: iconErrors(routeErrors),
    loadMs: Date.now() - started,
    ok: navigated && !sessionLost && !loadFailed && iconErrors(routeErrors).length === 0,
  };
}

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
  viewport: { width: 1440, height: 900 },
});
context.setDefaultNavigationTimeout(ROUTE_BUDGET_MS);

const pageRef = { current: await context.newPage() };
await pageRef.current.goto('http://erp.nafura.local/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
await pageRef.current.waitForTimeout(800);
try {
  await ensureFrenchLocale(pageRef.current, context.request);
} catch {
  await pageRef.current.waitForLoadState('domcontentloaded').catch(() => undefined);
  await ensureFrenchLocale(pageRef.current, context.request);
}
await pageRef.current.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
await pageRef.current.waitForTimeout(500);

const results = [];
for (const route of ROUTES) {
  const result = await crawlRoute(pageRef, route);
  results.push(result);
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  process.stdout.write(result.ok ? '.' : 'X');
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} OK — ${failed.length} issues`);
if (failed.length) {
  for (const f of failed.slice(0, 20)) {
    console.log(`  ${f.path}: session=${f.sessionLost} load=${f.loadFailed} icons=${f.iconErrors.length}`);
  }
  process.exit(1);
}
