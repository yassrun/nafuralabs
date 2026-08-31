# Blueprint — Raster

**Raster** organise et exécute le travail d’un projet : capture, planification, agents, preuves et livraison.
Il fonctionne seul pour tout type de projet.

Canon opérationnel : [`raster/AGENTS.md`](raster/AGENTS.md).
Harness (enchaînement agents, QA NOK) : [`raster/HARNESS.md`](raster/HARNESS.md).

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

## Deux volets

### Plan

Le Plan appartient à **un projet**. Il montre :

- les lots de `ROADMAP.md` ;
- leur ordre voulu ;
- la borne d’autonomie `<!-- borne -->` ;
- les sous-lots de chaque lot ;
- leur readiness calculée.

La borne répond à **« est-ce permis ? »**. La déplacer est un geste humain.

### Session

La Session peut rassembler plusieurs projets. Elle montre :

- les sous-lots actuellement lançables ;
- les Runs actives ;
- l’orchestrateur de chaque Run ;
- les agents Spec, Exec et QA ;
- les gates et questions qui attendent l’humain.

Le graphe répond à **« est-ce possible ? »**. La Session est le front autorisé et prêt ; elle n’est jamais stockée à la main.

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
gate: none
blocked_by: [RAS-206]
tags: [ui]
```

Enums :

- `status:` `todo` | `doing` | `blocked` | `review` | `done-agent` | `done-me`
- `type:` `spec` | `feature` | `bug` | `tech` | `physical` | `qa`
- `agent_type:` `spec` | `exec` | `qa`
- `assignee:` `me` | `agent` | `either`
- `gate:` `none` | `me`
- `priority:` `P0` | `P1` | `P2` | `P3`

Mapping par défaut :

| Type de travail | Agent |
|---|---|
| `spec` | `spec` |
| `feature`, `bug`, `tech` | `exec` |
| `qa` | `qa` |
| `physical` | `exec`, avec assignee explicite |

L’interface peut afficher **Code** pour `agent_type: exec`.

---

## Agents

| Rôle | Affectation | Responsabilité |
|---|---|---|
| **Orchestrator** | Run / sous-lot | calcule, lance, transmet, collecte et s’arrête |
| **Spec** | Task `agent_type: spec` | clarifie le besoin, écrit le plan, découpe et prépare les preuves attendues |
| **Code** | Task `agent_type: exec` | implémente et écrit les preuves automatisées |
| **QA** | Task `agent_type: qa` | exécute les preuves et rend le verdict |

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

`blocked_by` entre tasks d’un même sous-lot ordonne leur exécution en série.
Un `blocked_by` vers un autre sous-lot crée une dépendance du graphe.
`status: blocked` signifie toujours une attente extérieure à Raster.

---

## Écriture

Le CLI possède la structure et l’état :

```bash
node raster/t.mjs new <projet> <lot[/sous-lot]> "<titre>"
node raster/t.mjs promote "<ligne inbox>" <projet> <lot[/sous-lot]>
node raster/t.mjs status <id> <statut>
node raster/t.mjs approve <id>
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

Une feature ou un bug passe par `review`, puis le QA pose `done-agent`.
Avec `gate: none`, `done-agent` devient automatiquement `done-me`.
Avec `gate: me`, l’approbation humaine est le seul chemin vers `done-me`.
`sweep` retire ensuite les tasks `done-me` ; Git porte l’historique.

---

## Vues dérivées

- `raster/INDEX.tsv` — index agent et moteur
- `raster/BACKLOG.md` — arbre du travail actif
- `ready` — sous-lots techniquement lançables
- `window` — lots permis par la borne
- UI — Session, Plan, Inbox, Backlog, Livraisons

Les vues sont calculées. Elles ne deviennent jamais une deuxième source de vérité.
