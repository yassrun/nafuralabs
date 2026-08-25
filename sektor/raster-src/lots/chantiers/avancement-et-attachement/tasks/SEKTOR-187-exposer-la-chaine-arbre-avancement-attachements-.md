---
id: SEKTOR-187
status: review
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [chantiers, navigation, ux, audit]
---

# Exposer la chaîne Arbre → Avancement → Attachements → Situations depuis la fiche

> Audit `SEKTOR-182` : le parcours mensuel existe, mais la fiche chantier le casse en renvoyant vers des listings globaux hors contexte.
> La fiche doit rendre visible la chaîne métier locale sans perdre le chantier courant.

## Étapes

- [x] Identifier les points de sortie actuels qui font perdre le contexte chantier entre arbre, avancement, attachements et situations.
- [x] Ajouter depuis la fiche les accès locaux nécessaires au parcours `Arbre → Avancement → Attachements → Situations`.
- [x] Conserver un filtre chantier visible et réversible quand on ouvre les vues globales depuis la fiche.
- [x] Valider qu'un conducteur peut suivre le flux mensuel sans repasser par la sidebar portefeuille.

## Preuves attendues

- Lecture/grep ciblé montrant les liens/query params de contexte chantier depuis la fiche vers les vues aval.
- Diagnostics ou build ciblé verts sur les fichiers touchés.
- Si le front QA tourne : constat sur une fiche chantier montrant la navigation locale continue jusqu'aux situations.

## Journal

```
25/08 13:43  posée
25/08 13:57  status → doing
25/08 14:42  carte workflow ajoutée à la fiche ; contexte chantier propagé vers attachements, journal et situations ; saisie attachement préremplie
25/08 13:57  status → review
25/08 14:02  status → done-agent · gate none → done-me
25/08 14:31  status → review
25/08 18:19  status → doing
25/08 18:44  status → review
```

## Rapport de livraison
- Contexte source : `SEKTOR-182` anomalies `UX-07` et `UX-12`.
- `chantier-detail.page.ts` expose maintenant un bloc de workflow local depuis la fiche avec accès à l'arbre, à la saisie d'avancement, aux attachements, aux situations et au journal sans repasser par la sidebar portefeuille.
- Les vues globales ouvertes depuis la fiche conservent le contexte chantier via `queryParams` : `attachements`, `journal` et `situations`.
- `attachement-listing.page.ts` et `journal-chantier.page.ts` affichent un filtre chantier visible et réversible, et `attachement-saisie.page.ts` préremplit le chantier demandé.
- `situation-listing.page.ts` consomme aussi `?chantierId=` à l'ouverture pour garder le filtre visible dans le sélecteur.
- Preuves exécutées : `get_errors` verts sur les pages touchées et les traductions FR/EN/AR ; grep ciblé confirmant `openAvancement`, `openAttachements`, `openJournal`, `clearChantierFilter` et l'usage de `chantierId` sur les vues aval.

## Rapport de correction CODE — 25/08
- Commit intégré : `4eefa3d`.
- Correction du mélange `||` / `??` dans le journal et du conflit `route` dans la liste des situations.
- Le filtre `chantierId` reste visible, synchronisé dans l'URL et réversible.
- Preuve intégrée : `verify-chantier-context-navigation-187.mjs` PASS.
