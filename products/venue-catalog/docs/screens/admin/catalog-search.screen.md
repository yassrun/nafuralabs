---
specVersion: 1
kind: screen
appId: venue-catalog
screenId: catalog-search
name: Catalog Search and Import
status: draft
route: /catalog/search
layout: admin-shell
zone: admin
roles: [PLATFORM_ADMIN, CATALOG_OPERATOR, APP_EDITOR]
auth: required
flowRefs:
  - ../../flows/platform-place-import.flow.md
apiRefs:
  - ../../api/catalog-jobs.api.md
  - ../../api/catalog-places.api.md
abstractions:
  components:
    - "@platform/core/components/table"
    - "@platform/core/components/form"
    - "@platform/core/components/empty-state"
  patterns:
    - async-job-polling
---

# Catalog Search and Import

## Intent

Ecran d'entree du back-office catalogue pour lancer des imports Google Places, suivre les jobs et parcourir les lieux canoniques deja crees ou mis a jour.

## Route et acces

- Route : `/catalog/search`
- Layout : `admin-shell`
- Auth : required
- Roles autorises : `PLATFORM_ADMIN`, `CATALOG_OPERATOR`, `APP_EDITOR`
- Tenant requis : non

## Donnees necessaires

| Donnee | Source | Quand chargee | Mise en cache |
|---|---|---|---|
| liste lieux catalogue | [catalog-places API](../../api/catalog-places.api.md) | onInit + filtre | session courte |
| jobs recents | [catalog-jobs API](../../api/catalog-jobs.api.md) | onInit | none |

## Mock API consommee

- `GET /api/v1/catalog/places`
- `GET /api/v1/catalog/jobs`
- `GET /api/v1/catalog/jobs/:id`
- `POST /api/v1/catalog/jobs/google-places-search`

## Etats

### loading
- skeleton du tableau + panneau de filtres inactif.

### empty
- aucun lieu en base ou aucun resultat pour les filtres ; CTA principal `Lancer un import`.

### error
- echec chargement liste ou job ; bandeau retry et affichage `traceId`.

### success
- formulaire de recherche/import en haut, tableau des lieux au centre, panneau lateral des jobs recents.

## Actions utilisateur

| Action | Declencheur | Resultat |
|---|---|---|
| lancer un import texte | bouton primaire | cree un job puis affiche la progression |
| filtrer les lieux a revoir | filtre `needsReview` | raffraichit la liste |
| ouvrir une fiche lieu | clic ligne tableau | navigation vers `/catalog/places/:placeId` |
| ouvrir le detail d'un job | clic badge job | ouvre un drawer de diagnostic |

## Composants utilises

| Composant | Source | Role dans l'ecran |
|---|---|---|
| table | `@platform/core/components/table` | listing des lieux |
| form | `@platform/core/components/form` | saisie requete/provider options |
| empty-state | `@platform/core/components/empty-state` | etat vide initial et filtres sans resultat |

## Composants internes (non reutilisables)

- panneau `JobRecentList`
- badge `QualityPill`
- drawer `ImportDiagnostics`

## Validations et regles metier

- Lancer un import exige au minimum `q` ou un couple `lat,lng,radiusMeters`.
- `APP_EDITOR` peut consulter la liste mais ne peut pas lancer un import sans permission `catalog.job.run`.

## i18n

- Cles principales attendues : `venueCatalog.catalogSearch.*`.

## Criteres d'acceptation

- [ ] L'ecran rend correctement chacun des 4 etats.
- [ ] Les permissions sont controlees avant rendu.
- [ ] Aucun appel direct a un endpoint hors `apiRefs` du frontmatter.
- [ ] Le bundle de l'ecran ne reimplemente pas une abstraction listee dans `abstractions`.

## Open questions

- Faut-il afficher les lieux deja publies par defaut ou prioriser toujours `needsReview=true` ? Decision provisoire : prioriser `needsReview`.
