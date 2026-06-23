#!/usr/bin/env node
/**
 * Tests de `check-i18n-parity.mjs`.
 *
 * Exécution :
 *   cd web && node --test scripts/check-i18n-parity.spec.mjs
 *
 * Utilise des fixtures JSON inline matérialisées dans un dossier temporaire
 * (`os.tmpdir`). Aucun fichier de prod n'est touché.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  flatten,
  isWhitelistedIdentical,
  analyzePack,
  isReferenced,
  parseArgs,
  runAnalysis,
} from './check-i18n-parity.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(__dirname, 'check-i18n-parity.mjs');

/**
 * Crée un dossier temporaire avec une structure i18n virtuelle.
 *
 * @param {Record<string, Record<string, unknown>>} layout
 *   `{ "core": { fr: {...}, en: {...} }, "applications/erp": { fr: {...}, en: {...}, ar: {...} } }`
 * @returns {Promise<{ root: string, cleanup: () => Promise<void> }>}
 */
async function makeI18nFixtures(layout) {
  const root = await mkdtemp(join(tmpdir(), 'nafura-i18n-test-'));
  for (const [packId, langs] of Object.entries(layout)) {
    const packDir = join(root, ...packId.split('/'));
    await mkdir(packDir, { recursive: true });
    for (const [lang, content] of Object.entries(langs)) {
      await writeFile(join(packDir, `${lang}.json`), JSON.stringify(content, null, 2), 'utf8');
    }
  }
  return {
    root,
    cleanup: async () => {
      await rm(root, { recursive: true, force: true });
    },
  };
}

// ---------------------------------------------------------------------------
// Tests unitaires des fonctions pures
// ---------------------------------------------------------------------------

test('flatten — aplatissement récursif des objets imbriqués', () => {
  const out = flatten({
    factures: {
      actions: { emit: 'Émettre', cancel: 'Annuler' },
      status: { brouillon: 'Brouillon' },
    },
    common: { save: 'Enregistrer' },
  });
  assert.deepEqual(out, {
    'factures.actions.emit': 'Émettre',
    'factures.actions.cancel': 'Annuler',
    'factures.status.brouillon': 'Brouillon',
    'common.save': 'Enregistrer',
  });
});

test('flatten — gère les valeurs primitives non-string', () => {
  const out = flatten({ a: { b: 1, c: true, d: null } });
  assert.equal(out['a.b'], 1);
  assert.equal(out['a.c'], true);
  assert.equal(out['a.d'], null);
});

test('isWhitelistedIdentical — acronymes MA whitelistés', () => {
  assert.equal(isWhitelistedIdentical('ICE'), true);
  assert.equal(isWhitelistedIdentical('RIB'), true);
  assert.equal(isWhitelistedIdentical('TVA'), true);
  assert.equal(isWhitelistedIdentical('MAD'), true);
});

test('isWhitelistedIdentical — codes alphanumériques majuscules tolérés', () => {
  assert.equal(isWhitelistedIdentical('ABC-123'), true);
  assert.equal(isWhitelistedIdentical('ID_42'), true);
  assert.equal(isWhitelistedIdentical('1.0.0'), true);
});

test('isWhitelistedIdentical — mots français non whitelistés', () => {
  assert.equal(isWhitelistedIdentical('Brouillon'), false);
  assert.equal(isWhitelistedIdentical('Annuler'), false);
  // NOTE Phase 5.3 — `Description` est désormais cognate FR/EN ; on teste
  // ici un autre vrai mot français qui doit rester détecté comme suspect.
  assert.equal(isWhitelistedIdentical('Émettre'), false);
});

test('isWhitelistedIdentical — string vide non whitelistée', () => {
  assert.equal(isWhitelistedIdentical(''), false);
  assert.equal(isWhitelistedIdentical('   '), false);
});

// ---------------------------------------------------------------------------
// Phase 5.3 — Whitelist enrichie (cognates FR/EN + multi-mots PascalCase)
// ---------------------------------------------------------------------------

