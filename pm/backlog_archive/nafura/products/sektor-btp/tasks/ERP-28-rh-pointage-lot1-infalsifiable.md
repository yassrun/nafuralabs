---
id: ERP-28
status: done
context: nafura
kind: task
feature: rh-pointage-raffinement
parent: ERP-26
priority: P0
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-27]
tags: [sektor, rh, backend]
---


# RH / pointage — Lot 1 · Pointage infalsifiable

> Spec §5 Lot 1. Compile + tests avant Lot 2.

## Critères d'acceptation
- [x] `pointages.id` / `pointage_batches.id` en UUID ; supprimer `defaultPointageId()`
- [x] `UNIQUE (tenant_id, employe_id, date, chantier_id)` + `UNIQUE (tenant_id, chantier_id, date_pointage)` — dédoublonner d’abord
- [x] Index partiel `client_id IS NOT NULL` à la place de `UNIQUE (tenant_id, client_id)`
- [x] `updated_at`, `validated_by`, `validated_at` sur les deux tables
- [x] Conflit → erreur métier (jamais merge silencieux)
- [x] Retirer `CHANTIER_CODES` ; lookup code chantier (JDBC `ChantierCodeReader`)
- [x] Retirer bornes date en dur ; paginer la liste (page 100)
- [x] Test : même employé / jour / chantier → refuse ; deux chantiers → coexistent

## Journal
```
05/08 16:05  balayage · capturé depuis 00-PLAN Lot 1
05/08 19:40  ERP-27 done · débloqué · Lot 1 en cours
05/08 20:15  done · UUID + UNIQUE + anti-merge + tests · SQL v1.1
05/08 21:30  archivé → backlog_archive · framework v2
```
