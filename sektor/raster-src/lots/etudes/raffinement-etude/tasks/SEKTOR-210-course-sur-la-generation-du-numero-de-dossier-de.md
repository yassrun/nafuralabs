---
id: SEKTOR-210
status: todo
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: me
tags: [etudes, concurrence]
---

# Course sur la génération du numéro de dossier (DE-xxxx)

> Défaut pré-existant exposé par QA 208 (specs parallèles) : genererNumero() = count+1 sans retry alors que son Javadoc promet « l'appelant retente » ; sous création concurrente, deux inserts lisent le même count → violation dossiers_etude_numero_uk → 500 INTERNAL_ERROR. Fix : allocation du numéro dans une transaction fraîche avec retry borné sur DataIntegrityViolation, ou séquence DB.

## Étapes

- [ ] …

## Journal

```
26/08 21:25  posée
```

## Rapport de livraison
