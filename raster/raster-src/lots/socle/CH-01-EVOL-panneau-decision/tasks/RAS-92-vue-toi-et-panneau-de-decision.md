---
id: RAS-92
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [raster, ui]
---

# Vue Toi et panneau de decision

> La question d'abord, le rapport ensuite, le reste replie.

## Étapes

- [x] Vue **Toi** en tête de nav, avec compteur
- [x] Détail : bandeau, question, actions, rapport — puis le reste replié
- [x] Sélecteur de statut sans `done-me` · action « Approuver »
- [x] Readiness marquée sur chaque sous-lot du Backlog
- [x] Briefs repointés sur le skill et les agents réels

## Journal

```
16/08 13:35  posée
16/08 13:43  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `src/App.tsx` réécrit (1 407 → ~1 000 lignes) · `src/api.ts` — types `Ready`, champs `question` / `rapport` / `attend`, `demande()`, briefs repointés · `src/styles.css` +120 lignes (bandeau, question, file d'attente, plis, pastilles de readiness)
critères prouvés     AC-1 la vue Toi liste l'attente avec ce qu'on demande — vérifié en vrai sur `PLT-81` · AC-2 question et rapport rendus depuis le `.md`, rapport ouvert par défaut quand ça t'attend · AC-3 `STATUS_CHOICES` sans `done-me` · AC-4 « ▸ lançable » sur `CH-01-EVOL-panneau-decision` dans l'arbre · AC-6 plus aucun `nafura-*` · navigateur : zéro erreur console
décidé seul          j'ai **gardé un sélecteur de statut** (sans `done-me`) alors que le wireframe le supprimait : poser `doing` ou `blocked` à la main reste utile, et AC-3 n'interdit que `done-me`. Le wireframe est plus radical que le critère gelé — j'ai suivi le critère. · Tri de la file par **id croissant** et non par ancienneté réelle : aucune task ne porte d'horodatage de création, et l'id est l'ordre de création. Le wireframe promettait « depuis 2 h », ce que les données ne permettent pas.
écarts / dette       pas d'horodatage d'entrée en attente — impossible de dire depuis combien de temps une task t'attend · le bouton « Orchestrer » copie toujours un brief : le spawn est sous la borne · pas de vue « ce qui tourne », faute d'état d'exécution
