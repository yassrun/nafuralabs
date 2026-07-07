#!/usr/bin/env node
/**
 * Fail if Sektor ERP métier source files exist outside products/sektor-btp/.
 *
 * Usage (from repo root):
 *   node products/sektor-btp/web/scripts/check-sektor-scope.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const SEKTOR_ROOT = path.join(REPO_ROOT, 'products', 'sektor-btp');

const ALLOWED_ROOTS = [
  path.join(SEKTOR_ROOT, 'web', 'app'),
  path.join(SEKTOR_ROOT, 'web', 'public', 'assets', 'i18n', 'applications', 'erp'),
  path.join(SEKTOR_ROOT, 'web', 'public', 'assets', 'i18n', 'domains', 'erp'),
  path.join(SEKTOR_ROOT, 'backend'),
  path.join(SEKTOR_ROOT, 'docs'),
  path.join(SEKTOR_ROOT, 'deploy'),
];

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'build',
  'test-results',
  'playwright-report',
]);

const ERP_MARKERS = [
  /[/\\]shell[/\\]erp-/,
  /[/\\]pages[/\\]chantiers[/\\]/,
  /[/\\]pages[/\\]achats[/\\]/,
  /[/\\]pages[/\\]finance[/\\]/,
  /[/\\]pages[/\\]marches[/\\]/,
  /[/\\]pages[/\\]ventes[/\\]/,
  /[/\\]pages[/\\]rh[/\\]/,
  /[/\\]pages[/\\]hse[/\\]/,
  /[/\\]pages[/\\]etudes[/\\]/,
  /[/\\]chantiers\.routes\.ts$/,
  /[/\\]achats\.routes\.ts$/,
  /[/\\]finance\.routes\.ts$/,
  /[/\\]erp-audit\.service\.ts$/,
  /[/\\]erp-notifications\.service\.ts$/,
  /applications[/\\]erp[/\\]/,
  /[/\\]app[/\\]applications[/\\]erp[/\\]/,
];

const SOURCE_EXT = new Set(['.ts', '.html', '.scss', '.java']);

function isAllowed(filePath) {
  const normalized = path.normalize(filePath);
  return ALLOWED_ROOTS.some((root) => normalized.startsWith(path.normalize(root + path.sep)) || normalized === path.normalize(root));
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const violations = [];
for (const file of walk(REPO_ROOT)) {
  const ext = path.extname(file);
  if (!SOURCE_EXT.has(ext)) continue;
  if (isAllowed(file)) continue;
  const rel = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  if (ERP_MARKERS.some((re) => re.test(rel))) {
    violations.push(rel);
  }
}

if (violations.length) {
  console.error('Sektor scope check FAILED — ERP métier files outside products/sektor-btp/:');
  for (const v of violations.slice(0, 50)) console.error(`  - ${v}`);
  if (violations.length > 50) console.error(`  ... and ${violations.length - 50} more`);
  process.exit(1);
}

const PLATFORM_ROOT = path.join(REPO_ROOT, 'platform', 'web');
const platformImportViolations = [];
for (const file of walk(PLATFORM_ROOT)) {
  if (!file.endsWith('.ts')) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('@applications/')) {
    platformImportViolations.push(path.relative(REPO_ROOT, file).replace(/\\/g, '/'));
  }
}

if (platformImportViolations.length) {
  console.error('Platform scope check FAILED — @applications/ imports in platform/web/:');
  for (const v of platformImportViolations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log('Sektor scope check OK — no ERP métier source files outside products/sektor-btp/');
console.log('Platform scope check OK — no @applications/ imports in platform/web/');
