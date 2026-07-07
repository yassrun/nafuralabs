import { expect, test, type Page } from '@playwright/test';

/**
 * Wave 2 — Ventes commerce flow (DoD smoke skeleton).
 * Offre → BCC → Facture client listing navigation without shell errors.
 *
 * @see docs/specs/backend-integration-roadmap/05-ventes.md — `ventes-flow.e2e.spec.ts`
 */

type ListingSmokeSpec = {
  path: string;
  title: RegExp;
  columnLabel?: string;
};

const VENTES_COMMERCE_CHAIN: ListingSmokeSpec[] = [
  { path: '/ventes/offres', title: /Offres commerciales/i, columnLabel: 'N° offre' },
  { path: '/ventes/bons-commandes-clients', title: /Bons de commande clients/i, columnLabel: 'N° BCC' },
  { path: '/ventes/factures', title: /Factures clients/i, columnLabel: 'N°' },
];

const VENTES_API_PATTERN =
  /\/api\/v1\/(offres-commerciales|bons-commande-client|factures-client)/;

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

test.describe('Ventes — commerce flow smoke (Wave 2 DoD)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const listing of VENTES_COMMERCE_CHAIN) {
    test(`listing charge sans erreur: ${listing.path}`, async ({ page }) => {
      await assertListingSmoke(page, listing);
    });
  }

  test('chaîne Offre → BCC → Facture — navigation séquentielle', async ({ page }) => {
    for (const listing of VENTES_COMMERCE_CHAIN) {
      await assertListingSmoke(page, listing);
    }
  });

  test('API ventes répond (soft si backend absent)', async ({ page }) => {
    const apiHits: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (VENTES_API_PATTERN.test(url)) {
        apiHits.push({ url, status: response.status() });
      }
    });

    await page.goto('/ventes/offres', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    if (apiHits.length === 0) {
      test.skip(true, 'Aucune réponse API — backend probablement arrêté');
    }

    const ok = apiHits.some((hit) => hit.status >= 200 && hit.status < 500);
    expect.soft(ok, `Réponses API: ${JSON.stringify(apiHits)}`).toBeTruthy();
  });
});
