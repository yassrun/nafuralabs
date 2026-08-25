---
id: SEKTOR-186
status: review
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [chantiers, situations, ux, audit]
---

# Autoriser la situation sans marché depuis la référence de vente active

> Audit `SEKTOR-182` : la fiche bloque encore la génération de situation tant qu'aucun marché n'existe.
> Le palier 1 doit facturer depuis la référence de vente active : devis validé avant notification, marché après notification.

## Étapes

- [x] Identifier le garde-fou front et le backend de génération qui imposent aujourd'hui un marché comme prérequis.
- [x] Ouvrir le parcours situation/attachement depuis la référence de vente active quand le chantier n'a pas encore de marché notifié.
- [x] Garder la création de marché comme geste séparé, sans bloquer la facturation palier 1.
- [x] Valider qu'un chantier sur devis validé n'affiche plus un écran mort « Créer le marché » comme seule issue.

## Preuves attendues

- Lecture/grep ciblé montrant que la génération de situation ne dépend plus exclusivement d'un `ContratMarche` lié.
- Diagnostics ou build ciblé verts sur les fichiers touchés.
- Si le front/API QA tournent : constat sur un chantier sans marché où l'accès aux situations n'est plus bloqué.

## Journal

```
25/08 13:43  posée
25/08 13:49  status → doing
25/08 14:25  brouillon situation autorisé sans marché notifié via la référence de vente active ; création de marché gardée en secondaire
25/08 13:50  status → review
25/08 14:02  status → done-agent · gate none → done-me
25/08 14:31  status → review
25/08 18:19  status → doing
25/08 18:44  status → review
```

## Rapport de livraison
- Contexte source : `SEKTOR-182` anomalie `UX-FONC-04`.
- Le blocage venait du front : `chantier-detail.page.ts` exigeait `marchePourChantier()` pour afficher toute génération de situation, alors que `SituationGenerationService` n'avait besoin que d'une référence et d'un montant HT.
- La fiche calcule désormais une `activeSituationReference` : marché notifié s'il existe, sinon `marcheReference` du chantier comme référence de vente active.
- Sans marché notifié, l'onglet Situations laisse générer le brouillon et conserve `Créer le marché` comme action secondaire au lieu d'un écran mort.
- Le brouillon affiche `Référence de vente` quand il n'y a pas de marché, avec messages FR/EN/AR dédiés pour le cas sans marché et pour l'absence totale de référence active.
- Preuves exécutées : `get_errors` verts sur `chantier-detail.page.ts` et les traductions FR/EN/AR ; grep ciblé confirmant `canGenerateSituationDraft()` et `activeSituationReference()` à la place du garde-fou exclusif sur `marchePourChantier()`.

## Rapport de correction CODE — 25/08
- Commit intégré : `2c7fad1`.
- HTML du CTA corrigé et politique de brouillon extraite/testée.
- Référence active sans marché conservée ; retenue résolue chantier → marché → défaut 7 %, sans variable implicite.
- Preuves agent : assertions runtime et compilation TypeScript ciblée vertes.
