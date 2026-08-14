# Backend — socle + app assembler

> `sources/backend/socle` = kernel app. `app/` = boot Spring seulement. Modules Gradle inchangés.

## Verdict

Les adapters Sektor (onboarding, QA cursor, LLM tenant) sont coincés dans `app/` à côté du boot. Les sortir sans toucher aux frontières item/stock/etudes.

## Constat

- `app/` mélange boot, onboarding, cursor-auth, adapters `etudes/` et `catalogue/`
- 14 modules Gradle : on ne les scinde ni ne les fusionne

## Approche technique

Nouveau module `:sektor:socle`. Kernel app-wide seulement. Reloger les adapters déjà étiquetés etudes/catalogue dans leur jar. `app/` ne dépend plus que des modules + socle + platform. Preuve = `bootJar`.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-87 module `socle` | SEKTOR-83 | — |
| 2 | SEKTOR-88 `app/` = assembler + bootJar | SEKTOR-87 | non |

## Couverture

Pas de CH. Preuve = `:sektor:app:bootJar` VERT.

## Décisions ouvertes

Aucune hors `MAPPING.md`.
