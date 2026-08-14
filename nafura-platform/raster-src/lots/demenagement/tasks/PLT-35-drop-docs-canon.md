---

id: PLT-35
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-34]
---

# Sortir docs/ du rôle de canon

> Plus de `docs/AGENTS.md`. Porte = `NAFURALABS.md`. Ops = `nafura-platform/ops/AGENTS.md`. Raster = `raster/AGENTS.md`.

## Étapes

- [x] `CLAUDE.md` lit `NAFURALABS.md` en premier ; citations live retargetées
- [x] Supprimer `docs/` (`AGENTS.md`, `README.md`, `Raster.md`) et `FRAMEWORK_BLUEPRINT.md`
- [x] `raster/AGENTS.md` : plus de miroir `docs/Raster.md` ; e2e secrets sans `docs/AGENTS.md`

## Preuve de fin

Aucun lien live vers `docs/AGENTS.md`. `node raster/t.mjs check` 0 erreur.

## Journal

```
14/08 00:44  tsk1  CLAUDE.md → NAFURALABS.md en premier. sektor / venue / corporate / ops README+AGENTS retargetés. ARCHITECTURE.md web aussi.
14/08 00:44  tsk2  docs/ supprimé (AGENTS, README, Raster). FRAMEWORK_BLUEPRINT déjà absent. raster/AGENTS plus de miroir. e2e secrets → NAFURALABS.md.
14/08 00:44  tsk3  mbs-studio README toolchain/ops → inbox.

Livré : plus de canon docs/
```
