/**
 * SEKTOR-280 — Envoyer la consultation (journal mail) (AC-8…AC-10).
 * Run: node sektor/e2e/scripts/verify-consultation-rfq-280.mjs
 *
 * Scénarios CONTRAT : rfq-envoyer-journal · rfq-panier-fige · rfq-renvoi-nouveaux
 * Owner Mode B : qa@nafuralabs.local. Graphe fabriqué ici. Journal = preuve (Brevo no-op OK).
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
  const ctrl = read(
    'sources/backend/achats/src/main/java/ma/nafura/achats/api/controller/ConsultationAchatController.java',
  );
  assert(html.includes('data-testid="consultation-envoyer"'), 'CTA Envoyer absent');
  assert(html.includes('data-testid="consultation-journal"'), 'tableau journal absent');
  assert(html.includes('data-testid="consultation-panier-fige"'), 'message panier figé absent');
  assert(ts.includes('envoyer(') && ts.includes('canEnvoyer'), 'méthode envoyer absente');
  assert(ctrl.includes('/envoyer'), 'POST /envoyer absent');
  const sql = read(
    'sources/backend/achats/src/main/resources/db/changelog/schema/v1.1/007_consultation_achat_envois.sql',
  );
  assert(sql.includes('consultation_achat_envois'), 'changelog journal absent');
  assert(sql.includes('uq_consultation_achat_envoi_destinataire'), 'unique destinataire journal absent');
  console.log('PASS rfq-envoyer-journal (source)');
}

async function createPartner(h, suffix, label) {
  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRN280${label}${suffix}`.slice(0, 30),
        raisonSociale: `${label} QA 280 ${suffix}`,
        roles: ['FOURNISSEUR'],
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
  const slug = `ciment-qa280-${suffix}`;
  const created = await json(
    await fetch(`${API_BASE}/api/v1/items`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: slug,
        name: `Ciment QA 280 ${suffix}`,
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

async function createConsultation(h, article) {
  const created = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ clesStables: [article.cleStable] }),
    }),
  );
  assert(created.status === 201, `create ${created.status} ${created.text}`);
  return created.body;
}

async function addDest(h, consultationId, fournisseurId, contactId) {
  const body = { fournisseurId };
  if (contactId) body.contactId = contactId;
  const res = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${consultationId}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify(body),
    }),
  );
  assert(res.status === 201, `destinataire ${res.status} ${res.text}`);
  return res.body;
}

async function envoyer(h, consultationId) {
  return json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${consultationId}/envoyer`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({}),
    }),
  );
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
  const extraArticle = await json(
    await fetch(`${API_BASE}/api/v1/items`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `sable-qa280-${suffix}`.slice(0, 40),
        name: `Sable QA 280 ${suffix}`,
        cleStable: `sable-qa280-${suffix}`,
        nature: 'MATIERE',
        isActive: true,
      }),
    }),
  );
  const extraCle =
    extraArticle.ok && extraArticle.body?.cleStable
      ? extraArticle.body.cleStable
      : `sable-qa280-${suffix}`;

  const lafarge = await createPartner(h, suffix, 'Lafarge');
  const sika = await createPartner(h, suffix, 'Sika');
  const holcim = await createPartner(h, suffix, 'Holcim');
  await createContact(h, lafarge.id, 'A. Benali', `achat-${suffix}@lafarge.example`);
  await createContact(h, sika.id, 'M. Kadiri', `devis-${suffix}@sika.example`);
  await createContact(h, holcim.id, 'H. Mail', `h-${suffix}@holcim.example`);

  /* rfq-envoyer-journal */
  const cs = await createConsultation(h, article);
  const sansDest = await envoyer(h, cs.id);
  assert(sansDest.status >= 400 && sansDest.status < 500, `0 dest ${sansDest.status} ${sansDest.text}`);
  assert(
    sansDest.body?.code === 'consultation.envoyer.sans_destinataire',
    `code 0 dest ${JSON.stringify(sansDest.body)}`,
  );

  await addDest(h, cs.id, lafarge.id);
  await addDest(h, cs.id, sika.id);
  const sent = await envoyer(h, cs.id);
  assert(sent.status === 200, `envoyer ${sent.status} ${sent.text}`);
  const envois = sent.body?.envois ?? [];
  assert(envois.length === 2, `journal ${envois.length} ${JSON.stringify(envois)}`);
  assert(
    envois.every((e) => e.email && e.destinataireId && e.sentAt),
    `journal payload ${JSON.stringify(envois)}`,
  );
  const emails = envois.map((e) => e.email).sort();
  assert(
    emails.includes(`achat-${suffix}@lafarge.example`) && emails.includes(`devis-${suffix}@sika.example`),
    `emails ${JSON.stringify(emails)}`,
  );
  assert(sent.body.statut === 'OUVERTE', `statut après envoi ${sent.body.statut}`);
  const again = await envoyer(h, cs.id);
  assert(again.status === 200, `renvoi sans nouveau ${again.status}`);
  assert((again.body?.envois ?? []).length === 2, `2e envoi a ajouté ${(again.body?.envois ?? []).length}`);
  console.log('PASS rfq-envoyer-journal', cs.numero);

  /* rfq-panier-fige */
  const patch = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${cs.id}/panier`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ clesStables: [extraCle] }),
    }),
  );
  assert(patch.status >= 400 && patch.status < 500, `panier figé ${patch.status} ${patch.text}`);
  assert(patch.body?.code === 'consultation.panier.fige', `code figé ${JSON.stringify(patch.body)}`);
  const still = await json(await fetch(`${API_BASE}/api/v1/consultations-achat/${cs.id}`, { headers: h }));
  assert(still.ok, `GET après patch ${still.status}`);
  assert(
    Array.isArray(still.body.clesStables) && !still.body.clesStables.includes(extraCle),
    `panier muté ${JSON.stringify(still.body.clesStables)}`,
  );
  console.log('PASS rfq-panier-fige');

  /* rfq-renvoi-nouveaux */
  const afterDest = await addDest(h, cs.id, holcim.id);
  assert((afterDest.destinataires ?? []).length === 3, `dest après ajout ${(afterDest.destinataires ?? []).length}`);
  assert((afterDest.envois ?? []).length === 2, 'ajout dest a journalisé');
  const resent = await envoyer(h, cs.id);
  assert(resent.status === 200, `renvoi nouveaux ${resent.status} ${resent.text}`);
  const journal = resent.body?.envois ?? [];
  assert(journal.length === 3, `journal après renvoi ${journal.length}`);
  assert(
    journal.some((e) => e.email === `h-${suffix}@holcim.example`),
    `mail holcim absent ${JSON.stringify(journal)}`,
  );
  console.log('PASS rfq-renvoi-nouveaux');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const uiCs = await createConsultation(h, article);
    const frnUi1 = await createPartner(h, `${suffix}b`, 'Cimpor');
    const frnUi2 = await createPartner(h, `${suffix}c`, 'Atlas');
    const frnUi3 = await createPartner(h, `${suffix}d`, 'Beton');
    await createContact(h, frnUi1.id, 'C. Mail', `c-${suffix}@cimpor.example`);
    await createContact(h, frnUi2.id, 'A. Mail', `a-${suffix}@atlas.example`);
    await createContact(h, frnUi3.id, 'B. Mail', `b-${suffix}@beton.example`);
    await addDest(h, uiCs.id, frnUi1.id);
    await addDest(h, uiCs.id, frnUi2.id);

    await page.goto(`${APP_BASE}/achats/consultations/${uiCs.id}`, { waitUntil: 'domcontentloaded' });
    const fiche = page.getByTestId('consultation-achat-fiche');
    await fiche.waitFor({ timeout: 25000 });
    const cta = page.getByTestId('consultation-envoyer');
    const ctaBtn = cta.locator('button');
    await cta.waitFor({ timeout: 10000 });
    assert(!(await ctaBtn.isDisabled()), 'CTA Envoyer désactivé avec 2 dest non envoyés');
    await cta.click();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="consultation-journal-row"]').length >= 2,
      null,
      { timeout: 15000 },
    );
    await page.getByTestId('consultation-panier-fige').waitFor({ timeout: 8000 });
    await page.waitForFunction(
      () => document.querySelector('[data-testid="consultation-envoyer"] button')?.disabled === true,
      null,
      { timeout: 8000 },
    );

    const patchUi = await json(
      await fetch(`${API_BASE}/api/v1/consultations-achat/${uiCs.id}/panier`, {
        method: 'PATCH',
        headers: h,
        body: JSON.stringify({ clesStables: [extraCle] }),
      }),
    );
    assert(patchUi.status >= 400 && patchUi.status < 500, `browser panier figé ${patchUi.status}`);

    const section = page.getByTestId('consultation-destinataires');
    await selectFournisseur(page, section, frnUi3);
    await section.getByTestId('consultation-destinataire-add').click();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="consultation-destinataire-row"]').length >= 3,
      null,
      { timeout: 10000 },
    );
    await page.waitForFunction(
      () => document.querySelector('[data-testid="consultation-envoyer"] button')?.disabled === false,
      null,
      { timeout: 8000 },
    );
    await cta.click();
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="consultation-journal-row"]').length >= 3,
      null,
      { timeout: 15000 },
    );
    console.log('PASS rfq-envoyer-journal (browser)');
  } finally {
    await browser.close();
  }

  console.log('OK verify-consultation-rfq-280 AC-8…AC-10');
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
