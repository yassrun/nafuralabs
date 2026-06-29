---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-03-booking-customer
title: Booking customer — table booking, ticket purchase, account
status: stable
phase: P3
wave: 3
dependsOn: [wp-01-platform-skeleton, wp-02-discovery]
filesAllowed:
  - web/app/applications/layali/zones/{booking,ticket,account}/**
  - web/app/applications/layali/components/**
  - backend/domains/layali/booking/**
  - backend/domains/layali/ticket/**
  - backend/domains/layali/customer/**
  - backend/domains/layali/payment/**
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
  - ":platform:integrations:qr"
  - "@platform/core/components"
  - "@platform/core/realtime"
abstractionsMissing: []
---

# Booking customer — table booking, ticket purchase, account

## Scope

Implémenter les deux parcours de conversion client (table booking, ticket purchase) avec leurs écrans, leur paiement, leurs callbacks 3DS, et les écrans `account` (mes bookings, mes tickets, profil).

## Inputs

- Specs IA :
  - Flows : [customer-table-booking](../flows/customer-table-booking.flow.md), [customer-ticket-purchase](../flows/customer-ticket-purchase.flow.md)
  - Écrans booking : [table-booking-create](../screens/booking/table-booking-create.screen.md), [table-booking-payment](../screens/booking/table-booking-payment.screen.md), [table-booking-confirm](../screens/booking/table-booking-confirm.screen.md)
  - Écrans ticket : [ticket-buy](../screens/ticket/ticket-buy.screen.md), [ticket-payment](../screens/ticket/ticket-payment.screen.md), [ticket-confirm](../screens/ticket/ticket-confirm.screen.md)
  - Écrans account : [customer-bookings](../screens/account/customer-bookings.screen.md), [customer-tickets](../screens/account/customer-tickets.screen.md), [customer-profile](../screens/account/customer-profile.screen.md)
  - APIs : [bookings](../api/bookings.api.md), [tickets](../api/tickets.api.md), [payments](../api/payments.api.md), [customers](../api/customers.api.md)
- Abstractions Nafura : payment (CMI+Stripe adapters), sms, email, qr.

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/layali/zones/booking/` (3 écrans).
  - `web/app/applications/layali/zones/ticket/` (3 écrans).
  - `web/app/applications/layali/zones/account/` (3 écrans + login/register déjà faits en wp-01).
  - `web/app/applications/layali/services/payment.service.ts` (orchestration init + redirect + polling).
  - `backend/domains/layali/booking/` (controller + service + repo + transitions).
  - `backend/domains/layali/ticket/` (controller + service + génération QR via `:platform:integrations:qr`).
  - `backend/domains/layali/customer/` (controller `/customers/me*`).
  - `backend/domains/layali/payment/` (orchestrateur, adapter CMI + Stripe, webhooks signés).
- Tests :
  - E2E des deux parcours (table booking, ticket purchase) avec mock 3DS.
  - Tests unitaires transitions de statut booking et ticket.
  - Test webhook idempotency (envoi 2× même `eventId` provider).
  - Test génération QR + verify.

## Étapes proposées

1. Implémenter les endpoints `POST /bookings/draft`, `GET /bookings/draft/:id`, `POST /bookings` côté backend, avec verrou table.
2. Implémenter les endpoints tickets : draft, order, availability, génération QR au callback paiement.
3. Implémenter `payments.service` côté backend : init → adapter → callback webhook → transitions.
4. Coder les 3 écrans booking (create avec plan de salle interactif, payment, confirm avec QR).
5. Coder les 3 écrans ticket (buy avec sélection par catégorie + live availability, payment, confirm avec N QR).
6. Coder les 3 écrans account (mes bookings, mes tickets, profil).
7. Brancher SMS + email de confirmation post-paiement via les abstractions plateforme (templates par défaut).
8. Brancher topic `/topic/event/{eventId}/availability` côté ticket-buy pour live `remaining`.

## Critères d'acceptation

- [ ] Les écrans listés rendent les 4 états.
- [ ] Les contrats Mock API sont respectés (rien d'inventé hors `apiRefs`).
- [ ] Aucune abstraction n'est réimplémentée localement.
- [ ] Les permissions sont vérifiées (CUSTOMER pour `/me/*`, anonyme jusqu'au paiement).
- [ ] Les tests unitaires couvrent les états d'erreur (réseau, sold-out, refused payment, draft expiré).
- [ ] Le QR est généré uniquement au callback paiement OK (jamais sur le draft).
- [ ] Le webhook paiement est idempotent : 2e appel avec même `eventId` provider n'altère pas le booking.
- [ ] Le SMS et l'email de confirmation sont déclenchés via les abstractions plateforme.
- [ ] Le polling `GET /bookings/:id` côté confirm timeout après 30s avec message clair.

## Test plan

- E2E table booking : depuis fiche venue → create → payment mock → confirm avec QR visible + email reçu (mock SMTP).
- E2E ticket : depuis fiche event → buy 3 STD → payment mock → confirm avec 3 QR distincts.
- Webhook : POST 2× même `eventId` Stripe → un seul `CONFIRMED` côté booking.
- Annulation : `PATCH /bookings/:id/cancel` H-50 → refund déclenché auto, statut `CANCELLED`.
- Profil : `PATCH /customers/me` met à jour le displayName et persiste après reload.

## Out of scope

- Plan de salle visuel drag-drop (V2, V1 = liste de tables filtrables).
- Apple/Google Wallet (V2).
- Programme de fidélité (hors V1).

## Open questions

- Validation âge 18+ : V1 self-declaration à l'inscription, à confirmer.
- Multi-billet sur un même paiement : V1 = oui (un order = N tickets), un seul paiement.
