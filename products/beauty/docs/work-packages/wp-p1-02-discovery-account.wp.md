---
specVersion: 1
kind: work-package
appId: beauty
wpId: wp-p1-02
title: P1 — Discovery + compte (search, loyalty)
phase: P1
status: ready
wave: 1
dependsOn: [wp-p1-01]
filesAllowed:
  - beauty/mobile/src/App.tsx
  - beauty/mobile/src/App.css
  - beauty/mobile/src/prototypeData.ts
filesForbidden:
  - beauty/docs/api/**
  - beauty/backend/**
  - beauty/web/**
abstractionsRequired: []
abstractionsMissing: []
---

# P1 — Discovery + compte

## Scope

Compléter les écrans discovery/compte manquants ou partiels : `salon-search` (écran dédié ou route claire depuis home), `customer-loyalty`, enrichir `service-list` si écran séparé requis par [navigation.md](../navigation.md).

## Inputs

- [navigation.md](../navigation.md)
- [fixtures.md](../fixtures.md)
- Screens : [salon-search](../screens/discovery/salon-search.screen.md), [service-list](../screens/discovery/service-list.screen.md), [customer-loyalty](../screens/account/customer-loyalty.screen.md)

## Outputs

- Navigation vers écran search avec résultats filtrés
- Écran loyalty dédié `/me/loyalty` (points, historique stub)
- Mettre à jour [00-PROGRESS.md](../00-PROGRESS.md)

## Critères d'acceptation

- [ ] Depuis home : accès search → liste salons → salon-detail
- [ ] Depuis profil : accès loyalty screen
- [ ] États empty search documentés en UI (0 résultat)

## Out of scope

- `api/salons.api.md`, `api/loyalty.api.md` détaillés
