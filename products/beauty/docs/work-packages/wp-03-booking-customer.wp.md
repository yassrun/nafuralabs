---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-03-booking-customer
title: Booking customer — réservation, paiement, compte client
status: stable
phase: P3
wave: 3
dependsOn: [wp-01-platform-skeleton, wp-02-discovery]
filesAllowed:
  - web/app/applications/beauty/zones/{booking,account}/**
  - web/app/applications/beauty/services/**
  - backend/domains/beauty/booking/**
  - backend/domains/beauty/customer/**
  - backend/domains/beauty/payment/**
  - backend/domains/beauty/loyalty/**
  - backend/domains/beauty/review/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:tenancy"
  - ":platform:core:authorization"
  - ":platform:core:identity"
  - ":platform:integrations:payment"
  - ":platform:integrations:sms"
  - ":platform:integrations:email"
  - "@platform/core/components"
abstractionsMissing: []
---

# Booking customer — réservation, paiement, compte client

## Scope

Implémenter le parcours de réservation client (wizard 3 steps), le paiement online (CMI/Stripe), la confirmation, et les écrans `account` (mes RDV, détail RDV, profil, fidélité).

## Inputs

- Specs IA :
  - Flow : [customer-booking](../flows/customer-booking.flow.md), [customer-onboarding](../flows/customer-onboarding.flow.md)
  - Écrans booking : [booking-create](../screens/booking/booking-create.screen.md), [booking-payment](../screens/booking/booking-payment.screen.md), [booking-confirm](../screens/booking/booking-confirm.screen.md)
  - Écrans account : [customer-profile](../screens/account/customer-profile.screen.md), [customer-bookings](../screens/account/customer-bookings.screen.md), [customer-booking-detail](../screens/account/customer-booking-detail.screen.md), [customer-loyalty](../screens/account/customer-loyalty.screen.md)
  - APIs : [bookings](../api/bookings.api.md), [payments](../api/payments.api.md), [customers](../api/customers.api.md), [loyalty](../api/loyalty.api.md), [reviews](../api/reviews.api.md)
- Abstractions : payment (CMI + Stripe), sms, email.

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/beauty/zones/booking/` (3 écrans).
  - `web/app/applications/beauty/zones/account/` (4 écrans).
  - `web/app/applications/beauty/services/payment.service.ts`, `booking.service.ts`.
  - `backend/domains/beauty/booking/` (controller + service + transitions + verrou).
  - `backend/domains/beauty/customer/` (controller `/me*`, `/pro/customers/*`).
  - `backend/domains/beauty/payment/` (orchestration, adapters, webhooks).
  - `backend/domains/beauty/loyalty/` (calcul points, soldes, conversion).
  - `backend/domains/beauty/review/` (création par customer).
- Tests :
  - E2E parcours booking complet (cash + online).
  - Tests unitaires transitions de statut.
  - Test webhook idempotency.
  - Test fenêtre d'annulation (refund partiel).

## Étapes proposées

1. Implémenter endpoints availability + bookings draft/create/cancel/reschedule.
2. Coder le wizard `booking-create` (stepper, présélection via query params).
3. Coder `booking-payment` avec timer + redirection 3DS.
4. Coder `booking-confirm` avec polling status, ICS download, partage.
5. Coder les écrans account.
6. Brancher SMS rappel J-1 (queue dans `:platform:integrations:sms`).
7. Brancher email de confirmation au callback paiement.
8. Implémenter calcul fidélité au `COMPLETED`.

## Critères d'acceptation

- [ ] Les écrans listés rendent les 4 états.
- [ ] Les contrats Mock API sont respectés.
- [ ] Le booking cash arrive direct à `CONFIRMED`.
- [ ] Le booking online passe par `PENDING_PAYMENT` → `CONFIRMED` au webhook.
- [ ] Le SMS rappel J-1 est planifié à la création (test queue).
- [ ] Le webhook paiement est idempotent (deux envois → un seul `CONFIRMED`).
- [ ] La fenêtre d'annulation respecte la config salon.
- [ ] Les permissions sont vérifiées avant rendu et avant mutation.

## Test plan

- E2E booking cash : home → salon → wizard → confirm → vérifier `/me/bookings`.
- E2E booking online : idem + payment 3DS mock → confirm.
- Webhook doublon : 2 POST identiques → un seul booking `CONFIRMED`.
- Annulation H-3 dans fenêtre 4h → `CANCELLED` + refund.
- Annulation H-1 hors fenêtre → refus 422.

## Out of scope

- Multi-services / multi-staff par RDV (V2).
- Apple/Google Pay (V2 via Stripe).
- Notifications push (V2).

## Open questions

- Politique de refund hors fenêtre : V1 = pas de refund (cash perdu côté client) ; V2 = règles par salon.
- Bookings cash : permettre la marque "Payé" à l'arrivée côté pro avec montant ajusté ? V2.
