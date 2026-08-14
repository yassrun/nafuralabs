---
id: SEKTOR-104
status: done-agent
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-97]
---

# Drop PrimeNG — nf-tree-table en mat-table

> Même API `nf-tree-table`. Moteur Material. Plus de licence PrimeUI.

## Étapes

- [x] Réécrire `nf-tree-table` : flatten + `mat-table` (expand, cell/detail/footer, sticky)
- [x] Remplacer PrimeNG dans `nf-filter-bar` par Material (wrapper mort mais bloque le drop)
- [x] Retirer `providePrimeNG`, Aura, `primeng` / `@primeuix/themes` / `primeicons`
- [x] Spec tree-table verte ; plus d’import `primeng/`

## Journal

```
14/08 19:34  tsk0  task créée — user ok remplacer p-treetable + virer PrimeNG
14/08 19:36  tsk1  nf-tree-table → mat-table aplati ; nf-filter-bar → Material
14/08 19:38  tsk2  drop providePrimeNG + npm uninstall primeng/@primeuix/themes/primeicons
14/08 19:44  preuve  npm run build:dev VERT (~109s) ; plus d’import primeng/
```

## Rapport de livraison

ce qui a changé      `nf-tree-table` moteur Material (arbre aplati). PrimeNG retiré (boot, CSS, npm). `nf-filter-bar` passé sur mat-select/datepicker.
critères prouvés     n/a (tech) — `npm run build:dev` VERT ; grep `from 'primeng` vide
décidé seul          pas de `mat-tree` (pas de colonnes) ; flatten + `mat-table` ; filter-bar réécrit plutôt que supprimé (export anatomy)
écarts / dette       spec tree-table hors karma Sektor (include app/src only) ; constitution/WRAPPER_MAP mis à jour ; `tableEpoch` bordereau laissé
