---
id: SEKTOR-178
status: review
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-176, SEKTOR-177]
---

# Front Gantt activités — remplace coquille phases

> Résultat du Gantt activités décrit dans `00-PLAN.md`.

## Étapes

- [x] Brancher `/chantiers/planning` (et onglet si besoin) sur API activités
- [x] Gantt : WBS, dates, liens ; plus de modèle « phases = planning »
- [x] Smoke UI Mode B + status → review

## Journal

```
25/08 00:19  posée
25/08 11:38  PlanningFacade + Gantt branchés API /activites/planning (plus de phases)
25/08 11:38  drawer activité (WBS, zone, quotités, liens) ; fiche chantier → /chantiers/planning?chantier=
25/08 11:38  smoke UI non joué : 4200 et 8082 down
25/08 11:34  status → doing
25/08 11:35  status → review
25/08 13:33  status → done-agent · gate none → done-me
25/08 14:31  status → review
25/08 20:30  status → doing
25/08 20:46  status → review
```

## Rapport de livraison

ce qui a changé      `/chantiers/planning` affiche les activités (WBS, dates, liens FD/DD/FF/DF). Bouton Planning sur la fiche.
critères prouvés     AC-12 — code branché ; smoke navigateur impossible (front/API locaux down).
décidé seul          Onglet « phases » (ChantierPhase / import PDF) laissé — ce n'est pas un 2e Gantt. Création d'activité hors écran (API).
écarts / dette       Smoke Mode B non exécuté. Pas de formulaire de création sur le Gantt.

## Rapport de correction UI — 25/08
- Le CSS DHTMLX est chargé globalement : grille, échelle et barres sont désormais rendues.
- La grille expose Activité, Début, Fin et Avancement ; la hauteur suit le volume réel au lieu d'imposer un canvas vide de 68vh.
- Les échelles utilisent l'API `scales` de DHTMLX ; la granularité Semaine affiche de vraies semaines et les deux activités du scénario QA sont visibles ensemble.
- Preuves : build Angular development vert et constat navigateur sur CH-2026-003 (2 activités, barres 40 % et 0 % visibles).
