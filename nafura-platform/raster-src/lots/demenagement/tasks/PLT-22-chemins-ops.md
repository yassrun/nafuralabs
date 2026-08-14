---

id: PLT-22
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-21]
---

# Corriger les chemins de la toolchain

## Étapes

- [x] `nlops.sh` : `$ROOT/...` pour overlays, lifecycle, secrets
- [x] `Makefile` : cibles `stg-up`, `dev-up`, `prod-up`
- [x] Scripts hosts PowerShell
- [x] `nafura-platform/ops/AGENTS.md` : tableau des overlays

## Preuve de fin

Un déploiement staging passe de bout en bout. Identique au lot 0.

## Journal

```
13/08 23:24  tsk1  nlops.sh $ROOT déjà sur nafura-platform/ops/{k8s,lifecycle,keycloak,scripts,secrets}. ROOT=../.. (repo) OK.
13/08 23:24  tsk2  Makefile NLops = bash nafura-platform/ops/nlops.sh — stg-up/dev-up/prod-up.
13/08 23:24  tsk3  hosts ps1 : pas de toolchain/infra ; restore → nafura-platform/ops/restore-staging-hosts.ps1
13/08 23:24  tsk4  AGENTS.md tableau : ligne infra (lab) → ops/k8s/overlays/infra/${ENV}
13/08 23:25  tsk5  kustomize infra staging 1169 lignes. preflight VERT. infra-up + deploy sektor-btp (sans rebuild) appliqués. web Running. backend CrashLoop déjà 8j (lot 0). Pas de stg-up BUILD_IMAGES (Gradle OOM PLT-1).

Livré : chemins ops cohérents · overlay infra appliqué depuis nafura-platform/ops/
```
