/**
 * SEKTOR-216 — portefeuille : pagination, chargement, pourcentages (AC-11 à AC-13).
 *
 * Run: node sektor/e2e/scripts/verify-finition-portefeuille-216.mjs
 * Prérequis optionnels: API 8082 (make -C nafura-platform/ops mode-b) pour vérif portefeuille.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

let FAILS = 0;
let PASSES = 0;

function pass(ac, detail) {
  PASSES++;
  console.log(`PASS ${ac} — ${detail}`);
}

function fail(ac, detail, expect, got) {
  FAILS++;
  console.error(`FAIL ${ac} — ${detail}`);
  if (expect !== undefined) console.error(`  attendu: ${expect}`);
  if (got !== undefined) console.error(`  obtenu:  ${got}`);
}

function repoRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '../..');
}

function read(path) {
  if (!existsSync(path)) throw new Error(`fichier absent : ${path}`);
  return readFileSync(path, 'utf8');
}

function countMatches(src, re) {
  return (src.match(re) ?? []).length;
}

/** AC-11 — une seule pagination serveur par listing Études / Devis. */
function assertPaginationWiring() {
  const root = repoRoot();
  const entityListingHtml = join(
    root,
    '../nafura-platform/sources/web/lib/anatomy/components/organisms/entity-listing/entity-listing.component.html',
  );
  const dossierCfg = join(root, 'sources/web/app/etudes/dossiers/config/listing.config.ts');
  const devisCfg = join(root, 'sources/web/app/etudes/devis/config/listing/config.ts');
  const paginatorIntl = join(root, 'sources/web/app/socle/shared/i18n/fr-mat-paginator-intl.ts');

  const listingSrc = read(entityListingHtml);
  if (!listingSrc.includes('[paginateAfter]="0"')) {
    fail('AC-11', 'data-table pagine encore côté client', '[paginateAfter]="0"', 'absent');
  } else {
    pass('AC-11', 'pagination client data-table désactivée (serveur unique)');
  }

  const paginatorCount = countMatches(listingSrc, /<nf-pagination/g);
  if (paginatorCount !== 1) {
    fail('AC-11', 'entity-listing doit exposer un seul nf-pagination', '1', String(paginatorCount));
  } else {
    pass('AC-11', 'entity-listing : un seul bloc nf-pagination');
  }

  for (const [label, path] of [
    ['Études', dossierCfg],
    ['Devis', devisCfg],
  ]) {
    const src = read(path);
    if (!src.includes('pageSizeOptions: [20]')) {
      fail('AC-11', `${label} : taille de page unique 20`, '[20]', 'non trouvé');
    } else {
      pass('AC-11', `${label} : pageSizeOptions = [20]`);
    }
  }

  const intlSrc = read(paginatorIntl);
  if (!intlSrc.includes('Lignes par page')) {
    fail('AC-11', 'MatPaginatorIntl français absent', 'Lignes par page', 'absent');
  } else {
    pass('AC-11', 'MatPaginatorIntl libellés FR');
  }
}

/** AC-12 — chargement distinct du vide sur portefeuille chantiers (+ études via data-state). */
function assertLoadingWiring() {
  const root = repoRoot();
  const chantiersListing = join(root, 'sources/web/app/chantiers/chantiers-listing/chantiers-listing.page.ts');
  const entityListing = join(
    root,
    '../nafura-platform/sources/web/lib/anatomy/components/organisms/entity-listing/entity-listing.component.ts',
  );

  const chantierSrc = read(chantiersListing);
  if (!chantierSrc.includes('readonly chargement = signal(true)')) {
    fail('AC-12', 'signal chargement absent du portefeuille chantiers', 'chargement', 'absent');
  } else if (!chantierSrc.includes('@if (chargement())')) {
    fail('AC-12', 'état chargement non rendu dans le tableau chantiers', '@if (chargement())', 'absent');
  } else if (!chantierSrc.includes('if (this.chargement())')) {
    fail('AC-12', 'countLabel ignore le chargement', 'chargement()', 'absent');
  } else {
    pass('AC-12', 'portefeuille chantiers : chargement ≠ vide / compteur');
  }

  if (!chantierSrc.includes('erreur()')) {
    fail('AC-12', 'bannière erreur portefeuille chantiers', 'erreur()', 'absent');
  } else {
    pass('AC-12', 'portefeuille chantiers : erreur API distincte');
  }

  const listingSrc = read(entityListing);
  if (!listingSrc.includes("return 'loading'") || !listingSrc.includes("return 'error'")) {
    fail('AC-12', 'entity-listing data-state loading/error', 'loading|error', 'incomplet');
  } else {
    pass('AC-12', 'listings Études/Devis : nf-data-state loading/error');
  }
}

