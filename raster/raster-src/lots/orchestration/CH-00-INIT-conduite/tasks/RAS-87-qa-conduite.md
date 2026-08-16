---
id: RAS-87
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
blocked_by: [RAS-84, RAS-86]
tags: [raster, e2e]
---

# Preuves — conduite

> La fenêtre ne s'ouvre jamais toute seule.
> Couvre AC-1 → AC-5 de [`CH.md`](../../../../../pact/orchestration/CH-00-INIT-conduite/CH.md).

## Étapes

- [x] `raster/e2e/orchestration/roadmap-borne.test.mjs` — trois cas : borne au milieu, pas de marqueur, borne en tête
- [x] Vérifier qu'aucune règle d'`AGENTS.md` n'est recopiée dans le skill
- [x] Carte du CADRE à jour
- [x] Verdict + `done-agent` sur les tasks exec

## Journal

```
16/08  posée
16/08 13:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `e2e/orchestration/roadmap-borne.test.mjs` — 6 tests
critères prouvés     AC-2 trois cas de défaut fermé, tous verts · AC-3 relecture du skill : aucune règle recopiée, sept renvois · AC-5 Carte du CADRE porte `orchestration` · 21 tests verts au total avec ceux de `work`
décidé seul          j'ai testé la **tolérance** du marqueur (casse, espaces) en plus des trois cas du CH : un marqueur écrit à la main finira par varier, et une variation qui ferme la fenêtre par erreur serait un arrêt inexpliqué
écarts / dette       AC-1 et AC-4 sont prouvés par revue, pas par exécution — une SPEC et un fichier d'agent ne s'exécutent pas
