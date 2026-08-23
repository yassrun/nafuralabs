---
id: SEKTOR-118
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [etudes, extraire]
---

# Extraire enchaine rattachement catalogue

> Apres Extraire + Creer dans le catalogue sur 1/4, la synthese redemande Rapprocher/Creer/Ignorer pour les 3 autres.

Contrat Extraire : [`DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) — créer = PUBLIER puis Item, rattacher au DPU.

## Étapes

- [x] Après Extraire, chaque ligne « Créer dans le catalogue » confirmée disparaît du seau « non rattaché » (composant lié à l’Item).
- [x] La synthèse « Composants non rattachés » ne reliste pas les lignes déjà créées / liées pendant Extraire.
- [x] Les lignes encore manuelles (pas créées) restent listées — Extraire n’auto-crée pas.
- [x] Preuve e2e : Extraire 2+ composants, en créer 1, synthèse = seulement les non créés. Vu rouge avant.

## Journal

```
20/08 21:12  posée
20/08 21:16  status → doing
20/08 21:45  Extraire persist ITEM après création ; leftover missing → LIBRE au confirm
20/08 21:50  preuve : extraire-creer seul laisse 2 LIBRE (vu rouge) ; PUT ITEM → rattrapage = 1 non créé ; count +1
20/08 21:24  status → review
20/08 21:30  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Extraire confirm persiste le DPU (créé = ITEM, restants = LIBRE). « Créer dans le catalogue » sur une ligne DPU enregistre tout de suite. Synthèse rattrapage lit le serveur — plus de créé dans « non rattachés ».
critères prouvés     Ligne créée liée (plus dans GET rattrapage) ; non créée listée ; pas d’auto-création (items count +1). Vu rouge : extraire-creer seul laissait les 2 LIBRE.
décidé seul          Confirm Extraire pose les « à créer » non créés en LIBRE (poste only) sans clic « Ajouter au poste » par ligne. Persist immédiat après Extraire et après création panneau.
écarts / dette       Playwright `sektor/e2e` ne charge pas `@playwright/test` depuis `sources/web` — preuve lancée via `e2e/scripts/verify-extraire-rattachement-118.mjs`. Inbox.
