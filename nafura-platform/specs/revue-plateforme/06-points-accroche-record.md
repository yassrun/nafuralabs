# 06 — Points d'accroche du record

> Revue 2026-10-07, axe extensibilité (serveur). Taille **M** (back). Aucune dépendance.

## État (2026-10-07)

- **Lot 1 livré** : `validate`, `beforeSave`, `afterSave`, `beforeDelete`, `readOnlyFields`, `RecordRuleException` (422 / 409 `RECORD_REFUSED`), règles appliquées au seed (`RecordCatalog.Rules`), raison affichée par la liste et la fiche (`ruleRefusal`). Documenté dans `docs/PLATFORM.md` § Logique métier du record. Démo : fournisseur, demande d'achat. Test : `host-tests` `RecordRulesHostTest`.
- **Écart avec le contrat initial** : les endpoints ne sont **pas** `final`. Les contrôleurs sont des proxys CGLIB (`@Transactional`) ; une méthode `final` échappe au proxy (pas de transaction, champs injectés nuls). À la place, une redéfinition d'endpoint empêche le démarrage (`refuseRedefinedEndpoints`).
- Restent : lots 2 (`guard`, `blocked`), 3 (`afterTransition`, `Transitioned` documenté) et la partie transitions du lot 4.

## Objectif

Un BC peut mettre sa logique métier dans un `RecordController` (contrôle entre champs, valeur calculée, effet après enregistrement, condition de transition) sans redéfinir un endpoint, et sans jamais contourner les contrôles d'édition ni l'audit.

## Besoin

- `create`, `update`, `delete` et `fire` sont **publics et non `final`**. Aujourd'hui, la seule façon d'ajouter de la logique est de les redéfinir. Si on oublie `super` ou qu'on l'appelle au mauvais moment, on perd `requireEditable`, le statut initial, le tenant ou l'audit (`CrudAuditHook`).
- Bean Validation ne couvre que des contrôles sur un seul champ. « La date de fin est après la date de début », « le montant ne dépasse pas le plafond de la catégorie » : impossible à exprimer proprement.
- Le cycle de vie ne bloque une transition que sur des champs vides (`requires`). ARCHITECTURE.md règle 12 prévoit « la complétude des étapes peut conditionner une transition » : pas encore livré.
- Réagir à une transition (`@EventListener` sur `LifecycleEngine.Transitioned`) fonctionne, mais ce n'est écrit nulle part : ce n'est pas un contrat.
- Sektor en aura besoin d'emblée : totaux d'un bordereau, contrôles de cohérence d'une étude, verrouillage après validation.

## Existant

- `core/framework/…/record/RecordController.java` : méthodes protégées `repository()`, `labelField()`, `defaultSort()`, `recordResource()`, `find(id)`.
- `LifecycleEngine.fire(…)` : permission → `from` → `requires` → `apply` (publie `Transitioned`) → approbation.
- `Condition.holds(expression, record)` : évalue `champ op valeur` (`amount > 10000`) ; utilisé par `approval.when`.
- `CrudAuditHook` : `afterCreate`, `beforeUpdate`, `afterUpdate`, `afterDelete`.

## Contrat

### Lot 1 — Méthodes protégées

Dans `RecordController<E>`, toutes appelées **dans la transaction**, dans cet ordre :

```java
/** Contrôles entre champs. Renvoyer des erreurs donne un 422 { errors: { champ: message } } ; rien n'est enregistré. */
protected Map<String, String> validate(E record, @Nullable E previous) { return Map.of(); }

/** Avant l'enregistrement, après validate : valeurs calculées, normalisation. previous est null à la création. */
protected void beforeSave(E record, @Nullable E previous) { }

/** Après l'enregistrement et l'audit : effets (recalcul d'un parent, création de lignes). */
protected void afterSave(E saved, @Nullable E previous) { }

/** Avant la suppression, après requireEditable : refuser par une exception 409 avec un message. */
protected void beforeDelete(E record) { }
```

