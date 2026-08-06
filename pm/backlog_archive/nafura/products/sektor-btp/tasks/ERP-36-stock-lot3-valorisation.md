---
id: ERP-36
status: done
context: nafura
kind: task
feature: stock-raffinement
parent: ERP-02
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-35]
tags: [sektor, stock, backend]
---


# Stock — Lot 3 · Valorisation PMP

> Spec §5 Lot 3.

## Critères d'acceptation
- [x] `ValorisationService` met à jour PMP à chaque RECEPTION
- [x] `unit_cost` / `total_cost` sur `StockMove`
- [x] Retirer `recalcPmp` ItemService + endpoint
- [x] Seed costing = AVCO seul
- [x] KPI rotation réelle (pas 4,2)
- [x] Test : 2 réceptions → PMP attendu

## Journal
```
05/08 16:15  capturé
05/08 21:30  archivé → backlog_archive · framework v2
```

05/08 16:25  done · implémenté avec feature stock-raffinement
