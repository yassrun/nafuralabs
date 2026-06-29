---
specVersion: 1
kind: screen
appId: beauty
screenId: entry
name: Choix d'audience (entrée)
status: stable
phase: P1
p1MobileId: entry
p1Impl: mock
platform: mobile
route: cold start
layout: public-layout
zone: account
roles: []
auth: public
flowRefs:
  - ../../flows/customer-onboarding.flow.md
---

# Choix d'audience (entrée)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `entry` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement. *(mobile only)*

## Intent

Écran d’accueil du **prototype mobile P1** : bifurcation **Client** / **Manager** avant discovery ou console pro mock. Sur le web (P2+), rôle assuré par [login.screen.md](login.screen.md) (`?role=pro`).

## Route et accès

- Mobile : cold start → `entry`
- Auth : public

## Actions

| CTA | Destination mobile |
|-----|-------------------|
| Client | `home` |
| Manager | `manager-login` → [pro-login](../pro/pro-login.screen.md) |

## Implémentation mobile P1

- Fichier : `mobile/src/App.tsx` → `EntryScreen`

## Critères d'acceptation P1

- [x] Deux boutons Client / Manager visibles
- [x] Manager → `manager-login`
