import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const web = fileURLToPath(new URL('../..', import.meta.url));
const registry = readFileSync(new URL('./app-lucide-icons.ts', import.meta.url), 'utf8');
const exportBlock = registry.slice(registry.indexOf('export const APP_LUCIDE_ICONS'));
const provided = new Set([...exportBlock.matchAll(/^\s+(\w+)(?::|,)/gm)].map((match) => match[1]));

const patterns = [
  /\bicon\s*:\s*'([a-z][a-z0-9-]*)'/g,
  /\bheaderIcon\s*:\s*'([a-z][a-z0-9-]*)'/g,
  /\bicon="([a-z][a-z0-9-]*)"/g,
  /<lucide-(?:icon|angular)[^>]*\bname="([a-z][a-z0-9-]*)"/g,
  /\[img\]="'([a-z][a-z0-9-]*)'"/g,
];
const pascal = (name) => name.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');

function usedIcons() {
  const used = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|html)$/.test(entry.name) && !entry.name.endsWith('.spec.ts')) {
        const text = readFileSync(full, 'utf8');
        for (const pattern of patterns) {
          for (const match of text.matchAll(pattern)) {
            if (!used.has(match[1])) used.set(match[1], relative(web, full));
          }
        }
      }
    }
  };
  ['core', 'lib', 'features', 'app', 'platform'].forEach((dir) => walk(join(web, dir)));
  return used;
}

test('every icon used by platform screens is registered', () => {
  const used = usedIcons();
  const missing = [...used].filter(([name]) => !provided.has(pascal(name))).map(([name, file]) => `${name} (${file})`);

  assert.ok(used.size > 50, 'icon usages parsed');
  assert.deepEqual(missing, [], 'add the Lucide icon (or a Material-style alias) to APP_LUCIDE_ICONS');
});
