import { expect, test } from '@playwright/test';

/**
 * Task 13.0 — `/admin` ne doit plus retourner une page introuvable dans le shell ERP.
 * @see docs/specs/erp-audit-round-2-roadmap/13-admin.md
 */
test.describe('Administration — route /admin', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('/admin affiche le hub (data-testid admin-hub)', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-hub')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Page introuvable')).toHaveCount(0);
    await expect(page.getByText('Not found', { exact: false })).toHaveCount(0);
  });
});
