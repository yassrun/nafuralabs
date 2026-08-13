---
id: MIG-41
status: todo
context: nafura
kind: task
type: feature
priority: P2
assignee: either
gate: me
parent: MIG-40
blocked_by: [MIG-32]
feature: platform-clients
tags: [conso, nafura-platform]
---

# Conso platform versionnée

> `PLATFORM_CONSUMED` + packages `client-*` / `contracts-*` / `ui-*`.
> Drop des path aliases. Pas tout d’un coup sur toutes les apps si un palier Sektor d’abord.

## Critères d'acceptation
- [ ] Sektor (et autres apps prêtes) dépendent de packages, pas de `project(":platform:…")`
- [ ] Socle de chaque app : liste `PLATFORM_CONSUMED` à jour
- [ ] Plus d’alias path Gradle/npm vers les sources platform

## Journal
```
13/08 12:10  task créée
```
