---
id: PLT-43
status: done-agent
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
14/08 21:26  me · canvas validé
14/08 21:30  tsk3  split UI : nf-smart-import-doubt-lists dans data/tree/record-table ; bannière 2 compteurs ; fallback reclasse
14/08 21:30  preuve  doubt-natures.spec summarize 4/75 sans percent · reclassify 5/74
14/08 21:30  décision  pas de 4e table ; filtre NEEDS_REVIEW reste au grain ligne (pas un % fusionné)
14/08 21:32  spec · constat d'écart PLT-43 : LOT.md AC-5 inchangé. Canvas validé me. Deux natures API + 2 compteurs écran + reclasse. Dette : pas d'e2e du dialogue (il faut un extract). Pas de retour exec.
14/08 21:33  orch · QA PLT-47 pass → done-agent
```
