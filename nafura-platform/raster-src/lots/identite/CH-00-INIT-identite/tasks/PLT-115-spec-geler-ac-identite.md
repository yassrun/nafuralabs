---
id: PLT-115
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [platform, identite]
sprint: 2026-W34
---

# SPEC + geler AC — identite

> Premier contrat du BC identite : SPEC depuis le code, AC gelés, coupe des jars.

## Étapes

- [x] Lire CADRE, socle, CH, jars identity / iam / settings / app-settings / user-settings
- [x] Écrire `pact/identite/SPEC.md` (vérité actuelle, coupe)
- [x] Canvas admin membres + copie preview
- [x] Geler `CH.md` (AC-n, scénarios e2e, POL)
- [x] Rapport

## Journal

```
16/08 14:15  posée
17/08 21:07  sprint → 2026-W34
17/08 21:09  status → doing
17/08 21:20  SPEC + CH gelé + canvas membres
17/08 21:14  status → done-agent · gate none → done-me
```

## Rapport de livraison

**ce qui a changé** — `pact/identite/SPEC.md` créée. `CH-00-INIT-identite/CH.md` gelé (AC + scénarios e2e). Canvas `pact/identite/ux/membres-tenant-wireframe.canvas.tsx`.

**critères gelés** — AC-1 SPEC + not_owns nommé · AC-2 coupe (iam in, pas de 2ᵉ lot iam, settings out) · AC-3 e2e `identite-*` · AC-4 lecteur · AC-5 pas de métier produit. Scénarios AC-3 : `identite-deux-tenants` · `identite-inviter-membre` · `identite-accepter-invitation` · `identite-retirer-membre` · `identite-frontiere-produit`.

**décidé seul** — settings / app-settings → not_owns (non spécifié). iam membres+invitation+organisation → owns. rôles custom + catalogue permissions → socle. domaines/features → not_owns (non spécifié). Keycloak/IdP + mot de passe → ops. courrier d'invitation → notification. user-settings : profil+session in ; préférences affichage out ; prefs notif → notification. canvas oui (admin membres). `P-IDENTITE-LIRE` / `P-IDENTITE-GERER` (alignés CH-07) ; pas d'inbox (CH-07 existe). Pas d'écran platform « accepter l'invitation » (vit chez le produit).

**écarts / dette** — matrice socle sans `P-IDENTITE-*` (CH-07). Capacités socle ne nomment pas identite (CH-07). Session : liste = courante, révoquer no-op. Feature flags IAM : no-op. Codes runtime OWNER/ADMIN/MEMBER vs catalogue Pact admin-tenant/utilisateur — traités comme textes opaques. `check` peut échouer sur SPEC manquantes hors identite.
