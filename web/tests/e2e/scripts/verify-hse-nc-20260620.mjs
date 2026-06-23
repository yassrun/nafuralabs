/**
 * HSE NC workflow + incident row navigation smoke
 * Run: node web/tests/e2e/scripts/verify-hse-nc-20260620.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.resolve(__dirname, '../.auth/erp-audit.json');
const ERP_BASE = process.env.ERP_BASE ?? 'http://erp.nafura.local';
const API_BASE = process.env.ERP_API_BASE ?? 'http://api.erp.nafura.local';
const NC_ID = 'nc-qa-enrobage-acier';

const results = { ok: true, checks: [], at: new Date().toISOString() };

function record(id, pass, detail) {
  results.checks.push({ id, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${id}: ${detail}`);
  if (!pass) results.ok = false;
}

async function getSession(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('pf_session');
    if (!raw) return null;
    const p = JSON.parse(raw);
    return { accessToken: p.tokens.accessToken, tenantId: p.tenantId };
  });
}

function headers(session) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
    'X-Tenant-Id': session.tenantId,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ storageState: AUTH_FILE });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('nafura-tour-seen-')) localStorage.setItem(k, 'true');
    }
  });
  await page.goto(`${ERP_BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const session = await getSession(page);
  if (!session) throw new Error('No session');

  const ncGet = await ctx.request.get(`${API_BASE}/api/v1/hse/non-conformites/${NC_ID}`, {
    headers: headers(session),
  });
  const nc = await ncGet.json();
  record('nc-status', nc.status === 'OUVERTE', `NC status=${nc.status}`);

  if (nc.status === 'OUVERTE') {
    const assign = await ctx.request.post(`${API_BASE}/api/v1/hse/non-conformites/${NC_ID}/assigner`, {
      headers: headers(session),
      data: { responsableNom: 'Karim Benali' },
    });
    record('nc-assigner', assign.ok(), `assigner → ${assign.status()}`);
    const traiter = await ctx.request.post(`${API_BASE}/api/v1/hse/non-conformites/${NC_ID}/traiter`, {
      headers: headers(session),
    });
    record('nc-traiter', traiter.ok(), `traiter → ${traiter.status()}`);
    const verifier = await ctx.request.post(`${API_BASE}/api/v1/hse/non-conformites/${NC_ID}/verifier`, {
      headers: headers(session),
      data: { verificationEfficacite: 'QA verify OK' },
    });
    record('nc-verifier', verifier.ok(), `verifier → ${verifier.status()}`);
  }

  await page.goto(`${ERP_BASE}/hse/incidents`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const firstRow = page.locator('table tbody tr').first();
  const hasRow = (await firstRow.count()) > 0;
  if (hasRow) {
    await firstRow.click();
    await page.waitForTimeout(1500);
    record(
      'incident-row-click',
      /\/hse\/incidents\//.test(page.url()),
      `After row click url=${page.url()}`,
    );
  } else {
    record('incident-row-click', false, 'No incident rows');
  }

  await page.goto(`${ERP_BASE}/hse/tableau-bord`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const bird = await page.locator('[data-testid="dashboard-chart-bird-hse"] nf-chart').isVisible().catch(() => false);
  record('hse-bird-widget', bird, `Bird chart visible=${bird}`);

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