test('isWhitelistedIdentical — cognates FR/EN tolérés (orthographe identique)', () => {
  // Mots dont l'orthographe est strictement identique en FR et EN.
  // Voir COGNATE_WHITELIST dans check-i18n-parity.mjs.
  assert.equal(isWhitelistedIdentical('Code'), true);
  assert.equal(isWhitelistedIdentical('Notes'), true);
  assert.equal(isWhitelistedIdentical('Email'), true);
  assert.equal(isWhitelistedIdentical('Total'), true);
  assert.equal(isWhitelistedIdentical('Configuration'), true);
  assert.equal(isWhitelistedIdentical('Description'), true);
  // La comparaison est case-insensitive (on whitelist `code` aussi bien que `Code`).
  assert.equal(isWhitelistedIdentical('code'), true);
  assert.equal(isWhitelistedIdentical('NOTES'), true);
});

test('isWhitelistedIdentical — multi-mots PascalCase tolérés (libellés Java-derived)', () => {
  // Pattern : chaque token est cognate OU acronyme OU pattern technique.
  assert.equal(isWhitelistedIdentical('Item Id'), true);
  assert.equal(isWhitelistedIdentical('Stock Balances'), true);
  assert.equal(isWhitelistedIdentical('Effective Date'), true);
  assert.equal(isWhitelistedIdentical('Inventory Tx Lines'), true);
  assert.equal(isWhitelistedIdentical('Cost Center Id'), true);
  assert.equal(isWhitelistedIdentical('Currency Id'), true);
  assert.equal(isWhitelistedIdentical('Approved By'), true);
  assert.equal(isWhitelistedIdentical('Tax Code Id'), true);
  assert.equal(isWhitelistedIdentical('Exchange Rates'), true);
  assert.equal(isWhitelistedIdentical('Line Total'), true);
  assert.equal(isWhitelistedIdentical('Unit Price'), true);
  assert.equal(isWhitelistedIdentical('Min Quantity'), true);
});

test('isWhitelistedIdentical — ponctuation / typographie / placeholders tolérés', () => {
  // Ponctuation pure : em-dash, ellipsis, signes math/flèches.
  assert.equal(isWhitelistedIdentical('—'), true);
  assert.equal(isWhitelistedIdentical('…'), true);
  assert.equal(isWhitelistedIdentical('...'), true);
  assert.equal(isWhitelistedIdentical('→'), true);
  assert.equal(isWhitelistedIdentical('/'), true);
  // Placeholders ICU / template tokens isolés.
  assert.equal(isWhitelistedIdentical('{count}'), true);
  assert.equal(isWhitelistedIdentical('{{value}}'), true);
});

test('isWhitelistedIdentical — vrais mots français pas whitelistés (négatif)', () => {
  // Ces mots ont une orthographe différente en EN et DOIVENT rester
  // détectés comme suspects (ce sont de vrais cas à traduire ou acter).
  assert.equal(isWhitelistedIdentical('Société'), false);
  assert.equal(isWhitelistedIdentical('Marchés'), false);
  assert.equal(isWhitelistedIdentical('Brouillon'), false);
  assert.equal(isWhitelistedIdentical('Annuler'), false);
  // Faux cognates : multi-mots dont au moins un token n'est PAS whitelisté.
  assert.equal(isWhitelistedIdentical('Société Anonyme'), false);
  assert.equal(isWhitelistedIdentical('Bénéficiaire Final'), false);
});

// ---------------------------------------------------------------------------
// Wave E3 — patterns regex / URL / email / téléphone / brand / ICU / stubs
// ---------------------------------------------------------------------------

