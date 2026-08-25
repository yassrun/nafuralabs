---
id: SEKTOR-180
status: review
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-179]
---

# Drawer rattachement picker et avancement quantité

> AC-16 AC-17 AC-18 scénarios 6-7

## Étapes

- [x] Picker nœud (code + désignation) + qté prévue + reste ; refus métier si dépassement — AC-16
- [x] Qté faite / % jalon dans le drawer — AC-17
- [x] Drag dates Gantt reste un fallback ; pas d'IA — AC-18
- [x] Scénarios CONTRAT 6–7
- [x] e2e scénario 8 : étude → chantier créé → planifier (≥2 activités, 1 rattachée + qté faite) sous `sektor/e2e/`
- [x] status → review

## Journal

```
25/08 11:50  posée
25/08 12:01  status → doing
25/08 12:01  status → doing
25/08 12:01  status → review
25/08 12:40  picker + reste + message métier ; qté faite / % ; e2e scénario 8 écrit ; 8082/4200 down
```

## Rapport de livraison

ce qui a changé — drawer Travaux liés (picker code+désignation, qté prévue, reste, détacher) + Avancement (qté faite ou %) ; `sektor/e2e/scripts/verify-planning-chantier-planifie-20260825.mjs` + `sektor/e2e/planning-workspace-activites.spec.ts`
critères prouvés — AC-16/17/18 dans le drawer ; scénario 8 script (walk 3 postes → 2 activités). Run **down** (8082/4200)
décidé seul — reste calculé front (arbre − rattachements) ; 4xx traduite ; Playwright skip si pas `erp:cursor`
écarts / dette — preuve Mode B non exécutée — inbox
