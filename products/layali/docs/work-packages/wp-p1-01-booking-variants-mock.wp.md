---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-p1-01
title: P1 — Booking table / guest list / comptoir (parcours mock complets)
phase: P1
status: ready
wave: 1
dependsOn: []
filesAllowed:
  - layali/mobile/src/App.tsx
  - layali/mobile/src/App.css
  - layali/mobile/src/prototypeData.ts
filesForbidden:
  - layali/docs/api/**
  - layali/backend/**
  - layali/web/**
abstractionsRequired: []
abstractionsMissing: []
---

# P1 — Booking table / guest list / comptoir

## Scope

Fermer les flows [customer-table-booking](../flows/customer-table-booking.flow.md), [customer-guest-list-booking](../flows/customer-guest-list-booking.flow.md) et [customer-counter-booking](../flows/customer-counter-booking.flow.md) en **mock local**.

Le prototype a déjà `booking-create` / `booking-payment` / `booking-confirm` unifiés par `accessMode` — compléter :

- écran **review** guest list (`guest-list-booking-review`) avant confirm si approval manuelle ;
- écran **review** comptoir (`counter-booking-review`) ;
- libellés / stepper cohérents par mode (étapes 1/3 distinctes dans les specs) ;
- navigation hash explicite si utile (`#/venues/:slug/book/guest-list`, etc.).

## Inputs

- [phases.md](../phases.md) — gate P1
- [fixtures.md](../fixtures.md)
- Screens booking : [table-booking-create](../screens/booking/table-booking-create.screen.md), [guest-list-booking-*](../screens/booking/), [counter-booking-*](../screens/booking/)

**Hors scope spec :** détail `api/*.md` — comportement décrit dans les flows uniquement.

## Outputs

- 3 parcours jouables de bout en bout depuis venue-detail / event-detail
- Mettre à jour [00-PROGRESS.md](../00-PROGRESS.md)

## Critères d'acceptation

- [ ] TABLE : venue → create → payment → confirm → bookings-list
- [ ] GUEST_LIST : demande → review (si MANUAL) → confirm
- [ ] COUNTER : create → review → confirm
- [ ] Fixtures `prototypeData.ts` couvrent les 3 modes
- [ ] `npm run build` vert

## Out of scope

- HTTP / `mock-api.md`
- Web Angular (P2)
