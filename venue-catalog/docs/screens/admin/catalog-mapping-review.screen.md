---
specVersion: 1
kind: screen
appId: venue-catalog
screenId: catalog-mapping-review
name: Catalog Mapping Review
status: draft
route: /catalog/mappings/:mappingId
layout: admin-shell
zone: admin
roles: [PLATFORM_ADMIN, APP_EDITOR]
auth: required
flowRefs:
  - ../../flows/platform-place-import.flow.md
apiRefs:
  - ../../api/catalog-mappings.api.md
  - ../../api/catalog-places.api.md
abstractions:
  components:
    - "@platform/core/components/form"
    - "@platform/core/components/dialog"
    - "@platform/core/components/empty-state"
  patterns:
    - diff-preview
---

# Catalog Mapping Review

## Intent

Construire et valider la projection finale vers une app cible, avec taxonomie app-specifique, preview du payload publie et publication versionnee.

## Route et acces

- Route : `/catalog/mappings/:mappingId`
- Layout : `admin-shell`
- Auth : required
- Roles autorises : `PLATFORM_ADMIN`, `APP_EDITOR`
- Tenant requis : non

## Donnees necessaires

| Donnee | Source | Quand chargee | Mise en cache |
|---|---|---|---|
| mapping complet | [catalog-mappings API](../../api/catalog-mappings.api.md) | onInit | none |
| fiche canonique source | [catalog-places API](../../api/catalog-places.api.md) | onInit | none |

## Mock API consommee

- `GET /api/v1/catalog/mappings/:id`
- `PATCH /api/v1/catalog/mappings/:id`
- `POST /api/v1/catalog/mappings/:id/publish`
- `POST /api/v1/catalog/mappings/:id/disable`
- `GET /api/v1/catalog/places/:id`

## Etats

### loading
- skeleton formulaire + preview payload.

### empty
- mapping inexistant ; retour recherche.

### error
- echec chargement ou publication ; garder le formulaire local.

### success
- formulaire de classification, preview JSON logique de projection, bandeau de statut (`DRAFT`, `READY`, `SYNC_REQUIRED`, `PUBLISHED`).

## Actions utilisateur

| Action | Declencheur | Resultat |
|---|---|---|
| modifier la taxonomie | formulaire | met a jour `classification` |
| editer la projection | formulaire | recalcul preview |
| publier | bouton primaire | expose la projection dans l'API consumer |
| desactiver | action danger | retire la projection des exports futurs |

## Composants utilises

| Composant | Source | Role dans l'ecran |
|---|---|---|
| form | `@platform/core/components/form` | edition classification/projection |
| dialog | `@platform/core/components/dialog` | confirmation publish/disable |
| empty-state | `@platform/core/components/empty-state` | mapping absent |

## Composants internes (non reutilisables)

- `ProjectionPreviewPanel`
- `ConsumerContractHints`
- `DiffSummaryBlock`

## Validations et regles metier

- Un mapping Layali `venue` exige au minimum `slug`, `name`, `city`, `address`, `geo`.
- Un mapping Beauty `salon` exige au minimum `slug`, `name`, `city`, `address`, `location`, `phone`.
- Toute edition apres publication force `SYNC_REQUIRED` avant republish.

## i18n

- Cles principales attendues : `venueCatalog.catalogMappingReview.*`.

## Criteres d'acceptation

- [ ] L'ecran rend correctement chacun des 4 etats.
- [ ] Les permissions sont controlees avant rendu.
- [ ] Aucun appel direct a un endpoint hors `apiRefs` du frontmatter.
- [ ] Le bundle de l'ecran ne reimplemente pas une abstraction listee dans `abstractions`.

## Open questions

- Faut-il permettre l'edition JSON brute de la projection ou seulement des champs guides ? Decision provisoire : champs guides + preview JSON lecture seule.
