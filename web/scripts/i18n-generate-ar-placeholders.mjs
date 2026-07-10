#!/usr/bin/env node
/**
 * i18n-generate-ar-placeholders.mjs
 *
 * Round 2 Phase 2 (sub-A) — squelette AR + RTL Nafura ERP.
 *
 * Génère un `ar.json` placeholder vide `{}` pour chaque pack qui possède
 * un `fr.json` mais pas encore de `ar.json`. Idempotent — n'écrase JAMAIS
 * un placeholder AR existant (`core/ar.json` et `applications/erp/ar.json`
 * sont les seuls historiques pré-existants, voir
 * `web/docs/specs/i18n-roadmap/00-PROGRESS.md`).
 *
 * Le squelette permet aux 60 packs FR d'avoir une couche AR vide
 * chargeable par le loader Angular (`ModuleTranslateLoader` est déjà
 * lang-agnostic — pattern `{path}/{lang}.json`). Quand AR est manquant
 * en runtime, ngx-translate fait fallback FR via `USE_DEFAULT_LANG=true`.
 *
 * La traduction massive FR → AR est traitée en Round 2 Phase 6 (vagues
 * `R2-T1` → `R2-T6`). Ce script ne traduit RIEN — il crée uniquement
 * les fichiers stubs `{}` requis par le loader Angular pour activer la
 * couche AR sans casser FR/EN existant.
 *
 * Usage :
 *   node scripts/i18n-generate-ar-placeholders.mjs            # écrit
 *   node scripts/i18n-generate-ar-placeholders.mjs --dry-run  # liste seulement
 *
 * Variables d'environnement (pour les tests) :
 *   NAFURA_I18N_ROOT    surcharge le dossier i18n racine
 *
 * Codes retour :
 *   0  — succès (fichiers créés ou déjà à jour)
 *   1  — erreur d'exécution (dossier illisible, écriture échouée…)
 *
 * Pure Node 20 ESM, zéro dépendance npm.
 */

import { readdir, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPT_ROOT = join(__dirname, '..');
const DEFAULT_I18N_ROOT = join(SCRIPT_ROOT, 'public', 'assets', 'i18n');

const SUPPORTED_LANGS = new Set(['fr', 'en', 'ar']);

const SKIP_DIRS = new Set([
  'node_modules', '.angular', 'dist', 'coverage', '.git', '.next', '.cache',
]);

/**
 * Walk récursif filtrant les `.json` (même approche que
 * `check-i18n-parity.mjs::discoverPacks` pour rester cohérent).
 */
async function walkJsonFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...(await walkJsonFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Regroupe les fichiers par pack (dossier) et retourne une map
 * `packId -> { fr?: path, en?: path, ar?: path }`.
 */
export async function discoverPacks(i18nRoot) {
  const files = await walkJsonFiles(i18nRoot);
  /** @type {Map<string, { fr?: string, en?: string, ar?: string }>} */
  const packs = new Map();
  for (const file of files) {
    const rel = relative(i18nRoot, file).split(sep).join('/');
    const lang = basename(file, '.json');
    if (!SUPPORTED_LANGS.has(lang)) continue;
    const packId = dirname(rel).split(sep).join('/');
    if (packId === '.' || packId === '') continue;
    if (!packs.has(packId)) packs.set(packId, {});
    packs.get(packId)[lang] = file;
  }
  return packs;
}

/**
 * Calcule la liste des fichiers AR à créer (uniquement les packs qui ont
 * FR mais pas AR). Retourne aussi les packs skippés (déjà AR) pour le résumé.
 */
export function planPlaceholders(packsMap, i18nRoot) {
  /** @type {string[]} */
  const toCreate = [];
  /** @type {string[]} */
  const skipped = [];
  const sortedPackIds = [...packsMap.keys()].sort((a, b) => a.localeCompare(b));
  for (const packId of sortedPackIds) {
    const langs = packsMap.get(packId);
    if (!langs.fr) continue;
    if (langs.ar) {
      skipped.push(packId);
      continue;
    }
    const packDir = dirname(langs.fr);
    toCreate.push(join(packDir, 'ar.json'));
    // packDir est relatif au système → on log via packId pour cohérence.
    void i18nRoot;
  }
  return { toCreate, skipped };
}

export function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    quiet: argv.includes('--quiet'),
  };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);

  const i18nRoot = process.env.NAFURA_I18N_ROOT || DEFAULT_I18N_ROOT;
  try {
    await stat(i18nRoot);
  } catch {
    console.error(`Dossier i18n introuvable: ${i18nRoot}`);
    return 1;
  }

  const packsMap = await discoverPacks(i18nRoot);
  const { toCreate, skipped } = planPlaceholders(packsMap, i18nRoot);

  if (args.dryRun) {
    console.log('====== i18n AR placeholders (--dry-run) ======');
    console.log(`Would create ${toCreate.length} placeholder(s) :`);
    for (const file of toCreate) {
      console.log(`   + ${relative(i18nRoot, file).split(sep).join('/')}`);
    }
    console.log(`Skipped (already have ar.json) : ${skipped.length}`);
    if (!args.quiet) {
      for (const packId of skipped) {
        console.log(`   = ${packId}`);
      }
    }
    return 0;
  }

  let created = 0;
  for (const file of toCreate) {
    try {
      await writeFile(file, '{}\n', 'utf8');
      created += 1;
    } catch (e) {
      console.error(`Echec d'écriture ${file}: ${e.message}`);
      return 1;
    }
  }

  console.log('====== i18n AR placeholders ======');
  console.log(`Created ${created} placeholder(s) / Skipped ${skipped.length} existing`);
  if (!args.quiet && created > 0) {
    for (const file of toCreate) {
      console.log(`   + ${relative(i18nRoot, file).split(sep).join('/')}`);
    }
  }
  return 0;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const code = await main();
  process.exit(code);
}
