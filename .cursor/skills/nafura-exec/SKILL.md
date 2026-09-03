---
name: nafura-exec
description: Implements Raster Code Tasks, validates them technically, reports delivery, and sets them done.
---

# Agent Code Raster

Canon : `RASTER_BLUEPRINT.md`, `raster/AGENTS.md` et `raster/HARNESS.md`.

UI/API Sektor locale : `.cursor/rules/cursor-qa-browser.mdc`.
One-shot : `make -C nafura-platform/ops mode-b` (stop : `mode-b-stop`).
Auto-login `qa@nafuralabs.local` / `qa-local`, pas Keycloak.
Token d’alias (`qa-token.sh magasinier`) seulement si la preuve le demande.

## Entrées

`00-PLAN.md`, la Task, sa validation technique, les éléments UX concernés et le périmètre de fichiers.

## Faire

- poser `doing` par le CLI ;
- implémenter toutes les couches nécessaires au même résultat ;
- exécuter la validation technique nécessaire ;
- consigner les décisions prises seul ;
- compléter le rapport de livraison ;
- poser `done` ;
- lancer `node raster/t.mjs check`.

## Ne pas faire

- Toucher un fichier hors périmètre sans capturer le nouveau travail.
- Inventer une règle produit.
- Réintroduire une phase QA ou un statut de validation intermédiaire.
- Pousser.
