import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * SEKTOR-129 — CTA Continuer / Voir la synthèse avancent l’étape.
 *
 * Un clic footer (et header « Voir la synthèse ») PUT l’étape — pas le stepper,
 * pas `PUT /etape` hors UI.
 *
 * Baseline : vu rouge avant (header VOIR_SYNTHESE → allerAEtapeUi(3) no-op ;
 * footer focus sans next sur overlay fill).
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

async function createDossier(
  request: APIRequestContext,
  session: CursorSession,
  suffix: string,
): Promise<string> {
  const ing = await request.get(`${API_BASE}/api/v1/etudes/ingenieurs`, {
    headers: headers(session),
  });
  const list = ing.ok() ? ((await ing.json()) as { userId?: string }[]) : [];
  const chargeEtudeUserId = list[0]?.userId ?? session.userId;
  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: headers(session),
    data: {
      objet: `QA 129 CTA ${suffix}`,
      chargeEtudeUserId,
      clientNom: 'MOA QA 129',
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  return ((await created.json()) as { id: string }).id;
}

async function currentStep(
  request: APIRequestContext,
  session: CursorSession,
  id: string,
): Promise<number> {
  const res = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${id}`, {
    headers: headers(session),
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return ((await res.json()) as { currentStep: number }).currentStep;
}

async function addLotArticlePriced(
  request: APIRequestContext,
  session: CursorSession,
  dossierId: string,
  suffix: string,
): Promise<void> {
  const dossier = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}`, {
    headers: headers(session),
  });
  const dpgfId = ((await dossier.json()) as { dpgfId: string }).dpgfId;
  expect(dpgfId).toBeTruthy();

  const lotRes = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    headers: headers(session),
    data: { type: 'LOT', code: '1', libelle: `Lot GO 129 ${suffix}` },
  });
  expect(lotRes.status(), await lotRes.text()).toBe(201);
  const lotId = ((await lotRes.json()) as { id: string }).id;

  const artRes = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    headers: headers(session),
    data: {
      type: 'ARTICLE',
      code: '1.1',
      libelle: `Beton 129 ${suffix}`,
      parentId: lotId,
      unite: 'm3',
      quantite: 12,
      origineCout: 'FORFAIT',
      coutUnitaire: 100,
      prixUnitaire: 129.25,
      fraisGenerauxPercent: 10,
      margePercent: 17.5,
    },
  });
  expect(artRes.status(), await artRes.text()).toBe(201);
}

async function clickWizardNext(page: Page, name: RegExp): Promise<void> {
  const btn = page.locator('nf-wizard-shell .nf-wizard-shell__actions').getByRole('button', {
    name,
  });
  await expect(btn).toBeEnabled({ timeout: 15000 });
  await btn.click();
}

test.describe('SEKTOR-129 — CTA avancent l’étape', () => {
  test('footer Continuer puis header et footer Voir la synthèse', async ({ page, request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — Mode B off');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const id = await createDossier(request, session, suffix);

    await page.goto(`/etudes/dossiers/${id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Pièces du marché|Documents/i).first()).toBeVisible({
      timeout: 20000,
    });

    const manuel = page.getByRole('button', { name: /Bordereau manuel/i });
    await expect(manuel).toBeVisible({ timeout: 10000 });
    await manuel.click();

    await clickWizardNext(page, /Continuer vers le bordereau/i);
    await expect(page.getByRole('heading', { name: /Arbre du bordereau/i })).toBeVisible({
      timeout: 20000,
    });
    expect(await currentStep(request, session, id)).toBe(2);

    await addLotArticlePriced(request, session, id, suffix);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Arbre du bordereau/i })).toBeVisible({
      timeout: 20000,
    });

    await clickWizardNext(page, /Continuer vers le coût/i);
    await expect(page.locator('app-consultation-etude-panel')).toBeVisible({ timeout: 20000 });
    expect(await currentStep(request, session, id)).toBe(3);

    const headerSynthese = page
      .locator('app-dossier-summary-header')
      .getByRole('button', { name: /^Voir la synthèse$/i });
    await expect(headerSynthese).toBeVisible({ timeout: 10000 });
    await headerSynthese.click();
    await expect(page.getByText(/Synthèse et validation/i).first()).toBeVisible({
      timeout: 20000,
    });
    expect(await currentStep(request, session, id), 'header VOIR_SYNTHESE doit PUT etape 5').toBe(
      5,
    );

    const back = page.locator('nf-wizard-shell .nf-wizard-shell__actions').getByRole('button', {
      name: /Précédent/i,
    });
    await expect(back).toBeEnabled();
    await back.click();
    await expect(page.locator('app-consultation-etude-panel')).toBeVisible({ timeout: 15000 });

    await clickWizardNext(page, /Voir la synthèse/i);
    await expect(page.getByText(/Synthèse et validation/i).first()).toBeVisible({
      timeout: 20000,
    });
    expect(await currentStep(request, session, id), 'footer Voir la synthèse doit PUT etape 5').toBe(
      5,
    );
  });
});
