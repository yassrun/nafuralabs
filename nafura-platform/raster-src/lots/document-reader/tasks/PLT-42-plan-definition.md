---
id: PLT-42
status: done-agent
context: nafura
type: feature
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-41]
tags: [platform, documents, doc-extractor]
---

# Plan ↔ Definition

> Le plan cible un `dataSchema` : classes de lignes, hiérarchie (remplace « forme »), sortie plate ou arborescente.
> Couvre **AC-4** de [`LOT.md`](../LOT.md).

## Étapes

- [x] Lier `ReadingPlan` à `ExtractionDefinition` / `dataSchema` existant — sans migration de données
- [x] Trois points d’extension : classes de lignes (défaut = une) · hiérarchie (défaut = aucune) · validations métier (côté produit)
- [x] Import plat = configuration par défaut du cas complexe, pas une branche séparée

## Journal

```
14/08 19:52  spec · le spécifique est une donnée, pas une branche de code
14/08 19:55  orch · sprint 2026-W33
14/08 20:40  orch · PLT-41 done-agent (QA PLT-45) → PLT-42 doing
14/08 20:42  tsk1  ExtractionDefinition : arrayPaths + ancres/rowClasses/hierarchy/depivot ; arrayPath conservé
14/08 20:43  tsk2  DefinitionPlanBridge applique les défauts plats sur le ReadingPlan
14/08 20:44  preuve  PlanCascadeTest.flatImportIsDefaultComplexCase VERT · extraction-definition-defaults.spec 2/2 VERT
14/08 20:44  décision  handlers Sektor inchangés (arrayPath) — pas de migration
14/08 21:07  spec · constat d'écart PLT-42 : LOT.md inchangé. arrayPath conservé = pas de migration. Bridge + readingDefaults = import plat. Dette : hints définition pas encore poussés dans le POST extract (schéma suffit vague 1). Pas de retour exec.
```
