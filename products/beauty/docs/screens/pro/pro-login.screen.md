---
specVersion: 1
kind: screen
appId: beauty
screenId: pro-login
name: Connexion pro (surface séparée)
status: stable
phase: P1
p1MobileId: manager-login
p1Impl: mock
platform: mobile
route: /pro/login
layout: pro-layout (minimal)
zone: pro
roles: []
auth: public
flowRefs:
  - ../../flows/pro-walkthrough.flow.md
  - ../../flows/pro-partner-onboarding.flow.md
---

# Connexion pro (surface séparée)

## P1 - Pro Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `manager-login` |
| Entrée P1 | `npm run dev:pro` |
| Fixtures | [fixtures.md](../../fixtures.md) |

## Intent

Login **pro uniquement** (OWNER, ADMIN, STAFF). Entrée de la surface pro — **pas** accessible depuis un choix Client/Manager dans l’app cliente.

## Route et accès

- Web : `/pro/login?redirect=...`
- Mobile P1 : `?app=pro` ou `npm run dev:pro`
- Succès : `manager-dashboard`

## Critères d'acceptation

- [ ] Formulaire direct (email + mot de passe), sans choix d’audience.
- [ ] Pas de lien « Je suis client » vers l’app consumer.
- [ ] Session mock `ManagerSession` avec salon fixe.
