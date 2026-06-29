---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-p1-03
title: P1 — Pro walkthrough (écrans manquants)
phase: P1
status: ready
wave: 1
dependsOn: []
filesAllowed:
  - layali/mobile/src/App.tsx
  - layali/mobile/src/App.css
  - layali/mobile/src/prototypeData.ts
  - layali/mobile/src/ManagerScreens.tsx
filesForbidden:
  - layali/docs/api/**
  - layali/backend/**
  - layali/web/**
abstractionsRequired: []
abstractionsMissing: []
---

# P1 — Pro walkthrough (écrans manquants)

## Scope

Le socle pro mobile existe (dashboard, bookings, door, tables, events). Ajouter les écrans stub manquants pour le gate [pro-access](../flows/pro-access.flow.md) :

| Screen spec | Priorité |
|-------------|----------|
| [pro-venue-settings](../screens/pro/pro-venue-settings.screen.md) | haute |
| [pro-tickets-list](../screens/pro/pro-tickets-list.screen.md) | haute |
| [pro-reviews](../screens/pro/pro-reviews.screen.md) | moyenne |
| [pro-booking-detail](../screens/pro/pro-booking-detail.screen.md) | moyenne — route dédiée si panneau inline insuffisant |
| [pro-tenant-suspended](../screens/pro/pro-tenant-suspended.screen.md) | basse (stub) |

## Inputs

- [fixtures.md](../fixtures.md)
- [navigation.md](../navigation.md) § Pro

## Outputs

- Navigation depuis pro-dashboard vers chaque écran
- Fixtures mock (tickets vendus, avis à modérer, tenant suspendu toggle)
- Mettre à jour [00-PROGRESS.md](../00-PROGRESS.md)

## Critères d'acceptation

- [ ] Flow pro-access jouable : login pro → dashboard → bookings detail → door → tickets list → reviews (stub actions)
- [ ] Venue settings éditable en mock (nom, horaires, photo placeholder)
- [ ] `npm run build` vert

## Out of scope

- Scanner QR réel (platform P2)
- Web pro Angular
