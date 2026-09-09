---
id: SEKTOR-331
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-329]
tags: [rh, lookups]
---

# Référentiels poste et département + lookups fiche employé

> Tables RH, listings, combobox fiche employé, seed QA sans code IAM dans poste.

## Étapes

- [x] Tables `rh_postes` / `rh_departements` + FK employé
- [x] API CRUD + binder fiche / seed / import
- [x] Listings RH + nav + lookups `rhPostes` / `rhDepartements`
- [x] QA : libellés métier, pas `BTP_*`
- [x] Gradle `:rh:test`

## Journal

```
08/09 17:04  posée
08/09 17:23  status → doing
08/09 17:26  status → done
```

## Rapport de livraison

Tables `rh_postes` / `rh_departements`, FK `poste_id` obligatoire, listings `/rh/postes` et `/rh/departements`, combobox fiche employé `rhPostes` / `rhDepartements` (recherche ≥ 2 car., œil vers le listing). QA : Conducteur de travaux / QA, plus de `BTP_*` dans le poste. Gradle `:sektor:rh:test` (EmployeService, RhPosteService, RhReferentielBinder) OK. API `GET /api/v1/rh/postes?q=Co` et `…/departements?q=QA` OK. Front Mode B `http://127.0.0.1:4200` compile.

Écarts : pas d’overlay picker employé ; l’onglet Équipe ne filtre pas par poste.
