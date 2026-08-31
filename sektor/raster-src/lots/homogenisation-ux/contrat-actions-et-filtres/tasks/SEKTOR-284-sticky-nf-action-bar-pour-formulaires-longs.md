---
id: SEKTOR-284
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [homog, ux]
---

# Sticky nf-action-bar pour formulaires longs

> 2 lignes max.

## Étapes

- [x] input `sticky` sur `nf-action-bar` + classe CSS sticky bas

## Journal

```
31/08 12:01  posée
31/08 12:05  sticky livré anatomy
31/08 12:02  status → doing
31/08 12:02  status → done-agent · gate none → done-me
31/08 12:13  status → doing
31/08 12:13  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé
- `nafura-platform/.../action-bar.component.ts` — `sticky = input(false)` + `.nf-action-bar--sticky`

preuves exécutées
- revue code locale

décidé seul
- tokens fallback `--nf-surface-page` / `--nf-border-default`

écarts / dette
- aucune
