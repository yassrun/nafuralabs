---
specVersion: 1
kind: screen
appId: layali
screenId: pro-login
name: Connexion pro (surface séparée)
status: stable
phase: P1
p1MobileId: pro-login
p1Impl: mock
platform: mobile
route: /pro/login
layout: pro-shell (minimal)
zone: pro
roles: [PUBLIC]
auth: public
flowRefs:
  - ../../flows/pro-access.flow.md
  - ../../flows/pro-walkthrough.flow.md
---

# Connexion pro (surface séparée)

## P1 - Pro Walkthrough

| Champ | Valeur |
|-------|--------|
| Mobile `Screen` | `pro-login` |
| Entrée P1 | `npm run dev:pro` → `#/pro/login` |
| Fixtures | [fixtures.md](../../fixtures.md) |

## Intent

Formulaire de connexion **manager / staff** — surface pro uniquement. Équivalent web : `/pro/login` (pas de paramètre `audience` sur `/login` client).

## Route et accès

- Entrée : URL pro dédiée (`#/pro/login` mobile, `<slug>.pro.layali.ma` web)
- Succès : `pro-dashboard` (ou `pro-door` si HOST)
- Pas de re-choix Client/Manager

## Critères d'acceptation P1

- [ ] Formulaire email/mot de passe direct
- [ ] Emails mock : `owner@sky31.ma`, `host@example.ma`, `noaccess@test.ma`, `suspended@...`
- [ ] Pas de bifurcation audience
