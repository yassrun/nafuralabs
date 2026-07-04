---
specVersion: 1
kind: screen
appId: layali
screenId: counter-booking-confirm
name: Confirmation réservation comptoir
status: review
phase: P1
p1MobileId: booking-confirm
p1Impl: mock
route: /venues/:venueSlug/counter/confirm/:bookingId
layout: public-shell
zone: booking
roles: [CUSTOMER]
auth: required
flowRefs:
  - customer-counter-booking
apiRefs:
  - bookings#GET-/bookings/:id
abstractions:
  components:
    - "@platform/core/components/qr-display"
    - "@platform/core/components/summary-card"
    - "@platform/core/components/status-badge"
  patterns:
    - "booking/confirmation"
---

# Confirmation réservation comptoir

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `booking-confirm` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Étape finale du flow comptoir : afficher le statut final, le QR si le booking est confirmé et scannable, et rappeler les conditions d'arrivée liées au comptoir.

## Route et accès

- Route : `/venues/:venueSlug/counter/confirm/:bookingId`
- Layout : public-shell
- Auth : required
- Rôles autorisés : CUSTOMER
- Tenant requis : non

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Booking | [bookings API](../../api/bookings.api.md) `GET /bookings/:id` | onInit | session 1 min |

## Mock API consommée

- `GET /api/v1/bookings/:id`

## États

### loading
- Skeleton récap + placeholder statut.

### empty
- Booking introuvable : message "Récap indisponible" + lien vers `/me/bookings`.

### error
- 403 si booking d'un autre utilisateur : redirection `/me/bookings`.
- 404 : page d'erreur.

### success
- Si `status=CONFIRMED` : bannière succès, QR si présent, récap complet, consignes d'arrivée comptoir.
- Si `status=PENDING` ou `approvalStatus=PENDING` : bannière "En attente de validation" avec explication claire.
- Si `status=CANCELLED` avec rejet : message explicite et orientation support / venue.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Voir mes réservations | bouton | navigation `/me/bookings` |
| Retour venue | lien | navigation `/venues/:venueSlug` |
| Retour accueil | lien | navigation `/` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| qr-display | `@platform/core/components/qr-display` | rendu QR si confirmé |
| summary-card | `@platform/core/components/summary-card` | récap de la réservation |
| status-badge | `@platform/core/components/status-badge` | état confirmé / pending / rejeté |

## Composants internes (non réutilisables)

- `<CounterArrivalNotice>` : précise heure limite d'arrivée et consignes d'accès au bar spot.
- `<PendingApprovalNotice>` : bloc explicatif pour validation manuelle.

## Validations et règles métier

- Le booking doit appartenir à l'utilisateur courant.
- Le QR n'est affiché que si le booking est confirmé et qu'un `qrCode` est retourné.
- Si le booking est en attente, l'écran ne doit pas simuler une confirmation ferme.
- L'écran doit rappeler qu'un comptoir peut être traité par nom ou téléphone si le lieu fonctionne en fallback manuel.

## Topics realtime

Aucun en V1 sur cet écran.

## i18n

- `layali.booking.counter.confirm.title`
- `layali.booking.counter.confirm.pending`
- `layali.booking.counter.confirm.confirmed`
- `layali.booking.counter.confirm.cta.mybookings`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Le QR n'apparaît que pour un booking réellement confirmé.
- [ ] L'écran rappelle clairement qu'il s'agit d'un accès comptoir et non d'une table.

## Open questions

- Faut-il proposer une montée en gamme vers table si une place comptoir n'est plus disponible au moment de la confirmation ?
