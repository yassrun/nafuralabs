---
specVersion: 1
kind: screen
appId: layali
screenId: event-list
name: Agenda événements
status: review
route: /events
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
  - events#GET-/events
abstractions:
  components:
    - "@platform/core/components/filters-panel"
    - "@platform/core/components/result-list"
    - "@platform/core/components/pagination-cursor"
    - "@platform/core/components/date-range-picker"
  patterns:
    - "discovery/filtered-list"
---

# Agenda événements

## Intent

Vue agenda globale, filtrable par ville, fenêtre temporelle, catégorie et mode d'accès. L'utilisateur peut comparer rapidement les soirées ticketées, les soirées à table, les entrées guest list et les options comptoir.

## Route et accès

- Route : `/events`
- Layout : public-shell
- Auth : optional
- Rôles autorisés : public, CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Liste events filtrée | [events API](../../api/events.api.md) `GET /events` | onInit + onChange | session 2 min |

## Mock API consommée

- `GET /api/v1/events?city=&from=&to=&category=&accessMode=&cursor=&size=`

## États

### loading
- 6 skeleton cards (liste cards horizontales).

### empty
- Message "Aucun événement sur cette période" + bouton "Élargir la période".

### error
- Bannière + retry.

### success
- Liste verticale d'events groupés par jour ; chaque card affiche venue, prix à partir de, places restantes, modes d'accès, et badges `soirée spéciale` ou `ticket requis` si applicable.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Changer filtre | input | refetch debounce 300 ms + URL sync |
| Cliquer card | clic | navigation `/events/:slug` |
| Cliquer mini CTA d'accès | bouton dans la card | navigation `/events/:slug/buy` ou `/venues/:venueSlug/book|guest-list|counter?eventId=` |
| Charger plus | bouton | requête `?cursor=<next>` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| filters-panel | `@platform/core/components/filters-panel` | filtres ville/période/catégorie/mode d'accès |
| result-list | `@platform/core/components/result-list` | rendu liste groupée par date |
| pagination-cursor | `@platform/core/components/pagination-cursor` | charger plus |
| date-range-picker | `@platform/core/components/date-range-picker` | sélection fenêtre |

## Composants internes (non réutilisables)

- `<EventCard>` : photo, titre, venue, ville, date/heure, prix from, badges `specialNight`, `ticketRequired`, et liste `accessModes`.
- `<EventAccessMiniCtas>` : mini CTA `Ticket`, `Table`, `Guest list`, `Comptoir` selon l'event.
- `<AccessModeSelector>` : pills `Ticket`, `Table`, `Guest list`, `Comptoir`, `Hybrid`.
- `<DayHeader>` : séparateur "Vendredi 12 juin 2026".

## Validations et règles métier

- Seuls les events `published` apparaissent.
- Les events `closed` (sold-out clos par OWNER) restent visibles mais sans CTA achat (badge "Sold out").
- Les events passés (date < now) ne sont pas listés.
- Maximum 60 jours dans la fenêtre de recherche (`to - from <= 60 days`).
- Le filtre `accessMode` s'appuie sur `event.accessModes`.
- Si `entryPolicy.ticketRequired=true`, les mini CTA table / comptoir doivent expliciter la contrainte ticket.

## Topics realtime

Aucun. Le rafraîchissement automatique passe par un revalidate à intervalle 30s côté UI si besoin (out of scope V1 pour cette page).

## i18n

- `layali.event-list.title`
- `layali.event-list.empty`
- `layali.event-list.filters.accessMode`
- `layali.event-list.badge.soldout`
- `layali.event-list.badge.special-night`
- `layali.event-list.badge.ticket-required`
- `layali.event-list.card.from`
- `layali.event-list.card.cta.ticket`
- `layali.event-list.card.cta.table`
- `layali.event-list.card.cta.guest-list`
- `layali.event-list.card.cta.counter`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth optionnelle, aucune redirection forcée.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une 422 `validation` sur des dates incohérentes (`to < from`) déclenche un message contextualisé sans casser la page.
- [ ] Les events `draft` ou `cancelled` ne s'affichent jamais (filtré côté backend, vérifié côté UI).
- [ ] Les cards rendent correctement les mini CTA à partir de `accessModes` sans exposer de parcours indisponible.
- [ ] La fenêtre temporelle est limitée à 60 jours ; au-delà, la UI clamp et affiche un toast.

## Open questions

- Faut-il une vue calendrier (mois) en V1 ? Décision provisoire : non, liste suffit.
- Faut-il autoriser un filtre direct `ticket required` distinct de `accessMode=TICKET` pour les soirées hybrides ?
- Filtres par tag musical (techno, RnB, raï, électro...) dès V1 ? Décision provisoire : oui (tag libre côté event).
