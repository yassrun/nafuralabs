---
id: ERP-27
status: done
context: nafura
kind: spec
feature: rh-pointage-raffinement
parent: ERP-26
priority: P0
assignee: either
gate: me
sprint: 2026-W32
tags: [sektor, rh, decisions]
---


# RH / pointage — trancher les questions ouvertes (§7) avant Lot 1

> Bloque ERP-28. Source : `docs/epics/rh-pointage-raffinement/00-PLAN.md` §7.
> ADR : `docs/epics/rh-pointage-raffinement/01-ADR-decisions-ouvertes.md`

## Critères d'acceptation
- [x] **7.1** Multi-chantier / jour — oui ; unicité inclut chantier
- [x] **7.1 bis** Clé FG = A (prorata déboursé direct) + override C optionnel
- [x] **7.2** Légal commun + overlays tenant (CIMR/mutuelle/CC)
- [x] **7.3** Inventaire staging + dédup avant UNIQUE — process figé
- [x] **7.4** Liquibase lifecycle `rh/.../schema/v1.1/`
- [x] Décisions notées dans ADR + plan §7 mis à jour

## Journal
```
05/08 16:05  balayage · capturé depuis 00-PLAN §7 · en cours
05/08 19:40  done · reco marché MA figées · débloque ERP-28
05/08 21:30  archivé → backlog_archive · framework v2
```
