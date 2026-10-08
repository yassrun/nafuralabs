# 11 — Formulaires et design system

> Revue 2026-10-08, axes UX et extensibilité. Taille **L** (front). Prérequis du lot 1 de la spec [09](09-marque-et-libelles-produit.md) : sans jetons uniques, un thème produit ne s'appliquerait qu'à moitié.

## Objectif

Une fiche se met en page uniquement par configuration (colonnes, largeurs, groupes). Elle se replie proprement sur mobile, et tous ses champs ont le même gabarit. Le rendu ne dépend que des jetons `--nf-*` : changer un jeton change toute l'application, y compris les composants Material.

## Besoin

- Grille limitée : `RecordSection.columns: 1 | 2`, `RecordField.wide`, et un `colSpan` hérité de `FormFieldConfig` non documenté (`wide` passe par-dessus). Impossible de faire 3 ou 4 colonnes, de forcer un retour à la ligne ou d'avoir des groupes dans une section.
- Un seul seuil de repli (container query à 640 px dans `nf-form`), rien pour la tablette.
- Deux gabarits de champ dans `nf-form` :
  - `mat-form-field` outline avec libellé flottant ;
  - atomes `nf-*` (`money`, `ice`, `rib`, `phone-ma`) avec libellé au-dessus (`nf-form__atom-label`).
  Les hauteurs et les libellés diffèrent. Un champ obligatoire vide affiche son libellé comme un placeholder, alors qu'un champ rempli l'affiche en flottant.
- Booléen mal aligné : la `mat-checkbox` est posée nue dans une cellule prévue pour un champ outline de 56 px.
- Fiche verrouillée = champs désactivés, pas une lecture.
- En-tête de fiche : le menu « … » se retrouve seul sur sa ligne, sous le titre.
- Design system :
  - deux sources de jetons : `core/styles/*` et `lib/anatomy/styles/tokens.scss` (« Anatomy ERP — BTP Maroc », avec des couleurs de chantier et des alias de rétrocompatibilité) ;
  - thème Material `prebuilt-themes/indigo-pink.css` importé par les produits (`platform-host`, `sandbox`) : case à cocher rose, sans lien avec `--nf-color-primary` ;
  - surcharges `--mdc-checkbox-*` de `platform/host/_host-global.scss`, probablement sans effet avec Material 22 ;
  - `lib/design-system/material-theme.scss` en API M2 (`define-palette`, `define-light-theme`), non importé ;
  - couleurs hexadécimales et espacements en dur dans `nf-form` (`#dc2626`, `#666`, `16px`, `24px`), alors qu'un BC n'a pas le droit d'en écrire.

## Existant

- `platform/record/record-page.types.ts` (`RecordSection`, `RecordField`, `RecordLayout`) et `record-page.component.ts` (`sectionView`, calcul de `colSpan`).
- `lib/anatomy/components/organisms/form/form.component.ts` (`nf-form` : grille, container query, `getFieldSpan`, `layout`, `columns`).
- `lib/anatomy/types/index.ts` (`FormFieldConfig.colSpan`).
- `core/styles/_colors.scss`, `_spacing.scss`, `_typography.scss` ; `lib/anatomy/styles/tokens.scss`.
- `platform/host/_host-global.scss` ; `core/theme/theme.service.ts` (`applyPrimaryColor`, mode sombre `.nf-theme-dark`).
- Atome `nf-switch`.

## Contrat

### Lot 1 — Jetons uniques et thème Material

- Une seule source : `core/styles/`, en trois niveaux :
  - **primitifs** : palettes et échelles brutes (`--nf-color-gray-500`, `--nf-space-4`) ;
  - **sémantiques** : rôle d'une valeur (`--nf-color-surface`, `--nf-color-text`, `--nf-color-text-muted`, `--nf-color-border`, `--nf-color-primary`, `--nf-color-danger`, `--nf-radius-control`, `--nf-font-family`) ;
  - **composants** : jetons d'un composant (`--nf-field-height`, `--nf-button-padding-x-md`), définis à partir des sémantiques.
  
  Un composant ne lit que des jetons sémantiques ou de composant, jamais un primitif. Le thème d'un produit (spec 09) et le mode sombre ne redéfinissent que des sémantiques.
  - La typographie de `tokens.scss` va dans `_typography.scss`, les tons de statut dans `_colors.scss`.
  - Les couleurs « chantier » et les alias de rétrocompatibilité sont supprimés.
  - `lib/anatomy/styles/tokens.scss` et `lib/design-system/material-theme.scss` sont supprimés.
