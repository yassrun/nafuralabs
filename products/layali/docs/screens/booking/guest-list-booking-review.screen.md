---
specVersion: 1
kind: screen
appId: layali
screenId: guest-list-booking-review
name: Vérifier la demande guest list
status: review
route: /venues/:venueSlug/guest-list/review
layout: public-shell
zone: booking
roles: [CUSTOMER]
auth: required
flowRefs:
  - customer-guest-list-booking
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

# Vérifier la demande guest list

## Intent

Étape 2 du flow guest list : relire le draft, comprendre si la demande est soumise à validation manuelle et lancer, si nécessaire, un paiement avant confirmation.

## Route et accès

- Route : `/venues/:venueSlug/guest-list/review?draftId=<id>`
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
- `POST /api/v1/bookings` (body minimal : `{ draftId }` si pas de paiement, ou `{ draftId, paymentId }` si paiement initié)
- `POST /api/v1/payments/initiate`
- `GET /api/v1/payments/:paymentId`

## États

### loading
- Récap skeleton + CTA disabled.

### empty
- `draftId` invalide ou expiré : message "Demande expirée, recommencer" + bouton vers `/venues/:slug/guest-list`.

### error
- 401 : redirection `/login?returnTo=`.
- `payment_failed`, `payment_refused`, `approval_pending` mal géré : message + retry.

### success
- Récap : lieu, créneau, groupe, occasion, règles du soir.
- Badge : `Validation manuelle requise` ou `Confirmation immédiate`.
- Si paiement requis : CTA de paiement.
- Si paiement non requis : CTA `Envoyer ma demande` ou `Confirmer ma réservation`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Envoyer la demande | bouton principal si pas de paiement | `POST /bookings` puis navigation `/venues/:venueSlug/guest-list/confirm/:bookingId` |
| Payer et confirmer | bouton principal si paiement requis | `POST /payments/initiate` puis redirect gateway |
| Modifier | lien | retour `/venues/:venueSlug/guest-list` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| stepper | `@platform/core/components/stepper` | 2/3 |
| payment-form | `@platform/core/components/payment-form` | wrapper redirect paiement |
| summary-card | `@platform/core/components/summary-card` | récap de la demande |
| status-badge | `@platform/core/components/status-badge` | badge validation / paiement |

## Composants internes (non réutilisables)

- `<ApprovalPolicyNotice>` : explique validation manuelle ou auto-confirmation.
- `<GuestListTermsCard>` : rappelle les conditions d'entrée.

## Validations et règles métier

- L'utilisateur doit être authentifié.
- Le draft doit être valide (`expiresAt > now`).
- Si aucun paiement n'est requis, `POST /bookings` doit accepter une confirmation sans `paymentId`.
- Si paiement requis, le retour bancaire doit réafficher le draft sans le recréer.
- Si `requiresApproval=true`, le flow peut se terminer sur un booking `PENDING` sans QR immédiat.

## Topics realtime

Aucun. Le paiement reste géré via polling et webhook serveur.

## i18n

- `layali.booking.guestlist.review.title`
- `layali.booking.guestlist.review.approval.required`
- `layali.booking.guestlist.review.approval.instant`
- `layali.booking.guestlist.review.cta.submit`
- `layali.booking.guestlist.review.cta.pay`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Le flow permet une confirmation sans paiement si les règles du soir l'autorisent.
- [ ] Le flow supporte un état `PENDING` comme résultat valide.

## Open questions

- Une guest list validée manuellement doit-elle expirer automatiquement si le client n'arrive pas avant une certaine heure ?
- En cas de paiement requis, faut-il proposer acompte vs intégral ou un seul montant ?