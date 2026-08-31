# Catalogue résiduel

> etat-stocks, tree/console/line-editors, dumps résiduels — sans retoucher listings entity déjà OK.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-8, AC-12, AC-13.

## Intention

Filtres et boutons catalogue hors entity-listing passent par `nf-select` / `nf-button` ; dumps article restants branchent search/picker existants.

## Périmètre

Inclus : etat-stocks, famille-tree, catalogue-console, line-editors perte/transfert/retour/inventaire, dumps pageSize 500 ciblés.
Exclus : OT/GMAO, stock-balances 5000, refonte arbre familles métier.

## Tasks

| # | Task | agent_type | blocked_by |
|---|------|------------|------------|
| 1 | etat-stocks + tree/console/line-editors nf-* | exec | CONTRAT spec |
| 2 | dumps résiduels → search/picker | exec | 1 |
| 3 | Preuves catalogue | qa | 2 |

## Preuves attendues

`node sektor/e2e/scripts/verify-homog-catalogue.mjs` — Mode B owner.
