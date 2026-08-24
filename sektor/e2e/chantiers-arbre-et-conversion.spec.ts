import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * SEKTOR-150 — preuves du sous-lot `chantiers/arbre-et-conversion`.
 *
 * Contrat : `sektor/raster-src/lots/chantiers/arbre-et-conversion/CONTRAT.md`
 * (AC-1..AC-16, amendé le 23/08/2026 sur AC-9 et AC-12).
 *
 * Les onze `test(...)` portent **exactement** les noms de scénario du contrat.
 * Chaque test annonce en tête les `AC-n` qu'il couvre.
 *
 * ── ÉTAT AU 24/08/2026 ────────────────────────────────────────────────────────
 * **NON EXÉCUTÉ — attend un déploiement staging.** Aucun backend ne tourne sur la
 * machine de QA et rien n'est déployé. Ces scénarios sont écrits, pas joués :
 * aucun résultat n'est rapporté dans SEKTOR-150 comme s'ils avaient tourné.
 * Le `test.skip` sur `cursor-session` les met en `skipped`, pas en vert, tant que
 * le backend Mode B n'est pas joignable.
 *
 * Mode B (QA Cursor, cf. `.cursor/rules/cursor-qa-browser.mdc`) : pas de Keycloak,
 * la session vient de `POST /api/public/dev/cursor-session`. Tenant `qa-local`.
 *
 * ── ÉTAT INITIAL ──────────────────────────────────────────────────────────────
 * Le contrat exige un jeu de données précis. Il est construit **par le test**, pas
 * par un seeder : chaque scénario forge son propre dossier avec un suffixe unique,
 * pour qu'aucun rejeu ne dépende d'un état laissé par le précédent.
 *  - `seedEtudeGagneeArbreProfond` — 2 lots, 1 sous-lot, 6 postes, unités et PU
 *    tous distincts (le contrat interdit des valeurs qui passent toutes seules).
 *  - `seedEtudeGagneePosteOrphelin` — l'étude piège d'AC-12.
 *  - Aucune activité, aucune zone : palier 1, rien de planning.
 */

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

type CursorSession = {
  accessToken: string;
  tenantId: string;
  userId: string;
};

async function cursorSession(request: APIRequestContext): Promise<CursorSession | null> {
  const res = await request
    .post(`${API_BASE}/api/public/dev/cursor-session`, { headers: { Accept: 'application/json' } })
    .catch(() => null);
  if (!res || !res.ok()) return null;
  const body = (await res.json()) as { accessToken?: string; tenantId?: string; userId?: string };
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

function suffix(): string {
  return Date.now().toString(36).slice(-6) + Math.floor(Math.random() * 900 + 100);
}

// ── Types de lecture ──────────────────────────────────────────────────────────

type LotChantier = {
  id: string;
  code: string;
  designation: string;
  parentLotId: string | null;
  nature: 'VENDU' | 'INTERNE';
  dpgfNoeudId: string | null;
  unite: string | null;
  quantite: string | number | null;
  prixUnitaireHt: string | number | null;
  montantHt: string | number | null;
  ordre: number;
};

type PosteBudgetaire = {
  id: string;
  lotId: string;
  code: string;
  designation: string;
  nature: 'VENDU' | 'INTERNE';
  dpgfNoeudId: string | null;
  unite: string | null;
  quantite: string | number | null;
  prixUnitaireHt: string | number | null;
  ordre: number;
};

type EtudeGagnee = {
  dossierId: string;
  dpgfId: string;
  clientId: string;
  /** code DPGF → id du nœud, pour vérifier le lien retour d'AC-2. */
  noeudIdByCode: Record<string, string>;
};

// ── Fabrique d'état initial ───────────────────────────────────────────────────

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

async function creerClientPartner(
  request: APIRequestContext,
  session: CursorSession,
  s: string,
): Promise<string> {
  const partner = await request.post(`${API_BASE}/api/v1/partners`, {
    headers: headers(session),
    data: {
      code: `CLI150${s}`.slice(0, 30),
      raisonSociale: `Client SEKTOR-150 ${s}`,
      roles: ['CLIENT'],
    },
  });
  expect(partner.status(), await partner.text()).toBe(201);
  return ((await partner.json()) as { id: string }).id;
}

/** Bordereau manuel vierge attaché au dossier — rend le dpgfId. */
async function ouvrirBordereau(
  request: APIRequestContext,
  session: CursorSession,
  dossierId: string,
): Promise<string> {
  const init = await request.post(
    `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`,
    { headers: headers(session) },
  );
  expect(init.ok(), await init.text()).toBeTruthy();
  return ((await init.json()) as { dpgfId: string }).dpgfId;
}

async function ajouterNoeud(
  request: APIRequestContext,
  session: CursorSession,
  dpgfId: string,
  data: Record<string, unknown>,
): Promise<string> {
  const res = await request.post(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
    headers: headers(session),
    data,
  });
  expect(res.status(), await res.text()).toBe(201);
  return ((await res.json()) as { id: string }).id;
}

