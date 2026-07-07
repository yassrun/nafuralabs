#!/usr/bin/env node
/**
 * i18n no-hardcoded-string baseline snapshot — Phase 5 / Wave E
 * (cursor-2026-05-27-E).
 *
 * Re-runs `scan-baseline.js --json` and overwrites
 * `web/eslint-rules/baseline.json` with the current counters (total + per
 * category + per kind). Idempotent — running twice with no code changes
 * produces the same file.
 *
 * Usage:
 *   npm run i18n:hardcoded:snapshot
 *   node scripts/i18n-hardcoded-snapshot.mjs
 *
 * The script prints the delta against the previous baseline so the dev can
 * sanity-check that they are not accidentally relaxing the gate.
 *
 * No npm dependency added — pure Node 20+ (ESM).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEB_ROOT = resolve(__dirname, '..');
const BASELINE_PATH = resolve(WEB_ROOT, 'eslint-rules', 'baseline.json');
const SCANNER_PATH = resolve(WEB_ROOT, 'eslint-rules', 'scan-baseline.js');

const DEFAULT_TOLERANCE = 5;

function categorize(kind) {
  if (kind === 'inline_template_text') return 'inline_template_text';
  if (kind.startsWith('template_') || kind.startsWith('inline_template_')) {
    return 'html_attribute_text';
  }
  return 'ts_literal_label';
}

function countByCategory(findings) {
  const counts = {
    inline_template_text: 0,
    ts_literal_label: 0,
    html_attribute_text: 0,
  };
  for (const f of findings) {
    counts[categorize(f.kind)] += 1;
  }
  return counts;
}

function countByKind(findings) {
  const counts = {};
  for (const f of findings) {
    counts[f.kind] = (counts[f.kind] ?? 0) + 1;
  }
  const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(ordered);
}

function fmtSigned(n) {
  if (n === 0) return '±0';
  return n > 0 ? `+${n}` : `${n}`;
}

function loadBaselineIfAny() {
  if (!existsSync(BASELINE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  } catch (err) {
    console.warn(`⚠️  Existing baseline.json could not be parsed (${err.message}). Overwriting.`);
    return null;
  }
}

function runScan() {
  let out;
  try {
    out = execFileSync(process.execPath, [SCANNER_PATH, '--json'], {
      cwd: WEB_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (err) {
    console.error(`❌ Failed to execute scan-baseline.js: ${err.message}`);
    process.exit(1);
  }
  try {
    return JSON.parse(out);
  } catch (err) {
    console.error(`❌ scan-baseline.js --json returned invalid JSON: ${err.message}`);
    process.exit(1);
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const previous = loadBaselineIfAny();
  const findings = runScan();
  const total = findings.length;
  const byCategory = countByCategory(findings);
  const byKind = countByKind(findings);

  const previousTotal = previous?.totalFindings ?? null;
  const tolerance = Number.isFinite(previous?.tolerance) ? previous.tolerance : DEFAULT_TOLERANCE;

  const next = {
    $comment:
      'Ratchet baseline for no-hardcoded-string lint rule. Total findings must NEVER regress — only decrease. Run `npm run i18n:hardcoded:snapshot` to update after a legitimate reduction. Tolerance is applied by the ratchet script to absorb spurious Angular control-flow false-positives.',
    totalFindings: total,
    updatedAt: todayIso(),
    tolerance,
    byCategory,
    byKind,
  };

  writeFileSync(BASELINE_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  i18n no-hardcoded-string SNAPSHOT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Wrote: ${BASELINE_PATH}`);
  console.log(`  Total : ${total} findings`);
  if (previousTotal !== null) {
    console.log(`  Prev  : ${previousTotal} findings  (delta ${fmtSigned(total - previousTotal)})`);
  } else {
    console.log('  Prev  : <bootstrap — no previous baseline>');
  }
  console.log(`  Date  : ${next.updatedAt}`);
  console.log('');
  console.log('  By category:');
  for (const [k, v] of Object.entries(byCategory)) {
    console.log(`    ${k.padEnd(24)} ${String(v).padStart(5)}`);
  }
  console.log('');
  if (previousTotal !== null && total > previousTotal) {
    console.warn(
      `⚠️  WARNING: snapshot raises the baseline by ${total - previousTotal}. ` +
        'Make sure this reflects a real, justified increase (not a regression you are hiding).',
    );
  }
  process.exit(0);
}

main();
