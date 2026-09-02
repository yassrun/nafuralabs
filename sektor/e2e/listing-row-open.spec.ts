import { expect, test } from '@playwright/test';

/**
 * SEKTOR-302 — nf-entity-listing drill-down is double-click everywhere.
 */
test.describe('Listing row open', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('études: single click stays on the list, double-click opens the dossier', async ({ page }) => {
    await page.goto('/etudes/dossiers', { waitUntil: 'domcontentloaded' });
    const listingRow = page.locator('nf-entity-listing tr.mat-mdc-row').first();
    await listingRow.waitFor({ state: 'visible', timeout: 30000 });

    await listingRow.click();
    const openedOnSingleClick = await page
      .waitForURL(/\/etudes\/dossiers\/[^/]+$/, { timeout: 500 })
      .then(() => true)
      .catch(() => false);
    expect(openedOnSingleClick, 'single click must not open the dossier').toBe(false);
    await expect(page).toHaveURL(/\/etudes\/dossiers\/?(\?.*)?$/);

    await listingRow.dblclick();
    await expect(page).toHaveURL(/\/etudes\/dossiers\/[^/]+$/, { timeout: 15000 });
  });
});
