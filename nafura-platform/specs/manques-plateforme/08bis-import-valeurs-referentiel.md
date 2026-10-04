# 08 bis — Import : valeurs de référentiel

## Objectif

Compléter « Créer une fiche depuis un document » (livré, `docs/UI.md`) : quand le champ cible est une liste de choix (`select` / `multiselect` à `lookupKey`), la valeur extraite du document est **rapprochée des options du référentiel** au lieu d’être recopiée en texte.

## Besoin

Une fiche de poste dit « Réceptionniste », un CV « Anglais courant » : les champs Métier et Langues pointent sur des référentiels. Sans rapprochement, ces champs restent vides ou faux, alors que ce sont les critères qui servent au classement.

## Existant

- `docs/UI.md`, ligne « Créer une fiche depuis un document » : `import: { docType, map, accept, label }`, réponse `{ fields: { source: { value, confidence? } } }`, seuil « à vérifier » à 0,6.
- Les options d’un lookup : `GET <endpoint>/options` (`RecordController.options`, `[{ value, label }]`, recherche `q`).

## Contrat

- Aucun nouveau paramètre de configuration : le rapprochement s’applique **automatiquement** à tout champ cible ayant un `lookupKey`.
- Règle, dans cet ordre :
  1. égalité du libellé normalisé (casse, accents, espaces, pluriel simple) → option choisie ;
  2. sinon recherche `?q=` sur `/options` : un seul résultat → option choisie mais **« à vérifier »** ; plusieurs → aucune, « à vérifier », le texte extrait affiché en indice sous le champ ;
  3. aucun → champ vide, « à vérifier », texte extrait en indice.
- `multiselect` : chaque valeur extraite est traitée séparément ; les non rapprochées sont listées en indice.
- Jamais de création d’option ni de valeur hors référentiel.
- Le rapprochement se fait côté web, après la réponse d’extraction (une requête `/options?q=` par valeur, en parallèle, plafonnée).

## Démo

- Article créé depuis un document : la « Catégorie » du document (« informatique ») est rapprochée de la catégorie seedée « Informatique » ; une catégorie inconnue reste vide, « à vérifier », avec le texte en indice.
- Test web unitaire de la fonction de rapprochement (normalisation, un résultat, plusieurs, aucun).

## Critères d’acceptation

- [ ] « informatique » → « Informatique » choisie sans alerte.
- [ ] Une valeur ambiguë ou inconnue laisse le champ vide, marqué, avec le texte extrait visible.
- [ ] Aucune option n’est créée.

## Documentation

`docs/UI.md`, ligne « Créer une fiche depuis un document » : une phrase sur le rapprochement des listes de choix. Puis supprimer ce fichier.

## Décisions ouvertes

Aucune.
