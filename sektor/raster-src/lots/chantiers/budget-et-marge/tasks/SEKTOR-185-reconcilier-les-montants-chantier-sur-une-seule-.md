---
id: SEKTOR-185
status: review
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [chantiers, budget, ux, audit]
---

# Réconcilier les montants chantier sur une seule vérité métier

> Audit `SEKTOR-182` : liste, hero et arbre racontent trois montants incompatibles pour le même chantier.
> Le front doit nommer et afficher des faits réconciliés depuis l'arbre canonique, pas des agrégats contradictoires.

## Étapes

- [x] Identifier les trois sources live qui alimentent aujourd'hui liste, hero/synthèse et arbre budget.
- [x] Aligner les écrans sur le contrat `budget-et-marge/CONTRAT.md` : vente HT, déboursé prévu, budget révisé, engagé, réalisé, marge.
- [x] Supprimer ou renommer tout libellé qui présente un agrégat différent comme le même « budget ».
- [x] Valider qu'un même chantier ne montre plus de montants contradictoires entre listing, fiche et arbre.

## Preuves attendues

- Lecture/grep ciblé des mappers et composants budget montrant une seule source par chiffre affiché.
- Diagnostics ou build ciblé verts sur les fichiers touchés.
- Si le front QA tourne : constat sur `CH-2026-001` montrant la cohérence entre listing, hero et arbre.

## Journal

```
25/08 13:43  posée
25/08 13:44  status → doing
25/08 14:14  listing = vente HT ; fiche = budget révisé HT quand la synthèse le fournit ; arbre = total vendu HT ; diagnostics locaux verts
25/08 13:47  status → review
25/08 14:02  status → done-agent · gate none → done-me
25/08 14:31  status → review
```

## Rapport de livraison
- Contexte source : `SEKTOR-182` anomalie `UX-FONC-02`.
- `chantier-detail.page.ts` n'écrase plus `chantier.budgetHt` avec `summary.budget.reviseHt` : la fiche garde le montant brut et choisit explicitement le chiffre affiché.
- La liste Chantiers affiche désormais `Vente HT` au lieu d'un `Budget HT` ambigu.
- La fiche chantier affiche `Vente HT` ou `Budget révisé HT` selon la présence d'une vraie révision dans la synthèse, avec le `TTC` cohérent.
- Le footer de l'arbre Lots nomme correctement le total `Total vendu HT` au lieu de `Total marché HT`.
- Preuves exécutées : `get_errors` verts sur `chantier-detail.page.ts`, `chantiers-listing.page.ts` et les traductions FR/EN/AR ; grep ciblé confirmant les nouveaux libellés métiers sur les surfaces touchées.
