---
specVersion: 1
kind: work-package
appId: layali
wpId: wp-p1-02
title: P1 — Tickets compte + membership pro (écrans manquants)
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

# P1 — Tickets compte + membership pro

## Scope

Compléter le walkthrough client et pro membership :

1. [customer-tickets](../screens/account/customer-tickets.screen.md) — cible web ; P1 mobile : compléter [my-accesses](../screens/account/my-accesses.screen.md) + lien post-achat
2. Flows [pro-membership-request](../flows/pro-membership-request.flow.md) et [pro-membership-review](../flows/pro-membership-review.flow.md) :
   - [pro-no-access](../screens/pro/pro-no-access.screen.md)
   - [pro-access-request](../screens/pro/pro-access-request.screen.md) (formulaire)
   - branchement vers `pro-access-requests` côté OWNER

Le flow [customer-ticket-purchase](../flows/customer-ticket-purchase.flow.md) est déjà mock — vérifier lien vers `customer-tickets` après achat.

## Inputs

- [fixtures.md](../fixtures.md)
- [navigation.md](../navigation.md)

## Outputs

- Écran `customer-tickets` + fixtures billets historiques
- Écrans no-access + access-request + navigation pro-login
- Mettre à jour [00-PROGRESS.md](../00-PROGRESS.md)

## Critères d'acceptation

- [ ] Achat billet → visible dans `/me/tickets` (ou équivalent hash)
- [ ] Utilisateur sans membership → no-access → formulaire → message succès mock
- [ ] OWNER voit demande dans access-requests et peut approuver
- [ ] Pas d'API réelle

## Out of scope

- `api/memberships.api.md` détaillé (P3)
