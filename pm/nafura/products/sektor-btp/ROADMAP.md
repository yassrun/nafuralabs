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

## Ordre figé (2026-08-05) — balayage classification

| # | Lot | Tâches | Cible mince |
|---|-----|--------|-------------|
| 1 | **Classification article** | **ERP-18** (feature) · ERP-19→24 | Nature enum + familles arbre — remplace ERP-01 |
| 2 | Stock | ERP-02 | Dépôts + mouvements (+ chantier_id) — après natures utilisables |
| 3 | Achats | ERP-03 | DA → BC → réception → entrée stock |
| 4 | RH | ERP-04 | Employés sains → pointage simple |
| 5 | Sous-traitance | ERP-05 | Contrat + rattachement chantier |
| 6 | Chantier minimal | ERP-06 | Fiche pivot analytique léger |
| 7 | Planification chantier | ERP-07 | **Après** 1–5 utilisables |

Spec lot 1 : `products/sektor-btp/docs/epics/classification-article/00-PLAN.md`  
ERP-01 → **dropped** (mergé dans ERP-18).

## Hors scope de cette vague

Paie complète · HSE · finance analytique profonde · Gantt / avancement lourd avant ERP-07.

## Features groupées

| Feature | Parapluie | Enfants |
|---------|-----------|---------|
| `classification-article` | ERP-18 | ERP-19 · 20 · 21 · 22 · 23 · 24 |
| `chiffrage-drawer` | ERP-16 | ERP-11 · 12 · 13 · 14 |
| `etude-parcours` | ERP-17 | ERP-08 · 09 · 10 · 15 |
