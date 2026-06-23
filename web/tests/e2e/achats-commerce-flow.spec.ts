import { expect, test, type Page } from '@playwright/test';

/**
 * Wave 2 — Achats commerce flow (DoD smoke skeleton).
 * DA → AO → BC → FF listing navigation without shell errors.
 *
 * @see docs/specs/backend-integration-roadmap/04-achats.md — `achats-flow.e2e.spec.ts`
 */

type ListingSmokeSpec = {
  path: string;
  title: RegExp;
  columnLabel?: string;
  /** FF listing uses a custom table instead of nf-entity-listing. */
  customTable?: boolean;
};

const ACHATS_COMMERCE_CHAIN: ListingSmokeSpec[] = [
  { path: '/achats/demandes', title: /Demandes d'achat/i, columnLabel: 'N° DA' },
  { path: '/achats/appels-offres', title: /Appels d'offres/i, columnLabel: 'N° AO' },
  { path: '/achats/commandes', title: /Bons de commande/i, columnLabel: 'N° BC' },
  {
    path: '/finance/factures-fournisseurs',
    title: /Factures fournisseurs/i,
    columnLabel: 'N° interne',
    customTable: true,
  },
];

const ACHATS_API_PATTERN =
  /\/api\/v1\/(demandes-achat|appels-offres-achat|bons-commande-achat|factures-fournisseur)/;

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

  if (spec.customTable) {
    await expect(page.locator('table thead')).toBeVisible({ timeout: 20000 });
  } else {
    await expect(page.locator('nf-entity-listing')).toBeVisible({ timeout: 20000 });
  }

  if (spec.columnLabel) {
    const header = page
      .locator('th, .mat-mdc-header-cell')
      .filter({ hasText: spec.columnLabel })
      .first();
    await expect.soft(header).toBeVisible({ timeout: 15000 });
  }
}

test.describe('Achats — commerce flow smoke (Wave 2 DoD)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const listing of ACHATS_COMMERCE_CHAIN) {
    test(`listing charge sans erreur: ${listing.path}`, async ({ page }) => {
      await assertListingSmoke(page, listing);
    });
  }

  test('chaîne DA → AO → BC → FF — navigation séquentielle', async ({ page }) => {
    for (const listing of ACHATS_COMMERCE_CHAIN) {
      await assertListingSmoke(page, listing);
    }
  });

  test('API achats répond (soft si backend absent)', async ({ page }) => {
    const apiHits: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      if (ACHATS_API_PATTERN.test(url)) {
        apiHits.push({ url, status: response.status() });
      }
    });

    await page.goto('/achats/demandes', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    if (apiHits.length === 0) {
      test.skip(true, 'Aucune réponse API — backend probablement arrêté');
    }

    const ok = apiHits.some((hit) => hit.status >= 200 && hit.status < 500);
    expect.soft(ok, `Réponses API: ${JSON.stringify(apiHits)}`).toBeTruthy();
  });
});
