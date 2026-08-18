---
id: RAS-104
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
blocked_by: [RAS-103]
tags: [raster, e2e]
---

# Preuves — plus de sprint dans le moteur

> 2 lignes max.

## Étapes

- [x] exécuter `node --test raster/e2e/work/*.mjs`
- [x] relier AC-1…6 à une preuve exécutée
- [x] vérifier discrimination (journal RAS-103 vu-rouge 5/5 + suite verte)
- [x] rapport + done-agent

## Journal

```
16/08 14:28  posée
18/08 10:46  sprint → 2026-W34
18/08 10:55  status → doing
18/08 10:56  e2e work : 34 pass / 0 fail · check 0 erreurs · 32 warnings
             t.mjs sprint = commande inconnue · SPRINT.md absent
             INDEX.tsv sans colonne sprint · SPEC.md 0 occurrence sprint
             vu-rouge RAS-103 (18/08 10:51) : 5 fail / 0 pass — relie AC-1…4
18/08 10:56  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      moteur sans sprint (prouvé, RAS-103 non retouchée) · `sans-sprint.test.mjs` + suite `e2e/work/` verts
critères prouvés     AC-1 ok 16+17 sans-sprint.test.mjs · AC-2 ok 18 + `t.mjs sprint` → « commande inconnue » exit 1 · AC-3 ok 19 + `SPRINT.md: ABSENT` · AC-4 ok 20 + en-tête INDEX `id status priority context assignee gate type agent_type project lot souslot title` · AC-5 `check — 48 tasks · 0 erreurs · 32 warnings` = check AVANT RAS-103 · AC-6 `rg -i sprint raster/pact/work/SPEC.md` → 0 match ; INV-3 = « Seule la task est un ticket »
décidé seul          aucun — RAS-103 laissée done-me · AC-6 prouvé par grep (pas d'e2e dédié, le CH ne l'exigeait pas)
écarts / dette       aucun sur ce CH · discrimination AC-1…4 = journal RAS-103 5/5 vu-rouge, non rejouée (pas le diff)
