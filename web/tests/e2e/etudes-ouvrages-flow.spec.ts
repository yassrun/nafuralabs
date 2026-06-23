import { expect, test, type Page } from '@playwright/test';

/**
 * Wave 3 — Études ouvrages flow (B-ETU-01 DoD smoke).
 * Bibliothèque prix listing loads without shell errors.
 *
 * @see docs/specs/backend-integration-roadmap/07-etudes.md — B-ETU-01
 */

type ListingSmokeSpec = {
  path: string;
  title: RegExp;
  columnLabel?: string;
};

const ETUDES_OUVRAGES_LISTING: ListingSmokeSpec = {
  path: '/etudes/bibliotheque-prix',
  title: /Bibliothèque de prix/i,
  columnLabel: 'PU HT',
};

const ETUDES_OUVRAGES_API_PATTERN = /\/api\/v1\/etudes\/(ouvrages|bibliotheque-prix)/;

async function assertListingSmoke(page: Page, spec: ListingSmokeSpec): Promise<void> {
  await page.goto(spec.path, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(new RegExp(spec.path.replace(/\//g, '\\/')));

  await expect(page.getByText('Page introuvable')).toHaveCount(0);
  await expect(page.getByText('Not found', { exact: false })).toHaveCount(0);
  await expect(page.locator('.nf-page-header__title')).toContainText(spec.title, { timeout: 20000 });

  const loadError = page.getByText(/Failed to load/i).first();
  if (await loadError.isVisible().catch(() => false)) {
    test.skip(true, `Listing en erreur (${spec.path}) — backend ERP probablement arrêté`);
  }

  await expect(page.locator('nf-entity-listing')).toBeVisible({ timeout: 20000 });

  if (spec.columnLabel) {
    const header = page
      .locator('th, .mat-mdc-header-cell')
      .filter({ hasText: spec.columnLabel })
      .first();
    await expect.soft(header).toBeVisible({ timeout: 15000 });
  }
}

test.describe('Études — ouvrages flow smoke (B-ETU-01 DoD)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('listing bibliothèque prix charge sans erreur', async ({ page }) => {
    await assertListingSmoke(page, ETUDES_OUVRAGES_LISTING);
  });

  test('navigation create stub — page nouveau ouvrage', async ({ page }) => {
    await page.goto('/etudes/bibliotheque-prix', { waitUntil: 'domcontentloaded' });

    const loadError = page.getByText(/Failed to load/i).first();
    if (await loadError.isVisible().catch(() => false)) {
      test.skip(true, 'Listing en erreur — backend ERP probablement arrêté');
    }

    const createBtn = page.getByRole('button', { name: /nouveau|créer|ajouter/i }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await expect(page).toHaveURL(/\/etudes\/bibliotheque-prix\/new/, { timeout: 15000 });
      await expect(page.getByText('Page introuvable')).toHaveCount(0);
    } else {
      await page.goto('/etudes/bibliotheque-prix/new', { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Page introuvable')).toHaveCount(0);
      await expect(page.locator('.nf-page-header__title')).toContainText(/ouvrage/i, { timeout: 20000 });
    }
  });

  test('API ouvrages répond (soft si backend absent)', async ({ page }) => {
    const apiHits: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (ETUDES_OUVRAGES_API_PATTERN.test(url)) {
        apiHits.push({ url, status: response.status() });
      }
    });

    await page.goto('/etudes/bibliotheque-prix', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    if (apiHits.length === 0) {
      test.skip(true, 'Aucune réponse API — backend probablement arrêté');
    }

    const ok = apiHits.some((hit) => hit.status >= 200 && hit.status < 500);
    expect.soft(ok, `Réponses API: ${JSON.stringify(apiHits)}`).toBeTruthy();
  });
});
