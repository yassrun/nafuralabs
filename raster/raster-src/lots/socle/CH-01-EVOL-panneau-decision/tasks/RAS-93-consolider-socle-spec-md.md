---
id: RAS-93
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
tags: [raster, pact]
---

# Consolider socle/SPEC.md

> 2 lignes max.

## Étapes

- [x] Capacités : file d'attente, panneau de décision, readiness affichée
- [x] Contrats : écriture déléguée, readiness affichée telle quelle, `attend` dérivé serveur
- [x] `POL-ECRITURE-CLI`
- [x] Liens : le socle consomme aussi `orchestration`

## Journal

```
16/08 13:35  posée
16/08 13:43  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `pact/socle/SPEC.md` — intention (arbitrer, pas piloter) · 2 capacités neuves · 3 contrats de consommation · `POL-ECRITURE-CLI` · liens vers `orchestration` et le second canvas
critères prouvés     revue : chaque capacité nomme son consommateur · `POL-CAPTURE-INBOX` dit maintenant *pourquoi* l'inbox est l'exception, au lieu de la laisser paraître incohérente avec la nouvelle politique
décidé seul          `attend` est déclaré **dérivé côté serveur** dans les contrats — le front pourrait le recalculer, mais deux définitions de « ça m'attend » divergeraient au premier changement de règle
écarts / dette       le canvas `socle-wireframe.canvas.tsx` décrit encore la nav sans « Toi » — les deux canvas se recouvrent partiellement
