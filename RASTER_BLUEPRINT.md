# Blueprint — Raster

**Raster** organise et exécute le travail d’un projet : capture, planification, agents, preuves et livraison.
Il fonctionne seul pour tout type de projet.

Canon opérationnel : [`raster/AGENTS.md`](raster/AGENTS.md).
Harness (pipeline Spec → Code → Done) : [`raster/HARNESS.md`](raster/HARNESS.md).

---

## Modèle

```text
Projet
└── Lot
    ├── Task
    └── Sous-lot
        ├── 00-PLAN.md
        ├── ux/                 optionnel
        └── tasks/
            └── {ID}-{slug}.md
```

| Objet | Nature | Rôle |
|---|---|---|
| **Projet** | dossier pair du dépôt | frontière du produit et des IDs |
| **Lot** | dossier | chapitre de la roadmap |
| **Sous-lot** | dossier | tranche livrable, planifiée et exécutable |
| **Task** | fichier Markdown | seule unité de travail et d’état |
| **Run** | état runtime | exécution temporaire d’un orchestrateur |
| **Livraison** | rapport de task | résultat, preuves, décisions et écarts |

Lot et sous-lot ne sont jamais des tickets. Leur état est calculé depuis leurs tasks.

---

## Où vit le travail

```text
<projet>/
├── ROADMAP.md
├── raster-src/
│   ├── NEXT
│   └── lots/
│       └── <lot>/
│           ├── LOT.md                 optionnel
│           ├── tasks/                 lot simple
│           └── <sous-lot>/
│               ├── 00-PLAN.md
│               ├── ux/                optionnel
│               └── tasks/
├── e2e/
└── sources/
```

Chaque projet possède son propre `raster-src/`, son préfixe d’IDs et sa roadmap.
L’inbox reste globale : `raster/inbox.md`.

---

## Lot ou sous-lot

Le défaut est **Lot → Task**.

Créer un sous-lot seulement lorsqu’une tranche :

1. produit un résultat livrable indépendamment ;
2. possède son propre plan ;
3. peut être exécutée par un agent sans lire les autres tranches.

Un lot qui contient déjà des sous-lots ne reçoit plus de tasks directes.
Un sous-lot vide n’existe pas : sa création et celle de sa première task sont atomiques via le CLI.

> Un sous-lot est la plus petite tranche livrable qui mérite son propre plan.

Une app métier peut coller **lot permanent = BC** (chapitre stable). Ce n’est pas une règle Raster : c’est Pact + une décision du projet. Sektor : [`sektor/raster-src/DECISIONS.md`](sektor/raster-src/DECISIONS.md). Platform et socle ne sont pas des BC métier ; leur travail n’entre pas dans un lot BC par défaut.

---

## Inbox, Ready, Session

- **Inbox** reçoit la discussion et les captures.
- **Promotion** transforme une capture en travail structuré.
- **Ready** calcule les sous-lots autonomes qui peuvent être lancés.
- **Session** contient les sous-lots explicitement lancés par l’humain.

La Session peut rassembler plusieurs projets. Elle montre :

- les sous-sessions lancées ;
- les Runs actives ;
- leur mode local ou agents ;
- les phases Spec et Code ;
- leur statut consolidé.

Un sous-lot devient une sous-session lorsqu’il passe de Ready à Session. Après ce geste, il n’existe plus d’attente humaine dans son exécution.

---

## Task

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
- `assignee:` `me` | `agent` | `either`
- `priority:` `P0` | `P1` | `P2` | `P3`

Mapping par défaut :

| Type de travail | Agent |
|---|---|
| `spec` | `spec` |
| `feature`, `bug`, `tech` | `exec` |
| `physical` | `exec`, avec assignee explicite |

L’interface peut afficher **Code** pour `agent_type: exec`.

---

## Agents

| Rôle | Affectation | Responsabilité |
|---|---|---|
| **Orchestrator** | Session | calcule, lance, suit et relance les sous-sessions |
| **Spec** | Task `agent_type: spec` | clarifie le besoin, écrit le plan et découpe |
| **Code** | Task `agent_type: exec` | implémente, valide techniquement et termine la Task |

Orchestrator est un rôle runtime, jamais un `agent_type` de Task.

---

## Readiness dérivée

Raster ne stocke jamais `ready: true`.

Un sous-lot est lançable si :

1. son lot est au-dessus de la borne ;
2. toutes ses dépendances externes sont closes ;
3. aucune task ne porte un blocage externe ;
4. il reste du travail à exécuter ;
5. aucune autre Run ne tient déjà ce sous-lot.

`blocked_by` entre Tasks d’un même sous-lot ordonne leur front d’exécution.
Un `blocked_by` vers un autre sous-lot crée une dépendance du graphe.
`status: blocked` signifie toujours une attente extérieure à Raster.

En mode local, Raster confie une Task Code à la fois au harness. En mode agents, toutes les Tasks Code indépendantes du front peuvent être parallélisées par Cursor Cloud.

---

## Écriture

Le CLI possède la structure et l’état :

```bash
node raster/t.mjs new <projet> <lot[/sous-lot]> "<titre>"
node raster/t.mjs promote "<ligne inbox>" <projet> <lot[/sous-lot]>
node raster/t.mjs status <id> <statut>
node raster/t.mjs check
```

Un agent ne crée jamais un fichier Task ni son frontmatter à la main.
Les documents de conception (`ROADMAP.md`, `LOT.md`, `00-PLAN.md`, `ux/`) et le code sont édités directement.
Le corps narratif d’une task reste éditable jusqu’à ce que le CLI expose des commandes dédiées pour le journal, les questions et le rapport.

---

## Livraison

Une task rendue contient :

```text
ce qui a changé
preuves exécutées
décidé seul
écarts / dette
```

Une Task suit `todo → doing → done`, ou `blocked` en cas d’attente extérieure.
Code porte sa validation technique et pose `done`.
`sweep` retire ensuite les Tasks `done` ; Git porte l’historique.

---

## Vues dérivées

- `raster/INDEX.tsv` — index agent et moteur
- `raster/BACKLOG.md` — arbre du travail actif
- `ready` — sous-lots techniquement lançables
- `window` — lots permis par la borne
- UI — Inbox, Ready, Session

Les vues sont calculées. Elles ne deviennent jamais une deuxième source de vérité.
