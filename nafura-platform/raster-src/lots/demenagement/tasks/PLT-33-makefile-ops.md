---
id: PLT-33
status: done-agent
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-32]
---

# Makefile dans nafura-platform/ops

> L'entrée Make du cycle de vie vit avec `nlops.sh`, plus à la racine du workspace.

## Étapes

- [x] `Makefile` → `nafura-platform/ops/Makefile` (chemins `./nlops.sh`) ; délégué mince `nafura-platform/Makefile`
- [x] Drop des cibles Gradle Sektor (`build-sektor` / `compile-sektor` / alias `*-sektor`)
- [x] Recettes live : `make -C nafura-platform/ops …` (docs ops + AGENTS)
- [x] Plus de `Makefile` à la racine ; délégué `nafura-platform/Makefile` → `ops/`

## Preuve de fin

Pas de `Makefile` à la racine. Cibles dans `nafura-platform/ops/Makefile`. `nafura-platform/Makefile` délègue vers `ops/`. (`make` absent du PATH de ce git bash — pas d'exécution `help` ici.)

## Journal

```
14/08 00:35  tsk1  Makefile → nafura-platform/ops/Makefile (./nlops.sh). Délégué nafura-platform/Makefile → ops/. Racine sans Makefile.
14/08 00:35  tsk2  Drop build-sektor / compile-sektor / deploy-sektor / provision-db-sektor / migrate-sektor.
14/08 00:36  tsk3  Recettes live : make -C nafura-platform/ops … (ops/AGENTS, ops/README, nlops, docs/AGENTS, sektor, venue-catalog). Doublon SECRETS_FILE dans AGENTS.md corrigé en passant.
14/08 00:37  preuve  Pas de Makefile racine. make absent du PATH git bash (cette machine) — pas d'exécution help ici. Cibles et délégué en place.

Livré : Make vit dans nafura-platform/ops
```
