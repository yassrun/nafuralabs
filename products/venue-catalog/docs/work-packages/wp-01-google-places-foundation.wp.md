---
specVersion: 1
kind: work-package
appId: venue-catalog
wpId: wp-01-google-places-foundation
title: Google Places foundation and canonical catalog
status: draft
wave: 1
dependsOn: []
filesAllowed:
  - products/venue-catalog/web/**
  - products/venue-catalog/backend/**
filesForbidden:
  - nf/nafura/**
  - products/sektor-btp/**
abstractionsRequired:
  - ":platform:core:authorization"
  - ":platform:core:identity"
  - ":platform:features:collaboration:doc-manager"
  - "@platform/core/components"
abstractionsMissing:
  - ":platform:integrations:google-places"
  - ":platform:core:job-runner"
techSpecs:
  - ../backend-spring-boot.md
  - ../media-pipeline.md
---

# Google Places foundation and canonical catalog

## Scope

Implementer la fondation technique du service partage en **Spring Boot 3** : client Google Places, orchestration de jobs asynchrones, persistance PostgreSQL des lieux canoniques, **cache photos Google dans MinIO**, endpoints `catalog-places` et `catalog-jobs`, plus l'ecran admin Angular de recherche/import.

Specifications techniques obligatoires :
- [backend-spring-boot.md](../backend-spring-boot.md)
- [media-pipeline.md](../media-pipeline.md)

## Inputs

- Specs IA :
  - [app](../app.md)
  - [navigation](../navigation.md)
  - [mock-api](../mock-api.md)
  - [platform-place-import](../flows/platform-place-import.flow.md)
  - [catalog-search](../screens/admin/catalog-search.screen.md)
  - [catalog-places API](../api/catalog-places.api.md)
  - [catalog-jobs API](../api/catalog-jobs.api.md)
- Abstractions Nafura : authorization, identity, storage.

## Outputs attendus

- Fichiers crees ou modifies (chemins) :
  - `products/venue-catalog/backend/app/`
  - `products/venue-catalog/backend/modules/api/`
  - `products/venue-catalog/backend/modules/source-adapter/`
  - `products/venue-catalog/backend/modules/catalog-job/`
  - `products/venue-catalog/backend/modules/catalog-place/`
  - `products/venue-catalog/backend/modules/compliance/`
  - `products/venue-catalog/deploy/k8s/`
  - `products/venue-catalog/web/app/catalog/search/`
- Tests :
  - tests du client Google Places mocke
  - tests controller `catalog-jobs`, `catalog-places`
  - tests UI de l'ecran `catalog-search`
- Mock fixtures a charger : celles de `catalog-jobs` et `catalog-places`.

## Etapes proposees

1. Scaffolder le modular monolith Spring Boot (modules Gradle, Flyway, Docker Compose PG/Redis/MinIO).
2. Creer l'abstraction `:platform:integrations:google-places` (text search, nearby, details, **place photos**).
3. Creer l'abstraction `:platform:core:job-runner` avec statuts, retries et idempotence.
4. Implementer `catalog-place` : modele canonique, qualite, dedupe, table `catalog_place_media`.
5. Implementer `compliance` + `MediaSyncService` : Google Photo -> MinIO (`venue-catalog-media`), TTL 30j, URLs signees.
6. Implementer `catalog-job` : etape `SYNC_MEDIA` dans le pipeline async.
7. Implementer les endpoints `POST /jobs/google-places-search`, `POST /jobs/google-places-refresh`, `GET /jobs*`, `GET /places*`.
8. Ecrire l'ecran `catalog-search` connecte au backend (plus de mock local).
9. Lancer le pack pilote `BEAUTY-CASABLANCA` ([collection-campaigns.md](../collection-campaigns.md)).

## Criteres d'acceptation

- [ ] Les ecrans listes rendent les 4 etats.
- [ ] Les contrats Mock API sont respectes (rien d'invente hors `apiRefs`).
- [ ] Aucune abstraction n'est reimplementee localement.
- [ ] Les jobs provider sont asynchrones et idempotents.
- [ ] Un import reussi cree ou met a jour des lieux canoniques sans doublon evident.
- [ ] Chaque lieu importe a 1–5 photos dans MinIO avec `attributionText` et `expiresAt`.
- [ ] `GET /places/:id` retourne des URLs signees MinIO, jamais d'URL Google brute.

## Test plan

- Simuler un import `rooftop casablanca` et verifier creation de 5 fiches canonique avec un job `SUCCEEDED`.
- Verifier qu'un lieu a des entrees `catalog_place_media` et des objets dans le bucket `venue-catalog-media`.
- Verifier purge scheduler sur media expire (TTL test raccourci).
- Simuler un quota provider atteint et verifier `FAILED` + `retryable=true`.
- Verifier qu'une requete sans `q` ni geo est rejetee en `422`.

## Out of scope

- Publication vers Layali ou Beauty.
- Ecran detail de revue et mappings.

## Open questions

- Persistance raw payload en JSONB ou blob dedie : a arbitrer pendant l'implementation.
