# BC orchestration — la conduite

> Ce qui est **vrai maintenant**. Pas de futur ici : le reste à faire vit dans le backlog.
> Canon : [`PACT_BLUEPRINT.md`](../../../PACT_BLUEPRINT.md) · [`RASTER_BLUEPRINT.md`](../../../RASTER_BLUEPRINT.md).

## Intention

Tu ouvres une fenêtre ; des agents la déroulent en parallèle et s'arrêtent au bout. Le BC dit **ce qui est ouvert**, **ce qui est lançable**, et **qui le lance**.

## Ce que ça fait

- Lit `<projet>/ROADMAP.md` et sa **borne** — les lots que l'orchestrateur peut ouvrir seul
- Croise avec la **readiness** (`work`) pour donner les sous-lots lançables maintenant
- Porte le skill `orchestration` (la boucle) et les agents `exec` · `spec` · `qa` (les rôles)
- **Isole** : une branche et un `git worktree` par sous-lot, hors du dépôt
- **Lance** : un processus par lot, suivi, arrêtable — le seul endroit où Raster exécute

## Limites

**owns** — la fenêtre de travail, la borne, la boucle d'orchestration, la définition des rôles d'agent
**not_owns** — le contrat des tickets, la readiness elle-même, le promote, le sprint : **`work`** · le chrome et le détail : **socle** · le contenu Pact : personne ne l'indexe

La roadmap est **écrite à la main** et n'est jamais générée : elle porte des lots qui n'ont ni task ni dossier. Un ordre dérivé ne dirait que ce qui existe déjà, donc jamais l'intention.

## Intervenants

`toi` — déplaces la borne, tranches les questions bloquantes, approuves.
`orchestrateur` — ouvre les lots de la fenêtre, lance un agent par sous-lot, collecte les rapports.
`agent` — `exec` · `spec` · `qa`. **`orch` n'est pas un `type:` de task** : c'est un rôle, porté par un skill.

## Données

| Objet | Forme | Obligations |
|-------|-------|-------------|
| **Roadmap** | `<projet>/ROADMAP.md` | écrite à la main · hors `raster-src/` · jamais indexée |
| **Borne** | marqueur `<!-- borne -->` | **un seul** par fichier · ce qui est au-dessus est ouvert |
| **Fenêtre** | dérivée | les lots cités au-dessus de la borne |
| **Lançable** | dérivé | un sous-lot d'un lot de la fenêtre, sans dépendance externe ouverte |
| **Worktree** | dossier hors dépôt | un par sous-lot · `<parent-du-dépôt>/.raster-worktrees/<projet>/<CH>` |
| **Lot tenu** | **en mémoire** | jamais sur disque — un processus mort ne laisse pas d'état menteur |
| **Commande d'agent** | `RASTER_AGENT_CMD` | environnement local · Raster ne la lit que pour lancer, ne l'écrit jamais |

## États

```
lot cité au-dessus de la borne   → ouvert
lot cité en dessous              → fermé
aucun marqueur / borne en tête   → fenêtre VIDE
```

L'orchestrateur s'arrête sur trois choses, et trois seulement : la **borne**, une `gate: me`, une **question bloquante**.

## Règles

- **INV-1** La roadmap n'est jamais générée. Elle est un acte, pas un calcul.
- **INV-2** **Le défaut est fermé.** Pas de marqueur, marqueur en tête, fichier absent : fenêtre vide. Un fichier mal formé n'élargit jamais l'autonomie.
- **INV-3** Un lot n'est tenu que par **un** orchestrateur ; un sous-lot par **un** exec. Les tasks d'un sous-lot sont en série.
- **INV-4** Le skill ne recopie aucune règle d'[`AGENTS.md`](../../AGENTS.md) — il y renvoie. Cursor ne lit pas les skills ; une règle recopiée serait une règle que Cursor n'a pas.
- **R-1** Une branche et un `git worktree` par sous-lot, **hors du dépôt** — sinon le walker compte chaque task une fois par branche vivante.
- **R-2** Le code part sur la branche ; les tasks restent sur l'arbre d'intégration, écrites par le CLI.
- **R-3** **Aucun agent ne pousse.** Merges locaux ; `git push` est un geste humain. Rien dans `spawn.mjs` n'invoque git.
- **R-4** **Le défaut est fermé aussi pour l'exécution.** Sans `RASTER_AGENT_CMD`, le lancement refuse et le dit. Raster ne devine pas de commande, ne cherche pas de clé, n'en écrit aucune.
- **R-5** Un lot n'est **jamais tenu deux fois**. L'état est libéré à la sortie du processus, quelle qu'en soit la cause.
- **R-6** Le drapeau `core.longpaths` est passé **par commande**. Windows coupe à 260 caractères et un worktree ajoute son préfixe : sans ce drapeau, `git worktree add` échoue à mi-checkout. La config du dépôt et les réglages du système restent intacts.

Soumis à `POL-FICHIER-SSOT` · `POL-VUES-GENEREES` · `POL-SANS-BASE`.

## Liens

- **consomme** `work` (readiness, contrat des tickets) · **socle** (affichage)
- Décisions du 2026-08-16 : [`AGENTS.md`](../../AGENTS.md) §7