- `previous` est une **copie** de l'état lu en base. Le BC ne la modifie pas.
- `create`, `update`, `delete`, `fire`, `list`, `get`, `options`, `properties`, `aggregate`, `lifecycle` et `transitions` deviennent `final`. Un endpoint supplémentaire reste possible (`POST /{id}/<action>`).

### Lot 2 — Condition de transition

- **Déclarative**, dans le cycle de vie JSON :
  ```json
  "guard": [{ "when": "amount <= 50000", "message": "Au-delà de 50 000, passer par un appel d'offres" }]
  ```
  `Condition.holds` est évalué sur le record. Une condition fausse donne un 422 avec le message. Les transitions dont une condition est fausse restent listées par `/{id}/transitions`, avec `"blocked": "<message>"`, pour que l'écran puisse expliquer pourquoi le bouton est désactivé.
- **En Java**, pour ce que l'expression ne sait pas dire :
  ```java
  /** Message de blocage, ou null si la transition est permise. Appelé après `requires` et `guard`. */
  protected @Nullable String guard(E record, String transition) { return null; }
  ```
- Le web désactive le bouton de transition et affiche le message en info-bulle quand `blocked` est présent.

### Lot 3 — Réagir à une transition

- `LifecycleEngine.Transitioned` devient un contrat public et documenté : `entityType`, `entityId`, `transition`, `from`, `to`, `actorId`, `tenantId`, `system`. Il est publié dans la transaction ; un écouteur `@TransactionalEventListener(AFTER_COMMIT)` sert aux effets externes.
- En plus, une méthode protégée `afterTransition(E record, String transition, String from)` dans le contrôleur, pour les effets sur le record lui-même ou ses enfants, dans la transaction.

### Lot 4 — Démo et tests

Le BC démo exerce chaque point (règle 11 d'ARCHITECTURE.md) :
- `validate` : `neededBy` d'une demande d'achat postérieure à sa date de création ;
- `beforeSave` : code fournisseur en majuscules ;
- `afterSave` : recalcul d'un total du projet parent ;
- `guard` déclaratif : plafond sur la soumission ;
- `guard` Java : un fournisseur bloqué ;
- `afterTransition` : date d'approbation renseignée.

Tests dans `host-tests` (BC `probe-bc`) : ordre d'appel, 422 et format des erreurs, rollback si `afterSave` lève une exception, `final` vérifié (un contrôleur qui redéfinit `create` ne compile plus).

## Règles

- Pas d'accès HTTP ni d'appel à une autre capability dans `validate` ni dans `guard` : ils doivent rester rapides et sans effet.
- Le seed passe par les mêmes points d'accroche (« à travers les règles des records ») ; `validate` peut donc bloquer un jeu de données invalide au démarrage, et c'est voulu.
- Pas de second mécanisme : pas de `@PrePersist` métier dans les entités de BC, pas de service CRUD autour du contrôleur.

## Vérification

1. `node platform-host/ops/run.mjs check` (host-tests compris).
2. Lab, BC démo : chaque cas du lot 4, à la main et par `scenario-api.sh`.
3. Fiche : le message de `validate` s'affiche sous le champ concerné ; une transition bloquée est désactivée et explique pourquoi.

## Critères d'acceptation

- [ ] Les endpoints de `RecordController` sont `final`.
- [ ] `validate`, `beforeSave`, `afterSave`, `beforeDelete`, `guard` et `afterTransition` sont livrés, documentés et testés.
- [ ] `guard` déclaratif dans le schéma du descripteur, refusé au démarrage si une expression ne se lit pas.
- [ ] `/{id}/transitions` renvoie `blocked`, et la fiche l'affiche.
- [ ] Le BC démo exerce chaque point.

## Documentation

- `docs/PLATFORM.md` § Données et API : sous-section « Logique métier du record » (ordre d'appel, codes HTTP).
- `docs/PLATFORM.md` § Cycle de vie : `guard`, `blocked`, `Transitioned`.
- `docs/ARCHITECTURE.md` (État et écarts) : retirer « conditions de transition calculées » de la ligne règle 10/12.
