import { expect, test } from '@playwright/test';

test.describe('Inventory — magasin chantier (M-STK-03)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('magasin ch-001 affiche stock et lien sorties', async ({ page }) => {
    await page.goto('/inventory/magasin-chantier/ch-001', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Magasin|Atlas/i, { timeout: 20000 });
    await expect(page.getByRole('link', { name: /Bon de matières/i })).toBeVisible();
  });
});
