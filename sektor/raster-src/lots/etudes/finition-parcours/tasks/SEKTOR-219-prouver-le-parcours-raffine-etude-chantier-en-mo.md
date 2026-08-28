---
id: SEKTOR-219
status: todo
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-218]
tags: [etudes, chantiers, mode-b]
---

# Prouver le parcours raffine Etude-Chantier en Mode B

> Verdict indépendant des scénarios AC-17. Graphe créé par API. Skip propre si Mode B down.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-17. Owner sauf si un AC nomme un alias.

## Étapes

- [ ] Rejouer les 9 scénarios du contrat sur `qa-local`.
- [ ] Captures desktop + 390 (gain bloqué, conversion, liste devis, chantier, catalogue, checklist, IA).
- [ ] Vérifier qu'un 100 % coûts non établis ne passe ni UI ni `POST /gagne`.
- [ ] Confirmer hors périmètre : pas de DA/BL/clôture exigés ici.
- [ ] `node raster/t.mjs check`.

## Preuves attendues

- Script ou observations nommées par scénario, rôles, URLs, artefacts.
- Verdict AC par AC. Écarts restants listés, pas absorbés.

## Journal

```
27/08 21:58  posée
```

## Rapport de livraison

