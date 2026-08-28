---
id: SEKTOR-213
status: todo
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-211]
tags: [etudes, conversion]
---

# Corriger le vocabulaire et securiser le formulaire de conversion

> CTA, titre et texte disent « Créer le chantier ». Convertir est inactif sans libelle. Code, date et durée sont marqués facultatifs.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-5, AC-6. UX : vue Conversion du canvas.

## Étapes

- [ ] Remplacer « Créer chantier et marché » partout (header, i18n, tests) par « Créer le chantier ».
- [ ] Aligner le dialog : aucun marché, vente = devis, OS démarre.
- [ ] Libellé obligatoire ; code / date / durée facultatifs avec hint « avant l'OS » ; génération du code si vide.
- [ ] Désactiver Convertir tant que le libellé est vide (UI + refus API cohérent).

## Preuves attendues

- Aucune occurrence visible de « marché » sur le geste de conversion.
- Convertir inactif si libellé vide ; actif si seul le libellé est saisi.
- Après conversion : `marcheGenereId` nul, chantier `EN_PREPARATION`.
- Capture desktop + 390 du dialog.

## Journal

```
27/08 21:58  posée
```

## Rapport de livraison

