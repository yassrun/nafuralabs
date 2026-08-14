# Socle — Raster

> Contexte transverse. Sections : capacités · contrats · politiques · rôles · matrice · liens.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md) § Le socle.

## Intention

Le chrome de l'app : se déplacer, capturer, voir un détail. Il ne décrit **pas** le contrat des tickets — c'est le BC `work`.

## Capacités

Chaque capacité nomme au moins un BC consommateur. Sans consommateur, elle se supprime.

| Capacité | Mode | Consommée par |
|----------|------|---------------|
| **Navigation** — Inbox · Backlog · Sprint · Done agent | `LOCAL` | work |
| **Capture** — sticky, écrit une ligne d'inbox | `LOCAL` | work |
| **Détail** — panneau droit sur une task | `LOCAL` | work |
| **Vues générées** — INDEX · BACKLOG · SPRINT | `LOCAL` | work |
| **Fallback manuel** — éditer le markdown, `node raster/t.mjs index` | `LOCAL` | work |

Aucune capacité `PLATFORM_CONSUMED` ni `EXTERNAL_MANAGED` : le CADRE déclare zéro voisin.

## Contrats de consommation

- **Navigation** — un BC expose des vues nommées ; le socle les monte. Il n'interprète pas leur contenu.
- **Capture** — le socle écrit une **ligne de texte** dans `raster/inbox.md`. Il ne crée jamais de ticket : qualifier est le travail du spec, au promote.
- **Vues générées** — le socle affiche ; il ne calcule pas. Le calcul appartient à `work`.

## Politiques imposées

| ID | Règle |
|----|-------|
| `POL-FICHIER-SSOT` | La source est le fichier Git. Toute vue est **régénérable** ; aucune donnée ne vit que dans une vue. |
| `POL-VUES-GENEREES` | `INDEX.tsv`, `BACKLOG.md`, `SPRINT.md` ne s'éditent **jamais** à la main. |
| `POL-CAPTURE-INBOX` | La capture n'écrit **que** `raster/inbox.md`. Jamais un ticket, jamais un dossier. |
| `POL-SANS-BASE` | Ni base de données, ni auth, ni état serveur. Un `git clone` suffit. |

Un BC **référence** ces IDs, il n'en recopie pas le texte. Conflit politique ↔ règle BC → la politique.

**Exceptions déclarées :** aucune.

## Catalogue de rôles

**Aucun.** Le CADRE ne déclare que `toi` et `agent`, qui sont des acteurs, pas des rôles. Pas d'auth (`POL-SANS-BASE`), donc rien à autoriser.

## Matrice

**Aucune** — voir ci-dessus. Pas de worker de jeux : sans rôles ni base, il n'y a pas de jeu de données à semer.

## Liens

- **consomme** BC `work` (affiche ses tickets et ses vues)
- Canvas : [`ux/socle-wireframe.canvas.tsx`](ux/socle-wireframe.canvas.tsx)
