---
id: PLT-106
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-105]
tags: [platform, commentaire]
sprint: 2026-W34
---

# SPEC + geler AC — plier commentaire

> Geler les AC du plier commentaire. Pas de patch SPEC.

## Étapes

- [x] Lire SPEC commentaire + forme CH-08 documents / impression-plier-arbre
- [x] Relever include Gradle, chemins web/e2e, FQCN, route
- [x] Préciser AC-1…5 + table Preuves (sens inchangé)
- [x] Pas de patch SPEC · pas de canvas · pas de 00-PLAN · pas de nouvelle task

## Journal

```
16/08 14:15  posée
18/08 01:21  sprint → 2026-W34
18/08 01:23  status → doing
18/08 01:24  AC précisés (chemins, include, FQCN/route) · SPEC intacte
18/08 01:24  status → done-agent · gate none → done-me
18/08 01:36  constat écart PLT-107 : aucun écart · SPEC intacte
```

## Rapport de livraison

- **ce qui a changé** — `pact/commentaire/CH-01-TECHNICAL-plier/CH.md` : AC précisés (chemins cibles, include `:platform:commentaire`, FQCN/route gelés). SPEC intacte. Pas de canvas, pas de 00-PLAN.
- **critères prouvés** — AC gelés pour l'exec : `commentaire-plier-arbre` → AC-1,2,3,5 ; suite `commentaire-*` → AC-4. État initial : backend/web encore sous `features/collaboration/comment`.
- **décidé seul** — include cible = `:platform:commentaire` + `projectDir` `commentaire` (forme documents/impression). Dossier Java `ma/nafura/comment/` et FQCN `ma.nafura.platform.collaboration.comment` restent. Anatomy hors périmètre.
- **écarts / dette** — aucun. Exec = PLT-107. Pas de question bloquante.
