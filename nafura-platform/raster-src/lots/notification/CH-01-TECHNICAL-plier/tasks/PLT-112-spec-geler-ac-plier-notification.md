---
id: PLT-112
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-111]
tags: [platform, notification]
---

# SPEC + geler AC — plier notification

> Geler les AC du plier notification. Pas de patch SPEC.

## Étapes

- [x] Lire SPEC notification + forme CH commentaire / approbation-plier
- [x] Relever include Gradle, chemins web/e2e, FQCN, routes HTTP
- [x] Trancher AC-2 (web de ce BC vs consommateur) — décidé seul
- [x] Préciser AC-1…5 + table Preuves (sens inchangé)
- [x] Pas de patch SPEC · pas de canvas · pas de 00-PLAN · pas de nouvelle task

## Journal

```
16/08 14:15  posée
18/08 10:13  sprint → 2026-W34
18/08 10:15  status → doing
18/08 10:26  AC précisés (chemins collaboration/notification + features/notifications, include, FQCN, 4 routes) · coupe web tranchée · SPEC intacte
18/08 10:27  status → done-agent · gate none → done-me
18/08 10:18  status → done-agent · gate none → done-me
18/08 10:29  constat écart PLT-113 : livré = AC · centre à la racine dans AC-2 · SPEC inchangée · pas de dette
```

## Rapport de livraison

- **ce qui a changé** — `pact/notification/CH-01-TECHNICAL-plier/CH.md` : « Aujourd'hui » relevé (backend `features/collaboration/notification/`, web dispersé, include actuel) ; AC précisés (include `:platform:notification`, `projectDir` `notification`, 4 routes HTTP, noms `notification-*`) ; coupe web AC-2 écrite. SPEC intacte. Pas de canvas, pas de 00-PLAN.
- **critères prouvés** — AC gelés pour l'exec : `notification-plier-arbre` → AC-1,2,3,5 ; suite `notification-*` → AC-4. État initial : backend encore sous `features/collaboration/notification`.
- **décidé seul** — include cible = `:platform:notification` + `projectDir` `notification` (forme documents/impression). Web de ce BC = widgets+API `collaboration/notification` **et** écran centre `features/notifications`. Consommateur (n'entre pas) = shell · `administration/email-templates/` (transport) · anatomy `send-email-dialog` / `entity-email-api` · produit (Sektor + alertes ERP). Dossier Java `ma/nafura/notification/` et FQCN `ma.nafura.platform.collaboration.notification` restent.
- **écarts / dette** — wrappers `e2e/notification/` et `NotificationBaselineTest` non visibles dans cet arbre d'intégration (livrés worktree CH-00, PLT-110/111) ; AC-3 gelé sur les 4 noms CH-00. Exec = PLT-113. Pas de question bloquante.
