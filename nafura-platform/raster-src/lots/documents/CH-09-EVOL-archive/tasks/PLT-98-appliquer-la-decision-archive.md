---
id: PLT-98
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [PLT-97]
tags: [platform, documents]
sprint: 2026-W33
---

# Appliquer la decision archive

> 2 lignes max.

## Étapes

- [x] tsk1 — Prouver rouge : `documents-archive-absent` voit encore `ARCHIVED`
- [x] tsk2 — Drop `DocumentStatus.ARCHIVED` (enum BC documents)
- [x] tsk3 — `documents-tenu-retrait` : déposer puis retirer, ligne marquée, octets partis
- [x] tsk4 — Suite `documents-*` verte
- [x] tsk5 — Rapport + `review`

## Journal

```
16/08 14:15  posée
16/08 14:22  sprint → 2026-W33
16/08 14:26  status → doing
16/08 14:27  worktree créé : ../.raster-worktrees/nafura-platform/CH-09-EVOL-archive (branche documents/CH-09-EVOL-archive) ; Pact lu depuis l'intégration
16/08 14:28  tsk1 rouge : documents-archive-absent → DocumentStatus.java contient encore ARCHIVED
16/08 14:29  tsk2 drop ARCHIVED de l'enum (plus aucune occurrence dans src/main du BC)
16/08 14:30  tsk3 DocumentsUnifierTest.tenuRetrait + e2e documents-tenu-retrait
16/08 14:32  tsk4 suite documents-* 29/29 verte (archiveAbsent + tenuRetrait dans le XML JUnit)
16/08 14:32  status → review
16/08 14:35  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Drop `DocumentStatus.ARCHIVED`. Enum = `UPLOADED | DELETED`. e2e `documents-archive-absent` + `documents-tenu-retrait` + JUnit `archiveAbsent` / `tenuRetrait`.
critères prouvés     AC-2 → scan src/main + `valueOf("ARCHIVED")` IllegalArgumentException. AC-3 → tenu déposé puis `DELETED`, octets absents, usage 0. AC-4 → pas de champ/méthode `archiv*`, status déposé = UPLOADED. AC-5 → 29/29 `documents-*` verts.
décidé seul          Pas de migration Liquibase : `status` est VARCHAR(30), pas d'enum SQL ; le changelog `document` vit dans impression (hors périmètre). Champ `status` conservé (cycle déposé/retiré). Tests dans Baseline + Unifier, pas une classe dédiée.
écarts / dette       Aucun. `ConversationStatus.ARCHIVED` et le ruban UX `document-status-ribbon` non touchés (hors CH).

