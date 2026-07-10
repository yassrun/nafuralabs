#!/usr/bin/env node
/**
 * i18n no-hardcoded-string ratchet — Phase 5 / Wave E (cursor-2026-05-27-E).
 *
 * Compares the current `scan-baseline.js --json` output with the locked
 * baseline in `web/eslint-rules/baseline.json` and exits non-zero if the total
 * number of hardcoded-string findings has regressed beyond `tolerance`.
 *
 * Exit codes:
 *   0 — current ≤ baseline + tolerance (no regression)
 *   1 — current >  baseline + tolerance (REGRESSION — blocks the CI gate)
 *
 * On every successful run we also surface a per-category diff and, if the
 * findings count went DOWN, invite the dev to ratchet the baseline via
 * `npm run i18n:hardcoded:snapshot`.
 *
 * Usage:
 *   npm run i18n:hardcoded:ratchet
 *   node scripts/i18n-hardcoded-ratchet.mjs
 *
 * No npm dependency added — pure Node 20+ (ESM).
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WEB_ROOT = resolve(__dirname, '..');
const BASELINE_PATH = resolve(WEB_ROOT, 'eslint-rules', 'baseline.json');
const SCANNER_PATH = resolve(WEB_ROOT, 'eslint-rules', 'scan-baseline.js');

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
  return counts;
}

function fmtSigned(n) {
  if (n === 0) return '±0';
  return n > 0 ? `+${n}` : `${n}`;
}

function loadBaseline() {
  let raw;
  try {
    raw = readFileSync(BASELINE_PATH, 'utf8');
  } catch (err) {
    console.error(`❌ Could not read baseline at ${BASELINE_PATH}: ${err.message}`);
    console.error('   Run `npm run i18n:hardcoded:snapshot` to bootstrap one.');
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`❌ baseline.json is not valid JSON: ${err.message}`);
    process.exit(1);
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

function main() {
  const baseline = loadBaseline();
  const tolerance = Number.isFinite(baseline.tolerance) ? baseline.tolerance : 5;
  const baselineTotal = baseline.totalFindings;
  const baselineCats = baseline.byCategory ?? {};
  const baselineKinds = baseline.byKind ?? {};

  const findings = runScan();
  const currentTotal = findings.length;
  const currentCats = countByCategory(findings);
  const currentKinds = countByKind(findings);

  const delta = currentTotal - baselineTotal;
  const threshold = baselineTotal + tolerance;
  const regressed = currentTotal > threshold;

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  i18n no-hardcoded-string RATCHET');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Baseline      : ${baselineTotal} findings (updated ${baseline.updatedAt ?? 'n/a'})`);
  console.log(`  Current scan  : ${currentTotal} findings`);
  console.log(`  Delta         : ${fmtSigned(delta)} (tolerance = ${tolerance})`);
  console.log(`  Threshold     : ≤ ${threshold} to pass`);
  console.log('');
  console.log('  By category:');
  const allCatKeys = new Set([...Object.keys(baselineCats), ...Object.keys(currentCats)]);
  for (const key of allCatKeys) {
    const before = baselineCats[key] ?? 0;
    const after = currentCats[key] ?? 0;
    const d = after - before;
    console.log(`    ${key.padEnd(24)} ${String(before).padStart(5)}  →  ${String(after).padStart(5)}   (${fmtSigned(d)})`);
  }

  // Kinds added / removed since baseline (compact diff)
  const allKindKeys = new Set([...Object.keys(baselineKinds), ...Object.keys(currentKinds)]);
  const kindDiffs = [];
  for (const k of allKindKeys) {
    const d = (currentKinds[k] ?? 0) - (baselineKinds[k] ?? 0);
    if (d !== 0) kindDiffs.push({ kind: k, delta: d });
  }
  if (kindDiffs.length > 0) {
    kindDiffs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    console.log('');
    console.log('  Top kind deltas:');
    for (const { kind, delta: d } of kindDiffs.slice(0, 10)) {
      console.log(`    ${kind.padEnd(28)} ${fmtSigned(d)}`);
    }
  }
  console.log('');

  if (regressed) {
    console.error('❌ REGRESSION DETECTED — the no-hardcoded-string baseline is locked.');
    console.error(`   Current ${currentTotal} > baseline ${baselineTotal} + tolerance ${tolerance} = ${threshold}.`);
    console.error('');
    console.error('   How to fix:');
    console.error('     1. Run `npm run lint:no-hardcoded-string` locally and look at the');
    console.error('        top files in the report.');
    console.error('     2. Migrate the new hardcoded strings to `| translate` pipes or');
    console.error('        `translate.instant(...)` calls (see web/docs/specs/i18n-roadmap/AGENT_RULES.md).');
    console.error('     3. If a finding is a legitimate exception (Material icon name, dev-only');
    console.error('        log, A4 print template fixed FR-MA), annotate the line with');
    console.error('        `// @i18n-exempt: <reason>` or `// eslint-disable no-hardcoded-string`.');
    console.error('     4. Re-run this script. Do NOT bump the baseline to hide a regression.');
    console.error('');
    process.exit(1);
  }

  if (delta < 0) {
    console.log(`✅ OK — and you reduced the baseline by ${Math.abs(delta)} findings 🎉`);
    console.log('   Lock in the gain by running:');
    console.log('     npm run i18n:hardcoded:snapshot');
    console.log('   then commit the updated web/eslint-rules/baseline.json.');
  } else if (delta === 0) {
    console.log('✅ OK — baseline unchanged.');
  } else {
    console.log(`✅ OK — within tolerance (delta ${fmtSigned(delta)} ≤ tolerance ${tolerance}).`);
    console.log('   Consider migrating these new findings before they accumulate.');
  }
  console.log('');
  process.exit(0);
}

main();
