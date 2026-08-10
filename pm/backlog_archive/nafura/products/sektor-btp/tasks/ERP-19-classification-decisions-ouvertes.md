---
id: ERP-19
status: done
context: nafura
kind: spec
feature: classification-article
parent: ERP-18
priority: P0
assignee: either
gate: me
sprint: 2026-W32
tags: [sektor, inventory, decisions]
---


# Classification article — trancher les questions ouvertes (§7) avant Lot 1

> Bloque ERP-20. Source : `docs/specs/epics/_archive/classification-article/00-PLAN.md` §7.
> ADR : `docs/specs/epics/_archive/classification-article/01-ADR-decisions-ouvertes.md`

## Critères d'acceptation
- [x] **7.1** SERVICE → DPU_SOUS_TRAITANCE (budget FRAIS_GENERAUX) — pas de 5ᵉ poste Lot 1
- [x] **7.2** PRESTATION → défaut SOUS_TRAITANCE ; staging 0 article ; checklist si count > 0
- [x] **7.3** Liquibase Job lifecycle (`collectMigrations`) confirmé
- [x] Décisions notées dans ADR + plan §7 mis à jour

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN §7
05/08 13:45  agent · enquêtes DPU / staging PRESTATION / lifecycle Liquibase
05/08 13:50  done · ADR 01 + plan §7 · débloque ERP-20
05/08 21:30  archivé → backlog_archive · framework v2
```
