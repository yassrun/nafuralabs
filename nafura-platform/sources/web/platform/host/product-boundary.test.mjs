import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { drift, products } from '../../../../scripts/nafura.mjs';

// D-6: a product on the host only configures the platform and codes its business contexts.
const repo = fileURLToPath(new URL('../../../../../', import.meta.url));
const HOST_PRODUCTS = products().map((product) => product.dir);

test('the reference product is found', () => assert.ok(HOST_PRODUCTS.includes('platform-host')));

// D-16: entry points are the reference product's, byte for byte: a copy runs with no renaming.
for (const product of HOST_PRODUCTS) {
  test(`${product} entry points are the reference ones`, () => assert.deepEqual(drift(product), []));
}

const ENTRY_POINTS = new Set(['sources/web/src/main.ts', 'sources/web/src/index.html', 'sources/web/src/styles.scss', 'ops/run.mjs']);
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'build', '.gradle', '.angular', 'data', 'gradle', '.render']);
const CODE = /\.(ts|js|mjs|java|kt|scss|css|html)$/;

function productFiles(product, pattern) {
  const root = join(repo, product);
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (SKIPPED_DIRS.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (pattern.test(entry.name) && !entry.name.endsWith('.generated.ts')) files.push(relative(root, full).split(sep).join('/'));
    }
  };
  walk(root);
  return files;
}

const productCode = (product) => productFiles(product, CODE);

const allowed = (file) => ENTRY_POINTS.has(file) || file.startsWith('bcs/');

for (const product of HOST_PRODUCTS) {
  test(`${product} contains only configuration, entry points and business contexts`, () => {
    assert.ok(existsSync(join(repo, product, 'app.nafura.json')), 'app.nafura.json');
    const files = productCode(product);
    assert.ok(files.length > 0, 'product files scanned');
    assert.deepEqual(files.filter((file) => !allowed(file)), [], 'generic code belongs to nafura-platform');
  });
}

// One source for the product's identity: entry points and ops read app.nafura.json, so a copy needs no renaming.
const TEXT = /\.(ts|js|mjs|java|kt|scss|css|html|json|gradle|kts|properties|ya?ml|sh|ps1|conf|Dockerfile)$|^Dockerfile/;

for (const product of HOST_PRODUCTS) {
  test(`${product} names itself only in app.nafura.json`, () => {
    const app = JSON.parse(readFileSync(join(repo, product, 'app.nafura.json'), 'utf8'));
    const names = [app.metadata.id.replace(/^app\./, ''), app.spec.product.name];
    const offenders = productFiles(product, TEXT)
      .filter((file) => file !== 'app.nafura.json' && !file.startsWith('bcs/') && !file.endsWith('package-lock.json'))
      .flatMap((file) => {
        const source = readFileSync(join(repo, product, file), 'utf8');
        return names.filter((name) => source.includes(name)).map((name) => `${file}: ${name}`);
      });
    assert.deepEqual(offenders, []);
  });
}

// Roles are configuration (BC manifests, app.nafura.json, tenant admin); BC code checks permissions only.
const ROLE_API = /\b(hasRole|hasAnyRole|getRoleCode|getRoleCodes|getUserRole|isUserInRole|\w*RoleCodes)\b/;

function declaredRoleCodes(product) {
  const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
  const codes = (read(join(repo, product, 'app.nafura.json')).spec.roles ?? []).map((role) => role.code);
  const bcs = join(repo, product, 'bcs');
  for (const bc of existsSync(bcs) ? readdirSync(bcs) : []) {
    const manifest = join(bcs, bc, 'bc.manifest.json');
    if (existsSync(manifest)) codes.push(...(read(manifest).spec.defaultRoles ?? []).map((role) => role.code));
  }
  return codes;
}

export function roleChecks(source, roleCodes) {
  const found = [];
  const api = source.match(ROLE_API);
  if (api) found.push(api[0]);
  for (const code of roleCodes) {
    if (new RegExp(`["'\`]${code}["'\`]`).test(source)) found.push(code);
  }
  return found;
}

test('roleChecks detects role APIs and declared role codes in code', () => {
  assert.deepEqual(roleChecks('if (user.hasRole("X")) {}', []), ['hasRole']);
  assert.deepEqual(roleChecks('ChantierRoleCodes.BTP_INGENIEUR', []), ['ChantierRoleCodes']);
  assert.deepEqual(roleChecks('if (role === "DEMO_EDITOR") {}', ['DEMO_EDITOR']), ['DEMO_EDITOR']);
  assert.deepEqual(roleChecks("@RequirePermission('demo.notes.note.read')", ['DEMO_EDITOR']), []);
});

for (const product of HOST_PRODUCTS) {
  test(`${product} business contexts check permissions, never roles`, () => {
    const codes = declaredRoleCodes(product);
    if (product === 'platform-host') assert.ok(codes.length > 0, 'declared roles found');
    const offenders = productCode(product)
      .filter((file) => file.startsWith('bcs/'))
      .flatMap((file) => roleChecks(readFileSync(join(repo, product, file), 'utf8'), codes).map((hit) => `${file}: ${hit}`));
    assert.deepEqual(offenders, []);
  });
}
