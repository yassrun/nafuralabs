---
specVersion: 1
kind: work-package
appId: venue-catalog
wpId: wp-02-curation-and-publish
title: Curation, mappings and projection publish
status: draft
wave: 2
dependsOn: [wp-01-google-places-foundation]
filesAllowed:
  - web/app/applications/venue-catalog/**
  - backend/domains/venue-catalog/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:authorization"
  - ":platform:core:identity"
  - "@platform/core/components"
abstractionsMissing: []
---

# Curation, mappings and projection publish

## Scope

Implementer la revue detail des lieux, l'approbation, l'archivage des doublons, le mapping multi-apps et l'API de projection consommatrice pour Layali, Beauty et les futures apps.

## Inputs

- Specs IA :
  - [platform-place-import](../flows/platform-place-import.flow.md)
  - [catalog-place-review](../screens/admin/catalog-place-review.screen.md)
  - [catalog-mapping-review](../screens/admin/catalog-mapping-review.screen.md)
  - [catalog-places API](../api/catalog-places.api.md)
  - [catalog-mappings API](../api/catalog-mappings.api.md)
- Dependance : `wp-01-google-places-foundation`.

## Outputs attendus

- Fichiers crees ou modifies (chemins) :
  - `backend/domains/venue-catalog/catalog-mapping/`
  - `backend/domains/venue-catalog/publish-gateway/`
  - `backend/domains/venue-catalog/compliance/`
  - `web/app/applications/venue-catalog/catalog/place-review/`
  - `web/app/applications/venue-catalog/catalog/mapping-review/`
- Tests :
  - tests de statut `DRAFT -> READY -> PUBLISHED -> SYNC_REQUIRED`
  - tests consumer `GET /catalog/apps/:appId/projections`
  - tests UI des ecrans de revue et publication

## Etapes proposees

1. Implementer l'approbation et l'archivage sur `catalog-place`.
2. Implementer le domaine `catalog-mapping` avec taxonomies app-specifiques et versioning de projection.
3. Implementer `GET /catalog/apps/:appId/projections` pour les consumers machine-to-machine.
4. Ecrire les ecrans `catalog-place-review` et `catalog-mapping-review`.
5. Ajouter les garde-fous de conformite provider (attribution, media reusable/non reusable, champs interdits).

## Criteres d'acceptation

- [ ] Les ecrans listes rendent les 4 etats.
- [ ] Les contrats Mock API sont respectes (rien d'invente hors `apiRefs`).
- [ ] Aucune abstraction n'est reimplementee localement.
- [ ] Une projection `PUBLISHED` est lisible par un token service sans detail provider brut.
- [ ] Toute modification post-publication force `SYNC_REQUIRED` avant nouvelle publication.

## Test plan

- Creer un mapping `layali/venue`, le publier, puis verifier qu'il apparait dans `GET /catalog/apps/layali/projections`.
- Modifier la categorie du mapping et verifier le passage automatique en `SYNC_REQUIRED`.
- Tenter une publication sans `slug` sur Layali et verifier `422`.

## Out of scope

- Import effectif cote Layali/Beauty.
- Webhooks push vers apps consommatrices.

## Open questions

- Strategie d'acknowledgement consumer (`lastConsumedAt`) : telemetrie passive V1 ou endpoint explicite plus tard.
