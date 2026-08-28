/**
 * SEKTOR-214 — chaîne Étude–Devis–Chantier navigable (AC-7, AC-8, AC-9).
 *
 * Run: node sektor/e2e/scripts/verify-finition-chaine-214.mjs
 * Prérequis: API 8082 (make -C nafura-platform/ops mode-b), cursor-session owner.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const FRONT_BASE = process.env.NAFURA_QA_FRONT_BASE ?? 'http://127.0.0.1:4200';

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

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

function headers(session) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function api(h, method, path, body) {
  const opts = { method, headers: h };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return json(await fetch(`${API_BASE}${path}`, opts));
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

function repoRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '../..');
}

/** AC-9 + AC-7 + AC-8 — vérifie les branchements source sans lancer le front. */
function assertSourceWiring() {
  const root = repoRoot();
  const routesTs = join(root, 'sources/web/app/etudes/etudes.routes.ts');
  const devisCols = join(root, 'sources/web/app/etudes/devis/config/listing/columns.ts');
  const devisRoutes = join(root, 'sources/web/app/etudes/devis/config/listing/routes.ts');
  const chantierDetail = join(root, 'sources/web/app/chantiers/chantier-detail/chantier-detail.page.ts');
  const dossierHeader = join(
    root,
    'sources/web/app/etudes/dossiers/components/dossier-summary-header/dossier-summary-header.component.html',
  );

  for (const f of [routesTs, devisCols, devisRoutes, chantierDetail, dossierHeader]) {
    if (!existsSync(f)) throw new Error(`fichier absent : ${f}`);
  }

  const routesSrc = readFileSync(routesTs, 'utf8');
  if (!routesSrc.includes("redirectTo: 'etudes/dossiers'")) {
    fail('AC-9', '/etudes ne redirige pas vers etudes/dossiers', 'etudes/dossiers', routesSrc.match(/redirectTo:\s*'[^']+'/)?.[0]);
  } else {
    pass('AC-9', '/etudes → etudes/dossiers (routes.ts)');
  }
  if (routesSrc.includes("redirectTo: 'etudes/devis'")) {
    fail('AC-9', '/etudes redirige encore vers devis', 'etudes/dossiers', 'etudes/devis');
  }

  const colsSrc = readFileSync(devisCols, 'utf8');
  if (!colsSrc.includes("cellAction: 'view'")) {
    fail('AC-7', 'colonne numero sans cellAction view', "cellAction: 'view'", 'absent');
  } else {
    pass('AC-7', 'numéro devis cliquable (cellAction view)');
  }

  const devisRoutesSrc = readFileSync(devisRoutes, 'utf8');
  if (!devisRoutesSrc.includes("'/etudes/devis', item.id")) {
    fail('AC-7', 'route détail devis absente', '/etudes/devis/{id}', devisRoutesSrc.slice(0, 120));
  } else {
    pass('AC-7', 'route détail /etudes/devis/{id} déclarée');
  }

  const chantierSrc = readFileSync(chantierDetail, 'utf8');
  if (!chantierSrc.includes('openDevis()') || !chantierSrc.includes('openEtude()')) {
    fail('AC-8', 'openDevis/openEtude absents du chantier', 'présents', 'absents');
  } else if (!chantierSrc.includes('chantier-meta__link') || !chantierSrc.includes('(click)="openDevis()"')) {
    fail('AC-8', 'devisNumero non branché en lien cliquable', 'chantier-meta__link + openDevis', 'non trouvé');
  } else {
    pass('AC-8', 'fiche chantier : liens devis + étude cliquables');
  }

  const headerSrc = readFileSync(dossierHeader, 'utf8');
  if (!headerSrc.includes("['/etudes/devis', s.devisGenereId]")) {
    fail('AC-8', 'étude convertie : lien devis absent du header', "routerLink devis", 'absent');
  } else {
    pass('AC-8', 'étude convertie : lien devis dans le header');
  }
  if (!headerSrc.includes("['/chantiers', s.chantierGenereId]")) {
    fail('AC-8', 'étude convertie : lien chantier absent du header', "routerLink chantier", 'absent');
  } else {
    pass('AC-8', 'étude convertie : lien chantier dans le header');
  }
}

function devisItems(body) {
  if (Array.isArray(body)) return body;
  return body?.items ?? body?.content ?? [];
}

/** Trouve un devis par numéro ou retourne le premier de la liste paginée. */
async function findDevis(h, numero) {
  const search = await api(h, 'GET', `/api/v1/etudes/devis?search=${encodeURIComponent(numero)}&size=20`);
  if (search.ok) {
    const hit = devisItems(search.body).find((d) => d.numero === numero);
    if (hit?.id) return hit;
  }
  const list = await api(h, 'GET', '/api/v1/etudes/devis?size=50&sort=numero,desc');
  if (!list.ok) throw new Error(`liste devis ${list.status} ${list.text}`);
  return devisItems(list.body).find((d) => d.numero === numero) ?? devisItems(list.body)[0];
}

async function main() {
  console.log('=== SEKTOR-214 — chaîne Étude–Devis–Chantier (Mode B) ===');
  assertSourceWiring();

  const owner = await session();
  const h = headers(owner);

  // ── AC-7 : devis listé ouvre une fiche par id ─────────────────────────────
  const targetNumero = 'DV-2026-0060';
  let devis = await findDevis(h, targetNumero);
  if (!devis?.id) {
    fail('AC-7', `devis ${targetNumero} introuvable en Mode B`, 'id présent', devis);
  } else {
    const detail = await api(h, 'GET', `/api/v1/etudes/devis/${devis.id}`);
    if (!detail.ok || detail.body?.numero !== devis.numero) {
      fail('AC-7', 'GET devis/{id} depuis la liste', devis.numero, detail.body?.numero ?? detail.status);
    } else {
      pass('AC-7', `devis ${devis.numero} → GET /etudes/devis/${devis.id}`);
    }
  }

  // ── AC-8 : chaîne par identifiants snapshot ───────────────────────────────
  if (devis?.id) {
    const d = devis;
    if (d.dossierEtudeId) {
      const etude = await api(h, 'GET', `/api/v1/etudes/dossiers/${d.dossierEtudeId}/synthese`);
      if (!etude.ok) {
        fail('AC-8', 'devis → étude source', d.dossierEtudeId, etude.status);
      } else {
        pass('AC-8', `devis ${d.numero} → étude ${etude.body?.numero ?? d.dossierEtudeId}`);
      }
    } else {
      fail('AC-8', 'devis sans dossierEtudeId', 'dossierEtudeId', d.dossierEtudeId);
    }

    if (d.chantierGenereId) {
      const chantier = await api(h, 'GET', `/api/v1/chantiers/${d.chantierGenereId}`);
      if (!chantier.ok) {
        fail('AC-8', 'devis → chantier', d.chantierGenereId, chantier.status);
      } else {
        const c = chantier.body;
        if (c.devisId && `${c.devisId}` !== `${d.id}`) {
          fail('AC-8', 'chantier.devisId = devis.id', d.id, c.devisId);
        } else if (c.devisNumero && c.devisNumero !== d.numero) {
          fail('AC-8', 'chantier.devisNumero = devis.numero', d.numero, c.devisNumero);
        } else {
          pass('AC-8', `devis ${d.numero} → chantier ${c.code ?? c.id} (devisNumero=${c.devisNumero})`);
        }
        if (c.dossierEtudeId && d.dossierEtudeId && `${c.dossierEtudeId}` !== `${d.dossierEtudeId}`) {
          fail('AC-8', 'chantier.dossierEtudeId cohérent', d.dossierEtudeId, c.dossierEtudeId);
        } else if (c.dossierEtudeId) {
          pass('AC-8', `chantier ${c.code} → étude ${c.dossierEtudeId}`);
        }
      }
    } else {
      // Pas de chantier converti : chercher un chantier avec snapshot devis
      const chantiers = await api(h, 'GET', '/api/v1/chantiers?size=30');
      const linked = devisItems(chantiers.body).find(
        (c) => c.devisId && `${c.devisId}` === `${d.id}`,
      );
      if (linked) {
        pass('AC-8', `chantier lié trouvé par devisId : ${linked.code ?? linked.id}`);
      } else {
        fail('AC-8', 'aucun chantier lié au devis approuvé', 'chantierGenereId ou devisId', null);
      }
    }
  }

  // ── Front joignable (redirect SPA vérifié en statique) ────────────────────
  let frontOk = false;
  try {
    const front = await fetch(FRONT_BASE, { method: 'GET' });
    frontOk = front.ok;
  } catch {
    frontOk = false;
  }
  if (frontOk) {
    pass('AC-9', `front ${FRONT_BASE} joignable (redirect /etudes vérifié en source)`);
  } else {
    console.log(`SKIP front ${FRONT_BASE} injoignable — preuve redirect = source statique`);
  }

  console.log(`\n=== Résultat : ${PASSES} pass · ${FAILS} fail ===`);
  if (FAILS > 0) process.exit(1);
}

main().catch((e) => {
  console.error('FAIL', e);
  process.exit(1);
});
