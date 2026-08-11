---

id: ERP-66
status: done
context: nafura
kind: task
priority: P1
assignee: agent
gate: qa
parent: ERP-17
feature: etude-parcours
sprint: 2026-W33
tags: [bug, etudes, ux]
---

# Bug — Badge « Estimé » sur postes sans prix

> Après import bordereau, tous les articles affichent le badge ESTIMÉ alors que PU/total sont vides.

## Cause

Import + `@PrePersist` stampent `origineCout = ESTIME` sans coût/prix. Le badge UI affiche dès que l'origine est posée.

## Critères d'acceptation

- [x] Import / validation extraction → articles sans prix : `origine_cout` NULL, pas de badge mode.
- [x] Badge « Estimé / Forfait / Décomposé » uniquement si PU HT > 0.
- [x] Gate « postes à chiffrer » inchangé (toujours basé sur prix absent).
- [x] Données lab existantes (ESTIME sans prix) nettoyées.

## Journal

```
11/08 19:20  confirmé oubli défaut ESTIME à l'import
11/08 19:25  fix PrePersist/import/badge + cleanup 210 lignes lab
```
