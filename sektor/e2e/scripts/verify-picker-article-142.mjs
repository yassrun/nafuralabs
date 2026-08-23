/**
 * Preuve SEKTOR-142 — API recherche items serveur (picker).
 * Run: node sektor/e2e/scripts/verify-picker-article-142.mjs
 *
 * Surface dédiée GET /api/v1/items/search — ne pas casser GET /api/v1/items.
 * Baseline vu rouge : /search n'existe pas (/{id} ou 404), listing dump encore.
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

function contentOf(body) {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.content)) return body.content;
  if (body && Array.isArray(body.items)) return body.items;
  return [];
}

function totalOf(body) {
  if (body && typeof body.totalElements === 'number') return body.totalElements;
  if (body && typeof body.total === 'number') return body.total;
  return contentOf(body).length;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = await sessionRes.json();
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

  const listing = await json(await fetch(`${API_BASE}/api/v1/items?page=0&size=5`, { headers: h }));
  assert(listing.status === 200, `listing items ${listing.status} ${listing.text}`);
  const listingRows = contentOf(listing.body);
  assert(listingRows.length > 0, 'GET /api/v1/items ne doit pas se vider (listing articles)');

  const empty = await json(await fetch(`${API_BASE}/api/v1/items/search`, { headers: h }));
  assert(empty.status === 200, `search sans q ${empty.status} ${empty.text}`);
  assert(Array.isArray(empty.body?.content), `search sans q: content[] attendu, got ${JSON.stringify(empty.body)?.slice(0, 180)}`);
  assert(empty.body.content.length === 0 && empty.body.totalElements === 0, `AC-1: search sans q/filtre doit être vide, got ${empty.body.content.length}/${empty.body.totalElements}`);

  const shortQ = await json(await fetch(`${API_BASE}/api/v1/items/search?q=x`, { headers: h }));
  assert(shortQ.status === 200, `search q=x ${shortQ.status}`);
  assert(contentOf(shortQ.body).length === 0 && totalOf(shortQ.body) === 0, 'q<2 sans filtre → page vide 200');

  const suffix = Date.now().toString(36);
  const exactCode = `ART-P142-${suffix}`.slice(0, 20);
  const skuOnly = `SKU-P142-${suffix}`;

  const cats = await json(await fetch(`${API_BASE}/api/v1/item-categories?page=0&size=200`, { headers: h }));
  const catRows = contentOf(cats.body);
  const parent = catRows.find((c) => !c.parentId && catRows.some((ch) => ch.parentId === c.id));
  const child = parent ? catRows.find((c) => c.parentId === parent.id) : null;

  const uoms = await json(await fetch(`${API_BASE}/api/v1/unit-of-measures?page=0&size=20`, { headers: h }));
  const uomId = contentOf(uoms.body)[0]?.id;

  async function createItem(payload) {
    const created = await json(
      await fetch(`${API_BASE}/api/v1/items`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify(payload),
      }),
    );
    assert(created.status === 201 || created.status === 200, `POST item ${created.status} ${created.text}`);
    return created.body;
  }

  const exact = await createItem({
    code: exactCode,
    name: `Ciment picker 142 ${suffix}`,
    nature: 'MATIERE',
    isActive: true,
    sku: skuOnly,
    itemCategoryId: child?.id ?? parent?.id,
    unitOfMeasureId: uomId,
    usageLotCodes: ['GROS_OEUVRE'],
    prixUnitaire: 1180,
  });

  const mo = await createItem({
    name: `Coffreur picker 142 ${suffix}`,
    nature: 'MAIN_DOEUVRE',
    isActive: true,
    itemCategoryId: parent?.id,
    unitOfMeasureId: uomId,
    usageLotCodes: ['FINITIONS'],
  });

  const inactive = await createItem({
    name: `Inactif picker 142 ${suffix}`,
    nature: 'MATIERE',
    isActive: false,
    unitOfMeasureId: uomId,
  });

  const exactSearch = await json(
    await fetch(`${API_BASE}/api/v1/items/search?q=${encodeURIComponent(exactCode)}`, { headers: h }),
  );
  assert(exactSearch.status === 200, `search exact ${exactSearch.status} ${exactSearch.text}`);
  const exactHits = contentOf(exactSearch.body);
  assert(exactHits.length > 0, 'code exact doit matcher');
  assert(
    String(exactHits[0].code).toLowerCase() === exactCode.toLowerCase(),
    `code exact en tête, got ${exactHits[0].code}`,
  );
  assert(
    exactHits.every((r) => r.isActive !== false),
    'AC-6: hits actifs seulement par défaut',
  );
  assert(
    !exactHits.some((r) => r.id === inactive.id),
    'inactif absent du search défaut',
  );

  const skuSearch = await json(
    await fetch(`${API_BASE}/api/v1/items/search?q=${encodeURIComponent(skuOnly)}`, { headers: h }),
  );
  assert(skuSearch.status === 200, `search sku ${skuSearch.status}`);
  assert(
    !contentOf(skuSearch.body).some((r) => r.id === exact.id),
    'v1: sku hors SearchFields (code+name seulement)',
  );

  const natureHits = await json(await fetch(`${API_BASE}/api/v1/items/search?nature=MAIN_DOEUVRE`, { headers: h }));
  assert(natureHits.status === 200, `search nature ${natureHits.status} ${natureHits.text}`);
  const natureRows = contentOf(natureHits.body);
  assert(natureRows.length > 0, 'filtre nature seul déclenche la recherche');
  assert(
    natureRows.every((r) => r.nature === 'MAIN_DOEUVRE'),
    `filtre nature serveur, got ${natureRows.map((r) => r.nature).slice(0, 5)}`,
  );
  assert(
    natureRows.some((r) => r.id === mo.id),
    'item MO créé visible via nature=MAIN_DOEUVRE',
  );

  if (parent && child) {
    const fam = await json(
      await fetch(`${API_BASE}/api/v1/items/search?familleId=${parent.id}`, { headers: h }),
    );
    assert(fam.status === 200, `search famille ${fam.status} ${fam.text}`);
    const famRows = contentOf(fam.body);
    assert(
      famRows.some((r) => r.id === exact.id),
      'famille parent → enfants (item sur enfant)',
    );
  }

  const lot = await json(await fetch(`${API_BASE}/api/v1/items/search?usageLot=GROS_OEUVRE`, { headers: h }));
  assert(lot.status === 200, `search usageLot ${lot.status} ${lot.text}`);
  assert(
    contentOf(lot.body).some((r) => r.id === exact.id),
    'filtre usageLot serveur',
  );

  const page0 = await json(
    await fetch(`${API_BASE}/api/v1/items/search?nature=MATIERE&page=0&size=2`, { headers: h }),
  );
  const page1 = await json(
    await fetch(`${API_BASE}/api/v1/items/search?nature=MATIERE&page=1&size=2`, { headers: h }),
  );
  assert(page0.status === 200 && page1.status === 200, 'pagination HTTP');
  assert(totalOf(page0.body) > 2, `AC-5: total > size (got ${totalOf(page0.body)})`);
  const ids0 = contentOf(page0.body).map((r) => r.id).join(',');
  const ids1 = contentOf(page1.body).map((r) => r.id).join(',');
  assert(ids1.length > 0 && ids0 !== ids1, `AC-5: page suivante distincte (${ids0} vs ${ids1})`);

  const listingAfter = await json(await fetch(`${API_BASE}/api/v1/items?page=0&size=5`, { headers: h }));
  assert(contentOf(listingAfter.body).length > 0, 'listing générique intact après search');

  console.log(
    `PASS SEKTOR-142 — search vide=${empty.body.totalElements} exact=${exactHits[0].code} nature=${natureRows.length} pageTotal=${totalOf(page0.body)}`,
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
