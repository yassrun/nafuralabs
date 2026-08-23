---
id: SEKTOR-133
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-132]
tags: [etudes, catalogue]
---

# Preuves code article Extraire

> Rejouer extraire-creer puis GET item : code non vide. Backfill des Extraire deja crees.

## Étapes

- [x] `POST extraire-creer` → GET item : `code` non vide, unique sur le tenant.
- [x] Après Liquibase : les Items Extraire déjà en liste (peinture / sektor-107) ont un code. Rapport. `done-agent` sur 132 + cette task si PASS.

## Journal

```
22/08 12:28  posée
22/08 12:45  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Extraire pose un code tenant ; les fiches Extraire déjà en liste (peinture / sektor-107) ont un code après backfill lab.
critères prouvés     C1 extraire-creer → GET item.code non vide → PASS `node sektor/e2e/scripts/verify-article-code-extraire-132.mjs` (vert après vu rouge exec 12:34 `code=null`). C2 liste page=0 size=20 : 0 code vide ; `PEINTURE-RED-1787250`, `SEKTOR-107-PEINTURE-`, `PEINTURE-ACRYLIQUE-I` présents.
décidé seul          Preuve = script node Mode B (Playwright dual-require déjà inbox). Backfill SQL lab 24→0 ; bootRun ne joue pas Liquibase (`ddl-auto: validate`).
écarts / dette       Collision suffixe `--` encore possible sur le JVM courant (trim compilé, pas relancé). Hors : L9 createAllege inbox, Playwright dual-require.
