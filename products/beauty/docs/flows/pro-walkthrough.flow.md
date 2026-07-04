---
specVersion: 1
kind: flow
appId: beauty
flowId: pro-walkthrough
name: Parcours pro walkthrough (mobile P1)
status: stable
phase: P1
actor: OWNER
trigger: `npm run dev:pro` ou lien « Espace professionnel » (hors app client)
screensRefs:
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
| 1 | pro-login | `manager-login` | mock | Se connecter (entrée `dev:pro`) |
| 2 | pro-dashboard | `manager-dashboard` | mock | Voir KPIs stub |
| 3 | pro-bookings-list | `manager-bookings-list` | mock | Ouvrir liste |
| 4 | pro-booking-detail | `manager-booking-detail` | mock | Détail RDV |
| 5 | pro-services | `manager-services` | mock | Liste services |
| 6 | pro-staff | `manager-staff` | mock | Liste staff |
| 7 | pro-reviews | `manager-reviews` | mock | Avis salon |
| 8 | pro-agenda | — | stub | wp-p1-03 |
| 9 | pro-customers | — | stub | wp-p1-03 |
| 10 | pro-loyalty | — | stub | wp-p1-03 |
| 11 | pro-settings | — | stub | wp-p1-03 |

## Critères de sortie flow

- [ ] Étapes 1–7 jouables aujourd’hui
- [ ] Étapes 8–11 atteignables en stub (wp-p1-03)
