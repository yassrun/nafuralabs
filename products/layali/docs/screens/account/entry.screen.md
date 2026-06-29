---
specVersion: 1
kind: screen
appId: layali
screenId: entry
name: Choix d'audience (entrée)
status: stable
phase: P1
p1MobileId: entry
p1Impl: mock
implStatus: mock
platform: mobile
route: "#/" (cold start)
layout: public-shell
zone: account
roles: [PUBLIC]
auth: public
flowRefs:
  - ../../flows/pro-access.flow.md
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

Écran d’accueil du **prototype mobile P1** : bifurcation explicite **Client** / **Manager** avant discovery ou connexion pro. Sur le web (P2+), ce rôle est assuré par [login.screen.md](login.screen.md) (`?audience=customer|manager`).

## Route et accès

- Route mobile : cold start → `entry` puis navigation état
- Layout : plein écran, sans chrome pro
- Auth : public

## Actions

| CTA | Destination mobile | Équivalent web |
|-----|-------------------|----------------|
| Client | `home` | `/` |
| Manager | `pro-login` | `/login?audience=manager` |

## Implémentation mobile P1

- Fichier : `mobile/src/App.tsx` → `EntryScreen`
- `Screen` id : `entry`
- Données : statique (pas d’API)

## Critères d'acceptation P1

- [x] Deux boutons visibles Client / Manager
- [x] Manager → `pro-login` → session mock
