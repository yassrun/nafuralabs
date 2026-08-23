import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-132 — Extraire pose un code article tenant.
 *
 * Preuve : POST extraire-creer → GET item.code non vide (≤ 20).
 * Baseline : vu rouge avant (code null).
 */

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

type CursorSession = {
  accessToken: string;
  tenantId: string;
};

async function cursorSession(request: APIRequestContext): Promise<CursorSession | null> {
  const res = await request.post(`${API_BASE}/api/public/dev/cursor-session`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok()) return null;
  const body = (await res.json()) as { accessToken?: string; tenantId?: string };
  if (!body.accessToken || !body.tenantId) return null;
  return { accessToken: body.accessToken, tenantId: body.tenantId };
}

function headers(session: CursorSession): Record<string, string> {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

test.describe('SEKTOR-132 — Extraire pose un code article', () => {
  test('extraire-creer persiste un code tenant non vide', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — backend Mode B not running');
    if (!session) return;

    const h = headers(session);
    const suffix = Date.now().toString(36);
    const designation = `Peinture Extraire 132 ${suffix}`;

    const created = await request.post(`${API_BASE}/api/v1/items/extraire-creer`, {
      headers: h,
      data: {
        designation,
        nature: 'MATIERE',
        uniteCode: 'L',
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const body = (await created.json()) as { itemId: string; cleStable: string };
    expect(body.itemId).toBeTruthy();

    const itemRes = await request.get(`${API_BASE}/api/v1/items/${body.itemId}`, { headers: h });
    expect(itemRes.ok(), await itemRes.text()).toBeTruthy();
    const item = (await itemRes.json()) as { code?: string; cleStable?: string };
    expect(item.code?.trim(), 'baseline Extraire : code null — vu rouge avant allocate').toBeTruthy();
    expect(item.code!.length).toBeLessThanOrEqual(20);
    expect(item.cleStable).toBe(body.cleStable);
  });
});
