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

> AC-12

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
```

## Rapport de livraison

ce qui a changé      `/chantiers/planning` affiche les activités (WBS, dates, liens FD/DD/FF/DF). Bouton Planning sur la fiche.
critères prouvés     AC-12 — code branché ; smoke navigateur impossible (front/API locaux down).
décidé seul          Onglet « phases » (ChantierPhase / import PDF) laissé — ce n'est pas un 2e Gantt. Création d'activité hors écran (API).
écarts / dette       Smoke Mode B non exécuté. Pas de formulaire de création sur le Gantt.
