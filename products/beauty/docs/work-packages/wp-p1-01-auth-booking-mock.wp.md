---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-p1-01
title: P1 — Auth mock + parcours booking complet (payment mock)
phase: P1
status: ready
wave: 1
dependsOn: []
filesAllowed:
  - beauty/mobile/src/App.tsx
  - beauty/mobile/src/App.css
  - beauty/mobile/src/prototypeData.ts
  - beauty/mobile/src/ManagerScreens.tsx
filesForbidden:
  - beauty/docs/api/**
  - beauty/backend/**
  - beauty/web/**
  - products/beauty/docs/work-packages/wp-0[1-6]*
abstractionsRequired: []
abstractionsMissing: []
---

# P1 — Auth mock + parcours booking complet

## Scope

Fermer le flow [customer-booking](../flows/customer-booking.flow.md) et [customer-onboarding](../flows/customer-onboarding.flow.md) en **mock local** : écrans `login`, `register`, `booking-payment`, compléter `booking-select-time` (staff + mode paiement cash/online).

## Inputs

- [phases.md](../phases.md) — gate P1
- [fixtures.md](../fixtures.md)
- [customer-booking.flow.md](../flows/customer-booking.flow.md)
- [customer-onboarding.flow.md](../flows/customer-onboarding.flow.md)
- Screens : [login](../screens/account/login.screen.md), [register](../screens/account/register.screen.md), [booking-create](../screens/booking/booking-create.screen.md), [booking-payment](../screens/booking/booking-payment.screen.md), [booking-confirm](../screens/booking/booking-confirm.screen.md)

**Hors scope spec :** détail `api/*.md` — comportement décrit dans les flows uniquement.

## Outputs

- Brancher `login`, `register` dans le `switch` de `App.tsx`
- Gate auth avant confirm si non connecté (mock JWT en mémoire)
- Écran `booking-payment` mock (redirect fake 3DS ou skip)
- Staff selection step (ou « Indifférent »)
- Confirm avec référence booking `BK-XXXX` + ajout à `mockCustomerBookings`
- Mettre à jour [00-PROGRESS.md](../00-PROGRESS.md)

## Critères d'acceptation

- [ ] Flow onboarding : entry → register OTP mock → home
- [ ] Flow booking : home → detail → create (service+staff+slot) → payment mock → confirm → bookings-list
- [ ] Login mock : OTP `123456` accepté
- [ ] Aucun fetch HTTP réel
- [ ] `npm run build` vert

## Test plan

- Parcours booking cash de bout en bout
- Parcours booking online mock (écran payment → confirm)
- Register nouveau numéro → booking avec redirect

## Out of scope

- Contrats REST / fichiers `api/`
- Backend / web Angular
