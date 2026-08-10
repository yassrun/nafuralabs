---
id: ERP-02
status: done
context: nafura
kind: feature
feature: stock-raffinement
priority: P1
assignee: me
gate: me
sprint: 2026-W32
tags: [sektor, stock, raffinement]
---


# Feature — Raffinement stock (grand livre → valorisation → réservations)

> Spec : `products/sektor-btp/docs/specs/epics/_archive/stock-raffinement/00-PLAN.md`
> ADR : `…/01-ADR-decisions-ouvertes.md`

## Modèle cible
- **`stock_moves`** — grand livre immuable à la validation
- **Valorisation** — PMP calculé (AVCO), plus de talon `recalcPmp`
- **Disponible bloquant** — réservations + refus de sortie sauf `allow_negative_stock`

## Enfants
- ERP-33✓ — Décisions ouvertes §7
- ERP-34✓ — Lot 1 Grand livre
- ERP-35✓ — Lot 2 Sortie bloquante + reverse
- ERP-36✓ — Lot 3 Valorisation PMP
- ERP-37✓ — Lot 4 Réservations
- ERP-38✓ — Lot 5 Inventaire + numérotation
- ERP-39✓ — Lot 6 Nettoyage

## Journal
```
05/08 11:27  capturé · ordre raffinement lots ops figé
05/08 16:10  ERP-24 done · classification complète · next
05/08 16:20  promu feature · enfants ERP-33…39 (évite collision RH ERP-26…32)
05/08 16:25  done · Lots 1–6 + tests stock service OK
05/08 21:30  archivé → backlog_archive · framework v2
```

05/08 19:50  migrate staging OK · lifecycle rebuild · stock v1.1 001-005 appliqués
