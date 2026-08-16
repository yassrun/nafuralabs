---
id: RAS-83
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
blocked_by: [RAS-82]
tags: [raster, e2e]
---

# Preuves — écriture et readiness

> Un test par commande, sur dépôt temporaire.
> Couvre AC-1 → AC-6 de [`CH.md`](../../../../../pact/work/CH-02-EVOL-ecriture-et-readiness/CH.md).

## Étapes

- [x] `raster/e2e/work/cli-new.test.mjs` — id alloué, refus sans écriture
- [x] `cli-status.test.mjs` — `done-me` refusé, `gate: none` bascule seul
- [x] `readiness.test.mjs` — graphe à deux sous-lots, dépendance croisée, `blocked` externe
- [x] `check` vert après chaque scénario
- [x] Verdict + `done-agent` sur les tasks exec

## Journal

```
16/08  posée
16/08 13:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `e2e/work/ecriture-refus.test.mjs` · `e2e/work/readiness.test.mjs` — 15 tests
critères prouvés     AC-1 refus + empreinte du dossier inchangée · AC-3 `done-me` refusé · AC-4 huit cas de readiness · AC-5 / AC-6 vérifiés en usage réel : neuf commandes d'écriture passées sur ce dépôt, `check` vert après
décidé seul          `computeReadiness` et `parseRoadmap` rendus **purs** pour être testables sans dépôt — les tests de refus, eux, tournent sur le vrai dépôt puisqu'ils n'écrivent rien
écarts / dette       pas de harnais « dépôt temporaire » pour les cas d'**écriture** : `write.mjs` fige `REPO_ROOT` à l'import. Il faudrait l'injecter. Le chemin heureux est donc prouvé à la main (RAS-88 → RAS-90), pas en test automatique.
