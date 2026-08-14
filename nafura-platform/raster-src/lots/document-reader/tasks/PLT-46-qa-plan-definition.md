---
id: PLT-46
status: done-agent
context: nafura
type: qa
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-42]
tags: [platform, documents, doc-extractor]
---

# QA — Plan ↔ Definition

> Preuves de PLT-42 contre [`LOT.md`](../LOT.md) **AC-4**.

## Étapes

- [x] Exécuter les preuves existantes
- [x] Relier AC-4 à un pass/fail
- [x] Rapport de livraison

## Journal

```
14/08 21:07  orch · QA après constat d'écart PLT-42
14/08 21:09  preuve  PlanCascadeTest --rerun-tasks VERT
14/08 21:09  preuve  extraction-definition-defaults.spec 2/2 VERT
```

## Rapport de livraison

ce qui a changé      `ExtractionDefinition` déclare arrayPaths / ancres / classes / hiérarchie / dépivotage. `arrayPath` conservé. `DefinitionPlanBridge` pose les défauts plats.
critères prouvés     AC-4 → 0 `DpgfNoeud` dans platform/sources · 0 `LayoutFingerprint` dans sektor/sources · import plat = une classe `record` + `NONE` (PlanCascadeTest + spec 2/2)
décidé seul          handlers Sektor non migrés (arrayPath) — volontaire, pas un trou AC-4
écarts / dette       hints définition pas dans le POST extract · PLT-43 / PLT-44
