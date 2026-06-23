import { expect, test } from '@playwright/test';

/**
 * Task 01 — M-DASH-03 : chaque tuile KPI doit router vers la liste filtrée.
 */
const KPI_DRILLS: { testId: string; path: string; search?: string }[] = [
  { testId: 'dashboard-kpi-chantiers-en-cours', path: '/chantiers', search: 'status=EN_COURS' },
  { testId: 'dashboard-kpi-avancement-moyen', path: '/chantiers', search: 'sortBy=avancement' },
  { testId: 'dashboard-kpi-surconso-matiere', path: '/chantiers/budget' },
  { testId: 'dashboard-kpi-lots-peremption', path: '/inventory/suivi/etat-stock' },
  { testId: 'dashboard-kpi-ca-facture', path: '/ventes/factures' },
  { testId: 'dashboard-kpi-factures-retard', path: '/ventes/factures', search: 'filter=overdue' },
  { testId: 'dashboard-kpi-commandes', path: '/achats/commandes', search: 'status=EN_COURS' },
  { testId: 'dashboard-kpi-da', path: '/achats/demandes', search: 'status=ATTENTE' },
  { testId: 'dashboard-kpi-employes', path: '/rh/employes' },
  { testId: 'dashboard-kpi-conges', path: '/rh/conges', search: 'status=DEMANDE' },
  { testId: 'dashboard-kpi-incidents', path: '/hse/incidents', search: 'period=ytd' },
  { testId: 'dashboard-kpi-nc', path: '/hse/non-conformites', search: 'status=OUVERTE' },
];

for (const row of KPI_DRILLS) {
  test(`dashboard KPI drill: ${row.testId}`, async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('.dashboard-toolbar mat-button-toggle-group').waitFor({ state: 'visible', timeout: 30000 });
    const tile = page.getByTestId(row.testId);
    await tile.waitFor({ state: 'attached', timeout: 30000 });
    await tile.scrollIntoViewIfNeeded();
    await expect(tile).toBeVisible({ timeout: 10000 });
    await tile.click();
    await expect(page).toHaveURL(new RegExp(`${row.path.replace(/\//g, '\\/')}`), { timeout: 15000 });
    if (row.search) {
      const u = new URL(page.url());
      const [k, v] = row.search.split('=');
      expect(u.searchParams.get(k)).toBe(v);
    }
  });
}

test('dashboard charts render', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('dashboard-chart-ca-cumul')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('dashboard-chart-marges')).toBeVisible();
  await expect(page.getByTestId('dashboard-chart-top-alertes')).toBeVisible();
  await expect(page.getByTestId('dashboard-chart-bird-hse')).toBeVisible();
});
