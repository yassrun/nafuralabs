---
id: ERP-18
status: todo
context: nafura
assignee: me
kind: feature
feature: classification-article
priority: P0
tags: [sektor, inventory, articles, classification]
---

# Feature — Refonte classification article (nature + famille)

> Spec : `products/sektor-btp/docs/epics/classification-article/00-PLAN.md`
> Statut doc : spécifié, non implémenté.
> Remplace / absorbe l’ancien ERP-01 (raffiner matériel/articles).

## Modèle cible
- **Nature** — enum Java 9 valeurs, lecture seule, pilote le comportement
- **Famille** — arbre 2 niveaux, éditable, zéro comportement
- `item_types` disparaît

## Enfants
- ERP-19 — Décisions ouvertes §7 (bloque Lot 1)
- ERP-20 — Lot 1 Nature enum
- ERP-21 — Lot 2 Suppression item_types
- ERP-22 — Lot 3 Familles en arbre
- ERP-23 — Lot 4 Front aligné
- ERP-24 — Lot 5 Rattachement matériel

## Journal
```
05/08 13:32  balayage · promu depuis 00-PLAN.md · ERP-01 mergé ici
```
