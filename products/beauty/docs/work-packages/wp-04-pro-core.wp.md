---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-04-pro-core
title: Pro core — dashboard, agenda, bookings liste + détail
status: stable
wave: 4
dependsOn: [wp-01-platform-skeleton, wp-03-booking-customer]
filesAllowed:
  - web/app/applications/beauty/zones/pro/{dashboard,agenda,bookings}/**
  - web/app/applications/beauty/components/pro/**
  - backend/domains/beauty/booking/**
  - backend/domains/beauty/salon/**
filesForbidden:
  - naf/src/spec/**
  - aispecs/**
  - infra/**
abstractionsRequired:
  - ":platform:core:tenancy"
  - ":platform:core:authorization"
  - "@platform/core/components"
abstractionsMissing: []
---

# Pro core — dashboard, agenda, bookings liste + détail

## Scope

Implémenter le cœur du back-office salon : dashboard, agenda jour/semaine multi-staffs, liste bookings, détail booking, walk-in. Roles OWNER, ADMIN, STAFF (vue filtrée).

## Inputs

- Specs IA :
  - [pro-dashboard](../screens/pro/pro-dashboard.screen.md), [pro-agenda](../screens/pro/pro-agenda.screen.md), [pro-bookings-list](../screens/pro/pro-bookings-list.screen.md), [pro-booking-detail](../screens/pro/pro-booking-detail.screen.md)
  - APIs : [bookings](../api/bookings.api.md), [salons](../api/salons.api.md), [staff](../api/staff.api.md), [payments](../api/payments.api.md), [customers](../api/customers.api.md)
- Abstractions : tenancy (X-Tenant-Id), composants UI calendar-week.

## Outputs attendus

- Fichiers créés ou modifiés :
  - `web/app/applications/beauty/zones/pro/{dashboard,agenda,bookings}/`
  - `web/app/applications/beauty/components/pro/{kpi-card,agenda-booking-block,booking-row-actions,walk-in-dialog,refund-dialog,reschedule-dialog}/`
  - `backend/domains/beauty/booking/` (endpoints `/pro/bookings*`, transitions, agenda, walk-in).
- Tests :
  - E2E : login OWNER → dashboard → agenda → drag-replan → vérifier transition.
  - Tests guards STAFF (filtré sur soi).
  - Tests transition automatiques (`NO_SHOW` après 15 min).

## Étapes proposées

1. Implémenter endpoints `/pro/bookings*` (list, agenda, detail, status, patch, cancel, reschedule).
2. Job background : auto-`NO_SHOW` après 15 min de retard si pas `ARRIVED`.
3. Coder dashboard pro avec KPIs + agenda condensé.
4. Coder agenda pro avec drag-replan, walk-in, statut transitions.
5. Coder liste bookings + détail booking avec actions.
6. Brancher cache front et polling 60s pour cohérence agenda.

## Critères d'acceptation

- [ ] Les écrans listés rendent les 4 états.
- [ ] Les contrats Mock API sont respectés.
- [ ] STAFF voit uniquement ses RDV (guard + filtre backend).
- [ ] Drag-replan met à jour côté backend et UI sans flicker, gère 409.
- [ ] Walk-in crée un booking `CONFIRMED` avec customer ad-hoc.
- [ ] Le job `NO_SHOW` automatique fonctionne (test programmé).
- [ ] Les permissions sont vérifiées (cancel par STAFF interdit).
- [ ] Les `Idempotency-Key` sont gérées côté front pour les mutations critiques.

## Test plan

- Login OWNER : voit dashboard + agenda du jour + KPIs.
- Login STAFF : voit dashboard restreint + agenda filtré.
- Drag-replan vers créneau pris : 409 + restore visuel.
- Walk-in : créer booking pour numéro non enregistré → customer ad-hoc créé.
- Auto-`NO_SHOW` : booking `CONFIRMED` avec `startAt` -16 min → transition automatique au prochain tick.

## Out of scope

- Services, staff, customers, reviews, loyalty, settings (wp-05).
- Admin Nafura (wp-06).

## Open questions

- Polling vs WebSocket pour l'agenda live : V1 = polling 60s ; V2 = WebSocket via `:platform:integrations:realtime` (futur).
- Vue mois (calendar full) : V2.
