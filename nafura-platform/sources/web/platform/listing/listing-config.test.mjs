import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { backendPermissions } from '../host/backend-permissions.mjs';
import { effectivePaging } from '../page-action.ts';
import { filterFields, filterTargets, formatValue, toRecordFilter } from './listing-properties.ts';

// Every listing screen is a `*.listing.ts` config rendered by nf-listing-page; business contexts keep theirs in `web/`.
const web = fileURLToPath(new URL('../../', import.meta.url));
const root = join(web, '../../..');
const fr = JSON.parse(readFileSync(new URL('../host/i18n/fr.json', import.meta.url), 'utf8'));

function walk(dir, keep, skip = []) {
  const found = [];
  (function visit(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (['node_modules', 'dist', 'build', '.gradle', ...skip].includes(entry.name)) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (keep(full, entry.name)) found.push(full);
    }
  })(dir);
  return found;
}

const isList = (value) => value && typeof value === 'object' && 'endpoint' in value && 'views' in value;
const isLegacyList = (value) => value && typeof value === 'object' && 'endpoint' in value && 'columns' in value;
const files = walk(web, (_, name) => name.endsWith('.listing.ts'));
const bcFiles = walk(join(root, 'platform-host/bcs'), (full, name) => name.endsWith('.ts') && full.split(/[\\/]/).includes('web'), ['backend']);

const modules = await Promise.all(files.map(async (file) => [relative(web, file).split(sep).join('/'), await import(pathToFileURL(file).href)]));
const listings = modules.flatMap(([file, module]) => Object.values(module).filter(isList).map((config) => [file, config]));
const legacyListings = modules.flatMap(([file, module]) => Object.values(module).filter(isLegacyList).map((config) => [file, config]));

const bcListings = await Promise.all(
  bcFiles.map(async (file) => {
    const module = await import(pathToFileURL(file).href).catch(() => ({}));
    return Object.values(module).filter(isList);
  }),
).then((all) => all.flat());

const french = (key) => key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), fr) ?? fr[key];

test('listing configs are discovered; no legacy column-based lists remain', () => {
  assert.ok(listings.length >= 1, 'at least one *.listing.ts');
  assert.ok(bcListings.length >= 6, `business context lists found: ${bcListings.length}`);
  assert.deepEqual(legacyListings.map(([file]) => file), []);
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
      ...(config.views ?? []).map((view) => view.label),
      ...(config.quickFilters ?? []).map((quick) => quick.label),
      ...(config.segments ?? []).map((segment) => segment.label),
      ...(config.columns ?? []).map((column) => column.label),
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
    'organisms/listing-calendar/listing-calendar.component.ts',
    'organisms/data-table/data-table.component.ts',
    'molecules/filter-builder/filter-builder.component.ts',
    'molecules/filter-chips/filter-chips.component.ts',
    'molecules/empty-state/empty-state.component.ts',
  ];
  const phrases = new Set(['No items', 'No results', 'Failed to load data', 'listing.me', 'listing.sum', 'listing.avg', 'listing.count']);
  for (const file of artifacts) {
    const source = readFileSync(join(web, 'lib/anatomy/components', file), 'utf8');
    for (const [, phrase] of source.matchAll(/'([^'|]+)'\)? \| translate/g)) phrases.add(phrase);
    for (const [, a, b] of source.matchAll(/\? '([^']+)' : '([^']+)'\) \| translate/g)) phrases.add(a).add(b);
  }
  const missing = [...phrases].filter((phrase) => typeof french(phrase) !== 'string');
  assert.deepEqual(missing, []);
});

test('a tree view is loaded whole; other views are paged by the server unless the list says client', () => {
  assert.equal(effectivePaging({ paging: 'server' }, { layout: 'tree' }), 'client');
  assert.equal(effectivePaging({}, { layout: 'board' }), 'server');
  assert.equal(effectivePaging({ paging: 'client' }), 'client');
});

test('lists keep one format: views and quick filters, never columns, segments, board or searchFields', () => {
  const legacy = [];
  for (const file of [...files, ...bcFiles]) {
    const source = readFileSync(file, 'utf8');
    if (!/ListingPageConfig/.test(source)) continue;
    for (const key of ['segments:', 'defaultSegment:', 'searchFields:', 'board:', 'columns:']) {
      if (source.includes(key)) legacy.push(`${relative(root, file)}: ${key}`);
    }
  }
  assert.deepEqual(legacy, []);
});

