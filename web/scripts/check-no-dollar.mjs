#!/usr/bin/env node
/**
 * check-no-dollar.mjs
 *
 * Guards against the `$` currency symbol leaking into the user interface or
 * persisted data, per the audit-roadmap (Task 1.3 / F-03 — locale fr-MA).
 *
 * Forbids:
 *   1. Literal `$` symbol in *.html / *.ts user-facing strings, except:
 *      - Angular template binding markers `${...}` and template strings (back-tick).
 *      - JSDoc / comment lines (lines starting with `*` or `//` or `/*`).
 *   2. The Angular `| currency` pipe — `| mad` or `| madCurrency` must be used.
 *
 * Usage:
 *   node web/scripts/check-no-dollar.mjs
 *
 * Exit codes:
 *   0 — nothing to report
 *   1 — at least one violation found
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..', 'app');

const SKIP_DIRS = new Set([
  'node_modules',
  '.angular',
  'dist',
  'coverage',
  '.git',
]);

/** Files allowed to contain `$` (e.g. Tailwind / utilities). */
const FILE_ALLOWLIST = new Set([
  // Devise seed — `'$'` is the legitimate USD currency symbol.
  'app/applications/erp/finance/mock/comptabilite-seeds.ts',
]);

/** Regex line-level patterns to ignore. */
const LINE_IGNORE_PATTERNS = [
  /^\s*\*/,
  /^\s*\/\//,
  /^\s*\/\*/,
];

const CURRENCY_PIPE_RE = /\|\s*currency([^\w]|$)/;
/**
 * Matches the `$` only when it really looks like a monetary symbol:
 *   - followed by 2+ digits (e.g. `$100`, `$ 100`)
 *   - preceded by 2+ digits before whitespace + dollar (e.g. `100 $`, `100$`)
 *   - the bare quoted `'$'` literal (e.g. `symbole: '$'`)
 * It intentionally ignores Angular template tokens (`$event`, `$index`,
 * `$any`), RxJS Subjects (`destroy$`), regex back-references (`$1`, `$2`),
 * regex anchors (`/...$/`) and template literals (`${...}`).
 */
const DOLLAR_RE = /(?:\$\s*\d{2,}|\d{2,}\s*\$(?![\d{])|["']\s*\$\s*["'])/;
/** Lines that contain regex calls — too noisy, skip the dollar check. */
const REGEX_LINE_RE = /\.(?:replace|replaceAll|match|search|split|test|exec)\s*\(\s*\//;

let violations = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(full);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!/\.(html|ts)$/.test(entry.name)) continue;
    await checkFile(full);
  }
}

async function checkFile(file) {
  const rel = relative(join(__dirname, '..'), file).split(sep).join('/');
  if (FILE_ALLOWLIST.has(rel)) return;
  const content = await readFile(file, 'utf8');
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (LINE_IGNORE_PATTERNS.some((p) => p.test(line))) continue;

    if (CURRENCY_PIPE_RE.test(line)) {
      report(rel, i + 1, line, '`| currency` interdit — utilisez `| mad` ou `| madCurrency`.');
    }

    if (!REGEX_LINE_RE.test(line) && DOLLAR_RE.test(line)) {
      report(rel, i + 1, line, '`$` (symbole monétaire) détecté — locale fr-MA exige `MAD`.');
    }
  }
}

function report(file, lineNo, line, reason) {
  violations++;
  console.error(`✘ ${file}:${lineNo}  ${reason}`);
  console.error(`    > ${line.trim()}`);
}

await stat(ROOT).catch(() => {
  console.error(`Cannot find ${ROOT}`);
  process.exit(2);
});
await walk(ROOT);

if (violations > 0) {
  console.error(`\n${violations} violation(s) trouvée(s).`);
  process.exit(1);
}
console.log('✔ check-no-dollar : OK');
process.exit(0);
