import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * SEKTOR-130 — Arbre Coût reflète le PU après Extraire (persist in-drawer).
 *
 * Extraire / créer / ajouter persiste le DPGF ; fermer ✕ (saved=false) doit
 * recharger l’arbre + TOTAL HT, sans F5.
 *
 * Baseline : vu rouge avant (close n’applique le snapshot que si result.saved).
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
): Promise<{ dossierId: string; articleId: string; libelle: string }> {
  const ing = await request.get(`${API_BASE}/api/v1/etudes/ingenieurs`, {
    headers: headers(session),
  });
  const list = ing.ok() ? ((await ing.json()) as { userId?: string }[]) : [];
  const chargeEtudeUserId = list[0]?.userId ?? session.userId;
  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: headers(session),
    data: {
      objet: `QA 130 arbre PU ${suffix}`,
      chargeEtudeUserId,
      clientNom: 'MOA QA 130',
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
    data: { type: 'LOT', code: '1', libelle: 'Lot GO 130' },
  });
  expect(lotRes.status(), await lotRes.text()).toBe(201);
  const lotId = ((await lotRes.json()) as { id: string }).id;

  const libelle = `Beton Extraire 130 ${suffix}`;
  const artRes = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    headers: headers(session),
    data: {
      type: 'ARTICLE',
      code: '1.1',
      libelle,
      parentId: lotId,
      unite: 'm3',
      quantite: 12,
    },
  });
  expect(artRes.status(), await artRes.text()).toBe(201);
  const articleId = ((await artRes.json()) as { id: string }).id;

  const step3 = await request.put(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/etape`, {
    headers: headers(session),
    data: { etape: 3 },
  });
  expect(step3.status(), await step3.text()).toBe(200);

  return { dossierId, articleId, libelle };
}

async function persistPuCommeExtraire(
  request: APIRequestContext,
  session: CursorSession,
  articleId: string,
): Promise<void> {
  const dpuRes = await request.post(`${API_BASE}/api/v1/etudes/dpu`, {
    headers: headers(session),
    data: { dpgfNoeudId: articleId, fraisGenerauxPercent: 10, margeBeneficiairePercent: 17.5 },
  });
  expect([200, 201].includes(dpuRes.status()), await dpuRes.text()).toBeTruthy();
  const dpu = (await dpuRes.json()) as { id: string };

  const updateDpu = await request.put(`${API_BASE}/api/v1/etudes/dpu/${dpu.id}`, {
    headers: headers(session),
    data: {
      fraisGenerauxPercent: 10,
      margeBeneficiairePercent: 17.5,
      composants: [
        {
          type: 'MATIERE',
          referenceType: 'LIBRE',
          libelle: 'Ciment CPJ',
          quantite: 1,
          unite: 't',
          prixUnitaire: 850,
          sourcePrix: 'MANUEL',
        },
      ],
    },
  });
  expect(updateDpu.ok(), await updateDpu.text()).toBeTruthy();

  const noeud = await request.put(`${API_BASE}/api/v1/etudes/dpgf-noeuds/${articleId}`, {
    headers: headers(session),
    data: {
      prixUnitaire: 1083.75,
      coutUnitaire: 850,
      fraisGenerauxPercent: 10,
      margePercent: 17.5,
      origineCout: 'DECOMPOSE',
    },
  });
  expect(noeud.ok(), await noeud.text()).toBeTruthy();
}

async function openCout(page: Page, id: string): Promise<void> {
  await page.goto(`/etudes/dossiers/${id}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('app-consultation-etude-panel')).toBeVisible({ timeout: 20000 });
}

test.describe('SEKTOR-130 — arbre PU après persist Extraire', () => {
  test('fermer ✕ recharge PU HT et TOTAL HT sans F5', async ({ page, request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — Mode B off');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const { dossierId, articleId, libelle } = await seedDossierCout(request, session, suffix);
    await openCout(page, dossierId);

    const article = page.getByText(libelle).first();
    await expect(article).toBeVisible({ timeout: 15000 });

    const tree = page.locator('app-bordereau-arbre');
    await expect(tree.getByText('—').first()).toBeVisible();

    await article.click();
    await expect(page.locator('.poste-drawer')).toBeVisible({ timeout: 8000 });

    await persistPuCommeExtraire(request, session, articleId);

    await page.locator('.poste-drawer').getByRole('button', { name: '✕' }).click();
    await expect(page.locator('.poste-drawer')).toHaveCount(0, { timeout: 8000 });

    await expect(tree.getByText(/1[.\s\u00a0\u202f,]?083[,.]75/)).toBeVisible({ timeout: 10000 });
    await expect(tree.getByText(/13[.\s\u00a0\u202f,]?005/)).toBeVisible({ timeout: 10000 });

    const totalHt = page.locator('app-dossier-summary-header .dsh__kpi-value').first();
    await expect(totalHt).toHaveText(/13[.\s\u00a0\u202f,]?005/, { timeout: 10000 });
  });
});
