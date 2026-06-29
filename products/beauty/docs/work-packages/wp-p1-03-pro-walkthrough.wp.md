---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-p1-03
title: P1 — Pro walkthrough (écrans manquants)
phase: P1
status: ready
wave: 1
dependsOn: []
filesAllowed:
  - beauty/mobile/src/App.tsx
  - beauty/mobile/src/ManagerScreens.tsx
  - beauty/mobile/src/prototypeData.ts
filesForbidden:
  - beauty/docs/api/**
  - beauty/backend/**
  - beauty/web/**
abstractionsRequired: []
abstractionsMissing: []
---

# P1 — Pro walkthrough

## Scope

Rendre navigables les écrans pro manquants : `pro-agenda`, `pro-customers`, `pro-loyalty`, `pro-settings` (stubs mock acceptés).

## Inputs

- [navigation.md](../navigation.md) § Web pro
- Screens : [pro-agenda](../screens/pro/pro-agenda.screen.md), [pro-customers](../screens/pro/pro-customers.screen.md), [pro-loyalty](../screens/pro/pro-loyalty.screen.md), [pro-settings](../screens/pro/pro-settings.screen.md)
- [fixtures.md](../fixtures.md)

## Outputs

- Entrées menu depuis `manager-dashboard`
- Écrans stub avec données mock crédibles
- Mettre à jour [00-PROGRESS.md](../00-PROGRESS.md)

## Critères d'acceptation

- [ ] Dashboard → agenda, clients, fidélité, paramètres — chaque écran atteignable et retour OK
- [ ] Données cohérentes avec `mockManagerBookings` / salon session

## Out of scope

- Édition réelle / persistance backend
