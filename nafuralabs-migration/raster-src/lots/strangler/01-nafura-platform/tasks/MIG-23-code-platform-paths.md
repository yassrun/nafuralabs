---
id: MIG-23
status: todo
context: nafura
kind: task
type: physical
priority: P1
assignee: either
gate: me
parent: MIG-20
blocked_by: [MIG-22]
feature: platform-code
tags: [nafura-platform]
---

# Code platform → nafura-platform/

> git-mv `platform/` (et chemins Gradle). Apps **pointent encore** `project(":platform:…")` un temps.
> Pas de packages Maven/npm versionnés dans cette task.

## Critères d'acceptation
- [ ] Sources platform sous `nafura-platform/`
- [ ] Build Gradle/npm des apps encore vert
- [ ] Pas de découplage `client-*` ici (→ MIG-41)

## Journal
```
13/08 12:10  task créée
```
