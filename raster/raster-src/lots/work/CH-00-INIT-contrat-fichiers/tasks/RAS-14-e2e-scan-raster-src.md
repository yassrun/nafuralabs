---
id: RAS-14
status: doing
context: nafura
kind: task
type: feature
priority: P1
assignee: either
gate: qa
parent: RAS-11
sprint: 2026-W33
feature: contrat-fichiers
tags: [raster, e2e]
---

# e2e — scan raster-src ignore pact

> Preuve INIT : l’ancienne vérité (scan-only `products/*/docs/specs`) échoue ; la nouvelle passe.

## Critères d'acceptation
- [x] `raster/e2e/work/scan-raster-src.test.mjs` vert
- [x] Trouve `MIG-11` sous peer `raster-src`
- [x] Aucun fichier sous `pact/` dans le scan

## Journal
```
13/08 16:20  task e2e ouverte
13/08 16:30  node --test vert (3 tests)
```
