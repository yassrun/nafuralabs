---
id: ERP-09
status: todo
context: nafura
kind: task
feature: etude-parcours
parent: ERP-17
priority: P1
assignee: me
gate: me
tags: [sektor, etudes, chiffrage, ux]
---


# Revoir les infos d'en-tête de l'étude (chiffrage)

> L’en-tête du parcours étude / chiffrage affiche des infos à revoir
> (pertinence, complétude, clarté) pour le métier.

## Critères d'acceptation
- [ ] Inventaire des champs actuellement affichés en en-tête chiffrage
- [ ] Décision produit : quels garder / retirer / ajouter / reformater
- [ ] En-tête mis à jour (UI + données branchées)
- [ ] Cohérent avec fiche dossier / AO (pas de doublon trompeur)

## Journal
```
05/08 12:07  capturé · suite ERP-08 / parcours étude
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
07/08 16:56  lot clair · client lecture seule (plus de dropdown en-tête) · Chargé d'étude = createdBy (display name / vrai champ = suite)
07/08 17:50  décision · chargé d'étude = user BTP_INGENIEUR (requis à la création) · dropdown ingénieurs · auto-fill si créateur a le rôle sinon N+1 assigne · champ charge_etude_* + GET /etudes/ingenieurs · en-tête affiche chargeEtudeNom
```
