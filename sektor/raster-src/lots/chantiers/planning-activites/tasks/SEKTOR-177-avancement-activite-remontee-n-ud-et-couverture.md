---
id: SEKTOR-177
status: review
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-176]
---

# Avancement activité — remontée nœud et couverture

> AC-8..AC-11

## Étapes

- [x] Remplacer stub `ActiviteCouvertureService` (AC-8)
- [x] Saisie quantité faite / % sans nœud (AC-9) + cumul nœud (AC-10)
- [x] Garder palier 1 si aucune activité (AC-11) — preuve scénario 1 + 3
- [x] status → review

## Journal

```
25/08 00:19  posée
25/08 11:36  stub remplacé : activitesCouvrant lit les rattachements
25/08 11:36  POST /activites/{id}/avancements : qté → AvancementPhysique (bypass garde) ; % si 0 nœud
25/08 11:36  tests verts : ActiviteCouvertureServiceTest, ActiviteAvancementServiceTest, enregistrerDepuisActivite_passeLaGardeCouverture
25/08 11:34  status → doing
25/08 11:34  status → review
```

## Rapport de livraison

ce qui a changé      `ActiviteCouvertureService` lit les rattachements. Saisie qté/% sur activité ; remontée via `enregistrerDepuisActivite` (colonne `activite_id`).
critères prouvés     AC-8..AC-11 → tests unitaires verts (couverture vide / non vide, % sans nœud, remontée passe la garde).
décidé seul          % activité = fait de *cette* activité / somme quotités (pas le cumul nœud). Attachement continue de lire `AvancementPhysique`.
écarts / dette       e2e live scénarios 1+3 non joué (8082 down). Script prêt.
