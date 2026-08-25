# Identité Extraire

> Un article = une identité Sektor (`cle_stable`). Extraire classe, l’humain crée. Raster autonome — contrat [`DECISIONS-PRODUIT.md`](../../../DECISIONS-PRODUIT.md).

## Verdict

Sans le 1–1, Extraire et la consultation identifient n’importe quoi. Schema d’abord, seaux ensuite, publication ensuite.

## Constat

Aujourd’hui Extraire = `LIKE` nom/code tenant + Item seul, sans fiche Sektor. G2 `contribuer` n’est pas Extraire.

## Approche technique

`catalogue/` (Item, CatalogArticle, lignes fournisseur) + `etudes/` Extraire (`DecompositionProposeService`, lookup). Lab Liquibase clean. Pas la console `/catalogue`.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-106 Item 1–1 `cle_stable` | — | — |
| 2 | SEKTOR-107 Extraire deux seaux | SEKTOR-106 | non |
| 3 | SEKTOR-108 PUBLIER Sektor puis Item | SEKTOR-107 | non |

## Couverture

Gelé identité + Extraire 20/08. Match incertain 2+ **hors** — blocked/inbox, pas un choix silencieux.

## Décisions ouvertes

Aucune dans ce sous-lot — prêt.
