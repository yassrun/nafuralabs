---
id: RAS-102
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [raster, pact]
---

# SPEC + geler AC — retirer le sprint du contrat

> 2 lignes max.

## Étapes

- [x] Préciser AC-1…6 (chemins `raster/write.mjs` · `regen.mjs` · `check.mjs` · `t.mjs` · `INDEX.tsv` · `SPRINT.md`)
- [x] Patcher `raster/pact/work/SPEC.md` — plus de sprint dans données, états, owns, commandes, liens ; INV-3 reformulé
- [x] Rapport + `done-agent` + `index && check`

## Journal

```
16/08 14:28  posée
18/08 10:45  sprint → 2026-W34
18/08 10:45  status → doing
18/08 10:48  AC gelés · SPEC work patchée
18/08 10:48  INV-3 : « seule chose sprintable » → « Seule la task est un ticket. Un lot ou un sous-lot n'en est pas un. »
18/08 10:46  status → done-agent · gate none → done-me
18/08 11:00  constat d'écart RAS-103 — écart : non · SPEC touchée : non · dette : non
             livré = SPEC (déjà patchée RAS-102) : plus de sprint dans write/regen/check/t.mjs · SPRINT.md absent, index ne le recrée pas · INDEX sans colonne · 47 clés ôtées · commandes new·promote·status·approve
             tranché isoWeekInfo exporté : pas un écart — le mot sprint n'y est pas ; le socle l'importe encore (CH-03)
             tranché check.mjs déjà muet : AC-1 tenu, pas un champ mort
             tranché strip one-shot : pas une commande — R-6, liste SPEC inchangée
             tranché setSprint app / api / e2e socle : hors périmètre chrome = CH-03 (inbox + RAS-105/106), pas une dette de ce CH
             CADRE vocabulaire/carte · POL-VUES-GENEREES · AGENTS.md · canvas work : hors Pact de ce CH, pas une dette
```

## Rapport de livraison

ce qui a changé      `pact/work/CH-04-CORRECTION-sans-sprint/CH.md` — AC-1…6 gelés sur les chemins réels · `pact/work/SPEC.md` — sprint retiré du contrat (données, états, owns, commandes, liens, INV-3)
critères prouvés     AC-6 tenu maintenant (SPEC sans le mot sprint) · AC-1…5 gelés pour RAS-103 / RAS-104 — pas exécutés ici
décidé seul          AC-1 = clé `sprint:` dans le frontmatter, pas le mot dans le corps des tasks (les titres de ce CH le portent) · `check.mjs` ne portera pas `sprint` même comme champ mort — l'absence dans le moteur est le test, contrairement à `parent:` resté dans la liste morte · INV-3 sans aucune notion sprint : seule la task est un ticket
écarts / dette       constat RAS-103 : **non**. CADRE / POL-VUES / nav / canvas / AGENTS.md = hors périmètre (CH-03 ou hors Pact), pas une dette de ce CH.
