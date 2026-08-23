import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-112 — Identifier articles couverts + appliquer prix CONSULTE.
 *
 * Preuve :
 * - 1 devis sur paquet ciment+peinture ; ciment identifié → CONSULTE
 * - autre article de l’étude (peinture) reste tarif
 * - même identité sur 3 postes = une identification
 * - fichier seul compte mais n’identifie pas
 *
 * Baseline : vu rouge avant l’endpoint (POST identifier → 404).
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
  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: headers(session),
    data: {
      objet: `Consultation 112 ${suffix}`,
      chargeEtudeUserId: await chargeEtudeUserId(request, session),
      clientNom: 'MOA QA 112',
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  return ((await created.json()) as { id: string }).id;
}

async function createItem(
  request: APIRequestContext,
  session: CursorSession,
  name: string,
  cleStable: string,
): Promise<string> {
  const created = await request.post(`${API_BASE}/api/v1/items`, {
    headers: headers(session),
    data: { name, nature: 'MATIERE', isActive: true, cleStable },
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
    data: {
      code,
      raisonSociale: `Fournisseur ${code} ${suffix}`,
      roles: ['FOURNISSEUR'],
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  return ((await created.json()) as { id: string }).id;
}

async function addNoeud(
  request: APIRequestContext,
  session: CursorSession,
  dpgfId: string,
  body: Record<string, unknown>,
): Promise<string> {
  const res = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    headers: headers(session),
    data: body,
  });
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

async function createDpuWithItem(
  request: APIRequestContext,
  session: CursorSession,
  noeudId: string,
  itemId: string,
  libelle: string,
  prix: number,
  unite: string,
): Promise<string> {
  const dpu = await request.post(`${API_BASE}/api/v1/etudes/dpu`, {
    headers: headers(session),
    data: { dpgfNoeudId: noeudId },
  });
  expect(dpu.status(), await dpu.text()).toBe(201);
  const dpuId = ((await dpu.json()) as { id: string }).id;
  const composant = await request.post(`${API_BASE}/api/v1/etudes/dpu/${dpuId}/composants`, {
    headers: headers(session),
    data: {
      type: 'MATIERE',
      referenceType: 'ITEM',
      itemId,
      libelle,
      rendement: 1,
      unite,
      prixUnitaire: prix,
      sourcePrix: 'TARIF',
      prixLibelleSource: 'tarif-qa-112',
    },
  });
  expect(composant.status(), await composant.text()).toBe(201);
  return dpuId;
}

async function dpuSourcePrix(
  request: APIRequestContext,
  session: CursorSession,
  dpuId: string,
): Promise<{ sourcePrix?: string; itemId?: string }[]> {
  const res = await request.get(`${API_BASE}/api/v1/etudes/dpu/${dpuId}/composants`, {
    headers: headers(session),
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as { sourcePrix?: string; itemId?: string }[];
}

test.describe('SEKTOR-112 — Identifier couverts + CONSULTE', () => {
  test('ciment identifié CONSULTE ; peinture reste tarif ; fichier seul n’identifie pas', async ({
    request,
  }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session unavailable — backend Mode B not running');
    if (!session) return;

    const suffix = Date.now().toString(36);
    const cleCiment = `ciment-cpj-45-${suffix}`;
    const clePeinture = `peinture-acrylique-${suffix}`;
    const cimentItemId = await createItem(request, session, `Ciment CPJ 45 ${suffix}`, cleCiment);
    const peintureItemId = await createItem(
      request,
      session,
      `Peinture acrylique ${suffix}`,
      clePeinture,
    );

    const dossierId = await createDossier(request, session, suffix);
    const fa = await createFournisseur(request, session, suffix, `F112A${suffix}`.slice(0, 30));
    const fb = await createFournisseur(request, session, suffix, `F112B${suffix}`.slice(0, 30));

    const bordereau = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`,
      { headers: headers(session) },
    );
    expect(bordereau.ok(), await bordereau.text()).toBeTruthy();
    const dpgfId = ((await bordereau.json()) as { dpgfId: string }).dpgfId;

    const lotId = await addNoeud(request, session, dpgfId, {
      type: 'LOT',
      code: '01',
      libelle: 'Gros œuvre',
    });
    const sousLotId = await addNoeud(request, session, dpgfId, {
      type: 'SOUS_LOT',
      parentId: lotId,
      code: '01.01',
      libelle: 'Béton',
    });
    const a1 = await addNoeud(request, session, dpgfId, {
      type: 'ARTICLE',
      parentId: sousLotId,
      code: '01.01.01',
      libelle: 'Béton poste 1',
      quantite: 10,
      unite: 'm3',
      origineCout: 'DECOMPOSE',
    });
    const a2 = await addNoeud(request, session, dpgfId, {
      type: 'ARTICLE',
      parentId: sousLotId,
      code: '01.01.02',
      libelle: 'Béton poste 2',
      quantite: 5,
      unite: 'm3',
      origineCout: 'DECOMPOSE',
    });
    const a3 = await addNoeud(request, session, dpgfId, {
      type: 'ARTICLE',
      parentId: sousLotId,
      code: '01.01.03',
      libelle: 'Béton poste 3',
      quantite: 8,
      unite: 'm3',
      origineCout: 'DECOMPOSE',
    });
    const aPeinture = await addNoeud(request, session, dpgfId, {
      type: 'ARTICLE',
      parentId: sousLotId,
      code: '01.01.04',
      libelle: 'Peinture',
      quantite: 20,
      unite: 'm2',
      origineCout: 'DECOMPOSE',
    });

    const dpuC1 = await createDpuWithItem(request, session, a1, cimentItemId, 'Ciment', 100, 'T');
    const dpuC2 = await createDpuWithItem(request, session, a2, cimentItemId, 'Ciment', 100, 'T');
    const dpuC3 = await createDpuWithItem(request, session, a3, cimentItemId, 'Ciment', 100, 'T');
    const dpuP = await createDpuWithItem(
      request,
      session,
      aPeinture,
      peintureItemId,
      'Peinture',
      40,
      'L',
    );

    const opened = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation`,
      {
        headers: headers(session),
        data: { cleStables: [cleCiment, clePeinture], partenaireIds: [fa] },
      },
    );
    expect(opened.status(), await opened.text()).toBe(201);

    const fileOnly = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation/devis`,
      { headers: headers(session), data: { partenaireId: fb } },
    );
    expect(fileOnly.status(), await fileOnly.text()).toBe(201);

    const identifyFile = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation/identifier`,
      { headers: headers(session), data: { cleStables: [cleCiment, clePeinture] } },
    );
    expect(identifyFile.status(), await identifyFile.text()).toBe(200);
    expect(
      ((await identifyFile.json()) as { identitesCouvertes?: unknown[] }).identitesCouvertes ?? [],
    ).toEqual([]);

    const devisLignes = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation/devis`,
      {
        headers: headers(session),
        data: {
          partenaireId: fa,
          lignes: [{ cleStable: cleCiment, designation: 'Ciment CPJ 45', prixUnitaire: 85.5 }],
        },
      },
    );
    expect(devisLignes.status(), await devisLignes.text()).toBe(201);

    const identified = await request.post(
      `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation/identifier`,
      { headers: headers(session), data: { cleStables: [cleCiment, clePeinture] } },
    );
    expect(identified.status(), await identified.text()).toBe(200);
    const body = (await identified.json()) as {
      identitesCouvertes?: { cleStable: string; prixUnitaire: number }[];
    };
    expect(body.identitesCouvertes).toHaveLength(1);
    expect(body.identitesCouvertes?.[0]?.cleStable).toBe(cleCiment);

    for (const dpuId of [dpuC1, dpuC2, dpuC3]) {
      const comps = await dpuSourcePrix(request, session, dpuId);
      expect(comps.some((c) => c.itemId === cimentItemId && c.sourcePrix === 'CONSULTE')).toBe(
        true,
      );
    }
    const peintureComps = await dpuSourcePrix(request, session, dpuP);
    expect(
      peintureComps.some((c) => c.itemId === peintureItemId && c.sourcePrix === 'CONSULTE'),
    ).toBe(false);
    expect(peintureComps.some((c) => c.itemId === peintureItemId && c.sourcePrix === 'TARIF')).toBe(
      true,
    );
  });
});
