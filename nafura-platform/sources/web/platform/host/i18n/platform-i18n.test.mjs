import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const web = fileURLToPath(new URL('../../..', import.meta.url));
const fr = JSON.parse(readFileSync(new URL('./fr.json', import.meta.url), 'utf8'));

const leaves = new Set();
const sections = new Set();
(function flatten(node, prefix) {
  for (const [key, value] of Object.entries(node)) {
    const full = prefix + key;
    if (value && typeof value === 'object') {
      sections.add(full);
      flatten(value, full + '.');
    } else {
      leaves.add(full);
    }
  }
})(fr, '');

// Keys rendered to the user: `'x.y' | translate`, `instant('x.y')`, `get('x.y')`, and *Key/label/title-like fields.
const KEY = String.raw`([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9_-]+)+)`;
const patterns = [
  new RegExp(String.raw`['"]${KEY}['"]\s*\|\s*translate`, 'g'),
  new RegExp(String.raw`\b(?:instant|get|stream)\(\s*['"]${KEY}['"]`, 'g'),
  new RegExp(String.raw`\b\w*(?:Key|label|title|message|placeholder|subtitle|tooltip|description)\s*:\s*['"]${KEY}['"]`, 'g'),
];
// Keys whose root is not a translation namespace (permissions, routes, template expressions).
const roots = new Set([...leaves, ...sections].map((key) => key.split('.')[0]));

function renderedKeys() {
  const found = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', 'i18n'].includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) {
        const text = readFileSync(full, 'utf8').replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '');
        for (const pattern of patterns) {
          for (const match of text.matchAll(pattern)) {
            if (roots.has(match[1].split('.')[0]) && !found.has(match[1])) found.set(match[1], relative(web, full));
          }
        }
      }
    }
  };
  ['core', 'lib', 'features', 'app', 'platform'].forEach((dir) => walk(join(web, dir)));
  return found;
}

test('every translation key rendered by platform screens exists in platform i18n', () => {
  const rendered = renderedKeys();
  // A key used as a prefix with a dynamic suffix (e.g. `status.${value}`) resolves to a section.
  const missing = [...rendered]
    .filter(([key]) => !leaves.has(key) && !sections.has(key))
    .map(([key, file]) => `${key} (${file})`);

  assert.ok(rendered.size > 300, 'rendered keys parsed');
  assert.deepEqual(missing, [], 'add the text to platform/host/i18n/fr.json, never to a product');
});

// Design-system components translate English phrases (`'Search' | translate`): untranslated, they render in English.
test('every phrase passed to the translate pipe has a French text', () => {
  const missing = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', 'i18n'].includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) {
        const text = readFileSync(full, 'utf8');
        for (const match of text.matchAll(/'([A-Z][A-Za-z ,.!?’-]{1,60})'\s*\|\s*translate/g)) {
          if (typeof fr[match[1]] !== 'string') missing.set(match[1], relative(web, full));
        }
      }
    }
  };
  ['core', 'lib', 'features', 'app', 'platform'].forEach((dir) => walk(join(web, dir)));
  assert.deepEqual([...missing].map(([phrase, file]) => `${phrase} (${file})`), []);
});

test('no key is both a text and a section', () => {
  assert.deepEqual([...leaves].filter((key) => sections.has(key)), []);
});

test('every key prefix completed at runtime is a non-empty section', () => {
  const dynamic = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', 'i18n'].includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) {
        for (const match of readFileSync(full, 'utf8').matchAll(/['"`]([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9_-]+)+)\.['"`]\s*\+/g)) {
          if (roots.has(match[1].split('.')[0]) && !dynamic.has(match[1])) dynamic.set(match[1], relative(web, full));
        }
      }
    }
  };
  ['core', 'lib', 'features', 'app', 'platform'].forEach((dir) => walk(join(web, dir)));

  const missing = [...dynamic].filter(([prefix]) => !sections.has(prefix)).map(([prefix, file]) => `${prefix}.* (${file})`);
  assert.ok(dynamic.size > 0, 'dynamic prefixes parsed');
  assert.deepEqual(missing, []);
});

test('texts use the ICU syntax the host compiles ({name}, {count, plural, …}), never {{name}}', () => {
  const values = [];
  (function collect(node, prefix) {
    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === 'object') collect(value, prefix + key + '.');
      else values.push([prefix + key, String(value)]);
    }
  })(fr, '');
  const balanced = (text) => {
    let depth = 0;
    for (const char of text) {
      if (char === '{') depth += 1;
      if (char === '}' && --depth < 0) return false;
    }
    return depth === 0;
  };
  assert.deepEqual(values.filter(([, text]) => text.includes('{{')).map(([key]) => key), []);
  assert.deepEqual(values.filter(([, text]) => !balanced(text)).map(([key]) => key), []);
});
