---
id: SEKTOR-184
status: review
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-180]
tags: [chantiers, planning, ux, frontend]
---

# Supprimer l'onglet Phases et unifier le planning sur les activités

> `SEKTOR-178` a branché le Gantt activités mais a laissé l'ancien modèle `Phases` en place.
> La fiche chantier ne doit plus exposer un second planning avec ajout, import PDF et scan IA.

## Étapes

- [x] Retirer `Phases` de la navigation locale chantier et des CTA qui l'installent comme concept valide.
- [x] Supprimer ou neutraliser la surface `chantier-phases-tab` pour qu'aucune création/import de phase ne reste accessible depuis la fiche.
- [x] Vérifier les libellés, aides et éventuels liens vers le Planning pour qu'ils parlent uniquement d'activités.
- [x] Valider qu'il ne reste qu'un seul parcours de planning vivant : Gantt activités, optionnel au palier 1.

## Preuves attendues

- `grep` ou lecture ciblée : plus de tab `phases` active dans `chantier-detail.page.ts`.
- Build Angular ou diagnostics ciblés verts sur les fichiers touchés.
- Si le front local tourne : constat UI sur une fiche chantier montrant l'absence de `Phases` et l'accès au seul Planning activités.

## Journal

```
25/08 13:25  posée
25/08 13:35  status → doing
25/08 13:46  onglet phases retiré de la fiche chantier ; query param legacy normalisé ; tour Chantiers réécrit sur les activités
25/08 13:36  status → review
25/08 14:02  status → done-agent · gate none → done-me
25/08 14:31  status → review
25/08 18:18  status → doing
25/08 18:19  status → review
```

## Rapport de livraison
- Contexte source : audit `SEKTOR-182` anomalie `UX-FONC-05` + contrat `planning-activites/CONTRAT.md` AC-19.
- État constaté à l'ouverture : `chantier-detail.page.ts` expose encore l'onglet `phases`; `ChantierPhasesTabComponent` garde ajout, import PDF et scan IA comme second modèle de planning.
- `chantier-detail.page.ts` ne déclare plus `phases` comme tab valide, n'importe plus `ChantierPhasesTabComponent`, et la fiche ne peut plus ouvrir cette surface.
- Les anciens liens `?tab=phases` sont rabattus sur `overview` pour éviter de garder un faux état d'URL.
- Le tour Chantiers décrit désormais le planning activités au lieu d'enseigner un modèle par phases.
- Preuves exécutées : `get_errors` verts sur `chantier-detail.page.ts` et `sektor-platform-extensions.ts` ; `grep` ciblé vide sur `phases|chantier-phases-tab` dans `chantier-detail.page.ts`.
- Validation plus large non rejouée : le build web global reste pollué par l'erreur préexistante `submit-approval-button.component.ts:131` hors périmètre.
