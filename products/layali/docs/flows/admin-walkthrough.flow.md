---
specVersion: 1
kind: flow
appId: layali
flowId: admin-walkthrough
name: Admin plateforme walkthrough stub (P1)
status: stable
phase: P1
actor: PLATFORM_ADMIN
trigger: entrée Admin depuis entry (stub P1)
screensRefs:
  - ../screens/admin/admin-overview.screen.md
  - ../screens/admin/admin-tenants.screen.md
  - ../screens/admin/admin-tenant-detail.screen.md
---

# Admin plateforme walkthrough stub (P1)

> **P1 walkthrough :** [fixtures.md](../fixtures.md) § Admin. wp-p1-04.

## Objectif

Naviguer admin Nafura stub : overview → tenants nightlife → détail venue (approve/suspend mock).

## Étapes (gate P1)

| # | Écran | Mobile id | Impl cible |
|---|-------|-----------|------------|
| 1 | admin-overview | — | wp-p1-04 |
| 2 | admin-tenants | — | wp-p1-04 |
| 3 | admin-tenant-detail | — | wp-p1-04 |

## Critères de sortie flow

- [ ] entry → admin → tenants → détail
- [ ] 2–3 tenants mock Casablanca
