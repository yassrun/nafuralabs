---
id: SEKTOR-323
status: done
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [SEKTOR-322]
tags: [chantiers, rbac]
---

# Politique de grade, API affectations et onglet Equipe

> `grade(acteur) > grade(cible)` dans le BC chantiers ; `GET /roles` et `canMutate` pilotent l’onglet Équipe.

## Étapes

- [x] `commandGrade` / `canCommand` sur `ChantierRoleCodes`
- [x] `ChantierAffectationPolicy` (Direction vs nomination sur le chantier)
- [x] Service + contrôleur : assert à l’écriture, rôles filtrés, `canMutate`
- [x] Onglet Équipe : CTA, rôles, retirer
- [x] Tests unitaires + `t.mjs check`

## Journal

```
08/09 12:35  posée
08/09 12:43  status → doing
08/09 12:43  status → done
```

## Rapport de livraison

Politique `ChantierAffectationPolicy` : une comparaison de grade, cascade automatique. IAM Direction (owner/DG) sur tous les chantiers ; sinon max des affectations actives sur ce chantier. `GET /roles` ne renvoie plus la liste globale. Onglet Équipe : CTA et Retirer selon l’autorité. Tests `ChantierRoleCodesTest` + `ChantierAffectationPolicyTest` OK. Porte IAM alignée sur `chantiers.chantiers.chantier.{read,update}` (déjà seedée). `t.mjs check` : erreurs préexistantes hors sous-lot. Le JVM 8082 local n’a pas encore rechargé les classes.
