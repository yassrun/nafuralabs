---
specVersion: 1
kind: screen
appId: venue-catalog
screenId: catalog-place-review
name: Catalog Place Review
status: draft
route: /catalog/places/:placeId
layout: split-review
zone: admin
roles: [PLATFORM_ADMIN, CATALOG_OPERATOR]
auth: required
flowRefs:
  - ../../flows/platform-place-import.flow.md
apiRefs:
  - ../../api/catalog-places.api.md
  - ../../api/catalog-jobs.api.md
  - ../../api/catalog-mappings.api.md
abstractions:
  components:
    - "@platform/core/components/form"
    - "@platform/core/components/dialog"
    - "@platform/core/components/empty-state"
  patterns:
    - dirty-form-guard
---

# Catalog Place Review

## Intent

Permettre la revue fine d'une fiche canonique importee, la resolution des doublons et l'approbation avant creation ou mise a jour d'un mapping d'app.

## Route et acces

- Route : `/catalog/places/:placeId`
- Layout : `split-review`
- Auth : required
- Roles autorises : `PLATFORM_ADMIN`, `CATALOG_OPERATOR`
- Tenant requis : non

## Donnees necessaires

| Donnee | Source | Quand chargee | Mise en cache |
|---|---|---|---|
| fiche canonique complete | [catalog-places API](../../api/catalog-places.api.md) | onInit | none |
| mapping summaries | [catalog-places API](../../api/catalog-places.api.md) | onInit | none |

## Mock API consommee

- `GET /api/v1/catalog/places/:id`
- `PATCH /api/v1/catalog/places/:id`
- `POST /api/v1/catalog/places/:id/approve`
- `POST /api/v1/catalog/places/:id/archive`
- `POST /api/v1/catalog/jobs/google-places-refresh`
- `POST /api/v1/catalog/mappings`

## Etats

### loading
- skeleton detail + panneau source.

### empty
- place introuvable ou archivee ; CTA retour recherche.

### error
- erreur API detail ou sauvegarde ; garder le formulaire local et proposer retry.

### success
- comparaison `source normalisee` / `valeur retenue`, panneau qualite, actions `Approve`, `Archive`, `Create mapping`.

## Actions utilisateur

| Action | Declencheur | Resultat |
|---|---|---|
| corriger un champ | formulaire detail | modifie la fiche locale |
| approuver | bouton primaire | passe le lieu en `REVIEWED` |
| relancer refresh provider | action secondaire | cree un job de refresh |
| archiver un doublon | action danger | passe en `ARCHIVED` |
| creer un mapping | bouton contextuel | navigation mapping review |

## Composants utilises

| Composant | Source | Role dans l'ecran |
|---|---|---|
| form | `@platform/core/components/form` | edition guidee |
| dialog | `@platform/core/components/dialog` | confirmation archive/approve |
| empty-state | `@platform/core/components/empty-state` | place introuvable |

## Composants internes (non reutilisables)

- `ProviderSnapshotPanel`
- `DuplicateCandidatesList`
- `ProjectionSummaryCards`

## Validations et regles metier

- `Approve` bloque si la fiche n'a pas `canonicalName`, `primaryCategory`, `address` et `geo`.
- `Archive` exige une raison.
- Une modification manuelle majeure peut forcer `manualReviewRequired=true` jusqu'a nouvelle approbation.

## i18n

- Cles principales attendues : `venueCatalog.catalogPlaceReview.*`.

## Criteres d'acceptation

- [ ] L'ecran rend correctement chacun des 4 etats.
- [ ] Les permissions sont controlees avant rendu.
- [ ] Aucun appel direct a un endpoint hors `apiRefs` du frontmatter.
- [ ] Le bundle de l'ecran ne reimplemente pas une abstraction listee dans `abstractions`.

## Open questions

- Faut-il une vue compare diff explicite entre payload source et valeur canonique pour tous les champs ou seulement ceux modifies ?
