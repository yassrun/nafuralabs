import { expect, test } from '@playwright/test';

/**
 * M-ACH-01 — 3-way matching (démo `ff-3way-demo-ecart` : PU T12 hors tolérance ±2 %).
 */
test.describe('Achats — 3-way matching facture fournisseur', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('validation refusée si ECART_BLOQUE (toast explicite)', async ({ page }) => {
    await page.goto('/finance/factures-fournisseurs/ff-3way-demo-ecart', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: /Valider/ }).click();
    await expect(page.getByText(/3-way matching/i)).toBeVisible({ timeout: 8000 });
  });
});
