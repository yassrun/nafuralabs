---
id: SEKTOR-235
status: todo
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-232, SEKTOR-233, SEKTOR-234]
tags: [qa, e2e, al-qods]
---

# Prouver Al Qods mois 1 attachement situation

> Rejouer SCENARIO septembre bout en bout sur graphe API Al Qods (pas DE-0103).

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-M1..M12 · [`../SCENARIO.md`](../SCENARIO.md) discriminants.

## Étapes

- [ ] Script `verify-alqods-situation-mois1-235.mjs` : fabrique graphe, avancement, attachement, situation.
- [ ] Gold JSON sous `fixtures/al-qods/situation-mois1/expected/`.
- [ ] Discriminants : interne absent, étanchéité 0 m², sans signature refusé, rôles.
- [ ] Captures desktop/390 si Browser MCP ; sinon skip documenté.
- [ ] `node raster/t.mjs check`.

## Preuves attendues

- `node sektor/e2e/scripts/verify-alqods-situation-mois1-235.mjs` → PASS (Mode B).

## Journal

```
28/08  posée
```

## Rapport de livraison