test('isWhitelistedIdentical — symboles + abréviations universels (E3)', () => {
  // Numéro symbole "N°", abréviations courtes "Cat.", "Ver."
  assert.equal(isWhitelistedIdentical('N°'), true);
  assert.equal(isWhitelistedIdentical('Cat.'), true);
  assert.equal(isWhitelistedIdentical('Ver.'), true);
  assert.equal(isWhitelistedIdentical('Hist.'), true);
  // Marques + loanwords courts listés au brief E3.
  assert.equal(isWhitelistedIdentical('Excel'), true);
  assert.equal(isWhitelistedIdentical('Lot'), true);
  assert.equal(isWhitelistedIdentical('Litres'), true);
  assert.equal(isWhitelistedIdentical('Auto'), true);
  assert.equal(isWhitelistedIdentical('Stable'), true);
  assert.equal(isWhitelistedIdentical('Match'), true);
  assert.equal(isWhitelistedIdentical('Padding'), true);
});

test('isWhitelistedIdentical — URLs, emails, téléphones, identifiers (E3)', () => {
  // URL prefix universellement identique FR/EN.
  assert.equal(isWhitelistedIdentical('https://example.com'), true);
  assert.equal(isWhitelistedIdentical('http://localhost:8080'), true);
  // Adresse e-mail (placeholder identique).
  assert.equal(isWhitelistedIdentical('cabinet@expertise-comptable.ma'), true);
  assert.equal(isWhitelistedIdentical('contact@nafura.io'), true);
  // Téléphone international.
  assert.equal(isWhitelistedIdentical('+212 6 12 34 56 78'), true);
  // Identifier dot-séparé (préfixe de permission RBAC).
  assert.equal(isWhitelistedIdentical('inventory.article.read'), true);
  assert.equal(isWhitelistedIdentical('core.application.title'), true);
});

test('isWhitelistedIdentical — brand Nafura whitelistée (E3)', () => {
  assert.equal(isWhitelistedIdentical('Nafura'), true);
  assert.equal(isWhitelistedIdentical('Nafura ERP'), true);
  assert.equal(isWhitelistedIdentical('Nafura Core ERP'), true);
  assert.equal(isWhitelistedIdentical('Nafura SA'), true);
});

test('isWhitelistedIdentical — placeholders ICU / templates runtime (E3)', () => {
  // Templates pure (toujours identiques FR/EN).
  assert.equal(
    isWhitelistedIdentical('{count, plural, =0 {Aucun} one {1} other {#}}'),
    true,
  );
  // Templates avec résidu unité courte (`{n}h`, `{value} pts`).
  assert.equal(isWhitelistedIdentical('{n}h'), true);
  assert.equal(isWhitelistedIdentical('{value} pts'), true);
});

test('isWhitelistedIdentical — codes alphanumériques mixtes (E3)', () => {
  // Codes mock data avec lettre + chiffre quelque part.
  assert.equal(isWhitelistedIdentical('Art.187'), true);
  assert.equal(isWhitelistedIdentical('CH-001'), true);
  assert.equal(isWhitelistedIdentical('V2.0'), true);
  // Ponctuation + symboles graphiques (delta, flèches).
  assert.equal(isWhitelistedIdentical('⚠ Δ ='), true);
  // Multi-mot avec symbole + tokens techniques tous whitelistés.
  assert.equal(isWhitelistedIdentical('↺ Revert seed'), true);
});

test('isWhitelistedIdentical — Java entity stubs tolérés en standalone (E3)', () => {
  // Pragmatic — voir STUB_JAVA_TOKEN_WHITELIST + COVERAGE.md.
  // Ces tokens apparaissent EXCLUSIVEMENT dans `domains/core/*` scaffolds.
  assert.equal(isWhitelistedIdentical('Cities'), true);
  assert.equal(isWhitelistedIdentical('Countries'), true);
  assert.equal(isWhitelistedIdentical('Currencies'), true);
  assert.equal(isWhitelistedIdentical('Departments'), true);
  assert.equal(isWhitelistedIdentical('Employees'), true);
  assert.equal(isWhitelistedIdentical('Geography'), true);
  // Multi-mots scaffolds (chaque token whitelisté via les sets cumulés).
  assert.equal(isWhitelistedIdentical('Disposition Codes'), true);
  assert.equal(isWhitelistedIdentical('Stock Balances'), true);
});

