import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { backendPermissions } from '../host/backend-permissions.mjs';
import { effectivePaging } from '../page-action.ts';

// Every listing screen is a `*.listing.ts` config rendered by nf-listing-page.
const web = fileURLToPath(new URL('../../', import.meta.url));
const fr = JSON.parse(readFileSync(new URL('../host/i18n/fr.json', import.meta.url), 'utf8'));
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist'].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.listing.ts')) files.push(full);
  }
})(web);

const listings = await Promise.all(
  files.map(async (file) => {
    const module = await import(pathToFileURL(file).href);
    return Object.values(module).filter((value) => value && typeof value === 'object' && 'endpoint' in value && 'columns' in value).map((config) => [relative(web, file), config]);
  }),
).then((all) => all.flat());

const french = (key) => key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), fr) ?? fr[key];

test('listing configs are discovered', () => {
  assert.ok(listings.length >= 1, 'at least one *.listing.ts');
});

test('every text of a listing screen is translated into French', () => {
  const missing = [];
  for (const [file, config] of listings) {
    const texts = [
      config.title,
      config.subtitle,
      config.emptyMessage,
      config.emptyState?.title,
      config.emptyState?.message,
      config.emptyState?.actionLabel,
      ...(config.segments ?? []).map((segment) => segment.label),
      ...config.columns.map((column) => column.label),
      ...(config.filters ?? []).map((filter) => filter.label),
      ...(config.actions ?? []).flatMap((action) => [
        action.label,
        action.success,
        action.failure,
        action.confirm?.title,
        action.confirm?.message,
        action.confirm?.confirmLabel,
        action.reveal?.title,
        action.reveal?.message,
        action.form?.title,
        ...(action.form?.fields ?? []).flatMap((field) => [field.label, ...(field.options ?? []).map((option) => option.label)]),
      ]),
    ].filter(Boolean);
    // Keys (`a.b.c`) and phrases need French; symbols and format tokens (`-`, `AAAA`) are shown as written.
    const translatable = (text) => /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_-]+)+$/.test(text) || /\s/.test(text);
    for (const text of texts.filter(translatable)) if (typeof french(text) !== 'string') missing.push(`${file}: ${text}`);
  }
  assert.deepEqual(missing, []);
});

test('every permission of a listing action is one the backend enforces', () => {
  const enforced = backendPermissions();
  const unknown = listings.flatMap(([file, config]) =>
    (config.actions ?? []).filter((action) => action.permission && !enforced.has(action.permission)).map((action) => `${file}: ${action.permission}`),
  );
  assert.deepEqual(unknown, []);
});

test('the listing artifact speaks French', () => {
  const artifacts = [
    'organisms/listing-flat/listing-flat.component.ts',
    'organisms/data-table/data-table.component.ts',
    'molecules/filter-builder/filter-builder.component.ts',
    'molecules/filter-chips/filter-chips.component.ts',
    'molecules/empty-state/empty-state.component.ts',
  ];
  const phrases = new Set(['No items', 'No results', 'Failed to load data']);
  for (const file of artifacts) {
    const source = readFileSync(join(web, 'lib/anatomy/components', file), 'utf8');
    for (const [, phrase] of source.matchAll(/'([^'|]+)'\)? \| translate/g)) phrases.add(phrase);
    for (const [, a, b] of source.matchAll(/\? '([^']+)' : '([^']+)'\) \| translate/g)) phrases.add(a).add(b);
  }
  const missing = [...phrases].filter((phrase) => typeof fr[phrase] !== 'string');
  assert.deepEqual(missing, []);
});

test('a tree is paged in the browser and a board is not a tree', () => {
  assert.equal(effectivePaging({ tree: { parentField: 'parentId' }, paging: 'server' }), 'client');
  assert.equal(effectivePaging({}), 'server');
  assert.equal(effectivePaging({ paging: 'client' }), 'client');
});
