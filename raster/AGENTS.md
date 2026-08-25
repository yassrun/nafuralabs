# AGENTS.md — Raster

> Raster est le système autonome de travail du dépôt : projet · lot · sous-lot · task · Run · livraison.
> Blueprint : [`RASTER_BLUEPRINT.md`](../RASTER_BLUEPRINT.md).

**Actors :** `me` | `agent`.
**Priorité :** capture rapide, état mécanique fiable, autonomie bornée, rapport lisible.

---

## 1. Règles dures

1. Rien ne s’exécute sans Task Raster.
2. Une demande nouvelle entre par `raster/inbox.md`, puis `promote` la rattache à un projet et un lot ou sous-lot.
3. Lot et sous-lot sont des dossiers, jamais des tickets.
4. Une Task est créée uniquement par `node raster/t.mjs new` ou `promote`.
5. Le CLI possède l’ID, le chemin, le frontmatter, les enums et les mutations d’état.
6. Les agents utilisent `status` et `approve`; ils ne patchent jamais ces champs directement.
7. `done-me` ne se pose pas : il résulte d’une approbation ou d’une gate automatique.
8. Une Task rendue porte un rapport de livraison. Une attente humaine porte une question explicite.
9. Les agents ne poussent jamais. Les branches et merges restent locaux jusqu’au geste humain final.
10. Après toute mutation : `node raster/t.mjs check`.

---

## 2. Arbre canonique

```text
<projet>/
├── ROADMAP.md
└── raster-src/
    ├── NEXT
    └── lots/
        └── <lot>/
            ├── LOT.md                    optionnel
            ├── tasks/                    lot simple
            │   └── {ID}-{slug}.md
            └── <sous-lot>/
                ├── 00-PLAN.md
                ├── ux/                   optionnel
                └── tasks/
                    └── {ID}-{slug}.md
```

Le défaut est **Lot → Task**.
Créer un sous-lot seulement pour une tranche livrable indépendante avec son propre plan.
Si un lot possède des sous-lots, toutes ses nouvelles tasks vivent dans un sous-lot.

---

## 3. Task

### Frontmatter

```yaml
id: RAS-207
status: todo
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [RAS-206]
tags: [ui]
```

Enums fermés :

- `status:` `todo` | `doing` | `blocked` | `review` | `done-agent` | `done-me`
- `type:` `spec` | `feature` | `bug` | `tech` | `physical` | `qa`
- `agent_type:` `spec` | `exec` | `qa`
- `priority:` `P0` | `P1` | `P2` | `P3`
- `assignee:` `me` | `agent` | `either`
- `gate:` `none` | `me`

`parent` n’existe pas : le parent est le chemin.
`ready` n’existe pas dans le frontmatter : il est calculé.

### Corps

```markdown
# Titre

> Résultat attendu en deux lignes maximum.

## Étapes
- [ ] Étape de travail

## Preuves attendues
- Commande, scénario ou observation qui démontre le résultat

## Journal
DD/MM HH:MM  entrée append-only

## Rapport de livraison
ce qui a changé
preuves exécutées
décidé seul
écarts / dette
```

Une Task qui attend l’humain ajoute :

```markdown
## Question

<décision attendue>

- **A** — conséquence
- **B** — conséquence

Recommandé : A — raison
```

Le corps narratif est éditable directement. Le fichier, son frontmatter et ses statuts restent sous contrôle du CLI.

---

## 4. Types et agents

| `type` | Sens | `agent_type` |
|---|---|---|
| `spec` | clarifier, découper, planifier, préparer l’UX et les preuves | `spec` |
| `feature` | comportement nouveau | `exec` |
| `bug` | comportement existant à corriger | `exec` |
| `tech` | refonte, performance ou migration sans nouveau comportement | `exec` |
| `physical` | appeler, signer, acheter ou autre travail hors logiciel | `exec` |
| `qa` | exécuter les preuves et rendre le verdict | `qa` |

L’UI affiche **Code** pour `exec`.
`assignee` indique qui exécute; `agent_type` indique la compétence.

### Orchestrator

Orchestrator est un rôle de **Run**, pas un type de Task. Il :

- lit `window` et `ready` ;
- prend les sous-lots du front autorisé ;
- lance un agent par sous-lot ;
- enchaîne les tasks en série ;
- collecte les rapports ;
- s’arrête à la borne, sur une gate ou sur une question bloquante.

---

## 5. CLI

### Lecture

```bash
node raster/t.mjs index
node raster/t.mjs check
node raster/t.mjs ready [projet] [--json]
node raster/t.mjs window [projet] [--json]
```

### Écriture

```bash
node raster/t.mjs new <projet> <lot[/sous-lot]> "<titre>" [options]
node raster/t.mjs promote "<ligne inbox>" <projet> <lot[/sous-lot]>
node raster/t.mjs status <id> <statut>
node raster/t.mjs approve <id>
node raster/t.mjs sweep [--dry]
```

### Exécution

```bash
node raster/t.mjs worktree add <projet> <lot> [sous-lot]
node raster/t.mjs worktree rm <projet> <lot> [sous-lot]
node raster/t.mjs run <projet> <lot> [sous-lot]
node raster/t.mjs running
node raster/t.mjs stop <projet> <lot>
```

---

## 6. Plan et readiness

`<projet>/ROADMAP.md` est écrit à la main. Il ordonne les lots et contient un marqueur unique `<!-- borne -->`.

- au-dessus : Raster est autorisé à lancer ;
- en dessous : Raster n’est pas autorisé ;
- déplacer la borne est une décision humaine.

Un sous-lot est `ready` si :

1. toutes ses dépendances externes sont closes ;
2. aucune task n’est `blocked` ;
3. il reste une task ouverte ;
4. aucune Run ne le tient déjà.

`blocked_by` interne au sous-lot ordonne les tasks.
`blocked_by` externe crée une arête entre sous-lots.
`status: blocked` signifie uniquement un blocage extérieur.

---

## 7. Exécution et Git

Une session utilise une branche `session/<projet>-<date>`.
Chaque sous-lot utilise son propre worktree hors dépôt :

```text
../.raster-worktrees/<projet>/<sous-lot>
```

Branche du sous-lot :

```text
<lot-slug>/<sous-lot-slug>
```

Les tasks restent dans l’arbre d’intégration et sont mutées par le CLI.
Le code part dans le worktree.
Un sous-lot n’est tenu que par un agent à la fois.

---

## 8. Statuts et livraison

```text
feature | bug : todo → doing → review → done-agent → done-me → sweep
spec | tech | physical | qa : todo → doing → done-agent → done-me → sweep
```

L’agent Exec pose `review` sur feature et bug.
Le QA est le seul à poser `done-agent` sur feature et bug.

| Gate | Après `done-agent` |
|---|---|
| `none` | passage automatique à `done-me` |
| `me` | attend l’approbation humaine |

`sweep` supprime les tasks `done-me` et nettoie leurs références. Git porte l’historique.

---

## 9. Interdit

- Créer ou déplacer une Task manuellement.
- Inventer un enum, `parent`, `ready`, `estimate` ou une sélection de session stockée.
- Utiliser un document d’index manuel comme seconde source de vérité.
- Lancer directement un Exec sur une demande non capturée.
- Laisser une gate ou un blocage sans `## Question`.
- Poser `done-me` directement.
- Pousser depuis un agent.
