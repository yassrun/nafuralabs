import { expect, test } from '@playwright/test';

const LISTINGS = [
  { entityKey: 'fournisseur', path: '/achats/fournisseurs' },
  { entityKey: 'client', path: '/ventes/clients' },
  { entityKey: 'employe', path: '/rh/employes' },
  { entityKey: 'article', path: '/inventory/catalogue/articles' },
  { entityKey: 'ouvrage', path: '/etudes/bibliotheque-prix' },
] as const;

test.describe('Magic Import platform', () => {
  for (const listing of LISTINGS) {
    test(`shows the platform trigger for ${listing.entityKey}`, async ({ page }) => {
      await page.goto(listing.path, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(listing.path.replace(/\//g, '\\/')));
      await expect(
        page.locator(`nf-smart-import-action[entitykey="${listing.entityKey}"], nf-smart-import-trigger[entitykey="${listing.entityKey}"]`),
      ).toBeVisible({ timeout: 20_000 });
    });
  }

  test('shows lot magic import on chantier detail when available', async ({ page }) => {
    await page.goto('/chantiers', { waitUntil: 'domcontentloaded' });
    const firstRow = page.locator('nf-entity-listing table tbody tr a, nf-entity-listing table tbody tr').first();
    if (!(await firstRow.isVisible().catch(() => false))) {
      test.skip(true, 'Aucun chantier disponible pour smoke magic import lots');
    }
    await firstRow.click();
    await expect(page).toHaveURL(/\/chantiers\/[^/]+/);
    const lotsTab = page.getByRole('tab', { name: /lots/i }).or(page.getByText(/^Lots$/i)).first();
    if (await lotsTab.isVisible().catch(() => false)) {
      await lotsTab.click();
    }
    await expect(page.locator('nf-smart-import-trigger[entitykey="lot-chantier"]')).toBeVisible({
      timeout: 20_000,
    });
  });

  test('rejects an empty file before any extraction request', async ({ page }) => {
    await page.goto('/achats/fournisseurs', { waitUntil: 'domcontentloaded' });
    const trigger = page.locator(
      'nf-smart-import-action[entitykey="fournisseur"], nf-smart-import-trigger[entitykey="fournisseur"]',
    );
    await expect(trigger).toBeVisible({ timeout: 20_000 });

    let extractionCalled = false;
    page.on('request', (request) => {
      if (request.url().includes('/api/extractions/extract')) extractionCalled = true;
    });

    await trigger.locator('input[type="file"]').setInputFiles({
      name: 'empty.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(''),
    });
    await expect(page.getByText(/fichier est vide|file is empty/i)).toBeVisible();
    expect(extractionCalled).toBeFalse();
  });
});

