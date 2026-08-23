import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-118 — Extraire enchaîne rattachement catalogue.
 *
 * Preuve :
 * - Extraire 2 composants LIBRE, extraire-creer 1, persist ITEM → synthèse
 *   « Composants non rattachés » = seulement le non créé
 * - le 2e n’est pas auto-créé (count items +1)
 *
 * Baseline : vu rouge avant persist Extraire (extraire-creer seul → les 2
 * restaient dans GET rattrapage).
 */

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

type CursorSession = {
  accessToken: string;
  tenantId: string;
  userId: string;
};

type RattrapageResume = {
  totalLibres: number;
  groupesDetail?: { libelle: string }[];
};

type ComposantRow = {
  id: string;
  libelle?: string;
  type?: string;
  referenceType?: string;
  itemId?: string | null;
  rendement?: number;
  unite?: string;
  prixUnitaire?: number;
  sourcePrix?: string;
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

async function rattrapageLibelles(
  request: APIRequestContext,
  session: CursorSession,
  dossierId: string,
): Promise<string[]> {
  const res = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/rattrapage`, {
    headers: headers(session),
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  const body = (await res.json()) as RattrapageResume;
  return (body.groupesDetail ?? []).map((g) => g.libelle);
}

test.describe('SEKTOR-118 — Extraire rattache le créé', () => {
  test('créer 1/2 Extraire → synthèse = seulement le non créé ; pas d’auto-création', async ({
    request,
  }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — backend Mode B not running');
    if (!session) return;

    const h = headers(session);
    const suffix = Date.now().toString(36);
    const createdName = `Ciment Extraire 118 ${suffix}`;
    const leftoverName = `Peinture Extraire 118 ${suffix}`;

    const countBeforeRes = await request.get(`${API_BASE}/api/v1/items/count`, { headers: h });
    expect(countBeforeRes.ok()).toBeTruthy();
    const totalBefore = Number(await countBeforeRes.json());

    const dossier = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
      headers: h,
      data: {
        objet: `Extraire rattachement 118 ${suffix}`,
        chargeEtudeUserId: await chargeEtudeUserId(request, session),
        clientNom: 'MOA QA 118',
      },
    });
    expect(dossier.status(), await dossier.text()).toBe(201);
    const dossierId = ((await dossier.json()) as { id: string }).id;

    const bordereau = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`,
      { headers: h },
    );
    expect(bordereau.ok(), await bordereau.text()).toBeTruthy();
    const dpgfId = ((await bordereau.json()) as { dpgfId: string }).dpgfId;

    const lot = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      headers: h,
      data: { type: 'LOT', code: '01', libelle: 'GO 118' },
    });
    expect(lot.status(), await lot.text()).toBe(201);
    const lotId = ((await lot.json()) as { id: string }).id;

    const sousLot = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      headers: h,
      data: {
        type: 'SOUS_LOT',
        parentId: lotId,
        code: '01.01',
        libelle: 'Béton 118',
      },
    });
    expect(sousLot.status(), await sousLot.text()).toBe(201);
    const sousLotId = ((await sousLot.json()) as { id: string }).id;

    const article = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      headers: h,
      data: {
        type: 'ARTICLE',
        parentId: sousLotId,
        code: '01.01.01',
        libelle: 'Poste Extraire 118',
        quantite: 1,
        unite: 'm2',
        origineCout: 'DECOMPOSE',
      },
    });
    expect(article.status(), await article.text()).toBe(201);
    const noeudId = ((await article.json()) as { id: string }).id;

    const dpu = await request.post(`${API_BASE}/api/v1/etudes/dpu`, {
      headers: h,
      data: { dpgfNoeudId: noeudId },
    });
    expect(dpu.status(), await dpu.text()).toBe(201);
    const dpuId = ((await dpu.json()) as { id: string }).id;

    for (const libelle of [createdName, leftoverName]) {
      const line = await request.post(`${API_BASE}/api/v1/etudes/dpu/${dpuId}/composants`, {
        headers: h,
        data: {
          type: 'MATIERE',
          referenceType: 'LIBRE',
          libelle,
          rendement: 1,
          unite: 'KG',
          prixUnitaire: 10,
          sourcePrix: 'MANUEL',
        },
      });
      expect(line.status(), await line.text()).toBe(201);
    }

    const beforeCreate = await rattrapageLibelles(request, session, dossierId);
    expect(beforeCreate).toEqual(expect.arrayContaining([createdName, leftoverName]));

    const created = await request.post(`${API_BASE}/api/v1/items/extraire-creer`, {
      headers: h,
      data: {
        designation: createdName,
        nature: 'MATIERE',
        uniteCode: 'KG',
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const createdBody = (await created.json()) as { itemId: string };
    expect(createdBody.itemId).toBeTruthy();

    const stillLibre = await rattrapageLibelles(request, session, dossierId);
    expect(
      stillLibre,
      'baseline Extraire : extraire-creer seul ne rattache pas — vu rouge avant persist',
    ).toEqual(expect.arrayContaining([createdName, leftoverName]));

    const compsRes = await request.get(`${API_BASE}/api/v1/etudes/dpu/${dpuId}/composants`, {
      headers: h,
    });
    expect(compsRes.ok(), await compsRes.text()).toBeTruthy();
    const comps = (await compsRes.json()) as ComposantRow[];
    const persist = await request.put(`${API_BASE}/api/v1/etudes/dpu/${dpuId}`, {
      headers: h,
      data: {
        composants: comps.map((c) => ({
          id: c.id,
          type: c.type ?? 'MATIERE',
          referenceType: c.libelle === createdName ? 'ITEM' : 'LIBRE',
          itemId: c.libelle === createdName ? createdBody.itemId : null,
          libelle: c.libelle,
          rendement: c.rendement ?? 1,
          unite: c.unite ?? 'KG',
          prixUnitaire: c.prixUnitaire ?? 10,
          sourcePrix: c.libelle === createdName ? 'TARIF' : (c.sourcePrix ?? 'MANUEL'),
        })),
      },
    });
    expect(persist.ok(), await persist.text()).toBeTruthy();

    const after = await rattrapageLibelles(request, session, dossierId);
    expect(after).not.toEqual(expect.arrayContaining([createdName]));
    expect(after).toEqual(expect.arrayContaining([leftoverName]));
    expect(after.filter((l) => l === leftoverName)).toHaveLength(1);

    const countAfterRes = await request.get(`${API_BASE}/api/v1/items/count`, { headers: h });
    expect(Number(await countAfterRes.json())).toBe(totalBefore + 1);
  });
});
