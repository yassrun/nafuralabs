---
id: RAS-95
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [raster, git]
---

# Worktree par sous-lot, hors depot

> Une branche n'isole pas : deux agents dans un meme repertoire s'ecrasent.

## Étapes

- [x] `worktree.mjs` — add / list / rm, idempotent
- [x] Refus de tout emplacement dans le dépôt
- [x] `core.longpaths` passé par commande
- [x] `t.mjs worktree list|add|rm`

## Journal

```
16/08 13:45  posée
16/08 13:57  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `raster/worktree.mjs` (neuf) · `t.mjs worktree list|add|rm`
critères prouvés     AC-1 quatre tests : chemin par défaut hors dépôt, refus d'un emplacement dedans, `insideRepo` ne confond pas la racine avec son intérieur · worktree réel créé sur `socle/CH-01`, idempotent au second appel
décidé seul          le drapeau `core.longpaths=true` est passé **par invocation** et non posé en config : Windows coupe à 260 caractères et `git worktree add` échouait à mi-checkout en laissant un worktree cassé. Poser la config du dépôt ou toucher aux réglages Windows aurait dépassé le périmètre.
écarts / dette       `worktree rm` garde la branche — voulu, elle porte le travail — mais rien ne nettoie les branches mortes
