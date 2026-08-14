---
id: PLT-43
status: doing
context: nafura
type: feature
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-42]
tags: [platform, documents, doc-extractor, ux]
---

# Carte des doutes

> Deux natures, jamais fusionnées. Canvas UX dans `ux/` avant l’écran. On signale, on ne répare pas le fichier.
> Couvre **AC-5** de [`LOT.md`](../LOT.md).

## Étapes

- [x] Canvas `ux/` : deux zones distinctes (doute d’extraction ≠ manque de la source) — valider avant le code UI
- [x] Contrat d’API : les deux natures voyagent séparées ; les validations métier contribuent des doutes
- [x] Recenser `smart-import-data-table` / `smart-import-tree-table` avant d’en dessiner de nouveaux

## Journal

```
14/08 19:52  spec · mélanger les natures annonce un % alarmant et faux (Villa Kenitra)
14/08 19:55  orch · sprint 2026-W33
14/08 21:15  tsk1  canvas ux/carte-des-doutes-wireframe — 2 zones, inventaire 3 tables, fallback manuel. Attente validation me avant split UI
14/08 21:16  tsk2  FieldIssueDto.nature + DoubtNature.fromKind ; TS partitionDoubts
14/08 21:16  preuve  SchemaValidatorTest natures · doubt-natures.spec (4 vs 75, pas 39 %)
14/08 21:18  décision  payload vide = EXTRACTION (on n’a rien lu), pas SOURCE_GAP
```
