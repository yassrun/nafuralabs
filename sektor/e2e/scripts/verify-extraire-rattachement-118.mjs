/**
 * Preuve SEKTOR-118 — Extraire rattache le créé, le non créé reste.
 * Run: node sektor/e2e/scripts/verify-extraire-rattachement-118.mjs
 */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

async function main() {
  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = (await sessionRes.json());
  if (!session?.accessToken || !session?.tenantId) {
    console.log('SKIP cursor-session unavailable');
    process.exit(0);
  }
  const h = {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const suffix = Date.now().toString(36);
  const createdName = `Ciment Extraire 118 ${suffix}`;
  const leftoverName = `Peinture Extraire 118 ${suffix}`;

  const countBefore = Number(await (await fetch(`${API_BASE}/api/v1/items/count`, { headers: h })).json());

  let ingenieurs = [];
  const ingRes = await fetch(`${API_BASE}/api/v1/etudes/ingenieurs`, { headers: h });
  if (ingRes.ok) ingenieurs = await ingRes.json();
  const chargeEtudeUserId = ingenieurs[0]?.userId ?? session.userId;

  const dossier = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        objet: `Extraire rattachement 118 ${suffix}`,
        chargeEtudeUserId,
        clientNom: 'MOA QA 118',
      }),
    }),
  );
  if (dossier.status !== 201) throw new Error(`dossier ${dossier.status} ${dossier.text}`);
  const dossierId = dossier.body.id;

  const bordereau = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`, {
      method: 'POST',
      headers: h,
    }),
  );
  if (!bordereau.ok) throw new Error(`bordereau ${bordereau.status} ${bordereau.text}`);
  const dpgfId = bordereau.body.dpgfId;

  const lot = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ type: 'LOT', code: '01', libelle: 'GO 118' }),
    }),
  );
  const sousLot = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        type: 'SOUS_LOT',
        parentId: lot.body.id,
        code: '01.01',
        libelle: 'Béton 118',
      }),
    }),
  );
  const article = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        type: 'ARTICLE',
        parentId: sousLot.body.id,
        code: '01.01.01',
        libelle: 'Poste Extraire 118',
        quantite: 1,
        unite: 'm2',
        origineCout: 'DECOMPOSE',
      }),
    }),
  );
  if (article.status !== 201) throw new Error(`article ${article.status} ${article.text}`);

  const dpu = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpu`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ dpgfNoeudId: article.body.id }),
    }),
  );
  if (dpu.status !== 201) throw new Error(`dpu ${dpu.status} ${dpu.text}`);
  const dpuId = dpu.body.id;

  for (const libelle of [createdName, leftoverName]) {
    const line = await json(
      await fetch(`${API_BASE}/api/v1/etudes/dpu/${dpuId}/composants`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          type: 'MATIERE',
          referenceType: 'LIBRE',
          libelle,
          rendement: 1,
          unite: 'KG',
          prixUnitaire: 10,
          sourcePrix: 'MANUEL',
        }),
      }),
    );
    if (line.status !== 201) throw new Error(`composant ${line.status} ${line.text}`);
  }

  const rattrapage = async () => {
    const r = await json(
      await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/rattrapage`, { headers: h }),
    );
    if (!r.ok) throw new Error(`rattrapage ${r.status} ${r.text}`);
    return (r.body.groupesDetail ?? []).map((g) => g.libelle);
  };

  const before = await rattrapage();
  if (!before.includes(createdName) || !before.includes(leftoverName)) {
    throw new Error(`setup rattrapage incomplet: ${JSON.stringify(before)}`);
  }

  const created = await json(
    await fetch(`${API_BASE}/api/v1/items/extraire-creer`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        designation: createdName,
        nature: 'MATIERE',
        uniteCode: 'KG',
      }),
    }),
  );
  if (created.status !== 201) throw new Error(`extraire-creer ${created.status} ${created.text}`);
  const itemId = created.body.itemId;
  if (!itemId) throw new Error('extraire-creer sans itemId');

  const stillLibre = await rattrapage();
  if (!stillLibre.includes(createdName) || !stillLibre.includes(leftoverName)) {
    throw new Error(
      `baseline extraire-creer seul devrait laisser les 2 LIBRE (vu rouge rattachement): ${JSON.stringify(stillLibre)}`,
    );
  }
  console.log('VU ROUGE extraire-creer seul — encore 2 non rattachés');

  const comps = await json(await fetch(`${API_BASE}/api/v1/etudes/dpu/${dpuId}/composants`, { headers: h }));
  const persist = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpu/${dpuId}`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({
        composants: (comps.body ?? []).map((c) => ({
          id: c.id,
          type: c.type ?? 'MATIERE',
          referenceType: c.libelle === createdName ? 'ITEM' : 'LIBRE',
          itemId: c.libelle === createdName ? itemId : null,
          libelle: c.libelle,
          rendement: c.rendement ?? 1,
          unite: c.unite ?? 'KG',
          prixUnitaire: c.prixUnitaire ?? 10,
          sourcePrix: c.libelle === createdName ? 'TARIF' : (c.sourcePrix ?? 'MANUEL'),
        })),
      }),
    }),
  );
  if (!persist.ok) throw new Error(`persist ${persist.status} ${persist.text}`);

  const after = await rattrapage();
  if (after.includes(createdName)) {
    throw new Error(`créé encore dans rattrapage: ${JSON.stringify(after)}`);
  }
  if (!after.includes(leftoverName)) {
    throw new Error(`non créé absent de rattrapage: ${JSON.stringify(after)}`);
  }

  const countAfter = Number(await (await fetch(`${API_BASE}/api/v1/items/count`, { headers: h })).json());
  if (countAfter !== countBefore + 1) {
    throw new Error(`auto-création? count ${countBefore} → ${countAfter}`);
  }

  console.log('PASS SEKTOR-118 — créé lié, non créé listé, pas d’auto-création');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
