---
id: PLT-42
status: todo
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

- [ ] Lier `ReadingPlan` à `ExtractionDefinition` / `dataSchema` existant — sans migration de données
- [ ] Trois points d’extension : classes de lignes (défaut = une) · hiérarchie (défaut = aucune) · validations métier (côté produit)
- [ ] Import plat = configuration par défaut du cas complexe, pas une branche séparée

## Journal

```
14/08 19:52  spec · le spécifique est une donnée, pas une branche de code
14/08 19:55  orch · sprint 2026-W33
```
