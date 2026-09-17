import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Le bordereau (BPU) s'ouvre par l'affectation.
 *
 * Sans chargé d'étude désigné, l'étude reste au cadrage : le footer
 * « Continuer vers le bordereau » et le stepper ne mènent pas à l'étape 2,
 * et `PUT /etape` refuse la progression.
 *
 * Baseline : vu rouge avant (footer cliquable et PUT /etape 2 acceptés sur un
 * brouillon non affecté).
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

/** Brouillon sans affectation : aucun chargé d'étude nommé. */
async function createDossierNonAffecte(
  request: APIRequestContext,
  session: CursorSession,
  suffix: string,
): Promise<string> {
  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: headers(session),
    data: {
      objet: `QA affectation ${suffix}`,
      clientNom: 'MOA QA affectation',
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const body = (await created.json()) as { id: string; chargeEtudeUserId?: string | null };
  expect(body.chargeEtudeUserId ?? null).toBeNull();
  return body.id;
}

/** `go` = affectation : elle ouvre le bordereau. */
async function affecter(
  request: APIRequestContext,
  session: CursorSession,
  id: string,
): Promise<void> {
  const go = await request.post(`${API_BASE}/api/v1/etudes/dossiers/${id}/go`, {
    headers: headers(session),
    data: { chargeEtudeUserId: session.userId },
  });
  expect(go.ok(), await go.text()).toBeTruthy();
}

async function allerAEtapeApi(
  request: APIRequestContext,
  session: CursorSession,
  id: string,
  etape: number,
) {
  return request.put(`${API_BASE}/api/v1/etudes/dossiers/${id}/etape`, {
    headers: headers(session),
    data: { etape },
  });
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

async function ouvrirDossier(page: Page, id: string): Promise<void> {
  await page.goto(`/etudes/dossiers/${id}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('nf-wizard-shell')).toBeVisible({ timeout: 20000 });
}

function wizardNext(page: Page) {
  return page
    .locator('nf-wizard-shell .nf-wizard-shell__actions')
    .getByRole('button', { name: /Continuer vers le bordereau/i });
}

/** Étape courante lue sur le stepper (aria-current). */
function currentStepLabel(page: Page) {
  return page.locator('nf-wizard-shell .nf-wizard-shell__step[aria-current="step"]');
}

test.describe('Étude — bordereau interdit sans affectation', () => {
  test('PUT /etape refuse le bordereau tant que l’étude n’est pas affectée', async ({
    request,
  }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — Mode B off');
    if (!session) return;

    const id = await createDossierNonAffecte(request, session, Date.now().toString(36));

    const refus = await allerAEtapeApi(request, session, id, 2);
    expect(refus.status(), await refus.text()).toBe(409);
    expect(((await refus.json()) as { message?: string }).message).toBe(
      'etudes.dossier.bordereau_non_affecte',
    );
    expect(await currentStep(request, session, id), 'l’étape ne bouge pas').toBe(1);

    await affecter(request, session, id);
    expect(await currentStep(request, session, id), 'go ouvre le bordereau').toBe(2);

    const apres = await allerAEtapeApi(request, session, id, 2);
    expect(apres.ok(), await apres.text()).toBeTruthy();
  });

  test('footer Continuer vers le bordereau désactivé sans affectation', async ({
    page,
    request,
  }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — Mode B off');
    if (!session) return;

    const id = await createDossierNonAffecte(request, session, Date.now().toString(36));
    await ouvrirDossier(page, id);

    await expect(page.locator('app-dossier-identite-panel')).toBeVisible({ timeout: 20000 });
    await expect(wizardNext(page)).toBeDisabled();
    await expect(currentStepLabel(page)).toHaveText(/Cadrage/);

    // Stepper : l’étape Bordereau n’est pas cliquable tant qu’on est au cadrage.
    const stepBordereau = page.locator('nf-wizard-shell .nf-wizard-shell__step').nth(1);
    await expect(stepBordereau).toHaveAttribute('data-state', 'upcoming');
    await expect(stepBordereau).not.toHaveAttribute('role', 'button');
    expect(await currentStep(request, session, id)).toBe(1);

    await affecter(request, session, id);
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(currentStepLabel(page)).toHaveText(/Bordereau/);
    expect(await currentStep(request, session, id)).toBe(2);
  });
});
