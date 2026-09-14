import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  extractRoutedNodes,
  keywordsFor,
  resolveLabel,
  flattenNavLabels,
  buildCatalog,
} from './generate-ai-screen-catalog.mjs';

test('extractRoutedNodes ignores parent groups without their own route', () => {
  const src = `
    export const NAV = [
      {
        id: 'catalogue',
        label: 'nav.catalogue',
        children: [
          {
            id: 'stock.catalogue.articles',
            label: 'nav.stock.articles',
            route: '/inventory/catalogue/articles',
          },
        ],
      },
    ];
  `;
  const nodes = extractRoutedNodes(src);
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].id, 'stock.catalogue.articles');
  assert.equal(nodes[0].route, '/inventory/catalogue/articles');
});

test('buildCatalog attaches Anatomy create routes and French labels', () => {
  const catalog = buildCatalog({
    navSource: `
      { id: 'stock.catalogue.articles', label: 'nav.stock.articles', route: '/inventory/catalogue/articles' }
    `,
    frJson: { nav: { 'stock.articles': 'Articles' } },
    listingByList: new Map([
      ['/inventory/catalogue/articles', '/inventory/catalogue/articles/new'],
    ]),
    sourceFiles: ['test'],
  });
  assert.equal(catalog.screens.length, 1);
  const article = catalog.screens[0];
  assert.equal(article.label, 'Articles');
  assert.equal(article.createRoute, '/inventory/catalogue/articles/new');
  assert.equal(article.detailRoute, '/inventory/catalogue/articles/{id}');
  assert.ok(article.keywords.includes('article'));
});

test('resolveLabel reads dotted nav keys', () => {
  const labels = flattenNavLabels({ 'stock.articles': 'Articles', chantiers: 'Chantiers' });
  assert.equal(resolveLabel('nav.stock.articles', labels), 'Articles');
});

test('keywords include singular form', () => {
  const keys = keywordsFor('stock.catalogue.articles', '/inventory/catalogue/articles', 'Articles');
  assert.ok(keys.includes('articles'));
  assert.ok(keys.includes('article'));
});

test('devis keywords include chiffrage synonyms', () => {
  const keys = keywordsFor('etudes.devis', '/etudes/devis', 'Devis');
  assert.ok(keys.includes('chiffre'));
  assert.ok(keys.includes('chiffrage'));
});
