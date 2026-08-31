/**
 * SEKTOR-279 — Modèle N destinataires + contrainte contact mail (AC-1…AC-7).
 * Run: node sektor/e2e/scripts/verify-consultation-rfq-279.mjs
 *
 * Scénarios CONTRAT : rfq-create-panier · rfq-refus-sans-email · rfq-deux-destinataires
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

function assertCreateSource() {
  const html = read('sources/web/app/achats/consultations/consultation-create/consultation-create.page.html');
  const ts = read('sources/web/app/achats/consultations/consultation-create/consultation-create.page.ts');
  assert(!html.includes('name="fournisseurId"'), 'rfq-create-panier: name=fournisseurId sur create');
  assert(!html.includes('lookupKey="fournisseurs"'), 'rfq-create-panier: lookupKey fournisseurs sur create');
  assert(!ts.includes('searchFournisseurs'), 'rfq-create-panier: searchFournisseurs encore sur create');
  assert(html.includes('consultation-create-panier'), 'rfq-create-panier: panier picker absent');
  assert(!/<textarea/i.test(html), 'rfq-create-panier: textarea sur create');
  console.log('PASS rfq-create-panier (source create)');
}

async function createPartner(h, suffix, label, extra = {}) {
  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRN279${label}${suffix}`.slice(0, 30),
        raisonSociale: `${label} QA 279 ${suffix}`,
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
    return {
      id: active.id,
      cleStable: active.cleStable || active.code,
      code: active.code || active.cleStable,
      name: active.name,
    };
  }
  const slug = `ciment-qa279-${suffix}`;
  const created = await json(
    await fetch(`${API_BASE}/api/v1/items`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: slug,
        name: `Ciment QA 279 ${suffix}`,
        cleStable: slug,
        nature: 'MATIERE',
        isActive: true,
      }),
    }),
  );
  assert(created.status === 201 || created.status === 200, `item ${created.status} ${created.text}`);
  return {
    id: created.body.id,
    cleStable: created.body.cleStable || slug,
    code: created.body.code || slug,
    name: created.body.name || slug,
  };
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
  assertCreateSource();

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

  const sansMail = await createPartner(h, suffix, 'Atlas', { email: 'fallback@atlas.example' });
  const lafarge = await createPartner(h, suffix, 'Lafarge');
  const sika = await createPartner(h, suffix, 'Sika');
  await createContact(h, lafarge.id, 'A. Benali', `achat-${suffix}@lafarge.example`);
  await createContact(h, sika.id, 'M. Kadiri', `devis-${suffix}@sika.example`);

  /* rfq-create-panier — API */
  const created = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ clesStables: [article.cleStable] }),
    }),
  );
  assert(created.status === 201, `rfq-create-panier ${created.status} ${created.text}`);
  assert(created.body.statut === 'PREPARATION', `statut ${created.body.statut}`);
  assert(!(created.body.destinataires ?? []).length, 'create a attaché un destinataire');
  assert(
    Array.isArray(created.body.clesStables) && created.body.clesStables.includes(article.cleStable),
    `panier ${JSON.stringify(created.body.clesStables)}`,
  );

  const ignored = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fournisseurId: lafarge.id,
        clesStables: [article.cleStable],
      }),
    }),
  );
  assert(ignored.status === 201, `AC-3 ignore fournisseurId ${ignored.status} ${ignored.text}`);
  assert(!(ignored.body.destinataires ?? []).length, 'AC-3 : destinataire créé depuis fournisseurId');
  console.log('PASS rfq-create-panier', created.body.numero);

  /* rfq-refus-sans-email */
  const refus = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${created.body.id}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fournisseurId: sansMail.id }),
    }),
  );
  assert(refus.status >= 400 && refus.status < 500, `refus sans email ${refus.status} ${refus.text}`);
  assert(
    refus.body?.code === 'consultation.destinataire.sans_email',
    `code refus ${JSON.stringify(refus.body)}`,
  );
  console.log('PASS rfq-refus-sans-email');

  /* rfq-deux-destinataires */
  const d1 = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${created.body.id}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fournisseurId: lafarge.id }),
    }),
  );
  assert(d1.status === 201, `destinataire Lafarge ${d1.status} ${d1.text}`);
  const d2 = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${created.body.id}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fournisseurId: sika.id }),
    }),
  );
  assert(d2.status === 201, `destinataire Sika ${d2.status} ${d2.text}`);
  const dests = d2.body.destinataires ?? [];
  assert(dests.length === 2, `destinataires ${dests.length}`);
  assert(
    dests.every((d) => d.statut === 'EN_ATTENTE' && d.contactEmail && d.fournisseurNom),
    `destinataires payload ${JSON.stringify(dests)}`,
  );
  const listed = await json(await fetch(`${API_BASE}/api/v1/consultations-achat`, { headers: h }));
  assert(listed.ok, `listing ${listed.status} ${listed.text}`);
  const listedRow = Array.isArray(listed.body)
    ? listed.body.find((r) => r.id === created.body.id)
    : null;
  const listedDests = listedRow?.destinataires ?? [];
  assert(listedDests.length >= 2, `listing destinataires ${listedDests.length}`);
  assert(
    listedDests.every((d) => d.fournisseurNom && !/^[0-9a-f-]{36}$/i.test(d.fournisseurNom)),
    `listing résumé UUID ${JSON.stringify(listedDests)}`,
  );
  const dup = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${created.body.id}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fournisseurId: lafarge.id }),
    }),
  );
  assert(dup.status >= 400 && dup.status < 500, `doublon ${dup.status} ${dup.text}`);

  const nContacts = await createPartner(h, suffix, 'NMails');
  await createContact(h, nContacts.id, 'A. Mail', `a-${suffix}@nmails.example`);
  const cB = await createContact(h, nContacts.id, 'B. Mail', `b-${suffix}@nmails.example`);
  const nSansChoix = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${created.body.id}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fournisseurId: nContacts.id }),
    }),
  );
  assert(nSansChoix.status >= 400 && nSansChoix.status < 500, `N contacts sans choix ${nSansChoix.status}`);
  assert(
    nSansChoix.body?.code === 'consultation.destinataire.contact_requis',
    `code N ${JSON.stringify(nSansChoix.body)}`,
  );
  const nAvecChoix = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${created.body.id}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fournisseurId: nContacts.id, contactId: cB.id || cB }),
    }),
  );
  assert(nAvecChoix.status === 201, `N contacts avec choix ${nAvecChoix.status} ${nAvecChoix.text}`);
  const nRow = (nAvecChoix.body.destinataires ?? []).find((d) => d.fournisseurId === nContacts.id);
  assert(nRow?.contactEmail === `b-${suffix}@nmails.example`, `N bind ${JSON.stringify(nRow)}`);
  console.log('PASS rfq-deux-destinataires');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${APP_BASE}/achats/consultations/new`, { waitUntil: 'domcontentloaded' });
    const form = page.getByTestId('consultation-create-form');
    await form.waitFor({ timeout: 25000 });
    assert((await form.locator('[name="fournisseurId"]').count()) === 0, 'browser create: name=fournisseurId');
    assert((await form.locator('nf-select').count()) === 0, 'browser create: nf-select fournisseur');

    await form.getByTestId('consultation-create-add-article').click();
    const dialog = page.locator('app-catalog-item-pick-dialog');
    await dialog.waitFor({ timeout: 10000 });
    const q = dialog.getByTestId('article-picker-q');
    await q.fill('');
    const searchTerm = (article.code || article.cleStable || article.name).trim();
    const needle = searchTerm.slice(0, Math.max(2, Math.min(12, searchTerm.length)));
    await q.pressSequentially(needle, { delay: 30 });
    const hitMatcher = new RegExp(
      (article.code || article.cleStable || article.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    );
    const hit = dialog.locator('[data-testid="article-picker-hit"]').filter({ hasText: hitMatcher }).first();
    await hit.waitFor({ timeout: 15000 });
    await hit.click();
    await dialog.getByTestId('article-picker-choose').click();
    await form.getByTestId('consultation-create-panier-line').first().waitFor({ timeout: 8000 });
    await form.getByTestId('consultation-create-submit').click();
    await page.waitForURL(/\/achats\/consultations\/[0-9a-f-]+/i, { timeout: 20000 });

    const section = page.getByTestId('consultation-destinataires');
    await section.waitFor({ timeout: 15000 });
    assert((await page.getByTestId('consultation-achat-import').count()) === 1, 'import magique disparu');

    const atlas = await createPartner(h, `${suffix}b`, 'Beton');
    await selectFournisseur(page, section, atlas);
    await section.getByTestId('consultation-destinataire-sans-email').waitFor({ timeout: 8000 });
    const lien = section.getByTestId('consultation-destinataire-fiche-fournisseur');
    await lien.waitFor({ timeout: 5000 });
    const href = await lien.getAttribute('href');
    assert(
      href && href.includes(`/achats/fournisseurs/${atlas.id}`),
      `lien fiche ${href}`,
    );
    console.log('PASS rfq-refus-sans-email (browser)');

    const frnUi1 = await createPartner(h, `${suffix}c`, 'Holcim');
    const frnUi2 = await createPartner(h, `${suffix}d`, 'Cimpor');
    await createContact(h, frnUi1.id, 'H. Mail', `h-${suffix}@holcim.example`);
    await createContact(h, frnUi2.id, 'C. Mail', `c-${suffix}@cimpor.example`);

    await selectFournisseur(page, section, frnUi1);
    await section.getByTestId('consultation-destinataire-add').click();
    await section.locator('[data-testid="consultation-destinataire-row"]').first().waitFor({ timeout: 10000 });

    await selectFournisseur(page, section, frnUi2);
    await section.getByTestId('consultation-destinataire-add').click();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="consultation-destinataire-row"]').length >= 2,
      null,
      { timeout: 10000 },
    );

    const nUi = await createPartner(h, `${suffix}e`, 'Multi');
    await createContact(h, nUi.id, 'M1', `m1-${suffix}@multi.example`);
    await createContact(h, nUi.id, 'M2', `m2-${suffix}@multi.example`);
    await selectFournisseur(page, section, nUi);
    const contactSelect = section.getByTestId('consultation-destinataire-contact');
    await contactSelect.waitFor({ timeout: 8000 });
    const optionCount = await contactSelect.locator('option').count();
    assert(optionCount >= 3, `select borné options ${optionCount}`);
    const values = await contactSelect.locator('option').evaluateAll((opts) =>
      opts.map((o) => o.getAttribute('value') || ''),
    );
    const firstReal = values.find((v) => v);
    assert(firstReal, 'select borné sans valeur');
    await contactSelect.selectOption(firstReal);
    await section.getByTestId('consultation-destinataire-add').click();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="consultation-destinataire-row"]').length >= 3,
      null,
      { timeout: 10000 },
    );
    console.log('PASS rfq-deux-destinataires (browser)');
  } finally {
    await browser.close();
  }

  console.log('OK verify-consultation-rfq-279 AC-1…AC-7');
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
