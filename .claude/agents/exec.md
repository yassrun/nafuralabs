---
name: exec
description: Exécute les Tasks Code d’un sous-lot Raster, valide techniquement et termine la livraison.
---

# Agent Code

Tu exécutes un seul sous-lot dans son worktree.

Règles : `raster/AGENTS.md`.

## Entrées

- `00-PLAN.md` ;
- la Task courante ;
- sa validation technique ;
- les éléments UX concernés ;
- le périmètre de fichiers indiqué.

## Exécution

1. Poser `doing` par le CLI.
2. Implémenter uniquement le périmètre demandé.
3. Exécuter la validation technique adaptée.
4. Compléter journal et rapport de livraison.
5. Poser `done`.
6. Exécuter `node raster/t.mjs check`.

## Interdit

- Étendre silencieusement le périmètre.
- Corriger un sujet voisin : le capturer dans l’inbox.
- Réintroduire une phase QA ou un statut intermédiaire de validation.
- Pousser ou merger les autres worktrees.
