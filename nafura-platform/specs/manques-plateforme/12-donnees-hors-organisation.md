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

- **Liaison** : un enregistrement d’organisation (`TenantEntity`) qui référence un enregistrement de personne, ex. `Application { tenantId, profileId, … }`. Déclaration : `@SharesWith(target = Profile.class, via = "profileId", fields = {...}, while = "status != 'WITHDRAWN'")` (forme à préciser) — l’organisation lit le profil lié, **en lecture seule**, limité aux champs déclarés, tant que la liaison existe et satisfait la condition.
- Le propriétaire voit les liaisons qui le concernent (ex. ses candidatures) sans voir le reste de l’organisation : projection déclarée sur la liaison.
- Contrôleurs : `OwnedRecordController<E extends OwnedEntity>` (le propriétaire gère le sien) et `ProductRecordController<E extends ProductEntity>` (opérateur), mêmes conventions que `RecordController`.
- Seeds : `kind: "reference"` d’un `ProductEntity` appliqué **une fois** au produit, pas par organisation.
- Schéma : tables sans `tenant_id` pour ces portées ; le garde-fou d’entité (`ddl-auto: validate` + contrôle) refuse une entité métier sans portée déclarée.

## Sécurité

- Lecture d’un `OwnedEntity` par une organisation **uniquement** par une liaison valide : host-test dédié (une organisation sans liaison → 404 ; liaison retirée → 404).
- Écriture d’un `OwnedEntity` uniquement par son propriétaire (l’organisation ne modifie jamais le profil ; elle annote sa liaison).
- Journal d’audit des lectures cross-organisation (qui a lu quel profil, par quelle liaison).

## Démo

Fiche société partagée :
- `SupplierProfile` (`OwnedEntity`, propriétaire = contact fournisseur externe de la spec 11) : raison sociale, ville, certifications.
- `Supplier` existant (`TenantEntity`) gagne `profileId` (liaison « référencement ») ; l’organisation voit le profil lié en lecture seule dans la fiche fournisseur.
- `Category` devient (ou une nouvelle entité devient) `ProductEntity` pour montrer un référentiel commun — **choisir** sans casser l’arbre de catégories existant.
- `scenario-api.sh` : le contact modifie son profil → 200 ; l’organisation A (liée) le lit → 200 ; l’organisation B (non liée) → 404 ; l’organisation A tente de le modifier → 403.
- host-test : `CrossOrganizationSharingHostTest`.

## Critères d’acceptation

- [ ] Un profil externe est visible par une organisation seulement via une liaison, en lecture seule, champs limités.
- [ ] Retirer la liaison coupe l’accès immédiatement.
- [ ] Un référentiel produit est commun à toutes les organisations et seedé une fois.
- [ ] Aucune entité métier sans portée déclarée ne passe le démarrage.

## Documentation

`docs/ARCHITECTURE.md` : règle « Portées des données » ; `docs/PLATFORM.md` : section « Données et API : le record » (trois portées, liaison) et « Données initiales » (seed produit).

## Décisions ouvertes (à trancher avant de coder)

1. **Forme de la déclaration de partage** (`@SharesWith` sur la liaison, ou section `sharing` dans le manifeste du BC) — **recommandation** : annotation sur l’entité de liaison, vérifiée au démarrage ; le manifeste reste réservé aux permissions et à la navigation.
2. **Consentement** : le propriétaire doit-il consentir explicitement à chaque partage (vivier, recherche par les organisations) — **recommandation** : la création de la liaison par le propriétaire lui-même (postuler) vaut consentement ; tout partage initié par l’organisation exige un consentement enregistré.
3. **Référentiel produit vs données `reference` par organisation** : quand utiliser l’un ou l’autre — **recommandation** : produit quand l’organisation ne doit pas pouvoir modifier ; par organisation sinon.
