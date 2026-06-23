import { expect, test } from '@playwright/test';

/**
 * Task 10.0 — `/qualite` alias HSE (audit Round 2 : 404 bloquant).
 */
test.describe('HSE /qualite route', () => {
  test('/qualite redirige vers le tableau de bord HSE', async ({ page }) => {
    await page.goto('/qualite', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/qualite\/tableau-bord$/);
    await expect(page.getByRole('heading', { name: 'Tableau de bord HSE' })).toBeVisible({
      timeout: 30000,
    });
  });

  test('/qualite/incidents charge le registre incidents', async ({ page }) => {
    await page.goto('/qualite/incidents', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/qualite\/incidents/);
    await expect(page.getByText('Incidents HSE', { exact: true })).toBeVisible({ timeout: 30000 });
  });
});
