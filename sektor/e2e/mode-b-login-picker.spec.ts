import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 900 }, channel: 'chrome' });

test.describe('Mode B — picker après déconnexion', () => {
  test('logout affiche le dropdown puis reconnecte un ingénieur', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.naf-shell__user-trigger')).toBeVisible({ timeout: 25000 });

    await page.locator('.naf-shell__user-trigger').click();
    await page.getByRole('button', { name: /déconnexion|logout/i }).click();

    await expect(page.getByText('Mode B — choisir un utilisateur')).toBeVisible({ timeout: 15000 });
    const select = page.locator('#cursor-user');
    await expect(select).toBeVisible();
    await expect(select.locator('option')).toHaveCount(11);

    await select.selectOption('ingenieur-2');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.locator('.naf-shell__user-trigger')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Mode B — choisir un utilisateur')).toHaveCount(0);
  });
});
