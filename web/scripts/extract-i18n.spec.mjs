/**
 * extract-i18n.spec.mjs — Tests unitaires pour l'extracteur i18n.
 *
 * Lancer :  node --test web/scripts/extract-i18n.spec.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import extractor from './extract-i18n.mjs';

const {
  extractFromHtml,
  extractFromTs,
  looksFrench,
  slugify,
  buildSuggestedKey,
  inferModuleFeature,
} = extractor;

// ────────────────────────────────────────────────────────────────────────────
// 1. Détection texte dans >...< simple
// ────────────────────────────────────────────────────────────────────────────
test('1. extractFromHtml détecte le texte brut entre balises', () => {
  const html = `<div><span>Liste des factures clients</span></div>`;
  const matches = extractFromHtml(html);
  const texts = matches.filter((m) => m.kind === 'template_text');
  assert.equal(texts.length, 1, 'doit produire 1 match texte');
  assert.equal(texts[0].rawString, 'Liste des factures clients');
});

// ────────────────────────────────────────────────────────────────────────────
// 2. Ignorance si contient `| translate`
// ────────────────────────────────────────────────────────────────────────────
test('2. extractFromHtml ignore les textes déjà traduits via `| translate`', () => {
  const html = `<button>{{ 'ventes.facture.actions.emit' | translate }}</button>`;
  const matches = extractFromHtml(html);
  const texts = matches.filter((m) => m.kind === 'template_text');
  assert.equal(texts.length, 0, 'aucun match attendu sur du contenu déjà traduit');
});

// ────────────────────────────────────────────────────────────────────────────
// 3. Détection attribut [title]= / title=
// ────────────────────────────────────────────────────────────────────────────
test('3. extractFromHtml détecte les attributs traduisibles', () => {
  const html = [
    `<input placeholder="Rechercher un client" />`,
    `<button [title]="'Ajouter une facture'">+</button>`,
    `<img alt="Logo de la société" src="" />`,
    `<span aria-label="Bouton supprimer">x</span>`,
  ].join('\n');
  const matches = extractFromHtml(html);
  const attrs = matches.filter((m) => m.kind === 'template_attr');
  assert.ok(attrs.length >= 4, `attendu ≥ 4 matches d'attributs, reçu ${attrs.length}`);
  const raws = attrs.map((m) => m.rawString);
  assert.ok(raws.includes('Rechercher un client'));
  assert.ok(raws.includes('Ajouter une facture'));
  assert.ok(raws.includes('Logo de la société'));
  assert.ok(raws.includes('Bouton supprimer'));
});

// ────────────────────────────────────────────────────────────────────────────
// 4. Détection toast.success('Sauvegardé !')
// ────────────────────────────────────────────────────────────────────────────
test('4. extractFromTs détecte les appels toast.*', () => {
  const ts = `
    this.toast.success('Sauvegardé avec succès !');
    this.toast.error("Erreur lors de l'enregistrement");
    notify.warning(\`Attention au montant total saisi\`);
  `;
  const matches = extractFromTs(ts);
  const toasts = matches.filter((m) => m.kind === 'toast');
  assert.equal(toasts.length, 3, `attendu 3 toasts, reçu ${toasts.length}`);
  const raws = toasts.map((m) => m.rawString);
  assert.ok(raws.includes('Sauvegardé avec succès !'));
  assert.ok(raws.includes("Erreur lors de l'enregistrement"));
});

// ────────────────────────────────────────────────────────────────────────────
// 5. Détection STATUS_LABELS = { BROUILLON: 'Brouillon' }
// ────────────────────────────────────────────────────────────────────────────
test('5. extractFromTs détecte les valeurs dans *_LABELS', () => {
  const ts = `
    export const STATUS_LABELS: Record<FactureStatus, string> = {
      BROUILLON: 'Brouillon en cours',
      EMISE: 'Émise au client',
      PAYEE: 'Payée intégralement',
    };
  `;
  const matches = extractFromTs(ts);
  const labels = matches.filter((m) => m.kind === 'status_label');
  assert.equal(labels.length, 3, `attendu 3 labels, reçu ${labels.length}`);
  const raws = labels.map((m) => m.rawString);
  assert.ok(raws.includes('Brouillon en cours'));
  assert.ok(raws.includes('Émise au client'));
  assert.ok(raws.includes('Payée intégralement'));
  // Contexte doit nommer le LABELS et la clé.
  assert.ok(labels[0].context.startsWith('STATUS_LABELS.'));
});

// ────────────────────────────────────────────────────────────────────────────
// 6. Ignorance des strings courtes (≤ 3 chars)
// ────────────────────────────────────────────────────────────────────────────
test('6. looksFrench rejette les strings trop courtes', () => {
  assert.equal(looksFrench('Le'), false, '"Le" (2 chars) doit être rejeté');
  assert.equal(looksFrench('Ok'), false, '"Ok" doit être rejeté');
  assert.equal(looksFrench('xy'), false, '"xy" doit être rejeté');
  // Cas template : pas de match pour <span>OK</span>.
  const matches = extractFromHtml(`<span>OK</span>`);
  assert.equal(matches.filter((m) => m.kind === 'template_text').length, 0);
});

// ────────────────────────────────────────────────────────────────────────────
// 7. Ignorance des strings sans signe français
// ────────────────────────────────────────────────────────────────────────────
test('7. looksFrench rejette les strings sans signal FR', () => {
  // Pas d'accent, pas de mot stop FR.
  assert.equal(looksFrench('payment-method-id'), false);
  assert.equal(looksFrench('userId123'), false);
  assert.equal(looksFrench('SELECT * FROM users'), false);
  assert.equal(looksFrench('https://example.com/api'), false);
  // Mais accepte dès qu'il y a un accent ou un mot stop.
  assert.equal(looksFrench('Brouillon'), false, 'mot isolé sans accent ni stop → rejet (faux négatif assumé)');
  assert.equal(looksFrench('Émise'), true, 'accent FR → accepté');
  assert.equal(looksFrench('Voir tous les éléments'), true);
  assert.equal(looksFrench('Cliquer pour valider'), true, 'mot stop FR "pour" → accepté');
});

// ────────────────────────────────────────────────────────────────────────────
// 8. Génération de clé suggérée correcte pour un cas type
// ────────────────────────────────────────────────────────────────────────────
test('8. buildSuggestedKey produit la forme <module>.<feature>.<kind>.<slug>', () => {
  const relPath = 'web/app/applications/erp/pages/ventes/factures/facture-listing/facture-listing.page.html';
  const key = buildSuggestedKey(relPath, 'template_text', 'Liste des factures clients');
  assert.equal(key, 'ventes.factures.text.liste-des-factures-clients');

  const keyAttr = buildSuggestedKey(
    'web/app/applications/erp/pages/inventory/catalogue/articles/article-listing/article-listing.page.html',
    'template_attr',
    'Rechercher un article',
  );
  assert.equal(keyAttr, 'inventory.catalogue.label.rechercher-un-article');

  const keyToast = buildSuggestedKey(
    'web/app/applications/erp/pages/finance/journaux/journal-listing.page.ts',
    'toast',
    'Sauvegardé avec succès !',
  );
  assert.equal(keyToast, 'finance.journaux.toast.sauvegarde-avec-succes');

  // Fallback shared.misc quand le chemin ne matche aucun pattern connu.
  const keyShared = buildSuggestedKey('web/app/app.config.ts', 'error', 'Erreur fatale au démarrage');
  assert.equal(keyShared, 'shared.misc.error.erreur-fatale-au-demarrage');
});

// ────────────────────────────────────────────────────────────────────────────
// Tests additionnels (bonus, défensifs)
// ────────────────────────────────────────────────────────────────────────────

test('bonus: extractFromTs détecte confirm() / window.confirm() / alert()', () => {
  const ts = `
    if (confirm('Voulez-vous vraiment supprimer cet enregistrement ?')) doIt();
    window.confirm("Confirmer la suppression définitive");
    alert('Une erreur grave est survenue dans le traitement');
    const x = prompt('Saisissez votre référence client');
  `;
  const matches = extractFromTs(ts);
  const confirms = matches.filter((m) => ['confirm', 'alert', 'prompt'].includes(m.kind));
  assert.ok(confirms.length >= 4, `attendu ≥ 4, reçu ${confirms.length}`);
});

test('bonus: extractFromTs détecte throw new Error(...)', () => {
  const ts = `throw new Error('Impossible de charger les données du module');`;
  const matches = extractFromTs(ts);
  const errors = matches.filter((m) => m.kind === 'error');
  assert.equal(errors.length, 1);
  assert.equal(errors[0].rawString, 'Impossible de charger les données du module');
});

test('bonus: extractFromTs détecte templates inlines `template: ` ... `` ', () => {
  const ts = [
    'import { Component } from "@angular/core";',
    '@Component({',
    '  selector: "app-foo",',
    '  template: `',
    '    <h1>Bienvenue dans le module Ventes</h1>',
    '    <button title="Créer une nouvelle facture">+</button>',
    '  `,',
    '})',
    'export class FooComponent {}',
  ].join('\n');
  const matches = extractFromTs(ts);
  const texts = matches.filter((m) => m.kind === 'inline_template_text');
  const attrs = matches.filter((m) => m.kind === 'inline_template_attr');
  assert.ok(texts.some((m) => m.rawString === 'Bienvenue dans le module Ventes'));
  assert.ok(attrs.some((m) => m.rawString === 'Créer une nouvelle facture'));
});

test('bonus: slugify normalise les accents et limite à 4 mots', () => {
  assert.equal(slugify("Créer une nouvelle facture client"), 'creer-une-nouvelle-facture');
  assert.equal(slugify('Émise au client (définitif)'), 'emise-au-client-definitif');
  assert.equal(slugify(''), 'unnamed');
  assert.equal(slugify('x foo y bar z baz w', 3), 'foo-bar-baz', 'doit ignorer les mots < 2 lettres');
});

test('bonus: inferModuleFeature reconnaît ERP, platform et shell', () => {
  assert.deepEqual(
    inferModuleFeature('web/app/applications/erp/pages/finance/journaux/foo.ts'),
    { module: 'finance', feature: 'journaux' },
  );
  assert.deepEqual(
    inferModuleFeature('app/applications/erp/finance/journaux/services/journaux.facade.ts'),
    { module: 'finance', feature: 'journaux' },
    'doit reconnaître aussi le pattern direct (sans /pages/)',
  );
  assert.deepEqual(
    inferModuleFeature('web/app/platform/features/administration/iam/members/foo.ts'),
    { module: 'administration', feature: 'iam' },
  );
  assert.deepEqual(
    inferModuleFeature('web/app/applications/erp/shell/i18n-labels/foo.ts'),
    { module: 'shared', feature: 'i18n-labels' },
  );
  assert.deepEqual(
    inferModuleFeature('web/app/app.config.ts'),
    { module: 'shared', feature: 'misc' },
  );
});

test('bonus: extractFromHtml ignore property binding non littéral', () => {
  const html = `<input [placeholder]="article.name" /><input [title]="dynamic">`;
  const matches = extractFromHtml(html);
  assert.equal(matches.filter((m) => m.kind === 'template_attr').length, 0,
    'les bindings dynamiques ne doivent pas être détectés');
});
