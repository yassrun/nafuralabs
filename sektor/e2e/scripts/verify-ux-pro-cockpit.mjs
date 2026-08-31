/**
 * SEKTOR-258 — cockpit UX pro : raccourcis = routes, onglets URL, portefeuille sans N+1.
 * Run: node sektor/e2e/scripts/verify-ux-pro-cockpit.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

function here(...parts) {
  return join(dirname(fileURLToPath(import.meta.url)), ...parts);
}

function assertChrome() {
  const routes = here('../../sources/web/app/chantiers/components/pilotage-tab/cockpit-routes.ts');
  const spec = here('../../sources/web/app/chantiers/components/pilotage-tab/cockpit-routes.spec.ts');
  const tab = here('../../sources/web/app/chantiers/components/pilotage-tab/pilotage-tab.component.ts');
  const detail = here('../../sources/web/app/chantiers/chantier-detail/chantier-detail.page.ts');
  const listing = here('../../sources/web/app/chantiers/chantiers-listing/chantiers-listing.page.ts');
  const portefeuille = here('../../sources/backend/chantiers/src/main/java/ma/nafura/chantiers/service/ChantierPortefeuilleService.java');
  for (const f of [routes, spec, tab, detail, listing, portefeuille]) {
    if (!existsSync(f)) throw new Error(`VU ROUGE chrome : ${f} absent`);
  }
  const routesSrc = readFileSync(routes, 'utf8');
  if (!routesSrc.includes('resolvePreparationRoute') || !routesSrc.includes('cockpitNavShortcuts')) {
    throw new Error('VU ROUGE chrome : mapping prep/nav absent');
  }
  if (!routesSrc.includes('/chantiers/${id}?tab=equipe')) {
    throw new Error('VU ROUGE chrome : raccourci équipe sans ?tab=equipe');
  }
  const specSrc = readFileSync(spec, 'utf8');
  if (!specSrc.includes('isCockpitAppRoute') || !specSrc.includes("chantiers.cockpit.preparation.action.arbre")) {
    throw new Error('VU ROUGE chrome : spec ne refuse pas les clés i18n');
  }
  const tabSrc = readFileSync(tab, 'utf8');
  if (tabSrc.includes('ouvrirRoute(p.action)')) {
    throw new Error('VU ROUGE chrome : Gérer navigue encore vers p.action (clé i18n)');
  }
  if (!tabSrc.includes('ouvrirPreparation') || !tabSrc.includes('cockpitNavShortcuts')) {
    throw new Error('VU ROUGE chrome : cockpit sans ouvrirPreparation / nav');
  }
  const detailSrc = readFileSync(detail, 'utf8');
  if (!detailSrc.includes('queryParamMap.pipe') || !detailSrc.includes('normalizeDetailTab')) {
    throw new Error('VU ROUGE chrome : onglet actif pas dérivé de queryParamMap');
  }
  if (detailSrc.includes('workflow-actions')) {
    throw new Error('VU ROUGE chrome : doublon workflow encore sous le cockpit');
  }
  const listingSrc = readFileSync(listing, 'utf8');
  if (!listingSrc.includes('rechargement') || listingSrc.includes('@if (chargement()) {')) {
    throw new Error('VU ROUGE chrome : listing vide encore toute la table au chargement');
  }
  const java = readFileSync(portefeuille, 'utf8');
  if (!java.includes('list(q.status(), null, null, q.search(), false)')) {
    throw new Error('VU ROUGE java : portefeuille n’appelle pas list(status, search, false)');
  }
  if (!java.includes('needsFullCompose')) {
    throw new Error('VU ROUGE java : pas de fast path compose-page');
  }
}

async function session() {
  const url = `${API_BASE}/api/public/dev/cursor-session`;
  const s = await (await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } })).json();
  if (!s?.accessToken || !s?.tenantId) return null;
  return {
    Authorization: `Bearer ${s.accessToken}`,
    'X-Tenant-Id': s.tenantId,
    Accept: 'application/json',
  };
}

async function main() {
  assertChrome();
  console.log('ok chrome : raccourcis mappés, onglets URL, nav, portefeuille list(search)');

  const h = await session();
  if (!h) {
    console.log('SKIP cursor-session unavailable');
    process.exit(0);
  }

  // portefeuille-search-api (AC-10) — fabrique 2 codes distincts, cherche le sous-ensemble.
  const clientsRes = await json(await fetch(`${API_BASE}/api/v1/partners?roles=CLIENT&size=5`, { headers: h }));
  const clientList = Array.isArray(clientsRes.body)
    ? clientsRes.body
    : clientsRes.body?.content ?? clientsRes.body?.items ?? [];
  const client = clientList[0];
  if (!client?.id) throw new Error('aucun client pour fabriquer les chantiers de preuve');
  const stamp = Date.now().toString(36).toUpperCase();
  const codeA = `PF-A-${stamp}`;
  const codeB = `PF-B-${stamp}`;
  for (const code of [codeA, codeB]) {
    const created = await json(
      await fetch(`${API_BASE}/api/v1/chantiers`, {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          label: `Portefeuille preuve ${code}`,
          clientId: client.id,
          clientName: client.raisonSociale ?? client.name ?? 'QA Mode B',
          status: 'EN_PREPARATION',
          ville: 'Rabat',
          montantHt: 100000,
          dateDemarrage: '2026-09-01',
          dateFinPrevue: '2027-05-01',
        }),
      }),
    );
    if (created.status !== 201 && created.status !== 409) {
      throw new Error(`création chantier ${code} ${created.status} ${created.text?.slice(0, 180)}`);
    }
  }
  const pf = await json(
    await fetch(
      `${API_BASE}/api/v1/chantiers/portefeuille?page=0&size=20&tri=code&recherche=${encodeURIComponent(codeA)}`,
      { headers: h },
    ),
  );
  if (!pf.ok) throw new Error(`portefeuille recherche ${pf.status} ${pf.text?.slice(0, 180)}`);
  if (typeof pf.body?.total !== 'number' || !Array.isArray(pf.body?.items)) {
    throw new Error('portefeuille sans total/items');
  }
  const codes = pf.body.items.map((r) => r.code);
  if (!codes.includes(codeA) || codes.includes(codeB)) {
    throw new Error(`portefeuille-search-api : attendu ${codeA} sans ${codeB}, got ${codes.join(',')}`);
  }
  console.log(`PASS portefeuille-search-api total=${pf.body.total} hit=${codeA}`);

  // portefeuille-compose-page (AC-11) — tri=code répond sans erreur (compose page côté service).
  const page = await json(
    await fetch(`${API_BASE}/api/v1/chantiers/portefeuille?page=0&size=1&tri=code`, { headers: h }),
  );
  if (!page.ok) throw new Error(`portefeuille-compose-page ${page.status}`);
  if (page.body.total < 2 || page.body.items?.length !== 1) {
    throw new Error(`portefeuille-compose-page : total=${page.body.total} pageSize=${page.body.items?.length}`);
  }
  console.log(`PASS portefeuille-compose-page total=${page.body.total} page=1`);
  console.log('\nSEKTOR-258 cockpit UX pro : PASS');
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
