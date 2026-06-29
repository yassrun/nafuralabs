---
specVersion: 1
kind: flow
appId: beauty
flowId: pro-walkthrough
name: Parcours pro walkthrough (mobile P1)
status: stable
phase: P1
actor: OWNER
trigger: bouton Manager sur entry ou manager-login
screensRefs:
  - ../screens/account/entry.screen.md
  - ../screens/pro/pro-login.screen.md
  - ../screens/pro/pro-dashboard.screen.md
  - ../screens/pro/pro-bookings-list.screen.md
  - ../screens/pro/pro-booking-detail.screen.md
  - ../screens/pro/pro-agenda.screen.md
  - ../screens/pro/pro-services.screen.md
  - ../screens/pro/pro-staff.screen.md
  - ../screens/pro/pro-customers.screen.md
  - ../screens/pro/pro-reviews.screen.md
  - ../screens/pro/pro-loyalty.screen.md
  - ../screens/pro/pro-settings.screen.md
---

# Parcours pro walkthrough (mobile P1)

> **P1 walkthrough :** données = [fixtures.md](../fixtures.md). Pas d’API HTTP. Colonnes API = **P3** uniquement.

## Objectif

Démontrer la console pro salon en mock : dashboard, réservations, services, staff, avis — plus stubs agenda, clients, fidélité, paramètres (wp-p1-03).

## Acteur

- Persona : OWNER (`fatima@silhouettebeauty.ma` ou tout couple email/password mock)

## Étapes (gate P1)

| # | Écran spec | Mobile id | Impl cible | Action |
|---|------------|-----------|------------|--------|
| 1 | entry | `entry` | mock | Choisir Manager |
| 2 | pro-login | `manager-login` | mock | Se connecter |
| 3 | pro-dashboard | `manager-dashboard` | mock | Voir KPIs stub |
| 4 | pro-bookings-list | `manager-bookings-list` | mock | Ouvrir liste |
| 5 | pro-booking-detail | `manager-booking-detail` | mock | Détail RDV |
| 6 | pro-services | `manager-services` | mock | Liste services |
| 7 | pro-staff | `manager-staff` | mock | Liste staff |
| 8 | pro-reviews | `manager-reviews` | mock | Avis salon |
| 9 | pro-agenda | — | stub | wp-p1-03 |
| 10 | pro-customers | — | stub | wp-p1-03 |
| 11 | pro-loyalty | — | stub | wp-p1-03 |
| 12 | pro-settings | — | stub | wp-p1-03 |

## Critères de sortie flow

- [ ] Étapes 1–8 jouables aujourd’hui
- [ ] Étapes 9–12 atteignables en stub (wp-p1-03)
