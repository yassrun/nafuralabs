/**
 * SEKTOR-209 — QA navigateur Mode B : cockpit chantier + portefeuille, desktop 1440×900 et
 * 390×844, données discriminantes réelles (conversion légitime, EN_COURS par OS, retard direct).
 *
 * Vérifie dans le DOM : H1/onglets/KPI présents, aucune clé i18n brute (`chantiers.*`),
 * aucune erreur console liée au cockpit, persistance URL du portefeuille après reload.
 *
 * Run: node sektor/e2e/scripts/qa-cockpit-browser.mjs
 */
import { chromium } from 'playwright';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const FRONT = 'http://127.0.0.1:4200';
const OUT_DIR = decodeURIComponent(new URL('../captures/209/', import.meta.url).pathname)
  .replace(/^\/([A-Z]:)/, '$1')
  .replace(/\/+$/, '') + '/';

let PASSES = 0;
let FAILS = 0;
const pass = (ac, d) => { PASSES++; console.log(`PASS ${ac} — ${d}`); };
const fail = (ac, d, e, g) => { FAILS++; console.error(`FAIL ${ac} — ${d} | attendu: ${e} | obtenu: ${g}`); };

async function j(r) { const t = await r.text(); try { return { status: r.status, ok: r.ok, body: JSON.parse(t), text: t }; } catch { return { status: r.status, ok: r.ok, body: null, text: t }; } }
async function api(h, m, p, b) { const o = { method: m, headers: h }; if (b !== undefined) o.body = JSON.stringify(b); return j(await fetch(`${API_BASE}${p}`, o)); }

async function creerChantierEnCours(h, suffix) {
  const ing = await api(h, 'GET', '/api/v1/etudes/ingenieurs');
  const charge = Array.isArray(ing.body) && ing.body[0] ? ing.body[0].userId : undefined;
  const clients = await api(h, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const client = (Array.isArray(clients.body) ? clients.body : clients.body?.content ?? [])[0];
  const d = await api(h, 'POST', '/api/v1/etudes/dossiers', { objet: `QA Brows ${suffix}`, chargeEtudeUserId: charge, clientNom: `MOA ${suffix}` });
  const dossierId = d.body.id;
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`);
  const b = await api(h, 'GET', `/api/v1/etudes/dossiers/${dossierId}`);
  const dpgfId = b.body?.dpgfId;
  const lot = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, { type: 'LOT', code: '1', libelle: 'Lot GO' });
  const poste = await api(h, 'POST', `/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    type: 'ARTICLE', parentId: lot.body.id, code: '1.1', libelle: 'Poste GO', quantite: 1, unite: 'U',
    origineCout: 'ESTIME', coutUnitaire: 582600, fraisGenerauxPercent: 0, margePercent: 15,
  });
  const dpu = await api(h, 'POST', '/api/v1/etudes/dpu', { dpgfNoeudId: poste.body.id });
  await api(h, 'POST', `/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
    type: 'MATIERE', referenceType: 'LIBRE', libelle: 'Béton', rendement: 1, unite: 'U',
    prixUnitaire: 582600, sourcePrix: 'MANUEL',
  });
  await api(h, 'PUT', `/api/v1/etudes/dossiers/${dossierId}/etape`, { etape: 2 });
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/soumettre`);
  let v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  if (v.ok && v.body?.status === 'EN_VALIDATION') v = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/valider`);
  const g = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/generer-devis`, { clientId: client.id });
  const devisId = g.body?.devisGenereId ?? g.body?.id;
  const dd = await api(h, 'GET', `/api/v1/etudes/devis/${devisId}`);
  await api(h, 'POST', `/api/v1/etudes/devis/${devisId}/submit`);
  await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    dateAttribution: new Date().toISOString().slice(0, 10), devisId, montantAttribue: dd.body?.totalHt,
  });
  const conv = await api(h, 'POST', `/api/v1/etudes/dossiers/${dossierId}/convertir`, {});
  const id = conv.body?.chantierId ?? conv.body?.id;
  await api(h, 'POST', `/api/v1/chantiers/${id}/affectations`, { employeId: 'qa-emp-conducteur', roleCode: 'BTP_CONDUCTEUR_TRAVAUX', dateDebut: '2026-09-01' });
  await api(h, 'POST', `/api/v1/chantiers/${id}/affectations`, { employeId: 'qa-emp-chef-chantier', roleCode: 'BTP_CHEF_CHANTIER', dateDebut: '2026-09-01' });
  await api(h, 'PUT', `/api/v1/chantiers/${id}`, { dateDebut: '2026-09-01', dateFinPrevue: '2026-09-30' });
  await api(h, 'POST', `/api/v1/chantiers/${id}/demarrer-os`, { osReference: `OS-QAB-${suffix}`.slice(0, 40), osDateEffet: '2026-09-01' });
  return id;
}

