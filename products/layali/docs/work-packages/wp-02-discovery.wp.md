---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-02-discovery
title: Discovery — home, venues, events (public)
status: stable
phase: P3
wave: 2
dependsOn: [wp-01-platform-skeleton]
filesAllowed:
  - web/app/applications/layali/zones/discovery/**
  - web/app/applications/layali/components/**
  - backend/domains/layali/venue/**
  - backend/domains/layali/event/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:tenancy"
  - "@platform/core/components"
  - "@platform/core/i18n"
  - "@platform/core/realtime"
abstractionsMissing: []
---

# Discovery — home, venues, events (public)

## Scope

Implémenter la zone `discovery` côté web client public : home, recherche venues, fiche venue, liste events, fiche event. Lecture publique, mock APIs `venues` et `events`. La home doit aussi offrir une bifurcation claire `Client` / `Manager` sans empêcher la découverte libre. Topics realtime pour l'availability des events.

## Inputs

- Specs IA :
  - [home](../screens/discovery/home.screen.md)
  - [venue-search](../screens/discovery/venue-search.screen.md)
  - [venue-detail](../screens/discovery/venue-detail.screen.md)
  - [event-list](../screens/discovery/event-list.screen.md)
  - [event-detail](../screens/discovery/event-detail.screen.md)
  - [venues API](../api/venues.api.md), [events API](../api/events.api.md), [tickets API](../api/tickets.api.md), [reviews API](../api/reviews.api.md)
- Mock fixtures : sky31-casablanca, theatro-marrakech, nikki-beach-marrakech ; 3 events (1 PUBLISHED, 1 SOLD_OUT, 1 CLOSED).
- Abstractions Nafura : tenancy (public bypass), realtime client.

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/layali/zones/discovery/home/`
  - `web/app/applications/layali/zones/discovery/venues/{search,detail}/`
  - `web/app/applications/layali/zones/discovery/events/{list,detail}/`
  - `web/app/applications/layali/components/{trending-section,city-chips,event-card,venue-card}/`
  - `backend/domains/layali/venue/` (controller REST `/api/v1/venues*`, application service, repo).
  - `backend/domains/layali/event/` (idem `/api/v1/events*`).
- Tests :
  - Tests E2E (Cypress / Playwright) : parcours home → search → venue → event.
  - Tests unitaires composants `event-card`, `venue-card`.
  - Tests backend controllers (`@WebMvcTest`) sur les endpoints publics.

## Étapes proposées

1. Implémenter les controllers REST publics `venues` et `events` côté backend (read-only, ils servent les fixtures en V1 via repo mock).
2. Écrire les écrans home, venue-search, venue-detail, event-list, event-detail côté web, en respectant les 4 états par écran.
3. Brancher `@platform/core/realtime` pour s'abonner à `/topic/event/{eventId}/availability` sur les fiches event.
4. Implémenter le composant `<EventCard>` réutilisable (poster, titre, venue, date, prix mini).
5. Implémenter la barre de recherche multi-critères (ville, date, mood) avec routage `/venues?city=&date=&mood=`.
6. Ajouter dans le hero de home deux CTA d'entrée `Je suis client` et `Je suis manager` pointant vers le login approprié.
7. Cache session 5-10 min via interceptor ou service cache.

## Critères d'acceptation

- [ ] Les écrans listés rendent les 4 états.
- [ ] Les contrats Mock API sont respectés (rien d'inventé hors `apiRefs`).
- [ ] Aucune abstraction n'est réimplémentée localement.
- [ ] Les permissions sont vérifiées avant rendu et avant mutation (lecture publique, pas de mutation ici).
- [ ] Les tests unitaires couvrent les états d'erreur (503, 404).
- [ ] La home expose bien les deux CTA `Client` / `Manager` sans casser la navigation publique libre.
- [ ] Le topic availability met à jour live les compteurs sur la fiche event sans casser le scroll.
- [ ] SEO : balises Open Graph présentes sur `/venues/:slug` et `/events/:slug` (titre, description, image).

## Test plan

- E2E : home → recherche Marrakech → clic venue Theatro → clic event Summer Rave → clic "Acheter" (redirige vers ticket-buy).
- Simuler un message STOMP `event.availability.updated` → vérifier que les compteurs UI changent.
- Vérifier que `/venues/sky31-casablanca` cache la page 5 min côté front (pas de double fetch en navigation rapide).

## Out of scope

- Achat et réservation (wp-03).
- SSR (out of V1).

## Open questions

- Pre-rendering au build pour les top venues : V2.
- Vue carte clustering Leaflet : V2.
