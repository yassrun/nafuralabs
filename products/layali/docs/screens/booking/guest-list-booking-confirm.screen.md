---
specVersion: 1
kind: screen
appId: layali
screenId: guest-list-booking-confirm
name: Confirmation guest list
status: review
route: /venues/:venueSlug/guest-list/confirm/:bookingId
layout: public-shell
zone: booking
roles: [CUSTOMER]
auth: required
flowRefs:
  - customer-guest-list-booking
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

# Confirmation guest list

## Intent

Étape finale du flow guest list : afficher le statut final de la demande, le QR si le booking est confirmé et scannable, et les prochaines étapes côté client.

## Route et accès

- Route : `/venues/:venueSlug/guest-list/confirm/:bookingId`
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
- Si `status=CONFIRMED` : bannière succès, QR si présent, récap complet, prochaines étapes à l'entrée.
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

- `<PendingApprovalNotice>` : bloc explicatif pour validation manuelle.
- `<DoorInstructionsCard>` : consignes d'arrivée, QR ou recherche par nom/téléphone.

## Validations et règles métier

- Le booking doit appartenir à l'utilisateur courant.
- Le QR n'est affiché que si le booking est confirmé et qu'un `qrCode` est retourné.
- Si le booking est en attente, l'écran ne doit pas simuler une confirmation ferme.
- L'écran doit rappeler que l'entrée pourra aussi être retrouvée par nom ou téléphone si le lieu fonctionne en fallback manuel.

## Topics realtime

Aucun en V1 sur cet écran.

## i18n

- `layali.booking.guestlist.confirm.title`
- `layali.booking.guestlist.confirm.pending`
- `layali.booking.guestlist.confirm.confirmed`
- `layali.booking.guestlist.confirm.cta.mybookings`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Le QR n'apparaît que pour un booking réellement confirmé.
- [ ] Un booking en attente affiche un état lisible et exploitable côté client.

## Open questions

- Faut-il envoyer une notification active quand un booking `PENDING` passe `CONFIRMED` après revue pro ?