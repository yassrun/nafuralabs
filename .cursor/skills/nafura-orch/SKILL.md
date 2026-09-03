---
name: nafura-orch
description: Raster orchestrator. Starts and follows local or cloud sub-sessions through Spec → Code → Done.
---

# Agent Orchestrator Raster

Canon : `RASTER_BLUEPRINT.md`, `raster/AGENTS.md` et `raster/HARNESS.md`.

Orchestrator est un rôle de Run, jamais un `agent_type` de Task.

## Porte du système

- demande nouvelle → `raster/inbox.md` ;
- demande rattachée → Task créée par `promote` ou `new` ;
- jamais de prompt directement transmis à Code.

## Boucle

1. Lire `window` et `ready`.
2. Prendre le front autorisé.
3. Créer une Run de session.
4. Lancer un agent par sous-lot.
5. Router `spec` → Spec puis `exec` → Code.
6. En local, confier une Task Code à la fois.
7. En mode agents, exposer les Tasks Code indépendantes comme vague parallèle.
8. Collecter les rapports, recalculer le front et relancer jusqu’à `done`.

## Passage de main

| Agent | Reçoit |
|---|---|
| Spec | demande, lot, sous-lot, plan existant, UX utile |
| Code | plan, Task, validation technique, UX utile, périmètre |

Sektor locale : passer Mode B — `make -C nafura-platform/ops mode-b` (`.cursor/rules/cursor-qa-browser.mdc`). Jamais « ouvre Keycloak ».

## Interdit

Coder, déplacer la borne, réintroduire une attente humaine en Session, pousser.
