# Blueprint — Raster

**Statut :** figé (2026-08-13)  
**Raster** = comment on **orchestre le travail** (lot · sous-lot · task). Vit **seul** (compta, perso…). Peut se **brancher** sur Pact : [`PACT_BLUEPRINT.md`](PACT_BLUEPRINT.md).  
Code : [`ARCHI_BLUEPRINT.md`](ARCHI_BLUEPRINT.md).  
Contrat agents : [`raster/AGENTS.md`](raster/AGENTS.md).

---

## Raster est un projet

`nafuralabs/` = dossier de **projets**. **`raster/`** n’est pas un moteur hors-projet : c’est le **projet Raster**.

| Dossier | Rôle |
|---------|------|
| **`raster/`** | Projet Raster (app + moteur INDEX / Sprint / CLI) |
| **`<projet>/raster-src/`** | Fichiers Raster de **ce** projet — **obligatoire** (y compris `raster/raster-src/`) |
| **`<projet>/pact/`** | Pact — **si app ou site** |
| **`<projet>/ops/`** | Ops — **obligatoire si Pact** — [`OPS_BLUEPRINT.md`](OPS_BLUEPRINT.md) |

```text
nafuralabs/
├── raster/                         # projet Raster
│   ├── raster-src/
│   ├── pact/
│   ├── ops/
│   └── sources/web/                # UI — moteur (t.mjs) à la racine
├── nafura-platform/
│   ├── raster-src/
│   ├── pact/
│   ├── ops/                        # infra lab (cluster, IAM, Vault, nlops)
│   └── sources/
├── sektor/
│   ├── raster-src/
│   ├── pact/
│   ├── ops/                        # overlay / images Sektor seulement
│   └── sources/
└── compta/
    └── raster-src/
```

Intérieur d'un projet (slots `sources/`) : [`NAFURALABS.md`](NAFURALABS.md) § Intérieur.

## Raster un projet

**Raster** est un verbe : donner à un projet un endroit où le travail vit. Aucun prérequis — même un projet non logiciel.

**On raster d'abord, on pacte ensuite.** Pacter est du travail, et tout travail vit dans une task : le lot `cadre` et sa task `spec` existent **avant** le `CADRE.md` qu'ils produisent. Les trois cas de branchement : [`PACT_BLUEPRINT.md`](PACT_BLUEPRINT.md) § Se brancher.

**Projet déjà développé : Raster part du vide.** Pas de reprise du passé — le backlog contient ce qu'on va faire, pas ce qu'on a fait. Côté Pact on écrit le CADRE et les SPEC ([`PACT_BLUEPRINT.md`](PACT_BLUEPRINT.md) § Projet déjà développé).

Canon tasks : `<projet>/raster-src/lots/…/tasks/*.md`.  
**Aucun chemin legacy.** `docs/specs/lots` et `<projet>/raster/lots/` ne sont ni scannés ni présents — sortis du dépôt le 2026-08-13.

---

## Vocabulaire

Raster **prend** : **lot · sous-lot · task**.

| | Forme | Rôle | `done` ? |
|--|-------|------|----------|
| **Lot** | **dossier** | Chapeau vivant | **jamais** |
| **Sous-lot** | **dossier** | Groupe de tasks | **dérivé** ⇔ toutes ses tasks `done` |
| **Task** | **fichier** | Seule unité sprintable | oui, une par une |

**Seule la task est un ticket.** Les chapeaux sont des dossiers : leur état se calcule au scan, il ne se stocke pas. Donc `kind` n’existe pas, et `parent:` non plus — le chemin le porte.

Parent des tasks = le **sous-lot**, pas le lot.

### Projection Pact (si branché) — mapping, pas identité

| Raster | ← | Pact |
|--------|---|------|
| lot | | **CADRE** \| **socle** \| **BC** |
| sous-lot | | **change (CH)** — **nom identique des deux côtés** |
| task | | work du change |

Phrase : *on ouvre un EVOL sur le BC RH ; Raster le projette en sous-lot.*

