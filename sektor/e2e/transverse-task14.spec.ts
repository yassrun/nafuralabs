import { expect, test } from '@playwright/test';

/**
 * Task 14 — M-TRA-01 / M-TRA-02 / M-TRA-09 (P0 smoke).
 * Command palette: prefer Ctrl+Shift+P in automation (browser may capture Ctrl+K).
 */

const ENTITY_LISTING_DRILLS: { path: string; urlPattern: RegExp }[] = [
  { path: '/rh/employes', urlPattern: /\/rh\/employes\/[^/]+$/ },
  { path: '/ventes/factures', urlPattern: /\/ventes\/factures\/[^/]+$/ },
  { path: '/achats/commandes', urlPattern: /\/achats\/commandes\/[^/]+$/ },
  { path: '/achats/demandes', urlPattern: /\/achats\/demandes\/[^/]+$/ },
  { path: '/ventes/clients', urlPattern: /\/ventes\/clients\/[^/]+$/ },
];

test.describe('Task 14 — transverse', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('topbar search opens command palette', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('.naf-shell__search-trigger').click();
    await expect(page.locator('.nf-command-palette__dialog')).toBeVisible({ timeout: 20000 });
    await page.locator('.nf-command-palette__backdrop').click({ position: { x: 4, y: 4 } });
    await expect(page.locator('.nf-command-palette__dialog')).toHaveCount(0);
  });

  for (const row of ENTITY_LISTING_DRILLS) {
    test(`listing drill-down: ${row.path}`, async ({ page }) => {
      await page.goto(row.path, { waitUntil: 'domcontentloaded' });
      const listingRow = page.locator('nf-entity-listing tr.mat-mdc-row').first();
      await listingRow.waitFor({ state: 'visible', timeout: 30000 });
      // Double-click opens detail on listings with row selection; single-click is enough when selectionMode is none.
      await listingRow.dblclick();
      await expect(page).toHaveURL(row.urlPattern, { timeout: 15000 });
    });
  }

  test('language Arabic sets document RTL', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('.nf-lang__trigger').click();
    await page.getByRole('button', { name: 'العربية' }).click();
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.getAttribute('dir')))
      .toBe('rtl');
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.lang))
      .toMatch(/^ar/);
  });
});
