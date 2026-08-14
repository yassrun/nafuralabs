# Études consomme Catalogue — contrat publié

> Études n’importe plus `ma.nafura.item.*`. Lookup + snapshot prix passent par `catalogue` `api/`. `bootJar` VERT. Aucune règle métier changée.

## Verdict

[`ARCHI_BLUEPRINT.md`](../../../../../ARCHI_BLUEPRINT.md) : pairs in-process via `*.api` seulement. Le cas qui décide = Études ↔ Catalogue (déjà dit « etudes consomme » dans `DECISIONS.md`). Socle isolé = autre flux (`SEKTOR-98`, parallèle).

## Constat

- `etudes/build.gradle` → `catalogue` (et achats/chantiers/marches/socle).
- `ItemCatalogResolver` injecte `ItemRepository` + entité `Item`.
- `GelPrixComposantService` / `DecompositionProposeService` appellent `ResolutionPrixService` (services Catalogue).
- Ports Études existent déjà (`CatalogResolverPort`) — l’adapter triche.

## Approche technique

1. Catalogue : surface `api` Java (lookup article + snapshot prix gelable). Pas un repli complet `domain/services/…` dans cette task.
2. Études : adapters → **seulement** ce `api`. Plus d’import `ma.nafura.item`.
3. Garde : test/check qui échoue si Études recompile contre un package Catalogue hors `api`.

Pas d’HTTP BC→BC. Packages Java `item` peuvent rester *dans* le jar Catalogue.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-99 Catalogue publie `api` lookup + snapshot | — | **oui** avec SEKTOR-98 |
| 2 | SEKTOR-100 Études ne voit plus `item.*` | SEKTOR-99 | non |
| 3 | SEKTOR-101 Garde deps Études → Catalogue | SEKTOR-98, SEKTOR-100 | non |

## Couverture

Pas de CH (Sektor non pacté). Preuve = compile + bootJar + garde. Autres paires (ChainageAval, clients) = inbox.

## Décisions ouvertes

Aucune — `ARCHI_BLUEPRINT.md`.
