/**
 * SEKTOR-316 — Destinataires brouillon + N contacts (CC).
 * Run: node sektor/e2e/scripts/verify-consultation-contact-write-through.mjs
 *
 * Owner Mode B : qa@nafuralabs.local. Graphe fabriqué ici.
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

const here = dirname(fileURLToPath(import.meta.url));
const webPkg = join(here, '../../sources/web/package.json');
const require = createRequire(webPkg);
const { chromium } = require('playwright');

function read(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) throw new Error(`missing ${rel}`);
  return readFileSync(abs, 'utf8');
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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertSource() {
  const html = read('sources/web/app/achats/consultations/consultation-detail/consultation-detail.page.html');
  const ts = read('sources/web/app/achats/consultations/consultation-detail/consultation-detail.page.ts');
  const frnHtml = read('sources/web/app/achats/fournisseurs/fournisseur-detail/fournisseur-detail.page.html');
  const frnTs = read('sources/web/app/achats/fournisseurs/fournisseur-detail/fournisseur-detail.page.ts');
  const ctrl = read(
    'sources/backend/achats/src/main/java/ma/nafura/achats/api/controller/ConsultationAchatController.java',
  );
  assert(!html.includes('consultation-destinataire-contact-nom'), 'champ nom write-through encore là');
  assert(!html.includes('consultation-destinataire-contact-email'), 'champ e-mail write-through encore là');
  assert(html.includes('consultation-destinataires-save'), 'Enregistrer destinataires absent');
  assert(html.includes('consultation-destinataire-contacts'), 'liste contacts absente');
  assert(html.includes('tab: \'contacts\'') || html.includes('tab: "contacts"'), 'lien ?tab=contacts absent');
  assert(ts.includes('saveDestinataires'), 'saveDestinataires absent');
  assert(!ts.includes('contactNom'), 'payload contactNom encore dans le TS');
  assert(frnHtml.includes('fournisseur-contacts'), 'bloc contacts fiche absent');
  assert(frnTs.includes("id: 'contacts'"), 'onglet Contacts absent');
  assert(frnTs.includes("id: 'contrats'"), 'onglet Contrats absent');
  assert(frnHtml.includes('fournisseur-contrats'), 'bloc contrats fiche absent');
  assert(frnHtml.includes('fournisseur-contact-primary'), 'toggle principal absent');
  assert(ctrl.includes('PutMapping') && ctrl.includes('/destinataires'), 'PUT destinataires absent');
  console.log('PASS rfq-brouillon-source');
}

async function createPartner(h, suffix, label, extra = {}) {
  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRNWT${label}${suffix}`.slice(0, 30),
        raisonSociale: `${label} QA WT ${suffix}`,
        roles: ['FOURNISSEUR'],
        ...extra,
      }),
    }),
  );
  assert(partner.status === 201, `partner ${label} ${partner.status} ${partner.text}`);
  return partner.body;
}

async function createContact(h, partnerId, nom, email) {
  const created = await json(
    await fetch(`${API_BASE}/api/v1/partner-contacts`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ partnerId, nom, email }),
    }),
  );
  assert(created.status === 201 || created.status === 200, `contact ${nom} ${created.status} ${created.text}`);
  return created.body;
}

async function pickArticle(h, suffix) {
  const listing = await json(await fetch(`${API_BASE}/api/v1/items?page=0&size=50`, { headers: h }));
  assert(listing.ok, `GET items ${listing.status} ${listing.text}`);
  const rows = Array.isArray(listing.body)
    ? listing.body
    : listing.body?.content ?? listing.body?.items ?? [];
  const active = rows.find((r) => r?.isActive !== false && (r.cleStable || r.code));
  if (active) {
    return { cleStable: active.cleStable || active.code, code: active.code || active.cleStable };
  }
  const slug = `ciment-qawt-${suffix}`;
  const created = await json(
    await fetch(`${API_BASE}/api/v1/items`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: slug,
        name: `Ciment QA WT ${suffix}`,
        cleStable: slug,
        nature: 'MATIERE',
        isActive: true,
      }),
    }),
  );
  assert(created.status === 201 || created.status === 200, `item ${created.status} ${created.text}`);
  return { cleStable: created.body.cleStable || slug, code: created.body.code || slug };
}

async function selectFournisseur(page, section, partner) {
  const combo = section.locator('nf-select').first().locator('[role="combobox"], input').first();
  await combo.click();
  await combo.fill('');
  const query = String(partner.raisonSociale || partner.code || '').slice(0, 12);
  await combo.pressSequentially(query.length >= 2 ? query : 'QA', { delay: 25 });
  const option = page
    .getByRole('option')
    .filter({ hasText: new RegExp(partner.code || partner.raisonSociale, 'i') })
    .first();
  await option.waitFor({ timeout: 15000 });
  await option.click();
}

async function main() {
  assertSource();

  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  let session;
  try {
    session = await sessionRes.json();
  } catch {
    session = null;
  }
  if (!session?.accessToken || !session?.tenantId) {
    console.log('SKIP Mode B — cursor-session unavailable');
    process.exit(0);
  }
  const h = headers(session);
  const suffix = Date.now().toString(36);
  const article = await pickArticle(h, suffix);

  const created = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ clesStables: [article.cleStable] }),
    }),
  );
  assert(created.status === 201, `create ${created.status} ${created.text}`);
  const consultationId = created.body.id;

  const vide = await createPartner(h, suffix, 'Vide', { email: `promo-${suffix}@atlas.example` });
  const refusPromote = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${consultationId}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fournisseurId: vide.id }),
    }),
  );
  assert(refusPromote.status >= 400 && refusPromote.status < 500, `promote cassé ${refusPromote.status}`);
  assert(
    refusPromote.body?.code === 'consultation.destinataire.sans_email',
    `code promote ${JSON.stringify(refusPromote.body)}`,
  );
  console.log('PASS rfq-refus-partners-email-sans-contact');

  const a = await createContact(h, vide.id, 'A. Mail', `a-${suffix}@atlas.example`);
  const b = await createContact(h, vide.id, 'B. Mail', `b-${suffix}@atlas.example`);

  const put = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${consultationId}/destinataires`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({
        items: [{ fournisseurId: vide.id, contactIds: [a.id || a, b.id || b] }],
      }),
    }),
  );
  assert(put.status === 200, `PUT destinataires ${put.status} ${put.text}`);
  const row = (put.body.destinataires ?? []).find((d) => d.fournisseurId === vide.id);
  assert(row, `destinataire manquant ${JSON.stringify(put.body.destinataires)}`);
  assert((row.contacts ?? []).length === 2, `contacts ${JSON.stringify(row.contacts)}`);
  assert(row.contactEmail === `a-${suffix}@atlas.example`, `To ${row.contactEmail}`);
  console.log('PASS rfq-liste-contacts-cc');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${APP_BASE}/achats/consultations/${consultationId}`, {
      waitUntil: 'domcontentloaded',
    });
    const section = page.getByTestId('consultation-destinataires');
    await section.waitFor({ timeout: 25000 });
    await section.getByTestId('consultation-destinataire-row').first().waitFor({ timeout: 10000 });

    const uiPartner = await createPartner(h, `${suffix}ui`, 'Saisie');
    await selectFournisseur(page, section, uiPartner);
    await section.getByTestId('consultation-destinataire-sans-email').waitFor({ timeout: 8000 });
    const lien = section.getByTestId('consultation-destinataire-fiche-fournisseur');
    const href = await lien.getAttribute('href');
    assert(
      href && href.includes(`/achats/fournisseurs/${uiPartner.id}`) && href.includes('tab=contacts'),
      `lien fiche ${href}`,
    );

    await page.goto(`${APP_BASE}/achats/fournisseurs/${uiPartner.id}?tab=contacts`, {
      waitUntil: 'domcontentloaded',
    });
    const fiche = page.getByTestId('fournisseur-contacts');
    await fiche.waitFor({ timeout: 20000 });
    await fiche.getByTestId('fournisseur-contact-nom').locator('input').fill('Contact UI');
    await fiche.getByTestId('fournisseur-contact-email').locator('input').fill(`ui-${suffix}@beton.example`);
    await fiche.getByTestId('fournisseur-contact-save').click();
    await page.getByTestId('fournisseur-contact-row').first().waitFor({ timeout: 15000 });
    const listed = await json(
      await fetch(`${API_BASE}/api/v1/partners/${uiPartner.id}/contacts`, { headers: h }),
    );
    const firstRows = Array.isArray(listed.body) ? listed.body : [];
    assert(firstRows.some((r) => r.isPrimary), `premier contact pas principal ${listed.text}`);

    await fiche.getByTestId('fournisseur-contact-nom').locator('input').fill('Contact Principal');
    await fiche.getByTestId('fournisseur-contact-email').locator('input').fill(`pri-${suffix}@beton.example`);
    await fiche.getByTestId('fournisseur-contact-primary').check();
    await fiche.getByTestId('fournisseur-contact-save').click();
    await page.getByTestId('fournisseur-contact-row').nth(1).waitFor({ timeout: 15000 });
    const listed2 = await json(
      await fetch(`${API_BASE}/api/v1/partners/${uiPartner.id}/contacts`, { headers: h }),
    );
    const secondRows = Array.isArray(listed2.body) ? listed2.body : [];
    const primaries = secondRows.filter((r) => r.isPrimary);
    assert(primaries.length === 1, `un seul principal ${JSON.stringify(secondRows)}`);
    assert(secondRows[0]?.isPrimary, `principal pas en tête ${JSON.stringify(secondRows)}`);
    assert(
      String(primaries[0]?.email || '').startsWith(`pri-${suffix}`),
      `nouveau principal ${JSON.stringify(primaries)}`,
    );

    await page.goto(`${APP_BASE}/achats/fournisseurs/${uiPartner.id}?tab=contrats`, {
      waitUntil: 'domcontentloaded',
    });
    await page.getByTestId('fournisseur-contrats').waitFor({ timeout: 20000 });
    await page.getByTestId('fournisseur-contrats-empty').waitFor({ timeout: 10000 });
    await page.getByTestId('fournisseur-contrat-new').waitFor({ timeout: 5000 });
    console.log('PASS rfq-lien-contacts-fiche');

    await page.goto(`${APP_BASE}/achats/consultations/${consultationId}`, {
      waitUntil: 'domcontentloaded',
    });
    const dest = page.getByTestId('consultation-destinataires');
    await dest.waitFor({ timeout: 20000 });
    await dest.getByTestId('consultation-destinataire-row').first().waitFor({ timeout: 10000 });
    const before = await page.locator('[data-testid="consultation-destinataire-row"]').count();
    await selectFournisseur(page, dest, uiPartner);
    await dest.getByTestId('consultation-destinataire-contacts').waitFor({ timeout: 10000 });
    await dest.getByTestId('consultation-destinataire-add').click();
    await page.waitForFunction(
      (n) => document.querySelectorAll('[data-testid="consultation-destinataire-row"]').length > n,
      before,
      { timeout: 8000 },
    );
    const getAfterAdd = await json(
      await fetch(`${API_BASE}/api/v1/consultations-achat/${consultationId}`, { headers: h }),
    );
    assert(
      (getAfterAdd.body.destinataires ?? []).length === 1,
      `Ajouter a persisté ${JSON.stringify(getAfterAdd.body.destinataires)}`,
    );
    await page.waitForFunction(
      () => document.querySelector('[data-testid="consultation-destinataires-save"] button')?.disabled === false,
      null,
      { timeout: 8000 },
    );
    await dest.getByTestId('consultation-destinataires-save').click();
    let getAfterSave;
    for (let i = 0; i < 20; i++) {
      getAfterSave = await json(
        await fetch(`${API_BASE}/api/v1/consultations-achat/${consultationId}`, { headers: h }),
      );
      if ((getAfterSave.body.destinataires ?? []).length >= 2) break;
      await new Promise((r) => setTimeout(r, 400));
    }
    const err = await dest.locator('[data-testid="consultation-destinataire-error"]').textContent().catch(() => '');
    const rowsText = await page.locator('[data-testid="consultation-destinataire-row"]').allInnerTexts().catch(() => []);
    assert(
      (getAfterSave.body.destinataires ?? []).length === 2,
      `après save ${JSON.stringify(getAfterSave.body.destinataires)} err=${err} rows=${JSON.stringify(rowsText)}`,
    );
    console.log('PASS rfq-brouillon-sans-post');
  } finally {
    await browser.close();
  }

  console.log('OK verify-consultation-contact-write-through brouillon+CC');
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
