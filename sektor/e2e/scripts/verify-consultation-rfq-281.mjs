/**
 * SEKTOR-281 — Suivi + devis par fournisseur + statut dérivé (AC-11…AC-15).
 * Run: node sektor/e2e/scripts/verify-consultation-rfq-281.mjs
 *
 * Scénarios CONTRAT : rfq-import-un-destinataire · rfq-second-devis-complet · rfq-listing-kn
 * Owner Mode B : qa@nafuralabs.local. Graphe : 2 dest avec mail, envoyer, import 1 puis 2.
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
  const cols = read('sources/web/app/achats/consultations/config/listing/columns.ts');
  const sql = read(
    'sources/backend/achats/src/main/resources/db/changelog/schema/v1.1/008_consultation_achat_devis_destinataire.sql',
  );
  const handler = read(
    'sources/web/app/socle/shared/smart-import/handlers/devis-consultation-import.handler.ts',
  );
  assert(html.includes('consultation-destinataire-import'), 'CTA import par ligne absent');
  assert(html.includes('nf-smart-import-trigger'), 'nf-smart-import-trigger absent');
  assert(ts.includes('destinataireId'), 'persist sans destinataireId');
  assert(!/key:\s*'fournisseur'/.test(cols), 'listing : colonne fournisseur unique encore là');
  assert(cols.includes('destinatairesLabel') || cols.includes('destinataires'), 'listing destinataires absent');
  assert(cols.includes('avancementLabel') || cols.includes('avancement'), 'listing k/n avancement absent');
  assert(sql.includes('destinataire_id UUID NOT NULL'), 'changelog destinataire_id NOT NULL absent');
  assert(handler.includes("key: 'devis-consultation'"), 'moteur 135 devis-consultation cassé');
  const importBlock = html.match(
    /<section[^>]*data-testid="consultation-achat-import"[\s\S]*?<\/section>/,
  );
  if (importBlock) {
    assert(
      !/nf-smart-import-trigger/.test(importBlock[0]),
      'import magique orphelin encore sur le bloc global',
    );
  }
  console.log('PASS rfq-import-un-destinataire (source)');
}

async function createPartner(h, suffix, label) {
  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRN281${label}${suffix}`.slice(0, 30),
        raisonSociale: `${label} QA 281 ${suffix}`,
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
  const slug = `ciment-qa281-${suffix}`;
  const created = await json(
    await fetch(`${API_BASE}/api/v1/items`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: slug,
        name: `Ciment QA 281 ${suffix}`,
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

async function addDest(h, consultationId, fournisseurId) {
  const res = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${consultationId}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fournisseurId }),
    }),
  );
  assert(res.status === 201, `destinataire ${res.status} ${res.text}`);
  return res.body;
}

function destOf(body, fournisseurId) {
  return (body.destinataires ?? []).find((d) => d.fournisseurId === fournisseurId);
}

const LIGNES_CIMENT = [
  {
    identite: 'ciment-cpj-45',
    libelle: 'Ciment CPJ 45',
    quantite: 12,
    unite: 't',
    prixUnitaire: 1083.75,
  },
];

async function importDevis(h, consultationId, destinataireId, fichierNom) {
  return json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${consultationId}/devis`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ destinataireId, fichierNom, lignes: LIGNES_CIMENT }),
    }),
  );
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
  const sika = await createPartner(h, suffix, 'Sika');
  await createContact(h, lafarge.id, 'A. Benali', `achat-${suffix}@lafarge.example`);
  await createContact(h, sika.id, 'M. Kadiri', `devis-${suffix}@sika.example`);

  const cs = await createConsultation(h, article);
  await addDest(h, cs.id, lafarge.id);
  const withTwo = await addDest(h, cs.id, sika.id);
  const destLafarge = destOf(withTwo, lafarge.id);
  const destSika = destOf(withTwo, sika.id);
  assert(destLafarge?.id && destSika?.id, `dest ids ${JSON.stringify(withTwo.destinataires)}`);

  const sent = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${cs.id}/envoyer`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({}),
    }),
  );
  assert(sent.status === 200, `envoyer ${sent.status} ${sent.text}`);
  assert(sent.body.statut === 'OUVERTE', `statut après envoi ${sent.body.statut}`);

  const orphan = await importDevis(h, cs.id, undefined, 'orphelin.pdf');
  assert(orphan.status >= 400 && orphan.status < 500, `orphelin ${orphan.status} ${orphan.text}`);

  /* rfq-import-un-destinataire */
  const first = await importDevis(h, cs.id, destLafarge.id, 'devis-lafarge.pdf');
  assert(first.status === 201, `import 1 ${first.status} ${first.text}`);
  assert(first.body.statut === 'PARTIELLE', `rfq-import-un-destinataire statut ${first.body.statut}`);
  assert(first.body.devisRecus === 1, `devisRecus ${first.body.devisRecus}`);
  const afterFirst = first.body.destinataires ?? [];
  assert(
    afterFirst.find((d) => d.id === destLafarge.id)?.statut === 'DEVIS_RECU',
    `Lafarge statut ${JSON.stringify(afterFirst)}`,
  );
  assert(
    afterFirst.find((d) => d.id === destSika.id)?.statut === 'EN_ATTENTE',
    `Sika encore EN_ATTENTE ${JSON.stringify(afterFirst)}`,
  );
  console.log('PASS rfq-import-un-destinataire', cs.numero);

  /* rfq-second-devis-complet */
  const second = await importDevis(h, cs.id, destSika.id, 'devis-sika.pdf');
  assert(second.status === 201, `import 2 ${second.status} ${second.text}`);
  assert(second.body.statut === 'COMPLETE', `rfq-second-devis-complet statut ${second.body.statut}`);
  assert(second.body.devisRecus === 2, `devisRecus ${second.body.devisRecus}`);
  assert(
    (second.body.destinataires ?? []).every((d) => d.statut === 'DEVIS_RECU'),
    `dest pas tous DEVIS_RECU ${JSON.stringify(second.body.destinataires)}`,
  );
  const replay = await importDevis(h, cs.id, destLafarge.id, 'devis-lafarge-v2.pdf');
  assert(replay.status === 201, `re-import ${replay.status} ${replay.text}`);
  assert(replay.body.statut === 'COMPLETE', `re-import a cassé COMPLETE ${replay.body.statut}`);
  assert(replay.body.devisRecus === 2, `re-import devisRecus ${replay.body.devisRecus}`);
  console.log('PASS rfq-second-devis-complet');

  /* rfq-listing-kn */
  const listed = await json(await fetch(`${API_BASE}/api/v1/consultations-achat`, { headers: h }));
  assert(listed.ok, `listing ${listed.status} ${listed.text}`);
  const row = Array.isArray(listed.body) ? listed.body.find((r) => r.id === cs.id) : null;
  assert(row, 'listing : consultation absente');
  assert(row.statut === 'COMPLETE', `listing statut ${row.statut}`);
  assert(row.devisRecus === 2, `listing devisRecus ${row.devisRecus}`);
  const names = (row.destinataires ?? []).map((d) => d.fournisseurNom).filter(Boolean);
  assert(names.length >= 2, `listing destinataires ${JSON.stringify(row.destinataires)}`);
  assert(
    names.every((n) => !/^[0-9a-f-]{36}$/i.test(n)),
    `listing UUID ${JSON.stringify(names)}`,
  );
  assert(
    names.some((n) => /Lafarge/i.test(n)) && names.some((n) => /Sika/i.test(n)),
    `listing libellés ${JSON.stringify(names)}`,
  );
  console.log('PASS rfq-listing-kn (api)');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${APP_BASE}/achats/consultations/${cs.id}`, { waitUntil: 'domcontentloaded' });
    const fiche = page.getByTestId('consultation-achat-fiche');
    await fiche.waitFor({ timeout: 25000 });
    const perRow = page.getByTestId('consultation-destinataire-import');
    await perRow.first().waitFor({ timeout: 10000 });
    assert((await perRow.count()) >= 2, `trigger par ligne ${(await perRow.count())}`);
    assert(
      (await page.locator('[data-testid="consultation-achat-import"] nf-smart-import-trigger').count()) === 0,
      'trigger encore dans le bloc global',
    );

    await page.goto(`${APP_BASE}/achats/consultations`, { waitUntil: 'domcontentloaded' });
    const list = page.getByTestId('consultation-achat-list');
    await list.waitFor({ timeout: 25000 });
    await page.getByText(cs.numero, { exact: false }).first().waitFor({ timeout: 15000 });
    const bodyText = await list.innerText();
    assert(/2\/2/.test(bodyText), `listing k/n absent (${cs.numero}) : ${bodyText.slice(0, 400)}`);
    assert(
      /Complète|Complete|COMPLETE|مكتملة/i.test(bodyText),
      `listing badge COMPLETE absent : ${bodyText.slice(0, 400)}`,
    );
    assert(
      /Lafarge/i.test(bodyText) && /Sika/i.test(bodyText),
      `listing libellés destinataires absents : ${bodyText.slice(0, 400)}`,
    );
    console.log('PASS rfq-listing-kn (browser)');
  } finally {
    await browser.close();
  }

  console.log('OK verify-consultation-rfq-281 AC-11…AC-15');
}

main().catch((err) => {
  console.error('FAIL', err.message || err);
  process.exit(1);
});
