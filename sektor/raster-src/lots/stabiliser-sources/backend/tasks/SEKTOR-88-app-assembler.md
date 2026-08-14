---

id: SEKTOR-88
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-87]
---

# app/ = assembler Spring Boot

> Les adapters métier encore sous `backend/app/` rejoignent leur module existant. `app/` ne boot plus que l’application.

## Étapes

- [x] `app/…/etudes/*` → `modules/etudes`
- [x] `app/…/catalogue/*` → `modules/catalogue`
- [x] `ErpApplication` + gradle boot restent dans `app/`
- [x] `cd sektor/sources/backend && ./gradlew :sektor:app:bootJar` VERT

## Preuve de fin

`bootJar` VERT. `app/src` sans package métier `etudes` / `catalogue`.

## Journal

```
14/08 11:18  tsk1  git mv app/…/etudes (+ tests) → modules/etudes (package ma.nafura.erp.etudes inchangé)
14/08 11:18  tsk2  git mv app/…/catalogue (+ tests) → modules/catalogue (package inchangé)
14/08 11:19  tsk3  deps adapters : etudes += partner/chantiers/marches/approbations + doc-extractor ; catalogue += item + doc-extractor
14/08 11:20  preuve  ./gradlew.bat :sektor:app:bootJar BUILD SUCCESSFUL (1m 22s)
```

## Rapport de livraison

ce qui a changé      adapters `etudes`/`catalogue` relogés dans leurs jars ; `app/` ne contient plus que `ErpApplication` + resources boot
critères prouvés     n/a (tech) — `:sektor:app:bootJar` VERT ; plus de package Java `etudes`/`catalogue` sous `app/src`
décidé seul          packages Java conservés (`ma.nafura.erp.etudes` / `ma.nafura.erp.catalogue`) pour limiter le churn d’imports
écarts / dette       `db/changelog/data/v1.1/002_l4_etude_permissions.sql` reste dans `app/` (hors `etudes/**` Java) ; scan `ma.nafura.sektor` toujours absent de `ErpApplication` (préexistant)
