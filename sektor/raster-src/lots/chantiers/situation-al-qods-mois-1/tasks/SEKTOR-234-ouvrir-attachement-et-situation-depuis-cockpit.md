---
id: SEKTOR-234
status: todo
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-231]
tags: [chantiers, cockpit, ux]
---

# Ouvrir attachement et situation depuis cockpit

> Routes fin de mois avec `chantierId` ; prochaine action post-situation pointe le vrai trou.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-M8, AC-M11, AC-M12 · Scénario § cockpit lendemain.

## Étapes

- [ ] Cockpit / fiche chantier `EN_COURS` : actions attachement + situation (conducteur).
- [ ] Onglet situations : génération sans marché (référence devis) — aligner 186 si gap.
- [ ] `nextActions` après situation n1 ≠ « saisir avancement septembre ».
- [ ] RBAC échantillon chef / conducteur / daf sur actions cockpit.

## Preuves attendues

- Extension helpers 221 ou grep routes + test read-model cockpit.

## Journal

```
28/08  posée
```

## Rapport de livraison