/** BROUILLON → … → VALIDEE → DEVIS_GENERE. Le dossier porte alors son clientId. */
async function jusquAuDevis(
  request: APIRequestContext,
  session: CursorSession,
  dossierId: string,
  clientId: string,
): Promise<void> {
  const h = headers(session);

  const etape = await request.put(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/etape`, {
    headers: h,
    data: { etape: 2 },
  });
  expect(etape.ok(), await etape.text()).toBeTruthy();

  const soumettre = await request.post(
    `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/soumettre`,
    { headers: h },
  );
  expect(soumettre.ok(), await soumettre.text()).toBeTruthy();

  // La validation peut demander deux passes (EN_VALIDATION puis VALIDEE).
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

  const devis = await request.post(
    `${API_BASE}/api/v1/etudes/dossiers/${dossierId}/generer-devis`,
    { headers: h, data: { clientId } },
  );
  expect(devis.ok(), await devis.text()).toBeTruthy();
}

async function marquerGagne(
  request: APIRequestContext,
  session: CursorSession,
  dossierId: string,
  s: string,
): Promise<void> {
  const res = await request.post(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/gagne`, {
    headers: headers(session),
    data: {
      dateAttribution: '2026-08-24',
      referenceMarche: `MA-150-${s}`,
      montantAttribue: 1_000_000,
    },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  expect(((await res.json()) as { status?: string }).status).toBe('GAGNE');
}

/**
 * L'étude nominale du contrat : 2 lots, 1 sous-lot sous le premier, 6 postes dont
 * un sous le sous-lot. Unités et prix unitaires **tous distincts** — pour qu'une
 * copie qui mélangerait deux lignes se voie.
 */
const ARBRE_NOMINAL: {
  code: string;
  libelle: string;
  parent: string | null;
  type: 'LOT' | 'SOUS_LOT' | 'ARTICLE';
  unite?: string;
  quantite?: number;
  coutUnitaire?: number;
}[] = [
  { code: '1', libelle: 'Terrassements', parent: null, type: 'LOT' },
  { code: '2', libelle: 'Gros œuvre', parent: null, type: 'LOT' },
  { code: '1.A', libelle: 'Fouilles en rigole', parent: '1', type: 'SOUS_LOT' },
  { code: '1.1', libelle: 'Décapage terre végétale', parent: '1', type: 'ARTICLE', unite: 'm2', quantite: 1250, coutUnitaire: 13 },
  { code: '1.2', libelle: 'Remblai compacté', parent: '1', type: 'ARTICLE', unite: 'm3', quantite: 480, coutUnitaire: 71 },
  { code: '1.A.1', libelle: 'Fouille en rigole pour semelles', parent: '1.A', type: 'ARTICLE', unite: 'ml', quantite: 96, coutUnitaire: 137 },
  { code: '2.1', libelle: 'Béton de propreté', parent: '2', type: 'ARTICLE', unite: 'm3', quantite: 37, coutUnitaire: 823 },
  { code: '2.2', libelle: 'Acier haute adhérence', parent: '2', type: 'ARTICLE', unite: 'kg', quantite: 8400, coutUnitaire: 9 },
  { code: '2.3', libelle: 'Coffrage bois voiles', parent: '2', type: 'ARTICLE', unite: 'm2', quantite: 610, coutUnitaire: 191 },
];

async function seedEtudeGagneeArbreProfond(
  request: APIRequestContext,
  session: CursorSession,
  s: string,
): Promise<EtudeGagnee> {
  const h = headers(session);
  const clientId = await creerClientPartner(request, session, s);

  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: h,
    data: {
      objet: `SEKTOR-150 arbre profond ${s}`,
      chargeEtudeUserId: await chargeEtudeUserId(request, session),
      clientNom: `Client SEKTOR-150 ${s}`,
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const dossierId = ((await created.json()) as { id: string }).id;

  const dpgfId = await ouvrirBordereau(request, session, dossierId);

  const noeudIdByCode: Record<string, string> = {};
  for (const n of ARBRE_NOMINAL) {
    noeudIdByCode[n.code] = await ajouterNoeud(request, session, dpgfId, {
      type: n.type,
      parentId: n.parent ? noeudIdByCode[n.parent] : undefined,
      code: n.code,
      libelle: n.libelle,
      ...(n.type === 'ARTICLE'
        ? {
            unite: n.unite,
            quantite: n.quantite,
            origineCout: 'FORFAIT',
            coutUnitaire: n.coutUnitaire,
            fraisGenerauxPercent: 10,
            margePercent: 17.5,
          }
        : {}),
    });
  }

  await jusquAuDevis(request, session, dossierId, clientId);
  await marquerGagne(request, session, dossierId, s);
  return { dossierId, dpgfId, clientId, noeudIdByCode };
}

/**
 * L'étude piège d'AC-12 : un poste sans lot parent identifiable.
 *
 * Le DPGF refuse un ARTICLE **sans** parent (`DpgfService.validateTypeParent`,
 * « ARTICLE nodes require a SOUS_LOT parent »). L'orphelin se fabrique donc par
 * l'autre porte que la validation laisse ouverte : un ARTICLE dont le parent est
 * un autre ARTICLE. Côté conversion c'est le même cas — `parentCode` ne désigne
 * aucun LOT ni SOUS_LOT, donc `placerPostesOrphelins` le nomme.
 */
async function seedEtudeGagneePosteOrphelin(
  request: APIRequestContext,
  session: CursorSession,
  s: string,
): Promise<EtudeGagnee & { orphelinNoeudId: string; orphelinCode: string }> {
  const h = headers(session);
  const clientId = await creerClientPartner(request, session, s);

  const created = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
    headers: h,
    data: {
      objet: `SEKTOR-150 poste orphelin ${s}`,
      chargeEtudeUserId: await chargeEtudeUserId(request, session),
      clientNom: `Client SEKTOR-150 ${s}`,
    },
  });
  expect(created.status(), await created.text()).toBe(201);
  const dossierId = ((await created.json()) as { id: string }).id;

  const dpgfId = await ouvrirBordereau(request, session, dossierId);
  const noeudIdByCode: Record<string, string> = {};

  noeudIdByCode['1'] = await ajouterNoeud(request, session, dpgfId, {
    type: 'LOT',
    code: '1',
    libelle: 'Terrassements',
  });
  noeudIdByCode['1.1'] = await ajouterNoeud(request, session, dpgfId, {
    type: 'ARTICLE',
    parentId: noeudIdByCode['1'],
    code: '1.1',
    libelle: 'Décapage terre végétale',
    unite: 'm2',
    quantite: 1250,
    origineCout: 'FORFAIT',
    coutUnitaire: 13,
    fraisGenerauxPercent: 10,
    margePercent: 17.5,
  });

  const orphelinCode = '9.9';
  const orphelinNoeudId = await ajouterNoeud(request, session, dpgfId, {
    // Parent = un ARTICLE : aucun LOT ni SOUS_LOT ne porte ce code côté conversion.
    type: 'ARTICLE',
    parentId: noeudIdByCode['1.1'],
    code: orphelinCode,
    libelle: 'Poste sans lot parent',
    unite: 'u',
    quantite: 3,
    origineCout: 'FORFAIT',
    coutUnitaire: 4500,
    fraisGenerauxPercent: 10,
    margePercent: 17.5,
  });
  noeudIdByCode[orphelinCode] = orphelinNoeudId;

  await jusquAuDevis(request, session, dossierId, clientId);
  await marquerGagne(request, session, dossierId, s);
  return { dossierId, dpgfId, clientId, noeudIdByCode, orphelinNoeudId, orphelinCode };
}

// ── Lectures ──────────────────────────────────────────────────────────────────

async function lireLots(
  request: APIRequestContext,
  session: CursorSession,
  chantierId: string,
): Promise<LotChantier[]> {
  const res = await request.get(`${API_BASE}/api/v1/chantiers/${chantierId}/lots`, {
    headers: headers(session),
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as LotChantier[];
}

async function lirePostes(
  request: APIRequestContext,
  session: CursorSession,
  lotId: string,
): Promise<PosteBudgetaire[]> {
  const res = await request.get(`${API_BASE}/api/v1/lots/${lotId}/postes-budgetaires`, {
    headers: headers(session),
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as PosteBudgetaire[];
}

async function tousLesPostes(
  request: APIRequestContext,
  session: CursorSession,
  lots: LotChantier[],
): Promise<PosteBudgetaire[]> {
  const out: PosteBudgetaire[] = [];
  for (const lot of lots) out.push(...(await lirePostes(request, session, lot.id)));
  return out;
}

async function convertir(
  request: APIRequestContext,
  session: CursorSession,
  dossierId: string,
  data: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await request.post(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/convertir`, {
    headers: headers(session),
    data,
  });
  let body: Record<string, unknown> = {};
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    body = { _text: await res.text().catch(() => '') };
  }
  return { status: res.status(), body };
}

const CONVERSION_MINIMALE = {
  dateDemarrage: '2026-09-01',
  dureeMois: 8,
  // AC-13 — aucune zone, aucune activité, aucune quotité. La conversion doit aboutir sans.
};

// ══════════════════════════════════════════════════════════════════════════════

test.describe('SEKTOR-150 — arbre vendu / interne et conversion depuis GAGNE', () => {
  test.describe.configure({ mode: 'serial', timeout: 180_000 });

  // ── AC-7, AC-8, AC-13 ───────────────────────────────────────────────────────
  test('chantier-conversion-gagne-en-preparation', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();

    // AC-7 — une étude non gagnée refuse la conversion, avec un message métier.
    const nonGagnee = await request.post(`${API_BASE}/api/v1/etudes/dossiers`, {
      headers: headers(session),
      data: {
        objet: `SEKTOR-150 non gagnée ${s}`,
        chargeEtudeUserId: await chargeEtudeUserId(request, session),
        clientNom: `Client SEKTOR-150 ${s}`,
      },
    });
    expect(nonGagnee.status(), await nonGagnee.text()).toBe(201);
    const nonGagneeId = ((await nonGagnee.json()) as { id: string }).id;
    const dpgfNonGagnee = await ouvrirBordereau(request, session, nonGagneeId);
    const lotNg = await ajouterNoeud(request, session, dpgfNonGagnee, {
      type: 'LOT',
      code: '1',
      libelle: 'Terrassements',
    });
    await ajouterNoeud(request, session, dpgfNonGagnee, {
      type: 'ARTICLE',
      parentId: lotNg,
      code: '1.1',
      libelle: 'Décapage',
      unite: 'm2',
      quantite: 100,
      origineCout: 'FORFAIT',
      coutUnitaire: 13,
      fraisGenerauxPercent: 10,
      margePercent: 17.5,
    });
    const clientNg = await creerClientPartner(request, session, `${s}b`);
    await jusquAuDevis(request, session, nonGagneeId, clientNg);
    // Le dossier est DEVIS_GENERE : jamais passé par `gagne`.

    const refus = await convertir(request, session, nonGagneeId, {
      chantierCode: `CH-150-NG-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(refus.status).toBe(409);
    expect(refus.body['code']).toBe('etudes.dossier.convertir_hors_etat');

    // Rien n'a été créé côté chantier.
    const dossierNg = await request.get(
      `${API_BASE}/api/v1/etudes/dossiers/${nonGagneeId}`,
      { headers: headers(session) },
    );
    expect(((await dossierNg.json()) as { chantierGenereId?: string }).chantierGenereId).toBeFalsy();

    // AC-8 + AC-13 — l'étude gagnée se convertit ; code, date et durée suffisent.
    const etude = await seedEtudeGagneeArbreProfond(request, session, s);
    const ok = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    const chantierId = ok.body['chantierId'] as string;
    expect(chantierId).toBeTruthy();
    expect(ok.body['status']).toBe('CONVERTIE');

    const chantier = await request.get(`${API_BASE}/api/v1/chantiers/${chantierId}`, {
      headers: headers(session),
    });
    expect(chantier.ok(), await chantier.text()).toBeTruthy();
    const fiche = (await chantier.json()) as { status: string; code: string; dureeMois: number };
    // AC-8 — le chantier naît en préparation. Jamais EN_COURS : le démarrage est l'ordre de service.
    expect(fiche.status).toBe('EN_PREPARATION');
    expect(fiche.status).not.toBe('EN_COURS');
    // AC-13 — les trois champs demandés sont bien portés, et rien de planning n'a été exigé.
    expect(fiche.code).toBe(`CH-150-${s}`);
    expect(fiche.dureeMois).toBe(8);
  });

  // ── AC-10 ───────────────────────────────────────────────────────────────────
  test('chantier-conversion-sans-marche', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();

    const etude = await seedEtudeGagneeArbreProfond(request, session, s);
    const ok = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-M-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    const chantierId = ok.body['chantierId'] as string;

    // AC-10 — aucun ContratMarche n'existe après conversion.
    const contrats = await request.get(
      `${API_BASE}/api/v1/marches/contrats?chantierId=${encodeURIComponent(chantierId)}`,
      { headers: headers(session) },
    );
    expect(contrats.ok(), await contrats.text()).toBeTruthy();
    expect((await contrats.json()) as unknown[]).toHaveLength(0);

    // Le résultat de conversion ne rend plus d'identifiant de marché.
    expect(ok.body['marcheId']).toBeUndefined();

    // Le dossier ne mémorise aucun marché : le champ attend la notification.
    const dossier = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${etude.dossierId}`, {
      headers: headers(session),
    });
    expect(((await dossier.json()) as { marcheGenereId?: string }).marcheGenereId).toBeFalsy();

    // « Rien ne se dégrade » : la fiche, l'arbre et le pilotage restent lisibles sans marché.
    for (const path of [
      `/api/v1/chantiers/${chantierId}`,
      `/api/v1/chantiers/${chantierId}/lots`,
      `/api/v1/chantiers/${chantierId}/summary`,
    ]) {
      const res = await request.get(`${API_BASE}${path}`, { headers: headers(session) });
      expect(res.ok(), `${path} → ${res.status()} ${await res.text()}`).toBeTruthy();
    }
  });

  // ── AC-11, AC-1, AC-2 ───────────────────────────────────────────────────────
  test('chantier-conversion-copie-fidele', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();

    const etude = await seedEtudeGagneeArbreProfond(request, session, s);
    const ok = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-C-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    const chantierId = ok.body['chantierId'] as string;

    const lots = await lireLots(request, session, chantierId);
    const postes = await tousLesPostes(request, session, lots);

    const lotsDevis = ARBRE_NOMINAL.filter((n) => n.type !== 'ARTICLE');
    const postesDevis = ARBRE_NOMINAL.filter((n) => n.type === 'ARTICLE');

    // AC-11 — exactement une ligne par nœud du devis : aucun perdu, aucun dupliqué.
    expect(lots).toHaveLength(lotsDevis.length);
    expect(postes).toHaveLength(postesDevis.length);
    expect(new Set(lots.map((l) => l.code)).size).toBe(lots.length);
    expect(new Set(postes.map((p) => p.code)).size).toBe(postes.length);

    // AC-11 — même hiérarchie, y compris la profondeur (le sous-lot 1.A sous le lot 1).
    const lotByCode = new Map(lots.map((l) => [l.code, l]));
    const idToCode = new Map(lots.map((l) => [l.id, l.code]));
    for (const n of lotsDevis) {
      const lot = lotByCode.get(n.code);
      expect(lot, `lot ${n.code} absent de l'arbre du chantier`).toBeTruthy();
      expect(lot!.designation).toBe(n.libelle);
      const parentCode = lot!.parentLotId ? idToCode.get(lot!.parentLotId) : null;
      expect(parentCode ?? null).toBe(n.parent);
    }
    const posteByCode = new Map(postes.map((p) => [p.code, p]));
    for (const n of postesDevis) {
      const poste = posteByCode.get(n.code);
      expect(poste, `poste ${n.code} absent de l'arbre du chantier`).toBeTruthy();
      // AC-11 — même désignation, même unité, même quantité.
      expect(poste!.designation).toBe(n.libelle);
      expect(poste!.unite).toBe(n.unite);
      expect(Number(poste!.quantite)).toBe(n.quantite);
      // AC-11 — même parent : le poste 1.A.1 est bien sous le sous-lot, pas remonté au lot.
      expect(idToCode.get(poste!.lotId)).toBe(n.parent);
      // AC-11 — un prix unitaire de vente est porté, et il est propre à la ligne.
      expect(Number(poste!.prixUnitaireHt)).toBeGreaterThan(0);
    }
    // Les prix unitaires du devis étaient tous distincts : la copie ne les a pas mélangés.
    const pus = postes.map((p) => Number(p.prixUnitaireHt));
    expect(new Set(pus).size).toBe(pus.length);

    // AC-11 — même ordre : la copie respecte l'ordre du bordereau.
    const ordrePostes = [...postes].sort((a, b) => a.ordre - b.ordre).map((p) => p.code);
    expect(ordrePostes).toEqual(
      [...postesDevis].map((n) => n.code).filter((c) => ordrePostes.includes(c)),
    );

    // AC-1 — chaque ligne porte une nature, rendue par l'API de lecture de l'arbre.
    for (const ligne of [...lots, ...postes]) {
      expect(['VENDU', 'INTERNE']).toContain(ligne.nature);
    }
    // Tout vient du devis : tout est vendu.
    expect(lots.every((l) => l.nature === 'VENDU')).toBeTruthy();
    expect(postes.every((p) => p.nature === 'VENDU')).toBeTruthy();

    // AC-2 — chaque ligne vendue porte l'id du nœud DPGF dont elle est copiée…
    for (const n of [...lotsDevis, ...postesDevis]) {
      const ligne = lotByCode.get(n.code) ?? posteByCode.get(n.code);
      expect(ligne!.dpgfNoeudId).toBe(etude.noeudIdByCode[n.code]);
    }
    // …et depuis n'importe quelle ligne vendue on remonte au poste du devis.
    const unPoste = posteByCode.get('1.A.1')!;
    const origine = await request.get(
      `${API_BASE}/api/v1/etudes/dpgf/noeuds/${unPoste.dpgfNoeudId}/origine`,
      { headers: headers(session) },
    );
    expect(origine.ok(), await origine.text()).toBeTruthy();
    const remontee = (await origine.json()) as {
      posteId: string;
      code: string;
      dpgfId: string;
      dossierId: string;
    };
    expect(remontee.code).toBe('1.A.1');
    expect(remontee.dpgfId).toBe(etude.dpgfId);
    expect(remontee.dossierId).toBe(etude.dossierId);
  });

  // ── AC-9 ────────────────────────────────────────────────────────────────────
  test('chantier-conversion-double-refusee', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();

    // Nom de scénario gelé par le contrat. Comportement gelé par l'amendement du
    // 23/08/2026 : le rejeu **renvoie le chantier déjà créé** — un seul comportement.
    const etude = await seedEtudeGagneeArbreProfond(request, session, s);
    const premier = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-D-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(premier.status, JSON.stringify(premier.body)).toBe(200);
    const chantierId = premier.body['chantierId'] as string;

    // AC-9 — l'étude est CONVERTIE, état terminal.
    const dossier = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${etude.dossierId}`, {
      headers: headers(session),
    });
    expect(((await dossier.json()) as { status: string }).status).toBe('CONVERTIE');

    // AC-9 — le rejeu renvoie le même chantier, avec un code différent qui est ignoré.
    const rejeu = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-D-${s}-BIS`,
      ...CONVERSION_MINIMALE,
    });
    expect(rejeu.status, JSON.stringify(rejeu.body)).toBe(200);
    expect(rejeu.body['chantierId']).toBe(chantierId);
    expect(rejeu.body['status']).toBe('CONVERTIE');

    // AC-9 — deux appels concurrents ne produisent pas deux chantiers.
    const [a, b] = await Promise.all([
      convertir(request, session, etude.dossierId, {
        chantierCode: `CH-150-D-${s}-P1`,
        ...CONVERSION_MINIMALE,
      }),
      convertir(request, session, etude.dossierId, {
        chantierCode: `CH-150-D-${s}-P2`,
        ...CONVERSION_MINIMALE,
      }),
    ]);
    expect(a.body['chantierId']).toBe(chantierId);
    expect(b.body['chantierId']).toBe(chantierId);

    // Aucun second chantier n'existe : un seul chantier porte ce code de départ.
    const liste = await request.get(
      `${API_BASE}/api/v1/chantiers?search=${encodeURIComponent(`CH-150-D-${s}`)}`,
      { headers: headers(session) },
    );
    expect(liste.ok(), await liste.text()).toBeTruthy();
    const ids = ((await liste.json()) as { id: string }[]).map((c) => c.id);
    expect(ids).toEqual([chantierId]);
  });

  // ── AC-12 (placement) ───────────────────────────────────────────────────────
  test('chantier-conversion-poste-orphelin-place-par-l-humain', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();

    const etude = await seedEtudeGagneePosteOrphelin(request, session, s);

    // AC-12 — premier appel : la conversion s'arrête AVANT de rien créer et NOMME le poste.
    const arret = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-O-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(arret.status, JSON.stringify(arret.body)).toBe(422);
    expect(arret.body['code']).toBe('etudes.dossier.postes_orphelins');
    const nommes = arret.body['postesOrphelins'] as { posteId: string; code: string; designation: string }[];
    expect(nommes).toHaveLength(1);
    expect(nommes[0].posteId).toBe(etude.orphelinNoeudId);
    expect(nommes[0].code).toBe(etude.orphelinCode);
    expect(nommes[0].designation).toBe('Poste sans lot parent');
    // L'écran reçoit aussi les destinations possibles — il n'a pas à recharger le DPGF.
    const dispo = arret.body['lotsDisponibles'] as { code: string; designation: string }[];
    expect(dispo.map((l) => l.code)).toContain('1');

    // Rien n'a été créé : ni chantier, ni arbre, ni budget. L'étude reste GAGNE.
    const avant = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${etude.dossierId}`, {
      headers: headers(session),
    });
    const dossierAvant = (await avant.json()) as { status: string; chantierGenereId?: string };
    expect(dossierAvant.status).toBe('GAGNE');
    expect(dossierAvant.chantierGenereId).toBeFalsy();

    // AC-12 — l'humain place le poste, nommément, dans un lot d'accueil qu'il crée.
    const place = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-O-${s}`,
      ...CONVERSION_MINIMALE,
      placementsPostesOrphelins: [
        {
          posteId: etude.orphelinNoeudId,
          nouveauLotCode: '9',
          nouveauLotDesignation: 'Divers — lot d’accueil',
        },
      ],
    });
    expect(place.status, JSON.stringify(place.body)).toBe(200);
    const chantierId = place.body['chantierId'] as string;

    const lots = await lireLots(request, session, chantierId);
    const accueil = lots.find((l) => l.code === '9');
    expect(accueil, 'le lot d’accueil demandé par l’humain n’existe pas').toBeTruthy();
    // Le lot d'accueil ne vient pas du devis : il est INTERNE (AC-3), sans origine, sans prix.
    expect(accueil!.nature).toBe('INTERNE');
    expect(accueil!.dpgfNoeudId).toBeFalsy();
    expect(accueil!.prixUnitaireHt).toBeFalsy();

    // Le poste orphelin y est logé, et il reste VENDU : il vient bien du devis.
    const postesAccueil = await lirePostes(request, session, accueil!.id);
    expect(postesAccueil.map((p) => p.code)).toContain(etude.orphelinCode);
    const orphelinCopie = postesAccueil.find((p) => p.code === etude.orphelinCode)!;
    expect(orphelinCopie.nature).toBe('VENDU');
    expect(orphelinCopie.dpgfNoeudId).toBe(etude.orphelinNoeudId);

    // Aucun « Lot principal » n'a été forgé : le rattrapage a disparu.
    expect(lots.map((l) => l.designation)).not.toContain('Lot principal');
  });

  // ── AC-12 (abandon) ─────────────────────────────────────────────────────────
  test('chantier-conversion-poste-orphelin-abandon', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();

    const etude = await seedEtudeGagneePosteOrphelin(request, session, s);

    const arret = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-A-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(arret.status).toBe(422);

    // AC-12 — l'humain refuse : il ne rappelle simplement pas. Rien n'existe.
    const dossier = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${etude.dossierId}`, {
      headers: headers(session),
    });
    const apres = (await dossier.json()) as { status: string; chantierGenereId?: string };
    expect(apres.status).toBe('GAGNE');
    expect(apres.chantierGenereId).toBeFalsy();

    // Aucun chantier ne porte le code demandé — ni arbre, ni budget derrière.
    const liste = await request.get(
      `${API_BASE}/api/v1/chantiers?search=${encodeURIComponent(`CH-150-A-${s}`)}`,
      { headers: headers(session) },
    );
    expect(liste.ok(), await liste.text()).toBeTruthy();
    expect((await liste.json()) as unknown[]).toHaveLength(0);

    // Et l'étude reste convertible : le placement est toujours la sortie disponible.
    const reprise = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-A-${s}-REPRISE`,
      ...CONVERSION_MINIMALE,
      placementsPostesOrphelins: [{ posteId: etude.orphelinNoeudId, lotCode: '1' }],
    });
    expect(reprise.status, JSON.stringify(reprise.body)).toBe(200);
  });

  // ── AC-3, AC-4 ──────────────────────────────────────────────────────────────
  test('chantier-arbre-saisie-donne-interne', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();
    const h = headers(session);

    const clientId = await creerClientPartner(request, session, s);
    const cree = await request.post(`${API_BASE}/api/v1/chantiers`, {
      headers: h,
      data: { code: `CH-150-S-${s}`, label: `Saisie SEKTOR-150 ${s}`, clientId },
    });
    expect(cree.status(), await cree.text()).toBe(201);
    const chantierId = ((await cree.json()) as { id: string }).id;

    // AC-3 — une création par saisie produit une ligne INTERNE, sans origine.
    const lot = await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/lots`, {
      headers: h,
      data: { code: 'I1', designation: 'Installation de chantier' },
    });
    expect(lot.status(), await lot.text()).toBe(201);
    const lotCree = (await lot.json()) as LotChantier;
    expect(lotCree.nature).toBe('INTERNE');
    expect(lotCree.dpgfNoeudId).toBeFalsy();

    // AC-3 — une demande explicite de vendu est REFUSÉE, pas silencieusement convertie.
    const venduDemande = await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/lots`, {
      headers: h,
      data: { code: 'V1', designation: 'Faux vendu', nature: 'VENDU' },
    });
    expect(venduDemande.ok()).toBeFalsy();
    expect(await venduDemande.text()).toContain('chantiers.arbre.vendu_par_saisie_refuse');
    // Et la ligne n'existe pas : le refus n'a rien créé sous une autre nature.
    expect((await lireLots(request, session, chantierId)).map((l) => l.code)).not.toContain('V1');

    // AC-4 — un montant vendu posé sur une ligne interne est refusé.
    const avecPrix = await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/lots`, {
      headers: h,
      data: { code: 'I2', designation: 'Base vie', quantite: 4, prixUnitaireHt: 12500 },
    });
    expect(avecPrix.ok()).toBeFalsy();
    expect(await avecPrix.text()).toContain('chantiers.arbre.interne_sans_prix_de_vente');

    // AC-4 — l'interne porte de la quantité, pas de prix de vente.
    const posteInterne = await request.post(
      `${API_BASE}/api/v1/lots/${lotCree.id}/postes-budgetaires`,
      { headers: h, data: { code: '01', designation: 'Repli', unite: 'f', quantite: 1 } },
    );
    expect(posteInterne.status(), await posteInterne.text()).toBe(201);
    const posteCree = (await posteInterne.json()) as PosteBudgetaire;
    expect(posteCree.nature).toBe('INTERNE');
    expect(Number(posteCree.quantite)).toBe(1);
    expect(posteCree.prixUnitaireHt).toBeFalsy();

    // AC-4 — l'édition non plus ne peut pas poser un prix de vente sur un interne.
    const majPrix = await request.put(
      `${API_BASE}/api/v1/chantiers/${chantierId}/lots/${lotCree.id}`,
      { headers: h, data: { prixUnitaireHt: 999 } },
    );
    expect(majPrix.ok()).toBeFalsy();
    expect(await majPrix.text()).toContain('chantiers.arbre.interne_sans_prix_de_vente');

    // AC-3 — même par l'import d'arbre, aucune ligne vendue ne naît de la saisie.
    const arbre = await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/lots/tree`, {
      headers: h,
      data: {
        lots: [
          {
            designation: 'Aléas',
            postes: [{ designation: 'Provision', unite: 'f', quantite: 1 }],
          },
        ],
      },
    });
    expect(arbre.status(), await arbre.text()).toBe(201);
    const importes = (await arbre.json()) as { lots: { nature: string; postes: { nature: string }[] }[] };
    expect(importes.lots.every((l) => l.nature === 'INTERNE')).toBeTruthy();
    expect(importes.lots.flatMap((l) => l.postes).every((p) => p.nature === 'INTERNE')).toBeTruthy();
  });

  // ── AC-5 ────────────────────────────────────────────────────────────────────
  test('chantier-arbre-interne-hors-situation', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();
    const h = headers(session);

    // Un chantier issu d'une conversion : des lignes vendues…
    const etude = await seedEtudeGagneeArbreProfond(request, session, s);
    const ok = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-SIT-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    const chantierId = ok.body['chantierId'] as string;

    // …plus une ligne interne ajoutée au chantier.
    const interne = await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/lots`, {
      headers: h,
      data: { code: 'INT', designation: 'Installation et repli', quantite: 1 },
    });
    expect(interne.status(), await interne.text()).toBe(201);
    const lotInterne = (await interne.json()) as LotChantier;
    expect(lotInterne.nature).toBe('INTERNE');

    // Le chantier doit être démarré pour qu'une situation ait un sens.
    await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/demarrer`, { headers: h });

    const situation = await request.post(
      `${API_BASE}/api/v1/chantiers/${chantierId}/situations/generate?numero=1`,
      { headers: h },
    );
    expect(situation.status(), await situation.text()).toBe(201);
    const generee = (await situation.json()) as {
      lignes?: { lotId?: string; lotCode?: string; designation?: string }[];
      cumulCourantHt?: string | number;
      nbLignes?: number;
    };

    // AC-5 — la ligne interne n'apparaît pas dans les lignes de la situation…
    const lignes = generee.lignes ?? [];
    expect(lignes.length).toBeGreaterThan(0);
    expect(lignes.map((l) => l.lotId)).not.toContain(lotInterne.id);
    expect(lignes.map((l) => l.lotCode)).not.toContain('INT');
    expect(lignes.map((l) => l.designation)).not.toContain('Installation et repli');
    expect(generee.nbLignes).toBe(lignes.length);

    // …ni dans le cumul valorisé au client : rien de l'interne n'y entre.
    // (le lot interne n'a de toute façon aucun prix de vente — AC-4)
    expect(lotInterne.montantHt).toBeFalsy();

    // AC-5 — un chantier qui n'a QUE de l'interne ne génère aucune situation.
    const clientId = await creerClientPartner(request, session, `${s}i`);
    const sansVendu = await request.post(`${API_BASE}/api/v1/chantiers`, {
      headers: h,
      data: { code: `CH-150-INT-${s}`, label: `Tout interne ${s}`, clientId },
    });
    expect(sansVendu.status(), await sansVendu.text()).toBe(201);
    const sansVenduId = ((await sansVendu.json()) as { id: string }).id;
    await request.post(`${API_BASE}/api/v1/chantiers/${sansVenduId}/lots`, {
      headers: h,
      data: { code: 'I1', designation: 'Régie', quantite: 10 },
    });
    await request.post(`${API_BASE}/api/v1/chantiers/${sansVenduId}/demarrer`, { headers: h });
    const refus = await request.post(
      `${API_BASE}/api/v1/chantiers/${sansVenduId}/situations/generate?numero=1`,
      { headers: h },
    );
    expect(refus.ok()).toBeFalsy();
    expect(await refus.text()).toContain('chantiers.situation.aucune_ligne_vendue');
  });

  // ── AC-6 ────────────────────────────────────────────────────────────────────
  test('chantier-arbre-edition-libre', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();
    const h = headers(session);

    const etude = await seedEtudeGagneeArbreProfond(request, session, s);
    const ok = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-E-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    const chantierId = ok.body['chantierId'] as string;

    const avant = await lireLots(request, session, chantierId);
    const lot1 = avant.find((l) => l.code === '1')!;
    const lot2 = avant.find((l) => l.code === '2')!;

    // AC-6 — ajout d'une ligne interne.
    const ajout = await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/lots`, {
      headers: h,
      data: { code: 'INS', designation: 'Installation de chantier', quantite: 1 },
    });
    expect(ajout.status(), await ajout.text()).toBe(201);
    const interne = (await ajout.json()) as LotChantier;

    // AC-6 — subdivision : un sous-lot interne sous une ligne vendue.
    const sous = await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/lots`, {
      headers: h,
      data: { code: '2-INT', designation: 'Aléas gros œuvre', parentLotId: lot2.id },
    });
    expect(sous.status(), await sous.text()).toBe(201);

    // AC-6 — renommage et réordonnancement d'une ligne vendue.
    const renomme = await request.put(
      `${API_BASE}/api/v1/chantiers/${chantierId}/lots/${lot1.id}`,
      { headers: h, data: { designation: 'Terrassements — révisé', ordre: 42 } },
    );
    expect(renomme.ok(), await renomme.text()).toBeTruthy();
    const apresRenommage = (await renomme.json()) as LotChantier;
    expect(apresRenommage.designation).toBe('Terrassements — révisé');
    expect(apresRenommage.ordre).toBe(42);
    // AC-2 / AC-6 — l'édition n'a pas cassé le lien retour, ni changé la nature.
    expect(apresRenommage.nature).toBe('VENDU');
    expect(apresRenommage.dpgfNoeudId).toBe(etude.noeudIdByCode['1']);

    // AC-6 — suppression d'une ligne interne.
    const suppr = await request.delete(
      `${API_BASE}/api/v1/chantiers/${chantierId}/lots/${interne.id}`,
      { headers: h },
    );
    expect(suppr.status()).toBe(204);

    // AC-6 — aucune de ces éditions n'a touché l'étude ni le devis d'origine.
    const arbreDevis = await request.get(`${API_BASE}/api/v1/etudes/dpgf/${etude.dpgfId}/arbre`, {
      headers: h,
    });
    expect(arbreDevis.ok(), await arbreDevis.text()).toBeTruthy();
    const libellesDevis = JSON.stringify(await arbreDevis.json());
    expect(libellesDevis).toContain('Terrassements');
    expect(libellesDevis).not.toContain('Terrassements — révisé');
    expect(libellesDevis).not.toContain('Installation de chantier');
    expect(libellesDevis).not.toContain('Aléas gros œuvre');

    const dossier = await request.get(`${API_BASE}/api/v1/etudes/dossiers/${etude.dossierId}`, {
      headers: h,
    });
    expect(((await dossier.json()) as { status: string }).status).toBe('CONVERTIE');

    // AC-6 — le lien retour des lignes vendues restantes tient toujours.
    const apres = await lireLots(request, session, chantierId);
    for (const l of apres.filter((x) => x.nature === 'VENDU')) {
      expect(l.dpgfNoeudId).toBe(etude.noeudIdByCode[l.code]);
    }
  });

  // ── AC-14 ───────────────────────────────────────────────────────────────────
  test('chantier-sans-etude-tout-interne', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();
    const h = headers(session);

    // AC-14 — la porte de service : gré à gré, régie, petits travaux.
    const clientId = await creerClientPartner(request, session, s);
    const cree = await request.post(`${API_BASE}/api/v1/chantiers`, {
      headers: h,
      data: {
        code: `CH-150-REG-${s}`,
        label: `Régie SEKTOR-150 ${s}`,
        clientId,
        dateDemarrage: '2026-09-01',
        dureeMois: 2,
      },
    });
    expect(cree.status(), await cree.text()).toBe(201);
    const chantierId = ((await cree.json()) as { id: string }).id;

    // Arbre saisi à la main.
    const lot = await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/lots`, {
      headers: h,
      data: { code: 'R1', designation: 'Travaux en régie', quantite: 1 },
    });
    expect(lot.status(), await lot.text()).toBe(201);
    const lotId = ((await lot.json()) as { id: string }).id;
    const poste = await request.post(`${API_BASE}/api/v1/lots/${lotId}/postes-budgetaires`, {
      headers: h,
      data: { code: '01', designation: 'Main d’œuvre', unite: 'h', quantite: 120 },
    });
    expect(poste.status(), await poste.text()).toBe(201);

    // AC-14 — toutes les lignes sont INTERNE, aucun lien retour.
    const lots = await lireLots(request, session, chantierId);
    const postes = await tousLesPostes(request, session, lots);
    expect(lots.length).toBeGreaterThan(0);
    for (const l of [...lots, ...postes]) {
      expect(l.nature).toBe('INTERNE');
      expect(l.dpgfNoeudId).toBeFalsy();
    }

    // AC-14 — aucune situation de travaux tant qu'aucun devis ne vend ces lignes.
    await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/demarrer`, { headers: h });
    const situation = await request.post(
      `${API_BASE}/api/v1/chantiers/${chantierId}/situations/generate?numero=1`,
      { headers: h },
    );
    expect(situation.ok()).toBeFalsy();
    expect(await situation.text()).toContain('chantiers.situation.aucune_ligne_vendue');

    // AC-14 — le chantier est utilisable : arbre, coût, journal, documents.
    for (const path of [
      `/api/v1/chantiers/${chantierId}/lots`,
      `/api/v1/chantiers/${chantierId}/budget`,
      `/api/v1/chantiers/${chantierId}/journal`,
      `/api/v1/chantiers/${chantierId}/documents`,
    ]) {
      const res = await request.get(`${API_BASE}${path}`, { headers: h });
      expect(res.ok(), `${path} → ${res.status()} ${await res.text()}`).toBeTruthy();
    }
    const journal = await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/journal`, {
      headers: h,
      data: {
        date: '2026-09-02',
        auteur: 'QA SEKTOR-150',
        contenu: 'Ouverture du chantier en régie.',
      },
    });
    expect(journal.ok(), await journal.text()).toBeTruthy();
  });

  // ── AC-15, AC-16 ────────────────────────────────────────────────────────────
  test('chantier-un-seul-ecran-detail', async ({ page, request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();

    const etude = await seedEtudeGagneeArbreProfond(request, session, s);
    const ok = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-150-UI-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    const chantierId = ok.body['chantierId'] as string;

    // AC-16 — la ligne vendue se distingue de l'interne d'un coup d'œil.
    // Une ligne interne est ajoutée pour que les deux natures cohabitent à l'écran.
    await request.post(`${API_BASE}/api/v1/chantiers/${chantierId}/lots`, {
      headers: headers(session),
      data: { code: 'INS', designation: 'Installation de chantier', quantite: 1 },
    });

    // AC-15 — la fiche chantier reste atteignable depuis la liste des chantiers.
    await page.goto('/chantiers', { waitUntil: 'domcontentloaded' });
    await page.getByText(`CH-150-UI-${s}`).first().click();
    await page.waitForURL(/\/chantiers\/[^/]+/, { timeout: 30000 });
    await expect(page.getByText('Chantier introuvable')).toHaveCount(0);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 20000 });

    // AC-15 — le placeholder est mort : son URL ne rend plus de page de planning.
    // (`web/app/chantiers/detail/` supprimé, aucune route n'y mène)
    expect(page.url()).toContain(chantierId);

    // AC-16 — l'onglet arbre porte une colonne Nature, et le vocabulaire est
    // « vendu » / « interne » — jamais du jargon ERP.
    const ongletLots = page.getByRole('tab', { name: /lots|arbre/i }).first();
    if (await ongletLots.isVisible().catch(() => false)) await ongletLots.click();
    await expect(page.getByText(/^Nature$/).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/^Vendu$/).first()).toBeVisible();
    await expect(page.getByText(/^Interne$/).first()).toBeVisible();
    // Pas de jargon : ni VENDU/INTERNE bruts, ni la clé i18n non résolue.
    await expect(page.getByText('chantiers.chantier.detail.lots.natureVendu')).toHaveCount(0);

    // AC-16 / AC-2 — une ligne vendue offre l'accès au poste du devis d'origine.
    const versOrigine = page
      .getByRole('button', { name: /poste du devis d.origine/i })
      .first();
    await expect(versOrigine).toBeVisible({ timeout: 20000 });
    await versOrigine.click();
    await page.waitForURL(new RegExp(`/etudes/dossiers/${etude.dossierId}`), { timeout: 30000 });
    expect(page.url()).toContain('poste=');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SEKTOR-173 — AC-12 étendu : un sous-lot ne remonte jamais à la racine en silence
// ══════════════════════════════════════════════════════════════════════════════

test.describe('SEKTOR-173 — sous-lot et ordre du bordereau', () => {
  /**
   * Le sous-lot est affiché **avant** son lot parent (`ordre` plus petit) — ce que
   * produit une renumérotation manuelle du bordereau, ou une extraction IA qui suit
   * la mise en page du PDF plutôt que la hiérarchie.
   *
   * Sa donnée est parfaitement valide : `validateTypeParent` exige un parent pour
   * tout `SOUS_LOT`. C'est la conversion qui, en un seul passage, ne le trouvait pas
   * encore et créait le sous-lot à la racine, **sans rien dire**.
   */
  test('chantier-conversion-sous-lot-avant-son-parent', async ({ request }) => {
    const session = await cursorSession(request);
    test.skip(!session, 'cursor-session indisponible — backend Mode B non déployé');
    if (!session) return;
    const s = suffix();

    const etude = await seedEtudeGagneeArbreProfond(request, session, s);

    // On inverse l'ordre d'affichage : le sous-lot passe devant son lot.
    const majOrdre = async (code: string, ordre: number) => {
      const res = await request.put(
        `${API_BASE}/api/v1/etudes/dpgf-noeuds/${etude.noeudIdByCode[code]}`,
        { headers: headers(session), data: { ordre } },
      );
      expect(res.ok(), await res.text()).toBeTruthy();
    };
    await majOrdre('1.A', 0); // le sous-lot d'abord…
    await majOrdre('1', 1); // …son lot parent ensuite

    const ok = await convertir(request, session, etude.dossierId, {
      chantierCode: `CH-173-${s}`,
      ...CONVERSION_MINIMALE,
    });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    const chantierId = ok.body['chantierId'] as string;

    const lots = await lireLots(request, session, chantierId);
    const lot1 = lots.find((l) => l.code === '1');
    const sousLot = lots.find((l) => l.code === '1.A');
    expect(lot1, 'le lot 1 doit exister').toBeTruthy();
    expect(sousLot, 'le sous-lot 1.A doit exister').toBeTruthy();

    // Le cœur du bug : le sous-lot garde son parent malgré l'ordre inversé.
    expect(sousLot!.parentLotId).toBe(lot1!.id);

    // Et il n'est donc pas devenu une racine.
    const racines = lots.filter((l) => !l.parentLotId).map((l) => l.code).sort();
    expect(racines).toEqual(['1', '2']);
  });
});
