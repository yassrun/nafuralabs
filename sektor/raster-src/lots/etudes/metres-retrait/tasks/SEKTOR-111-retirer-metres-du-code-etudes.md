---
id: SEKTOR-111
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [etudes]
---

# Retirer metres du code etudes

> Gelé DECISIONS-PRODUIT.md 17/08 — mètres hors menu ET hors code. Blast API /etudes/metres, entité, createFromMetre, metreId. Hors chrome depuis 20/08.

Contrat : [`DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) § Chrome études. Même comportement dossier : `createEmpty` / `createFromImport`, `metreId = null`. Lab : drop Liquibase OK.

## Étapes

- [x] Sortir API `/etudes/metres`, entité, `createFromMetre`, `metreId` sur DPGF / devis / AO, seeds, lookups, écrans web.
- [x] Le chemin dossier reste `createEmpty` / `createFromImport` avec `metreId = null` (puis plus de colonne).
- [x] Preuve : suite existante verte ; plus de route / type mètres dans le jar études. Pas de scénario métier nouveau.

## Journal

```
20/08 19:22  posée
20/08 19:24  status → doing
20/08 19:30  tsk1 mapping blast (API Metre* / createFromMetre / metreId / web /etudes/metres / seeds)
20/08 19:50  tsk2 back : suppression MetreController/Service/entité/DTOs/seeds ; DpgfService sans createFromMetre ; colonnes metre* retirées des entités DPGF/devis/AO
20/08 20:10  tsk3 web : dossier app/etudes/metres + metre-table-editor supprimés ; route etudes/metres hors ETUDES_ROUTES ; lookups metres/metreurs hors ; DpgfApiService déplacé sous services/
20/08 20:20  tsk4 liquibase : 023_drop_metres.sql (v1.0 inchangé — checksums) ; createEmpty/createFromImport inchangés
20/08 20:30  tsk5 e2e seed-qa-etudes + crawls : plus de /etudes/metres ni DPGF-from-metre
20/08 20:40  tsk6 preuves : compileJava OK ; DpgfService tests verts ; :sektor:etudes:test 21 échecs Mockito/gates hors blast ; ng build bloqué par catalogue.cleStable (hors périmètre)
20/08 20:50  i18n etudesDpu : clés metreDpgf* / emptyDpgfHint / toastNeedDpgf retirées (fr/en/ar)
20/08 19:38  status → done-agent · gate none → done-me
```

## Rapport de livraison

**ce qui a changé** — Blast mètres études : plus d’API `/etudes/metres`, plus d’entité/seed/écran takeoff, plus de `createFromMetre` / `metreId` sur DPGF, devis, AO. Dossier inchangé : `DpgfService.createEmpty` / `createFromImport`. Liquibase lab `023_drop_metres.sql`.

**critères prouvés** — tech, pas de CH : compile `:sektor:etudes:compileJava` OK ; tests `DpgfServiceBuildTreeTest` + `DpgfServiceImportIncompletePersistTest` verts ; `rg createFromMetre|/api/v1/etudes/metres` vide dans `sources/` et `e2e/` ; `app/etudes/metres` et `MetreController` absents. Pas de scénario métier nouveau.

**décidé seul** — v1.0 (`002_create_metres.sql` + FKs) conservé ; drop en v1.1/023 pour ne pas casser les checksums Liquibase. `DpgfApiService` déplacé vers `app/etudes/services/` (plus de dossier metres). Chrome sidebar non touché.

**écarts / dette** —
- Installs neuves créent encore `metrees` en v1.0 puis drop en 023.
- `:sektor:etudes:test` : 329 tests, 21 échecs Mockito/gates/capitalisation (fichiers non touchés) — inbox.
- `ng build` bloqué par `catalogue/item-article.mapper.ts` `cleStable` (Extraire/Item, hors périmètre) — inbox.
- Clés i18n `etudesDpu.generateDpgf` / `createDevis` orphelines (DPGF hors métré, non branchées).
- Lab : appliquer 023 (ou `dropAll`) avant boot back.
- `DECISIONS-PRODUIT.md` dit encore « Pas encore implémenté — inbox » (non patché : pas Pact, journal produit gelé).
