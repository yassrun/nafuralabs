import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-304 — chevrons Lucide uniques, pas d'icônes Material hors registry.
 */

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

test.use({ viewport: { width: 1440, height: 900 }, channel: 'chrome' });

type CursorSession = {
  accessToken: string;
  tenantId: string;
  userId: string;
};

async function cursorSession(request: APIRequestContext): Promise<CursorSession | null> {
  const res = await request.post(`${API_BASE}/api/public/dev/cursor-session`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as {
    accessToken?: string;
    tenantId?: string;
    userId?: string;
  };
  if (!body.accessToken || !body.tenantId || !body.userId) return null;
  return { accessToken: body.accessToken, tenantId: body.tenantId, userId: body.userId };
}

function headers(session: CursorSession): Record<string, string> {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

test('arbre bordereau n’émet pas d’icônes Lucide manquantes', async ({ page, request }) => {
  const session = await cursorSession(request);
  test.skip(!session, 'cursor-session unavailable');

  const iconErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /icon has not been provided/i.test(msg.text())) {
      iconErrors.push(msg.text());
    }
  });

  const known = '80b147b2-9929-4980-848d-eb231beeef1d';
  const probe = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${known}`, {
    headers: headers(session!),
  });
  let dossierId = known;
  if (!probe.ok()) {
    const ing = await request.get(`${API_BASE}/api/v1/etudes/ingenieurs`, {
      headers: headers(session!),
    });
    const list = ing.ok() ? ((await ing.json()) as { userId?: string }[]) : [];
    const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
      headers: headers(session!),
      data: {
        objet: `QA 304 arbre icones ${Date.now()}`,
        chargeEtudeUserId: list[0]?.userId ?? session!.userId,
        clientNom: 'MOA QA 304',
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    dossierId = ((await created.json()) as { id: string }).id;
    await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`,
      { headers: headers(session!) },
    );
  }

  await page.goto(`/etudes/dossiers/${dossierId}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /Arbre du bordereau/i })).toBeVisible({
    timeout: 30000,
  });
  await page.waitForTimeout(800);

  expect(iconErrors, iconErrors.join('\n')).toEqual([]);

  const togglers = page.locator('.nf-tree-table__toggler:not(.nf-tree-table__toggler--leaf)');
  if ((await togglers.count()) > 0) {
    const first = togglers.first();
    await expect(first.locator('lucide-icon')).toHaveCount(1);
    await expect(first.locator('mat-icon')).toHaveCount(0);
  }
});
