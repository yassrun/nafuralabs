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
- [ ] **Ordre de parcours décidé et wireframé** (canvas) : dépôt CPS tôt sur create
- [ ] Import / extraction CPS propose le max de champs ci-dessus (review user)
- [ ] **Chaque champ IA** : badge IA (+ confiance) + actions **Accepter / Ignorer**
- [ ] Préremplissage appliqué uniquement sur champs **acceptés** (pas d’écrasement silencieux)
- [ ] **Fallback manuel** : compléter / corriger / ignorer l’IA au même endroit après import
- [ ] Création possible même si extraction échoue ou partielle (gate = données métier, pas succès IA)
- [ ] **MOA = texte libre** à l’étude (prérempli CPS) — **pas** de Partner obligatoire ; création / lien client Partner **à la conclusion du marché**
- [ ] Aligné principe Nafura AI-first + manuel en fallback

## Journal
```
05/08 12:18  capturé depuis écran /etudes/dossiers/new + besoin mix CPS
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
07/08 21:05  wireframe canvas · CPS optionnel en haut create · review champ/champ · fallback manuel · chargé hors CPS · BDP reste pièces · sync etude-create-cps-first-wireframe.canvas.tsx · en attente validation produit
07/08 21:10  validation produit · tous champs IA = Accepter/Ignorer + badge IA · MOA texte libre (pas Partner au create) · client Partner reporté à conclusion marché · impact : assouplir @NotBlank clientId
07/08 21:45  fix extract · index OK (211 sections) mais regex FR générique ratait CPS Maroc · heuristique SRRA (a pour objet, cautionnement, délai mois) · poll attend CPS_INDEX SUCCEEDED
```
