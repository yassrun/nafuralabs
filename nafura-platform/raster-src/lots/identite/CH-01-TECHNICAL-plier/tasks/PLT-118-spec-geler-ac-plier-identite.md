---
id: PLT-118
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-117]
tags: [platform, identite]
---

# SPEC + geler AC — plier identite

> Geler les AC du plier identite. Pas de patch SPEC.

## Étapes

- [x] Lire CADRE + SPEC identite + CH-00 INIT + forme CH commentaire / approbation
- [x] Relever jars owned (identity · iam) — settings déjà not_owns
- [x] Trancher AC-2 (web de ce BC vs consommateur / shell) — décidé seul
- [x] Préciser AC-1…5 + table Preuves (includes `:platform:identite:identity` · `:platform:identite:iam`)
- [x] Pas de patch SPEC · pas de canvas · pas de 00-PLAN · pas de nouvelle task

## Journal

```
16/08 14:15  posée
18/08 10:13  sprint → 2026-W34
18/08 10:18  status → doing
18/08 10:20  AC précisés (identity+iam sous identite/, pas settings ; coupe web membres vs rôles/shell) · SPEC intacte
18/08 10:18  status → done-agent · gate none → done-me
18/08 10:40  constat écart PLT-119 : aucun écart · SPEC intacte · pas de dette
```

## Rapport de livraison

- **ce qui a changé** — `pact/identite/CH-01-TECHNICAL-plier/CH.md` : « Aujourd'hui » relevé (`core/identity` + `features/administration/iam`) ; AC précisés (includes `:platform:identite:identity` · `:platform:identite:iam`, routes `/api/tenants` · `/api/public/invitations`, noms `identite-*`) ; coupe web AC-2 écrite. SPEC intacte. Pas de canvas, pas de 00-PLAN.
- **critères prouvés** — AC gelés pour l'exec : `identite-plier-arbre` → AC-1,2,3,5 ; suite `identite-*` → AC-4. État initial : backend encore sous `core/identity` et `features/administration/iam`.
- **décidé seul** — settings / app-settings / user-settings **hors plier** (SPEC `not_owns`, INIT). Deux sous-modules sous l'arbre `identite/`, pas de parent Gradle vide. Web de ce BC = membres seulement (`iam/members`). Hors arbre = `iam/roles/` (socle) · `user-settings` · shell `administration.routes.ts`. Dossiers Java `ma/nafura/core/` et FQCN `ma.nafura.platform.identity` / `ma.nafura.platform.administration.iam` restent. Rôles custom / domaines restent dans le jar iam (pas d'extraction).
- **écarts / dette** — aucun. Exec = PLT-119. Pas de question bloquante.
