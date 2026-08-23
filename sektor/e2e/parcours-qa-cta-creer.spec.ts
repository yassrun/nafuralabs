import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';

/**
 * SEKTOR-122 — CTA « Créer et commencer » s’enable à la saisie objet + MOA.
 *
 * Fill natif (valeur + input) suffisant — pas de blur Angular obligatoire.
 * Baseline : vu rouge avant le correctif (CTA disabled après fill objet+MOA).
 */

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

async function cursorSessionOk(request: APIRequestContext): Promise<boolean> {
  const res = await request.post(`${API_BASE}/api/public/dev/cursor-session`, {
    headers: { Accept: 'application/json' },
  });
  return res.ok();
}

/** Saisie native : setter HTML + event input (sans fill() Playwright / sans blur). */
async function fillNatif(locator: Locator, value: string): Promise<void> {
  await locator.evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    desc?.set?.call(input, v);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function openCreatePage(page: Page): Promise<void> {
  await page.goto('/etudes/dossiers/new', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Nouvelle étude/i })).toBeVisible({
    timeout: 20000,
  });
}

test.use({ viewport: { width: 1280, height: 900 }, channel: 'chrome' });

test.describe('SEKTOR-122 — CTA créer étude', () => {

  test('objet + MOA (fill natif) enable Créer et commencer, puis dossier créé', async ({
    page,
    request,
  }) => {
    test.skip(!(await cursorSessionOk(request)), 'cursor-session unavailable — Mode B off');

    await openCreatePage(page);

    const cta = page.getByRole('button', { name: /Créer et commencer/i });
    await expect(cta).toBeVisible({ timeout: 15000 });
    await expect(cta).toBeDisabled();

    const suffix = Date.now().toString(36);
    await fillNatif(page.locator('input[name="objet"]'), `QA 122 objet ${suffix}`);
    await fillNatif(page.locator('input[name="clientNom"]'), `MOA QA 122 ${suffix}`);

    await expect(cta).toBeEnabled({ timeout: 5000 });

    await cta.click();
    await expect(page).toHaveURL(/\/etudes\/dossiers\/[0-9a-f-]{16,}/i, { timeout: 20000 });
  });
});
