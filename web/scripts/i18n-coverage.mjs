#!/usr/bin/env node
/**
 * i18n-coverage.mjs
 *
 * Génère un rapport de couverture i18n par pack JSON, exporté en markdown.
 * Utilise `check-i18n-parity.mjs` pour la source de vérité.
 *
 * Usage :
 *   node scripts/i18n-coverage.mjs               # imprime sur stdout
 *   node scripts/i18n-coverage.mjs --write       # écrit dans docs/specs/i18n-roadmap/COVERAGE.md
 *
 * Phase 5.2 — coverage badge par module (Round 1 cleanup).
 */
import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const WRITE = process.argv.includes('--write');
const OUT_PATH = join(ROOT, 'docs', 'specs', 'i18n-roadmap', 'COVERAGE.md');

const result = spawnSync('node', ['scripts/check-i18n-parity.mjs', '--json'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
});
if (result.status !== 0 && result.status !== 1) {
  console.error('parity check failed:', result.stderr);
  process.exit(1);
}
const data = JSON.parse(result.stdout);

const packs = (data.packs || []).slice().sort((a, b) => a.pack.localeCompare(b.pack));

function statusBadge(p) {
  const errors = (p.missing_in_en?.length ?? 0) + (p.empty_values?.length ?? 0);
  const warns = (p.identical_values?.length ?? 0) + (p.missing_in_fr?.length ?? 0);
  if (p.fr_count === 0 || p.en_count === 0) return '⚠️ monolingual';
  if (errors > 0) return `🔴 ${errors} miss`;
  if (warns > 0) return `🟡 ${warns} susp`;
  return '✅ clean';
}

function parityRatio(p) {
  if (p.fr_count === 0) return '—';
  const min = Math.min(p.fr_count, p.en_count);
  const max = Math.max(p.fr_count, p.en_count);
  if (max === 0) return '—';
  const pct = Math.round((min / max) * 100);
  return `${pct}%`;
}

// ── ERP packs (Round 1 scope) ───────────────────────────────────────────────
const erpPacks = packs.filter((p) => p.pack.startsWith('applications/erp/'));
const corePacks = packs.filter(
  (p) =>
    p.pack === 'core' ||
    p.pack === 'doc-extractor' ||
    p.pack === 'applications/erp' ||
    p.pack === 'applications/app' ||
    p.pack === 'applications/core' ||
    p.pack === 'applications/socle',
);
const externalPacks = packs.filter(
  (p) => !erpPacks.includes(p) && !corePacks.includes(p),
);

const totalFr = packs.reduce((s, p) => s + p.fr_count, 0);
const totalEn = packs.reduce((s, p) => s + p.en_count, 0);
const totalErrors = packs.reduce((s, p) => s + (p.missing_in_en?.length ?? 0), 0);
const totalSusp = packs.reduce((s, p) => s + (p.identical_values?.length ?? 0), 0);

let md = `# 📊 i18n Coverage — Nafura ERP

> **Generated** by \`npm run i18n:coverage\` from \`check-i18n-parity.mjs\`. Re-run after every PR i18n.
> **Round 1 scope** : FR + EN only (AR reported as info in \`i18n:check\`).

## 🌍 Global summary

| Metric | Value |
|---|---:|
| Total packs | **${packs.length}** |
| Total FR keys | **${totalFr.toLocaleString('en-US')}** |
| Total EN keys | **${totalEn.toLocaleString('en-US')}** |
| Global FR↔EN parity | **${Math.round((Math.min(totalFr, totalEn) / Math.max(totalFr, totalEn)) * 100)}%** |
| Total errors (missing in EN) | ${totalErrors === 0 ? '✅ **0**' : `🔴 **${totalErrors}**`} |
| Total suspect (identical FR/EN) | 🟡 **${totalSusp.toLocaleString('en-US')}** |

## 🏗️ ERP modules (Wave C scope)

| Pack | FR keys | EN keys | Parity | Status |
|---|---:|---:|---:|---|
`;

for (const p of erpPacks) {
  const name = p.pack.replace('applications/erp/', '');
  md += `| \`${name}\` | ${p.fr_count} | ${p.en_count} | ${parityRatio(p)} | ${statusBadge(p)} |\n`;
}

md += `
## 🧩 Core & application shells

| Pack | FR keys | EN keys | Parity | Status |
|---|---:|---:|---:|---|
`;
for (const p of corePacks) {
  md += `| \`${p.pack}\` | ${p.fr_count} | ${p.en_count} | ${parityRatio(p)} | ${statusBadge(p)} |\n`;
}

md += `
## 🔌 External domain/feature packs (auto-generated backend scaffolds)

> **Scope** : these packs are **scaffolded from Java backend entities**
> (\`Cities\`, \`Currencies\`, \`Departments\`, \`Disposition Codes\`,
> \`Stock Balances\`, \`Inventory Tx Lines\`…). They are **not** rendered
> directly by the ERP UI — they pre-populate the future domain feature
> catalogue.
>
> **Round 1 cleanup (Wave E3)** : the ~200 residual \`Identical FR/EN\`
> suspects in these packs were absorbed pragmatically via
> \`STUB_JAVA_TOKEN_WHITELIST\` in \`check-i18n-parity.mjs\` (entity field
> names + navigation titles that do not affect any user-facing UI).
>
> **Round 2 scope** : when the Java backend ships
> \`messages_fr.properties\` / \`messages_en.properties\`, these JSON
> scaffolds will be regenerated end-to-end from the backend i18n bundles
> and the pragmatic stub whitelist will be retired.
>
> See [\`GLOSSARY.md\`](./GLOSSARY.md) § « Java entity stubs (Round 2) »
> for the explicit list of whitelisted scaffolded tokens.

| Pack | FR keys | EN keys | Parity | Status |
|---|---:|---:|---:|---|
`;
for (const p of externalPacks) {
  md += `| \`${p.pack}\` | ${p.fr_count} | ${p.en_count} | ${parityRatio(p)} | ${statusBadge(p)} |\n`;
}

md += `
## ℹ️ AR coverage (Round 2 scope, informational only)

`;
if (data.ar_info && data.ar_info.length > 0) {
  md += `| Pack | AR keys | vs FR | Coverage |\n|---|---:|---:|---:|\n`;
  for (const a of data.ar_info) {
    md += `| \`${a.pack}\` | ${a.ar_count} | ${a.fr_count} | ${Math.round((a.ar_count / Math.max(1, a.fr_count)) * 100)}% |\n`;
  }
} else {
  md += `_No AR packs detected._\n`;
}

md += `
---

## How to update

\`\`\`bash
cd web
npm run i18n:coverage          # print to stdout
npm run i18n:coverage:write    # rewrite this file
\`\`\`

Phase 5.2 — auto-generated coverage report. See [\`CI.md\`](./CI.md) for the CI gates.
`;

if (WRITE) {
  await writeFile(OUT_PATH, md, 'utf8');
  console.log(`Wrote ${OUT_PATH}`);
} else {
  process.stdout.write(md);
}
