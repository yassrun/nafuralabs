---
id: PLT-110
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [PLT-109]
tags: [platform, notification]
sprint: 2026-W34
---

# Baseline e2e notification

> 2 lignes max.

## Étapes

- [x] tsk1 JUnit `NotificationBaselineTest` (4 méthodes = 4 scénarios CH) dans le worktree
- [x] tsk2 Wrappers `e2e/notification/notification-*.test.mjs` + `_gradle.mjs`
- [x] tsk3 Preuve rouge (asserts contraires, 4/4 failed) puis inversion, 4/4 verts
- [x] tsk4 `node --test` des 4 wrappers — 4/4 pass

## Journal

```
16/08 14:15  posée
17/08 21:08  sprint → 2026-W34
17/08 21:15  status → doing
17/08 21:20  asserts contraires : gradle NotificationBaselineTest — 4 tests completed, 4 failed (deposerEtLister liste le message ; deuxTenants B vide ; marquerLue isRead true ; autreDestinataire Q vide)
17/08 21:21  asserts inversés : BUILD SUCCESSFUL ; node --test 4 wrappers — tests 4 pass 4 fail 0
17/08 21:23  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Baseline e2e `notification-*` dans le worktree : JUnit `NotificationBaselineTest` (send / list / countUnread / markRead, repo mock in-memory) + 4 wrappers `e2e/notification/` + `_gradle.mjs`. `src/main` intact.

critères prouvés     AC-3 → `node --test` 4/4 pass (cache XML JUnit vert) : `deposerEtLister` · `deuxTenants` · `marquerLue` · `autreDestinataire`.

décidé seul          Preuve via `NotificationServiceImpl` (pas HTTP) — pattern impression. Isolation B = même personne P, `TenantContext` seul changé. Titre/corps du dépôt : « Titre A » / « Corps A » — le CH nomme la forme, pas les chaînes. Chemin disque `ma/nafura/notification/` (package réel du jar).

écarts / dette       Pas d'e2e Brevo/push (`INV-3`). Pas d'e2e frontière jar (`CH-01-TECHNICAL-plier`). Pas de `testRuntimeOnly` launcher ajouté au `build.gradle` (Gradle 8.14 a exécuté sans).
