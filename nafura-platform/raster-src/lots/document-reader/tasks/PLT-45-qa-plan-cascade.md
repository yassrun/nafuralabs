---

id: PLT-45
status: done-me
context: nafura
type: qa
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-41]
tags: [platform, documents, doc-extractor]
---

# QA — Plan, cascade, cache

> Preuves de PLT-41 contre [`LOT.md`](../LOT.md) **AC-6** (et non-régression AC-1 · AC-4).

## Étapes

- [x] Exécuter les preuves existantes (pas en écrire)
- [x] Relier chaque AC de la slice à un pass/fail exécuté
- [x] Rapport de livraison

## Journal

```
14/08 20:36  orch · QA après constat d'écart PLT-41
14/08 20:38  preuve  :doc-extractor:test --rerun-tasks VERT
14/08 20:39  preuve  :etudes:test grid + orchestrator + adapter VERT
```

## Rapport de livraison

ce qui a changé      Lecture grille + `ReadingPlan` / cascade / cache tenant dans `doc-extractor`. LLM données seulement sans grille (CSV, scan).
critères prouvés     AC-6 → `StatelessExtractionServiceTest` (xlsx heuristique 0 LLM · compile sans valeurs de lignes · `PLAN_UNRESOLVED` sans aplatir · CSV objet encore LLM) · AC-1 → `GridBordereauPipelineTest` + orchestrateur VERT · AC-4 → 0 `DpgfNoeud` dans doc-extractor · 0 `LayoutFingerprint` dans sektor
décidé seul          AC-1 chiffré 703/4 = pipeline existant (186 articles BDP-2-17 dans `GridBordereauPipelineTest`), pas un compteur 703 automatisé — écart déjà noté PLT-39, pas un fail de cette slice. AC-2 et AC-5 hors PLT-41 (PLT-44 / PLT-43).
écarts / dette       `arrayPath` front encore singulier (PLT-42) · carte des doutes (PLT-43) · bascule écrans (PLT-44)
