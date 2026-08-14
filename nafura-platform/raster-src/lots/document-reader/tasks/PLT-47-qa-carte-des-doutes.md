---
id: PLT-47
status: done-agent
context: nafura
type: qa
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-43]
tags: [platform, documents, doc-extractor, ux]
---

# QA — Carte des doutes

> Preuves de PLT-43 contre [`LOT.md`](../LOT.md) **AC-5**.

## Étapes

- [x] Exécuter les preuves existantes
- [x] Relier AC-5 à un pass/fail
- [x] Rapport de livraison

## Journal

```
14/08 21:32  orch · QA après constat d'écart PLT-43
14/08 21:32  preuve  doubt-natures.spec 3/3 VERT (4 vs 75, pas de percent, reclasse 5/74)
14/08 21:32  preuve  SchemaValidatorTest VERT (MISSING_REQUIRED → SOURCE_GAP · JSON illisible → EXTRACTION)
```

## Rapport de livraison

ce qui a changé      Bannière 2 compteurs + `nf-smart-import-doubt-lists` dans data/tree/record-table. Reclasse manuelle. Pas de 4e table.
critères prouvés     AC-5 → doubt-natures.spec (extraction 4 / sourceGap 75, champ `percent` absent) · SchemaValidatorTest natures
décidé seul          Mode B non rejoué (pas d'extract live). Filtre NEEDS_REVIEW au grain ligne = pas un % fusionné — hors fail AC-5.
écarts / dette       pas d'e2e du dialogue de revue · PLT-44