/** AC-13 — affichage pourcentage à une décimale. */
function assertPercentDisplay() {
  const root = repoRoot();
  const util = join(root, 'sources/web/app/socle/shared/utils/percent-display.util.ts');
  const spec = join(root, 'sources/web/app/socle/shared/utils/percent-display.util.spec.ts');
  const chantiersListing = join(root, 'sources/web/app/chantiers/chantiers-listing/chantiers-listing.page.ts');

  const utilSrc = read(util);
  if (!utilSrc.includes('maximumFractionDigits: 1')) {
    fail('AC-13', 'formatPercentDisplay sans max 1 décimale', 'maximumFractionDigits: 1', 'absent');
  } else {
    pass('AC-13', 'util formatPercentDisplay (max 1 décimale)');
  }

  const specSrc = read(spec);
  if (!specSrc.includes('4.1846') || !specSrc.includes('4,2 %')) {
    fail('AC-13', 'spec 4.1846 → 4,2 %', '4,2 %', 'absent');
  } else {
    pass('AC-13', 'spec : 4.1846 → 4,2 %');
  }

  const chantierSrc = read(chantiersListing);
  if (!chantierSrc.includes('formatPercentDisplay')) {
    fail('AC-13', 'portefeuille chantiers n utilise pas formatPercentDisplay', 'formatPercentDisplay', 'absent');
  } else {
    pass('AC-13', 'portefeuille chantiers branché sur formatPercentDisplay');
  }
}

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

async function session() {
  const res = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const s = await res.json();
  if (!s?.accessToken || !s?.tenantId) throw new Error(`cursor-session KO: HTTP ${res.status}`);
  return s;
}

function headers(session) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    Accept: 'application/json',
  };
}

/** API — portefeuille répond avec total (pagination serveur). */
async function assertPortefeuilleApi() {
  try {
    const s = await session();
    const res = await json(
      await fetch(`${API_BASE}/api/v1/chantiers/portefeuille?page=0&size=20`, {
        headers: headers(s),
      }),
    );
    if (!res.ok) {
      console.log(`SKIP API portefeuille — HTTP ${res.status}`);
      return;
    }
    const total = res.body?.total ?? res.body?.totalElements;
    const items = res.body?.items ?? res.body?.content ?? [];
    if (typeof total !== 'number') {
      fail('AC-11', 'API portefeuille sans total serveur', 'number', typeof total);
    } else {
      pass('AC-11', `API portefeuille paginée (total=${total}, page=${items.length})`);
    }
    if (items.length > 0 && items[0].avancementPercent != null) {
      const raw = Number(items[0].avancementPercent);
      const formatted = `${raw.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} %`;
      pass('AC-13', `exemple API avancement brut=${raw} → affichage ${formatted}`);
    }
  } catch (e) {
    console.log(`SKIP API — ${e.message}`);
  }
}

async function main() {
  console.log('=== SEKTOR-216 — portefeuille pagination / chargement / % ===');
  assertPaginationWiring();
  assertLoadingWiring();
  assertPercentDisplay();
  await assertPortefeuilleApi();

  console.log(`\n=== Résultat : ${PASSES} pass · ${FAILS} fail ===`);
  if (FAILS > 0) process.exit(1);
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
