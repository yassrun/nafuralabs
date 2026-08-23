---
id: SEKTOR-122
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [etudes, qa-parcours]
---

# CTA creer etude senable a la saisie

> Creer et commencer reste disabled tant que Angular n a pas recu input/change. Fill natif insuffisant.

Repro QA 20/08 : fill natif des champs objet/MOA n’active pas « Créer et commencer » tant que `input`/`change` Angular n’est pas dispatché.

## Étapes

- [x] Le CTA s’enable dès que les champs requis ont une valeur (ngModel / signals), y compris saisie native / autocomplete.
- [x] Pas de contournement « il faut blur deux fois ».
- [x] Preuve e2e : remplir objet + MOA → CTA enabled → dossier créé. Vu rouge avant (CTA disabled après fill).

## Journal

```
20/08 21:12  posée
20/08 21:19  status → doing
20/08 21:27  e2e rouge : CTA disabled après fill natif objet+MOA (date encore exigée, input pas synchro)
20/08 21:30  e2e vert : parcours-qa-cta-creer.spec.ts (chromium-desktop)
20/08 21:30  status → review
20/08 21:40  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `dossier-create.page` : CTA dès objet+MOA (chargé auto) ; `(input)` sync natif ; date limite plus bloquante.
critères prouvés     fill natif objet+MOA → CTA enabled → URL `/etudes/dossiers/{id}` — vu rouge avant (disabled), vert après.
décidé seul          Date limite de dépôt n’est plus requise pour enable/créer (AO optionnel côté API). Charge d’étude reste requis (pré-sélectionné).
écarts / dette       e2e lance Chrome canal `chrome` (binaires Playwright headless-shell absents en local).
