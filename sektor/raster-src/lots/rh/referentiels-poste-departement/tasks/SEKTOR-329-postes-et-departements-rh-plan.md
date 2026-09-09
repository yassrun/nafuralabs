---
id: SEKTOR-329
status: done
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
tags: [rh, lookups]
---

# Postes et départements RH — plan

> Clarifier poste/département RH vs rôle IAM ; plan + UX.

## Étapes

- [x] Distinguer les trois couches (IAM, RH, nomination chantier)
- [x] Plan `00-PLAN.md` + canvas UX
- [x] Task Code SEKTOR-331

## Journal

```
08/09 17:03  posée
08/09 17:23  status → done
```

## Rapport de livraison

Plan et wireframe dans `sektor/raster-src/lots/rh/referentiels-poste-departement/`. Poste et département sont des référentiels RH ; le rôle applicatif et le rôle chantier restent ailleurs. La fiche employé choisit par combobox (`rhPostes` / `rhDepartements`), pas un overlay picker.
