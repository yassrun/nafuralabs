---

id: SEKTOR-100
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-99]
---

# Études consomme catalogue.api seulement

> Plus d’import `ma.nafura.item` (entity, repository, `ResolutionPrixService`) dans `etudes/`. Gel de prix et lookup catalogue passent par le contrat de SEKTOR-99. Snapshot copié sur le DPU — pas de join live.

## Étapes

- [x] `ItemCatalogResolver` (et équivalents) → API Catalogue, plus `ItemRepository`
- [x] `GelPrixComposantService` / `DecompositionProposeService` / `RattrapageComposantService` / `DpuService` : plus `ResolutionPrixService` ni `Item` Catalogue
- [x] `ComposantDpu` ne dépend plus d’un type `item.domain` s’il peut porter un enum/valeur locale
- [x] Laisser `etudes/build.gradle` `project(':sektor:catalogue')` (même jar, tant que SEKTOR-101 n’a pas la garde package). Drop achats/chantiers/marches **hors** cette task (inbox)

## Preuve de fin

`rg "ma\\.nafura\\.item" sektor/sources/backend/etudes` vide (hors tests qui mockent l’API Catalogue si besoin). `:sektor:etudes:compileJava` VERT.

## Journal

```
14/08 15:50  promote  blocked_by SEKTOR-99
14/08 15:56  orch     sprint: 2026-W33
14/08 16:40  exec     tsk1 ItemCatalogResolver → CatalogLookupApi (plus ItemRepository)
14/08 16:40  exec     tsk2 gel/décomposition/rattrapage/DPU via CatalogLookupApi + CatalogPriceSnapshot
14/08 16:40  exec     tsk3 ComposantDpu.sourcePrix = CatalogPriceSource.MANUEL (plus item.domain)
14/08 16:40  exec     décision  contrat 99 étendu : createAllege, listActiveUnitCodes, CatalogNatureMapping, CatalogUsageLot, CatalogPriceSource, CatalogBasePrix — sinon rattrapage / UoM / mapping restaient sur item.*
14/08 16:40  exec     preuve  rg ma.nafura.item etudes vide · :sektor:etudes:compileJava VERT
14/08 16:40  exec     hors périmètre  AdaptiveBordereau tests parse() 2-args déjà mismatch Mockito (pas introduit ici)
```
