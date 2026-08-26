---
id: SEKTOR-190
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [qa, mode-b]
---

# One-shot make mode-b pour lancer Mode B

> Commande unique make -C nafura-platform/ops mode-b : env + PF + bootRun + start:erp:cursor. Stop dedie. Contrat agents.

## Étapes

- [x] `make mode-b` / `mode-b-stop` + `mode-b.sh`
- [x] `dev-staging-local.sh start` lance bootRun + `start:erp:cursor` (idempotent)
- [x] Contrat agents (rule + Spec/Code/QA/Orch)

## Preuves attendues

- `node sektor/e2e/scripts/verify-mode-b-cmd-190.mjs`
- `bash -n nafura-platform/ops/mode-b.sh`

## Journal

```
26/08 11:22  posée
26/08 11:28  one-shot + docs agents
26/08 11:25  status → doing
26/08 11:25  status → doing
26/08 11:25  status → done-agent · gate none → done-me
```

## Rapport de livraison

One-shot `make -C nafura-platform/ops mode-b` : env Cursor, port-forward Postgres, bootRun, `start:erp:cursor`. Attend 8082 puis 4200. Idempotent si déjà up. Stop : `mode-b-stop`.

`dev-up` reste prep-only. Contrat agents mis à jour (rule + 4 skills).

Preuve : `verify-mode-b-cmd-190.mjs` PASS. Pas de lancement réel ici (infra K8s hors de cette task).

Décidé seul : Sektor only pour le start ; les autres apps gardent la recette `dev-up`.
