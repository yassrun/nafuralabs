---
id: ERP-39
status: done
context: nafura
kind: task
feature: stock-raffinement
parent: ERP-02
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-38]
tags: [sektor, stock, cleanup]
---


# Stock — Lot 6 · Nettoyage

> Spec §5 Lot 6.

## Critères d'acceptation
- [x] `warehouse_id` → `location_id` sur balances + txs
- [x] Motifs : seed unique reference-data ; supprimer MovementMotifSeedService
- [x] Bloc `locations` onboarding (DEPOT_PRINCIPAL, TRANSIT, AJUSTEMENT)
- [x] Déplacer item-api avant purge arbres morts
- [x] Alertes agrégées article ; etat-stock / valo endpoints paginés serveur
- [x] Valo date branchée sur grand livre

## Journal
```
05/08 16:15  capturé
05/08 21:30  archivé → backlog_archive · framework v2
```

05/08 16:25  done · implémenté avec feature stock-raffinement
