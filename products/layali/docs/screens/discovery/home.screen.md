---
specVersion: 1
kind: screen
appId: layali
screenId: home
name: Accueil
status: review
phase: P1
p1MobileId: home
p1Impl: mock
route: /
layout: public-shell
zone: discovery
roles: [PUBLIC, CUSTOMER]
auth: optional
flowRefs:
  - customer-table-booking
  - customer-ticket-purchase
  - customer-guest-list-booking
  - customer-counter-booking
  - pro-access
apiRefs:
  - venues#GET-/venues
  - events#GET-/events
abstractions:
  components:
    - "@platform/core/components/search-bar"
    - "@platform/core/components/card-grid"
    - "@platform/core/components/banner-hero"
    - "@platform/core/components/skeleton"
  patterns:
    - "discovery/trending-feed"
---

# Accueil

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `home` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Page d'entrée publique. Donner envie en présentant les soirées du soir et du week-end, les lieux tendance, permettre une découverte rapide des modes d'accès : ticket, table, guest list, comptoir, et offrir dès l'entrée un choix clair entre `Client` et `Manager`.

## Route et accès

- Route : `/`
- Layout : public-shell
- Auth : optional
- Rôles autorisés : public, CUSTOMER (auth optionnelle pour personnalisation)
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Liste tendance "ce soir" | [events API](../../api/events.api.md) `GET /events?from=today&to=today&sort=trending:desc` | onInit | session 5 min |
| Liste "ce week-end" | [events API](../../api/events.api.md) `GET /events?from=fri&to=sun` | onInit | session 5 min |
| Top venues par ville détectée | [venues API](../../api/venues.api.md) `GET /venues?city=<geo>&sort=trending:desc` | onInit | session 10 min |
| Ville préférée utilisateur (si connecté) | [customers API](../../api/customers.api.md) `GET /customers/me` | onInit if auth | session |

## Mock API consommée

- `GET /api/v1/venues?city=&sort=trending:desc` (voir [venues.api.md](../../api/venues.api.md))
- `GET /api/v1/events?from=&to=&sort=trending:desc` (voir [events.api.md](../../api/events.api.md))
- `GET /api/v1/customers/me` (optionnel, voir [customers.api.md](../../api/customers.api.md))

## États

### loading
- Hero affiché avec skeleton.
- 3 sections (ce soir, ce week-end, venues) avec skeletons cards.

### empty
- Aucune ville détectée et aucun event tendance : message "Choisissez une ville" + CTA vers `/venues`.
- Vide par section : message contextualisé "Aucune soirée détectée pour ce soir".

### error
- Bannière non bloquante "Impossible de charger les tendances, réessayer" avec bouton retry.
- Si auth échoue mais elle est optionnelle, l'écran continue en mode anonyme sans bloquer.

### success
- Hero avec recherche (ville, date, ambiance).
- Switch d'entrée visible dans le hero : bouton `Je suis client` et bouton `Je suis manager`.
- Section "Ce soir" (max 8 events).
- Section "Ce week-end" (max 12 events).
- Section "Venues tendances" (max 8 cards).
- Chaque section met en avant les modes d'accès disponibles et les règles d'entrée clés.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Rechercher | Submit search-bar | navigation `/venues?city=&date=&mood=` |
| Entrer en tant que client | clic bouton hero | navigation `/login?audience=customer` |
| Entrer en tant que manager | clic bouton hero | navigation `/login?audience=manager&returnTo=/pro` |
| Cliquer une carte event | clic | navigation `/events/:slug` |
| Cliquer une carte venue | clic | navigation `/venues/:slug` |
| Cliquer un mini CTA d'une card | bouton dans la card | navigation directe vers ticket, table, guest list ou comptoir |
| Choisir une ville suggérée | clic chip | navigation `/venues?city=<slug>` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| banner-hero | `@platform/core/components/banner-hero` | hero + recherche |
| search-bar | `@platform/core/components/search-bar` | barre de recherche persistante |
| card-grid | `@platform/core/components/card-grid` | sections cards events / venues |
| skeleton | `@platform/core/components/skeleton` | placeholders loading |

## Composants internes (non réutilisables)

- `<TrendingSection>` : wrap card-grid avec titre + lien "voir tout".
- `<AudienceEntrySwitch>` : deux gros boutons `Client` / `Manager` avec micro-copy explicite.
- `<AccessModeHighlights>` : rail de chips `Ticket`, `Table`, `Guest list`, `Comptoir` menant vers des recherches préfiltrées.
- `<EventCardMiniCtas>` : mini pile de CTA pour les soirées mises en avant.
- `<VenueCardMiniCtas>` : mini pile de CTA pour les lieux tendance.
- `<CityChips>` : liste de chips ville cliquables (Casablanca, Marrakech, Tanger, Agadir, Rabat).

## Validations et règles métier

- La date par défaut de la recherche est `today`.
- Si géolocalisation indisponible (refusée ou non supportée), la ville par défaut est `Casablanca`.
- Les events `closed` ou `cancelled` ne s'affichent pas en home.
- Les mini CTA affichés sur les cards home doivent dériver strictement de `event.accessModes` et `venue.accessModesDefault`.

## Topics realtime

Aucun. La home utilise du contenu rafraîchi à chaque visite ; pas d'abonnement WebSocket en V1.

## i18n

- `layali.home.hero.title`
- `layali.home.hero.subtitle`
- `layali.home.section.tonight`
- `layali.home.section.weekend`
- `layali.home.section.venues`
- `layali.home.section.access-modes`
- `layali.home.cta.search`
- `layali.home.cta.customer-entry`
- `layali.home.cta.manager-entry`
- `layali.home.empty.global`
- `layali.common.errors.retry`
- `layali.home.card.cta.ticket`
- `layali.home.card.cta.table`
- `layali.home.card.cta.guest-list`
- `layali.home.card.cta.counter`

## Critères d'acceptation

- [ ] L'écran rend correctement les 4 états (loading, empty, error, success).
- [ ] La home est accessible sans authentification (`auth: optional`) et propose la même navigation publique avec ou sans connexion.
- [ ] Aucun appel à un endpoint hors `apiRefs` du frontmatter.
- [ ] Si `GET /events` retourne `503`, l'écran affiche un état d'erreur non bloquant et permet de réessayer sans recharger la page.
- [ ] Les CTA de carte naviguent vers `/venues/:slug` ou `/events/:slug` en respectant le slug retourné par l'API (pas d'UUID exposé dans l'URL).
- [ ] Le hero expose deux boutons d'entrée distincts : `Je suis client` et `Je suis manager`.
- [ ] Le bouton manager ouvre `/login?audience=manager&returnTo=/pro`.
- [ ] Les mini CTA de home reflètent correctement les modes d'accès réellement exposés par les données des cards.
- [ ] La recherche soumet correctement les paramètres `city`, `date`, `mood` à `/venues`.

## Open questions

- Faut-il une géolocalisation native sur mobile (HTML5) ou laisser l'utilisateur choisir manuellement la ville ? Décision provisoire : choix manuel V1.
- Faut-il permettre une entrée directe par mode d'accès depuis la home vers `/venues?accessMode=` ?
- Ce soir = limite 04:00 du lendemain ? Décision provisoire : oui, fenêtre [aujourd'hui 18:00, demain 04:00 local].
