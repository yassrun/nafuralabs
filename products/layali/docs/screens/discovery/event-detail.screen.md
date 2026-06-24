---
specVersion: 1
kind: screen
appId: layali
screenId: event-detail
name: Fiche événement
status: review
route: /events/:eventSlug
layout: public-shell
zone: discovery
roles: [PUBLIC, CUSTOMER]
auth: optional
flowRefs:
  - customer-ticket-purchase
  - customer-table-booking
  - customer-guest-list-booking
  - customer-counter-booking
apiRefs:
  - events#GET-/events/:slug
  - tickets#GET-/tickets/availability
  - venues#GET-/venues/:slug
topicRefs:
  - /topic/event/{eventId}/availability
abstractions:
  components:
    - "@platform/core/components/photo-gallery"
    - "@platform/core/components/availability-grid"
    - "@platform/core/components/cta-bar"
  patterns:
    - "discovery/detail-page"
    - "realtime/subscribe-on-mount"
---

# Fiche événement

## Intent

Présenter un événement ou une soirée spéciale : visuel, line-up, horaires, catégories de billets avec places restantes en temps réel, règles d'entrée, et pile de CTA adaptée aux modes d'accès activés pour cette soirée. Propose ticket, table, guest list ou comptoir selon la configuration de l'event.

## Route et accès

- Route : `/events/:eventSlug`
- Layout : public-shell
- Auth : optional
- Rôles autorisés : public, CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Event détaillé | [events API](../../api/events.api.md) `GET /events/:slug` | onInit | session 2 min |
| Availability initiale | [tickets API](../../api/tickets.api.md) `GET /tickets/availability?eventId=` | onInit | invalidé par realtime |
| Venue parent (mini-fiche) | [venues API](../../api/venues.api.md) `GET /venues/:slug` | onInit | session 5 min |

## Mock API consommée

- `GET /api/v1/events/:slug`
- `GET /api/v1/tickets/availability?eventId=:eventId`
- `GET /api/v1/venues/:venueSlug` (pour vignette + lien)
- Topic : `/topic/event/{eventId}/availability` (voir [mock-api.md](../../mock-api.md#103-format-des-messages))

## États

### loading
- Hero skeleton + tabs vides + CTA disabled.

### empty
- Pas applicable (un event détaillé qui existe a toujours du contenu). Cas "aucune catégorie de billet" : afficher "Billetterie indisponible" + bouton "Me prévenir" (V2).

### error
- 404 si event inconnu.
- 410 (gone) si event annulé : afficher message dédié + remboursement contact.

### success
- Hero + infos (date, horaires, venue, line-up, description).
- Section "Billets" avec catégories et places restantes (badge live).
- Encarts règles d'entrée : dress code, âge minimum, ticket requis ou non, lookup fallback.
- CTA stack : `Acheter`, `Réserver une table`, `Demander une guest list`, `Réserver au comptoir` selon `event.accessModes` et `entryPolicy`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Acheter | bouton primaire | navigation `/events/:slug/buy` |
| Réserver table | bouton CTA | navigation `/venues/:venueSlug/book?eventId=` |
| Demander une guest list | bouton CTA | navigation `/venues/:venueSlug/guest-list?eventId=` |
| Réserver au comptoir | bouton CTA | navigation `/venues/:venueSlug/counter?eventId=` |
| Ouvrir venue | clic vignette | navigation `/venues/:slug` |
| Partager | bouton | copie URL |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| photo-gallery | `@platform/core/components/photo-gallery` | photos event |
| availability-grid | `@platform/core/components/availability-grid` | catégories + places restantes |
| cta-bar | `@platform/core/components/cta-bar` | barre CTA fixe en bas (mobile) |

## Composants internes (non réutilisables)

- `<TicketCategoryRow>` : code (STD/VIP/TBL), nom, prix, places restantes (mise à jour live), badge sold out.
- `<LineupList>` : artistes / DJs avec photos.
- `<EntryPolicyCard>` : ticket requis, QR / lookup, heure limite d'arrivée.
- `<EventAccessCtas>` : pile de CTA access-mode aware.

## Validations et règles métier

- Pour les events `closed` : pas de CTA achat ; badge "Soldée".
- Pour les events `cancelled` : pas de CTA, message dédié + lien vers politique de remboursement.
- L'event doit être `published` pour être visible publiquement.
- Le CTA `Acheter` est visible seulement si `ticketing.enabled=true` et que l'event expose `TICKET` dans `accessModes`.
- Le CTA `Réserver une table` est visible seulement si `tables.enabled=true` et que l'event expose `TABLE` ou `HYBRID`.
- Le CTA `Demander une guest list` est visible seulement si `guestList.enabled=true`.
- Le CTA `Réserver au comptoir` est visible seulement si `counter.enabled=true`.
- Si `entryPolicy.ticketRequired=true`, les CTA table ou comptoir doivent annoncer explicitement la contrainte ticket avant navigation.
- Disclaimer 18+ affiché si `event.adultOnly=true`.

## Topics realtime

- `/topic/event/{eventId}/availability` : message `event.availability.updated`. À chaque message, l'écran met à jour les compteurs `remaining` par catégorie sans refetch REST. Sur reconnect : refetch via `GET /tickets/availability?eventId=`.

## i18n

- `layali.event-detail.cta.buy`
- `layali.event-detail.cta.book-table`
- `layali.event-detail.cta.guest-list`
- `layali.event-detail.cta.counter`
- `layali.event-detail.tickets.remaining`
- `layali.event-detail.tickets.soldout`
- `layali.event-detail.entry-policy.title`
- `layali.event-detail.disclaimer.adult-only`
- `layali.event-detail.cancelled`

## Critères d'acceptation

- [ ] Les 4 états (loading, empty, error, success) sont rendus. Le cas "empty" est mappé à "billetterie indisponible".
- [ ] Auth optionnelle. La page se charge sans connexion.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Sur 410 `event_cancelled`, un message dédié remplace l'écran et il n'est plus possible de naviguer vers `/events/:slug/buy`.
- [ ] L'écran s'abonne à `/topic/event/{eventId}/availability` au mount et s'en désabonne au unmount.
- [ ] Lorsqu'une catégorie passe à `soldOut: true` via realtime, son CTA disparaît dans la même frame.
- [ ] La pile de CTA reflète `event.accessModes`, `ticketing`, `tables`, `guestList`, `counter` et `entryPolicy.ticketRequired` sans logique cachée hors contrat.

## Open questions

- Sur `available <= 5` : afficher un badge "Dernières places" visible publiquement ou réservé aux connectés ? Décision provisoire : public.
- Si une soirée est `HYBRID`, faut-il pousser le CTA primaire vers le ticket, la table, ou un écran d'orchestration dédié ?
- Le venue doit pouvoir "promouvoir" un line-up en photo principale même sans line-up ? Décision provisoire : oui, le champ `coverImage` reste maître.
