import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-106 — Item tenant 1–1 avec cle_stable.
 *
 * Preuve :
 * - créer deux fois le même cle_stable sur le tenant refuse (409)
 * - une ligne fournisseur (ref) ne crée pas d'article parallèle
 *
 * Baseline : vu rouge avant le unique (2e POST 201). Mode B cursor-session.
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

test.describe('SEKTOR-106 — Item 1–1 cle_stable', () => {
  test('duplicate cle_stable refused ; fournisseur-ref does not create item', async ({
    request,
  }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — backend Mode B not running');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const cleStable = `sektor-106-peinture-acrylique-${suffix}`;
    const payload = {
      name: `Peinture acrylique intérieure ${suffix}`,
      nature: 'MATIERE',
      isActive: true,
      cleStable,
    };

    const first = await request.post(`${API_BASE}/api/v1/items`, {
      headers: headers(session),
      data: payload,
    });
    expect(first.status(), await first.text()).toBe(201);
    const created = (await first.json()) as { id: string; cleStable?: string };
    expect(created.cleStable).toBe(cleStable);

    const duplicate = await request.post(`${API_BASE}/api/v1/items`, {
      headers: headers(session),
      data: {
        ...payload,
        name: `Autre libellé même identité ${suffix}`,
      },
    });
    expect(duplicate.status(), await duplicate.text()).toBe(409);
    const dupBody = (await duplicate.json()) as { message?: string };
    expect(dupBody.message).toContain('item.cle_stable.duplicate');

    const countRes = await request.get(`${API_BASE}/api/v1/items/count`, {
      headers: headers(session),
    });
    expect(countRes.ok()).toBeTruthy();
    const totalBefore = Number(await countRes.json());

    const bind = await request.post(
      `${API_BASE}/api/v1/items/identites/${cleStable}/fournisseur-ref`,
      {
        headers: headers(session),
        data: { refFournisseur: `SKU-${suffix}` },
      },
    );
    expect(bind.status(), await bind.text()).toBe(200);
    const bound = (await bind.json()) as {
      itemId: string;
      createdItem: boolean;
      refFournisseur: string;
    };
    expect(bound.itemId).toBe(created.id);
    expect(bound.createdItem).toBe(false);
    expect(bound.refFournisseur).toBe(`SKU-${suffix}`);

    const unknown = await request.post(
      `${API_BASE}/api/v1/items/identites/cle-absente-${suffix}/fournisseur-ref`,
      {
        headers: headers(session),
        data: { refFournisseur: 'SKU-GHOST' },
      },
    );
    expect(unknown.status(), await unknown.text()).toBe(400);

    const countAfter = await request.get(`${API_BASE}/api/v1/items/count`, {
      headers: headers(session),
    });
    expect(Number(await countAfter.json())).toBe(totalBefore);
  });
});
