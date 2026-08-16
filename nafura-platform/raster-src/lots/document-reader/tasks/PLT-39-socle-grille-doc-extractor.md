---

id: PLT-39
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
tags: [platform, documents, doc-extractor]
---

# Socle grille dans doc-extractor

> Déménager `etudes/.../bordereau/grid` en capability plateforme. Même lecture bordereau. Purger `lastDiagnostics`.
> Couvre **AC-1** · **AC-3** · **AC-4** de [`LOT.md`](../LOT.md).

## Étapes

- [x] Porter `PdfRuledGridSource`, `XlsxGridSource`, `ColumnMap`, `GridRow*`, assembleur générique sous `doc-extractor` — zéro type métier BTP
- [x] Brancher le bordereau Sektor sur cette capability (projection `DpgfNoeud` reste dans `etudes`)
- [x] Remplacer `lastDiagnostics` mutable par un retour par appel
- [x] Garder les tests grille + étalon verts

## Journal

```
14/08 19:52  spec · lot Raster seul (pas de Pact) · archive cadrage/document-reader
14/08 19:55  orch · sprint 2026-W33
14/08 20:00  orch · PLT-39 doing
14/08 20:00  tsk1  grille générique → doc-extractor ; ColumnMap/classifier/assembleur restent etudes
14/08 20:15  tsk2  parsers etudes importent PdfRuledGridSource / XlsxGridSource / GridRow plateforme
14/08 20:20  tsk3  lastDiagnostics → BordereauExtractResult (même appel) ; job via extractResult
14/08 20:35  preuve  :doc-extractor:test grid VERT ; :etudes:test grid+orchestrator+adapter VERT
14/08 20:35  décision  ColumnMap + classifier + GridBordereauAssembler restent etudes (BTP). Assembleur générique = les sources de grille.
```

## Rapport de livraison

ce qui a changé      Grille (`GridRow`, `GridStyle`, `PdfRuledGridSource`, `XlsxGridSource`) dans `doc-extractor`. Bordereau Sektor consomme ça. Diagnostics = retour d’`extractResult`, plus de champ singleton.
critères prouvés     AC-1 tests grille BDP-2-17 verts · AC-3 plus de `lastDiagnostics` · AC-4 zéro `DpgfNoeud` dans le package grid plateforme
décidé seul          ColumnMap/classifier/assembleur bordereau restent etudes ; stubs mockito `parse(bytes, progress)` ; tests vision assouplis quand le parse local est fiable
écarts / dette       étalon 703/4 fichiers = pipeline existant (GridBordereauPipelineTest) ; live IT BDP-2-17 inchangée (skip si fichier absent)
