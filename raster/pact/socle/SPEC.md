# Socle Raster

## Intention

Chrome de l’app : se déplacer, capturer une ligne, voir un détail. Pas le contrat des tickets.

## Ce que ça fait

- Nav **Inbox · Backlog · Sprint · Done agent**
- Capture sticky → `raster/inbox.md` (< 5 s)
- Panneau détail à droite
- Fallback manuel : éditer le markdown / `node raster/t.mjs index`

## Limites

**owns :** layout, nav, capture, empty/error chrome, thème local  
**not_owns :** schéma ticket, scan `raster-src`, règles sprint (BC **work**)

## Intervenants

`me` · `agent` — pas de rôles métier, pas d’auth.

## Données

Aucune entité socle. Inbox = lignes texte sans ID.

## États

App locale allumée / éteinte. Pas de cycle de vie métier.

## Règles

- **INV-S1** Pas d’auth, pas de BDD.
- **INV-S2** Capture n’écrit **que** `raster/inbox.md` (task draft, description). Pas un ticket `raster-src`.
- **R-S1** Filtre projet = Backlog / Sprint seulement ; Inbox est globale.

## Liens

- **consomme** BC work (affiche ses tickets)
- Canvas : [`ux/socle-wireframe.canvas.tsx`](ux/socle-wireframe.canvas.tsx)
