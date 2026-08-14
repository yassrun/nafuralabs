#!/usr/bin/env node
/**
 * Generates ai-schema.generated.json from JPA @Entity classes.
 *
 * Usage:
 *   node tools/scripts/generate-ai-schema.mjs \
 *     --scan sektor/backend/modules \
 *     --out sektor/backend/app/src/main/resources/ai-schema.generated.json \
 *     --overlay sektor/backend/app/src/main/resources/ai-schema.overlay.json
 *
 * The overlay file (optional) adds aliases, hints, category and column descriptions
 * that cannot be inferred from JPA alone.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = parseArgs(process.argv.slice(2));
const scanRoot = path.resolve(args.scan ?? 'sektor/backend/modules');
const outFile = path.resolve(
  args.out ?? 'sektor/backend/app/src/main/resources/ai-schema.generated.json'
);
const overlayFile = args.overlay ? path.resolve(args.overlay) : null;

const entityFiles = listJavaFiles(scanRoot);
const tables = [];

for (const file of entityFiles) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('@Entity')) continue;
  const tableName = matchOne(src, /@Table\s*\(\s*name\s*=\s*"([^"]+)"/);
  if (!tableName) continue;

  const columns = [];
  for (const colMatch of src.matchAll(/@Column\s*\(([^)]*)\)\s*\n\s*(?:@\w+[^\n]*\n\s*)*private\s+\S+\s+(\w+)\s*;/g)) {
    const attrs = colMatch[1];
    const field = colMatch[2];
    const colName = matchOne(attrs, /name\s*=\s*"([^"]+)"/) ?? field;
    if (colName === 'tenant_id') continue;
    const col = { name: colName, type: inferType(attrs) };
    if (/nullable\s*=\s*false/.test(attrs) && /@Id/.test(src.slice(0, colMatch.index))) {
      col.pk = true;
    }
    columns.push(col);
  }

  const domain = inferDomain(file, tableName);
  tables.push({
    name: tableName,
    domain,
    category: 'extended',
    columns,
  });
}

tables.sort((a, b) => a.name.localeCompare(b.name));

let output = { domainIndex: buildDomainIndex(tables), tables };

if (overlayFile && fs.existsSync(overlayFile)) {
  output = mergeOverlay(output, JSON.parse(fs.readFileSync(overlayFile, 'utf8')));
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote ${tables.length} tables → ${outFile}`);

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      out[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return out;
}

function listJavaFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listJavaFiles(full));
    else if (entry.name.endsWith('.java')) files.push(full);
  }
  return files;
}

function matchOne(text, re) {
  const m = text.match(re);
  return m ? m[1] : null;
}

function inferType(columnAttrs) {
  if (/precision/.test(columnAttrs)) return 'numeric';
  return 'text';
}

function inferDomain(filePath, tableName) {
  const parts = filePath.replace(/\\/g, '/').split('/');
  const modulesIdx = parts.indexOf('modules');
  if (modulesIdx >= 0 && parts[modulesIdx + 1]) return parts[modulesIdx + 1];
  if (tableName.startsWith('chantier')) return 'chantiers';
  return 'general';
}

function buildDomainIndex(tables) {
  const index = {};
  for (const t of tables) {
    if (!index[t.domain]) index[t.domain] = [];
    index[t.domain].push(t.name);
  }
  return index;
}

function mergeOverlay(base, overlay) {
  const byName = new Map(base.tables.map((t) => [t.name, t]));
  for (const t of overlay.tables ?? []) {
    const existing = byName.get(t.name);
    if (existing) Object.assign(existing, t);
    else byName.set(t.name, t);
  }
  const tables = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  return {
    domainIndex: overlay.domainIndex ?? buildDomainIndex(tables),
    tables,
  };
}