test('isWhitelistedIdentical — mots français pas absorbés par stubs E3 (négatif)', () => {
  // Sanity check — les stubs ne doivent pas relâcher la détection sur les
  // vrais mots français qui doivent être traduits.
  assert.equal(isWhitelistedIdentical('Société'), false);
  assert.equal(isWhitelistedIdentical('Émettre'), false);
  assert.equal(isWhitelistedIdentical('Bénéficiaire'), false);
  assert.equal(isWhitelistedIdentical('Réception'), false);
});

test('isReferenced — clé directe + préfixes dot-séparés', () => {
  const usage = new Set(['common.actions.save', 'factures.list']);
  assert.equal(isReferenced('common.actions.save', usage), true);
  assert.equal(isReferenced('factures.list.empty', usage), true); // matché par préfixe
  assert.equal(isReferenced('rh.empty', usage), false);
});

test('parseArgs — flags CLI tous reconnus', () => {
  assert.deepEqual(
    parseArgs(['--json', '--check-usage', '--pack=core', '--lang=fr', '--quiet', '--ar-strict']),
    {
      json: true,
      checkUsage: true,
      pack: 'core',
      lang: 'fr',
      quiet: true,
      arStrict: true,
    },
  );
  assert.deepEqual(parseArgs([]), {
    json: false,
    checkUsage: false,
    pack: null,
    lang: null,
    quiet: false,
    arStrict: false,
  });
});

// ---------------------------------------------------------------------------
// Cas requis par le brief (1 → 8)
// ---------------------------------------------------------------------------

test('cas 1 — détecte clé manquante en EN', () => {
  const fr = flatten({ a: { b: 'Bonjour', c: 'Adieu' } });
  const en = flatten({ a: { b: 'Hello' } });
  const r = analyzePack('demo', fr, en);
  assert.deepEqual(r.missing_in_en, ['a.c']);
  assert.deepEqual(r.missing_in_fr, []);
});

test('cas 2 — détecte clé manquante en FR', () => {
  const fr = flatten({ a: { b: 'Bonjour' } });
  const en = flatten({ a: { b: 'Hello', c: 'Goodbye' } });
  const r = analyzePack('demo', fr, en);
  assert.deepEqual(r.missing_in_fr, ['a.c']);
  assert.deepEqual(r.missing_in_en, []);
});

test('cas 3 — détecte valeur identique non whitelistée (suspect non traduit)', () => {
  const fr = flatten({ a: 'Brouillon', b: 'Hello' });
  const en = flatten({ a: 'Brouillon', b: 'Hello' });
  const r = analyzePack('demo', fr, en);
  // Les deux clés ont une valeur identique mais "Hello" est trop court et
  // "Brouillon" est mot FR → tous les deux sont signalés
  assert.deepEqual(r.identical_values.sort(), ['a', 'b']);
});

test('cas 4 — tolère valeur identique whitelistée (acronyme MA)', () => {
  const fr = flatten({ a: 'ICE', b: 'TVA', c: 'BC-2024-001' });
  const en = flatten({ a: 'ICE', b: 'TVA', c: 'BC-2024-001' });
  const r = analyzePack('demo', fr, en);
  assert.deepEqual(r.identical_values, []);
});

test('cas 5 — détecte valeur vide → ERROR', () => {
  const fr = flatten({ a: '', b: 'Bonjour' });
  const en = flatten({ a: 'Hello', b: '' });
  const r = analyzePack('demo', fr, en);
  assert.deepEqual(r.empty_values.sort(), ['en:b', 'fr:a']);
});

