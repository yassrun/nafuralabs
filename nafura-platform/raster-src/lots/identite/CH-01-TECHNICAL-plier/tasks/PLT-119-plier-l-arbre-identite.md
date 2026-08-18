---
id: PLT-119
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-118]
tags: [platform, identite]
---

# Plier l arbre identite

> 2 lignes max.

## Étapes

- [x] tsk1 — e2e `identite-plier-arbre` avant le move (vu-rouge)
- [x] tsk2 — déplacer backend `core/identity` → `identite/identity` et `features/administration/iam` → `identite/iam` + includes `:platform:identite:identity` · `:platform:identite:iam`
- [x] tsk3 — déplacer web `features/administration/iam/members` → `app/identite` (pas de shim)
- [x] tsk4 — consommateurs Gradle / import web qui nomment l'ancien chemin
- [x] tsk5 — e2e `_gradle.mjs` + ROOTS frontière ; suite `identite-*` verte

## Journal

```
16/08 14:15  posée
18/08 10:27  sprint → 2026-W34
18/08 10:28  status → doing
18/08 10:30  vu-rouge identite-plier-arbre : false !== true — nafura-platform/sources/backend/identite/identity/build.gradle n'existe pas (avant move)
18/08 10:33  move backend identity+iam + web members ; includes :platform:identite:identity · :platform:identite:iam ; e2e Gradle :platform:identite:iam:test
18/08 10:37  6/6 verts (5 CH-00 + plier-arbre) — gradle :platform:identite:iam:test réel après purge du build/
18/08 10:34  status → done-agent · gate none → done-me
```

## Rapport de livraison

- **ce qui a changé** — backend `sources/backend/identite/identity/` inclus `:platform:identite:identity` et `identite/iam/` inclus `:platform:identite:iam` ; web `sources/web/app/identite/` (membres) ; anciens `core/identity`, `features/administration/iam` (back) et `iam/members` (web) disparus (pas de shim). Consommateurs : authorization / user-settings / notification `project(':platform:identite:identity')`, Sektor `sub("identity"/"iam")`, shell `administration.routes.ts` + rôles repointent `app/identite`.
- **critères prouvés** — AC-1,2,3,5 → `identite-plier-arbre` (vu-rouge puis vert). AC-4 → suite `identite-*` inchangée, 6/6 verts (`node --test` sur `e2e/identite/*.test.mjs` ; JUnit via `:platform:identite:iam:test` après purge `build/`).
- **décidé seul** — `includePlatform` (projectDir = `identite/identity` · `identite/iam`). Mapping lifecycle `'identity' → platform:identite:identity` · `'iam' → platform:identite:iam` + rangs SQL identity=10 / iam=35 (même geste que commentaire/notification). GAV `ma.nafuralabs:identity` / `iam` inchangés. `iam/roles/` et shell restent hors arbre.
- **écarts / dette** — packages Java `ma/nafura/core/` vs FQCN inchangés (hors périmètre). Rôles custom / domaines restent dans le jar iam. settings / app-settings / user-settings non déplacés.
