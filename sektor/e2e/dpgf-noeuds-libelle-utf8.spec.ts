import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-116 — POST /api/v1/etudes/dpgf/{id}/noeuds accepte un libellé UTF-8.
 *
 * Baseline : vu rouge 20/08 — JSON windows-1252 (é = 0xE9) → 500 INTERNAL_ERROR
 * (Jackson Invalid UTF-8 middle byte). ASCII « Beton » → 201.
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

function headers(session: CursorSession, contentType = 'application/json'): Record<string, string> {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': contentType,
    Accept: 'application/json',
  };
}

async function chargeEtudeUserId(
  request: APIRequestContext,
  session: CursorSession,
): Promise<string> {
  const res = await request.get(`${API_BASE}/api/v1/etudes/ingenieurs`, {
    headers: headers(session),
  });
  if (res.ok()) {
    const list = (await res.json()) as { userId?: string }[];
    if (list[0]?.userId) return list[0].userId;
  }
  return '';
}

test.describe('SEKTOR-116 — POST dpgf noeuds libellé UTF-8', () => {
  test('Béton UTF-8 et windows-1252 → 201, libellé persisté', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — backend Mode B not running');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const chargeEtudeUserId = await chargeEtudeUserId(request, session);
    const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
      headers: headers(session),
      data: {
        objet: `UTF-8 116 ${suffix}`,
        chargeEtudeUserId,
        clientNom: 'MOA QA 116',
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const dossierId = ((await created.json()) as { id: string }).id;

    const bordereau = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`,
      { headers: headers(session) },
    );
    expect(bordereau.ok(), await bordereau.text()).toBeTruthy();
    const dpgfId = ((await bordereau.json()) as { dpgfId: string }).dpgfId;

    const utf8 = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      headers: headers(session, 'application/json; charset=utf-8'),
      data: { type: 'LOT', code: '01', libelle: 'Béton' },
    });
    expect(utf8.status(), await utf8.text()).toBe(201);
    const utf8Body = (await utf8.json()) as { libelle?: string };
    expect(utf8Body.libelle).toBe('Béton');

    const latinJson = JSON.stringify({ type: 'LOT', code: '02', libelle: 'déjà façadé' });
    const latin1 = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      headers: headers(session),
      data: Buffer.from(latinJson, 'latin1'),
    });
    expect(latin1.status(), await latin1.text()).toBe(201);
    const latinBody = (await latin1.json()) as { libelle?: string };
    expect(latinBody.libelle).toBe('déjà façadé');
  });
});
