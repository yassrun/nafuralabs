---
id: ERP-35
status: done
context: nafura
kind: task
feature: stock-raffinement
parent: ERP-02
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-34]
tags: [sektor, stock, backend]
---


# Stock — Lot 2 · Sortie bloquante + contre-passation

> Spec §5 Lot 2. ADR §7.2 : négatif par méthode/tenant.

## Critères d'acceptation
- [x] Plus de clamp à 0 — exception métier si disponible insuffisant
- [x] `CostingMethodResolver` lit `allow_negative_stock`
- [x] `reverse(txId)` + `reversal_of_move_id`
- [x] Défaut SQL statut `BROUILLON`
- [x] Tests : sortie refusée ; reverse restaure soldes

## Journal
```
05/08 16:15  capturé
05/08 21:30  archivé → backlog_archive · framework v2
```

05/08 16:25  done · implémenté avec feature stock-raffinement
