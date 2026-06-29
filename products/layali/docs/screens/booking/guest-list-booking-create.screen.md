---
specVersion: 1
kind: screen
appId: layali
screenId: guest-list-booking-create
name: Demander une guest list
status: review
phase: P1
p1MobileId: booking-create
p1Impl: mock
route: /venues/:venueSlug/guest-list
layout: public-shell
zone: booking
roles: [PUBLIC, CUSTOMER]
auth: optional
flowRefs:
  - customer-guest-list-booking
apiRefs:
  - venues#GET-/venues/:slug
  - events#GET-/events/:slug
  - bookings#POST-/bookings/draft
abstractions:
  components:
    - "@platform/core/components/stepper"
    - "@platform/core/components/form-field"
    - "@platform/core/components/datetime-picker"
    - "@platform/core/components/summary-card"
  patterns:
    - "booking/multi-step-wizard"
    - "booking/request-flow"
---

# Demander une guest list

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `booking-create` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(accessMode GUEST_LIST)*


## Intent

Étape 1 du flow guest list : choisir une date, une heure d'arrivée, une taille de groupe, et déclarer l'occasion éventuelle. L'écran expose aussi les règles d'accès du soir si elles existent.

## Route et accès

- Route : `/venues/:venueSlug/guest-list` (query optionnel `?eventId=<eventId>`)
- Layout : public-shell
- Auth : optional
- Rôles autorisés : public, CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Venue (horaires, règles d'accès, accepte booking) | [venues API](../../api/venues.api.md) `GET /venues/:slug` | onInit | session 5 min |
| Event (si `eventId` fourni) | [events API](../../api/events.api.md) `GET /events/:slug` | onInit conditionnel | session 2 min |

## Mock API consommée

- `GET /api/v1/venues/:slug`
- `GET /api/v1/events/:slug` (optionnel)
- `POST /api/v1/bookings/draft` avec `accessMode=GUEST_LIST`

## États

### loading
- Formulaire skeleton + encarts règles du lieu.

### empty
- La guest list n'est pas proposée pour ce créneau : message "Guest list indisponible" + suggestion changer de date.

### error
- 503 ou 422 : bannière + retry.
- 409 `access_unavailable` au moment du draft : message inline et conservation de la saisie.

### success
- Formulaire : date, heure d'arrivée, taille du groupe, occasion, nom du célébré si anniversaire, notes.
- Encarts : conditions d'entrée, dress code, âge minimum, paiement éventuel, validation manuelle éventuelle.
- Récap : type d'accès `Guest list`, taille du groupe, règles du soir.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Changer date/heure | input | met à jour la disponibilité du mode guest list |
| Changer taille du groupe | input | vérifie les limites du lieu |
| Soumettre | bouton "Continuer" | `POST /bookings/draft` puis navigation `/venues/:venueSlug/guest-list/review` |
| Annuler | bouton secondaire | retour `/venues/:venueSlug` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| stepper | `@platform/core/components/stepper` | indicateur 1/3 |
| form-field | `@platform/core/components/form-field` | inputs |
| datetime-picker | `@platform/core/components/datetime-picker` | sélection créneau |
| summary-card | `@platform/core/components/summary-card` | récap de la demande |

## Composants internes (non réutilisables)

- `<AccessRulesNotice>` : affiche dress code, âge minimum, heure limite et mode de validation.
- `<GuestListGroupSizeField>` : input borné selon les règles du lieu.
- `<OccasionFields>` : occasion + nom du célébré si nécessaire.

## Validations et règles métier

- `groupSize` doit respecter la capacité guest list du lieu ou de la soirée.
- Le créneau d'arrivée doit être dans `venue.openingHours` du jour choisi.
- Pas de demande guest list après l'heure limite configurée par le lieu.
- Si `occasion=BIRTHDAY`, le champ `celebrantName` est recommandé.
- Si une soirée spéciale impose ticket ou paiement, l'écran doit l'annoncer avant la soumission.

## Topics realtime

Aucun requis en V1 sur cet écran.

## i18n

- `layali.booking.guestlist.create.title`
- `layali.booking.guestlist.create.field.group-size`
- `layali.booking.guestlist.create.field.arrival`
- `layali.booking.guestlist.create.field.occasion`
- `layali.booking.guestlist.create.rules.title`
- `layali.booking.guestlist.create.cta.continue`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth non requise sur cet écran.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Une indisponibilité guest list au moment du draft conserve toutes les autres saisies.
- [ ] Les règles d'accès du soir sont visibles avant la soumission.

## Open questions

- La taille max de groupe guest list est-elle globale ou configurable par soirée ?
- Le nom du célébré doit-il devenir obligatoire quand `occasion=BIRTHDAY` ?
