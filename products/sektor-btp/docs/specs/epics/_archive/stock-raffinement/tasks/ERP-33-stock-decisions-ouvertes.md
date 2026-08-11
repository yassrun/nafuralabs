---
id: ERP-33
status: done
context: nafura
kind: spec
feature: stock-raffinement
parent: ERP-02
priority: P1
assignee: either
gate: me
sprint: 2026-W32
tags: [sektor, stock, decisions]
---


# Stock — trancher les questions ouvertes (§7) avant Lot 1

> Bloque ERP-34. Source : `docs/specs/epics/_archive/stock-raffinement/00-PLAN.md` §7.
> ADR : `docs/specs/epics/_archive/stock-raffinement/01-ADR-decisions-ouvertes.md`

## Critères d'acceptation
- [x] **7.1** Pas de lots/péremption v1 — clé soldes inchangée
- [x] **7.2** Négatif par méthode/tenant seulement
- [x] **7.3** Mouvements d'ouverture + dédoublonnage avant UNIQUE
- [x] **7.4** Liquibase lifecycle → `stock/.../v1.1/`
- [x] Décisions notées dans ADR + plan §7 mis à jour

## Journal
```
05/08 16:15  done · ADR 01 + plan §7 · débloque ERP-34 (IDs 33–39, hors collision RH 26–32)
05/08 21:30  archivé → backlog_archive · framework v2
```
