import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-110 — Gate consultation optionnelle / obligatoire + min N.
 *
 * Preuve :
 * - obligatoire + min 2 + 1 devis → gate 4 bloquante
 * - 2 devis distincts → passe
 * - optionnelle + 0 devis → passe (non bloquante)
 *
 * Baseline : vu rouge avant l'endpoint parametres (PUT → 404).
 */

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

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

type Gate = { etape: number; bloquant: boolean; problemes: unknown[] };

function gate4(gates: Gate[]): Gate | undefined {
  return gates.find((g) => g.etape === 4);
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
  return session.userId;
}

async function createDossier(
  request: APIRequestContext,
  session: CursorSession,
  suffix: string,
): Promise<string> {
  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: headers(session),
    data: {
      objet: `Gate 110 ${suffix}`,
      chargeEtudeUserId: await chargeEtudeUserId(request, session),
      clientNom: 'MOA QA 110',
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  return ((await created.json()) as { id: string }).id;
}

async function createFournisseur(
  request: APIRequestContext,
  session: CursorSession,
  suffix: string,
  code: string,
): Promise<string> {
  const created = await request.post(`${API_BASE}/api/v1/partners`, {
    headers: headers(session),
    data: { code, raisonSociale: `F ${code} ${suffix}`, roles: ['FOURNISSEUR'] },
  });
  expect(created.status(), await created.text()).toBe(201);
  return ((await created.json()) as { id: string }).id;
}

test.describe('SEKTOR-110 — Gate consultation min N', () => {
  test('obligatoire min 2 bloque à 1 devis ; 2 devis passe ; optionnelle 0 passe', async ({
    request,
  }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — backend Mode B not running');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const previous = await request.get(`${API_BASE}/api/v1/etudes/parametres/consultation`, {
      headers: headers(session),
    });
    expect(previous.status(), await previous.text()).toBe(200);
    const prevBody = (await previous.json()) as { mode?: string; minimum?: number };

    try {
      const putOblig = await request.put(`${API_BASE}/api/v1/etudes/parametres/consultation`, {
        headers: headers(session),
        data: { mode: 'OBLIGATOIRE', minimum: 2 },
      });
      expect(putOblig.status(), await putOblig.text()).toBe(200);

      const dossierA = await createDossier(request, session, `a${suffix}`);
      const fa = await createFournisseur(request, session, suffix, `F110A${suffix}`.slice(0, 30));
      const fb = await createFournisseur(request, session, suffix, `F110B${suffix}`.slice(0, 30));

      const opened = await request.post(
        `${API_BASE}/api/v1/etudes/dossiers/${dossierA}/consultation`,
        { headers: headers(session), data: { partenaireIds: [fa, fb] } },
      );
      expect(opened.status(), await opened.text()).toBe(201);

      const devis1 = await request.post(
        `${API_BASE}/api/v1/etudes/dossiers/${dossierA}/consultation/devis`,
        { headers: headers(session), data: { partenaireId: fa } },
      );
      expect(devis1.status(), await devis1.text()).toBe(201);

      const gates1 = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${dossierA}/gates`, {
        headers: headers(session),
      });
      expect(gates1.ok(), await gates1.text()).toBeTruthy();
      const g1 = gate4((await gates1.json()) as Gate[]);
      expect(g1?.bloquant).toBe(true);
      expect((g1?.problemes ?? []).length).toBeGreaterThan(0);

      const devis2 = await request.post(
        `${API_BASE}/api/v1/etudes/dossiers/${dossierA}/consultation/devis`,
        { headers: headers(session), data: { partenaireId: fb } },
      );
      expect(devis2.status(), await devis2.text()).toBe(201);

      const gates2 = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${dossierA}/gates`, {
        headers: headers(session),
      });
      const g2 = gate4((await gates2.json()) as Gate[]);
      expect(g2?.bloquant === true && (g2?.problemes ?? []).length > 0).toBe(false);

      const putOpt = await request.put(`${API_BASE}/api/v1/etudes/parametres/consultation`, {
        headers: headers(session),
        data: { mode: 'OPTIONNELLE', minimum: 2 },
      });
      expect(putOpt.status(), await putOpt.text()).toBe(200);

      const dossierB = await createDossier(request, session, `b${suffix}`);
      const gatesOpt = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${dossierB}/gates`, {
        headers: headers(session),
      });
      const gOpt = gate4((await gatesOpt.json()) as Gate[]);
      expect(gOpt?.bloquant).toBe(false);
    } finally {
      await request.put(`${API_BASE}/api/v1/etudes/parametres/consultation`, {
        headers: headers(session),
        data: {
          mode: prevBody.mode ?? 'OPTIONNELLE',
          minimum: prevBody.minimum ?? 1,
        },
      });
    }
  });
});
