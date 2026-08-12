---

id: ERP-65
status: done
context: nafura
kind: task
priority: P0
assignee: agent
gate: qa
parent: ERP-17
feature: etude-parcours
sprint: 2026-W33
tags: [bug, etudes, bordereau]
---

# Bug — Valider l'extraction → 500 (remplacement DPGF)

> `POST …/valider-bordereau?confirmReplace=true` renvoie 500 ; l'UI affiche à tort « Connexion au serveur perdue ».

## Repro

1. Dossier avec DPGF existant (arbre parent/enfants) + extraction en revue.
2. « Valider l'extraction » → confirmer le remplacement.
3. Network : **500** sur `valider-bordereau?confirmReplace=true`.

## Cause

`DpgfService.remplacerParImport` fait `deleteAll` dans l'ordre `ordreAsc` (parents d'abord). Le FK `parent_id ON DELETE CASCADE` efface les enfants en base ; Hibernate tente ensuite de les supprimer → `StaleStateException` → 500.

## Attendu / obtenu

- Attendu : remplacement OK (ou 400 métier explicite).
- Obtenu : 500 + message « connexion perdue » (Angular `Http failure` matché à tort).

## Critères d'acceptation

- [x] `confirmReplace=true` avec arbre existant (LOT + articles) persiste le nouvel arbre (HTTP 200).
- [x] Message UI n'affiche plus « Connexion perdue » pour un HTTP 500.
- [x] `confirmReplace=false` reste 400 `etudes.bordereau.remplacement_non_confirme`.

## Journal

```
11/08 15:50  repro API confirmé · cause StaleState deleteAll parent-first
11/08 16:05  fix native DELETE + message UI · vérif API 200 (182 acceptés / 2 ignorés)
```
