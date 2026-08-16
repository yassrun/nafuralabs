---

id: SEKTOR-99
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
---

# Catalogue publie api lookup + snapshot

> Un package `api` (ou équivalent publié) : résoudre un article, renvoyer un snapshot (id, code, nom, unité, prix gelable). Les services Catalogue existent déjà ; on expose, on ne réécrit pas le métier.

## Étapes

- [x] Définir le contrat publié (lookup + snapshot) sous `catalogue` côté `api` — pas `repository` / `domain.model.Item` dans la signature
- [x] Implémenter en déléguant à l’existant (`ItemRepository`, `ResolutionPrixService`) **dans** Catalogue
- [x] Études ne consomme pas encore (SEKTOR-100). Autre BC non touché
- [x] Interdit : HTTP · jar Maven séparé · replier tout le module en `api/domain/services/repositories/adapters/internal`

## Preuve de fin

Un type/interface dans le jar Catalogue que Études pourra appeler sans importer `ma.nafura.item`. `:sektor:catalogue:compileJava` VERT.

## Journal

```
14/08 15:50  promote  lot plier-archi · Raster seul
14/08 15:56  orch     sprint: 2026-W33
14/08 16:21  exec     tsk1 contrat `ma.nafura.catalogue.api` : CatalogLookupApi + Candidate/ItemSnapshot/PriceSnapshot/PriceContext — aucune entité Item en signature
14/08 16:21  exec     tsk2 CatalogLookupApiImpl délègue ItemRepository + ResolutionPrixService + UoM (scoring copié d’ItemCatalogResolver)
14/08 16:21  exec     tsk3 Études non touché. Preuve : :sektor:catalogue:compileJava VERT
```
