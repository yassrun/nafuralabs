---
specVersion: 1
kind: screen
appId: layali
screenId: entry
name: Choix d'audience (entrée) — DÉPRÉCIÉ
status: deprecated
phase: P1
p1MobileId: entry
p1Impl: removed
platform: mobile
route: (retiré)
layout: public-shell
zone: account
roles: [PUBLIC]
auth: public
---

# Choix d'audience (entrée) — DÉPRÉCIÉ

> **Retiré** — Voir [app-surfaces.md](../../app-surfaces.md).

## Remplacement

| Avant | Après |
|-------|-------|
| Cold start → `entry` | Client : `#/` → `home` |
| Manager depuis entry | Pro : `#/pro/login` (`npm run dev:pro`) |

Ne pas réintroduire de bifurcation Client/Manager dans l’app cliente.
