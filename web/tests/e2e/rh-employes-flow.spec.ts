import { expect, test, type Page } from '@playwright/test';

/**
 * Wave 4 — RH employés flow (B-RH-01 DoD smoke).
 *
 * @see docs/specs/backend-integration-roadmap/08-rh.md — B-RH-01
 */

type ListingSmokeSpec = {
  path: string;
  title: RegExp;
  columnLabel?: string;
};

const RH_EMPLOYES_LISTING: ListingSmokeSpec = {
  path: '/rh/employes',
  title: /Employés/i,
  columnLabel: 'Matricule',
};

const RH_EMPLOYES_API_PATTERN = /\/api\/v1\/rh\/employes/;

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

test.describe('RH — employés flow smoke (B-RH-01 DoD)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('listing loads without shell errors', async ({ page }) => {
    await assertListingSmoke(page, RH_EMPLOYES_LISTING);
  });

  test('calls employés API when backend is up', async ({ page }) => {
    let apiHit = false;
    page.on('request', (req) => {
      if (RH_EMPLOYES_API_PATTERN.test(req.url())) {
        apiHit = true;
      }
    });

    await assertListingSmoke(page, RH_EMPLOYES_LISTING);
    expect.soft(apiHit).toBe(true);
  });
});
