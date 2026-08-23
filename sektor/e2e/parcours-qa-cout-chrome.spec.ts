import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * SEKTOR-119 / 120 / 121 / 123 — chrome étape Coût (après voie manuelle 115).
 *
 * 119 : panneau consultation dans le DOM, hauteur > 0, CTA paquet/ouvrir.
 * 120 : libellé Anomalies étape N = etapeUi ; clic ouvre le détail.
 * 121 : clic simple ARTICLE ouvre le drawer.
 * 123 : Partager enabled + dialog.
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

async function seedDossierCout(
  request: APIRequestContext,
  session: CursorSession,
  suffix: string,
): Promise<string> {
  const ing = await request.get(`${API_BASE}/api/v1/etudes/ingenieurs`, { headers: headers(session) });
  const list = ing.ok() ? ((await ing.json()) as { userId?: string }[]) : [];
  const chargeEtudeUserId = list[0]?.userId ?? session.userId;
  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: headers(session),
    data: {
      objet: `QA cout ${suffix}`,
      chargeEtudeUserId,
      clientNom: 'MOA QA cout',
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const dossierId = ((await created.json()) as { id: string }).id;

  const init = await request.post(
    `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`,
    { headers: headers(session) },
  );
  expect(init.status(), await init.text()).toBe(200);
  const dpgfId = ((await init.json()) as { dpgfId: string }).dpgfId;

  const lotRes = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    headers: headers(session),
    data: { type: 'LOT', code: '1', libelle: 'Lot GO' },
  });
  expect(lotRes.status(), await lotRes.text()).toBe(201);
  const lotId = ((await lotRes.json()) as { id: string }).id;

  const artRes = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    headers: headers(session),
    data: {
      type: 'ARTICLE',
      code: '1.1',
      libelle: `Beton QA ${suffix}`,
      parentId: lotId,
      unite: 'm3',
      quantite: 12,
    },
  });
  expect(artRes.status(), await artRes.text()).toBe(201);

  const step2 = await request.put(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/etape`, {
    headers: headers(session),
    data: { etape: 2 },
  });
  expect(step2.status(), await step2.text()).toBe(200);
  const step3 = await request.put(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/etape`, {
    headers: headers(session),
    data: { etape: 3 },
  });
  expect(step3.status(), await step3.text()).toBe(200);
  return dossierId;
}

async function openCout(page: Page, id: string): Promise<void> {
  await page.goto(`/etudes/dossiers/${id}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('app-consultation-etude-panel')).toBeVisible({ timeout: 20000 });
}

test.describe.configure({ mode: 'serial' });

test.describe('Parcours QA — chrome étape Coût', () => {
  test('SEKTOR-119 panneau consultation visible et utilisable', async ({ page, request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — Mode B off');
    if (!session) return;
    const id = await seedDossierCout(request, session, Date.now().toString(36));
    await openCout(page, id);

    const panel = page.locator('app-consultation-etude-panel');
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box?.height ?? 0, 'panneau hauteur 0').toBeGreaterThan(40);
    await expect(page.getByRole('button', { name: /Ouvrir la consultation/i })).toBeVisible();
    await expect(page.getByPlaceholder(/ciment-cpj-45/i)).toBeEnabled();
  });

  test('SEKTOR-120 anomalies étape N = etapeUi + clic ouvre le détail', async ({ page, request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — Mode B off');
    if (!session) return;
    const id = await seedDossierCout(request, session, Date.now().toString(36));
    await openCout(page, id);

    const kpi = page.getByText(/Anomalies étape 3/i);
    await expect(kpi).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Anomalies étape 2/i)).toHaveCount(0);
    await kpi.click();
    await expect(page.getByRole('heading', { name: /Détail des erreurs/i })).toBeVisible({
      timeout: 8000,
    });
  });

  test('SEKTOR-121 clic simple ARTICLE ouvre le drawer', async ({ page, request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — Mode B off');
    if (!session) return;
    const suffix = Date.now().toString(36);
    const id = await seedDossierCout(request, session, suffix);
    await openCout(page, id);

    const article = page.getByText(`Beton QA ${suffix}`).first();
    await expect(article).toBeVisible({ timeout: 15000 });
    await article.click();
    await expect(page.locator('.poste-drawer')).toBeVisible({ timeout: 8000 });
  });

  test('SEKTOR-123 Partager enabled et ouvre le dialog', async ({ page, request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — Mode B off');
    if (!session) return;
    const id = await seedDossierCout(request, session, Date.now().toString(36));
    await openCout(page, id);

    const share = page.getByRole('button', { name: /^Partager$/i });
    await expect(share).toBeEnabled({ timeout: 10000 });
    await share.click();
    await expect(page.getByRole('heading', { name: /Partager le dossier/i })).toBeVisible({
      timeout: 8000,
    });
  });
});
