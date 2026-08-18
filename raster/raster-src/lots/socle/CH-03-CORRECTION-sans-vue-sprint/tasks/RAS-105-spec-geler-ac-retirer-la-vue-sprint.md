---
id: RAS-105
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [RAS-104]
tags: [raster, pact]
---

# SPEC + geler AC — retirer la vue Sprint

> 2 lignes max.

## Étapes

- [x] Relever nav, bouton, route, DTO dans `sources/web/`
- [x] Préciser AC-1…5 (chemins réels) dans `CH.md`
- [x] Patcher SPEC socle — Navigation / Vues générées / POL-VUES-GENEREES
- [x] Canvas chrome : plus de Sprint dans la nav
- [x] Rapport + `done-agent` + `index && check`

## Journal

```
16/08 14:28  posée
18/08 10:46  sprint → 2026-W34
18/08 10:58  status → doing
18/08 11:05  AC gelés · SPEC socle patchée · canvas chrome sans Sprint
18/08 11:00  status → done-agent · gate none → done-me
18/08 11:12  constat d'écart RAS-106 — écart : non · SPEC touchée : non · dette : non
             livré = SPEC (déjà patchée RAS-105) : nav Toi·En cours·Inbox·Backlog·Done agent · plus de ViewId sprint · plus de bouton → Sprint · plus de route commit-sprint · DTO / meta sans sprint
             e2e absence vu-rouge 4/4 puis suite socle 18/0 · AC-5 navigateur 4210 OK
             tranché pas de worktree : process, pas un écart de contrat
             tranché pastille backlog ôtée : le chrome ne parle plus d'engagement hebdomadaire — SPEC muette sur les pastilles, pas un patch
             tranché isoWeekInfo plus importé par le socle : technique, hors SPEC ; l'export work reste work (CH-04)
             CADRE / AGENTS.md hors périmètre (inbox existante) = pas une dette de livré
```

## Rapport de livraison

ce qui a changé      `pact/socle/CH-03-CORRECTION-sans-vue-sprint/CH.md` — AC-1…5 gelés sur `sources/web/src/{App,api}.tsx|.ts` et `server/raster-api.ts` · `pact/socle/SPEC.md` — Sprint retiré de Navigation, Vues générées, POL-VUES-GENEREES · canvas chrome + decision : plus de vue Sprint
critères prouvés     AC gelés pour RAS-106 — pas exécutés ici (tech, QA non obligatoire)
décidé seul          CADRE non touché (owns SPRINT + vocabulaire Sprint) — signalé inbox, pas de gate me · En cours ajouté à la Navigation SPEC (déjà vrai dans l'app, omis) · `/api/meta`.sprint rangé sous AC-4 avec le DTO · `api-delegue.test.mjs` (exige encore `setSprint`) = l'exec met à jour l'assertion, pas une nouvelle task
écarts / dette       constat RAS-106 : **non**. CADRE / AGENTS.md = hors périmètre (inbox existante), pas une dette de livré.
