---
id: RAS-84
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [raster, pact, orchestration]
---

# SPEC du BC `orchestration`

> Le CADRE owns la conduite et la borne ; aucun BC ne les porte.
> Couvre AC-1 · AC-5 de [`CH.md`](../../../../../pact/orchestration/CH-00-INIT-conduite/CH.md).

## Étapes

- [x] `pact/orchestration/SPEC.md` — intention · owns / not_owns · données · règles
- [x] `not_owns` nomme `work` pour le contrat des tickets
- [x] Données : roadmap · borne · fenêtre · lançable
- [x] Carte du CADRE : troisième ligne `orchestration`

## Journal

```
16/08  posée
16/08 13:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/orchestration/SPEC.md` (neuf) · Carte du CADRE — troisième ligne
critères prouvés     AC-1 `not_owns` nomme `work` pour le contrat des tickets, la readiness, le promote et le sprint · AC-5 Carte à jour · `check` ne signale plus « SPEC.md manquant »
décidé seul          la readiness reste à **`work`** et non à `orchestration` : elle porte sur les tasks, pas sur la conduite. `orchestration` la **consomme**. Sinon `work` aurait un `blocked_by` qu'il ne sait pas interpréter.
écarts / dette       pas de canvas UX pour ce BC — il n'a pas d'écran propre, il alimente `socle`
