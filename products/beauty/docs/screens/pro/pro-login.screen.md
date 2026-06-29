---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-login
name: Connexion manager (mobile)
status: stable
phase: P1
p1MobileId: manager-login
p1Impl: mock
platform: mobile
route: navigation interne depuis entry
layout: public-layout
zone: pro
roles: []
auth: public
flowRefs:
  - ../../flows/pro-walkthrough.flow.md
---

# Connexion manager (mobile)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `manager-login` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(id code manager-login)*

## Intent

Connexion **manager / pro** mock depuis [entry.screen.md](../account/entry.screen.md). Accepte tout email/mot de passe ; session `ManagerSession` avec salon mock.

## Route et accès

- Entrée : `entry` → Manager
- Succès : `manager-dashboard` ([pro-dashboard](pro-dashboard.screen.md))
- Web P2+ : `/login?role=pro`

## Implémentation mobile P1

- Fichier : `mobile/src/ManagerScreens.tsx` → `ManagerLoginScreen`
- `Screen` id code : `manager-login` (spec id : `pro-login`)

## Critères d'acceptation P1

- [x] Login mock → dashboard pro
- [x] Retour vers `entry`
