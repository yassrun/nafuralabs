---
specVersion: 1
kind: screen
appId: layali
screenId: venue-search
name: Recherche de venues
status: review
phase: P1
p1MobileId: venue-search
p1Impl: mock
route: /venues
layout: public-shell
zone: discovery
roles: [PUBLIC, CUSTOMER]
auth: optional
flowRefs:
  - customer-table-booking
  - customer-guest-list-booking
  - customer-counter-booking
apiRefs:
  - venues#GET-/venues
  - events#GET-/events
abstractions:
  components:
    - "@platform/core/components/filters-panel"
    - "@platform/core/components/result-list"
    - "@platform/core/components/pagination-cursor"
    - "@platform/core/components/map-link"
  patterns:
    - "discovery/filtered-list"
---

# Recherche de venues

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `venue-search` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Résultats filtrables par ville, ambiance, date, fourchette de prix et mode d'accès. Cible : utilisateur qui sait ce qu'il cherche ou explore une ville en comparant rapidement table, guest list, comptoir et soirées ticketées.

## Route et accès

- Route : `/venues`
- Layout : public-shell
- Auth : optional
- Rôles autorisés : public, CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Liste venues filtrée | [venues API](../../api/venues.api.md) `GET /venues` | onInit + onChange filtres | session 2 min |
| Événements liés (compteur "X events ce week-end" + soirée mise en avant) | [events API](../../api/events.api.md) `GET /events?venueIds=` | onInit après venues chargés | session 2 min |

## Mock API consommée

- `GET /api/v1/venues?city=&mood=&accessMode=&priceMax=&date=&cursor=&size=`
- `GET /api/v1/events?venueIds=<csv>&from=&to=` (pour enrichir cards)

## États

### loading
- 8 skeleton cards.
- Filtres restent interactifs (debounce 300 ms).

### empty
- Message "Aucun venue ne correspond" + bouton "Réinitialiser les filtres".

### error
- Erreur API : bannière + bouton retry.
- Erreur réseau : message offline.

### success
- Grille / liste de venues, pagination cursor (bouton "Charger plus").
- Chaque card expose les modes d'accès disponibles et la meilleure entrée du moment : soirée ticketée, table, guest list ou comptoir.
- Sidebar filtres (desktop) ou drawer (mobile).

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Changer un filtre | input filtres | refetch debounce 300 ms, met à jour URL query params |
| Cliquer une card | clic | navigation `/venues/:slug` |
| Cliquer un mini CTA de card | bouton dans la card | navigation directe vers `/venues/:slug/book`, `/guest-list`, `/counter` ou `/events/:eventSlug` |
| Charger plus | bouton | requête `?cursor=<next>` |
| Réinitialiser | bouton | reset filtres + URL nettoyée |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| filters-panel | `@platform/core/components/filters-panel` | filtres ville/ambiance/prix/date/mode d'accès |
| result-list | `@platform/core/components/result-list` | rendu liste + tri |
| pagination-cursor | `@platform/core/components/pagination-cursor` | "charger plus" |
| map-link | `@platform/core/components/map-link` | lien externe Google Maps |

## Composants internes (non réutilisables)

- `<VenueCard>` : photo, nom, ville, ambiance tags, `accessModesDefault`, tags opérationnels, "X events à venir", badge "ouvert ce soir".
- `<VenueCardCtas>` : mini pile de CTA `Table`, `Guest list`, `Comptoir`, `Soirée`.
- `<MoodSelector>` : pills multi-sélection (chic, festif, lounge, club, rooftop, terrasse).
- `<AccessModeSelector>` : pills multi-sélection `Table`, `Guest list`, `Comptoir`, `Walk-in`.

## Validations et règles métier

- `priceMax` borné à 5000 MAD côté UI.
- `city` libre (slug ville marocaine) ; si vide, recherche multi-villes.
- Les venues `suspended` n'apparaissent jamais.
- Les venues `inactive` (pas encore publiés) n'apparaissent pas non plus.
- Le filtre `accessMode` ne doit afficher que les modes exposés par le contrat `venues`.
- Une card ne doit jamais afficher un CTA direct vers un mode absent de `accessModesDefault`.

## Topics realtime

Aucun.

## i18n

- `layali.venue-search.title`
- `layali.venue-search.filters.city`
- `layali.venue-search.filters.mood`
- `layali.venue-search.filters.accessMode`
- `layali.venue-search.filters.priceMax`
- `layali.venue-search.filters.date`
- `layali.venue-search.empty.title`
- `layali.venue-search.empty.reset`
- `layali.venue-search.card.events-count`
- `layali.venue-search.card.cta.table`
- `layali.venue-search.card.cta.guest-list`
- `layali.venue-search.card.cta.counter`
- `layali.venue-search.card.cta.event`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth optionnelle : aucun blocage ni redirection si non connecté.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une erreur 503 sur `GET /venues` affiche un état error avec retry, sans casser les filtres saisis.
- [ ] Les filtres sont persistés dans l'URL (deep linkable + back/forward).
- [ ] Les cards rendent correctement les modes d'accès et leurs mini CTA sans exposer un chemin invalide.
- [ ] Pagination cursor : pas de doublon entre pages, et le bouton "Charger plus" disparaît quand `cursor` est `null`.

## Open questions

- Choisir un toggle vue carte/liste en V1 ou laisser pour V2 ? Décision provisoire : V2.
- Faut-il ordonner les venues selon le mode d'accès demandé (`accessMode`) avant le score trending global ?
- Tri exposé à l'utilisateur (popularité, prix, alphabétique) ou tri unique implicite ? Décision provisoire : tri unique "trending" V1, plus tris en V2.
