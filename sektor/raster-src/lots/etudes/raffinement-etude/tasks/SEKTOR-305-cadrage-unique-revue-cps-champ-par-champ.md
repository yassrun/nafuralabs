---
id: SEKTOR-305
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: me
---

# Cadrage unique — revue CPS champ par champ

> `/new` n’est plus un formulaire d’identité : il ouvre le wizard. Chaque champ CPS se tranche (accepter / refuser / corriger) avant Continuer.

## Étapes

- [x] `/new` crée un brouillon et redirige vers l’étape 1
- [x] Identité : propositions CPS avec Accepter / Refuser par champ
- [x] Plus d’`appliquerPropositionMarche` silencieux sur les métadonnées
- [x] Continuer / Enregistrer bloqués tant qu’il reste des propositions

## Preuves attendues

- Mode B : Nouvelle étude → wizard étape 1 (pas de formulaire objet/MOA)
- Import CPS → champs badge CPS + Accepter/Refuser ; rien n’est persisté tant que non tranché
- Continuer inactif / refusé tant que des propositions restent `proposed`

## Journal

```
02/09 13:19  posée
02/09 13:19  status → doing
02/09 13:26  cadrage unique + revue CPS livrés — QA agent sauté, test humain
02/09 13:26  status → review
```

## Rapport de livraison

`/new` crée un brouillon coquille (objet/MOA placeholders) et ouvre le wizard. L’étape 1 affiche chaque champ CPS en proposition (badge, Accepter / Refuser / corriger). `appliquerPropositionMarche` ne pousse plus les métadonnées en silence (checklist destination inchangée). Continuer et Enregistrer refusent tant que l’extraction tourne ou qu’il reste des propositions.

Preuves : Angular rebuild OK, front 4200 et API 8082 UP. Pas de QA agent — test manuel sur un **nouveau** dossier (un cadrage déjà persisté n’affiche pas la revue).

Décidé seul : bloquer Continuer pendant l’indexation CPS ; édition d’un champ proposé = acceptation de la valeur corrigée.

Écarts : pas d’état de revue persisté côté API (recharger après acceptation non sauvée repose sur Enregistrer / Continuer).
