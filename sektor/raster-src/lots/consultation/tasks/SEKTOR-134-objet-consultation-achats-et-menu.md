---
id: SEKTOR-134
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [consultation, achats]
---

# Objet consultation achats et menu

> Gel 22/08 DECISIONS-PRODUIT : objet Achats, pas DA, pas collé au dossier. Menu Achats / expression.

Contrat : [`DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § 22/08. Canvas : [`ux/consultation-achats-wireframe.canvas.tsx`](../ux/consultation-achats-wireframe.canvas.tsx) vue Liste Achats.

## Étapes

- [x] Agrégat **Consultation** dans **achats/** : 1 fournisseur (fiche) + panier `cle_stable` + lien étude **optionnel**. Pas `DemandesAchat`, pas `AppelOffreAchat` / `OffreFournisseur`, pas `consultations_etudes` comme vérité.
- [x] Chrome : sous-menu **Achats** (expression, à côté Demandes / AO). **Pas** un item Études. Liste + créer hors étude.
- [x] Preuve : créer une consultation sans dossier ; elle apparaît sous `/achats/consultations`. Une DA chantier n’en crée pas. Vu rouge avant (route / objet absents).

## Journal

```
22/08 13:02  posée
22/08 13:05  status → doing
22/08 13:16  vu rouge : GET/POST /api/v1/consultations-achat → 404 ; chrome sans /achats/consultations
22/08 13:24  impl + SQL local ; e2e vert CS-2026-0001 hors étude ; DA n’en crée pas
22/08 13:30  status → review
22/08 13:57  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé — agrégat `ConsultationAchat` dans `achats/` (table `consultations_achat` + panier `cle_stable`) ; liste/créer hors étude ; menu Achats / expression → `/achats/consultations`.
critères prouvés — `verify-consultation-achat-134.mjs` : vu rouge (404 + nav absent) puis vert (create dossier null, liste, DA chantier inchangée).
décidé seul — API `/api/v1/consultations-achat` ; statut `DEMANDE` / `devisRecus=0` sans table devis ; create UI toujours hors étude (API accepte `dossierEtudeId`) ; panier vide autorisé ; `erp-nav.generated.ts` édité à la main (SSOT chrome).
écarts / dette — `consultations_etudes` laissé en place (plus la vérité) ; import magique / popup / flag = 135–137.
