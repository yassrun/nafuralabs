# 08 — Champs conditionnels et calculés

> Revue 2026-10-07, axes extensibilité et UX. Taille **S** (front). Aucune dépendance.

## Objectif

Dans une fiche, un champ ou une section peut s'afficher, se verrouiller ou devenir obligatoire selon les valeurs du record. Une valeur calculée peut s'afficher sans être stockée.

## Besoin

- `FormFieldConfig.readonly`, `disabled` et `required` sont des booléens fixes.
- Cas courants impossibles aujourd'hui :
  - « Motif du rejet » visible seulement si le statut est `REJECTED` ;
  - « Numéro de TVA » obligatoire seulement pour un fournisseur étranger ;
  - « Montant » verrouillé après soumission alors que d'autres champs restent modifiables (le cycle de vie ne connaît que `editable` par état, pour tout le record) ;
  - une section « Livraison » seulement pour les demandes de type « matériel ».
- Affichage calculé : « Montant TTC = HT × (1 + taux) » pendant la saisie, avant tout enregistrement.
- `PageAction` connaît déjà `when: (item) => boolean` : on reprend le même idiome.

## Existant

- `lib/anatomy/types/index.ts` : `FormFieldConfig` (l. 530).
- `platform/record/record-page.types.ts` : `RecordField = FormFieldConfig & { wide? }`, `RecordSection`.
- `platform/record/record-page.component.ts` : `sectionView(section, record)` construit les champs et reçoit déjà le record.
- `page-action.ts` : `when?: (item: T) => boolean`.

## Contrat

### Lot 1 — Conditions sur les champs et les sections

```ts
// RecordField
/** Affiché seulement si vrai (évalué sur le brouillon). Masqué = non envoyé ? Voir Règles. */
visible?: (record: Row) => boolean;
/** Verrouillé si vrai, en plus de l'édition du cycle de vie. */
locked?: (record: Row) => boolean;
/** Obligatoire si vrai, en plus de `required`. */
requiredWhen?: (record: Row) => boolean;

// RecordSection
visible?: (record: Row) => boolean;
```

- Évaluées dans un `computed` sur le brouillon. Pas de méthode qui crée un objet dans le template (règle de UI.md, NG0100 / NG0103).
- `readonly` et `disabled` fixes restent.

### Lot 2 — Valeur calculée affichée

```ts
// RecordField, type 'computed' : non saisissable, jamais envoyé
compute?: (record: Row) => unknown;
format?: 'money' | 'number' | 'date' | 'percent';
```

- Affichage seulement. Si la valeur doit être stockée ou filtrable, elle passe par le serveur : `@Formula` ou `beforeSave` ([06](06-points-accroche-record.md)).

### Lot 3 — Cohérence serveur

- `requiredWhen` n'est qu'un confort de saisie : la règle métier vit dans `validate` ([06](06-points-accroche-record.md)). La spec le dit explicitement dans UI.md.
- `locked` côté web n'empêche rien côté serveur. Pour un verrouillage par champ garanti, le cycle de vie JSON gagne `editableFields` par état :
  ```json
  "editableFields": { "SUBMITTED": ["comment"] }
  ```
  `update` ignore (ou refuse par un 422 ; décision ci-dessous) les autres champs dans cet état, et `/lifecycle` l'expose pour que la fiche verrouille sans configuration en double.

### Lot 4 — Démo

Demande d'achat : motif de rejet visible si `REJECTED` ; total TTC calculé ; `editableFields` sur `SUBMITTED`. Fournisseur : section « International » visible si le pays n'est pas le Maroc.

## Règles

- Un champ masqué garde sa valeur dans le brouillon et l'envoie (pas de perte silencieuse). Décision ouverte ci-dessous.
- Les fonctions ne font aucun appel HTTP : ce sont des fonctions pures du record.

## Vérification

1. `node platform-host/ops/run.mjs check`.
2. Lab : chaque cas du lot 4. Changer le statut ou le type fait apparaître ou disparaître le champ sans rechargement. Aucune erreur NG0100 / NG0103 dans la console.
3. `PUT` forcé sur un champ hors `editableFields` : comportement retenu (ignoré ou 422).

## Critères d'acceptation

- [ ] `visible`, `locked`, `requiredWhen` sur les champs ; `visible` sur les sections.
- [ ] Type `computed` avec `compute` et `format`.
- [ ] `editableFields` dans le cycle de vie, appliqué par `update`, exposé par `/lifecycle` et appliqué par la fiche.
- [ ] Démo à jour.

## Documentation

- `docs/UI.md` § Champs : conditions et type `computed`, avec la règle « le serveur fait foi ».
- `docs/PLATFORM.md` § Cycle de vie : `editableFields`.

## Décisions ouvertes

1. Un champ masqué : envoyé avec sa valeur (recommandé, pas de perte), ou remis à `null` ?
2. Champ hors `editableFields` dans un `PUT` : ignoré en silence (comme les champs gérés aujourd'hui), ou 422 ? Recommandation : ignoré, par cohérence avec `MANAGED`.
