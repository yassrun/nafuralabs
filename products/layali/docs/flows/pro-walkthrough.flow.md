---
specVersion: 1
kind: flow
appId: layali
flowId: pro-walkthrough
name: Parcours pro walkthrough (mobile P1)
status: stable
phase: P1
actor: OWNER
trigger: entry Manager ou pro-login
screensRefs:
  - ../screens/account/entry.screen.md
  - ../screens/pro/pro-login.screen.md
  - ../screens/pro/pro-dashboard.screen.md
  - ../screens/pro/pro-bookings-list.screen.md
  - ../screens/pro/pro-booking-detail.screen.md
  - ../screens/pro/pro-door-checkin.screen.md
  - ../screens/pro/pro-tables.screen.md
  - ../screens/pro/pro-events-list.screen.md
  - ../screens/pro/pro-event-edit.screen.md
  - ../screens/pro/pro-access-requests.screen.md
  - ../screens/pro/pro-venue-settings.screen.md
  - ../screens/pro/pro-tickets-list.screen.md
  - ../screens/pro/pro-reviews.screen.md
---

# Parcours pro walkthrough (mobile P1)

> **P1 walkthrough :** [fixtures.md](../fixtures.md). Pas d’API HTTP.

## Objectif

Démontrer la console pro venue en mock : dashboard, réservations, porte, plan de salle, events, demandes d’accès — plus stubs settings, tickets list, reviews (wp-p1-03).

## Étapes (gate P1)

| # | Écran | Mobile id | Impl cible |
|---|-------|-----------|------------|
| 1 | entry → pro-login | `pro-login` | mock |
| 2 | pro-dashboard | `pro-dashboard` | mock |
| 3 | pro-bookings-list + detail | `pro-bookings-list` | mock / partial |
| 4 | pro-door-checkin | `pro-door-checkin` | mock |
| 5 | pro-tables | `pro-tables` | mock |
| 6 | pro-events-list → edit | `pro-events-list` | mock |
| 7 | pro-access-requests | `pro-access-requests` | mock |
| 8 | pro-venue-settings | — | wp-p1-03 |
| 9 | pro-tickets-list | — | wp-p1-03 |
| 10 | pro-reviews | — | wp-p1-03 |

Voir aussi : [pro-access.flow.md](pro-access.flow.md), [pro-membership-review.flow.md](pro-membership-review.flow.md).

## Critères de sortie flow

- [ ] Étapes 1–7 jouables
- [ ] 8–10 stub navigables (wp-p1-03)
