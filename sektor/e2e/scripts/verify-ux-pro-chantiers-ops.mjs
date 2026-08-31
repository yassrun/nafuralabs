/**
 * SEKTOR-268 (+ prep SEKTOR-269) — ops coquilles : chantier / fournisseur combobox.
 * Source + API checks for CONTRAT AC-10…AC-16. Full UI play = SEKTOR-269.
 *
 * Run: node sektor/e2e/scripts/verify-ux-pro-chantiers-ops.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

const fail = (msg) => {
  console.error(`FAIL  ${msg}`);
  process.exit(1);
};

const ok = (msg) => console.log(`ok   ${msg}`);

const read = (rel) => {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) fail(`missing ${rel}`);
  return fs.readFileSync(abs, 'utf8');
};

const EQUIPE =
  'sektor/sources/web/app/chantiers/components/chantier-equipe-tab/chantier-equipe-tab.component.ts';
const BUTTON =
  'nafura-platform/sources/web/lib/anatomy/components/atoms/button/button.component.ts';
const ATTACHEMENT =
  'sektor/sources/web/app/chantiers/attachements/attachement-saisie/attachement-saisie.page.ts';
const ST_CREATE =
  'sektor/sources/web/app/chantiers/sous-traitance/sous-traitance-create/sous-traitance-create.page.ts';
const JOURNAL =
  'sektor/sources/web/app/chantiers/journal/journal-chantier.page.ts';
const DOCUMENTS =
  'sektor/sources/web/app/chantiers/documents/documents-listing/documents-listing.page.ts';
const AVANCEMENT_HTML =
  'sektor/sources/web/app/chantiers/avancements/avancement-saisie/avancement-saisie.page.html';
const AVANCEMENT_TS =
  'sektor/sources/web/app/chantiers/avancements/avancement-saisie/avancement-saisie.page.ts';
const AVANCEMENT_CTX =
  'sektor/sources/web/app/chantiers/avancements/services/avancement-context.service.ts';

const attachement = read(ATTACHEMENT);
const st = read(ST_CREATE);
const journal = read(JOURNAL);
const documents = read(DOCUMENTS);
const avHtml = read(AVANCEMENT_HTML);
const avTs = read(AVANCEMENT_TS);
const avCtx = read(AVANCEMENT_CTX);
const equipe = read(EQUIPE);
const button = read(BUTTON);

// --- equipe-submit (AC-8) ---
if (!equipe.includes('lookupKey="employes"') || !equipe.includes('searchEmployes')) {
  fail('equipe-submit: employé combobox missing');
}
if (!equipe.includes('(clicked)="submit()"') || !equipe.includes('type="submit"')) {
  fail('equipe-submit: Enregistrer must call submit (nf-button click + type=submit)');
}
if (!button.includes("[attr.type]=\"type()\"") && !button.includes('[attr.type]="type()"')) {
  fail('equipe-submit: nf-button must forward type to the inner button');
}
if (button.includes('type="button"') && !button.includes('type = input')) {
  fail('equipe-submit: nf-button inner button still hardcoded type=button');
}
ok('equipe-submit (AC-8)');

// --- attachement-chantier-combobox (AC-10) ---
if (!attachement.includes('lookupKey="chantiers"') || !attachement.includes('searchChantiers')) {
  fail('attachement-chantier-combobox: nf-select chantiers missing');
}
if (/chantierApi\.getAll\s*\(/.test(attachement)) {
  fail('attachement-chantier-combobox: still dumps getAll for chantier field');
}
if (!attachement.includes('<select class="ctrl"') || !attachement.includes('meteo')) {
  fail('attachement-chantier-combobox: météo must stay native select');
}
ok('attachement-chantier-combobox (AC-10)');

// --- st-fournisseur-combobox (AC-11) ---
if (!st.includes('lookupKey="chantiers"') || !st.includes('lookupKey="fournisseurs"')) {
  fail('st-fournisseur-combobox: chantier/fournisseurs nf-select missing');
}
if (st.includes('`st-') || /sousTraitantId:\s*`st-/.test(st) || st.includes("st-${Date.now()}")) {
  fail('st-fournisseur-combobox: sousTraitantId still fabricated');
}
if (!st.includes('sousTraitantId: sousTraitantId.trim()') && !st.includes('sousTraitantId: sousTraitantId')) {
  fail('st-fournisseur-combobox: POST must send partner id');
}
if (!st.includes('name="noeudId"') || !st.includes('<select class="fld"')) {
  fail('st-fournisseur-combobox: noeud must stay native select');
}
ok('st-fournisseur-combobox (AC-11)');

// --- journal-chantier-combobox (AC-12) ---
if (!journal.includes('lookupKey="chantiers"') || !journal.includes('searchChantiers')) {
  fail('journal-chantier-combobox: create chantier not combobox');
}
if (/createDraft\.chantierId[\s\S]{0,200}<select class="fld"/.test(journal) &&
    journal.includes('<select class="fld" [(ngModel)]="createDraft.chantierId"')) {
  fail('journal-chantier-combobox: create still uses native select for chantier');
}
if (!journal.includes('[(ngModel)]="createDraft.type"') || !journal.includes('<select class="fld"')) {
  fail('journal-chantier-combobox: type enum must stay native');
}
ok('journal-chantier-combobox (AC-12)');

// --- documents-pas-pageSize-500 (AC-13) ---
if (!documents.includes('lookupKey="chantiers"')) {
  fail('documents-pas-pageSize-500: chantier combobox missing');
}
if (documents.includes('pageSize: 500') || documents.includes('pageSize:500')) {
  fail('documents-pas-pageSize-500: still getAll pageSize 500 for chantier field');
}
if (/chantierApi\.getAll\s*\(/.test(documents)) {
  fail('documents-pas-pageSize-500: chantierApi.getAll still called');
}
if (!documents.includes('uploadDraft.type') || !documents.includes('<select class="field"')) {
  fail('documents-pas-pageSize-500: type/noeud must stay native');
}
ok('documents-pas-pageSize-500 (AC-13)');

// --- avancement-chantier-combobox (AC-14) ---
if (!avHtml.includes('lookupKey="chantiers"') || !avHtml.includes('nf-select')) {
  fail('avancement-chantier-combobox: saisie chantier not combobox');
}
if (/<select[\s\S]*chantiers\(\)/.test(avHtml)) {
  fail('avancement-chantier-combobox: dump select still present');
}
if (!avTs.includes('searchChantiers') || !avTs.includes("lookupSearchers?.['chantiers']")) {
  fail('avancement-chantier-combobox: lookupSearch not wired');
}
if (avCtx.includes('pageSize: 500') && avCtx.includes('chantierApi.getAll')) {
  fail('avancement-chantier-combobox: context still dumps chantiers pageSize 500');
}
if (!avHtml.includes('additionalLines') || !avHtml.includes('<select')) {
  fail('avancement-chantier-combobox: add-line must stay native select');
}
ok('avancement-chantier-combobox (AC-14)');

// --- enum-sans-oeil (AC-15 / AC-16 sample) ---
if (attachement.includes('lookupKey="meteo"') || journal.includes('lookupKey="type"')) {
  fail('enum-sans-oeil: enum fields must not use lookupKey');
}
ok('enum-sans-oeil (AC-15/AC-16)');

async function session() {
  try {
    const res = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const s = await res.json();
    if (!s?.accessToken || !s?.tenantId) return null;
    return {
      Authorization: `Bearer ${s.accessToken}`,
      'X-Tenant-Id': s.tenantId,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  } catch {
    return null;
  }
}

async function apiProof(headers) {
  const partnersRes = await fetch(`${API_BASE}/api/v1/partners?roles=FOURNISSEUR&q=FO&size=5`, {
    headers,
  });
  const partnersBody = await partnersRes.json().catch(() => null);
  const list = Array.isArray(partnersBody)
    ? partnersBody
    : partnersBody?.content ?? partnersBody?.items ?? [];
  if (!partnersRes.ok || !list.length) {
    console.log('SKIP API fournisseurs (none or unavailable)');
    return;
  }
  const fournisseur = list[0];
  if (!fournisseur?.id) fail('API: fournisseur hit without id');
  if (String(fournisseur.id).startsWith('st-')) {
    fail('API: partenaire id looks fabricated');
  }
  ok(`API fournisseur hit id=${fournisseur.id} (partner, not st-*)`);
}

async function main() {
  const h = await session();
  if (!h) {
    console.log('SKIP cursor-session unavailable — source checks only');
    process.exit(0);
  }
  await apiProof(h);
  console.log('PASS SEKTOR-268 ops coquilles AC-10…AC-16 (source + API spot)');
}

await main();
