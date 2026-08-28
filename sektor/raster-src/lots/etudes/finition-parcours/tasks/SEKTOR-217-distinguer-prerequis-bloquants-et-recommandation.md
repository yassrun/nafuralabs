---
id: SEKTOR-217
status: todo
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-216]
tags: [chantiers, cockpit]
---

# Distinguer prerequis bloquants et recommandations dans la checklist

> Un chantier EN_COURS sans planning affiche 7/7 prérequis et planning recommandé, pas 7/8 bloquant. Ne pas régresser le refus d'OS.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-15. Ne pas rouvrir SEKTOR-209 hors ce ratio.

## Étapes

- [ ] Séparer prérequis du stade et items recommandés dans le read model cockpit.
- [ ] Planning hors ratio une fois le chantier démarré (ou toujours NON_BLOQUANT palier 1).
- [ ] Conserver : pas de CTA Démarrer s'il reste un bloquant réel.

## Preuves attendues

- `CH-2026-101` (ou graphe équivalent) `EN_COURS` sans activité : ratio prérequis complet, planning recommandé.
- Chantier `EN_PREPARATION` sans dates : bloquant dates, pas de Démarrer.
- Capture cockpit desktop + 390.

## Journal

```
27/08 21:58  posée
```

## Rapport de livraison

