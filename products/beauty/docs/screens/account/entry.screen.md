---
specVersion: 1
kind: screen
appId: beauty
screenId: entry
name: Choix d'audience (entrée) — DÉPRÉCIÉ
status: deprecated
phase: P1
p1MobileId: entry
p1Impl: removed
platform: mobile
route: (retiré)
layout: public-layout
zone: account
roles: []
auth: public
---

# Choix d'audience (entrée) — DÉPRÉCIÉ

> **Retiré** — Les surfaces client et pro sont **séparées**. Voir [app-surfaces.md](../../app-surfaces.md).

## Remplacement

| Avant | Après |
|-------|-------|
| Cold start → `entry` → Client / Manager | Client : `npm run dev` → `home` |
| Manager depuis entry | Pro : `npm run dev:pro` → `manager-login` |
| Admin depuis entry | Admin : `npm run dev:admin` → `admin-overview` |

## Historique P1

Écran de bifurcation Client/Manager utilisé dans les premiers prototypes. Non conforme au standard marketplace — ne pas réimplémenter.
