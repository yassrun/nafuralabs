---
id: SEKTOR-298
status: todo
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
tags: [homog]
---

# Scripts verify-homog Mode B et gates rg

> 2 lignes max.

## Étapes

- [x] verify-homog-etudes.mjs
- [x] verify-homog-chantiers.mjs
- [x] verify-homog-catalogue.mjs
- [x] verify-homog-achats.mjs
- [x] verify-homog-aggregate.mjs (gates vs baseline)

## Journal

```
31/08 12:01  posée
31/08 12:20  scripts verts (source gates)
```

## Rapport de livraison

ce qui a changé
- `sektor/e2e/scripts/verify-homog-etudes.mjs`
- `sektor/e2e/scripts/verify-homog-chantiers.mjs`
- `sektor/e2e/scripts/verify-homog-catalogue.mjs`
- `sektor/e2e/scripts/verify-homog-achats.mjs`
- `sektor/e2e/scripts/verify-homog-aggregate.mjs`

preuves exécutées
- les 5 scripts → PASS ; residual counts ≤ baseline 31/08 sur etudes/achats/catalogue/chantiers
- `node raster/t.mjs check` — 0 erreur

décidé seul
- preuves source-first (comme verify-ux-pro-lookups) ; Mode B browser non requis pour ces gates chrome

écarts / dette
- dumps catalogue résiduels documentés SEKTOR-294 ; MatDialog hors lot ; Marchés hors lot
