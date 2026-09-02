/**
 * SEKTOR-307/308/309 — Listing filtres RFQ, create nf-action-bar, overlay N destinataires.
 * Run: node sektor/e2e/scripts/verify-consultation-ux-listing-create-etude.mjs
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
const APP_BASE = process.env.NAFURA_QA_APP_BASE ?? 'http://127.0.0.1:4200';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../../sources/web/package.json'));
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
  const filters = read('sources/web/app/achats/consultations/config/listing/filters.ts');
  const listingCfg = read('sources/web/app/achats/consultations/config/listing/config.ts');
  const i18n = read('sources/web/public/assets/i18n/applications/erp/achats/fr.json');
  const html = read('sources/web/app/achats/consultations/consultation-create/consultation-create.page.html');
  const ts = read('sources/web/app/achats/consultations/consultation-create/consultation-create.page.ts');
  const overlay = read(
    'sources/web/app/etudes/dossiers/components/consultation-decompo-dialog/consultation-decompo-dialog.component.ts',
  );
  const api = read('sources/web/app/achats/consultations/services/consultation-achat-api.service.ts');
  const ctrl = read(
    'sources/backend/achats/src/main/java/ma/nafura/achats/api/controller/ConsultationAchatController.java',
  );

  assert(filters.includes("key: 'statut'"), 'filtre statut absent');
  assert(filters.includes("lookupKey: 'fournisseurs'"), 'filtre fournisseur absent');
  assert(filters.includes("lookupKey: 'items'"), 'filtre article absent');
  assert(listingCfg.includes('achats.consultation.list.cta'), 'CTA listing key absente');
  assert(!/\+\s*Consultation/.test(i18n), 'i18n encore + Consultation');
  assert(html.includes('nf-action-bar'), 'create: nf-action-bar absent');
  assert(html.includes('icon="arrow-left"'), 'create: retour ghost absent');
  assert(ts.includes('canCreate'), 'create: canCreate absent');
  assert(html.includes('[disabled]="!canCreate() || saving()"'), 'create: Créer pas lié au panier');
  assert(!html.includes('lookupKey="fournisseurs"'), 'create: encore fournisseur');
  assert(overlay.includes('destinatairesLabel'), 'overlay: destinatairesLabel absent');
  assert(!/data-cs-pane="creer"[\s\S]{0,600}lookupKey="fournisseurs"/.test(overlay), 'overlay create: fournisseur unique');
  assert(api.includes('fournisseurId'), 'API listing fournisseurId absent');
  assert(api.includes('articleId'), 'API listing articleId absent');
  assert(ctrl.includes('UUID fournisseurId'), 'controller fournisseurId absent');
  console.log('PASS source listing/create/overlay');
}

async function createPartner(h, suffix, label) {
  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRNUX${label}${suffix}`.slice(0, 30),
        raisonSociale: `${label} QA UX ${suffix}`,
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
  assert(created.status === 201 || created.status === 200, `contact ${created.status} ${created.text}`);
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
    };
  }
  const slug = `ciment-qaux-${suffix}`;
  const created = await json(
    await fetch(`${API_BASE}/api/v1/items`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: slug,
        name: `Ciment QA UX ${suffix}`,
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
  };
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
  const lafarge = await createPartner(h, suffix, 'Lafarge');
  await createContact(h, lafarge.id, 'A. Benali', `achat-${suffix}@lafarge.example`);

  const created = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ clesStables: [article.cleStable] }),
    }),
  );
  assert(created.status === 201, `create ${created.status} ${created.text}`);
  const dest = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${created.body.id}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fournisseurId: lafarge.id }),
    }),
  );
  assert(dest.status === 201, `destinataire ${dest.status} ${dest.text}`);

  const byFrn = await json(
    await fetch(
      `${API_BASE}/api/v1/consultations-achat?fournisseurId=${lafarge.id}`,
      { headers: h },
    ),
  );
  assert(byFrn.ok && Array.isArray(byFrn.body), `filtre fournisseur ${byFrn.status}`);
  assert(
    byFrn.body.some((r) => r.id === created.body.id),
    `filtre fournisseur rate ${created.body.numero}`,
  );
  assert(
    byFrn.body.every((r) =>
      (r.destinataires ?? []).some((d) => d.fournisseurId === lafarge.id),
    ),
    'filtre fournisseur a laissé des consultations hors destinataire',
  );

  const byStatut = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat?statut=PREPARATION`, { headers: h }),
  );
  assert(byStatut.ok && Array.isArray(byStatut.body), `filtre statut ${byStatut.status}`);
  assert(
    byStatut.body.some((r) => r.id === created.body.id),
    'filtre statut PREPARATION rate',
  );
  assert(
    byStatut.body.every((r) => (r.statut || '').toUpperCase() === 'PREPARATION'),
    'filtre statut a laissé d’autres statuts',
  );

  const byArticle = await json(
    await fetch(
      `${API_BASE}/api/v1/consultations-achat?articleId=${article.id}`,
      { headers: h },
    ),
  );
  assert(byArticle.ok && Array.isArray(byArticle.body), `filtre article ${byArticle.status}`);
  assert(
    byArticle.body.some((r) => r.id === created.body.id),
    'filtre article rate',
  );
  assert(
    byArticle.body.every((r) => (r.clesStables ?? []).includes(article.cleStable)),
    'filtre article a laissé des paniers sans cet article',
  );

  const bySearch = await json(
    await fetch(
      `${API_BASE}/api/v1/consultations-achat?search=${encodeURIComponent(created.body.numero)}`,
      { headers: h },
    ),
  );
  assert(bySearch.ok && Array.isArray(bySearch.body), `search ${bySearch.status}`);
  assert(
    bySearch.body.some((r) => r.id === created.body.id),
    'search numero rate',
  );
  console.log('PASS API filtres fournisseur / article / statut / search');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${APP_BASE}/achats/consultations`, { waitUntil: 'domcontentloaded' });
    const list = page.getByTestId('consultation-achat-list');
    await list.waitFor({ timeout: 25000 });
    const cta = list.getByRole('button', { name: /nouvelle consultation/i }).first();
    await cta.waitFor({ timeout: 15000 });
    const ctaText = ((await cta.innerText()) ?? '').replace(/\s+/g, ' ').trim();
    assert(!/\+\s*\+/.test(ctaText), `CTA ++ encore là : ${ctaText}`);
    assert(!/^\+\s/.test(ctaText), `CTA encore préfixé + : ${ctaText}`);

    const numero = created.body.numero;
    await page.getByText(numero, { exact: false }).first().waitFor({ timeout: 15000 });
    const headersCount = await list.locator('th, [role="columnheader"]').count();
    assert(headersCount > 0, 'listing : aucun header de colonne');
    console.log('PASS listing CTA + lignes', numero);

    await page.goto(`${APP_BASE}/achats/consultations/new`, { waitUntil: 'domcontentloaded' });
    const form = page.getByTestId('consultation-create-form');
    await form.waitFor({ timeout: 25000 });
    const submit = form.getByTestId('consultation-create-submit');
    const submitBtn = submit.locator('button');
    assert(
      (await submitBtn.isDisabled()) || (await submit.getAttribute('aria-disabled')) === 'true',
      'Créer actif panier vide',
    );
    assert((await form.locator('nf-action-bar').count()) === 1, 'nf-action-bar absente');
    console.log('PASS create Créer disabled + action-bar');
  } finally {
    await browser.close();
  }

  console.log('OK verify-consultation-ux-listing-create-etude');
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