test('cas 6 — aplatissement récursif compare les clés profondes correctement', () => {
  const fr = flatten({
    factures: {
      actions: { emit: 'Émettre', cancel: 'Annuler' },
      status: { draft: 'Brouillon' },
    },
  });
  const en = flatten({
    factures: {
      actions: { emit: 'Issue' }, // manque cancel
      status: { draft: 'Draft', sent: 'Sent' }, // sent en trop côté EN
    },
  });
  const r = analyzePack('demo', fr, en);
  assert.deepEqual(r.missing_in_en, ['factures.actions.cancel']);
  assert.deepEqual(r.missing_in_fr, ['factures.status.sent']);
});

test('cas 7 — exit code 1 si errors > 0, 0 sinon (test process)', async (t) => {
  const { root: rootBad, cleanup: cleanupBad } = await makeI18nFixtures({
    core: {
      fr: { a: 'Bonjour', b: 'Adieu' },
      en: { a: 'Hello' }, // manque b → ERROR
    },
  });
  t.after(cleanupBad);
  const codeBad = await runScript(['--quiet'], { NAFURA_I18N_ROOT: rootBad });
  assert.equal(codeBad, 1, 'doit sortir avec code 1 quand errors > 0');

  const { root: rootOk, cleanup: cleanupOk } = await makeI18nFixtures({
    core: {
      fr: { a: 'Bonjour' },
      en: { a: 'Hello' },
    },
  });
  t.after(cleanupOk);
  const codeOk = await runScript(['--quiet'], { NAFURA_I18N_ROOT: rootOk });
  assert.equal(codeOk, 0, 'doit sortir avec code 0 quand aucune erreur');
});

test('cas 8 — sortie JSON valide quand --json', async (t) => {
  const { root, cleanup } = await makeI18nFixtures({
    core: {
      fr: { a: 'Bonjour', b: 'Adieu' },
      en: { a: 'Hello' }, // manque b
    },
    'applications/erp': {
      fr: { actions: { save: 'Enregistrer' } },
      en: { actions: { save: 'Save' } },
    },
  });
  t.after(cleanup);
  const { code, stdout } = await runScriptCapture(['--json'], { NAFURA_I18N_ROOT: root });
  assert.equal(code, 1);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.summary.packs, 2);
  assert.ok(parsed.summary.errors >= 1, 'doit reporter au moins 1 error');
  assert.ok(Array.isArray(parsed.packs));
  const corePack = parsed.packs.find((p) => p.pack === 'core');
  assert.deepEqual(corePack.missing_in_en, ['b']);
});

// ---------------------------------------------------------------------------
// Tests d'intégration additionnels
// ---------------------------------------------------------------------------

test('runAnalysis — pack monolingue détecté comme WARN', async (t) => {
  const { root, cleanup } = await makeI18nFixtures({
    'orphan-pack': {
      fr: { a: 'Bonjour' },
      // pas d'EN
    },
    duo: {
      fr: { a: 'Bonjour' },
      en: { a: 'Hello' },
    },
  });
  t.after(cleanup);
  const r = await runAnalysis({ i18nRoot: root });
  assert.equal(r.monolingual_packs.length, 1);
  assert.equal(r.monolingual_packs[0].pack, 'orphan-pack');
  assert.equal(r.summary.errors, 0, 'monolingue ne doit PAS produire d\'ERROR');
  assert.ok(r.summary.warnings >= 1);
});

test('runAnalysis — AR comptabilisé en INFO uniquement (jamais ERROR)', async (t) => {
  const { root, cleanup } = await makeI18nFixtures({
    core: {
      fr: { a: 'Bonjour', b: 'Adieu', c: 'Salut' },
      en: { a: 'Hello', b: 'Goodbye', c: 'Hi' },
      ar: { a: 'مرحبا' }, // énormément manquant en AR
    },
  });
  t.after(cleanup);
  const r = await runAnalysis({ i18nRoot: root });
  assert.equal(r.summary.errors, 0);
  assert.equal(r.summary.info, 1);
  assert.equal(r.ar_info[0].ar_count, 1);
  assert.equal(r.ar_info[0].fr_count, 3);
});

