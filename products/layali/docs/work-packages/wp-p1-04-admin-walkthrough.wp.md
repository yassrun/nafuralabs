---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-p1-04
title: P1 — Admin walkthrough stub
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

# P1 — Admin walkthrough stub

## Scope

Ajouter zone **admin plateforme** en stub mobile : entry « Admin Nafura » + 3 écrans [admin-overview](../screens/admin/admin-overview.screen.md), [admin-tenants](../screens/admin/admin-tenants.screen.md), [admin-tenant-detail](../screens/admin/admin-tenant-detail.screen.md).

## Inputs

- [navigation.md](../navigation.md) § Admin
- [fixtures.md](../fixtures.md) — liste tenants mock (venues nightlife)

## Outputs

- Bouton sur `entry` (ou mode caché) → admin flow
- 3 écrans stub + fixtures tenants
- Mettre à jour [00-PROGRESS.md](../00-PROGRESS.md)

## Critères d'acceptation

- [ ] entry → admin overview → tenants list → tenant detail
- [ ] Données mock : 2–3 venues tenants
- [ ] Pas d'API réelle

## Out of scope

- `api/tenants-admin.api.md` détaillé
- Web admin Angular (P2)