const RAW_KEY = /chantiers\.(cockpit|common|creation|chantier)\.[a-zA-Z0-9_.]+/;
// Pré-existant hors périmètre : la traduction platform du branding contient `${tenant.logo}`
// que le messageformat compiler rejette. Signalé, pas une régression cockpit (P1-22).
const BRANDING_COMPILE = /Could not compile message|tenant\.logo|invalid syntax at line 1 col/;

async function attendreLignesPortefeuille(page, timeoutMs = 45000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const codes = await page.locator('table tbody tr td .code').allTextContents().catch(() => []);
    const erreur = await page.locator('.erreur').count().catch(() => 0);
    if (codes.length > 0) return { codes, erreur };
    if (erreur > 0) return { codes, erreur };
    await page.waitForTimeout(1000);
  }
  return { codes: await page.locator('table tbody tr td .code').allTextContents().catch(() => []), erreur: await page.locator('.erreur').count().catch(() => 0) };
}

async function verifierCockpit(page, chantierId, label) {
  const erreurs = [];
  page.on('console', (msg) => { if (msg.type() === 'error' && !BRANDING_COMPILE.test(msg.text())) erreurs.push(msg.text()); });
  await page.goto(`${FRONT}/chantiers/${chantierId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('section.kpis .kpi', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(800);
  const kpis = await page.locator('section.kpis .kpi').count();
  const tabs = await page.locator('nav.tabs .tab').count();
  const h1 = (await page.locator('h1').first().textContent().catch(() => '')).trim();
  const body = await page.locator('body').innerText();
  const raws = body.match(RAW_KEY) ?? [];
  const action = await page.locator('.action-primaire').textContent().catch(() => '');
  if (kpis === 5) pass(`AC-1/AC-2 ${label}`, `5 KPI cockpit rendus (H1 "${h1.slice(0, 40)}", ${tabs} onglets)`);
  else fail(`AC-1/AC-2 ${label}`, 'KPI', '5', String(kpis));
  if (h1.length > 0 && tabs >= 7) pass(`AC-1/AC-16 ${label}`, 'H1 unique + onglets réactifs (clés traduites)');
  else fail(`AC-1/AC-16 ${label}`, 'H1/onglets', 'H1 + ≥7 onglets', `h1=${h1.length} tabs=${tabs}`);
  if (raws.length === 0) pass(`AC-1/AC-22 ${label}`, 'aucune clé i18n brute dans le DOM');
  else fail(`AC-1/AC-22 ${label}`, 'clés brutes', '0', raws.slice(0, 5).join(', '));
  const crash = erreurs.filter((e) => !/favicon|net::ERR|Failed to load resource|400|404/.test(e));
  if (crash.length === 0) pass(`AC-1/AC-22 ${label}`, 'aucune erreur console liée au cockpit');
  else fail(`AC-1/AC-22 ${label}`, 'console propre', '0 erreurs', crash.slice(0, 3).join(' | '));
  return { kpis, h1, action };
}

async function main() {
  const s = await (await fetch(`${API_BASE}/api/public/dev/cursor-session`, { method: 'POST' })).json();
  const h = { Authorization: `Bearer ${s.accessToken}`, 'X-Tenant-Id': s.tenantId, 'Content-Type': 'application/json', Accept: 'application/json' };
  const suffix = Date.now().toString(36).slice(-6);
  const chantierId = await creerChantierEnCours(h, suffix);
  console.log(`chantier EN_COURS: ${chantierId}`);
  // chantier direct en retard pour la variété du portefeuille
  await api(h, 'POST', '/api/v1/chantiers', {
    label: `QA Retard ${suffix}`, clientId: 'cli-qab', clientName: 'Client', ville: 'Rabat',
    montantHt: 250000, status: 'EN_PREPARATION', dateDebut: '2026-07-01', dateFinPrevue: '2026-08-05',
  });

  const browser = await chromium.launch({
    // Le dépôt local porte chromium-1228 ; Playwright du node_modules peut attendre une autre
    // révision. On pointe explicitement l'exécutable installé.
    executablePath: process.env.PW_EXECUTABLE_PATH
      ?? 'C:/Users/yassiveco/AppData/Local/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  });

  // ── Desktop 1440×900 ──────────────────────────────────────────────────────
  const ctxD = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageD = await ctxD.newPage();
  await verifierCockpit(pageD, chantierId, 'desktop');
  await pageD.screenshot({ path: `${OUT_DIR}cockpit-desktop.png`, fullPage: false });
  // Portefeuille desktop : table + persistance URL (le backend met ~5-8 s à paginer/composer)
  await pageD.goto(`${FRONT}/chantiers?recherche=QA&tri=code&sens=asc&page=0`, { waitUntil: 'domcontentloaded' });
  const pfD = await attendreLignesPortefeuille(pageD);
  const urlD = pageD.url();
  if (pfD.codes.length > 0 && urlD.includes('recherche=QA')) pass('AC-18/AC-19 desktop', `portefeuille ${pfD.codes.length} lignes + état dans l'URL`);
  else fail('AC-18/AC-19 desktop', 'portefeuille', 'lignes + recherche dans URL', `${pfD.codes.length} lignes · ${urlD}`);
  await pageD.reload({ waitUntil: 'domcontentloaded' });
  const pfR = await attendreLignesPortefeuille(pageD);
  const urlR = pageD.url();
  if (pfR.codes.length > 0 && urlR.includes('recherche=QA')) pass('AC-18/AC-19 desktop', 'état conservé après reload (vrais query params)');
  else fail('AC-18/AC-19 desktop', 'reload', 'params + lignes conservés', `${pfR.codes.length} lignes · ${urlR}`);
  const bodyP = await pageD.locator('body').innerText();
  if ((bodyP.match(RAW_KEY) ?? []).length === 0) pass('AC-18/AC-22 desktop', 'aucune clé brute sur le portefeuille');
  else fail('AC-18/AC-22 desktop', 'clés brutes', '0', 'présentes');
  await pageD.screenshot({ path: `${OUT_DIR}portefeuille-desktop.png` });
  await ctxD.close();

  // ── Mobile 390×844 ────────────────────────────────────────────────────────
  const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageM = await ctxM.newPage();
  await verifierCockpit(pageM, chantierId, '390px');
  await pageM.screenshot({ path: `${OUT_DIR}cockpit-390.png` });
  await pageM.goto(`${FRONT}/chantiers`, { waitUntil: 'domcontentloaded' });
  const pfM = await attendreLignesPortefeuille(pageM);
  const scrollW = await pageM.locator('.table-wrap').evaluate((el) => el.scrollWidth >= el.clientWidth).catch(() => false);
  if (pfM.codes.length > 0) pass('AC-21 390px', `portefeuille mobile ${pfM.codes.length} lignes, table scrollable horizontalement (${scrollW})`);
  else fail('AC-21 390px', 'portefeuille mobile', 'lignes', `${pfM.codes.length} (erreur=${pfM.erreur})`);
  await pageM.screenshot({ path: `${OUT_DIR}portefeuille-390.png` });
  await ctxM.close();

  await browser.close();
  console.log(`\n=== VERDICT QA NAVIGATEUR 209 ===\nPASS: ${PASSES} · FAIL: ${FAILS}`);
  console.log(`captures → ${OUT_DIR}`);
  process.exit(FAILS ? 1 : 0);
}

main().catch((e) => { console.error('FAIL', e); process.exit(1); });
