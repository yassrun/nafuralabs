# CH-00-INIT — shell

**Type :** `EVOL` (forme `INIT` — première vérité du socle)
**Cible :** socle
**Qualification :** aucune SPEC socle n'existait ; le premier BC (`work`) a tiré dessus.

## Pourquoi

`work` déclare consommer une navigation, une capture et un affichage de vues. Le socle doit les fournir — et seulement celles-là.

## Aujourd'hui

Rien. Le chrome existait dans le code sans contrat écrit.

## Attendu

Cinq capacités `LOCAL`, toutes consommées par `work` : navigation, capture, détail, vues générées, fallback manuel. Quatre politiques imposées.

## Critères d'acceptation (gelés)

- **AC-1** Chaque capacité du socle nomme au moins un BC consommateur.
- **AC-2** La capture n'écrit que `raster/inbox.md` — jamais un ticket, jamais un dossier.
- **AC-3** Les vues (`INDEX.tsv`, `BACKLOG.md`, `SPRINT.md`) sont régénérables : les supprimer puis relancer le regen restitue l'identique.
- **AC-4** L'app démarre sans base ni auth, sur un simple `git clone`.

## Preuves attendues

- e2e : suppression des trois vues → `node raster/regen.mjs` → contenu identique (couvre `AC-3`)
- e2e : la capture ne modifie aucun fichier hors `raster/inbox.md` (couvre `AC-2`)
- Parcours UI : navigation entre les quatre vues

Canvas : [`../ux/socle-wireframe.canvas.tsx`](../ux/socle-wireframe.canvas.tsx)
