---
id: RAS-80
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [RAS-79]
tags: [raster, cli]
---

# `t.mjs sprint` et `status`

> Le statut se pose par commande, et `done-me` ne se pose pas du tout.
> Couvre AC-3 · AC-5 de [`CH.md`](../../../../../pact/work/CH-02-EVOL-ecriture-et-readiness/CH.md).

## Étapes

- [x] `sprint <id> [--semaine]` — défaut = semaine ISO courante
- [x] `status <id> <statut>` — patch du frontmatter en place, corps intact
- [x] Refus de `done-me` : il résulte d'une approbation (`AGENTS.md` §0.1-8)
- [x] `approve <id>` — le seul chemin vers `done-me`, et seulement depuis `done-agent` + `gate: me`
- [x] `gate: none` + `done-agent` → bascule seule en `done-me`

## Journal

```
16/08  posée
16/08 13:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `write.mjs` — `setStatus`, `setSprint`, `approve`, patch du frontmatter en place, journal append-only
critères prouvés     AC-3 `status … done-me` refusé · `gate: none` + `done-agent` → `done-me` seul (RAS-88) · `gate: me` reste `done-agent` puis `approve` (RAS-89) · `approve` sur un `todo` refusé
décidé seul          `approve` est une commande à part, pas un `status done-me` déguisé — le seul chemin vers `done-me`, et il vérifie gate ET statut de départ · le journal est écrit par la commande, jamais par l'agent
écarts / dette       `isoWeekInfo` exporté depuis `regen.mjs` plutôt que dupliqué — mais il vit toujours dans le module des vues
