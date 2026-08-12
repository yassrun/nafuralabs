---
id: ERP-25
status: done
context: nafura
kind: task
feature: classification-article
parent: ERP-18
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: []
tags: [sektor, inventory, articles]
---


# Classification — Lots d’usage multi (1 famille d’appro)

> ADR §7.4 — option B : famille d’appro unique + tags lots VRD/GO/Finitions…

## Critères d'acceptation
- [x] Table `item_usage_lots` + enum `UsageLot`
- [x] API Item expose `usageLotCodes: string[]` (replace-set create/update)
- [x] Front article : multi-select + colonne/filtre listing
- [x] Migrate staging

## Journal
```
05/08 16:50  capturé · décision B (sable → VRD+GO+Finitions)
05/08 15:58  done · SQL 004 + API + front + migrate stg + smoke SABLE-SMOKE (3 lots)
05/08 21:30  archivé → backlog_archive · framework v2
```
