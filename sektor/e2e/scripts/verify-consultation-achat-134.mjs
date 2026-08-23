/**
 * Preuve SEKTOR-134 — objet Consultation Achats + menu.
 * Run: node sektor/e2e/scripts/verify-consultation-achat-134.mjs
 *
 * Baseline vu rouge (22/08, avant objet / route) :
 *   GET  /api/v1/consultations-achat → 404
 *   POST /api/v1/consultations-achat → 404
 *   chrome : pas de /achats/consultations sous Achats / expression
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
const FRONT_BASE = process.env.NAFURA_QA_FRONT_BASE ?? 'http://127.0.0.1:4200';

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

function assertNavChrome() {
  const here = dirname(fileURLToPath(import.meta.url));
  const navPath = join(
    here,
    '../../sources/web/app/socle/shell/erp-nav.generated.ts',
  );
  const nav = readFileSync(navPath, 'utf8');
  if (!nav.includes("route: '/achats/consultations'")) {
    throw new Error('VU ROUGE chrome : route /achats/consultations absente de erp-nav');
  }
  if (!nav.includes("id: 'achats.consultations'")) {
    throw new Error('VU ROUGE chrome : id achats.consultations absent');
  }
  const etudesBlock = nav.slice(nav.indexOf("id: 'etudes'"), nav.indexOf("id: 'catalogue'"));
  if (etudesBlock.includes("id: 'etudes.consultations'") || etudesBlock.includes('/etudes/consultations')) {
    throw new Error('chrome : item Consultations sous Études (interdit)');
  }
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
  const h = headers(session);
  const suffix = Date.now().toString(36);

  assertNavChrome();
  console.log('ok chrome Achats /consultations, pas Études');

  const listBefore = await json(await fetch(`${API_BASE}/api/v1/consultations-achat`, { headers: h }));
  if (listBefore.status === 404) {
    throw new Error('VU ROUGE objet absent : GET /api/v1/consultations-achat → 404');
  }
  if (!listBefore.ok || !Array.isArray(listBefore.body)) {
    throw new Error(`liste consultations ${listBefore.status} ${listBefore.text}`);
  }
  const countBefore = listBefore.body.length;

  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRN134${suffix}`.slice(0, 30),
        raisonSociale: `Lafarge QA 134 ${suffix}`,
        roles: ['FOURNISSEUR'],
      }),
    }),
  );
  if (partner.status !== 201) throw new Error(`partner ${partner.status} ${partner.text}`);

  const created = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fournisseurId: partner.body.id,
        clesStables: ['ciment-cpj-45'],
      }),
    }),
  );
  if (created.status === 404) {
    throw new Error('VU ROUGE objet absent : POST /api/v1/consultations-achat → 404');
  }
  if (created.status !== 201) throw new Error(`create ${created.status} ${created.text}`);
  if (created.body.dossierEtudeId != null) {
    throw new Error(`attendu hors étude (dossier null), reçu ${created.body.dossierEtudeId}`);
  }
  if (created.body.fournisseurId !== partner.body.id) {
    throw new Error(`fournisseurId ${created.body.fournisseurId}`);
  }
  if (!Array.isArray(created.body.clesStables) || !created.body.clesStables.includes('ciment-cpj-45')) {
    throw new Error(`panier ${JSON.stringify(created.body.clesStables)}`);
  }
  if (!String(created.body.numero || '').startsWith('CS-')) {
    throw new Error(`numero ${created.body.numero}`);
  }

  const listAfter = await json(await fetch(`${API_BASE}/api/v1/consultations-achat`, { headers: h }));
  if (!listAfter.ok) throw new Error(`liste après create ${listAfter.status}`);
  const found = listAfter.body.find((r) => r.id === created.body.id);
  if (!found) throw new Error('consultation créée absente de GET /api/v1/consultations-achat');
  if (found.dossierEtudeId != null) throw new Error('liste : lien étude non null');

  const da = await json(
    await fetch(`${API_BASE}/api/v1/demandes-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        chantierId: `CH-134-${suffix}`,
        chantierCode: 'CH-134',
        chantierName: `Chantier QA 134 ${suffix}`,
        dateBesoin: '2026-09-01',
        demandeurId: session.userId,
        demandeurName: 'QA 134',
        motif: 'DA chantier ne doit pas créer une consultation',
        lignes: [],
      }),
    }),
  );
  if (da.status !== 201) throw new Error(`DA ${da.status} ${da.text}`);

  const listAfterDa = await json(await fetch(`${API_BASE}/api/v1/consultations-achat`, { headers: h }));
  if (!listAfterDa.ok) throw new Error(`liste après DA ${listAfterDa.status}`);
  const extra = listAfterDa.body.filter((r) => r.id !== created.body.id && !listBefore.body.some((b) => b.id === r.id));
  if (listAfterDa.body.length !== countBefore + 1 || extra.length) {
    throw new Error(`DA chantier a créé une consultation (${listAfterDa.body.length} vs ${countBefore + 1})`);
  }

  const front = await fetch(`${FRONT_BASE}/achats/consultations`, {
    headers: { Accept: 'text/html' },
  });
  if (!front.ok) {
    throw new Error(`front /achats/consultations ${front.status}`);
  }

  console.log('ok create hors étude', created.body.numero, 'liste /achats/consultations, DA n’en crée pas');
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
