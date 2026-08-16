---
id: RAS-97
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
tags: [raster, ui]
---

# Vue Ce qui tourne

> 2 lignes max.

## Étapes

- [x] Vue **En cours** dans la nav, avec compteur
- [x] Sortie de chaque lot tenu, bouton Arrêter
- [x] Sondage seulement quand un lot tourne
- [x] « Lancer » réel quand une commande est configurée

## Journal

```
16/08 13:45  posée
16/08 13:57  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `App.tsx` — vue `EnCoursView`, sondage conditionnel, `OrchLaunchButton` qui lance · `api.ts` — type `Lance`, `running` / `run` / `stopRun` · `raster-api.ts` — `/api/running`, `/api/run`, `/api/stop`
critères prouvés     lancement depuis l'API vérifié en vrai : lot tenu puis libéré, sortie capturée, `recent` renseigné · l'UI affiche « fini · raster / socle · socle/CH-01-EVOL-panneau-decision » · sans commande configurée, la vue le dit et le bouton retombe sur « Orchestrer » · zéro erreur console
décidé seul          le sondage ne tourne **que** tant qu'un lot est tenu — une app qui interroge le serveur en permanence pour rien est une app qu'on finit par fermer. · le bouton change de nom et de couleur selon `spawnPret` : un bouton qui échoue en silence est pire qu'un bouton qui annonce ce qu'il sait faire.
écarts / dette       sondage à 2 s, pas de flux : la sortie d'un agent bavard arrive par à-coups · 40 dernières lignes seulement dans l'UI, 400 gardées côté serveur
