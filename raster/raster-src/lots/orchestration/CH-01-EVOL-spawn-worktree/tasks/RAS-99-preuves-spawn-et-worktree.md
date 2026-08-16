---
id: RAS-99
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
tags: [raster, e2e]
---

# Preuves spawn et worktree

> 2 lignes max.

## Étapes

- [x] `e2e/orchestration/spawn-worktree.test.mjs` — 10 tests
- [x] Vérifications live pour ce qui exige un vrai worktree
- [x] Suite complète verte
- [x] Verdict

## Journal

```
16/08 13:45  posée
16/08 13:57  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `e2e/orchestration/spawn-worktree.test.mjs` — 10 tests. Suite complète : **53 verts**.
critères prouvés     AC-1 · AC-2 · AC-4 · AC-6 automatisés · AC-3 et AC-5 vérifiés en direct dans un processus unique (double lancement refusé, lot libéré à la sortie) · lancement réel bout en bout par HTTP
décidé seul          AC-3 et AC-5 ne sont **pas** automatisés : ils exigent un vrai worktree, soit un checkout de 6 775 fichiers par exécution. Le coût dépasse la valeur dans une suite qu'on veut lancer souvent. C'est écrit en tête du fichier de test plutôt que caché.
écarts / dette       mon premier test AC-6 attrapait `Array.push` et son propre commentaire — corrigé pour viser les verbes git, avec une assertion qui échoue si plus aucune invocation git n'est détectée, sinon le test ne prouverait rien