- Thème Material M3 de la plateforme dans `platform/host/` (`mat.theme` + `mat.*-overrides`), alimenté par les `--nf-color-*`, mode sombre compris. Il est inclus par `host-global` : les produits n'importent plus de thème prébuilt (la ligne est retirée de `platform-host` et `sandbox`).
- Jetons de formulaire :
  - `--nf-field-height` ;
  - `--nf-form-gap-x`, `--nf-form-gap-y` ;
  - `--nf-form-group-gap` ;
  - `--nf-field-label-size`, `--nf-field-label-weight`, `--nf-field-label-color` ;
  - `--nf-color-danger` pour les erreurs et l'astérisque.
- Densité `comfortable` (défaut) / `compact` : une classe racine qui modifie `--nf-field-height` et les espacements. Elle sera pilotée par `spec.theme.density` (spec 09).
- `nf-form` ne contient plus aucune couleur hexadécimale ni aucun espacement en dur.
- Material est confiné à `lib/anatomy` : les 17 fichiers de `platform/`, `core/` et `features/` qui l'importent passent par les atomes `nf-*`. C'est ce qui permettra de changer de bibliothèque de composants sans toucher aux écrans (voir Règles).
- Garde-fous `architecture:check` :
  - refus d'un import de `prebuilt-themes` ;
  - refus d'une variable `--mdc-*` ;
  - refus d'une couleur hexadécimale dans `lib/anatomy/components/organisms/form/` ;
  - refus d'un import `@angular/material` ou d'une balise `mat-*` hors de `lib/anatomy` (Sektor exclu tant qu'il n'est pas reconstruit) ;
  - refus d'un jeton primitif lu par un composant de `lib/anatomy`.

### Lot 2 — Grille

```ts
interface RecordSection {
  columns?: 1 | 2 | 3 | 4; // défaut 2
}
type RecordField = FormFieldConfig & {
  span?: number | 'full'; // remplace `wide` et `colSpan`
  newRow?: boolean;       // commence une nouvelle ligne
};
```

- Largeur par défaut : `textarea` et `richtext` en `full`, tout le reste sur 1 colonne.
- `wide` et `colSpan` sont retirés (lab mode, pas de compatibilité). Le BC démo est migré.
- Repli par container query sur la largeur de la section :
  - au-delà de 960 px : `columns` ;
  - entre 640 et 960 px : `min(columns, 2)` ;
  - en dessous de 640 px : 1 colonne.
  
  Un `span` est toujours limité au nombre de colonnes effectif.
- Ordre = ordre de déclaration. Pas de position explicite (ligne, colonne).

### Lot 3 — Gabarit de champ unique

- Tous les types suivent la même structure : libellé au-dessus, contrôle de hauteur `--nf-field-height`, une ligne d'aide ou d'erreur réservée (pas de saut de mise en page à l'apparition d'une erreur).
- Plus de libellé flottant : le placeholder reste un exemple de saisie, jamais le libellé.
- Obligatoire : astérisque après le libellé, couleur `--nf-color-danger`.
- Booléen (`checkbox`, et propriété `boolean` sans type) : `nf-switch` aligné verticalement sur le contrôle des champs voisins de la même ligne.
- Lecture : quand la section n'est pas modifiable, `nf-form` affiche libellé + valeur, formatée comme dans une liste (`money` avec sa devise, `date` au format de la locale, `relation` par son `display`, `status` en badge, booléen en « Oui » / « Non »). Les champs ne sont plus désactivés. Une valeur vide s'affiche « — ».
- En-tête de fiche : les actions et le menu « … » sont sur la ligne du titre et passent à la ligne seulement si la largeur manque.

### Lot 4 — Groupes dans une section

```ts
interface RecordSection {
  groups?: RecordFieldGroup[];        // exclusif avec `fields`
  collapsible?: boolean | 'collapsed';
}
interface RecordFieldGroup {
  title?: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;            // défaut : celui de la section
  fields: RecordField[];
  visible?: (record: Row) => boolean;
}
```

- Rendu : sous-titre + séparateur dans la même carte. Pas de carte imbriquée.
- `collapsible` s'applique à la section entière ; `'collapsed'` l'ouvre fermée. Une section repliée qui contient une erreur s'ouvre à l'enregistrement.
- Les groupes répétés (lignes, adresses multiples) sont hors périmètre : sous-liste (`listing`) d'abord.

### Lot 5 — Qualité

