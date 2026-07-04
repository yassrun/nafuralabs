---
specVersion: 1
kind: flow
appId: layali
flowId: pro-partner-onboarding
name: Onboarding partenaire venue (B2B)
status: stable
phase: P3
actor: OWNER
trigger: invitation Nafura ou formulaire « Référencer mon établissement » (V2)
screensRefs:
  - ../screens/pro/pro-login.screen.md
  - ../screens/pro/pro-dashboard.screen.md
  - ../screens/admin/admin-tenants.screen.md
apiRefs:
  - ../api/tenants-admin.api.md
  - ../api/auth.api.md
  - ../api/memberships.api.md
---

# Onboarding partenaire venue (B2B)

## Objectif

Référencer un **nouveau venue** sur Layali — distinct du parcours client et distinct de la **demande d’accès staff** (`pro-membership-request`).

## V1 (Maroc — manuel)

| # | Acteur | Action | Résultat |
|---|--------|--------|----------|
| 1 | Commercial Nafura | Qualifie le lieu (type, ville, capacité) | Dossier |
| 2 | PLATFORM_ADMIN | Crée tenant + venue via admin | Tenant actif |
| 3 | Système | Invitation OWNER → `<slug>.pro.layali.ma` | Accès pro |
| 4 | OWNER | Configure venue, events, plan de salle | Publiable |

## Distinction memberships

| Flow | Cas d’usage |
|------|-------------|
| **pro-partner-onboarding** (ce doc) | Nouveau venue sur la plateforme |
| **pro-membership-request** | Staff / manager rejoint un venue **existant** |

## Critères d'acceptation V1

- [ ] Pas de « Créer mon club » dans l’app client.
- [ ] `pro-access-request` réservé au staff, pas aux nouveaux partenaires.
- [ ] Entrée pro uniquement via surface dédiée.
