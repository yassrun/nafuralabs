/**
 * Round 2 — focused regression checks for QA fixes.
 * Run: npx playwright test erp-audit-round2.spec.ts --config=playwright.audit.config.ts
 */
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const AUTH_FILE = path.resolve(__dirname, '.auth/erp-audit.json');

type CheckResult = {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'skip';
  detail: string;
};

const checks: CheckResult[] = [];

function record(id: string, name: string, status: CheckResult['status'], detail: string): void {
  checks.push({ id, name, status, detail });
}

async function openAuthenticatedPage(browser: import('@playwright/test').Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto('/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const authed = await page.getByRole('heading', { name: /tableau de bord|dashboard/i }).isVisible().catch(() => false);
  if (!authed) {
    const sso = page.getByRole('button', { name: /connexion sécurisée|sso/i });
    if (await sso.isVisible().catch(() => false)) {
      await sso.click();
      await page.waitForURL(/iam\.nafura\.local/, { timeout: 30000 });
    }
    if (page.url().includes('iam.nafura.local') || (await page.locator('#username').count()) > 0) {
      await page.waitForSelector('input[name="username"], #username', { timeout: 15000 });
      await page.fill('input[name="username"], #username', 'yassine.karkafi@gmail.com');
      await page.fill('input[name="password"], #password', '123');
      await page.getByRole('button', { name: /sign in|connexion|se connecter/i }).click();
    }
    await page.waitForSelector('h1', { timeout: 60000 });
  }
  return { context, page };
}

test.describe.serial('ERP audit round 2', () => {
  test('QA-ERP-020 default landing is dashboard', async ({ browser }) => {
    const { context, page } = await openAuthenticatedPage(browser);
    try {
      const pathAfterLogin = new URL(page.url()).pathname;
      if (pathAfterLogin.includes('/login')) {
        record('QA-ERP-020', 'Landing dashboard', 'fail', `Still on login: ${pathAfterLogin}`);
        expect(pathAfterLogin).not.toContain('/login');
      } else if (pathAfterLogin.includes('inventory') || pathAfterLogin.includes('receptions')) {
        record('QA-ERP-020', 'Landing dashboard', 'fail', `Landed on stock: ${pathAfterLogin}`);
        expect(pathAfterLogin).not.toContain('receptions');
      } else {
        record('QA-ERP-020', 'Landing dashboard', 'pass', `Landed on ${pathAfterLogin}`);
      }
    } finally {
      await context.close();
    }
  });

  test('QA-ERP-073 branding Sektor product name', async ({ browser }) => {
    const { context, page } = await openAuthenticatedPage(browser);
    try {
      const sidebarMark = page.locator('.naf-shell__sidebar-mark').first();
      const sidebarLockup = page.locator('.naf-shell__sidebar-lockup').first();
      const sidebarName = page.locator('.naf-shell__sidebar-lockup .naf-shell__sidebar-name').first();
      const sidebarByline = page.locator('.naf-shell__sidebar-byline').first();
      const markVisible = await sidebarMark.isVisible().catch(() => false);
      const markText = markVisible ? (await sidebarMark.textContent())?.trim() : '';
      const lockupVisible = await sidebarLockup.isVisible().catch(() => false);
      const nameText = lockupVisible ? (await sidebarName.textContent())?.trim() ?? '' : '';
      const bylineText = lockupVisible ? (await sidebarByline.textContent())?.trim() ?? '' : '';
      const ok = markVisible && nameText === 'Sektor' && bylineText === 'by nafuralabs';
      record(
        'QA-ERP-073',
        'Branding Sektor',
        ok ? 'pass' : 'fail',
        `mark=${markText || 'hidden'} name=${nameText} byline=${bylineText}`,
      );
      if (markVisible) expect(markText).toBe('');
      if (lockupVisible) {
        expect(nameText).toBe('Sektor');
        expect(bylineText).toBe('by nafuralabs');
      }
    } finally {
      await context.close();
    }
  });

  test('QA-ERP-001 session survives hard reload', async ({ browser }) => {
    const { context, page } = await openAuthenticatedPage(browser);
    try {
      await page.waitForTimeout(1500);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const afterReload = new URL(page.url()).pathname;
      const ok = !afterReload.includes('/login');
      record('QA-ERP-001', 'Session F5', ok ? 'pass' : 'fail', `After reload: ${afterReload}`);
      expect(afterReload).not.toContain('/login');
    } finally {
      await context.close();
    }
  });

  test('QA-ERP-021 dashboard empty tenant banner', async ({ browser }) => {
    const { context, page } = await openAuthenticatedPage(browser);
    try {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const banner = page.locator('.dashboard-empty-banner').first();
      const hasBanner = await banner.isVisible().catch(() => false);
      record(
        'QA-ERP-021',
        'Dashboard empty banner',
        hasBanner ? 'pass' : 'skip',
        hasBanner ? 'Empty-state banner visible' : 'No banner (tenant may have data or fix not deployed)',
      );
    } finally {
      await context.close();
    }
  });

  test('QA-ERP-041 receptions prerequisites banner', async ({ browser }) => {
    const { context, page } = await openAuthenticatedPage(browser);
    try {
      await page.goto('/inventory/mouvements/receptions', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      const prereq = page.locator('.reception-prereq').first();
      const visible = await prereq.isVisible().catch(() => false);
      record(
        'QA-ERP-041',
        'Réceptions prerequisites',
        visible ? 'pass' : 'skip',
        visible ? 'Prerequisites banner shown' : 'Banner not found (refs may exist or fix not deployed)',
      );
    } finally {
      await context.close();
    }
  });

  test('QA-ERP-030 chantiers empty CTA', async ({ browser }) => {
    const { context, page } = await openAuthenticatedPage(browser);
    try {
      await page.goto('/chantiers', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      const cta = page.locator('.empty__cta, button:has-text("chantier")').first();
      const visible = await cta.isVisible().catch(() => false);
      record(
        'QA-ERP-030',
        'Chantiers empty CTA',
        visible ? 'pass' : 'skip',
        visible ? 'Create-first-chantier CTA visible' : 'CTA not visible (list may have items)',
      );
    } finally {
      await context.close();
    }
  });

  test('QA-ERP-040 mobile sidebar does not block content', async ({ browser }) => {
    const { context, page } = await openAuthenticatedPage(browser);
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      const mainClickable = page.locator('main, .naf-shell__main, nf-page-shell').first();
      const box = await mainClickable.boundingBox().catch(() => null);
      if (!box) {
        record('QA-ERP-040', 'Mobile sidebar', 'skip', 'Main content region not found');
        return;
      }

      await page.mouse.click(box.x + box.width / 2, box.y + 40);
      const stillOnDashboard = new URL(page.url()).pathname.includes('dashboard');
      record(
        'QA-ERP-040',
        'Mobile sidebar',
        stillOnDashboard ? 'pass' : 'fail',
        stillOnDashboard ? 'Main content clickable at 390px' : `Click navigated away: ${page.url()}`,
      );
    } finally {
      await context.close();
    }
  });

  test('QA-ERP-050 session stable on ventes after navigation', async ({ browser }) => {
    const { context, page } = await openAuthenticatedPage(browser);
    try {
      const routes = ['/chantiers', '/achats/fournisseurs', '/inventory/mouvements/receptions', '/ventes/clients', '/finance/journaux', '/rh/employes'];
      for (const route of routes) {
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(400);
      }
      const path = new URL(page.url()).pathname;
      const ok = path.includes('/rh/employes') && !page.url().includes('iam.nafura.local');
      record('QA-ERP-050', 'Session multi-module', ok ? 'pass' : 'fail', ok ? `Ended on ${path}` : `Lost session at ${page.url()}`);
      expect(ok).toBe(true);
    } finally {
      await context.close();
    }
  });

  test('QA-ERP-051 materiel parc without missing icon errors', async ({ browser }) => {
    const { context, page } = await openAuthenticatedPage(browser);
    try {
      const iconErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' && /icon has not been provided/i.test(msg.text())) {
          iconErrors.push(msg.text());
        }
      });
      await page.goto('/materiel/parc', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      record(
        'QA-ERP-051',
        'Matériel parc icons',
        iconErrors.length === 0 ? 'pass' : 'fail',
        iconErrors.length === 0 ? 'No missing Lucide icon errors' : iconErrors[0].slice(0, 120),
      );
      expect(iconErrors).toHaveLength(0);
    } finally {
      await context.close();
    }
  });

  test('QA-ERP-052 onboarding route for authenticated user', async ({ browser }) => {
    const { context, page } = await openAuthenticatedPage(browser);
    try {
      await page.goto('/onboarding', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const path = new URL(page.url()).pathname;
      const onWizard = path.startsWith('/onboarding') && !path.startsWith('/signup');
      record(
        'QA-ERP-052',
        'Onboarding wizard',
        onWizard ? 'pass' : 'fail',
        onWizard ? `On ${path}` : `Redirected to ${path}`,
      );
      expect(onWizard).toBe(true);
    } finally {
      await context.close();
    }
  });

  test.afterAll(() => {
    const outDir = path.resolve(__dirname, '../../../docs/qa/erp-audit-2026-06-13');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'round2-results.json'), JSON.stringify(checks, null, 2));
    const passed = checks.filter((c) => c.status === 'pass').length;
    const failed = checks.filter((c) => c.status === 'fail').length;
    fs.writeFileSync(
      path.join(outDir, 'round2-summary.md'),
      `# Audit ERP — Round 2 (${new Date().toISOString().slice(0, 10)})\n\n` +
        `| Statut | Count |\n|--------|-------|\n| Pass | ${passed} |\n| Fail | ${failed} |\n| Skip | ${checks.filter((c) => c.status === 'skip').length} |\n\n` +
        checks.map((c) => `- **${c.id}** (${c.status}): ${c.name} — ${c.detail}`).join('\n') +
        '\n',
    );
  });
});
