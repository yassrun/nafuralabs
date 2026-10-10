import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { products } from '../../../../scripts/nafura.mjs';

/**
 * Spec 04 — héritage Sektor isolé.
 * Nouveaux imports des pages / événements listés interdits hors Sektor et hors allowlist (specs 01 / 02).
 */

const repo = fileURLToPath(new URL('../../../../../', import.meta.url));
const web = join(repo, 'nafura-platform/sources/web');
const SKIP = new Set(['node_modules', 'dist', 'build', '.angular', '.gradle']);

/**
 * Allowlist explicite (chemins relatifs à `sources/web`, ou `product/bcs/...` pour un BC).
 * Même mécanisme que l’ancienne tolérance `LegacyListingPageComponent` : retirer une entrée
 * dès que l’écran est migré (specs 01 / 02). Vide = plus d’exception plateforme.
 */
const LISTING_ALLOW = new Set([
  // ex. 'platform/administration/members/members-listing.page.ts'
]);

/** Idem pour ConfigDrivenDetailPage (spec 02). */
const DETAIL_ALLOW = new Set([
  // ex. 'platform/…/xxx-detail.page.ts'
]);

const RULES = [
  {
    id: 'Feature*Page',
    re: /\bFeature(?:Page|ListPage|DetailPage)Class\b|\bFeatureListPage\b/,
    replacement: 'nf-listing-page (listes) ou nf-record-page (fiches)',
    allow: null,
  },
  {
    id: 'ConfigDrivenListingPage',
    re: /\bConfigDrivenListingPage(?:Imports|Styles)?\b/,
    replacement: 'nf-listing-page',
    allow: LISTING_ALLOW,
  },
  {
    id: 'ConfigDrivenDetailPage',
    re: /\bConfigDrivenDetailPage(?:Imports|Styles)?\b/,
    replacement: 'nf-record-page',
    allow: DETAIL_ALLOW,
  },
  {
    id: 'ConfigDrivenWizardPage',
    re: /\bConfigDrivenWizardPage(?:Imports|Styles)?\b/,
    replacement: 'RecordPageConfig.createLayout en `steps`',
    allow: null,
  },
  {
    id: 'ConfigDrivenMasterSlavePage',
    re: /\bConfigDrivenMasterSlavePage(?:Imports|Styles)?\b/,
    replacement: 'écran spécifique déclaré (`spec.screens`) en attendant un archétype',
    allow: null,
  },
  {
    id: 'ConfigDrivenDashboardPage',
    re: /\bConfigDrivenDashboardPage(?:Imports|Styles)?\b/,
    replacement: 'écran spécifique déclaré (`spec.screens`) en attendant un archétype',
    allow: null,
  },
  {
    id: 'ConfigDrivenDocumentWorkspacePage',
    re: /\bConfigDrivenDocumentWorkspacePage(?:Imports|Styles)?\b/,
    replacement: 'écran spécifique déclaré (`spec.screens`) en attendant un archétype',
    allow: null,
  },
];

function walk(dir, keep, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, keep, files);
    else if (keep(entry.name)) files.push(full);
  }
  return files;
}

const isWebCode = (name) => /\.(ts|tsx|mjs|js)$/.test(name) && !name.endsWith('.generated.ts');
const isJava = (name) => name.endsWith('.java');

function codeLines(source) {
  return source.split(/\r?\n/).filter((line) => {
    const t = line.trim();
    return t && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
  });
}

function usesHeritage(source, re) {
  // Uniquement imports / extends — pas les mentions dans un garde-fou ou un commentaire.
  return codeLines(source).some(
    (line) => re.test(line) && (/^\s*import\b/.test(line) || /\bextends\b/.test(line)),
  );
}

function scanRoots() {
  const roots = [
    ['platform', join(web, 'platform')],
    ['features', join(web, 'features')],
    ['app', join(web, 'app')],
    ['core', join(web, 'core')],
  ];
  for (const product of products()) {
    const bcs = join(repo, product.dir, 'bcs');
    if (existsSync(bcs)) roots.push([`${product.dir}/bcs`, bcs]);
  }
  return roots;
}

test('héritage Sektor : pas de nouvel import hors allowlist (specs 01 / 02)', () => {
  const offenders = [];
  for (const [label, root] of scanRoots()) {
    const isBc = label.includes('/bcs');
    for (const file of walk(root, isWebCode)) {
      const key = isBc
        ? `${label}/${relative(root, file).split(sep).join('/')}`
        : relative(web, file).split(sep).join('/');
      const source = readFileSync(file, 'utf8');
      for (const rule of RULES) {
        if (!usesHeritage(source, rule.re)) continue;
        if (rule.allow?.has(key)) continue;
        offenders.push(`${key}: ${rule.id} — héritage Sektor, utiliser ${rule.replacement}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

test('le message du garde-fou nomme le remplaçant', () => {
  const rule = RULES.find((r) => r.id === 'Feature*Page');
  const sample = "import { FeatureListPage } from '@lib/anatomy';\n";
  assert.ok(usesHeritage(sample, rule.re));
  const message = `platform/example.ts: ${rule.id} — héritage Sektor, utiliser ${rule.replacement}`;
  assert.match(message, /nf-listing-page/);
});

/** Fichiers héritage encore autorisés à référencer l’événement (supprimés au lot 3 / ROADMAP 7). */
const ERP_EVENT_ALLOW = new Set([
  'ErpEntityTransitionEvent.java',
  'ErpNotificationPublisher.java',
  'ErpDomainNotificationListener.java',
]);

test('aucune classe plateforme ne publie ErpEntityTransitionEvent', () => {
  const backend = join(repo, 'nafura-platform/sources/backend');
  assert.ok(existsSync(join(backend, 'core/framework')), 'backend root');
  const offenders = [];
  for (const file of walk(backend, isJava)) {
    if (file.split(/[\\/]/).includes('build') || file.split(/[\\/]/).includes('host-tests')) continue;
    const name = file.split(/[\\/]/).pop();
    if (ERP_EVENT_ALLOW.has(name)) continue;
    const source = readFileSync(file, 'utf8');
    if (source.includes('ErpEntityTransitionEvent') || source.includes('ErpNotificationPublisher')) {
      offenders.push(relative(backend, file).split(sep).join('/'));
    }
  }
  assert.ok(walk(backend, isJava).length > 100, 'Java sources scanned');
  assert.deepEqual(
    offenders,
    [],
    'publier ErpEntityTransitionEvent est interdit — utiliser notify du cycle de vie JSON',
  );
});
