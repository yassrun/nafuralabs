# Socle — Raster

> Contexte transverse. Sections : capacités · contrats · politiques · rôles · matrice · liens.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md) § Le socle.

## Intention

Le chrome de l'app : se déplacer, **arbitrer**, capturer, voir un détail. Il ne décrit **pas** le contrat des tickets — c'est le BC `work`.

En mode autonome tu n'appuies plus sur « Lancer » : tu arbitres. L'écran répond donc à une seule question — **qu'est-ce qui m'attend, et que me demande-t-on ?**

## Capacités

Chaque capacité nomme au moins un BC consommateur. Sans consommateur, elle se supprime.

| Capacité | Mode | Consommée par |
|----------|------|---------------|
| **Navigation** — **Toi** · Inbox · Backlog · Sprint · Done agent | `LOCAL` | work · orchestration |
| **File d'attente** — ce qui te rend la main, avec ce qu'on te demande | `LOCAL` | work |
| **Panneau de décision** — question, rapport de livraison, actions | `LOCAL` | work |
| **Capture** — sticky, écrit une ligne d'inbox | `LOCAL` | work |
| **Readiness affichée** — lançable / bloqué par, dans l'arbre | `LOCAL` | orchestration |
| **Vues générées** — INDEX · BACKLOG · SPRINT | `LOCAL` | work |
| **Fallback manuel** — éditer le markdown, `node raster/t.mjs index` | `LOCAL` | work |

Aucune capacité `PLATFORM_CONSUMED` ni `EXTERNAL_MANAGED` : le CADRE déclare zéro voisin.

## Contrats de consommation

- **Navigation** — un BC expose des vues nommées ; le socle les monte. Il n'interprète pas leur contenu.
- **Capture** — le socle écrit une **ligne de texte** dans `raster/inbox.md`. Il ne crée jamais de ticket : qualifier est le travail du spec, au promote.
- **Vues générées** — le socle affiche ; il ne calcule pas. Le calcul appartient à `work`.
- **Écriture** — le socle **n'écrit aucune task**. Toute mutation passe par les modules du CLI (`AGENTS.md` §0.1-9). Un refus du CLI ressort en `400`, avec son message : c'est une erreur de l'appelant, pas une panne.
- **Readiness** — affichée telle quelle. Le socle ne décide jamais qu'un sous-lot est lançable ; il montre le verdict de `work`.
- **Attente** — le champ `attend` est **dérivé côté serveur** (gate à `done-agent`, blocage externe, question posée). Le front ne le recalcule pas, sinon les deux divergent.

## Politiques imposées

| ID | Règle |
|----|-------|
| `POL-FICHIER-SSOT` | La source est le fichier Git. Toute vue est **régénérable** ; aucune donnée ne vit que dans une vue. |
| `POL-VUES-GENEREES` | `INDEX.tsv`, `BACKLOG.md`, `SPRINT.md` ne s'éditent **jamais** à la main. |
| `POL-CAPTURE-INBOX` | La capture n'écrit **que** `raster/inbox.md`. Jamais un ticket, jamais un dossier. C'est la **seule** écriture directe que le socle conserve — une ligne d'inbox n'est pas une task. |
| `POL-ECRITURE-CLI` | Aucune task ne s'écrit hors du CLI. Le socle appelle `write.mjs`, il ne touche pas aux fichiers de task. |
| `POL-SANS-BASE` | Ni base de données, ni auth, ni état serveur. Un `git clone` suffit. |

Un BC **référence** ces IDs, il n'en recopie pas le texte. Conflit politique ↔ règle BC → la politique.

**Exceptions déclarées :** aucune.

## Catalogue de rôles

**Aucun.** Le CADRE ne déclare que `toi` et `agent`, qui sont des acteurs, pas des rôles. Pas d'auth (`POL-SANS-BASE`), donc rien à autoriser.

## Matrice

**Aucune** — voir ci-dessus. Pas de worker de jeux : sans rôles ni base, il n'y a pas de jeu de données à semer.

## Liens

- **consomme** BC `work` (tickets, vues, écriture) · BC `orchestration` (readiness, fenêtre)
- Canvas : [`ux/socle-wireframe.canvas.tsx`](ux/socle-wireframe.canvas.tsx) (chrome) · [`ux/decision-wireframe.canvas.tsx`](ux/decision-wireframe.canvas.tsx) (arbitrage)
