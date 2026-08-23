# Extraire — rattachement + build

> Créer pendant Extraire rattache. `ng build` compile `cleStable`.

## Verdict

Rattachement d’abord (bug visible synthèse). Mapper ensuite (tech, même famille Extraire/Item).

## Constat

Walk QA 20/08 : 3 lignes restent « non rattachées » après une création. `ng build` cassé sur `item-article.mapper.ts`.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-118 Extraire enchaîne rattachement | — | — |
| 2 | SEKTOR-124 ng build cleStable | — | **oui** avec 1 |

## Couverture

Hors : match incertain, tiny spec couleur, L9 `createAllege`, slug LLM down — inbox, pas gelé.
