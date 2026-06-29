---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-05-pro-ops
title: Pro ops — bookings, tickets, door check-in, reviews
status: stable
phase: P3
wave: 5
dependsOn: [wp-01-platform-skeleton, wp-03-booking-customer, wp-04-pro-core]
filesAllowed:
  - web/app/applications/layali/zones/pro/{bookings,tickets,door,reviews}/**
  - web/app/applications/layali/components/pro/**
  - backend/domains/layali/booking/**
  - backend/domains/layali/ticket/**
  - backend/domains/layali/checkin/**
  - backend/domains/layali/review/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:tenancy"
  - ":platform:core:authorization"
  - ":platform:integrations:realtime"
  - ":platform:integrations:qr"
  - ":platform:integrations:payment"
  - "@platform/core/components"
  - "@platform/core/realtime"
abstractionsMissing: []
---

# Pro ops — bookings, tickets, door check-in, reviews

## Scope

Implémenter les écrans opérationnels du pro pour la soirée et le suivi post-soirée : liste bookings + détail, liste tickets + refunds, contrôle d'accès porte (scanner QR full-screen), et gestion des avis (modération + réponses).

## Inputs

- Specs IA :
  - [pro-no-access](../screens/pro/pro-no-access.screen.md)
  - [pro-tenant-suspended](../screens/pro/pro-tenant-suspended.screen.md)
  - [pro-bookings-list](../screens/pro/pro-bookings-list.screen.md)
  - [pro-booking-detail](../screens/pro/pro-booking-detail.screen.md)
  - [pro-tickets-list](../screens/pro/pro-tickets-list.screen.md)
  - [pro-door-checkin](../screens/pro/pro-door-checkin.screen.md)
  - [pro-reviews](../screens/pro/pro-reviews.screen.md)
  - Flow : [pro-access](../flows/pro-access.flow.md)
  - APIs : [bookings](../api/bookings.api.md), [tickets](../api/tickets.api.md), [checkins](../api/checkins.api.md), [reviews](../api/reviews.api.md), [payments](../api/payments.api.md)
- Abstractions Nafura : realtime (broker), qr (verify), payment (refund).

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/layali/zones/pro/bookings/{list,detail}/`
  - `web/app/applications/layali/zones/pro/tickets/`
  - `web/app/applications/layali/zones/pro/door/` (composant scanner full-screen)
  - `web/app/applications/layali/zones/pro/reviews/`
  - `web/app/applications/layali/components/pro/{booking-actions-bar,refund-dialog,scan-feedback-overlay}/`
  - `backend/domains/layali/booking/` (endpoints `/bookings?scope=tenant`, mutations transitions).
  - `backend/domains/layali/ticket/` (endpoints scope=tenant, refund).
  - `backend/domains/layali/checkin/` (controller `/checkins/verify`, `/checkins/sync`, `/checkins/counter`).
  - `backend/domains/layali/review/` (endpoints reply, flag).
- Tests :
  - E2E door check-in : scan d'un QR valide → ACCEPTED ; scan double → REJECTED `qr_already_used`.
  - Test offline scanner : pas de réseau → queue 10 scans → resync → 10 check-ins en DB.
  - Test refund : OWNER refund 50% sur un booking → `paymentStatus=PARTIAL_REFUNDED`.
  - Test reply review : OWNER répond → `reply` visible côté public.
  - Test BAR_MANAGER : aucun bouton d'action visible sur la liste bookings.

## Étapes proposées

1. Implémenter les endpoints scope=tenant pour bookings et tickets.
2. Implémenter le controller `/checkins/verify` avec verrou atomique anti-double-scan (lock Redis ou unique DB).
3. Implémenter `/checkins/sync` pour la reprise offline (traitement ordonné, idempotency).
4. Coder l'écran `pro-door-checkin` (caméra plein écran via `@platform/core/components/qr-scanner`, overlays ACCEPT/REJECT, queue offline localStorage, resync auto à la reconnexion).
5. Coder les listes bookings et tickets avec filtres, pagination cursor, tri.
6. Coder le détail booking avec actions (mark arrived/no-show/cancel, refund partiel).
7. Coder la liste reviews avec réponse et flag.
8. Brancher les topics realtime : `/topic/tenant/{tenantId}/bookings`, `/topic/event/{eventId}/checkin`.

## Critères d'acceptation

- [ ] Les écrans listés rendent les 4 états.
- [ ] Les contrats Mock API sont respectés.
- [ ] Aucune abstraction n'est réimplémentée localement.
- [ ] BAR_MANAGER : lecture seule strictement, vérifié par guard ET par UI.
- [ ] HOST : accès uniquement à `/pro/door` (test redirection 403 sur `/pro/bookings`).
- [ ] Une session pro qui reçoit `tenant_suspended` depuis un endpoint ops bascule vers l'écran dédié sans rester sur un écran métier cassé.
- [ ] Le double-scan est rejeté en moins de 100 ms.
- [ ] Le mode offline scanner accepte ≥ 50 scans en queue sans crash et resync correctement.
- [ ] Le refund partiel respecte le solde restant et trace dans `payment.refunds`.
- [ ] Une réponse publiée à un avis est visible côté `/venues/:slug` (cohérence cache à valider).
- [ ] Les permissions sont vérifiées avant rendu et avant mutation.

## Test plan

- E2E door : OWNER se logue → choisit event du jour → scan QR valide → vert + compteur +1 → scan même QR → rouge `qr_already_used`.
- Offline : couper le réseau scanner → 5 scans (réponse grise "en attente") → reconnecter → 5 check-ins en DB, compteur incrémenté.
- Refund : sur booking `PAID` 1000 MAD, refund 500 MAD → `PARTIAL_REFUNDED` côté DB + reçu mis à jour.
- BAR_MANAGER liste bookings : aucun bouton d'action visible, clic ligne → détail lecture seule.

## Out of scope

- Print PDF des réservations (V2).
- Notifications push pro (V2).

## Open questions

- Reconnaissance faciale pour les VIP : V3.
- Mode kiosque borné scanner (Android Kiosk Lock) : V2.
- Multi-scanner en parallèle sur un même event : OK via topic, mais à monitorer.
