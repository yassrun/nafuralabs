import { expect, test } from '@playwright/test';

/**
 * Task 12 — Approbations : inbox + workflow BC ≥ 500 k (3 étapes série).
 */
test.describe('ERP — Approbations', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('inbox : filtres type / société / urgence + tri SLA', async ({ page }) => {
    await page.goto('/approbations', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/approbations/);
    await expect(page.locator('.filters select')).toHaveCount(3, { timeout: 15000 });
    const firstCard = page.locator('.req-card').first();
    await expect(firstCard).toBeVisible();
  });

  test('workflow BC 1,05 M : trois clics Approuver clôture la demande', async ({ page }) => {
    await page.goto('/approbations', { waitUntil: 'domcontentloaded' });
    const card = page.locator('#approval-card-apr-001');
    await expect(card).toBeVisible({ timeout: 15000 });
    await expect(card.locator('.etape')).toHaveCount(3);
    const approve = card.getByRole('button', { name: /Approuver/ });
    await approve.click();
    await page.waitForTimeout(200);
    await approve.click();
    await page.waitForTimeout(200);
    await approve.click();
    await page.waitForTimeout(300);
    await expect(card).not.toBeVisible();
    await page.getByRole('button', { name: 'Historique' }).click();
    await expect(page.locator('#approval-card-apr-001')).toBeVisible();
  });
});
