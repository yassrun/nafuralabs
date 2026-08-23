---
id: SEKTOR-135
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-134]
tags: [consultation, achats]
---

# Devis consultation par import magique

> On importe le fichier ; Import magique extrait les lignes. Pas de saisie cle=prix.

Contrat : [`DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § devis = import. Canvas vue Import devis. Réutiliser `nf-smart-import-trigger` (même pattern articles / lots chantier).

## Étapes

- [x] Sur la fiche consultation : **importer** un fichier devis. Import magique extrait les lignes (identité / libellé, qté, PU). Revue humaine puis confirmer.
- [x] Pas de textarea `cle_stable=prix` comme chemin principal. Un fichier sans extraction réussie **n’est pas** un devis reçu.
- [x] Preuve : import → lignes persistées sur la consultation. Saisie manuelle cle=prix absente. Vu rouge : panneau actuel textarea.

## Journal

```
22/08 13:02  posée
22/08 13:31  status → doing
22/08 13:33  tsk1 preuve écrite ; vu rouge : fiche absente + POST /devis → 404
22/08 13:39  tsk2 tables devis/lignes + POST confirm + fiche nf-smart-import-trigger
22/08 13:40  tsk3 preuve verte : CS-2026-0002 1 devis / 2 lignes ; vide n’incrémente pas
22/08 13:39  status → review
22/08 13:57  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Fiche `/achats/consultations/:id` : `nf-smart-import-trigger` (définition `devis-consultation`, pas l’import articles). Confirm → `POST /api/v1/consultations-achat/{id}/devis` persiste les lignes sur **cette** consultation ; `devisRecus` + statut `DEVIS_RECU`. Tables `consultation_achat_devis` / `_ligne` (Liquibase v1.1/003). Pas de textarea prix.
critères prouvés     Import confirmé → lignes + `devisRecus=1` / `DEVIS_RECU` : `verify-consultation-achat-135.mjs` vert. Fichier sans lignes (`lignes: []`) → 400, compteur reste 0, statut `DEMANDE`. Chrome : trigger `devis-consultation`, pas textarea. **Vu rouge avant** : fiche absente ; `POST …/devis` → 404 (`No static resource`). Unit `importDevisVide_neCreePas` / `importDevisConfirme_persisteLignesEtPasseDevisRecu`.
décidé seul          Devis = agrégat enfant Achats (pas `consultations_etudes`). Une confirm = un devis (N lignes). Identité extraite stockée telle quelle — pas de match panier / flag CONSULTÉ (137). Permission POST = `achats.consultation.create`. Création navigue vers la fiche. Branche/worktree : travail dans l’arbre courant (134 déjà là).
écarts / dette       Nom de fichier : ReviewedExtraction n’en porte pas → `fichierNom` optionnel (`import` côté UI). Identification Extraire / peinture CONSULTÉ = 137. Panneau étude textarea : hors fiche Achats, 136. Changelog local appliqué à la main (docker exec) ; le job Liquibase reprendra 003.
