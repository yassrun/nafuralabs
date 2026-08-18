---
id: PLT-124
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-123]
tags: [platform, approbation]
sprint: 2026-W34
---

# SPEC + geler AC — plier approbation

> Geler les AC du plier approbation. Pas de patch SPEC.

## Étapes

- [x] Lire SPEC approbation + forme CH impression / documents / commentaire-plier
- [x] Relever include Gradle, chemins web/e2e, FQCN, routes HTTP
- [x] Trancher AC-2 (web de ce BC vs consommateur) — décidé seul
- [x] Préciser AC-1…5 + table Preuves (sens inchangé)
- [x] Pas de patch SPEC · pas de canvas · pas de 00-PLAN · pas de nouvelle task

## Journal

```
16/08 14:15  posée
18/08 01:24  sprint → 2026-W34
18/08 01:25  status → doing
18/08 01:28  AC précisés (chemins réels collaboration/workflow, include, FQCN, 3 routes) · coupe web tranchée · SPEC intacte
18/08 01:30  status → done-agent · gate none → done-me
```

## Rapport de livraison

- **ce qui a changé** — `pact/approbation/CH-01-TECHNICAL-plier/CH.md` : « Aujourd'hui » corrigé (`features/collaboration/workflow/`, pas `features/workflow/`) ; AC précisés (include `:platform:approbation`, 3 routes HTTP, noms `approbation-*`) ; coupe web AC-2 écrite. SPEC intacte. Pas de canvas, pas de 00-PLAN.
- **critères prouvés** — AC gelés pour l'exec : `approbation-plier-arbre` → AC-1,2,3,5 ; suite `approbation-*` → AC-4. État initial : backend encore sous `features/collaboration/workflow`.
- **décidé seul** — include cible = `:platform:approbation` + `projectDir` `approbation` (forme documents/impression). Web de ce BC = widgets+API `collaboration/workflow` **et** écrans chaînes `administration/workflows`. Consommateur (n'entre pas) = `features/approvals/` entier (inbox + facade + routes produit) · anatomy `entity-detail` · shell. Dossier Java `ma/nafura/workflow/` et FQCN `ma.nafura.platform.collaboration.workflow` restent. Pas de package `ma.nafura.workflow` dans le code.
- **écarts / dette** — aucun. Exec = PLT-125. Pas de question bloquante.