- Accessibilité (WCAG 2.2 AA) :
  - libellé relié au contrôle (`for` / `aria-labelledby`), erreur reliée par `aria-describedby`, `aria-invalid` sur le champ en erreur ;
  - focus visible par un jeton (`--nf-focus-ring`) ;
  - cible tactile d'au moins 44 px en dessous de 640 px ;
  - contraste du texte et des bordures de champ vérifié en clair et en sombre ;
  - `prefers-reduced-motion` respecté (repli d'une section, ouverture d'un groupe).
- Préparation RTL : `nf-form` et `nf-record-page` n'utilisent que des propriétés logiques (`margin-inline-start`, `padding-inline`, `inset-inline-end`). La mise en page arabe complète reste un chantier séparé (spec 09, décision 2).
- Non-régression visuelle : captures Playwright de la vitrine `sandbox/` (formulaire 1 à 4 colonnes, groupes, lecture, erreurs) à 375, 768 et 1440 px, en clair et en sombre, comparées dans `check`.

## Règles

- Un BC ne configure que `columns`, `span`, `newRow`, `groups` et `collapsible` : aucun style.
- Pas de nouveau composant : tout se fait dans `nf-form` et `nf-record-page`.
- Le comportement s'applique aussi aux formulaires des actions de liste (`actions[].form`) et à `nf-form-dialog`, qui passent par `nf-form`.
- Changer d'apparence, trois niveaux :
  1. **Thème** (produit, organisation) : jetons sémantiques uniquement, via `spec.theme` (spec 09). Pas de CSS libre.
  2. **Préréglage** (produit) : un jeu complet de valeurs sémantiques livré par la plateforme (décision ouverte 5).
  3. **Bibliothèque de composants** (plateforme) : remplacer Material se fait une fois, dans les atomes de `lib/anatomy`, pour tous les produits. Un produit ne remplace jamais un composant.

## Vérification

1. `node platform-host/ops/run.mjs check`.
2. Lab, BC démo :
   - une fiche avec 4 colonnes, des `span`, un `newRow`, deux groupes, une section repliable ;
   - largeurs 375, 768 et 1440 px ;
   - mode sombre ;
   - fiche verrouillée en lecture.
3. Changer `--nf-color-primary` : case, switch, focus, sélection et boutons suivent tous.
4. `sandbox/` : vitrine du formulaire mise à jour.

## Critères d'acceptation

- [ ] Une seule source de jetons ; thème Material généré à partir des jetons ; `indigo-pink` retiré des produits.
- [ ] `columns` de 1 à 4, `span`, `newRow` ; `wide` et `colSpan` retirés ; repli en trois paliers.
- [ ] Gabarit de champ unique, booléen aligné, lecture formatée, actions sur la ligne du titre.
- [ ] `groups` et `collapsible`.
- [ ] Jetons en trois niveaux ; Material confiné à `lib/anatomy`.
- [ ] Accessibilité, propriétés logiques et captures de non-régression.
- [ ] Garde-fous ajoutés à `architecture:check`.

## Documentation

- `docs/UI.md` :
  - nouvelle section « Formulaires » (colonnes, `span`, `newRow`, groupes, booléen, lecture, mobile) ;
  - « Champs, colonnes, filtres » : retirer `wide` ;
  - « Ce que Sektor a fait » : rien à changer.
- `ROADMAP.md` 5 : « écrans utilisables sur mobile » couvert pour les fiches.

## Décisions ouvertes

1. Libellé au-dessus ou flottant ? Recommandation : au-dessus (formulaires denses, et plus de confusion entre placeholder et libellé).
2. Booléen : switch partout, ou case pour une acceptation (« J'accepte… ») ? Recommandation : switch, et case seulement avec une option d'affichage si un vrai besoin apparaît.
3. Fiche : garder `max-width: 1120px` ou passer en pleine largeur avec une colonne latérale (statut, activité) ? Recommandation : garder pour cette spec, colonne latérale dans une spec séparée.
4. Spec 09 : ajouter `font` (famille de police) à `spec.theme` ? Recommandation : oui, et rien d'autre que des jetons.
5. Préréglages (`spec.theme.preset`) ? Recommandation : pas avant qu'un deuxième produit ait un vrai besoin ; `primary`, `accent`, `radius`, `density` et `font` couvrent l'essentiel.
6. Source des jetons : SCSS à la main, ou fichier JSON au format W3C Design Tokens qui génère le CSS (et un jour une maquette Figma) ? Recommandation : SCSS tant qu'il n'y a pas d'outil de maquette partagé.
