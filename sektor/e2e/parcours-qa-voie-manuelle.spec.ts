import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * SEKTOR-115 — Étape 1 Documents : voie Bordereau manuel sans PDF BDP+CPS.
 *
 * Baseline : vu rouge avant (pas de CTA, Continuer bloqué par gate documents).
 */

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

test.use({ viewport: { width: 1280, height: 900 }, channel: 'chrome' });

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

async function createDossier(
  request: APIRequestContext,
  session: CursorSession,
  suffix: string,
): Promise<string> {
  const chargeEtudeUserId = session.userId;
  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: headers(session),
    data: {
      objet: `QA 115 manuel ${suffix}`,
      chargeEtudeUserId,
      clientNom: 'MOA QA 115',
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const id = ((await created.json()) as { id: string }).id;
  const go = await request.post(`${API_BASE}/api/v1/etudes/dossiers/${id}/go`, {
    headers: headers(session),
    data: { chargeEtudeUserId },
  });
  expect(go.ok(), await go.text()).toBeTruthy();
  const accept = await request.post(`${API_BASE}/api/v1/etudes/dossiers/${id}/accepter-affectation`, {
    headers: headers(session),
  });
  expect(accept.ok(), await accept.text()).toBeTruthy();
  return id;
}

async function openDossier(page: Page, id: string): Promise<void> {
  await page.goto(`/etudes/dossiers/${id}`, { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', { name: /Arbre du bordereau|Bordereau|Manuel/i }).first(),
  ).toBeVisible({
    timeout: 20000,
  });
}

test.describe('SEKTOR-115 — voie manuelle Documents', () => {
  test('sans PDF : Bordereau manuel → étape 2 arbre éditable', async ({ page, request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — Mode B off');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const id = await createDossier(request, session, suffix);
    await openDossier(page, id);

    await page.getByRole('button', { name: /^Manuel$/i }).click();
    const creer = page.getByRole('button', { name: /Créer l’arbre vide|Creer l'arbre vide/i });
    await expect(creer).toBeVisible({ timeout: 10000 });
    await creer.click();

    await expect(page.getByRole('heading', { name: /Arbre du bordereau/i })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole('button', { name: /Ajouter un lot/i })).toBeEnabled();
  });
});
