---
id: ERP-53
status: todo
context: nafura
kind: feature
priority: P1
assignee: me
gate: me
feature: document-reader
tags: [sektor, platform, documents, extraction, ia]
---

# Feature — Document reader (moteur de lecture unifié)

> Un seul moteur de lecture pour tous les documents : la grille remplace le texte aplati,
> l'IA compile un plan de lecture au lieu de lire les données.
> Epic : `products/sektor-btp/docs/specs/epics/document-reader/`

## Pourquoi

Deux piles d'import coexistent et s'ignorent. La pile plateforme aplatit en texte puis paie un
appel de modèle par fichier ; elle sert 7 écrans. La pile `etudes` lit une grille de façon
déterministe : 703 articles sur 4 fichiers réels, 0 orphelin, 0 appel. Tout ce qu'importe la
première est tabulaire — il n'y a donc qu'un seul problème, et la meilleure réponse est déjà
écrite et mesurée.

## Périmètre (vague 1)

Formes `liste` et `arbre` seulement — les 6 écrans déjà câblés plus le bordereau.
Hors scope : lecteur d'ancres implémenté, rapprochement BL/facture, matrice, blocs multiples,
découverte de schéma, reprise de données d'onboarding.

## Lots (à découper en `kind: task`)

| # | Lot | Dépend |
|---|-----|--------|
| 0 | Socle grille en plateforme (+ dettes) | — |
| 1 | Plan, cascade, cache | 0 |
| 2 | Plan ↔ Definition | 1 |
| 3 | Carte des doutes | 2 |
| 4 | Bascule vague 1, forme par forme | 3 |

## Bloquant avant découpage

**O1 — le cache de plans est-il par tenant ou mutualisé ?** Ce n'est pas une question technique :
mutualiser fait sortir une empreinte de mise en page du périmètre d'un tenant. Même famille que la
clause CGU du catalogue — à poser avant le premier client réel.

## Critères de validation

- Les 703 articles / 4 fichiers restent verts du lot 0 au lot 4 (non-régression).
- Aucun écran câblé ne perd de fonctionnalité pendant la bascule.
- `AdaptiveBordereauExtractionOrchestrator.lastDiagnostics` n'est plus un état mutable partagé.

## Enfants

_(aucun encore — PLAN à valider, puis découpage)_

## Journal

```
11/08  spec · epic document-reader créé (00-PLAN + 00-ARCHITECTURE + 00-PROGRESS)
```
