---
specVersion: 1
kind: screen
appId: layali
screenId: pro-login
name: Connexion manager (mobile)
status: stable
phase: P1
p1MobileId: pro-login
p1Impl: mock
implStatus: mock
platform: mobile
route: navigation interne depuis entry
layout: public-shell
zone: pro
roles: [PUBLIC]
auth: public
flowRefs:
  - ../../flows/pro-access.flow.md
---

# Connexion manager (mobile)

## P1 - Client Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `pro-login` |
| Impl | mock |
| Fixtures | [fixtures.md](../../fixtures.md) |
| Cartographie | [mobile-map.md](../../mobile-map.md) |

> En P1 : **ne pas** utiliser `apiRefs` / composants `@platform/` comme brief agent - mock local uniquement.


## Intent

Formulaire de connexion **manager** du prototype mobile. Équivalent simplifié de [login.screen.md](../account/login.screen.md) avec `audience=manager`, sans OTP en P1.

## Route et accès

- Entrée : [entry.screen.md](../account/entry.screen.md) → bouton Manager
- Sortie succès : `pro-dashboard` + `ManagerSession` mock
- Sortie échec : message inline (accepte tout email/mot de passe en P1)

## Implémentation mobile P1

- Fichier : `mobile/src/ManagerScreens.tsx` → `ProLoginScreen`
- `Screen` id : `pro-login`
- Session : `ManagerSession` dans `App.tsx`

## Équivalent web (P2+)

`/login?audience=manager&returnTo=/pro`

## Critères d'acceptation P1

- [x] Formulaire email / mot de passe mock
- [x] Redirection dashboard pro
