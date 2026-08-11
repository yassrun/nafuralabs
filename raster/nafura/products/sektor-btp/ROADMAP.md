---
product: sektor-btp
context: nafura
updated: 2026-08-05
---

# ROADMAP — Sektor BTP (lots ops)

> Ordre de raffinement des modules **déjà présents mais pauvres**.
> Objectif : fondations ops avant planification chantier.
> (Hors parcours étude — ne pas mélanger.)

## Principe

1. Raffiner un **flux mince bout-en-bout**, pas le module “complet”.
2. **Chantier minimal** (fiche) dès que stock/achats en ont besoin — pas un Gantt.
3. **Planification chantier en dernier** parmi ces lots.

## Ordre figé (2026-08-05)

| # | Lot | Tâches | Cible mince |
|---|-----|--------|-------------|
| 1 | **Classification article** ✓ | **ERP-18** · ERP-19→25 **done** | Nature enum + familles arbre — remplace ERP-01 |
| 2 | **Stock** ✓ | **ERP-02** · ERP-33→39 **done** | Grand livre + PMP + réservations bloquantes |
| 3 | Achats | ERP-03 | DA → BC → réception → entrée stock |
| 4 | RH / pointage | **ERP-26** · ERP-27→32 | Pointage infalsifiable → validation qui produit — remplace ERP-04 |
| 5 | Sous-traitance | ERP-05 | Contrat + rattachement chantier |
| 6 | Chantier minimal | ERP-06 | Fiche pivot analytique léger |
| 7 | Planification chantier | ERP-07 | **Après** 1–5 utilisables |

Spec classification : `products/sektor-btp/docs/specs/epics/_archive/classification-article/00-PLAN.md`  
Spec stock : `products/sektor-btp/docs/specs/epics/_archive/stock-raffinement/00-PLAN.md`  
ADR stock : `…/stock-raffinement/01-ADR-decisions-ouvertes.md` (ERP-33 **done**)  
Chaîne stock : ERP-33✓ → 34✓ → 35✓ → 36✓ → 37✓ → 38✓ → 39✓ 

Spec RH : `products/sektor-btp/docs/specs/epics/_archive/rh-pointage-raffinement/00-PLAN.md`  
ADR RH : `…/rh-pointage-raffinement/01-ADR-decisions-ouvertes.md` (ERP-27 **done**)  
Chaîne RH : ERP-27✓ → 28✓ → 29 → (30 · 31 · 32). ERP-04 **supprimé** (mergé ERP-26).  
ERP-01 **supprimé** (mergé ERP-18).

## Hors scope de cette vague

Paie *complète* avant Lots 1–2 pointage · HSE · finance analytique profonde · Gantt / avancement lourd avant ERP-07.  
(Lot 3 paie reste enfant ERP-26 en P2, après validation comptable.)

## Features groupées

| Feature | Parapluie | Enfants |
|---------|-----------|---------|
| `classification-article` | ERP-18 | ERP-19 · 20 · 21 · 22 · 23 · 24 · 25 |
| `stock-raffinement` | ERP-02 | ERP-33 · 34 · 35 · 36 · 37 · 38 · 39 |
| `rh-pointage-raffinement` | ERP-26 | ERP-27 · 28 · 29 · 30 · 31 · 32 |
| `chiffrage-drawer` | ERP-16 | ERP-11 · 12 · 13 · 14 |
| `etude-parcours` | ERP-17 | ERP-08 · 09 · 10 · 15 |
