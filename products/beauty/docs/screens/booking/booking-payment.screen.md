---
specVersion: 1
kind: screen
appId: beauty
screenId: booking-payment
name: Paiement du RDV
status: stable
phase: P1
p1MobileId: booking-payment
p1Impl: mock
route: /booking/:bookingId/payment
layout: booking-layout
zone: booking
roles: [CUSTOMER]
auth: required
flowRefs:
  - ../../flows/customer-booking.flow.md
apiRefs:
  - ../../api/bookings.api.md
  - ../../api/payments.api.md
abstractions:
  components:
    - "@platform/core/i18n"
---

# Paiement du RDV

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `â€”` |
| Impl | none |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(wp-p1-01)*

## Intent

Étape 2/3 du wizard de réservation. Présente le récap RDV et déclenche le paiement online (CMI ou Stripe) via redirection 3DS. Si paiement cash sélectionné en step 1, cet écran est skippé et on va direct à `confirm`.

## Route et accès

- Route : `/booking/:bookingId/payment`
- Layout : `booking-layout` (stepper 2/3)
- Auth : required
- Rôles autorisés : CUSTOMER (propriétaire du booking uniquement)
- Tenant requis : non (résolu par bookingId)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Booking PENDING_PAYMENT | [GET /api/v1/bookings/:bookingId](../../api/bookings.api.md#GET-/api/v1/bookings/:bookingId) | onInit | mémoire (non cacheable) |
| Payment associé | [GET /api/v1/payments/:paymentId](../../api/payments.api.md#GET-/api/v1/payments/:paymentId) | onInit + polling status si nécessaire | mémoire |

## Mock API consommée

- `GET /api/v1/bookings/:bookingId`
- `GET /api/v1/payments/:paymentId`
- `POST /api/v1/payments/:paymentId/retry` (si init échouée)

## États

### loading
- Skeleton récap + bouton Payer désactivé.

### empty
- N/A.

### error
- Booking introuvable (404) → "Réservation introuvable" + retour `/`.
- Booking déjà payé (`PAID_ONLINE`) → redirection auto vers `/booking/:id/confirm`.
- Booking dans état terminal (`CANCELLED`, `COMPLETED`) → message + retour `/me/bookings`.
- Provider down (503 au `redirectUrl` init) → bouton "Réessayer" + lien switch provider.

### success
- Récap RDV : salon, service, durée, staff, date+heure, prix.
- Sélecteur provider (CMI / Stripe) si non figé en step 1.
- Bandeau "Paiement sécurisé par CMI / Stripe" + logos.
- Compte à rebours : "Réservation maintenue 10 min — payez avant <horloge>" (timeout → annulation auto).
- Bouton principal "Payer 250 MAD" sticky bas.
- Lien "Annuler" → modal confirmation → `POST /bookings/:id/cancel` puis redirection home.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Lancer le paiement | clic CTA | redirection `redirectUrl` provider (CMI/Stripe) |
| Changer provider | toggle | si pas encore init, MAJ choix ; sinon impossible |
| Annuler | lien | dialog → `POST /bookings/:id/cancel` |
| Retour | header chevron | retour `/salons/:slug/book` (avec sélection en sessionStorage) |

## Composants utilisés

| Composant | Source | Rôle |
|---|---|---|
| layout-booking | `@platform/core/layouts/booking` | header stepper |

## Composants internes (non réutilisables)

- `<BookingRecapCard>` : récap RDV stylisé.
- `<PaymentTimer>` : compte à rebours avec bascule rouge < 2 min.
- `<ProviderToggle>` : sélecteur visuel CMI/Stripe.

## Validations et règles métier

- Bouton "Payer" désactivé si timer < 0 ou booking n'est pas en `PENDING_PAYMENT`.
- Le `redirectUrl` provient du backend (`POST /bookings` initial ou un retry).
- Idempotence : un retry passe par `POST /payments/:id/retry` plutôt que recréer le payment.
- Pas de stockage carte côté Beauty ; tokenisation provider uniquement.

## i18n

- Clés : `beauty.payment.title`, `beauty.payment.recap`, `beauty.payment.provider.cmi`, `beauty.payment.provider.stripe`, `beauty.payment.cta`, `beauty.payment.timer.warn`, `beauty.payment.cancel`, `beauty.payment.error.providerDown`, `beauty.payment.error.expired`.

## Critères d'acceptation

- [ ] L'écran rend correctement chacun des 4 états.
- [ ] Le timer décompte et désactive le CTA à 0.
- [ ] L'annulation déclenche un POST cancel et redirige.
- [ ] La redirection 3DS s'ouvre dans la même fenêtre (les providers gèrent le retour via `returnUrl`).
- [ ] Un booking déjà `PAID_ONLINE` redirige vers `confirm` sans demander d'action.
- [ ] Aucun appel direct à un endpoint hors `apiRefs`.

## Open questions

- Conservation du choix CMI/Stripe par défaut au prochain RDV : V2.
- Carte sauvegardée (tokenization Stripe) : V3.
- Paiement Apple Pay / Google Pay : V2 via Stripe.
