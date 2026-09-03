---
name: orchestration
description: Lancer et suivre les sous-sessions Raster en mode local ou agents, selon le pipeline Spec → Code → Done.
---

# Orchestration Raster

Lire d’abord `raster/AGENTS.md` et `raster/HARNESS.md`. Ce skill porte la boucle, pas une seconde copie des règles.

Sektor locale : au passage de main Code, `make -C nafura-platform/ops mode-b` (`.cursor/rules/cursor-qa-browser.mdc`).

## Boucle

1. `node raster/t.mjs window <projet> --json`.
2. Identifier les sous-lots autorisés et prêts.
3. L’humain choisit les sous-lots qui passent de Ready à Session et leur mode.
4. Lancer un harness Cursor par sous-lot.
5. Router `spec` → Spec puis `exec` → Code.
6. En local, confier une Task Code à la fois.
7. En mode agents, confier au harness la vague de Tasks Code indépendantes.
8. Recalculer le front après chaque fin de run jusqu’à `done`.
9. Arrêter uniquement sur `status: blocked`, échec technique ou fin.

## Interdit

- Écrire une Task ou son frontmatter à la main.
- Déplacer la borne.
- Coder.
- Réintroduire une attente humaine dans une sous-session.
- Pousser vers Git.

## Commandes

```bash
node raster/t.mjs window <projet> --json
node raster/t.mjs ready <projet> --json
node raster/t.mjs status <id> <statut>
node raster/t.mjs check
```
