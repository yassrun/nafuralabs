---
id: RAS-103
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [RAS-102]
tags: [raster, cli]
---

# Retirer le champ, la commande et SPRINT.md

> 2 lignes max.

## Étapes

- [x] check AVANT — journaler le nombre d'erreurs
- [x] e2e d'absence vu-rouge (assert l'absence, échoue tant que sprint existe)
- [x] retirer `sprint:` des frontmatters · moteur · commande · SPRINT.md · colonne INDEX
- [x] e2e `raster/e2e/work/` verte · check = même nombre d'erreurs

## Journal

```
16/08 14:28  posée
18/08 10:46  sprint → 2026-W34
18/08 10:47  status → doing
18/08 10:50  status → doing
18/08 10:50  check AVANT : 0 erreurs · 32 warnings
18/08 10:51  vu-rouge : node --test raster/e2e/work/sans-sprint.test.mjs → 5 fail / 0 pass
             AC-1 write.mjs contient encore « sprint »
             AC-1 47 fichiers avec clé sprint: (PLT-* + RAS-102/103/104/105/106)
             AC-2 t.mjs -h propose encore sprint
             AC-3 raster/SPRINT.md est encore là
             AC-4 colonne sprint encore dans l'en-tête INDEX
18/08 10:55  retrait : write.mjs (setSprint) · regen.mjs (writeSprint, colonne, ligne BACKLOG) · t.mjs (commande + aide) · 47 clés frontmatter · SPRINT.md
18/08 10:56  e2e work : 34 pass / 0 fail · check APRÈS : 0 erreurs · 32 warnings · t.mjs sprint = commande inconnue · status RAS-103 doing OK
18/08 10:51  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `write.mjs` / `regen.mjs` / `t.mjs` : plus de sprint · `SPRINT.md` supprimé · colonne ôtée de INDEX.tsv · 47 clés `sprint:` retirées du frontmatter · preuve `e2e/work/sans-sprint.test.mjs`
critères prouvés     AC-1 moteur + frontmatter (grep / e2e) · AC-2 `t.mjs sprint` inconnue, `-h` sans sprint · AC-3 fichier absent, `index` ne le recrée pas · AC-4 en-tête INDEX sans colonne · AC-5 check 0→0 erreurs (32 warnings inchangés) · AC-6 déjà vrai (RAS-102), SPEC non retouchée
décidé seul          `isoWeekInfo` reste exporté (le socle l'importe encore) — zéro occurrence du mot sprint · `check.mjs` inchangé, pas de champ mort (décision RAS-102) · strip one-shot des clés, pas une commande CLI · app laissée en inbox
écarts / dette       `raster-api.ts` / `api.ts` / e2e socle `api-delegue` importent encore `setSprint` → CH-03 RAS-105/106 (inbox) · AGENTS.md / CADRE / POL-VUES-GENEREES hors périmètre · le mot sprint reste dans titres et journaux des tasks
