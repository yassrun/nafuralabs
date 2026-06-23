import { expect, test } from '@playwright/test';

test.describe('Pointage offline-first', () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test('queues pointage offline and marks it synced once the network comes back', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 33.5731, longitude: -7.5898 });

    await page.goto('/rh/pointage/saisie');

    await page.locator('#pointage-chantier').selectOption('ch-001');

    await page.getByRole('button', { name: 'Géolocaliser' }).click();
    await expect(page.locator('.geoloc-badge')).toBeVisible({ timeout: 10_000 });

    const canvas = page.getByTestId('pointage-signature-canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const b = box!;
    await page.mouse.move(b.x + 30, b.y + 40);
    await page.mouse.down();
    await page.mouse.move(b.x + 280, b.y + 100, { steps: 12 });
    await page.mouse.up();

    await context.setOffline(true);

    await page.getByRole('button', { name: 'Valider le pointage' }).click({ force: true });

    await expect(page.getByText(/Mode hors ligne\./)).toBeVisible();
    await expect(page.getByText(/en attente/)).toBeVisible();

    await context.setOffline(false);

    await expect(page.getByText(/Synchronisé/)).toBeVisible({ timeout: 20_000 });
  });
});
