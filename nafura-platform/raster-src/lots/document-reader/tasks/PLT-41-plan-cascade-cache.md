---
id: PLT-41
status: done-agent
context: nafura
type: feature
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-39, PLT-40]
tags: [platform, documents, doc-extractor]
---

# Plan, cascade, cache

> `ReadingPlan` typé (ancres vides + grille), `PlanResolver` 4 paliers, un `PlanValidator`, `PlanCache` par empreinte de trame.
> Couvre **AC-6** de [`LOT.md`](../LOT.md). Cache **par tenant** (O1, PLT-40).

## Étapes

- [x] Introduire `ReadingPlan` : source, ancres (déclarées vides), colonnes, classes de lignes, hiérarchie, dépivotage nommé non résolu
- [x] `arrayPaths` au pluriel dès ce contrat — objet à la racine, toujours
- [x] Cascade `heuristique → cache → ia compile → vision` ; un seul validateur entre chaque palier et le plan retenu
- [x] Replier `StatelessExtractionService` en paliers 3 et 4 — ne plus aplatir en texte quand une grille existe
- [x] Cache par empreinte de trame, **par tenant** — jamais mutualisé

## Journal

```
14/08 19:52  spec · jamais de code généré · l'IA ne touche pas les données
14/08 19:55  orch · sprint 2026-W33
14/08 19:57  orch · O1 = par tenant (PLT-40 done-agent)
14/08 20:10  tsk1  ReadingPlan + validator + cache tenant + empreinte sans row count
14/08 20:20  tsk2  cascade heuristique→cache ; IA/vision compilent un plan (en-têtes), exécution grille
14/08 20:25  tsk3  StatelessExtractionService : grille existante → pas d'aplatissement ; CSV sans grille = LLM (AC-6)
14/08 20:26  WIP perdu au rebase SEKTOR-105 ; récupéré stash@{1} sur staging
14/08 20:28  preuve  :doc-extractor:test VERT ; :etudes:test grid+orchestrator VERT
14/08 20:28  décision  heuristique = match d'en-têtes seulement (pas positionnel) ; CSV reste hors sonde (AC-6)
14/08 20:36  spec · constat d'écart PLT-41 : LOT.md inchangé. Livré = contrat (plan typé, cascade, cache tenant, pas d'aplatissement si grille). Dette hors slice : arrayPath front encore singulier (PLT-42) · carte des doutes (PLT-43) · bascule écrans (PLT-44). Pas de retour exec.
```

## Rapport de livraison

ce qui a changé      `ReadingPlan` + cascade + cache tenant dans `doc-extractor`. Grille exécutée sans aplatir.
critères prouvés     voir PLT-45
décidé seul          voir journal PLT-41
écarts / dette       voir PLT-45

