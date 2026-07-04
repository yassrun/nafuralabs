---
specVersion: 1
kind: screen
appId: layali
screenId: venue-detail
name: Fiche venue
status: review
phase: P1
p1MobileId: venue-detail
p1Impl: mock
route: /venues/:venueSlug
layout: public-shell
zone: discovery
roles: [PUBLIC, CUSTOMER]
auth: optional
flowRefs:
  - customer-table-booking
  - customer-guest-list-booking
  - customer-counter-booking
apiRefs:
  - venues#GET-/venues/:slug
  - events#GET-/events
  - tables#GET-/tables
  - reviews#GET-/reviews
topicRefs:
  - /topic/venue/{venueId}/events
abstractions:
  components:
    - "@platform/core/components/photo-gallery"
    - "@platform/core/components/tabs"
    - "@platform/core/components/review-summary"
    - "@platform/core/components/map-link"
  patterns:
    - "discovery/detail-page"
---

# Fiche venue

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `venue-detail` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Page de présentation d'un lieu : photos, ambiance, horaires, prochains événements, plan de salle (preview), avis, et surtout modes d'accès disponibles. Sert de pivot vers la réservation table, la guest list, le comptoir, ou l'achat de tickets selon le contexte du lieu et de la soirée.

## Route et accès

- Route : `/venues/:venueSlug`
- Layout : public-shell
- Auth : optional
- Rôles autorisés : public, CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Venue détaillé | [venues API](../../api/venues.api.md) `GET /venues/:slug` | onInit | session 5 min |
| Prochains événements | [events API](../../api/events.api.md) `GET /events?venueId=&from=now&sort=date:asc` | onInit | session 2 min |
| Aperçu tables | [tables API](../../api/tables.api.md) `GET /tables?venueId=&preview=true` | onInit si `accessModesDefault` inclut `TABLE` | session 5 min |
| Résumé avis | [reviews API](../../api/reviews.api.md) `GET /reviews/summary?venueId=` | onInit | session 10 min |

## Mock API consommée

- `GET /api/v1/venues/:slug`
- `GET /api/v1/events?venueId=&from=now`
- `GET /api/v1/tables?venueId=&preview=true`
- `GET /api/v1/reviews/summary?venueId=`

## États

### loading
- Hero skeleton + tabs vides.

### empty
- Aucun événement à venir : afficher onglet "Événements" avec message "Pas de soirée prévue, revenez bientôt".

### error
- Si venue introuvable (404) : page d'erreur 404 dédiée avec lien retour `/venues`.
- Si venue suspendu : message neutre "Ce lieu n'est plus disponible".

### success
- Hero photo principale + galerie.
- Section infos : nom, adresse, lien map, horaires, ambiance tags, capacité, tags d'accès.
- CTA stack visible dans le hero et sticky sur mobile : `Réserver une table`, `Demander une guest list`, `Réserver au comptoir`, `Voir la soirée / Acheter un ticket` selon les modes exposés.
- Encart règles d'accès : dress code, âge minimum, lookup fallback, QR check-in, validation manuelle éventuelle.
- Tabs : `Événements` (default), `Tables`, `Avis`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Réserver une table | bouton CTA | navigation `/venues/:slug/book` |
| Demander une guest list | bouton CTA | navigation `/venues/:slug/guest-list` |
| Réserver au comptoir | bouton CTA | navigation `/venues/:slug/counter` |
| Acheter un ticket / voir la soirée | bouton CTA si une soirée spéciale ticketée est mise en avant | navigation `/events/:eventSlug` |
| Voir un événement | clic card event | navigation `/events/:eventSlug` |
| Voir tous les avis | lien | scroll vers section avis + load complet |
| Ouvrir map | clic adresse | ouvre `mapUrl` (Google Maps externe) |
| Partager | bouton share | copie URL en presse-papier |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| photo-gallery | `@platform/core/components/photo-gallery` | galerie photos |
| tabs | `@platform/core/components/tabs` | navigation interne |
| review-summary | `@platform/core/components/review-summary` | note moyenne + distribution |
| map-link | `@platform/core/components/map-link` | lien externe Google Maps |

## Composants internes (non réutilisables)

- `<VenueHero>` : photo principale + nom + ambiance + pile de CTA d'accès.
- `<AccessModeChips>` : chips `Table`, `Guest list`, `Comptoir`, `Ticket selon soirée`.
- `<TonightRulesCard>` : rappel synthétique des règles du lieu et de la prochaine soirée spéciale si présente.
- `<UpcomingEventsList>` : liste cards d'événements à venir.
- `<TablePreviewMap>` : aperçu schématique du plan (statique, pas d'interaction réservation ici).

## Validations et règles métier

- Si le venue est `suspended` ou `inactive`, retourner 404 publiquement (ne pas exposer leur existence).
- Si un événement référencé est en `draft`, ne pas l'afficher publiquement.
- Le bouton `Réserver une table` est visible seulement si le lieu expose `TABLE` dans `accessModesDefault`.
- Le bouton `Demander une guest list` est visible seulement si le lieu expose `GUEST_LIST` dans `accessModesDefault`.
- Le bouton `Réserver au comptoir` est visible seulement si le lieu expose `COUNTER` dans `accessModesDefault`.
- Si une soirée spéciale ticketée est la prochaine action recommandée, le CTA principal peut pointer vers l'event avant les CTA venue-level.
- Si aucun mode de réservation digitale n'est exposé, la page retombe sur un mode informatif avec `WALK_IN` uniquement.

## Topics realtime

- `/topic/venue/{venueId}/events` : si un nouvel événement est publié pendant que l'utilisateur est sur la page, l'onglet `Événements` se met à jour.

## i18n

- `layali.venue-detail.tabs.events`
- `layali.venue-detail.tabs.tables`
- `layali.venue-detail.tabs.reviews`
- `layali.venue-detail.cta.book-table`
- `layali.venue-detail.cta.guest-list`
- `layali.venue-detail.cta.counter`
- `layali.venue-detail.cta.view-event`
- `layali.venue-detail.access-rules.title`
- `layali.venue-detail.no-upcoming-events`
- `layali.venue-detail.share.copied`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth optionnelle. La page se charge sans connexion. Les CTA `Réserver` et `Acheter` redirigent vers `/login` uniquement au moment du paiement.
- [ ] Un venue suspendu retourne 404 et n'apparaît pas dans `/venues`.
- [ ] Le scope tenant n'est pas requis côté client (route publique) ; l'agent ne doit jamais injecter `X-Tenant-Id` ici.
- [ ] Si `GET /venues/:slug` répond `503`, l'écran affiche un état error avec retry.
- [ ] La pile de CTA reflète fidèlement les `accessModesDefault` du lieu et ne montre pas un mode indisponible.
- [ ] L'abonnement au topic `/topic/venue/{venueId}/events` est nettoyé lors du `onDestroy` de la page.

## Open questions

- La preview du plan de salle doit-elle être interactive (cliquer une table → réserver) ou purement informative ? Décision provisoire : statique V1, l'interaction est dans `table-booking-create`.
- Faut-il afficher un classement visuel des CTA (`primaire`, `secondaire`, `tertiaire`) selon la soirée la plus proche, ou toujours montrer les modes du lieu dans le même ordre ?
- Avis : doit-on permettre de filtrer par note ? Décision provisoire : non V1.
