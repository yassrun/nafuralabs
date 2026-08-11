---
id: ERP-18
status: done
context: nafura
kind: feature
feature: classification-article
priority: P0
assignee: me
gate: me
sprint: 2026-W32
tags: [sektor, inventory, articles, classification]
---


# Feature — Refonte classification article (nature + famille)

> Spec : `products/sektor-btp/docs/specs/epics/_archive/classification-article/00-PLAN.md`
> Remplace / absorbe l’ancien ERP-01 (raffiner matériel/articles).

## Modèle cible
- **Nature** — enum Java 9 valeurs, lecture seule, pilote le comportement
- **Famille** — arbre 2 niveaux, éditable, zéro comportement
- `item_types` disparaît

## Enfants
- ERP-19✓ — Décisions ouvertes §7
- ERP-20✓ — Lot 1 Nature enum
- ERP-21✓ — Lot 2 Suppression item_types
- ERP-22✓ — Lot 3 Familles en arbre
- ERP-23✓ — Lot 4 Front aligné
- ERP-24✓ — Lot 5 Rattachement matériel

## Journal
```
05/08 13:32  balayage · promu depuis 00-PLAN.md · ERP-01 mergé ici
05/08 13:50  ERP-19 done · décisions §7 dans 01-ADR · Lot 1 (ERP-20) débloqué
05/08 14:50  ERP-20 done · Nature enum + GET /article-natures + SQL v1.1
05/08 15:05  ERP-21 done · ItemType + écrans types-articles supprimés
05/08 15:25  ERP-22 done · familles arbre 60 + seed 2 passes + UoM ML/MLT
05/08 15:45  ERP-23 done · front 9 natures + NatureApiService
05/08 16:10  ERP-24 done · feature classification-article complète
05/08 16:00  migrate staging OK (rebuild lifecycle) · chantier terminé
05/08 21:30  archivé → backlog_archive · framework v2
```
