---
id: PLT-113
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-112]
tags: [platform, notification]
---

# Plier l arbre notification

> 2 lignes max.

## Étapes

- [x] tsk1 — e2e `notification-plier-arbre` avant le move (vu-rouge)
- [x] tsk2 — déplacer backend `features/collaboration/notification` → `notification` + include `:platform:notification`
- [x] tsk3 — déplacer web `features/collaboration/notification` ET `features/notifications` → `app/notification` (pas de shim)
- [x] tsk4 — consommateurs Gradle / import web qui nomment l'ancien chemin
- [x] tsk5 — e2e `_gradle.mjs` + suite `notification-*` verte

## Journal

```
16/08 14:15  posée
18/08 10:19  sprint → 2026-W34
18/08 10:23  status → doing
18/08 10:24  vu-rouge notification-plier-arbre : false !== true — nafura-platform/sources/backend/notification/build.gradle n'existe pas (avant move)
18/08 10:25  move backend+web ; include :platform:notification ; e2e Gradle :platform:notification:test
18/08 10:27  5/5 verts (4 CH-00 + plier-arbre)
18/08 10:26  status → done-agent · gate none → done-me
```

## Rapport de livraison

- **ce qui a changé** — backend `sources/backend/notification/` inclus `:platform:notification` ; web `sources/web/app/notification/` (widgets + écran centre) ; anciens `features/collaboration/notification` et `features/notifications` disparus (pas de shim). Consommateurs : webhook `project(':platform:notification')`, lifecycle `'notification' → platform:notification`, Sektor `sub("notification", ":platform:notification")` + imports `@platform/app/notification`.
- **critères prouvés** — AC-1,2,3,5 → `notification-plier-arbre` (vu-rouge puis vert). AC-4 → suite `notification-*` inchangée, 5/5 verts (`node --test` sur `e2e/notification/*.test.mjs`).
- **décidé seul** — e2e CH-00 + `NotificationBaselineTest` absents de l'intégration : copiés depuis le worktree `CH-00-INIT-notification` (pas un merge). Écran centre posé à la racine de `app/notification/` (pas de sous-dossier — 6 fichiers, aucun collision de nom). Imports relatifs web `../../../../core` → `../../../core`. Mapping lifecycle `'notification' → platform:notification`. GAV `ma.nafuralabs:notification` inchangé.
- **écarts / dette** — packages Java `ma/nafura/notification/` vs FQCN inchangés (hors périmètre). `email-templates/`, anatomy send-email, alertes ERP produit non extraits.
