import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-108 — Extraire crée = PUBLIER Sektor puis Item 1–1.
 *
 * Preuve :
 * - identité absente → article PUBLIE + Item ; pas de candidat G2
 * - même cle_stable déjà publié → pas de 2ᵉ fiche Sektor
 * - n'appelle pas /catalogue/candidats/{id}/publier ni /enrichissement/contribuer
 *
 * Baseline : vu rouge avant l'endpoint (POST extraire-creer → 404/500).
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

test.describe('SEKTOR-108 — Extraire PUBLIER puis Item', () => {
  test('publie Sektor puis Item ; ne duplique pas ; pas de candidat G2', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — backend Mode B not running');
    if (!session) return;

    const h = headers(session);
    const suffix = Date.now().toString(36);
    const designation = `Enduit Extraire 108 ${suffix}`;

    const candidatsBefore = await request.get(`${API_BASE}/api/v1/catalogue/candidats`, { headers: h });
    const candidatsCountBefore = candidatsBefore.ok()
      ? ((await candidatsBefore.json()) as unknown[]).length
      : -1;

    const articlesBeforeRes = await request.get(`${API_BASE}/api/v1/catalogue/articles?statut=PUBLIE`, {
      headers: h,
    });
    expect(articlesBeforeRes.ok(), await articlesBeforeRes.text()).toBeTruthy();
    const articlesBefore = (await articlesBeforeRes.json()) as { cleStable: string }[];
    const publishedBefore = articlesBefore.length;

    const created = await request.post(`${API_BASE}/api/v1/items/extraire-creer`, {
      headers: h,
      data: {
        designation,
        nature: 'MATIERE',
        uniteCode: 'KG',
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const body = (await created.json()) as {
      itemId: string;
      cleStable: string;
      createdSektor: boolean;
      createdItem: boolean;
      libelle: string;
    };
    expect(body.createdSektor).toBe(true);
    expect(body.createdItem).toBe(true);
    expect(body.itemId).toBeTruthy();

    const articlesAfterRes = await request.get(`${API_BASE}/api/v1/catalogue/articles?statut=PUBLIE`, {
      headers: h,
    });
    const articlesAfter = (await articlesAfterRes.json()) as { cleStable: string; statut: string }[];
    expect(articlesAfter.length).toBe(publishedBefore + 1);
    const published = articlesAfter.find((a) => a.cleStable === body.cleStable);
    expect(published?.statut).toBe('PUBLIE');

    const replay = await request.post(`${API_BASE}/api/v1/items/extraire-creer`, {
      headers: h,
      data: {
        designation,
        nature: 'MATIERE',
        uniteCode: 'KG',
        cleStable: body.cleStable,
      },
    });
    expect(replay.ok(), await replay.text()).toBeTruthy();
    const replayBody = (await replay.json()) as {
      itemId: string;
      createdSektor: boolean;
      createdItem: boolean;
    };
    expect(replayBody.createdSektor).toBe(false);
    expect(replayBody.createdItem).toBe(false);
    expect(replayBody.itemId).toBe(body.itemId);

    const articlesReplay = (await (
      await request.get(`${API_BASE}/api/v1/catalogue/articles?statut=PUBLIE`, { headers: h })
    ).json()) as unknown[];
    expect(articlesReplay.length).toBe(publishedBefore + 1);

    if (candidatsCountBefore >= 0) {
      const candidatsAfter = await request.get(`${API_BASE}/api/v1/catalogue/candidats`, { headers: h });
      expect(((await candidatsAfter.json()) as unknown[]).length).toBe(candidatsCountBefore);
    }
  });
});
