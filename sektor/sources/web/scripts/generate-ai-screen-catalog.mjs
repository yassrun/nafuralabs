#!/usr/bin/env node
/**
 * Builds the AI assistant screen catalog from the ERP sidebar + Anatomy listing routes.
 *
 * Sources of truth:
 *   - app/socle/shell/erp-sidebar.config.ts (list / menu screens)
 *   - app/.../config/listing/routes.ts       (create paths)
 *   - public/assets/i18n/applications/erp/fr.json (labels)
 *
 * Output: backend/socle/src/main/resources/ai/screen-catalog.json
 *
 *   node scripts/generate-ai-screen-catalog.mjs
 *   node scripts/generate-ai-screen-catalog.mjs --check
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');
const navPath = join(webRoot, 'app/socle/shell/erp-sidebar.config.ts');
const frPath = join(webRoot, 'public/assets/i18n/applications/erp/fr.json');
const appRoot = join(webRoot, 'app');
const outPath = join(webRoot, '../backend/socle/src/main/resources/ai/screen-catalog.json');

const CREATE_VERBS = ['ajoute', 'ajouter', 'créer', 'creer', 'create', 'nouveau'];

export function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

export function extractRoutedNodes(src) {
  const text = stripComments(src);
  const screens = [];

  function parseObject(start) {
    let i = start + 1;
    let depth = 1;
    const props = {};
    while (i < text.length && depth > 0) {
      if (text[i] === '{') {
        if (depth === 1) {
          i = parseObject(i);
          continue;
        }
        depth += 1;
        i += 1;
        continue;
      }
      if (text[i] === '}') {
        depth -= 1;
        i += 1;
        continue;
      }
      if (depth === 1) {
        const match = text.slice(i).match(/^(id|label|route):\s*'([^']+)'/);
        if (match) {
          props[match[1]] = match[2];
          i += match[0].length;
          continue;
        }
      }
      i += 1;
    }
    if (props.id && props.route) {
      screens.push({ id: props.id, labelKey: props.label || '', route: props.route });
    }
    return i;
  }

  let i = 0;
  while (i < text.length) {
    if (text[i] === '{') {
      i = parseObject(i);
    } else {
      i += 1;
    }
  }

  const seen = new Set();
  return screens.filter((s) => {
    if (seen.has(s.route)) return false;
    seen.add(s.route);
    return true;
  });
}

export function collectListingRoutes(appDir) {
  const byList = new Map();
  walk(appDir, (file) => {
    if (!file.endsWith(`${join('config', 'listing', 'routes.ts')}`) && !file.replaceAll('\\', '/').endsWith('config/listing/routes.ts')) {
      return;
    }
    const src = readFileSync(file, 'utf8');
    const list = firstArrayPath(src, 'list');
    const create = firstArrayPath(src, 'create');
    if (list && create) {
      byList.set(list, create);
    }
  });
  return byList;
}

function firstArrayPath(src, key) {
  const match = src.match(new RegExp(`${key}:\\s*\\[\\s*'([^']+)'`));
  return match ? match[1] : null;
}

function walk(dir, visit) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) {
      walk(full, visit);
    } else {
      visit(full);
    }
  }
}

export function flattenNavLabels(navNode) {
  const out = {};
  if (!navNode || typeof navNode !== 'object') return out;
  for (const [key, value] of Object.entries(navNode)) {
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  return out;
}

export function resolveLabel(labelKey, navLabels) {
  if (!labelKey) return '';
  const stripped = labelKey.startsWith('nav.') ? labelKey.slice(4) : labelKey;
  return navLabels[stripped] || humanizeId(stripped);
}

function humanizeId(id) {
  const tail = id.split('.').pop() || id;
  return tail
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

const EXTRA_KEYWORDS = {
  'etudes.devis': ['chiffrage', 'chiffrer', 'chiffre', 'quotation', 'quote'],
  'etudes.dossiers': ['appeldoffres'],
};

export function keywordsFor(id, route, label) {
  const tokens = new Set();
  for (const part of id.split('.')) addToken(tokens, part);
  for (const part of route.split('/').filter(Boolean)) addToken(tokens, part);
  if (label) {
    for (const word of label.toLowerCase().split(/[^a-z0-9àâäéèêëïîôùûüç]+/i)) {
      addToken(tokens, word);
    }
  }
  for (const extra of EXTRA_KEYWORDS[id] || []) {
    addToken(tokens, extra);
  }
  return [...tokens].filter((t) => t.length >= 3).slice(0, 16);
}

function addToken(set, raw) {
  if (!raw) return;
  const value = raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (value.length >= 3) {
    set.add(value);
    if (value.endsWith('s') && value.length > 4) {
      set.add(value.slice(0, -1));
    }
  }
}

export function buildCatalog({ navSource, frJson, listingByList, sourceFiles }) {
  const navLabels = flattenNavLabels(frJson.nav || {});
  const nodes = extractRoutedNodes(navSource);
  const screens = nodes.map((node) => {
    const label = resolveLabel(node.labelKey, navLabels);
    const createRoute = listingByList.get(node.route) || null;
    const keywords = keywordsFor(node.id, node.route, label);
    const help = createRoute
      ? `${label} : liste ${node.route}. Pour créer, ouvrez ${createRoute}.`
      : `${label} : ouvrez ${node.route}.`;
    return {
      id: node.id,
      labelKey: node.labelKey,
      label,
      route: node.route,
      createRoute,
      detailRoute: `${node.route.replace(/\/$/, '')}/{id}`,
      keywords,
      permissionKey: null,
      help,
    };
  });

  const hash = createHash('sha256');
  for (const file of sourceFiles) {
    hash.update(file);
  }
  hash.update(navSource);
  for (const [list, create] of [...listingByList.entries()].sort()) {
    hash.update(`${list}\0${create}\n`);
  }

  return {
    source: 'sektor/sources/web/app/socle/shell/erp-sidebar.config.ts',
    sourceHash: hash.digest('hex'),
    screens,
  };
}

export function catalogFromWorkspace(root = webRoot) {
  const navSource = readFileSync(join(root, 'app/socle/shell/erp-sidebar.config.ts'), 'utf8');
  const frJson = JSON.parse(readFileSync(join(root, 'public/assets/i18n/applications/erp/fr.json'), 'utf8'));
  const listingByList = collectListingRoutes(join(root, 'app'));
  return buildCatalog({
    navSource,
    frJson,
    listingByList,
    sourceFiles: ['erp-sidebar.config.ts', 'listing/routes.ts', 'erp/fr.json'],
  });
}

function stableStringify(catalog) {
  const copy = {
    source: catalog.source,
    sourceHash: catalog.sourceHash,
    screens: catalog.screens.map((s) => ({
      id: s.id,
      labelKey: s.labelKey,
      label: s.label,
      route: s.route,
      createRoute: s.createRoute,
      detailRoute: s.detailRoute,
      keywords: s.keywords,
      permissionKey: s.permissionKey,
      help: s.help,
    })),
  };
  return `${JSON.stringify(copy, null, 2)}\n`;
}

function main() {
  const check = process.argv.includes('--check');
  if (!existsSync(navPath) || !existsSync(frPath)) {
    console.error('Missing erp-sidebar.config.ts or fr.json');
    process.exit(1);
  }
  const catalog = catalogFromWorkspace(webRoot);
  const serialized = stableStringify(catalog);
  if (check) {
    if (!existsSync(outPath)) {
      console.error(`Missing catalog: ${relative(webRoot, outPath)}`);
      process.exit(1);
    }
    const current = readFileSync(outPath, 'utf8');
    if (current !== serialized) {
      console.error(
        'AI screen catalog is stale. Run: npm run ai:catalog\n' +
          `(source: ${relative(webRoot, navPath)})`
      );
      process.exit(1);
    }
    console.log(`AI screen catalog up to date (${catalog.screens.length} screens).`);
    return;
  }
  writeFileSync(outPath, serialized);
  console.log(
    `Wrote ${catalog.screens.length} screens → ${relative(webRoot, outPath)}`
  );
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invoked) {
  main();
}

// silence unused in library mode
void CREATE_VERBS;
