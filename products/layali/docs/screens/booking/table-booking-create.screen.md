---
specVersion: 1
kind: screen
appId: layali
screenId: table-booking-create
name: Réserver une table
status: stable
phase: P1
p1MobileId: booking-create
p1Impl: mock
route: /venues/:venueSlug/book
layout: public-shell
zone: booking
roles: [PUBLIC, CUSTOMER]
auth: optional
flowRefs:
  - customer-table-booking
apiRefs:
  - venues#GET-/venues/:slug
  - tables#GET-/tables
  - bookings#POST-/bookings/draft
  - events#GET-/events/:slug
topicRefs:
  - /topic/event/{eventId}/tables
abstractions:
  components:
    - "@platform/core/components/floor-map"
    - "@platform/core/components/stepper"
    - "@platform/core/components/form-field"
    - "@platform/core/components/datetime-picker"
  patterns:
    - "booking/multi-step-wizard"
    - "realtime/optimistic-lock"
---

# Réserver une table

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `booking-create` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(accessMode TABLE)*


## Intent

Étape 1 du flow de réservation table : choisir une table sur le plan, un créneau d'arrivée, et la taille du groupe. Affiche le minimum spend par table en MAD.

## Route et accès

- Route : `/venues/:venueSlug/book` (avec query optionnel `?eventId=<eventId>` pour rattacher à un event)
- Layout : public-shell
- Auth : optional (login déclenché à l'étape suivante `payment` si non connecté)
- Rôles autorisés : public, CUSTOMER
- Tenant requis : non (résolu côté backend depuis `venueSlug`)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Venue (horaires, capacité, accepts booking) | [venues API](../../api/venues.api.md) `GET /venues/:slug` | onInit | session 5 min |
| Tables (plan + minima + disponibilité) | [tables API](../../api/tables.api.md) `GET /tables?venueId=&for=<date>` | onInit + onChange date | invalidé par realtime |
| Event (si `eventId` fourni) | [events API](../../api/events.api.md) `GET /events/:slug` | onInit conditionnel | session 2 min |

## Mock API consommée

- `GET /api/v1/venues/:slug`
- `GET /api/v1/tables?venueId=&for=<isoDate>`
- `GET /api/v1/events/:slug` (optionnel)
- `POST /api/v1/bookings/draft` (en fin d'étape → navigation `/venues/:slug/book/payment`)
- Topic : `/topic/event/{eventId}/tables` si rattaché à un event.

## États

### loading
- Plan + formulaire skeleton.

### empty
- Aucune table disponible pour le créneau choisi : message "Aucune table libre" + suggestion changer la date.

### error
- 503 ou 422 sur `tables` : bannière + retry.
- Si `table_unavailable` au moment du draft (409) : invalider la sélection + reproposer.

### success
- Plan de salle interactif, table sélectionnée mise en évidence.
- Formulaire : date, heure d'arrivée, taille du groupe (2-12), occasion (optionnel : anniversaire, EVJF, etc.).
- Récap : table choisie, capacité, minimum spend total, acompte requis.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Sélectionner table | clic sur plan | met à jour minimum spend, valide capacité |
| Changer date/heure | input | refetch tables |
| Soumettre | bouton "Continuer" | `POST /bookings/draft` puis navigation `/venues/:slug/book/payment` |
| Annuler | bouton secondaire | retour `/venues/:slug` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| floor-map | `@platform/core/components/floor-map` | rendu interactif du plan |
| stepper | `@platform/core/components/stepper` | indicateur 1/3 |
| form-field | `@platform/core/components/form-field` | inputs |
| datetime-picker | `@platform/core/components/datetime-picker` | sélection créneau |

## Composants internes (non réutilisables)

- `<TableTile>` : représentation visuelle table (forme ronde/rectangle, libellé, badge VIP).
- `<MinimumSpendBadge>` : encart "Minimum 1500 MAD".
- `<GroupSizeStepper>` : +/- avec borne 2 à 12.

## Validations et règles métier

- `groupSize` doit être ≤ `table.capacity` (sinon erreur inline).
- Le créneau d'arrivée doit être dans `venue.openingHours` du jour choisi.
- Pas de réservation < 2h avant l'heure d'arrivée (paramétrable par venue, défaut 2h).
- Pas plus de 60 jours à l'avance (limite plateforme V1).
- Une table marquée `VIP` est sélectionnable mais affiche un disclaimer "Validation manuelle par le venue".

## Topics realtime

- `/topic/event/{eventId}/tables` (si event lié) : messages `table.reserved` / `table.released`. La table sélectionnée par l'utilisateur est dégrisée si un autre client la prend ; toast d'avertissement et redirection vers le plan.

## i18n

- `layali.booking.create.step-title`
- `layali.booking.create.field.group-size`
- `layali.booking.create.field.arrival`
- `layali.booking.create.field.occasion`
- `layali.booking.create.minimum-spend`
- `layali.booking.create.vip-notice`
- `layali.booking.create.errors.capacity`
- `layali.booking.create.errors.opening-hours`
- `layali.booking.create.cta.continue`

## Critères d'acceptation

- [ ] Les 4 états sont rendus (loading, empty, error, success).
- [ ] Auth non requise sur cet écran. Si non connecté, `POST /bookings/draft` doit néanmoins accepter une session anonyme et lier l'auth à l'étape suivante.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Un message `table.reserved` reçu en realtime sur la table sélectionnée affiche un toast d'avertissement et déselectionne la table dans la même frame.
- [ ] Une soumission alors qu'une table est devenue indisponible doit recevoir 409 `table_unavailable` et reproposer une sélection sans perdre les autres saisies (groupSize, arrival).
- [ ] Le résumé `minimum spend` est cohérent avec la table choisie (ne pas figer la valeur après changement de sélection).

## Open questions

- Faut-il un panier multi-tables (réservation de 2 tables au même nom) ? Décision provisoire : non V1.
- Hold temporaire d'une table à la sélection (TTL 5 min) ? Décision provisoire : oui via `POST /bookings/draft` retournant un draftId avec `expiresAt`.
