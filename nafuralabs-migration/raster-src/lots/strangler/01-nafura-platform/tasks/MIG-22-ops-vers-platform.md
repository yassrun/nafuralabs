---
id: MIG-22
status: todo
context: nafura
kind: task
type: physical
priority: P1
assignee: either
gate: me
parent: MIG-20
blocked_by: [MIG-21]
feature: platform-ops
tags: [nafura-platform, ops]
---

# Ops lab → nafura-platform/ops

> `infra/` + `toolchain/ops` + `tools/lifecycle` → `nafura-platform/ops/`.
> Aliases `nlops` / `dev-up` / `stg-up` / `prod-up` restent valides.

## Critères d'acceptation
- [ ] Cluster, PG, Keycloak, Vault, MinIO, nlops, lifecycle sous `nafura-platform/ops/`
- [ ] `stg-up` / `dev-up` fonctionnent depuis le nouveau chemin (ou alias)
- [ ] Pas de peer `ops/` à la racine du workspace

## Journal
```
13/08 12:10  task créée
```
