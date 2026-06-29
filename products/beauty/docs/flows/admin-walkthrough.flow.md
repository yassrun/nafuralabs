---
specVersion: 1
kind: flow
appId: beauty
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

> **P1 walkthrough :** fixtures tenants mock — [fixtures.md](../fixtures.md). Pas d’API. wp-p1-04.

## Objectif

Naviguer le stub admin Nafura : overview → liste salons tenants → détail tenant (actions mock suspend/approve).

## Étapes (gate P1)

| # | Écran | Mobile id | Impl cible |
|---|-------|-----------|------------|
| 1 | admin-overview | — | stub wp-p1-04 |
| 2 | admin-tenants | — | stub wp-p1-04 |
| 3 | admin-tenant-detail | — | stub wp-p1-04 |

## Données mock

- 2–3 salons tenants (Casablanca) — voir [fixtures.md](../fixtures.md) § Admin

## Critères de sortie flow

- [ ] entry → admin → tenants → détail navigable
- [ ] `npm run build` vert
