---
specVersion: 1
kind: screen
appId: layali
screenId: counter-booking-create
name: Réserver au comptoir
status: review
route: /venues/:venueSlug/counter
layout: public-shell
zone: booking
roles: [PUBLIC, CUSTOMER]
auth: optional
flowRefs:
  - customer-counter-booking
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
    - "booking/light-access-flow"
---

# Réserver au comptoir

## Intent

Étape 1 du flow comptoir : choisir un créneau, la taille du groupe, et éventuellement une zone comptoir si le lieu la distingue. Le parcours reste plus léger qu'un booking table.

## Route et accès

- Route : `/venues/:venueSlug/counter` (query optionnel `?eventId=<eventId>`)
- Layout : public-shell
- Auth : optional
- Rôles autorisés : public, CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Venue (règles d'accès, comptoir disponible, conditions) | [venues API](../../api/venues.api.md) `GET /venues/:slug` | onInit | session 5 min |
| Event (si `eventId` fourni) | [events API](../../api/events.api.md) `GET /events/:slug` | onInit conditionnel | session 2 min |

## Mock API consommée

- `GET /api/v1/venues/:slug`
- `GET /api/v1/events/:slug` (optionnel)
- `POST /api/v1/bookings/draft` avec `accessMode=COUNTER`

## États

### loading
- Formulaire skeleton + encarts règles du comptoir.

### empty
- Le mode comptoir n'est pas proposé pour ce créneau : message "Comptoir indisponible" + suggestion changer de date.

### error
- 503 ou 422 : bannière + retry.
- 409 `access_unavailable` au moment du draft : message inline et conservation de la saisie.

### success
- Formulaire : date, heure d'arrivée, taille du groupe, occasion, nom du célébré si anniversaire, notes.
- Sélecteur optionnel de zone comptoir si le lieu expose plusieurs spots.
- Encarts : conditions d'entrée, éventuel minimum spend, acompte ou validation manuelle.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Changer date/heure | input | met à jour la disponibilité du mode comptoir |
| Sélectionner une zone comptoir | input optionnel | associe `accessResourceType=COUNTER_ZONE` et `accessResourceId` |
| Soumettre | bouton "Continuer" | `POST /bookings/draft` puis navigation `/venues/:venueSlug/counter/review` |
| Annuler | bouton secondaire | retour `/venues/:venueSlug` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| stepper | `@platform/core/components/stepper` | indicateur 1/3 |
| form-field | `@platform/core/components/form-field` | inputs |
| datetime-picker | `@platform/core/components/datetime-picker` | sélection créneau |
| summary-card | `@platform/core/components/summary-card` | récap de la demande |

## Composants internes (non réutilisables)

- `<CounterRulesNotice>` : affiche dress code, âge minimum, heure limite et politique comptoir.
- `<CounterZonePicker>` : liste simple des zones si le lieu les distingue.
- `<OccasionFields>` : occasion + nom du célébré si nécessaire.

## Validations et règles métier

- `groupSize` doit respecter la limite du comptoir ou de la zone choisie.
- Le créneau d'arrivée doit être dans `venue.openingHours` du jour choisi.
- Si aucune zone n'est exposée, le flow reste valide sans `accessResourceId`.
- Si `occasion=BIRTHDAY`, le champ `celebrantName` est recommandé.
- Si une soirée spéciale impose ticket ou paiement, l'écran doit l'annoncer avant la soumission.

## Topics realtime

Aucun requis en V1 sur cet écran.

## i18n

- `layali.booking.counter.create.title`
- `layali.booking.counter.create.field.group-size`
- `layali.booking.counter.create.field.arrival`
- `layali.booking.counter.create.field.zone`
- `layali.booking.counter.create.field.occasion`
- `layali.booking.counter.create.cta.continue`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth non requise sur cet écran.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Le flow peut créer un draft `COUNTER` avec ou sans `accessResourceId`.
- [ ] Les règles du comptoir sont visibles avant la soumission.

## Open questions

- Les zones comptoir doivent-elles être configurées dans une future API dédiée ou via des métadonnées venue/event ?