test('every view of a list is drawn: table, board by a property, calendar by a date, tree by a parent', () => {
  const wrong = [...listings.map(([, config]) => config), ...bcListings].flatMap((config) =>
    config.views
      .filter(
        (view) =>
          !['table', 'board', 'calendar', 'tree'].includes(view.layout) ||
          (view.layout === 'board' && !view.groupBy) ||
          (view.layout === 'calendar' && !view.date) ||
          (view.layout === 'tree' && !view.tree),
      )
      .map((view) => `${config.endpoint}#${view.id}: ${view.layout}`),
  );
  assert.deepEqual(wrong, []);
});

test('record controllers take their lifecycle, filters and search from the descriptor', () => {
  const legacy = [];
  const sources = [
    ...walk(join(root, 'platform-host/bcs'), (_, name) => name.endsWith('.java'), ['web']),
    ...walk(join(root, 'nafura-platform/sources/backend/host-tests'), (_, name) => name.endsWith('.java')),
  ];
  for (const file of sources) {
    const source = readFileSync(file, 'utf8');
    if (!/extends RecordController/.test(source)) continue;
    for (const method of ['filterFields()', 'searchFields()', 'lifecycleResource()']) {
      if (source.includes(method)) legacy.push(`${relative(root, file)}: ${method}`);
    }
  }
  assert.deepEqual(legacy, []);
});

const PROPERTIES = {
  subject: { label: 'Objet', type: 'text', filterable: true, sortable: true },
  amount: { label: 'Montant', type: 'money', filterable: true, sortable: true, currency: 'MAD' },
  neededBy: { label: 'Pour le', type: 'date', filterable: true, sortable: true },
  status: { label: 'Statut', type: 'status', filterable: true, sortable: false, values: [{ id: 'DRAFT', label: 'Brouillon' }] },
  supplierId: { label: 'Fournisseur', type: 'relation', filterable: true, sortable: false, target: 'demo.supplier', display: 'supplierName' },
  contacts: { label: 'Contacts', type: 'relations', filterable: true, sortable: false, target: 'demo.contact', via: 'supplierId' },
};
const TARGETS = {
  'demo.supplier': { city: { label: 'Ville', type: 'text', filterable: true, sortable: true } },
  'demo.contact': { name: { label: 'Nom', type: 'text', filterable: true, sortable: true } },
};

test('the builder offers the properties, the relations one hop away, and only the operators of the grammar', () => {
  const fields = filterFields(PROPERTIES, TARGETS);
  const keys = fields.map((field) => field.key);
  assert.ok(keys.includes('supplierId.city') && keys.includes('contacts.name') && !keys.includes('contacts'));
  assert.deepEqual(fields.find((field) => field.key === 'status').operators, ['eq', 'ne', 'in']);
  assert.equal(fields.find((field) => field.key === 'contacts.name').label, 'Contacts · Nom');
});

test('the builder tree becomes the grammar of the API', () => {
  const targets = filterTargets(PROPERTIES, TARGETS);
  const group = {
    combinator: 'and',
    children: [
      { field: 'amount', op: 'gte', value: '10000' },
      { field: 'status', op: 'in', value: ['DRAFT'] },
      { field: 'neededBy', op: 'lt', value: '2026-10-04' },
      {
        combinator: 'or',
        children: [
          { field: 'contacts.name', op: 'contains', value: 'Benali' },
          { field: 'supplierId.city', op: 'eq', value: 'Casablanca' },
        ],
      },
      { field: 'subject', op: 'contains', value: '' },
    ],
  };
  assert.deepEqual(toRecordFilter(group, targets), {
    and: [
      { amount: { gte: 10000 } },
      { status: { in: ['DRAFT'] } },
      { neededBy: { before: '2026-10-04' } },
      { or: [{ contacts: { any: { name: { contains: 'Benali' } } } }, { supplierId: { where: { city: { is: 'Casablanca' } } } }] },
    ],
  });
  assert.equal(toRecordFilter({ combinator: 'and', children: [] }, targets), null);
});

test('values are formatted by property type', () => {
  assert.equal(formatValue(PROPERTIES.amount, 1250.5, {}, 'en-US'), '1,250.50 MAD');
  assert.equal(formatValue(PROPERTIES.status, 'DRAFT'), 'Brouillon');
  assert.equal(formatValue(PROPERTIES.supplierId, 'x', { supplierName: 'Acme' }), 'Acme');
  assert.equal(formatValue(PROPERTIES.subject, null), '—');
});
