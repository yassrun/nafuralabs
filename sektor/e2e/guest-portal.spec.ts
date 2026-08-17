import { expect, test } from '@playwright/test';

/**
 * Portail invité — hors shell ERP (pas de login, pas de sidebar).
 */
test.describe('Guest portal', () => {
  test('lien client invalide : page sans chrome ERP', async ({ page }) => {
    await page.goto('/p/c/token-invalide', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/p\/c\/token-invalide/);
    await expect(page.getByRole('heading', { name: /Lien invalide ou expiré/i })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.locator('naf-platform-app-shell, aside, nav.sidebar')).toHaveCount(0);
  });

  test('lien fournisseur invalide : page sans chrome ERP', async ({ page }) => {
    await page.goto('/p/f/token-invalide', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Lien invalide ou expiré/i })).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole('heading', { name: /Connexion|Se connecter/i })).toHaveCount(0);
  });
});
