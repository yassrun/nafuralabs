---
id: SEKTOR-136
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-134]
tags: [consultation, etudes]
---

# Popup consultation depuis la decompo

> Popup overlay ; arbre visible. Pick articles ou Ajouter a. Retirer le panneau page Cout.

Contrat : [`DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § chrome geste étude. Canvas vue Popup étude.

## Étapes

- [x] Étape Coût : **retirer** `app-consultation-etude-panel` de la page. L’arbre a la hauteur.
- [x] Popup / drawer : dropdown fournisseur (fiches achats) + piquer les identités de la décompo, ou « Ajouter à une consultation » sur un composant, ou « Créer une consultation ».
- [x] Une consultation = 1 fournisseur + paquet (plusieurs postes). Pas une consult par ligne. Ciment 3 postes = une ligne de panier.
- [x] Preuve : page Coût sans panneau ; overlay ; consultation liée créée depuis l’arbre. Vu rouge : panneau au-dessus de l’arbre.

## Journal

```
22/08 13:02  posée
22/08 13:39  status → doing
22/08 13:42  vu rouge : app-consultation-etude-panel encore dans dossier-detail
22/08 13:47  overlay + PATCH /panier ; preuve verte CS-2026-0005 liée, ciment une fois
22/08 13:48  status → review
22/08 13:47  status → review
22/08 13:57  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé — panneau Coût retiré ; overlay `consultation-decompo-dialog` (dropdown fiches achats + piquer `cle_stable`) ; CTA arbre + « Ajouter à » sur un composant ; `PATCH /api/v1/consultations-achat/{id}/panier`.
critères prouvés — `verify-consultation-achat-136.mjs` : vu rouge (panneau page) puis vert (chrome overlay, create liée CS-2026-0005, ciment 3× = 1 ligne, PATCH merge).
décidé seul — PATCH merge (pas replace) ; si hors étude, le PATCH pose `dossierEtudeId` ; identités = items avec `cle_stable` (LIBRE ignorés) ; permission `achats.consultation.create` pour le PATCH.
écarts / dette — composant `consultation-etude-panel` laissé (plus monté) ; specs Playwright 129/130/parcours-qa attendent encore le panneau (inbox) ; flag CONSULTÉ = 137.
