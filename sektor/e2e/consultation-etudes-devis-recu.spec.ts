import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-109 — Consultation études + devis reçu.
 *
 * Preuve :
 * - persister une consultation + un devis reçu incrémente le compteur
 * - inviter sans devis ne compte pas
 * - un PDF dossier DEVIS_FOURNISSEUR sans lien n'incrémente pas
 * - un fournisseur = au plus un devis qui compte
 *
 * Baseline : vu rouge avant l'endpoint (POST consultation → 404).
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
  const chargeEtudeUserIdValue = await chargeEtudeUserId(request, session);
  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: headers(session),
    data: {
      objet: `Consultation 109 ${suffix}`,
      chargeEtudeUserId: chargeEtudeUserIdValue,
      clientNom: 'MOA QA 109',
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const body = (await created.json()) as { id: string };
  return body.id;
}

async function createFournisseur(
  request: APIRequestContext,
  session: CursorSession,
  suffix: string,
  code: string,
): Promise<string> {
  const created = await request.post(`${API_BASE}/api/v1/partners`, {
    headers: headers(session),
    data: {
      code,
      raisonSociale: `Fournisseur ${code} ${suffix}`,
      roles: ['FOURNISSEUR'],
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const body = (await created.json()) as { id: string };
  return body.id;
}

test.describe('SEKTOR-109 — Consultation études + devis reçu', () => {
  test('devis lié compte ; invite et PDF orphelin ne comptent pas', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — backend Mode B not running');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const dossierId = await createDossier(request, session, suffix);
    const fa = await createFournisseur(request, session, suffix, `F109A${suffix}`.slice(0, 30));
    const fb = await createFournisseur(request, session, suffix, `F109B${suffix}`.slice(0, 30));

    const missing = await request.get(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation`,
      { headers: headers(session) },
    );
    expect(missing.status(), await missing.text()).toBe(404);

    const opened = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation`,
      {
        headers: headers(session),
        data: {
          cleStables: [`ciment-cpj-45-${suffix}`, `peinture-acrylique-${suffix}`],
          partenaireIds: [fa],
        },
      },
    );
    expect(opened.status(), await opened.text()).toBe(201);
    const consultation = (await opened.json()) as {
      devisRecus?: number;
      partenaireIds?: string[];
      paquetCleStables?: string[];
    };
    expect(consultation.devisRecus ?? 0).toBe(0);
    expect(consultation.partenaireIds).toContain(fa);
    expect(consultation.paquetCleStables?.length).toBe(2);

    const invited = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation/fournisseurs`,
      {
        headers: headers(session),
        data: { partenaireId: fb },
      },
    );
    expect(invited.status(), await invited.text()).toBe(200);
    const afterInvite = (await invited.json()) as { devisRecus?: number };
    expect(afterInvite.devisRecus ?? 0).toBe(0);

    const orphan = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'X-Tenant-Id': session.tenantId,
          Accept: 'application/json',
        },
        multipart: {
          file: {
            name: `orphan-devis-${suffix}.pdf`,
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 orphan'),
          },
          type: 'DEVIS_FOURNISSEUR',
        },
      },
    );
    expect(orphan.ok(), await orphan.text()).toBeTruthy();

    const stillZero = await request.get(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation`,
      { headers: headers(session) },
    );
    expect(stillZero.status(), await stillZero.text()).toBe(200);
    expect(((await stillZero.json()) as { devisRecus?: number }).devisRecus ?? 0).toBe(0);

    const devisFa = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation/devis`,
      {
        headers: headers(session),
        data: { partenaireId: fa },
      },
    );
    expect(devisFa.status(), await devisFa.text()).toBe(201);
    expect(((await devisFa.json()) as { devisRecus?: number }).devisRecus).toBe(1);

    const dup = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation/devis`,
      {
        headers: headers(session),
        data: { partenaireId: fa },
      },
    );
    expect(dup.status(), await dup.text()).toBe(409);

    const devisFb = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation/devis`,
      {
        headers: headers(session),
        data: { partenaireId: fb },
      },
    );
    expect(devisFb.status(), await devisFb.text()).toBe(201);
    const afterTwo = (await devisFb.json()) as {
      devisRecus?: number;
      fournisseursDistincts?: number;
    };
    expect(afterTwo.devisRecus).toBe(2);
    expect(afterTwo.fournisseursDistincts).toBe(2);
  });
});
