# AGENTS.md — Raster

> **Pause monorepo :** hors travail **sur le produit Raster lui-même**, ne pas appliquer ce fichier. Le reste de NafuraLabs ne passe plus par Inbox / Tasks / Session.

> Raster organise le travail : Inbox → Ready → Session.  
> Blueprint : [`RASTER_BLUEPRINT.md`](../RASTER_BLUEPRINT.md) · Harness : [`HARNESS.md`](HARNESS.md).

## 1. Règles dures

1. Une demande nouvelle entre par `raster/inbox.md`.
2. `promote` la rattache à un projet et à un lot ou sous-lot.
3. Lot et sous-lot sont des dossiers, jamais des tickets.
4. Une Task est créée uniquement par `node raster/t.mjs new` ou `promote`.
5. Le CLI possède l’ID, le chemin, le frontmatter, les enums et les statuts.
6. Les agents mutent un statut uniquement avec `node raster/t.mjs status`.
7. Une Task rendue contient un rapport de livraison concis.
8. Les agents ne poussent jamais.
9. Après toute mutation : `node raster/t.mjs check`.

L’humain intervient à l’Inbox, à la promotion et au passage de Ready vers Session. Une sous-session lancée ne porte ni gate ni attente humaine.

## 2. Arbre canonique

```text
<projet>/
├── ROADMAP.md
└── raster-src/
    ├── NEXT
    └── lots/
        └── <lot>/
            ├── tasks/
            │   └── {ID}-{slug}.md
            └── <sous-lot>/
                ├── 00-PLAN.md
                ├── ux/                 optionnel
                └── tasks/
                    └── {ID}-{slug}.md
```

Un sous-lot est une tranche livrable. En Session, il devient une sous-session autonome.

## 3. Task

```yaml
id: RAS-207
status: todo
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
blocked_by: [RAS-206]
tags: [ui]
```

Enums :

- `status:` `todo` | `doing` | `blocked` | `done`
- `type:` `spec` | `feature` | `bug` | `tech` | `physical`
- `agent_type:` `spec` | `exec`
- `priority:` `P0` | `P1` | `P2` | `P3`
- `assignee:` `me` | `agent` | `either`

`parent` et `ready` ne sont pas stockés. Le parent vient du chemin ; Ready est calculé.

Corps minimal :

```markdown
# Titre

> Résultat attendu.

## Étapes
- [ ] Travail

## Journal
DD/MM HH:MM  entrée append-only

## Rapport de livraison
ce qui a changé · validation technique exécutée · écarts
```

La validation technique appartient à Code. Il n’existe pas de Task ni de phase QA dédiée dans le MVP.

## 4. Pipeline

```text
Spec → Code → Done
```

- **Spec** clarifie et découpe.
- **Code** implémente, valide techniquement et pose `done`.
- **Done** clôt la Task ; `sweep` la retire du backlog actif.

L’orchestrateur de Session est déterministe : il calcule, lance, suit et relance. Il ne code pas.

## 5. Ready et Session

Un sous-lot est Ready si :

1. toutes ses dépendances externes sont `done` ;
2. aucune Task n’est `blocked` ;
3. il reste du travail ;
4. aucune sous-session ne le tient déjà.

Le passage **Ready → Session** est un geste humain. Ensuite Raster lance un harness Cursor par sous-lot.

À l’intérieur :

- les Tasks Spec passent avant Code ;
- les dépendances internes déterminent le front exécutable ;
- mode `local` : une Task Code à la fois ;
- mode `agents` : les Tasks Code indépendantes du front peuvent être parallélisées par le harness Cursor ;
- Raster suit le statut consolidé du sous-lot.

## 6. Modes d’exécution

Les commandes et clés vivent dans l’environnement, jamais dans le dépôt :

```text
CURSOR_API_KEY       clé du SDK Cursor
RASTER_CLOUD_REPO    URL GitHub connectée à Cursor, requise en cloud
RASTER_CLOUD_REF     branche de départ cloud, optionnelle
```

Raster fournit son runner `@cursor/sdk`. `RASTER_LOCAL_CMD` et `RASTER_AGENTS_CMD` permettent de le remplacer ; `RASTER_AGENT_CMD` reste un alias local de compatibilité.

```bash
node raster/t.mjs run <projet> <lot> [sous-lot] --mode local
node raster/t.mjs run <projet> <lot> [sous-lot] --mode agents
node raster/t.mjs running
node raster/t.mjs stop <projet> <lot> [sous-lot]
```

Raster passe au runner un brief sur stdin. Le runner adapte ce contrat au Cursor SDK local ou cloud.

- en local, le brief donne le chemin absolu du CLI de contrôle ;
- en agents, le runner renvoie sur stdout `RASTER_RESULT {"done":[...],"blocked":[...]}` ;
- Raster ignore tout ID qui n’appartient pas à la vague confiée ;
- après progrès, la boucle recalcule et lance automatiquement la vague suivante.

## 7. CLI

```bash
node raster/t.mjs index
node raster/t.mjs check
node raster/t.mjs ready [projet] [--json]
node raster/t.mjs window [projet] [--json]

node raster/t.mjs new <projet> <lot[/sous-lot]> "<titre>" [options]
node raster/t.mjs promote "<ligne inbox>" <projet> <lot[/sous-lot]>
node raster/t.mjs status <id> todo|doing|blocked|done
node raster/t.mjs sweep [--dry]
```

## 8. Interdit

- Créer ou déplacer une Task manuellement.
- Réintroduire `qa`, `review`, `done-agent`, `done-me`, `gate` ou une attente humaine en Session.
- Lancer Code sur une demande non promue.
- Lancer plusieurs workers locaux dans le même worktree.
- Stocker une commande agent ou une clé dans le dépôt.
- Pousser depuis un agent.
