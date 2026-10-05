import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));
const appSchema = readJson(new URL('./schemas/app.nafura.schema.json', import.meta.url));
const bcSchema = readJson(new URL('./schemas/bc.manifest.schema.json', import.meta.url));
const app = readJson(new URL('../../../../sandbox/app.nafura.example.json', import.meta.url));
const bc = readJson(new URL('../../../../sandbox/bc.manifest.example.json', import.meta.url));

// Covers only the keywords our two schemas use; a new keyword must be added here or it is ignored.
const SUPPORTED = new Set([
  '$schema', '$id', '$ref', '$defs', 'title', 'type', 'required', 'properties',
  'additionalProperties', 'items', 'const', 'enum', 'pattern', 'oneOf', 'uniqueItems',
]);

function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function check(root, schema, value, path, errors) {
  for (const keyword of Object.keys(schema)) {
    if (!SUPPORTED.has(keyword)) throw new Error(`Unsupported schema keyword "${keyword}" at ${path}`);
  }
  if (schema.$ref) {
    check(root, root.$defs[schema.$ref.replace('#/$defs/', '')], value, path, errors);
  }
  if (schema.type && typeOf(value) !== schema.type) {
    errors.push(`${path}: expected ${schema.type}`);
    return;
  }
  if ('const' in schema && value !== schema.const) errors.push(`${path}: expected ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}: not in ${schema.enum.join('|')}`);
  if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: does not match ${schema.pattern}`);
  if (schema.oneOf) {
    const matches = schema.oneOf.filter((option) => {
      const nested = [];
      check(root, option, value, path, nested);
      return nested.length === 0;
    });
    if (matches.length !== 1) errors.push(`${path}: matches ${matches.length} alternatives`);
  }
  if (schema.items) value.forEach((item, index) => check(root, schema.items, item, `${path}[${index}]`, errors));
  if (schema.uniqueItems && Array.isArray(value) && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
    errors.push(`${path}: duplicate items`);
  }
  if (typeOf(value) !== 'object') return;

  for (const key of schema.required ?? []) {
    if (!(key in value)) errors.push(`${path}: missing ${key}`);
  }
  for (const [key, child] of Object.entries(value)) {
    const property = schema.properties?.[key];
    if (property) check(root, property, child, `${path}.${key}`, errors);
    else if (schema.additionalProperties === false) errors.push(`${path}: unexpected ${key}`);
    else if (typeof schema.additionalProperties === 'object') {
      check(root, schema.additionalProperties, child, `${path}.${key}`, errors);
    }
  }
}

const validate = (schema, value) => {
  const errors = [];
  check(schema, schema, value, '$', errors);
  return errors;
};

test('sandbox examples match their schemas', () => {
  assert.deepEqual(validate(appSchema, app), []);
  assert.deepEqual(validate(bcSchema, bc), []);
});

test('platform-host manifests (application, business contexts, roles) match their schemas', () => {
  const host = readJson(new URL('../../../../platform-host/app.nafura.json', import.meta.url));
  const demo = readJson(new URL('../../../../platform-host/bcs/demo/bc.manifest.json', import.meta.url));
  assert.ok(host.spec.roles?.length, 'product roles declared');
  assert.deepEqual(validate(appSchema, host), []);
  assert.deepEqual(validate(bcSchema, demo), []);
  const badRole = { ...host, spec: { ...host.spec, roles: [{ code: 'X', label: 'X', includes: ['DEMO_EDITOR'] }] } };
  assert.notDeepEqual(validate(appSchema, badRole), [], 'includes must be bc.<id>:<ROLE>');
});

test('the product brand files the manifest names live in the product web public/', () => {
  const host = readJson(new URL('../../../../platform-host/app.nafura.json', import.meta.url));
  const files = [host.spec.product.mark, host.spec.product.logo].filter(Boolean);
  assert.ok(files.length, 'platform-host declares its mark');
  for (const file of files) {
    assert.ok(existsSync(new URL(`../../../../platform-host/sources/web/public${file}`, import.meta.url)), file);
  }
});

test('examples point at the platform schemas', () => {
  assert.equal(app.$schema, '../nafura-platform/sources/web/platform/schemas/app.nafura.schema.json');
  assert.equal(bc.$schema, '../nafura-platform/sources/web/platform/schemas/bc.manifest.schema.json');
});

test('rejects tenant runtime state in manifests', () => {
  const operatorSection = { ...app, nafura: { businessContexts: { 'bc.achats': { enabled: true } } } };
  const enabledContext = { ...bc, spec: { ...bc.spec, enabled: true } };

  assert.deepEqual(validate(appSchema, operatorSection), ['$: unexpected nafura']);
  assert.deepEqual(validate(bcSchema, enabledContext), ['$.spec: unexpected enabled']);
});

test('rejects malformed identifiers', () => {
  const badApp = { ...app, metadata: { ...app.metadata, id: 'demo' } };
  const badRole = {
    ...bc,
    spec: { ...bc.spec, defaultRoles: [{ code: 'acheteur', permissions: [] }] },
  };

  assert.deepEqual(validate(appSchema, badApp), ['$.metadata.id: does not match ^app\\.[a-z][a-z0-9-]*$']);
  assert.deepEqual(validate(bcSchema, badRole), ['$.spec.defaultRoles[0].code: does not match ^[A-Z][A-Z0-9_]*$']);
});
