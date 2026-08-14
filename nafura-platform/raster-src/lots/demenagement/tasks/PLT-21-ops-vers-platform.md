---

id: PLT-21
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-1, PLT-20]
---

# infra + toolchain/ops + tools/lifecycle vers nafura-platform/ops/

> Canon : *tout ce qui sert plusieurs projets = `nafura-platform/ops/`*.

## Étapes

- [x] `infra/{k8s,keycloak,scripts}` → `nafura-platform/ops/`
- [x] `toolchain/ops/*` → `nafura-platform/ops/`
- [x] `tools/lifecycle` → `nafura-platform/ops/lifecycle`
- [x] Supprimer `infra/`, `toolchain/`, `tools/`

## Preuve de fin

Les dossiers d'origine n'existent plus. Rien n'est perdu.

## Journal

```
13/08 23:21  tsk1  git mv infra/{k8s,keycloak,scripts} → nafura-platform/ops/
13/08 23:21  tsk2  git mv toolchain/ops/* → nafura-platform/ops/
13/08 23:21  tsk3  git mv tools/lifecycle → nafura-platform/ops/lifecycle
13/08 23:21  décision  toolchain/scripts + tools/scripts hors étapes. Pour « rien n'est perdu » + supprimer les parents : git mv → ops/legacy-toolchain-scripts et ops/legacy-tools-scripts. Chemins Makefile/nlops = PLT-22.
13/08 23:22  tsk4  infra/ toolchain/ tools/ absents.

Livré : nafura-platform/ops/{k8s,keycloak,scripts,lifecycle,nlops.sh,…}
```
