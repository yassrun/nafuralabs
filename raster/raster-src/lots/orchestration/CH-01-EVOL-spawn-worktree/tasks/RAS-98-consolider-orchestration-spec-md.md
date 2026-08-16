---
id: RAS-98
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
tags: [raster, pact]
---

# Consolider orchestration/SPEC.md

> 2 lignes max.

## Étapes

- [x] Ce que ça fait : isoler, lancer
- [x] Données : worktree, lot tenu, commande d'agent
- [x] R-3 à R-6

## Journal

```
16/08 13:45  posée
16/08 13:57  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/orchestration/SPEC.md` — 2 capacités, 3 données, 4 règles
critères prouvés     revue : chaque règle est opposable et testée · R-4 (défaut fermé) et R-6 (longpaths par commande) ont chacune leur test
décidé seul          R-6 monte en **règle de SPEC** alors que c'est un détail Windows : la contrainte n'est pas le drapeau, c'est « ne pas modifier la config du dépôt ni le système pour se dépanner ». Ça, c'est durable.
écarts / dette       le merge reste hors SPEC — décrit dans `AGENTS.md` §7, pas encore un contrat
