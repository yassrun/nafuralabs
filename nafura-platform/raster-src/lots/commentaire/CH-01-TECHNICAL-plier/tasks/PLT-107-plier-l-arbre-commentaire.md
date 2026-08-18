---
id: PLT-107
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-106]
tags: [platform, commentaire]
sprint: 2026-W34
---

# Plier l arbre commentaire

> 2 lignes max.

## Étapes

- [x] tsk1 — e2e `commentaire-plier-arbre` avant le move (vu-rouge)
- [x] tsk2 — déplacer backend `features/collaboration/comment` → `commentaire` + include `:platform:commentaire`
- [x] tsk3 — déplacer web `features/collaboration/comment` → `app/commentaire` (pas de shim)
- [x] tsk4 — consommateurs Gradle / import web qui nomment l'ancien chemin
- [x] tsk5 — e2e `_gradle.mjs` + ROOTS frontière ; suite `commentaire-*` verte

## Journal

```
16/08 14:15  posée
18/08 01:21  sprint → 2026-W34
18/08 01:26  status → doing
18/08 01:29  vu-rouge commentaire-plier-arbre : false !== true — nafura-platform/sources/backend/commentaire/build.gradle n'existe pas (avant move)
18/08 01:32  move backend+web ; include :platform:commentaire ; e2e Gradle :platform:commentaire:test
18/08 01:34  7/7 verts (6 CH-00 + plier-arbre)
18/08 01:35  status → done-agent · gate none → done-me
```

## Rapport de livraison

- **ce qui a changé** — backend `sources/backend/commentaire/` inclus `:platform:commentaire` ; web `sources/web/app/commentaire/` ; ancien `features/collaboration/comment` disparu (back + web, pas de shim). Consommateurs : notification `project(':platform:commentaire')`, Sektor `sub("comment", ":platform:commentaire")`, import `@platform/app/commentaire`.
- **critères prouvés** — AC-1,2,3,5 → `commentaire-plier-arbre` (vu-rouge puis vert). AC-4 → suite `commentaire-*` inchangée, 7/7 verts (`node --test` sur `e2e/commentaire/*.test.mjs`).
- **décidé seul** — mapping ops/lifecycle `'comment' → platform:commentaire` (même geste que documents/impression, sinon collectMigrations pointe un include mort). Imports relatifs web `../../../lib` / `../../../core` (un cran de moins). GAV `ma.nafuralabs:comment` inchangé ; substitution Sektor seulement.
- **écarts / dette** — packages Java `ma.nafura.comment/` vs FQCN inchangés (hors périmètre). Anatomy `lib/anatomy/.../comment-thread` non touché.
