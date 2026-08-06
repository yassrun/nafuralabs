---
id: ERP-38
status: done
context: nafura
kind: task
feature: stock-raffinement
parent: ERP-02
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-37]
tags: [sektor, stock, backend]
---


# Stock — Lot 5 · Inventaire écarts + numérotation

> Spec §5 Lot 5.

## Critères d'acceptation
- [x] Inventaire produit StockMove d'écart (contrepartie AJUSTEMENT)
- [x] Écart exposé (qty + valeur)
- [x] Numérotation `REC-2026-0001` (séquence tenant/type/exercice)

## Journal
```
05/08 16:15  capturé
05/08 21:30  archivé → backlog_archive · framework v2
```

05/08 16:25  done · implémenté avec feature stock-raffinement
