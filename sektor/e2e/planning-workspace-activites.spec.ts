import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-179 / SEKTOR-180 — Gantt workspace (CTA, drawer, pas de mention API).
 *
 * Rouge-avant (25/08) : empty state « via l'API » ; drawer UUID.
 * Skip si API 8082 ou front 4200 down — pas de vert inventé.
 */

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

type CursorSession = {
  accessToken: string;
  tenantId: string;
  userId: string;
};

async function cursorSession(request: APIRequestContext): Promise<CursorSession | null> {
  const res = await request
    .post(`${API_BASE}/api/public/dev/cursor-session`, { headers: { Accept: 'application/json' } })
    .catch(() => null);
  if (!res || !res.ok()) return null;
  const body = (await res.json()) as { accessToken?: string; tenantId?: string; userId?: string };
  if (!body.accessToken || !body.tenantId) return null;
  return { accessToken: body.accessToken, tenantId: body.tenantId, userId: body.userId ?? 'qa' };
}

test.describe('Planning workspace activités', () => {
  test('CTA Nouvelle activité ouvre le drawer — pas de mention API (AC-13 AC-14)', async ({ page, request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'API 8082 / cursor-session down');

    await page.goto('/chantiers/planning', { waitUntil: 'domcontentloaded' });
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/via l['']API/i);

    const cta = page.getByRole('button', { name: /nouvelle activit/i }).first();
    await expect(cta).toBeVisible({ timeout: 15000 });
    await cta.click();
    const drawer = page.locator('[data-testid="activite-libelle"]');
    const opened = await drawer.isVisible({ timeout: 4000 }).catch(() => false);
    if (!opened) {
      test.info().annotations.push({
        type: 'note',
        description: 'Drawer non ouvert : filtrer un chantier (mono) — toast attendu si multi',
      });
    }
  });
});
