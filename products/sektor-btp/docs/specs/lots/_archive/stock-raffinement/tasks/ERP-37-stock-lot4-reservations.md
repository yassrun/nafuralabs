---
id: ERP-37
status: done
context: nafura
kind: task
feature: stock-raffinement
parent: ERP-02
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-36]
tags: [sektor, stock, backend]
---


# Stock — Lot 4 · Réservations qui bloquent

> Spec §5 Lot 4.

## Critères d'acceptation
- [x] `reserved_quantity` mis à jour (création / libération / expiration / conso)
- [x] `location_id` sur `stock_reservations`
- [x] Refus réservation > disponible
- [x] `available_quantity` retiré de la table (calcul DTO)
- [x] `chantier_id` UUID unifié ; plus de `chantierBudgetId` en conso

## Journal
```
05/08 16:15  capturé
05/08 21:30  archivé → backlog_archive · framework v2
```

05/08 16:25  done · implémenté avec feature stock-raffinement
