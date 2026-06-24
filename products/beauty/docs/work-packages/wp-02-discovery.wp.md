---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-02-discovery
title: Discovery — home, search, salon-detail, service-list
status: stable
wave: 2
dependsOn: [wp-01-platform-skeleton]
filesAllowed:
  - web/app/applications/beauty/zones/discovery/**
  - web/app/applications/beauty/components/**
  - backend/domains/beauty/salon/**
  - backend/domains/beauty/catalog/**
  - backend/domains/beauty/review/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:tenancy"
  - "@platform/core/components"
  - "@platform/core/i18n"
abstractionsMissing: []
---

# Discovery — home, search, salon-detail, service-list

## Scope

Implémenter la zone `discovery` côté web client public : home, recherche salons, fiche salon, catalogue services. Lecture publique avec mock APIs `salons`, `services`, `staff`, `reviews`.

## Inputs

- Specs IA :
  - [home](../screens/discovery/home.screen.md), [salon-search](../screens/discovery/salon-search.screen.md), [salon-detail](../screens/discovery/salon-detail.screen.md), [service-list](../screens/discovery/service-list.screen.md)
  - APIs : [salons](../api/salons.api.md), [services](../api/services.api.md), [staff](../api/staff.api.md), [reviews](../api/reviews.api.md)
- Mock fixtures : 3 salons (Studio Hair Casablanca, Beauty Lounge Rabat, Barber House Marrakech).
- Abstractions : tenancy (public bypass), i18n, composants UI.

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/beauty/zones/discovery/{home,salon-search,salon-detail,service-list}/`
  - `web/app/applications/beauty/components/{popular-salon-card,salon-result-card,service-list-item,opening-hours-grid,review-card}/`
  - `backend/domains/beauty/salon/` (controller REST public + admin).
  - `backend/domains/beauty/catalog/` (services par salon).
  - `backend/domains/beauty/review/` (lecture publique).
- Tests :
  - E2E : home → search → salon → service-list.
  - Tests unitaires composants cards.
  - Tests backend `@WebMvcTest` sur endpoints publics.

## Étapes proposées

1. Implémenter les controllers REST `salons`, `services`, `staff`, `reviews` côté backend (read-only V1 mock fixtures).
2. Coder home avec recherche hero, top salons par ville.
3. Coder search avec filtres dynamiques, infinite scroll cursor.
4. Coder salon-detail avec 4 tabs (Services, Équipe, Avis, Infos), galerie photo.
5. Coder service-list (accordion par catégorie, filtres locaux).
6. Brancher cache front 5-10 min.
7. SEO : balises OG sur salon-detail.

## Critères d'acceptation

- [ ] Les écrans listés rendent les 4 états.
- [ ] Les contrats Mock API sont respectés.
- [ ] Aucune abstraction n'est réimplémentée localement.
- [ ] Les permissions sont vérifiées (lecture publique).
- [ ] L'infinite scroll cursor n'introduit pas de doublons.
- [ ] Le retour navigateur depuis une fiche salon conserve filtres + scroll.
- [ ] La géolocalisation est opt-in et le refus ne bloque pas.
- [ ] La bascule RTL fonctionne sur toutes les pages discovery.

## Test plan

- E2E : `/` → search Rabat → clic Beauty Lounge → service-list → clic "Réserver" (navigation `/salons/:slug/book`).
- Tester un salon en `SUSPENDED` (404 simulé) → page "Salon temporairement indisponible".
- Tester avec géolocalisation refusée → fallback Casablanca.

## Out of scope

- Vue carte cluster Leaflet (V2).
- "Salons similaires" (V2).
- Pre-rendering SEO top salons (V2).

## Open questions

- Tri par défaut `/search` : "Pertinence" → V1 = "Note desc + Distance asc" combiné, V2 = score TF-IDF.
- Cache CDN sur fiches salon : V2.