// ---------------------------------------------------------------------------
// Round 2 Phase 2 — flag --ar-strict (opt-in, NOT activé en CI Round 1)
// ---------------------------------------------------------------------------

test('runAnalysis — --ar-strict OFF par défaut : AR reste INFO-only', async (t) => {
  const { root, cleanup } = await makeI18nFixtures({
    core: {
      fr: { a: 'Bonjour', b: 'Adieu' },
      en: { a: 'Hello', b: 'Goodbye' },
      ar: { a: 'مرحبا' }, // 1/2 manquant en AR
    },
  });
  t.after(cleanup);
  const r = await runAnalysis({ i18nRoot: root });
  // AR partiel ne doit générer aucun warning quand --ar-strict est OFF.
  assert.equal(r.summary.warnings, 0);
  assert.equal(r.summary.ar_strict, false);
  assert.deepEqual(r.packs[0].ar_missing_keys, []);
});

test('runAnalysis — --ar-strict ON détecte les clés AR manquantes en WARN', async (t) => {
  const { root, cleanup } = await makeI18nFixtures({
    core: {
      fr: { a: 'Bonjour', b: 'Adieu', c: 'Salut' },
      en: { a: 'Hello', b: 'Goodbye', c: 'Hi' },
      ar: { a: 'مرحبا' }, // 2/3 manquants
    },
    finance: {
      fr: { x: 'Solde' },
      en: { x: 'Balance' },
      // pas de ar.json → toutes les clés FR manquent en AR
    },
  });
  t.after(cleanup);
  const r = await runAnalysis({ i18nRoot: root, arStrict: true });
  assert.equal(r.summary.errors, 0, 'AR ne doit jamais devenir ERROR');
  assert.equal(r.summary.ar_strict, true);
  // 2 (core: b, c) + 1 (finance: x) = 3 warnings AR
  assert.ok(r.summary.warnings >= 3, `expected ≥ 3 warnings, got ${r.summary.warnings}`);
  const corePack = r.packs.find((p) => p.pack === 'core');
  assert.deepEqual(corePack.ar_missing_keys, ['b', 'c']);
  const financePack = r.packs.find((p) => p.pack === 'finance');
  assert.deepEqual(financePack.ar_missing_keys, ['x']);
});

test('runAnalysis — --ar-strict OFF n\'émet aucun ar_missing_keys', async (t) => {
  const { root, cleanup } = await makeI18nFixtures({
    core: {
      fr: { a: 'Bonjour', b: 'Adieu' },
      en: { a: 'Hello', b: 'Goodbye' },
      // pas de ar.json
    },
  });
  t.after(cleanup);
  const r = await runAnalysis({ i18nRoot: root });
  // Mode par défaut : AR absent ne génère pas de warning.
  assert.equal(r.summary.warnings, 0);
  assert.deepEqual(r.packs[0].ar_missing_keys, []);
});

test('runAnalysis — filtre --pack restreint le scope', async (t) => {
  const { root, cleanup } = await makeI18nFixtures({
    core: { fr: { a: 'A' }, en: { a: 'A' } },
    finance: { fr: { x: 'X' }, en: { x: 'X' } },
  });
  t.after(cleanup);
  const r = await runAnalysis({ i18nRoot: root, packFilter: 'core' });
  assert.equal(r.packs.length, 1);
  assert.equal(r.packs[0].pack, 'core');
});

// ---------------------------------------------------------------------------
// Helpers d'exécution sous-processus
// ---------------------------------------------------------------------------

function runScript(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT_PATH, ...args], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    child.on('exit', (code) => resolve(code ?? 0));
    child.on('error', reject);
  });
}

function runScriptCapture(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT_PATH, ...args], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => (stdout += b.toString('utf8')));
    child.stderr.on('data', (b) => (stderr += b.toString('utf8')));
    child.on('exit', (code) => resolve({ code: code ?? 0, stdout, stderr }));
    child.on('error', reject);
  });
}
