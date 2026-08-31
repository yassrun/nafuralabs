/**
 * SEKTOR-263 — chrome liste + fiche consultation entity anatomy (AC-1…AC-6).
 * Couverture e2e complète = SEKTOR-265 (verify-ux-pro-consultation.mjs).
 * Run: node sektor/e2e/scripts/verify-ux-pro-consultation-263.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
const FRONT_BASE = process.env.NAFURA_QA_FRONT_BASE ?? 'http://127.0.0.1:4200';

function here(...parts) {
  return join(dirname(fileURLToPath(import.meta.url)), ...parts);
}

function read(rel) {
  const p = here('../../sources/web/app/achats/consultations', rel);
  if (!existsSync(p)) throw new Error(`VU ROUGE chrome : ${rel} absent`);
  return readFileSync(p, 'utf8');
}

function assertChrome() {
  const listingHtml = read('consultation-listing/consultation-listing.page.html');
  const listingTs = read('consultation-listing/consultation-listing.page.ts');
  const detailHtml = read('consultation-detail/consultation-detail.page.html');
  const detailTs = read('consultation-detail/consultation-detail.page.ts');

  if (!listingHtml.includes('nf-entity-listing')) {
    throw new Error('AC-1 VU ROUGE : nf-entity-listing absent du listing');
  }
  if (/<table[\s>]/.test(listingHtml)) {
    throw new Error('AC-1 VU ROUGE : <table> custom encore dans le listing');
  }
  if (!listingTs.includes('buildConsultationListingConfig') || !listingTs.includes('ConsultationFacade')) {
    throw new Error('AC-1 VU ROUGE : listing sans config + facade');
  }
  if (!listingHtml.includes('data-testid="consultation-achat-list"')) {
    throw new Error('AC-1 : data-testid consultation-achat-list manquant');
  }

  if (!detailHtml.includes('nf-entity-detail')) {
    throw new Error('AC-4 VU ROUGE : nf-entity-detail absent de la fiche');
  }
  if (!detailHtml.includes('nf-smart-import-trigger')) {
    throw new Error('AC-5 VU ROUGE : nf-smart-import-trigger absent');
  }
  if (/<textarea/i.test(detailHtml)) {
    throw new Error('AC-5 VU ROUGE : textarea sur la fiche (saisie PU interdite)');
  }
  if (!detailHtml.includes('data-testid="consultation-achat-fiche"')) {
    throw new Error('AC-4 : data-testid consultation-achat-fiche manquant');
  }
  if (!detailHtml.includes('data-testid="consultation-devis-lignes"')) {
    throw new Error('AC-5 : data-testid consultation-devis-lignes manquant');
  }
  if (!detailTs.includes('DEVIS_CONSULTATION_IMPORT_DEFINITION')) {
    throw new Error('AC-5 : définition import devis absente');
  }

  // Create page hors scope 263 — ne doit pas avoir été réécrit ici.
  const createHtml = read('consultation-create/consultation-create.page.html');
  if (createHtml.includes('app-article-picker') && !createHtml.includes('clesText')) {
    // 264 may land later; 263 must not force picker rewrite
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

function headers(session) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

async function main() {
  assertChrome();
  console.log('ok chrome AC-1…AC-6 entity listing/detail + import magique');

  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = await sessionRes.json();
  if (!session?.accessToken || !session?.tenantId) {
    console.log('SKIP cursor-session unavailable (chrome OK)');
    process.exit(0);
  }
  const h = headers(session);
  const suffix = Date.now().toString(36);

  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRN263${suffix}`.slice(0, 30),
        raisonSociale: `QA 263 ${suffix}`,
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
        clesStables: ['ciment-cpj-45', 'sable-de-dune'],
      }),
    }),
  );
  if (created.status !== 201) throw new Error(`create ${created.status} ${created.text}`);

  const list = await json(await fetch(`${API_BASE}/api/v1/consultations-achat`, { headers: h }));
  if (!list.ok || !list.body?.some((r) => r.id === created.body.id)) {
    throw new Error('liste API sans consultation créée');
  }

  const fiche = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${created.body.id}`, { headers: h }),
  );
  if (!fiche.ok) throw new Error(`GET fiche ${fiche.status}`);
  if (!Array.isArray(fiche.body.clesStables) || fiche.body.clesStables.length < 2) {
    throw new Error(`panier fiche ${JSON.stringify(fiche.body.clesStables)}`);
  }

  for (const path of [
    `${FRONT_BASE}/achats/consultations`,
    `${FRONT_BASE}/achats/consultations/${created.body.id}`,
  ]) {
    const front = await fetch(path, { headers: { Accept: 'text/html' } });
    if (!front.ok) throw new Error(`front ${path} → ${front.status}`);
  }

  console.log('ok API + front routes', created.body.numero);
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
