---
id: SEKTOR-119
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-115]
tags: [etudes, qa-parcours]
---

# Panneau consultation visible a letape Cout

> Etape Cout : pas de panneau Consultation du dossier (paquet, inviter, lier devis). Seulement alerte informative aucun devis recu. Le code Git a app-consultation-etude-panel, le DOM QA non.

Contrat : [`DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) § consultation. Canvas : `lots/etudes/consultation-etudes/ux/consultation-etudes-wireframe.canvas.tsx`.

## Étapes

- [x] Étape Coût : `app-consultation-etude-panel` est dans le DOM (paquet, ouvrir, inviter, lier un devis). Pas seulement l’alerte « aucun devis reçu ».
- [x] Layout : le panneau n’est pas collapsé à hauteur 0 (`dossier__etape3`).
- [x] Preuve e2e : ouvrir une consultation depuis l’écran Coût (paquet + CTA). Vu rouge avant (panneau absent).

## Journal

```
20/08 21:12  posée
20/08 21:33  status → doing
20/08 21:38  CSS :host block + min-height 10rem (avant min-height 0)
20/08 21:40  e2e vert parcours-qa-cout-chrome SEKTOR-119
20/08 21:34  status → review
20/08 21:40  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Panneau consultation : `:host { display:block }` et `min-height: 10rem` sur `dossier__etape3` (plus hauteur 0).
critères prouvés     `app-consultation-etude-panel` visible, hauteur > 40px, CTA « Ouvrir la consultation » + champ paquet.
décidé seul          Hauteur mini 10rem plutôt qu’un layout dédié — le canvas reste inchangé (spec).
écarts / dette       Baseline DOM « absent » = hauteur 0 en QA ; le sélecteur était déjà dans le template étape 3.
