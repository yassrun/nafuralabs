# Backend — sortir de modules/ + fusionner

> `sources/backend/<nom>` comme le web. Jars morts fusionnés. `bootJar` VERT.

## Verdict

`modules/` n’est pas un concept. item/stock/partner/currency/approbations sont des noms morts (`DECISIONS.md`).

## Constat

`settings.gradle.kts` : `projectDir = file("modules/$name")`. 15 jars sous `modules/` + `app/`.

## Approche technique

1. git mv `modules/<nom>` → `backend/<nom>` ; `projectDir = file(name)` ; plus de `modules/`.
2. Sources `item/` + `stock/` → `catalogue/` (garder les packages Java pour limiter le churn). Dépendances `:sektor:item` / `:sektor:stock` → `:sektor:catalogue`. Drop includes item/stock.
3. `partner/` : code fournisseurs → `achats/`, clients → `ventes/` (packages inchangés si possible). `currency/` → `finance/`. `approbations/` → `socle/`. Drop ces includes.
4. `./gradlew :sektor:app:bootJar` VERT.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-89 sortir de `modules/` | — | — |
| 2 | SEKTOR-90 item+stock → catalogue | SEKTOR-89 | — |
| 3 | SEKTOR-91 partner/currency/approbations + bootJar | SEKTOR-90 | non |

## Couverture

Pas de CH. Preuve = bootJar. Parallèle au sous-lot web.

## Décisions ouvertes

Aucune — `DECISIONS.md`.
