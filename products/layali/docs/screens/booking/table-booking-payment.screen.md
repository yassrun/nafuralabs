---
specVersion: 1
kind: screen
appId: layali
screenId: table-booking-payment
name: Paiement réservation
status: stable
phase: P1
p1MobileId: booking-payment
p1Impl: mock
route: /venues/:venueSlug/book/payment
layout: public-shell
zone: booking
roles: [CUSTOMER]
auth: required
flowRefs:
  - customer-table-booking
apiRefs:
  - bookings#GET-/bookings/draft/:draftId
  - payments#POST-/payments/initiate
  - payments#GET-/payments/:paymentId
abstractions:
  components:
    - "@platform/core/components/stepper"
    - "@platform/core/components/payment-form"
    - "@platform/core/components/summary-card"
  patterns:
    - "booking/multi-step-wizard"
    - "payment/redirect-flow"
---

# Paiement réservation

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `booking-payment` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Étape 2 du flow réservation table : confirmer le récap, choisir acompte ou intégral, et lancer le paiement (CMI par défaut, Stripe en fallback).

## Route et accès

- Route : `/venues/:venueSlug/book/payment?draftId=<id>`
- Layout : public-shell
- Auth : required (déclenche `/login?returnTo=` si non connecté)
- Rôles autorisés : CUSTOMER
- Tenant requis : non (le draft contient déjà le venueId)

## Données nécessaires

| Donnée | Source | Quand chargée | Mise en cache |
|---|---|---|---|
| Draft booking | [bookings API](../../api/bookings.api.md) `GET /bookings/draft/:draftId` | onInit | non |
| Statut paiement (polling) | [payments API](../../api/payments.api.md) `GET /payments/:paymentId` | post-init paiement | non |

## Mock API consommée

- `GET /api/v1/bookings/draft/:draftId`
- `POST /api/v1/payments/initiate` (body : `{ draftId, mode: "deposit" | "full" }`)
- `GET /api/v1/payments/:paymentId` (polling toutes les 3s jusqu'à statut final)
- Webhook serveur (hors écran) : `POST /api/v1/payments/webhook/cmi`

## États

### loading
- Récap skeleton + boutons disabled.

### empty
- `draftId` invalide ou expiré : message "Réservation expirée, recommencer" + bouton vers `/venues/:slug/book`.

### error
- `payment_failed`, `payment_refused`, `unavailable` : message + bouton retry.
- 401 : redirection `/login?returnTo=`.

### success
- Récap clair : venue, table, créneau, group size, minimum spend, frais (le cas échéant), total acompte.
- Boutons "Payer un acompte" et "Payer intégralement".
- Redirection vers gateway puis retour automatique à `/venues/:slug/book/confirm/:bookingId`.

## Actions utilisateur

| Action | Déclencheur | Résultat |
|---|---|---|
| Payer acompte | bouton | `POST /payments/initiate` mode `deposit` → redirect gateway |
| Payer intégral | bouton | `POST /payments/initiate` mode `full` → redirect gateway |
| Annuler | lien | retour `/venues/:slug/book` |

## Composants utilisés

| Composant | Source | Rôle dans l'écran |
|---|---|---|
| stepper | `@platform/core/components/stepper` | 2/3 |
| payment-form | `@platform/core/components/payment-form` | wrapper redirect CMI/Stripe |
| summary-card | `@platform/core/components/summary-card` | récap booking |

## Composants internes (non réutilisables)

- `<DepositVsFullToggle>` : segmented control.
- `<TermsCheckbox>` : acceptation CGV (obligatoire avant CTA).

## Validations et règles métier

- L'utilisateur doit être authentifié (`auth: required`).
- Le draft doit être valide (`expiresAt > now`). Sinon 410 `draft_expired` et retour étape 1.
- Le mode `deposit` n'est proposé que si `venue.acceptsDeposit=true` (sinon "full" forcé).
- `TermsCheckbox` doit être coché.
- Le draft doit appartenir à l'utilisateur courant (ou être anonyme avec lien stocké en session) — sinon 403.

## Topics realtime

Aucun. Le paiement est synchrone côté UI (polling + webhook serveur).

## i18n

- `layali.booking.payment.title`
- `layali.booking.payment.mode.deposit`
- `layali.booking.payment.mode.full`
- `layali.booking.payment.cta.pay`
- `layali.booking.payment.errors.failed`
- `layali.booking.payment.terms.label`

## Critères d'acceptation

- [ ] Les 4 états sont rendus.
- [ ] Auth requise : redirection `/login?returnTo=` si non connecté.
- [ ] Aucun appel hors `apiRefs`.
- [ ] Si le draft est expiré (410), l'écran redirige vers `/venues/:slug/book` avec un message clair (sans crash).
- [ ] Le polling sur `GET /payments/:id` s'arrête après 90s avec un état "en attente" + lien d'aide.
- [ ] Un retour bancaire `payment_refused` réaffiche le récap et reproposera de réessayer sans recréer un draft.

## Open questions

- Conservation du draft après échec paiement : combien de temps ? Décision provisoire : draft TTL initial 15 min, prolongé à 5 min après échec paiement.
- Affichage en monnaie locale uniquement (MAD) ou multi-devise (EUR pour touristes) ? Décision provisoire : MAD V1.
