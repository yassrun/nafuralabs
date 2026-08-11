---
kind: epic-plan
app: raster
slug: raster-ui
module: shell
raster_feature: OPS-02
status: draft
language: fr
---

# Raster UI — shell produit

> Wireframe à valider avant impl. SSOT fichiers `raster/`, agent-first, pas de Kanban.

**Objectif** : UI locale pour Inbox · Backlog · Sprint · Check progress.
**Périmètre** : `products/raster/` (app) + lecture `raster/` (SSOT).
**Hors scope** : BDD, auth, multi-user, Kanban, capacité heures.

---

## 1. Verdict

Raster passe d’un framework markdown agent à un **produit** avec UI. Le canvas IDE actuel prouve les 3 vues ; il faut figer le shell produit (capture, détail, AI + fallback) avant code.

## 2. Constat

- Contrat figé dans `raster/AGENTS.md` (pipeline Capture→…→Archive).
- Wireframe IDE existant : `raster/ux/raster-canvas-wireframe.canvas.tsx` (ops canvas).
- Pas encore d’app sous `products/raster/`.

## 3. Cible

Shell 4 vues + capture sticky + panneau détail droit + CTA agent primaire + fallback manuel (CLI / fichier).

## 4. Lots

| # | Lot | Intent | Dépend |
|---|-----|--------|--------|
| 1 | UX validate | Valider wireframe + décisions | — |
| 2 | Shell app | Scaffold `products/raster/web` + 4 vues lecture INDEX | 1 |
| 3 | Writes | Bridge agent / `t` pour mutate | 2 |

## 5. Décisions ouvertes

Voir canvas § Décisions UX + [`ux/notes.md`](./ux/notes.md).

## 6. UX

- **SSOT canvas** : [`ux/raster-ui-wireframe.canvas.tsx`](./ux/raster-ui-wireframe.canvas.tsx)
- Preview : `canvases/raster-ui-wireframe.canvas.tsx`

## 7. Liens Raster

| Rôle | Id |
|------|-----|
| Feature | OPS-02 |
| Spec / ADR | — |
| Tasks | (à découper après validation UX) |
