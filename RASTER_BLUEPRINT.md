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

- **Écriture = CLI.** Une task ne s'écrit pas à la main : `t.mjs` alloue l'ID, pose les enums, crée le dossier, regen. Le fichier reste le SSOT — mais il est *produit*, pas *tapé*. Sans ça, pas d'orchestration parallèle. `AGENTS.md` §0.1-9.

Walker : tout `<projet>/raster-src/lots/` (peers, y compris `raster/raster-src/`).

---

## Orchestration (2026-08-16)

Objectif : tu planifies **un lot ou deux**, l'orchestrateur déroule sans prompt.

| Niveau | Rôle | Concurrence |
|--------|------|-------------|
| **Lot** | isolation — un seul orchestrateur y écrit | parallèle entre lots |
| **Sous-lot** | grain de fan-out — un exec | parallèle dans le lot |
| **Task** | unité de travail | **série** dans le sous-lot |

La collision qui casse le parallèle n'est pas logique (`blocked_by:` la couvre) mais **physique** : deux agents sur le même fichier. Le lot est la plus grosse frontière tenable sans déclarer un périmètre de fichiers par task ; le CH est déjà une frontière de périmètre côté Pact, donc fan-outer dessus n'invente rien.

**Livraison Git : une branche par sous-lot, dans son propre `git worktree`, hors du dépôt.** Une branche n'isole pas — deux agents dans le même répertoire s'écrasent quel que soit le checkout. Le code part sur la branche ; les tasks restent sur l'arbre d'intégration via le CLI, sinon « ce qui tourne » n'existe plus. Merge sous-lot → lot → intégration ; **aucun agent ne pousse**.

**`<projet>/ROADMAP.md`** — l'ordre des lots, **écrit à la main**, hors `raster-src/`, non indexé. La roadmap est un **acte**, pas un calcul : elle porte des lots qui n'ont encore ni task ni dossier. Un marqueur `<!-- borne -->` sépare ce que l'orchestrateur peut ouvrir seul de ce qu'il ne peut pas. **Déplacer la borne = planifier.**

Détail : [`raster/AGENTS.md`](raster/AGENTS.md) §7.

---

## Le graphe (2026-08-18)

**Le nœud est le sous-lot (CH).** Une seule notion d'ordre dans Raster : un graphe de sous-lots, dont les **arêtes sont les `blocked_by:` qui sortent du sous-lot**. À l'intérieur, `blocked_by:` n'est plus qu'une chaîne de série — les tasks d'un sous-lot ne sont jamais parallèles, donc leur ordre n'est pas une arête.

**Pourquoi le sous-lot et pas la task :** c'est déjà le grain que `ready.mjs` calcule et celui que l'orchestrateur lance. Poser le nœud ailleurs ferait diverger le grain du graphe et le grain du fan-out, et il faudrait redire ce qu'un agent reçoit.

**Le front est dérivé** — les sous-lots ouverts dont toutes les arêtes entrantes sont closes. Rien n'est stocké : pas de champ, pas de vue à commiter. C'est `ready` ; il ne restait qu'à le nommer et à l'afficher.

**`sprint:` meurt.** Une semaine ISO est un ordre par calendrier que personne ne lit — ni la readiness, ni la fenêtre, ni le skill, ni les agents. Le **front** remplace la vue Sprint. L'arbre `projet → lot → sous-lot` reste ce qu'il est, un **rangement** : une contenance ne dit rien sur l'ordre, et l'afficher comme une file était le malentendu.

**La borne n'est pas une arête.** Le graphe dit **ce qui peut**, la borne dit **ce qui est permis** — deux axes, pas deux ordres. La numérotation de `ROADMAP.md` n'est lue par personne : seule l'appartenance à la fenêtre l'est.

**L'amorçage.** Un lot de la fenêtre **sans sous-lot ouvert** n'est pas un lot fini : il est **non découpé**. `window` distingue les trois cas — clos · non découpé · bloqué. Sur un lot non découpé, l'orchestrateur lance un agent **`spec` d'amorçage** dont le périmètre est *couper ce lot* : il lit `ROADMAP.md` et le Pact **en prose**, puis crée sous-lots et tasks par le CLI. C'est le **seul endroit où un agent crée des nœuds**, d'où le `gate: me` sur cette task — tu vois la coupe avant qu'elle ne se déroule. Rendre la roadmap lisible par machine aurait transformé un acte en calcul ; un agent la lit comme tu l'as écrite.

**La session.** Une session de travail = **un seul** agent d'orchestration. Il prend le **front** de la fenêtre — les sous-lots lançables, **tous lots confondus** — et lance un sous-agent par sous-lot, chacun dans son worktree. **Le lot cesse d'être une unité d'isolation** : il ne lui reste qu'un rôle de rangement et le grain de la borne. L'isolation physique était déjà au grain du sous-lot (un worktree par sous-lot) ; le lot ne protégeait plus rien, il sérialisait ce que les worktrees rendaient parallèle — et c'est lui qui imposait un lancement, donc une fenêtre de chat, par lot. L'exclusion suit désormais la ressource réelle : **un sous-lot, un agent**.

**Les deux volets — Plan et Session.** L'app a deux volets, et **Session remplace Sprint**.

| | Contient | Grain |
|---|---|---|
| **Plan** | ce qui est prévu, dans l'ordre — `ROADMAP.md` et sa borne | **lot** |
| **Session** | ce qui part maintenant | **sous-lot** |

**Le grain du volet Session est le sous-lot**, parce que c'est ce qui se lance : un agent, un worktree. Un volet qui afficherait des lots afficherait quelque chose que rien n'exécute — c'était le défaut du Backlog, un arbre de rangement présenté comme une file.

**La Session se remplit seule** : elle **est** le front. Tu déplaces la borne, Raster calcule les sous-lots lançables, la Session suit. Aucune sélection stockée — c'est précisément ce qui a tué `sprint:`, une étiquette posée à la main que plus rien ne relisait ensuite. Ton seul geste de planification reste la borne.




