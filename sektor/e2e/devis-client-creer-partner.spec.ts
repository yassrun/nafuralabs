import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-117 — À « Générer le devis » sans Partner : créer le client, puis le devis.
 *
 * Preuve :
 * - dossier VALIDEE sans clientId → POST generer-devis sans body = client_manquant
 *   (vu rouge avant : bandeau / toast « Sélectionnez un client Partner »)
 * - Annuler le dialog = pas de devis, bandeau conservé
 * - Confirmer = Partner CLIENT + devis
 *
 * Baseline : vu rouge avant le dialog (toast « Sélectionnez un client Partner »).
 * Playwright dual-require : lancer aussi
 *   node sektor/e2e/scripts/verify-devis-client-117.mjs
 */

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
const MOA = 'MOA QA 117 Tanger';

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

/** Dossier VALIDEE, MOA texte, pas de Partner, DPGF FORFAIT chiffré. */
async function seedDossierValideeSansClient(
  request: APIRequestContext,
  session: CursorSession,
  suffix: string,
): Promise<string> {
  const h = headers(session);
  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: h,
    data: {
      objet: `Devis client 117 ${suffix}`,
      chargeEtudeUserId: await chargeEtudeUserId(request, session),
      clientNom: MOA,
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const dossierId = ((await created.json()) as { id: string }).id;

  const init = await request.post(
    `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`,
    { headers: h },
  );
  expect(init.ok(), await init.text()).toBeTruthy();
  const dpgfId = ((await init.json()) as { dpgfId: string }).dpgfId;

  const lot = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    headers: h,
    data: { type: 'LOT', code: '1', libelle: 'Lot GO 117' },
  });
  expect(lot.status(), await lot.text()).toBe(201);
  const lotId = ((await lot.json()) as { id: string }).id;

  const art = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    headers: h,
    data: {
      type: 'ARTICLE',
      parentId: lotId,
      code: '1.1',
      libelle: `Poste 117 ${suffix}`,
      quantite: 1,
      unite: 'u',
      origineCout: 'FORFAIT',
      coutUnitaire: 100,
      fraisGenerauxPercent: 10,
      margePercent: 17.5,
    },
  });
  expect(art.status(), await art.text()).toBe(201);

  const etape = await request.put(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/etape`, {
    headers: h,
    data: { etape: 2 },
  });
  expect(etape.ok(), await etape.text()).toBeTruthy();

  const soumettre = await request.post(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/soumettre`, {
    headers: h,
  });
  expect(soumettre.ok(), await soumettre.text()).toBeTruthy();

  let valider = await request.post(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/valider`, {
    headers: h,
  });
  expect(valider.ok(), await valider.text()).toBeTruthy();
  let body = (await valider.json()) as { status?: string };
  if (body.status === 'EN_VALIDATION') {
    valider = await request.post(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/valider`, {
      headers: h,
    });
    expect(valider.ok(), await valider.text()).toBeTruthy();
    body = (await valider.json()) as { status?: string };
  }
  expect(body.status).toBe('VALIDEE');
  return dossierId;
}

test.describe('SEKTOR-117 — créer le client Partner à Générer le devis', () => {
  test('API : sans Partner → client_manquant ; Partner + clientId → devis', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — backend Mode B not running');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const dossierId = await seedDossierValideeSansClient(request, session, suffix);
    const h = headers(session);

    const refus = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/generer-devis`,
      { headers: h, data: {} },
    );
    const refusText = await refus.text();
    expect(refus.ok(), refusText).toBeFalsy();
    expect(refusText).toMatch(/client_manquant|Sélectionnez un client Partner/i);

    const partner = await request.post(`${API_BASE}/api/v1/partners`, {
      headers: h,
      data: {
        code: `CLI117${suffix}`.slice(0, 30),
        raisonSociale: `${MOA} ${suffix}`,
        roles: ['CLIENT'],
      },
    });
    expect(partner.status(), await partner.text()).toBe(201);
    const partnerId = ((await partner.json()) as { id: string }).id;

    const ok = await request.post(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/generer-devis`, {
      headers: h,
      data: { clientId: partnerId },
    });
    expect(ok.ok(), await ok.text()).toBeTruthy();
    const devis = (await ok.json()) as {
      status?: string;
      devisGenereId?: string | null;
      clientId?: string | null;
    };
    expect(devis.clientId).toBe(partnerId);
    expect(devis.devisGenereId).toBeTruthy();
    expect(devis.status).toBe('DEVIS_GENERE');
  });

  test('UI : Annuler = pas de devis, bandeau conservé ; Confirmer = devis', async ({
    page,
    request,
  }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — Mode B off');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const dossierId = await seedDossierValideeSansClient(request, session, suffix);

    await page.goto(`/etudes/dossiers/${dossierId}`, { waitUntil: 'domcontentloaded' });
    const cta = page.getByTestId('dossier-cta-generer-devis');
    await expect(cta).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Client à lier au devis/i)).toBeVisible();

    await cta.click();
    const dialog = page.locator('.nf-prompt-dialog');
    await expect(dialog.getByRole('heading', { name: /Créer le client Partner/i })).toBeVisible({
      timeout: 8000,
    });
    await expect(dialog.locator('input')).toHaveValue(MOA);
    await expect(page.getByText(/Sélectionnez un client Partner/i)).toHaveCount(0);

    await dialog.getByRole('button', { name: /^Annuler$/i }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(/Client à lier au devis/i)).toBeVisible();
    await expect(cta).toBeVisible();

    const afterCancel = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}`, {
      headers: headers(session),
    });
    expect(afterCancel.ok()).toBeTruthy();
    const cancelled = (await afterCancel.json()) as {
      status?: string;
      devisGenereId?: string | null;
    };
    expect(cancelled.status).toBe('VALIDEE');
    expect(cancelled.devisGenereId ?? null).toBeNull();

    await cta.click();
    await expect(dialog.getByRole('heading', { name: /Créer le client Partner/i })).toBeVisible({
      timeout: 8000,
    });
    await dialog.getByRole('button', { name: /Créer et générer/i }).click();

    await expect(page.getByTestId('dossier-cta-generer-devis')).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByText(/Client à lier au devis/i)).toHaveCount(0);
    await expect(page.getByText(/^Devis /)).toBeVisible({ timeout: 15000 });

    const after = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}`, {
      headers: headers(session),
    });
    expect(after.ok()).toBeTruthy();
    const generated = (await after.json()) as {
      status?: string;
      devisGenereId?: string | null;
      clientId?: string | null;
    };
    expect(generated.status).toBe('DEVIS_GENERE');
    expect(generated.devisGenereId).toBeTruthy();
    expect(generated.clientId).toBeTruthy();
  });
});