Le lot **`cadre`** porte les changes du CADRE. C’est un **pair** des autres lots, pas un contenant : les lots sont plats.

### Quand créer un sous-lot — le branchement décide

| | Arbre | Critère |
|--|-------|---------|
| **Branché Pact** | projet → lot → **sous-lot (= le CH)** → task | **aucun** — le sous-lot *est* le CH, toujours |
| **Raster seul** (compta, perso, ops) | projet → lot → task | **§0.2** d’`AGENTS.md` : sous-lot seulement si ≥ 2 flux livrables indépendants |

§0.2 ne disparaît pas : il devient la règle du **mode autonome de Raster**, là où il n’y a pas de Change pour porter le découpage.

`EVOL` / `INIT` (côté Pact) : task obligatoire `type: spec` (contrat initial **et** consolidation SPEC+UX après exec). Sans elle, le sous-lot ne passe pas `done`. Task **`type: qa`** : créée ou mise à jour par l’agent QA après consolidation. QA pose `done-agent` sur feature/bug.  
`CORRECTION` : `bug` ; qa créée/MAJ à l’étape QA. `TECHNICAL` / `physical` seul : pas de `qa` obligatoire.

---

## Mécanisme

```text
sektor
└── rh                                    # LOT — jamais done
    ├── CH-00-INIT-referentiel-temps      # sous-lot
    │   ├── SEKTOR-20  fiche employé
    │   ├── SEKTOR-21  congés
    │   ├── SEKTOR-22  planning
    │   └── SEKTOR-23  pointage
    ├── CH-01-EVOL-justificatif-maladie
    │   ├── SEKTOR-24-update-spec-ux      # obligatoire si EVOL
    │   └── SEKTOR-25-code
    └── CH-02-CORRECTION-pointage-double
        └── SEKTOR-26
```

`CH-00` → `done` seulement si 20–23 sont `done`. `rh` reste le chapeau.

### Ce que Raster indexe

| | Backlog / Sprint ? |
|--|-------------------|
| **Task** | oui |
| **Lot / sous-lot** | chapeaux d’arbre, pas sprintables |
| SPEC, PLAN, canvas | **non** — Pact |

Arbre Backlog = projet → lot → (sous-lot) → tasks.

Raster **synchronise** : scan `**/raster-src/lots/**/tasks/*.md` → INDEX / Sprint / Backlog. Il ne possède pas les tasks.

| Source | Comment |
|--------|---------|
| Inbox | `raster/inbox.md` → promote vers un lot du projet |
| Agent | écrit lot / sous-lot / task **sur le projet** |
| Fichier créé | visible au **sync** |

- Sprint = `sprint:` sur une **task** seulement.  
- `type:` **spec** · **feature** / **bug** (runnable) · **physical** · **qa**. DOR/DOD dans `pact/work/SPEC.md`.  
- `agent_type:` **spec** \| **exec** \| **qa** \| **orch** — mapping work : spec→spec · feature\|bug\|physical→exec · qa→qa. **orch** n’est pas un `type:` de task (chef d’orchestre d’**un** sous-lot Pact / CH, pas le sprint entier). Walker dérive si absent ; refuse un couple incohérent.  
- `assignee:` `me` \| `agent` \| `either` (humain vs machine) — orthogonal à `agent_type`.  
- Feature/bug : exec pose **`review`** (fini, pas done). Spec patche SPEC+UX. **QA** pose `done-agent` sur feature/bug.  
- Pack Pact : [`PACT_BLUEPRINT.md`](PACT_BLUEPRINT.md) § Agents du Change.  
- Status au Check progress (à deux).  
- Pas d’`estimate`.  
- IDs par projet (`SEKTOR`, `RAS`, `PLT`, `OPS`, …).  
- `done-me` → le fichier **sort du dépôt** (`t.mjs sweep`). Git porte l'histoire, pas d'archive. `<projet>/raster-src/NEXT` garde la borne haute des IDs.

Walker : tout `<projet>/raster-src/lots/` (peers, y compris `raster/raster-src/`).
