---
id: RAS-100
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [raster, cli]
---

# Sweep nettoie les blocked_by avant de supprimer

> Une dependance satisfaite ne doit pas devenir une dependance inconnue.

## Étapes

- [x] `stripBlockedBy` — retire des ids d'un frontmatter, sur du texte
- [x] `cleanReferences` — passe sur toutes les tasks vivantes
- [x] `sweep` nettoie **avant** de supprimer
- [x] Réparation des références déjà orphelines
- [x] `check` vert

## Journal

```
16/08 14:05  posée
16/08 14:07  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `raster/sweep.mjs` — `stripBlockedBy` et `cleanReferences`, appelées avant toute suppression · `e2e/work/sweep-refs.test.mjs` (5 tests) · `SEKTOR-97` réparé
critères prouvés     AC-1 · AC-3 par test · AC-2 le nettoyage précède la suppression, lisible dans l'ordre de `sweep()` · AC-5 `SEKTOR-97` ne référence plus `SEKTOR-96` · AC-6 `check` — 39 tasks, **0 erreur** (contre 1 depuis des semaines) · suite complète 58 verts
décidé seul          la réparation des orphelins est un **coup unique**, pas une commande. Retirer automatiquement tout `blocked_by` inconnu détruirait la propriété qui protège : un bloqueur inconnu doit bloquer. On ne sait pas distinguer « balayé parce que terminé » d'une faute de frappe — sauf au moment du sweep, où on le sait exactement. · Le champ vidé **disparaît** au lieu de rester `blocked_by: []` : un tableau vide prétendrait qu'une dépendance existe.
écarts / dette       AC-4 (`--dry` n'écrit rien) est **prouvé à vide** : il ne restait aucun `done-me` au moment du test, donc le dry-run n'avait rien à ne pas faire. La lecture du code le montre, un test ne le montre pas. · Deux bugs dans ma première version, attrapés par les tests : une regex construite depuis le texte matché (`[A-2]` devenait une classe de caractères invalide) et un patch appliqué au fichier entier au lieu du seul frontmatter — un `blocked_by:` cité dans un journal aurait été modifié.
