---
specVersion: 1
kind: flow
appId: venue-catalog
flowId: platform-place-import
name: Import provider -> revue -> projection app
status: draft
actor: PLATFORM_ADMIN
trigger: besoin de bootstraper ou rafraichir un lieu depuis Google Places
screensRefs:
  - ../screens/admin/catalog-search.screen.md
  - ../screens/admin/catalog-place-review.screen.md
  - ../screens/admin/catalog-mapping-review.screen.md
apiRefs:
  - ../api/catalog-jobs.api.md
  - ../api/catalog-places.api.md
  - ../api/catalog-mappings.api.md
---

# Import provider -> revue -> projection app

## Objectif

Creer ou mettre a jour un lieu canonique a partir de Google Places, le valider humainement, puis publier une projection stable exploitable par Layali, Beauty ou une autre app sans exposer le contrat provider brut.

## Acteur declencheur

- Persona : PLATFORM_ADMIN ou CATALOG_OPERATOR.
- Contexte : lancement d'une nouvelle ville, onboarding d'un nouveau lieu ou refresh d'une fiche deja publiee.

## Preconditions

- L'utilisateur dispose des droits `catalog.job.run` et/ou `catalog.mapping.*` selon l'etape.
- L'integration `:platform:integrations:google-places` est configuree avec credentials et quotas.
- L'app cible (`layali`, `beauty`, autre) a une taxonomie minimale definie pour ses projections.

## Etapes

| # | Ecran ou etat | Action utilisateur | Mock API | Branche / etat suivant |
|---|---|---|---|---|
| 1 | [catalog-search](../screens/admin/catalog-search.screen.md) | saisit une requete ou une zone geographique puis lance l'import | `POST /api/v1/catalog/jobs/google-places-search` | job cree -> 2 ; validation KO -> erreur |
| 2 | [catalog-search](../screens/admin/catalog-search.screen.md) | suit la progression du job et ouvre un resultat cree/mis a jour | `GET /api/v1/catalog/jobs/:id`, `GET /api/v1/catalog/places` | job `SUCCEEDED|PARTIAL` -> 3 ; `FAILED` -> reprise |
| 3 | [catalog-place-review](../screens/admin/catalog-place-review.screen.md) | verifie nom, categorie, adresse, qualite, doublons potentiels | `GET /api/v1/catalog/places/:id` | fiche correcte -> 4 ; doublon/faux positif -> 7 |
| 4 | [catalog-place-review](../screens/admin/catalog-place-review.screen.md) | corrige les champs necessaires puis approuve la fiche | `PATCH /api/v1/catalog/places/:id`, `POST /api/v1/catalog/places/:id/approve` | approuvee -> 5 |
| 5 | [catalog-mapping-review](../screens/admin/catalog-mapping-review.screen.md) | cree ou ouvre un mapping pour une app cible | `POST /api/v1/catalog/mappings`, `GET /api/v1/catalog/mappings/:id` | mapping pret -> 6 |
| 6 | [catalog-mapping-review](../screens/admin/catalog-mapping-review.screen.md) | ajuste la projection app-specifique puis publie | `PATCH /api/v1/catalog/mappings/:id`, `POST /api/v1/catalog/mappings/:id/publish` | publie -> 8 |
| 7 | [catalog-place-review](../screens/admin/catalog-place-review.screen.md) | archive un faux positif ou doublon | `POST /api/v1/catalog/places/:id/archive` | fin |
| 8 | etat consumer | l'app cible recupere les projections publiees | `GET /api/v1/catalog/apps/:appId/projections` | import consumer OK -> fin ; rejet consumer -> mapping `DISABLED` |

## Etats globaux du flow

- En cours : job provider en execution ou mapping en revision.
- Sauvegarde : la fiche canonique et le mapping restent modifiables tant qu'ils ne sont pas publies.
- Abandonne : un job peut etre laisse tel quel ; une fiche `DRAFT` ou un mapping `DRAFT` sont repris plus tard.

## Erreurs et reprises

- Quota Google depasse : le job passe `FAILED` avec `retryable=true` et peut etre relance par `PLATFORM_ADMIN`.
- Doubles resultats : l'operateur doit archiver le faux positif avant de publier un mapping.
- Projection incomplete : publication refusee tant que les champs obligatoires de l'app cible ne sont pas renseignes.

## Criteres d'acceptation

- [ ] Le flow peut aller d'une recherche Google Places a une projection `PUBLISHED` sans saisie hors spec.
- [ ] Les etats `FAILED`, `PARTIAL` et `duplicate_candidate` sont gerables sans intervention DB manuelle.
- [ ] L'app consommatrice lit une projection stable sans `googlePlaceId` en champ fonctionnel direct.

## Open questions

- Niveau d'automatisation autorise pour `AUTO_IF_SAFE` sur certains champs : a trancher par app.
