---
id: RAS-106
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
blocked_by: [RAS-105]
tags: [raster, ui]
---

# Retirer la vue, le bouton et la route

> 2 lignes max.

## Étapes

- [x] e2e d'absence vu-rouge (avant le retrait UI)
- [x] retirer vue / bouton / route / DTO sprint dans App.tsx · api.ts · raster-api.ts
- [x] mettre à jour l'assertion `setSprint` de api-delegue.test.mjs
- [x] suite `raster/e2e/socle/` verte · AC-5 navigateur

## Journal

```
16/08 14:28  posée
18/08 10:46  sprint → 2026-W34
18/08 11:03  status → doing
18/08 11:04  vu-rouge : node --test raster/e2e/socle/sans-vue-sprint.test.mjs → 4 fail / 0 pass
             AC-1 ViewId contient encore "sprint"
             AC-2 libellé → Sprint encore présent
             AC-3 route commit-sprint encore là
             AC-4 Task porte encore sprint
18/08 11:06  retrait : App.tsx (nav, panneau, isSprintRow, chrome, → Sprint, pastille) · api.ts (ViewId, Task, commitSprint, patch/meta) · raster-api.ts (stub setSprint, route, DTO, loadTasks, /api/meta) · api-delegue sans setSprint
18/08 11:07  e2e socle : 18 pass / 0 fail
18/08 11:08  AC-5 : http://127.0.0.1:4210 — nav Toi·En cours·Inbox·Backlog·Done agent · chrome « orchestrateur » sans semaine ISO · Backlog arbre lot→sous-lot→RAS-106 sans → Sprint · GET /api/meta sans sprint · 0 bouton Sprint
18/08 11:08  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `App.tsx` / `api.ts` / `raster-api.ts` : plus de vue Sprint, bouton « → Sprint », route `commit-sprint`, champ DTO · preuve `e2e/socle/sans-vue-sprint.test.mjs` · `api-delegue` n'exige plus `setSprint`
critères prouvés     AC-1…4 vu-rouge 4 fail / 0 pass puis suite socle 18/0 · AC-5 navigateur 4210 : nav sans Sprint, Backlog utilisable (arbre lot → sous-lot → task, sans bouton Sprint), `/api/meta` sans sprint
décidé seul          pas de worktree isolé — CH-04 déjà dans l'arbre d'intégration · pastille « backlog » ôtée avec `task.sprint` (engagement hebdo) · `isoWeekInfo` plus importé par le socle (reste exporté côté work)
écarts / dette       CADRE / AGENTS.md hors périmètre (inbox RAS-105) · canvas non touché
