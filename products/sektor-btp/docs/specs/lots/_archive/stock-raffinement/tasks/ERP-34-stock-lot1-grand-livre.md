---
id: ERP-34
status: done
context: nafura
kind: task
feature: stock-raffinement
parent: ERP-02
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-33]
tags: [sektor, stock, backend]
---


# Stock — Lot 1 · Grand livre `stock_moves`

> Spec §5 Lot 1.

## Critères d'acceptation
- [x] Table `stock_moves` + entité + repository
- [x] `applyStockImpact` écrit un move avant update solde
- [x] `UNIQUE (tenant_id, warehouse_id, item_id)` + dédoublonnage / ouverture
- [x] `reconcile(itemId, locationId)` solde ↔ Σ mouvements
- [x] Test : 3 mouvements → solde = somme

## Journal
```
05/08 16:15  capturé · après ADR ERP-33
05/08 21:30  archivé → backlog_archive · framework v2
```

05/08 16:25  done · implémenté avec feature stock-raffinement
