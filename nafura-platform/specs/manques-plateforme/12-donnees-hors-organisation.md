# 12 — Données hors organisation

## Objectif

Permettre des enregistrements qui **n’appartiennent à aucune organisation** (un profil possédé par une personne externe, un référentiel commun au produit) et leur **partage contrôlé** avec des organisations à travers un enregistrement de liaison.

## Besoin

Un candidat a un seul profil et postule chez plusieurs entreprises ; un fournisseur a une seule fiche société référencée par plusieurs clients ; un référentiel de métiers est commun à toutes les organisations. Aujourd’hui toute entité métier `extends TenantEntity` (une organisation, filtrage systématique par `tenantId`).

## Existant

- `core/framework/.../domain/TenantEntity.java`, `context/TenantContext.java` ; `RecordController` filtre tout par `tenantId` (`specification()`, `find()`).
- Seeds `reference` : appliqués **par organisation** (copiés dans chacune).
- Spec 11 : audience externe et notion de propriétaire.

## Contrat

Deux nouvelles portées d’entité, à côté de `TenantEntity` (inchangé) :

| Portée | Classe de base | Qui écrit | Qui lit |
|---|---|---|---|
| Organisation (existant) | `TenantEntity` | membres de l’organisation | membres de l’organisation |
| Personne | `OwnedEntity` (`ownerId`, audit) | son propriétaire (audience externe) | son propriétaire ; une organisation **seulement à travers une liaison** |
| Produit | `ProductEntity` (audit) | l’opérateur du produit (spec 09) | tous les utilisateurs authentifiés (et le public si exposé, spec 10) |

- **Liaison** : un enregistrement d’organisation (`TenantEntity`) qui référence un enregistrement de personne, ex. `Application { tenantId, profileId, … }`. `@SharesWith` se pose sur l’entité de liaison. Les champs partagés sont une liste explicite : rien n’est partagé par défaut. L’organisation lit le profil lié, **en lecture seule**, limité à cette liste, tant que la liaison existe.
- Au démarrage, la plateforme recense les `@SharesWith` pour alimenter l’écran de consentement.
- Postuler (le propriétaire crée la liaison) vaut consentement. Un partage lancé par l’organisation exige un consentement enregistré : une date, la version de ce qui est partagé, et un moyen de le retirer. Un retrait déclenche l’effacement de la spec 11. Si la liste des champs partagés change, on redemande le consentement.
- Le propriétaire voit les liaisons qui le concernent (ex. ses candidatures) sans voir le reste de l’organisation : projection déclarée sur la liaison.
- Contrôleurs : `OwnedRecordController<E extends OwnedEntity>` (le propriétaire gère le sien) et `ProductRecordController<E extends ProductEntity>` (opérateur), mêmes conventions que `RecordController`.
- Seeds : les deux portées reprennent le format existant `kind: "reference"`, avec une portée `produit` ou `organisation`. Pas de nouveau mécanisme. Portée produit : lecture seule pour l’organisation, appliqué une fois. Portée organisation : le référentiel est propre à chaque organisation, qu’elle peut modifier.
- Schéma : tables sans `tenant_id` pour ces portées ; le garde-fou d’entité (`ddl-auto: validate` + contrôle) refuse une entité métier sans portée déclarée.

## Sécurité

- Lecture d’un `OwnedEntity` par une organisation **uniquement** par une liaison valide : host-test dédié (une organisation sans liaison → 404 ; liaison retirée → 404).
- Écriture d’un `OwnedEntity` uniquement par son propriétaire (l’organisation ne modifie jamais le profil ; elle annote sa liaison).
- Journal d’audit des lectures cross-organisation (qui a lu quel profil, par quelle liaison).

## Démo

Fiche société partagée :
- `SupplierProfile` (`OwnedEntity`, propriétaire = contact fournisseur externe de la spec 11) : raison sociale, ville, certifications.
- `Supplier` existant (`TenantEntity`) gagne `profileId` (liaison « référencement ») ; l’organisation voit le profil lié en lecture seule dans la fiche fournisseur.
- Le référentiel commun de la démo est un seed `kind: "reference"` de portée produit, en lecture seule pour les organisations. L’arbre de catégories existant, propre à chaque organisation, ne change pas de portée.
- `scenario-api.sh` : le contact modifie son profil → 200 ; l’organisation A (liée) le lit → 200 ; l’organisation B (non liée) → 404 ; l’organisation A tente de le modifier → 403.
- host-test : `CrossOrganizationSharingHostTest`.

## Critères d’acceptation

- [ ] Un profil externe est visible par une organisation seulement via une liaison, en lecture seule, champs limités.
- [ ] Retirer la liaison coupe l’accès immédiatement.
- [ ] Un référentiel produit est commun à toutes les organisations et seedé une fois.
- [ ] Aucune entité métier sans portée déclarée ne passe le démarrage.

## Documentation

`docs/ARCHITECTURE.md` : règle « Portées des données » ; `docs/PLATFORM.md` : section « Données et API : le record » (trois portées, liaison) et « Données initiales » (seed produit).

## Décisions (2026-10-04)

- Le partage se déclare par `@SharesWith` sur l’entité de liaison. Les champs partagés sont une liste explicite, et rien n’est partagé par défaut.
- Au démarrage, la plateforme recense les `@SharesWith` pour alimenter l’écran de consentement.
- Postuler vaut consentement. Un partage lancé par l’organisation exige un consentement enregistré, avec une date, la version de ce qui est partagé et un moyen de le retirer. Un retrait déclenche l’effacement de la spec 11. Si la liste des champs partagés change, on redemande le consentement.
- Le référentiel produit est en lecture seule pour l’organisation ; sinon, le référentiel est propre à chaque organisation. Les deux reprennent le format de seed existant (`kind: "reference"`) avec une portée produit ou organisation, sans nouveau mécanisme.

## État (2026-10-04)

Livré : `@SharesWith` (champs vides par défaut), recensement au démarrage, refus d’une entité `ma.nafura.bc` sans `TenantEntity` / `OwnedEntity` / `ProductEntity`, `scope` `organization` | `product` sur le seed existant. Un seed produit dont l’entité n’est pas `ProductEntity` empêche le démarrage. Les seeds organisation ignorent la portée produit.

Reste : écriture effective des records produit, enregistrement du consentement (date, version, retrait) et le lien vers l’effacement de la spec 11, exemple démo de liaison.
