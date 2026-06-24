---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-07-shared-venue-catalog
title: Bootstrap venues from shared venue catalog
status: draft
wave: 1
dependsOn: [wp-01-platform-skeleton]
filesAllowed:
  - backend/domains/layali/venue/**
  - backend/domains/layali/admin/**
  - web/app/applications/layali/zones/admin/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:authorization"
  - ":platform:core:identity"
abstractionsMissing: []
---

# Bootstrap venues from shared venue catalog

## Scope

Permettre a Layali de recuperer et d'upserter des projections `venue` publiees par le service partage `venue-catalog`, afin de demarrer discovery et onboarding de tenants sans integration directe a Google Places dans le domaine Layali.

## Inputs

- Specs IA :
  - [Layali app](../app.md)
  - [venues API](../api/venues.api.md)
  - [tenants-admin API](../api/tenants-admin.api.md)
  - [venue-catalog app](../../venue-catalog/app.md)
  - [catalog-mappings API](../../venue-catalog/api/catalog-mappings.api.md)
  - [platform-place-import flow](../../venue-catalog/flows/platform-place-import.flow.md)
- Abstractions Nafura : authorization, identity.

## Outputs attendus

- Fichiers crees ou modifies (chemins) :
  - `backend/domains/layali/venue/` (service d'upsert catalogue -> venue)
  - `backend/domains/layali/admin/` (orchestration bootstrap tenant/venue)
  - `web/app/applications/layali/zones/admin/` si un ecran de bootstrap est necessaire
- Tests :
  - tests d'import idempotent depuis `GET /api/v1/catalog/apps/layali/projections`
  - tests de non-regression `GET /api/v1/venues*`

## Etapes proposees

1. Ecrire un client interne `venue-catalog` cote backend Layali qui lit `GET /api/v1/catalog/apps/layali/projections` avec token service.
2. Implementer l'upsert idempotent `mappingId -> venue` en preservant `slug`, `city`, `address`, `geo`, `mapUrl` et meta de source catalogue.
3. Ajouter une orchestration admin pour creer ou lier le tenant Layali a partir d'une projection publiee.
4. Verifier que le contrat public `venues` reste provider-agnostic.

## Criteres d'acceptation

- [ ] Les projections `layali/venue` publiees sont importables sans dependance a Google Places.
- [ ] Un meme `mappingId` reimporte deux fois ne cree pas de doublon venue.
- [ ] Le contrat public `GET /api/v1/venues*` reste conforme a [venues API](../api/venues.api.md).
- [ ] Aucune abstraction n'est reimplementee localement.

## Test plan

- Simuler la lecture d'une projection `map-101` puis verifier creation de `sky-28-casablanca`.
- Rejouer la meme projection avec meme `sourceHash` et verifier qu'aucune nouvelle venue n'est creee.
- Modifier la projection puis verifier update selective sans perte des champs edites manuellement cote Layali si ces champs sont hors scope projection.

## Out of scope

- UI complete de revue provider dans Layali.
- Integration directe Google Places dans Layali.

## Open questions

- Quels champs Layali restent editables localement apres bootstrap (ex. `operationalTags`, `acceptsOnlineBooking`) et quels champs sont re-synchronises depuis le catalogue ?
