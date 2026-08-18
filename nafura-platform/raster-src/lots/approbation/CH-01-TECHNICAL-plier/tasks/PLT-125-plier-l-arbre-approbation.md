---
id: PLT-125
status: doing
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-124]
tags: [platform, approbation]
sprint: 2026-W34
---

# Plier l arbre approbation

> 2 lignes max.

## Étapes

- [ ] tsk1 — écrire `approbation-plier-arbre` (chemins) ; le voir rouge
- [ ] tsk2 — bouger backend `features/collaboration/workflow` → `approbation` ; include Gradle `:platform:approbation`
- [ ] tsk3 — bouger web widgets + écrans chaînes sous `app/approbation/` ; repoint imports
- [ ] tsk4 — repoint `project()` / `_gradle.mjs` / `block.descriptor` → `:platform:approbation`
- [ ] tsk5 — `node --test nafura-platform/e2e/approbation/*.test.mjs` vert (plier + 6 baseline)
- [ ] tsk6 — rapport de livraison + `done-agent`

## Journal

```
16/08 14:15  posée
18/08 01:24  sprint → 2026-W34
18/08 01:31  status → doing
18/08 01:35  tsk1 — test de chemins écrit ; run rouge avant le move
```

## Rapport de livraison
