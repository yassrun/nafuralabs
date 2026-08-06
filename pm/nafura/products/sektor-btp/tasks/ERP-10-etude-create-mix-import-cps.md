---
id: ERP-10
status: todo
context: nafura
kind: task
feature: etude-parcours
parent: ERP-17
priority: P1
assignee: me
gate: me
tags: [sektor, etudes, cps, import, ai-first]
---


# Création étude / AO — ordre & mix import CPS → préremplissage → manuel

> Beaucoup d’infos du formulaire « Nouvelle étude / appel d’offres » sont
> déductibles du **CPS / doc marché**. Il faut le **bon ordre** et le **bon mix** :
> importer → remplir le possible → laisser le manuel après.

## Contexte UI actuel
Formulaire `/etudes/dossiers/new` — aujourd’hui saisie manuelle puis dépôt BDP/CPS.

Champs concernés (à mapper CPS ↔ formulaire) :
- Marché : Objet · Client/MOA · Date limite de dépôt
- AO : Référence · Type · Ville · Ouverture des plis · Délai exécution (j) · Estimation MOA HT · Caution provisoire · Caution définitive

## Critères d'acceptation
- [ ] **Ordre de parcours décidé et wireframé** (canvas) : ex. dépôt CPS tôt vs create-then-docs
- [ ] Import / extraction CPS propose le max de champs ci-dessus (review user)
- [ ] Préremplissage appliqué uniquement sur champs proposés **acceptés** (pas d’écrasement silencieux)
- [ ] **Fallback manuel** : compléter / corriger / ignorer l’IA au même endroit après import
- [ ] Création possible même si extraction échoue ou partielle (gate = données métier, pas succès IA)
- [ ] Client/MOA : matching partner proposé ou création / sélection manuelle si pas trouvé
- [ ] Aligné principe Nafura AI-first + manuel en fallback

## Journal
```
05/08 12:18  capturé depuis écran /etudes/dossiers/new + besoin mix CPS
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
```
