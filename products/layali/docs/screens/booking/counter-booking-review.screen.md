---
specVersion: 1
kind: screen
appId: layali
screenId: counter-booking-review
name: Vérifier la réservation comptoir
status: review
phase: P1
p1MobileId: booking-review
p1Impl: mock
route: /venues/:venueSlug/counter/review
layout: public-shell
zone: booking
roles: [CUSTOMER]
auth: required
flowRefs:
  - customer-counter-booking
apiRefs:
  - bookings#GET-/bookings/draft/:draftId
  - bookings#POST-/bookings
  - payments#POST-/payments/initiate
  - payments#GET-/payments/:paymentId
abstractions:
  components:
    - "@platform/core/components/stepper"
    - "@platform/core/components/payment-form"
    - "@platform/core/components/summary-card"
    - "@platform/core/components/status-badge"
  patterns:
    - "booking/multi-step-wizard"
    - "booking/review-before-submit"
    - "payment/redirect-flow"
---

# Vérifier la réservation comptoir

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `booking-review` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Étape 2 du flow comptoir : relire le draft, comprendre les conditions économiques ou opérationnelles du comptoir, et confirmer la réservation avec ou sans paiement.

## Route et accès

- Route : `/venues/:venueSlug/counter/review?draftId=<id>`
- Layout : public-shell
- Auth : required
- Rôles autorisés : CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Draft booking | [bookings API](../../api/bookings.api.md) `GET /bookings/draft/:draftId` | onInit | non |
| Statut paiement (si paiement initié) | [payments API](../../api/payments.api.md) `GET /payments/:paymentId` | post-init paiement | non |

## Mock API consommée

- `GET /api/v1/bookings/draft/:draftId`
- `POST /api/v1/bookings`
- `POST /api/v1/payments/initiate`
- `GET /api/v1/payments/:paymentId`

## États

### loading
- Récap skeleton + CTA disabled.

### empty
- `draftId` invalide ou expiré : message "Réservation expirée, recommencer" + bouton vers `/venues/:venueSlug/counter`.

### error
- 401 : redirection `/login?returnTo=`.
- `payment_failed`, `payment_refused` ou erreur de confirmation : message + retry.

### success
- Récap : lieu, créneau, groupe, zone comptoir si choisie, occasion, règles du soir.
- Badge : `Validation manuelle requise`, `Paiement requis`, ou `Confirmation immédiate`.
- Si paiement requis : CTA de paiement.
- Si paiement non requis : CTA `Confirmer ma réservation` ou `Envoyer ma demande`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Confirmer | bouton principal si pas de paiement | `POST /bookings` puis navigation `/venues/:venueSlug/counter/confirm/:bookingId` |
| Payer et confirmer | bouton principal si paiement requis | `POST /payments/initiate` puis redirect gateway |
| Modifier | lien | retour `/venues/:venueSlug/counter` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| stepper | `@platform/core/components/stepper` | 2/3 |
| payment-form | `@platform/core/components/payment-form` | wrapper redirect paiement |
| summary-card | `@platform/core/components/summary-card` | récap de la demande |
| status-badge | `@platform/core/components/status-badge` | badge validation / paiement |

## Composants internes (non réutilisables)

- `<CounterPolicyNotice>` : explique minimum spend, acompte et validation manuelle.
- `<SpotExpectationCard>` : clarifie qu'un comptoir n'offre pas le même niveau de garantie qu'une table si la politique du lieu l'impose.

## Validations et règles métier

- L'utilisateur doit être authentifié.
- Le draft doit être valide (`expiresAt > now`).
- Si aucun paiement n'est requis, `POST /bookings` doit accepter une confirmation sans `paymentId`.
- Si `requiresApproval=true`, le flow peut se terminer sur un booking `PENDING` sans QR immédiat.
- Le récap doit distinguer clairement `COUNTER` d'une réservation de table.

## Topics realtime

Aucun. Le paiement reste géré via polling et webhook serveur.

## i18n

- `layali.booking.counter.review.title`
- `layali.booking.counter.review.policy.minimum-spend`
- `layali.booking.counter.review.cta.submit`
- `layali.booking.counter.review.cta.pay`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Le flow permet une confirmation sans paiement si les règles du soir l'autorisent.
- [ ] Le mode `COUNTER` est visuellement distingué d'un booking table dans le récap.

## Open questions

- Le minimum spend comptoir est-il toujours individuel, par groupe, ou dépend-il de la zone ?
