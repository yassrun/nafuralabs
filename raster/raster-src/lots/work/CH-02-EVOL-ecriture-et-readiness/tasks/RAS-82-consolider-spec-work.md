---
id: RAS-82
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [RAS-79, RAS-80, RAS-81]
tags: [raster, pact]
---

# Consolider `work/SPEC.md`

> Le BC gagne l'écriture et la readiness ; sa SPEC dit encore qu'il ne fait que lire.
> Couvre la consolidation SPEC exigée par un `EVOL`.

## Étapes

- [x] `owns` : + les commandes d'écriture, + la readiness dérivée
- [x] États : `done-me` n'est plus un statut posé — il résulte de l'approbation
- [x] Règles : ajouter « une task ne s'écrit que par le CLI »
- [x] Vérifier que rien ne contredit `AGENTS.md` §0.1-8 / §7

## Journal

```
16/08  posée
16/08 13:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/work/SPEC.md` — owns (+ écriture, + readiness) · not_owns (+ la conduite → `orchestration`) · États (`done-me` ne se pose plus) · R-6 à R-9
critères prouvés     revue : rien ne contredit `AGENTS.md` §0.1-8 ni §7 · le nouveau BC `orchestration` est nommé dans `not_owns`, donc la frontière est opposable
décidé seul          R-7 (refus n'écrit rien) et R-8 (id borné avant écriture) montent en **règle de SPEC** et pas seulement en test — ce sont des invariants du chemin d'écriture, pas des détails d'implémentation
écarts / dette       aucune
