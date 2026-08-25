---
name: orchestration
description: Dérouler la fenêtre Raster, lancer un agent par sous-lot prêt, collecter les rapports et s’arrêter à la borne ou sur une décision humaine.
---

# Orchestration Raster

Lire d’abord `raster/AGENTS.md`. Ce skill porte la boucle, pas une seconde copie des règles.

## Boucle

1. `node raster/t.mjs window <projet> --json`.
2. Identifier les sous-lots autorisés et prêts.
3. Créer une Run d’orchestration pour la session.
4. Lancer un agent par sous-lot, en parallèle entre sous-lots.
5. Dans chaque sous-lot, dérouler les tasks en série selon `blocked_by`.
6. Router selon `agent_type` : `spec` → Spec, `exec` → Code, `qa` → QA.
7. Collecter le rapport de livraison de chaque task.
8. Recalculer `ready` après chaque mutation.
9. S’arrêter à la borne, sur `gate: me`, sur `status: blocked` ou sur une question indécidable.

## Interdit

- Écrire une Task ou son frontmatter à la main.
- Déplacer la borne.
- Coder ou rendre un verdict QA.
- Poser `done-me`.
- Pousser vers Git.

## Commandes

```bash
node raster/t.mjs window <projet> --json
node raster/t.mjs ready <projet> --json
node raster/t.mjs status <id> <statut>
node raster/t.mjs check
```
