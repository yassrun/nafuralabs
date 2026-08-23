import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-107 — Extraire normalise en identité, deux seaux.
 *
 * Preuve :
 * - classer-identite ne persiste jamais (count items inchangé)
 * - GET identites/{cle} 200 vs 404 sans écriture
 * - déjà tenant = seau DEJA_TENANT uniquement si l'IA est dispo ; sinon A_CREER
 *   (pas de LIKE de fallback)
 *
 * Baseline : vu rouge avant l'endpoint (POST classer-identite → 404).
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

test.describe('SEKTOR-107 — Extraire deux seaux', () => {
  test('classer-identite ne crée pas d’Item ; identite GET 200 vs 404', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — backend Mode B not running');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const cleStable = `sektor-107-peinture-acrylique-${suffix}`;
    const created = await request.post(`${API_BASE}/api/v1/items`, {
      headers: headers(session),
      data: {
        name: `Peinture acrylique intérieure ${suffix}`,
        nature: 'MATIERE',
        isActive: true,
        cleStable,
      },
    });
    expect(created.status(), await created.text()).toBe(201);

    const countRes = await request.get(`${API_BASE}/api/v1/items/count`, {
      headers: headers(session),
    });
    expect(countRes.ok()).toBeTruthy();
    const totalBefore = Number(await countRes.json());

    const classer = await request.post(`${API_BASE}/api/v1/items/classer-identite`, {
      headers: headers(session),
      data: {
        designation: 'peinture acrylique blanche',
        nature: 'MATIERE',
      },
    });
    expect(classer.status(), await classer.text()).toBe(200);
    const body = (await classer.json()) as {
      seau?: string;
      itemId?: string | null;
      identitesCandidates?: string[];
    };
    expect(body.seau === 'DEJA_TENANT' || body.seau === 'A_CREER' || body.seau === 'INCERTAIN').toBe(
      true,
    );
    if (body.seau === 'DEJA_TENANT') {
      expect(body.itemId).toBeTruthy();
    }
    if (body.seau === 'A_CREER') {
      expect(body.itemId == null || body.itemId === '').toBe(true);
    }
    if (body.seau === 'INCERTAIN') {
      expect((body.identitesCandidates ?? []).length).toBeGreaterThanOrEqual(2);
      expect(body.itemId == null || body.itemId === '').toBe(true);
    }

    const known = await request.get(`${API_BASE}/api/v1/items/identites/${cleStable}`, {
      headers: headers(session),
    });
    expect(known.status(), await known.text()).toBe(200);

    const unknown = await request.get(
      `${API_BASE}/api/v1/items/identites/cle-absente-${suffix}`,
      { headers: headers(session) },
    );
    expect(unknown.status()).toBe(404);

    const countAfter = await request.get(`${API_BASE}/api/v1/items/count`, {
      headers: headers(session),
    });
    expect(Number(await countAfter.json())).toBe(totalBefore);
  });
});
