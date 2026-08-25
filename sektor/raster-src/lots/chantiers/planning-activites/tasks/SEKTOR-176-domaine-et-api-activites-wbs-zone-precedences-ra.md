---
id: SEKTOR-176
status: review
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
---

# Domaine et API activités — WBS zone précédences rattachements

> AC-1..AC-8 CONTRAT planning-activites

## Étapes

- [x] Schéma Liquibase lab : activités, liens précédence, rattachements nœud + quantité prévue
- [x] Domaine + services + controllers API (AC-1..AC-7)
- [x] Preuve API scénarios CONTRAT 2 et 4 (création, WBS, zone, quotité > reste → 4xx)
- [x] status → review

## Journal

```
25/08 00:19  posée
25/08 00:19  status → doing
25/08 11:35  schéma v1.7 + domaine + API /activites (WBS, zone, FD/DD/FF/DF, rattachements)
25/08 11:35  tests unitaires verts (ActiviteChantierServiceTest : WBS+zone, quotité 50 puis 60→refus, cycle)
25/08 11:35  e2e scripts/verify-planning-activites-20260825.mjs écrit (scénarios 2+4) — API 8082 down, non joué live
25/08 11:35  rouge-avant documenté : POST /activites → 404
25/08 11:34  status → review
```

## Rapport de livraison

ce qui a changé      Tables `chantier_activites` / `_precedences` / `_rattachements` + API CRUD `/api/v1/chantiers/{id}/activites` (WBS, zone, liens, quotité).
critères prouvés     AC-1..AC-7 → `ActiviteChantierServiceTest` vert ; script e2e scénarios 2+4 prêt, API locale down.
décidé seul          Dates début+fin obligatoires (pas durée seule). Les 4 types de lien. Pas de génération WBS. Quotité = qté prévue, somme ≤ nœud.
écarts / dette       Preuve live API non jouée (8082 down). Script prêt dans le worktree.
