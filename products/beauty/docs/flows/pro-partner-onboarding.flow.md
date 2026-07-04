---
specVersion: 1
kind: flow
appId: beauty
flowId: pro-partner-onboarding
name: Onboarding partenaire salon (B2B)
status: stable
phase: P3
actor: OWNER
trigger: invitation Nafura ou formulaire « Ajouter mon salon » (V2)
screensRefs:
  - ../screens/pro/pro-login.screen.md
  - ../screens/pro/pro-dashboard.screen.md
  - ../screens/admin/admin-tenants.screen.md
apiRefs:
  - ../api/tenants-admin.api.md
  - ../api/auth.api.md
---

# Onboarding partenaire salon (B2B)

## Objectif

Intégrer un **nouveau salon** sur la plateforme Beauty — hors parcours client. Ce flow ne passe **pas** par l’app consumer.

## V1 (Maroc — manuel)

| # | Acteur | Action | Résultat |
|---|--------|--------|----------|
| 1 | Commercial Nafura | Collecte infos salon (nom, ville, ICE, owner) | Dossier |
| 2 | PLATFORM_ADMIN | Crée tenant via [admin-tenants](../screens/admin/admin-tenants.screen.md) | `POST /admin/tenants` |
| 3 | Système | Envoie email d’invitation owner → `pro.beauty.nafura.ma` | Lien magic / reset MDP |
| 4 | OWNER | Login pro, configure services / staff / horaires | Salon publiable |

## V2 (self-serve — hors scope V1)

Formulaire public « Référencer mon salon » → validation Nafura → activation.

## Hors scope

- Demande d’accès staff (`memberships`) : flow RH interne salon, pas onboarding partenaire.
- Module subscription ERP plateforme : remplacé par commission marketplace en UX pro.

## Critères d'acceptation V1

- [ ] Aucun écran client ne propose « créer un salon ».
- [ ] Un owner invité accède uniquement via la surface pro.
- [ ] Admin peut créer un tenant sans passer par l’app mobile client.
