---
id: SEKTOR-105
status: done-agent
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
---

# Ranger ports / adapters par exécuteur

> En ouvrant un BC : `capability/` = Socle/Platform (LLM, doc-extractor, approbation), `bc/` = autre BC. Même comportement.

## Étapes

- [x] Sous-dossiers `capability/` et `bc/` sous `service/port/` et `adapters/` (pas de dossier `socle/` dans un BC)
- [x] `git mv` + packages + imports — Études, Catalogue, Chantiers, Ventes, Achats, Finance, Socle
- [x] Helpers d’un adapter (orchestrator, parser) collés à l’exécuteur
- [x] Documenter la convention dans `ARCHI_BLUEPRINT.md` + `plier-archi/LOT.md`
- [x] `compileJava` + `compileTestJava` VERT — aucun scénario nouveau

## Preuve de fin

`./gradlew :sektor:app:compileJava :sektor:app:compileTestJava` VERT. Un port outbound n’est plus à plat dans `service/port/`.

## Journal

```
14/08 20:15  orch     sprint: 2026-W33 · sous-lot ports-adapters
14/08 20:16  exec     53 git mv ; packages capability/ vs bc/
14/08 20:20  exec     compileJava + compileTestJava VERT
```

## Rapport de livraison

ce qui a changé      Ports/adapters rangés par exécuteur (`capability/` = Platform/Socle, `bc/` = autre BC). ARCHI + LOT.md.
critères prouvés     n/a (tech) — `:sektor:app:compileJava` + `compileTestJava` VERT
décidé seul          `ventes/adapter` → `adapters/bc` ; `chantiers/port` → `service/port/bc` ; ItemCatalogResolver sorti de `service/port` vers `adapters/bc`
écarts / dette       Intra-BC `TenantPrixHistorique*` reste à la racine. Adapters socle invitation/AI (Brevo, Keycloak, LLM pref) pas déplacés. `BibliothequeDecompositionSuggestionPort` encore nommé Port.
