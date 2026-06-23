import { expect, test } from '@playwright/test';

/** Aligné sur `SEED_CHANTIERS` (6 premiers) — Task 02 M-CHA-01. */
const SEED_CHANTIER_IDS = ['ch-001', 'ch-002', 'ch-003', 'ch-004', 'ch-005', 'ch-006'];

test.describe('Chantiers — fiche détail (mock unifié)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  for (const id of SEED_CHANTIER_IDS) {
    test(`GET /chantiers/${id} affiche la fiche (pas « introuvable »)`, async ({ page }) => {
      await page.goto(`/chantiers/${id}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByText('Chantier introuvable')).toHaveCount(0);
      // Deux <h1> (en-tête code + hero titre) : cibler le titre principal fiche.
      await expect(page.locator('h1.hero__title')).toBeVisible({ timeout: 20000 });
    });
  }

  test('/chantiers/ch-999 affiche l’état chantier introuvable', async ({ page }) => {
    await page.goto('/chantiers/ch-999', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Chantier introuvable')).toBeVisible();
  });

  test('résolution par code marché CH-2025-001', async ({ page }) => {
    await page.goto('/chantiers/CH-2025-001', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Chantier introuvable')).toHaveCount(0);
    await expect(page.locator('h1.hero__title')).toContainText(/Yasmine|Résidence/i);
  });
});

test.describe('Chantiers — wizard création (M-CHA-02)', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('parcours complet crée un chantier et redirige vers la fiche', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/chantiers/new', { waitUntil: 'load' });
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.locator('#cc-name').waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#cc-name').fill('E2E — Projet Playwright');
    // nf-button + mat : le libellé peut ne pas remonter comme nom accessible fiable — cibler le bouton matériel.
    const next = page.locator('.nav-actions button').filter({ hasText: /^(Suivant|Next)$/ });
    await next.first().click();
    await page.locator('#cc-cli').selectOption({ index: 1 });
    await next.first().click();
    await page.locator('#cc-ville').fill('Casablanca');
    await next.first().click();
    await next.first().click();
    await page.locator('#cc-chef').fill('Chef E2E');
    await page.locator('#cc-cond').fill('Conducteur E2E');
    await page.getByTestId('chantier-create-submit').click();
    await expect(page).toHaveURL(/\/chantiers\/ch-\d{3}$/);
    await expect(page.getByText('Chantier introuvable')).toHaveCount(0);
  });
});
